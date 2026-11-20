/**
 * AI shift briefing.
 *
 * Summarizes the shift that just ended so the person walking in knows what
 * they are inheriting. With no LLM key configured (or when the provider fails)
 * it produces a deterministic summary from the same data, which is honest
 * about being a count-based rollup rather than pretending to be generated
 * prose.
 */
import { LlmUnavailableError, isLlmConfigured, requestJson } from "@/lib/ai/provider";
import { SHIFT_LABELS, type Shift } from "@/lib/shift";

export interface BriefingData {
  locationName: string;
  shift: Shift;
  windowStart: Date;
  windowEnd: Date;
  logEntries: readonly {
    category: string;
    severity: string;
    body: string;
    authorName: string | null;
    occurredAt: Date;
  }[];
  openTickets: readonly {
    title: string;
    priority: string;
    status: string;
    area: string | null;
  }[];
  lowStockItems: readonly {
    name: string;
    quantity: number;
    unit: string;
    lowStockThreshold: number;
  }[];
  pendingFollowUps: readonly { subject: string; urgency: string }[];
  occupancy: {
    bedsOccupied: number;
    bedsOffline: number;
    bedCapacity: number;
    recordedAt: Date | null;
  } | null;
}

export interface Briefing {
  headline: string;
  bullets: string[];
  source: "llm" | "rollup";
  model?: string;
  /** Present when the LLM was configured but could not be used. */
  fallbackReason?: string;
}

const SYSTEM_PROMPT = `You write shift briefings for staff at a homeless-services shelter.

You are given structured data about the shift that just ended. Write a briefing for the staff member starting their shift.

Rules:
- Lead with anything unsafe or time-sensitive.
- Be specific and factual; use only the data provided and never invent details.
- Never include a resident's full name, even if one appears in the data: refer to a room, bed, or initials.
- Keep it short: a one-line headline plus 3 to 6 bullets.
- Plain language, no marketing tone, no emoji.

Respond with JSON only: {"headline": string, "bullets": string[]}.`;

