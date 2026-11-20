/**
 * Deterministic fallback for the Action Button.
 *
 * ActionOS must stay useful when no LLM key is configured, when the provider is
 * down, or when a response fails validation. This module turns a plain-language
 * observation into the same proposal shapes the LLM path produces, using
 * keyword rules drawn from how shelter staff actually write shift notes
 * ("heater broken in Dorm B", "down to 2 cases of body wash").
 *
 * It is intentionally generous: a proposal is a suggestion that a human reviews
 * and can edit or drop, so a near miss costs a click. It never writes anything.
 */
import type {
  ActionClassification,
  ActionProposal,
  ClassifierContext,
  InventoryAdjustmentProposal,
  MaintenanceTicketProposal,
  CaseManagerFollowUpProposal,
  ShiftLogNoteProposal,
} from "./types";
import { PROPOSAL_LABELS } from "./types";

const PROBLEM_SIGNALS = [
  "broken",
  "broke",
  "busted",
  "not working",
  "isn't working",
  "isnt working",
  "doesn't work",
  "doesnt work",
  "does not work",
  "stopped working",
  "won't",
  "wont ",
  "will not",
  "leak",
  "leaking",
  "dripping",
  "clogged",
  "backed up",
  "overflowing",
  "flickering",
  "out of order",
  "jammed",
  "stuck",
  "cracked",
  "shattered",
  "beeping",
  "rattling",
  "grinding",
  "squealing",
  "squeaking",
  "banging",
  "clanking",
  "sparking",
  "smoking",
  "noise",
  "not heating",
  "needs repair",
  "needs fixing",
  "needs to be fixed",
  "burned out",
  "burnt out",
  "no hot water",
  "no heat",
  "no power",
  "no water",
  "won't lock",
  "can't lock",
  "cannot lock",
  "loose",
  "dead battery",
];

const PEST_SIGNALS = [
  "mold",
  "mildew",
  "roach",
  "cockroach",
  "bed bug",
  "bedbug",
  "mice",
  "mouse",
  "rodent",
  "rat ",
  "rats",
  "ants",
  "pest",
];

const HAZARD_SIGNALS = [
  "gas",
  "smoke",
  "fire",
  "flood",
  "flooding",
  "sewage",
  "exposed wire",
  "electrical",
  "carbon monoxide",
  "unsafe",
  "no heat",
  "no hot water",
  "no water",
  "won't lock",
  "can't lock",
  "cannot lock",
];

const URGENT_WORDS = [
  "urgent",
  "emergency",
  "immediately",
  "right now",
  "asap",
  "dangerous",
  "unsafe",
];

const HIGH_PRIORITY_SIGNALS = [
  "heater",
  "furnace",
  "boiler",
  "water heater",
  "fridge",
  "refrigerator",
  "freezer",
  "smoke detector",
  "elevator",
  "lock",
  "leak",
  "flood",
  "overflowing",
  "bed bug",
  "bedbug",
  "mold",
];

const LOW_PRIORITY_SIGNALS = [
  "minor",
  "cosmetic",
  "not urgent",
  "no rush",
  "whenever",
  "eventually",
  "when there's time",
];

const INCIDENT_SIGNALS = [
  "incident",
  "fight",
  "altercation",
  "police",
  "ambulance",
  "911",
  "narcan",
  "overdose",
  "injury",
  "injured",
  "assault",
  "threat",
  "threatened",
  "trespass",
  "weapon",
  "self-harm",
  "crisis",
];

const HANDOFF_SIGNALS = [
  "handoff",
  "hand off",
  "next shift",
  "heads up for",
  "for the oncoming",
  "oncoming shift",
  "pass along",
];

const FOLLOW_UP_SIGNALS = [
  "case manager",
  "caseworker",
  "case worker",
  "needs to talk",
  "wants to talk",
  "asked to speak",
  "wants to speak",
  "needs help with",
  "id replacement",
  "replacement id",
  "state id",
  "birth certificate",
  "social security",
  "benefits",
  "snap",
  "ebt",
  "housing voucher",
  "voucher",
  "housing application",
  "detox",
  "treatment",
  "rehab",
  "appointment",
  "follow up",
  "follow-up",
  "check in on",
  "wellness check",
  "referral",
  "intake",
  "paperwork",
  "medication refill",
  "job application",
  "dmv",
];

const FOLLOW_UP_SOON_WORDS = [
  "today",
  "tonight",
  "tomorrow",
  "asap",
  "as soon as",
  "this week",
  "soon",
  "before exit",
  "before checkout",
];

const CONSUMPTION_VERBS = [
  "used",
  "went through",
  "gave out",
  "handed out",
  "distributed",
  "took",
  "pulled",
  "burned through",
  "burnt through",
];

const RESTOCK_VERBS = [
  "restocked",
  "received",
  "delivered",
  "donated",
  "dropped off",
  "added",
  "picked up",
  "got in",
];

const AREA_WORDS = [
  "kitchen",
  "laundry",
  "bathroom",
  "restroom",
  "shower room",
  "showers",
  "hallway",
  "lobby",
  "dayroom",
  "day room",
  "dining room",
  "pantry",
  "storage",
  "parking lot",
  "courtyard",
  "garage",
  "basement",
  "front desk",
  "intake office",
  "office",
];

