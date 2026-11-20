/**
 * LLM path for the Action Button.
 *
 * The model is asked for proposals only. Whatever comes back is validated with
 * the same zod schemas the confirm endpoint uses, invalid proposals are
 * dropped, and an empty result is treated as a provider failure so the caller
 * falls back to the keyword classifier.
 */
import { LlmUnavailableError, requestJson } from "@/lib/ai/provider";

import { actionProposalSchema } from "./types";
import type {
  ActionClassification,
  ActionProposal,
  ClassifierContext,
} from "./types";

const SYSTEM_PROMPT = `You are the routing engine inside ActionOS, software used by staff at homeless-services shelters.

A staff member describes something they observed during a shift. Turn it into structured proposals that a human will review before anything is saved.

Allowed proposal kinds:
1. maintenance_ticket  { "kind": "maintenance_ticket", "title", "description"?, "area"?, "priority": "low"|"medium"|"high"|"urgent", "rationale"? }
2. inventory_adjustment { "kind": "inventory_adjustment", "itemName", "adjustmentType": "delta"|"set", "amount": integer, "reason", "rationale"? }
3. shift_log_note { "kind": "shift_log_note", "body", "category": "general"|"incident"|"maintenance"|"inventory"|"resident_support"|"handoff", "severity": "info"|"attention"|"urgent", "rationale"? }
4. case_manager_follow_up { "kind": "case_manager_follow_up", "subject", "details"?, "urgency": "routine"|"soon"|"urgent", "rationale"? }

Rules:
- Always include exactly one shift_log_note so the observation is on the record for handoff.
- Add a maintenance_ticket only when something is damaged, unsafe, or needs repair.
- Add an inventory_adjustment only when the text implies a specific number, and use an itemName from the known item list when one matches. Use "set" for phrasing like "down to 2", and "delta" with a negative amount for "used 6".
- Add a case_manager_follow_up when a resident needs case management attention.
- Never invent facts, and never put a resident's full name in any field: use a room, bed, or initials.
- Treat no heat, no hot water, gas smells, flooding, and broken locks as urgent.
- Keep "rationale" to one short sentence explaining why you routed it that way.

Respond with JSON only: {"summary": string, "proposals": [...]}. Keep "summary" to one sentence addressed to the staff member.`;

function buildUserPrompt(input: string, context: ClassifierContext): string {
  const items = context.knownItems.length
    ? context.knownItems
        .map((item) => `- ${item.name} (${item.quantity} ${item.unit} on hand)`)
        .join("\n")
    : "- (no inventory items recorded at this site yet)";

  return [
    `Site: ${context.locationName}`,
    `Current shift: ${context.shift}`,
    "Known inventory items at this site:",
    items,
    "",
    "Staff observation:",
    input,
  ].join("\n");
}

/**
 * Keep whatever the model got right and discard the rest, so one malformed
 * proposal does not throw away a good one.
 */
export function parseProposals(raw: unknown): ActionProposal[] {
  if (!Array.isArray(raw)) return [];

  const valid: ActionProposal[] = [];
  for (const candidate of raw.slice(0, 8)) {
    const parsed = actionProposalSchema.safeParse(candidate);
    if (parsed.success) valid.push(parsed.data);
  }
  return valid;
}

export async function classifyWithLlm(
  input: string,
  context: ClassifierContext,
): Promise<ActionClassification> {
  const { data, model } = await requestJson({
    system: SYSTEM_PROMPT,
    user: buildUserPrompt(input, context),
  });

  const payload = (data ?? {}) as { summary?: unknown; proposals?: unknown };
  const proposals = parseProposals(payload.proposals);

  if (proposals.length === 0) {
    throw new LlmUnavailableError("Provider returned no usable proposals");
  }

  const summary =
    typeof payload.summary === "string" && payload.summary.trim().length > 0
      ? payload.summary.trim().slice(0, 400)
      : "Review the suggested actions before anything is saved.";

  return { summary, classifier: "llm", model, proposals };
}