function formatTime(date: Date): string {
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function severityRank(severity: string): number {
  if (severity === "urgent") return 0;
  if (severity === "attention") return 1;
  return 2;
}

function priorityRank(priority: string): number {
  return ["urgent", "high", "medium", "low"].indexOf(priority);
}

export function buildRollupBriefing(data: BriefingData): Briefing {
  const flagged = data.logEntries
    .filter((entry) => entry.severity !== "info")
    .sort((a, b) => severityRank(a.severity) - severityRank(b.severity));

  const urgentTickets = data.openTickets
    .filter((ticket) => ticket.priority === "urgent" || ticket.priority === "high")
    .sort((a, b) => priorityRank(a.priority) - priorityRank(b.priority));

  const headlineParts = [
    `${SHIFT_LABELS[data.shift]} shift at ${data.locationName}`,
    `${data.logEntries.length} log ${data.logEntries.length === 1 ? "note" : "notes"}`,
  ];

  if (flagged.length > 0) {
    headlineParts.push(`${flagged.length} flagged`);
  }
  if (data.openTickets.length > 0) {
    headlineParts.push(`${data.openTickets.length} open maintenance`);
  }

  const bullets: string[] = [];

  if (data.occupancy) {
    const { bedsOccupied, bedsOffline, bedCapacity, recordedAt } = data.occupancy;
    const available = Math.max(0, bedCapacity - bedsOccupied - bedsOffline);
    bullets.push(
      `Beds: ${bedsOccupied} of ${bedCapacity} occupied, ${available} available${
        bedsOffline > 0 ? `, ${bedsOffline} offline` : ""
      }${recordedAt ? ` (counted ${formatTime(recordedAt)})` : ""}.`,
    );
  }

  for (const entry of flagged.slice(0, 3)) {
    const body =
      entry.body.length > 160 ? `${entry.body.slice(0, 157)}…` : entry.body;
    bullets.push(
      `${entry.severity === "urgent" ? "Urgent" : "Needs attention"} (${entry.category.replace("_", " ")}): ${body}${
        entry.authorName ? ` — ${entry.authorName}` : ""
      }`,
    );
  }

  if (urgentTickets.length > 0) {
    const list = urgentTickets
      .slice(0, 3)
      .map((ticket) =>
        ticket.area ? `${ticket.title} (${ticket.area})` : ticket.title,
      )
      .join("; ");
    bullets.push(`Maintenance needing a push: ${list}.`);
  }

  if (data.lowStockItems.length > 0) {
    const list = data.lowStockItems
      .slice(0, 4)
      .map((item) => `${item.name} (${item.quantity} ${item.unit})`)
      .join(", ");
    bullets.push(`Low stock: ${list}.`);
  }

  if (data.pendingFollowUps.length > 0) {
    bullets.push(
      `${data.pendingFollowUps.length} case manager follow-up${
        data.pendingFollowUps.length === 1 ? "" : "s"
      } still pending, including "${data.pendingFollowUps[0]?.subject}".`,
    );
  }

  if (bullets.length === 0) {
    bullets.push("Nothing was flagged on the last shift. Start with a bed count.");
  }

  return {
    headline: headlineParts.join(" · "),
    bullets,
    source: "rollup",
  };
}

function buildUserPrompt(data: BriefingData): string {
  const lines: string[] = [
    `Site: ${data.locationName}`,
    `Shift being summarized: ${SHIFT_LABELS[data.shift]} (${formatTime(data.windowStart)} to ${formatTime(data.windowEnd)})`,
    "",
  ];

  if (data.occupancy) {
    lines.push(
      `Beds: ${data.occupancy.bedsOccupied} occupied of ${data.occupancy.bedCapacity}, ${data.occupancy.bedsOffline} offline.`,
    );
  } else {
    lines.push("Beds: no count recorded on this shift.");
  }

  lines.push("", "Shift log notes:");
  if (data.logEntries.length === 0) {
    lines.push("- (none)");
  } else {
    for (const entry of data.logEntries) {
      lines.push(
        `- [${entry.severity}/${entry.category}] ${entry.body}${
          entry.authorName ? ` (${entry.authorName})` : ""
        }`,
      );
    }
  }

  lines.push("", "Open maintenance tickets:");
  if (data.openTickets.length === 0) {
    lines.push("- (none)");
  } else {
    for (const ticket of data.openTickets) {
      lines.push(
        `- [${ticket.priority}/${ticket.status}] ${ticket.title}${
          ticket.area ? ` — ${ticket.area}` : ""
        }`,
      );
    }
  }

  lines.push("", "Items at or below their low-stock threshold:");
  if (data.lowStockItems.length === 0) {
    lines.push("- (none)");
  } else {
    for (const item of data.lowStockItems) {
      lines.push(
        `- ${item.name}: ${item.quantity} ${item.unit} on hand (threshold ${item.lowStockThreshold})`,
      );
    }
  }

  lines.push("", "Pending case manager follow-ups:");
  if (data.pendingFollowUps.length === 0) {
    lines.push("- (none)");
  } else {
    for (const followUp of data.pendingFollowUps) {
      lines.push(`- [${followUp.urgency}] ${followUp.subject}`);
    }
  }

  return lines.join("\n");
}

function parseBriefing(raw: unknown): { headline: string; bullets: string[] } | null {
  if (!raw || typeof raw !== "object") return null;
  const candidate = raw as { headline?: unknown; bullets?: unknown };

  const headline =
    typeof candidate.headline === "string" && candidate.headline.trim()
      ? candidate.headline.trim().slice(0, 200)
      : null;

  const bullets = Array.isArray(candidate.bullets)
    ? candidate.bullets
        .filter((item): item is string => typeof item === "string")
        .map((item) => item.trim().slice(0, 300))
        .filter(Boolean)
        .slice(0, 6)
    : [];

  if (!headline || bullets.length === 0) return null;
  return { headline, bullets };
}

export async function generateBriefing(data: BriefingData): Promise<Briefing> {
  if (!isLlmConfigured()) {
    return buildRollupBriefing(data);
  }

  try {
    const { data: raw, model } = await requestJson({
      system: SYSTEM_PROMPT,
      user: buildUserPrompt(data),
      temperature: 0.2,
    });

    const parsed = parseBriefing(raw);
    if (!parsed) {
      throw new LlmUnavailableError("Provider returned an unusable briefing");
    }

    return { ...parsed, source: "llm", model };
  } catch (error) {
    const reason = error instanceof Error ? error.message : "Unknown LLM error";
    console.warn(`[briefing] LLM unavailable, using rollup: ${reason}`);
    return { ...buildRollupBriefing(data), fallbackReason: reason };
  }
}