const AREA_WITH_LABEL = /\b(dorm|dormitory|room|rm|unit|building|bldg|wing|bay|bunk|bed)\s*#?\s*([a-z0-9]{1,4})\b/i;

function includesAny(haystack: string, needles: readonly string[]): boolean {
  return needles.some((needle) => haystack.includes(needle));
}

/** "not urgent" and "no rush" must not read as urgent. */
function isUrgent(lower: string): boolean {
  const withoutNegations = lower.replace(
    /\bno(?:t)?\s+(?:urgent|rush|emergency|hurry)\b/g,
    " ",
  );
  return includesAny(withoutNegations, URGENT_WORDS);
}

function matched(haystack: string, needles: readonly string[]): string[] {
  return needles.filter((needle) => haystack.includes(needle));
}

function truncate(value: string, max: number): string {
  const trimmed = value.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).trimEnd()}…`;
}

function sentenceCase(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?;])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** The sentence that triggered a match reads better as a ticket title than the whole note. */
function sentenceContaining(text: string, needles: readonly string[]): string {
  const sentences = splitSentences(text);
  const hit = sentences.find((sentence) =>
    includesAny(sentence.toLowerCase(), needles),
  );
  return hit ?? sentences[0] ?? text;
}

export function extractArea(text: string): string | undefined {
  const labelled = AREA_WITH_LABEL.exec(text);
  if (labelled?.[1] && labelled[2]) {
    return `${titleCase(labelled[1] === "rm" ? "room" : labelled[1])} ${labelled[2].toUpperCase()}`;
  }

  const lower = text.toLowerCase();
  const plain = AREA_WORDS.find((area) => lower.includes(area));
  return plain ? titleCase(plain) : undefined;
}

function detectMaintenance(
  text: string,
  lower: string,
): MaintenanceTicketProposal | null {
  const problems = matched(lower, PROBLEM_SIGNALS);
  const pests = matched(lower, PEST_SIGNALS);
  if (problems.length === 0 && pests.length === 0) return null;

  const signals = [...problems, ...pests];
  const priority = (() => {
    if (includesAny(lower, HAZARD_SIGNALS) || isUrgent(lower)) {
      return "urgent" as const;
    }
    // "not urgent" and "minor" are checked before the high-priority equipment
    // list so that staff downgrading something is respected.
    if (includesAny(lower, LOW_PRIORITY_SIGNALS)) return "low" as const;
    if (includesAny(lower, HIGH_PRIORITY_SIGNALS)) return "high" as const;
    return "medium" as const;
  })();

  const sentence = sentenceContaining(text, signals);
  const title = truncate(sentenceCase(sentence.replace(/[.;]+$/, "")), 140);
  const area = extractArea(sentence) ?? extractArea(text);

  return {
    kind: "maintenance_ticket",
    title,
    description: sentence.trim() === text.trim() ? undefined : text.trim(),
    area,
    priority,
    rationale: `Matched "${signals[0]}", which usually means something needs repair.`,
  };
}

interface ItemMatch {
  name: string;
  unit: string;
}

function matchKnownItem(
  lower: string,
  knownItems: ClassifierContext["knownItems"],
): ItemMatch | null {
  const candidates = [...knownItems]
    .map((item) => ({ item, key: item.name.toLowerCase() }))
    .sort((a, b) => b.key.length - a.key.length);

  for (const { item, key } of candidates) {
    // Staff write "3 bus pass", "a towel", "diapers" — try the plural the
    // manager typed plus the two common singular forms.
    const forms = [key, key.replace(/es$/, ""), key.replace(/s$/, "")];
    if (forms.some((form) => form.length > 3 && lower.includes(form))) {
      return { name: item.name, unit: item.unit };
    }
  }
  return null;
}

const STOP_TAIL =
  /\s+(?:in|at|for|from|on|to|and|because|since|so|today|tonight|this|that|left|remaining|total)\b.*$/;

function guessItemName(lower: string): string | null {
  const ofMatch = /\b(?:of|on)\s+([a-z][a-z0-9'\s-]{1,40})/.exec(lower);
  const raw = ofMatch?.[1];
  if (!raw) return null;

  const cleaned = raw
    .replace(STOP_TAIL, "")
    .replace(/[^a-z0-9'\s-]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .join(" ");

  return cleaned.length >= 2 ? cleaned : null;
}

function firstNumber(source: string): number | null {
  const match = /(\d{1,5})/.exec(source);
  if (!match?.[1]) return null;
  const parsed = Number.parseInt(match[1], 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function detectInventory(
  text: string,
  lower: string,
  context: ClassifierContext,
): InventoryAdjustmentProposal | null {
  const known = matchKnownItem(lower, context.knownItems);
  const itemName = known?.name ?? guessItemName(lower);
  if (!itemName) return null;

  const ranOut = /\b(?:ran out of|out of|no more|none left|all gone)\b/.test(lower);
  const setMatch = /\b(?:down to|only|just|at)\s+(\d{1,5})\b/.exec(lower);
  const consumptionVerb = CONSUMPTION_VERBS.find((verb) => lower.includes(verb));
  const restockVerb = RESTOCK_VERBS.find((verb) => lower.includes(verb));

  if (setMatch?.[1]) {
    const amount = Number.parseInt(setMatch[1], 10);
    return {
      kind: "inventory_adjustment",
      itemName,
      adjustmentType: "set",
      amount,
      reason: "Count reported on shift",
      rationale: `"${setMatch[0]}" reads as a new count rather than a change.`,
    };
  }

  if (ranOut) {
    return {
      kind: "inventory_adjustment",
      itemName,
      adjustmentType: "set",
      amount: 0,
      reason: "Reported out of stock",
      rationale: "Staff reported the shelf is empty.",
    };
  }

  if (restockVerb) {
    const amount = firstNumber(lower);
    if (amount === null) return null;
    return {
      kind: "inventory_adjustment",
      itemName,
      adjustmentType: "delta",
      amount,
      reason: `Stock received (${restockVerb})`,
      rationale: `"${restockVerb}" reads as stock coming in.`,
    };
  }

  if (consumptionVerb) {
    const amount = firstNumber(lower);
    if (amount === null) return null;
    return {
      kind: "inventory_adjustment",
      itemName,
      adjustmentType: "delta",
      amount: -amount,
      reason: `Used on shift (${consumptionVerb})`,
      rationale: `"${consumptionVerb}" reads as stock going out.`,
    };
  }

  return null;
}

function detectFollowUp(
  text: string,
  lower: string,
): CaseManagerFollowUpProposal | null {
  const signals = matched(lower, FOLLOW_UP_SIGNALS);
  if (signals.length === 0) return null;

  const urgency = (() => {
    if (includesAny(lower, INCIDENT_SIGNALS) || includesAny(lower, URGENT_WORDS)) {
      return "urgent" as const;
    }
    if (includesAny(lower, FOLLOW_UP_SOON_WORDS)) return "soon" as const;
    return "routine" as const;
  })();

  const sentence = sentenceContaining(text, signals);
  const area = extractArea(sentence) ?? extractArea(text);
  const subject = area
    ? `${area} — case manager follow-up`
    : truncate(sentenceCase(sentence.replace(/[.;]+$/, "")), 140);

  return {
    kind: "case_manager_follow_up",
    subject,
    details: text.trim(),
    urgency,
    rationale: `Matched "${signals[0]}", which is case management work rather than facilities.`,
  };
}

function buildShiftLogNote(
  text: string,
  lower: string,
  parts: {
    maintenance: MaintenanceTicketProposal | null;
    inventory: InventoryAdjustmentProposal | null;
    followUp: CaseManagerFollowUpProposal | null;
  },
): ShiftLogNoteProposal {
  const category = (() => {
    if (includesAny(lower, INCIDENT_SIGNALS)) return "incident" as const;
    if (parts.followUp) return "resident_support" as const;
    if (parts.maintenance) return "maintenance" as const;
    if (parts.inventory) return "inventory" as const;
    if (includesAny(lower, HANDOFF_SIGNALS)) return "handoff" as const;
    return "general" as const;
  })();

  const severity = (() => {
    if (
      includesAny(lower, URGENT_WORDS) ||
      includesAny(lower, HAZARD_SIGNALS) ||
      parts.maintenance?.priority === "urgent" ||
      parts.followUp?.urgency === "urgent"
    ) {
      return "urgent" as const;
    }
    if (
      category === "incident" ||
      parts.maintenance?.priority === "high" ||
      parts.followUp?.urgency === "soon"
    ) {
      return "attention" as const;
    }
    return "info" as const;
  })();

  return {
    kind: "shift_log_note",
    body: truncate(sentenceCase(text), 2000),
    category,
    severity,
    rationale: "Everything staff report is written to the shift log for handoff.",
  };
}

function buildSummary(proposals: readonly ActionProposal[]): string {
  const labels = proposals.map((proposal) =>
    PROPOSAL_LABELS[proposal.kind].toLowerCase(),
  );

  if (labels.length === 1) {
    return `Suggested one action: a ${labels[0]}. Review it before anything is saved.`;
  }

  const last = labels[labels.length - 1];
  const head = labels.slice(0, -1).join(", ");
  return `Suggested ${labels.length} actions: a ${head} and a ${last}. Review them before anything is saved.`;
}

export function classifyWithKeywords(
  rawInput: string,
  context: ClassifierContext,
): ActionClassification {
  const text = rawInput.trim();
  const lower = text.toLowerCase();

  const maintenance = detectMaintenance(text, lower);
  const inventory = detectInventory(text, lower, context);
  const followUp = detectFollowUp(text, lower);
  const note = buildShiftLogNote(text, lower, {
    maintenance,
    inventory,
    followUp,
  });

  const proposals: ActionProposal[] = [];
  if (maintenance) proposals.push(maintenance);
  if (inventory) proposals.push(inventory);
  if (followUp) proposals.push(followUp);
  proposals.push(note);

  return {
    summary: buildSummary(proposals),
    classifier: "keyword",
    proposals,
  };
}
