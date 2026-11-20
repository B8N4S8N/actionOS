import { z } from "zod";

import type { Permission } from "@/lib/permissions";

/**
 * The Action Button vocabulary.
 *
 * Staff describe what they saw; a classifier (LLM or the keyword fallback)
 * turns that into one or more *proposals*. A proposal is never written to the
 * database until a human confirms it, and every proposal is re-validated with
 * these schemas on the server at confirm time — the client is not trusted to
 * send back what it was given.
 */

export const TICKET_PRIORITIES = ["low", "medium", "high", "urgent"] as const;
export const LOG_CATEGORIES = [
  "general",
  "incident",
  "maintenance",
  "inventory",
  "resident_support",
  "handoff",
] as const;
export const LOG_SEVERITIES = ["info", "attention", "urgent"] as const;
export const FOLLOW_UP_URGENCIES = ["routine", "soon", "urgent"] as const;

export const maintenanceTicketProposalSchema = z.object({
  kind: z.literal("maintenance_ticket"),
  title: z.string().trim().min(3).max(140),
  description: z.string().trim().max(2000).optional(),
  /** Free text location inside the building, e.g. "Dorm B". */
  area: z.string().trim().max(80).optional(),
  priority: z.enum(TICKET_PRIORITIES),
  rationale: z.string().trim().max(300).optional(),
});

export const inventoryAdjustmentProposalSchema = z
  .object({
    kind: z.literal("inventory_adjustment"),
    itemName: z.string().trim().min(2).max(120),
    /**
     * "delta" for "we used six cases" (amount may be negative),
     * "set" for "we're down to two cases" (amount is the new count).
     */
    adjustmentType: z.enum(["delta", "set"]),
    amount: z.number().int().min(-100_000).max(100_000),
    reason: z.string().trim().min(3).max(200),
    rationale: z.string().trim().max(300).optional(),
  })
  .refine(
    (value) => value.adjustmentType !== "set" || value.amount >= 0,
    "A new count cannot be negative.",
  )
  .refine(
    (value) => value.adjustmentType !== "delta" || value.amount !== 0,
    "A change of zero would not record anything.",
  );

export const shiftLogNoteProposalSchema = z.object({
  kind: z.literal("shift_log_note"),
  body: z.string().trim().min(3).max(2000),
  category: z.enum(LOG_CATEGORIES),
  severity: z.enum(LOG_SEVERITIES),
  rationale: z.string().trim().max(300).optional(),
});

export const caseManagerFollowUpProposalSchema = z.object({
  kind: z.literal("case_manager_follow_up"),
  /** Room, bed or initials — never a resident's full name in v1. */
  subject: z.string().trim().min(3).max(140),
  details: z.string().trim().max(2000).optional(),
  urgency: z.enum(FOLLOW_UP_URGENCIES),
  rationale: z.string().trim().max(300).optional(),
});

export const actionProposalSchema = z.discriminatedUnion("kind", [
  maintenanceTicketProposalSchema,
  inventoryAdjustmentProposalSchema,
  shiftLogNoteProposalSchema,
  caseManagerFollowUpProposalSchema,
]);

export type MaintenanceTicketProposal = z.infer<
  typeof maintenanceTicketProposalSchema
>;
export type InventoryAdjustmentProposal = z.infer<
  typeof inventoryAdjustmentProposalSchema
>;
export type ShiftLogNoteProposal = z.infer<typeof shiftLogNoteProposalSchema>;
export type CaseManagerFollowUpProposal = z.infer<
  typeof caseManagerFollowUpProposalSchema
>;
export type ActionProposal = z.infer<typeof actionProposalSchema>;
export type ActionProposalKind = ActionProposal["kind"];

export const PROPOSAL_KINDS = [
  "maintenance_ticket",
  "inventory_adjustment",
  "shift_log_note",
  "case_manager_follow_up",
] as const satisfies readonly ActionProposalKind[];

/** Permission a staff member needs before a proposal of this kind may be saved. */
export const PROPOSAL_PERMISSION: Record<ActionProposalKind, Permission> = {
  maintenance_ticket: "maintenance:create",
  inventory_adjustment: "inventory:adjust",
  shift_log_note: "shift_log:create",
  case_manager_follow_up: "follow_up:create",
};

export const PROPOSAL_LABELS: Record<ActionProposalKind, string> = {
  maintenance_ticket: "Maintenance ticket",
  inventory_adjustment: "Inventory update",
  shift_log_note: "Shift log note",
  case_manager_follow_up: "Case manager follow-up",
};

export interface ActionClassification {
  /** One sentence a human can read before approving anything. */
  summary: string;
  classifier: "llm" | "keyword";
  /** Model identifier when the LLM path produced the proposals. */
  model?: string;
  proposals: ActionProposal[];
  /** Set when the LLM was tried and failed, so the UI can say so honestly. */
  fallbackReason?: string;
}

export interface ClassifierContext {
  locationName: string;
  /** Inventory item names at this site, used to match free text to real items. */
  knownItems: readonly { name: string; unit: string; quantity: number }[];
  shift: "day" | "swing" | "overnight";
}

export const classifyRequestSchema = z.object({
  text: z.string().trim().min(5, "Describe what you saw in a few words.").max(2000),
  locationId: z.string().uuid(),
});

export const confirmRequestSchema = z.object({
  submissionId: z.string().uuid(),
  /** Proposals the human actually approved, after any edits in the UI. */
  proposals: z.array(actionProposalSchema).max(10),
});

export interface InventoryItemOption {
  name: string;
  unit: string;
  quantity: number;
}

/** One proposal plus whether the signed-in role is allowed to save it. */
export interface ProposalDecision {
  proposal: ActionProposal;
  allowed: boolean;
  requiredPermission: Permission;
}

/** Response shape of POST /api/action/classify. */
export interface ClassifyResponse {
  submissionId: string;
  summary: string;
  classifier: "llm" | "keyword";
  model: string | null;
  fallbackReason: string | null;
  proposals: ProposalDecision[];
  inventoryItems: InventoryItemOption[];
}

/** Response shape of POST /api/action/confirm. */
export interface ConfirmResponse {
  applied: {
    kind: ActionProposalKind;
    id: string;
    label: string;
    detail: string;
  }[];
}

export function proposalHeadline(proposal: ActionProposal): string {
  switch (proposal.kind) {
    case "maintenance_ticket":
      return proposal.area ? `${proposal.title} (${proposal.area})` : proposal.title;
    case "inventory_adjustment":
      return proposal.adjustmentType === "set"
        ? `${proposal.itemName} → ${proposal.amount}`
        : `${proposal.itemName} ${proposal.amount > 0 ? "+" : ""}${proposal.amount}`;
    case "shift_log_note":
      return proposal.body.length > 90
        ? `${proposal.body.slice(0, 87)}…`
        : proposal.body;
    case "case_manager_follow_up":
      return proposal.subject;
  }
}
