import { and, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  actionSubmissions,
  followUpRequests,
  inventoryItems,
  inventoryTransactions,
  maintenanceTickets,
  shiftLogEntries,
} from "@/db/schema";
import { recordAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { assertCanActAtLocation, type Actor } from "@/lib/permissions";
import { currentShift } from "@/lib/shift";

import {
  PROPOSAL_LABELS,
  PROPOSAL_PERMISSION,
  proposalHeadline,
  type ActionProposal,
  type ActionProposalKind,
} from "./types";

export interface AppliedRecord {
  kind: ActionProposalKind;
  id: string;
  label: string;
  detail: string;
}

interface ApplyArgs {
  actor: Actor;
  organizationId: string;
  locationId: string;
  submissionId: string;
  proposals: readonly ActionProposal[];
  timezone: string;
}

/**
 * Write the proposals a human just confirmed.
 *
 * This is the only path from an Action Button submission into the operational
 * tables. It re-checks permission *and* site scope for every proposal — the
 * classification step is advisory, the confirm step is the gate — and writes
 * everything plus its audit records in one transaction so a partial save
 * cannot leave the log out of step with the data.
 */
export async function applyProposals({
  actor,
  organizationId,
  locationId,
  submissionId,
  proposals,
  timezone,
}: ApplyArgs): Promise<AppliedRecord[]> {
  for (const proposal of proposals) {
    assertCanActAtLocation(actor, PROPOSAL_PERMISSION[proposal.kind], locationId);
  }

  const shift = currentShift(timezone);

  return db.transaction(async (tx) => {
    const applied: AppliedRecord[] = [];

    for (const proposal of proposals) {
      switch (proposal.kind) {
        case "maintenance_ticket": {
          const [ticket] = await tx
            .insert(maintenanceTickets)
            .values({
              organizationId,
              locationId,
              title: proposal.title,
              description: proposal.description ?? null,
              area: proposal.area ?? null,
              priority: proposal.priority,
              createdByUserId: actor.userId,
              sourceSubmissionId: submissionId,
            })
            .returning({ id: maintenanceTickets.id });

          if (!ticket) throw new Error("Failed to create maintenance ticket.");

          await recordAudit(
            {
              actor,
              action: "maintenance_ticket.create",
              entityType: "maintenance_ticket",
              entityId: ticket.id,
              locationId,
              summary: `Opened ${proposal.priority} priority ticket "${proposal.title}" from the Action Button`,
              metadata: { source: "action_button", submissionId },
            },
            tx,
          );

          applied.push({
            kind: proposal.kind,
            id: ticket.id,
            label: PROPOSAL_LABELS[proposal.kind],
            detail: proposalHeadline(proposal),
          });
          break;
        }

        case "inventory_adjustment": {
          const [item] = await tx
            .select({
              id: inventoryItems.id,
              name: inventoryItems.name,
              unit: inventoryItems.unit,
              quantity: inventoryItems.quantity,
            })
            .from(inventoryItems)
            .where(
              and(
                eq(inventoryItems.locationId, locationId),
                sql`lower(${inventoryItems.name}) = lower(${proposal.itemName})`,
              ),
            )
            .limit(1);

          if (!item) {
            throw new ValidationError(
              `"${proposal.itemName}" is not an inventory item at this site. Pick an existing item, or ask a manager to add it first.`,
            );
          }

          const requested =
            proposal.adjustmentType === "set"
              ? proposal.amount
              : item.quantity + proposal.amount;
          // Stock cannot go negative; record what actually happened.
          const quantityAfter = Math.max(0, requested);
          const delta = quantityAfter - item.quantity;

          await tx
            .update(inventoryItems)
            .set({ quantity: quantityAfter, updatedAt: new Date() })
            .where(eq(inventoryItems.id, item.id));

          const [transaction] = await tx
            .insert(inventoryTransactions)
            .values({
              itemId: item.id,
              delta,
              quantityAfter,
              reason: proposal.reason,
              note:
                requested < 0
                  ? `Requested ${requested}; clamped to 0 because stock cannot be negative.`
                  : null,
              createdByUserId: actor.userId,
              sourceSubmissionId: submissionId,
            })
            .returning({ id: inventoryTransactions.id });

          if (!transaction) throw new Error("Failed to record inventory change.");

          await recordAudit(
            {
              actor,
              action: "inventory_item.adjust",
              entityType: "inventory_item",
              entityId: item.id,
              locationId,
              summary: `${item.name}: ${item.quantity} → ${quantityAfter} ${item.unit} (${proposal.reason})`,
              metadata: {
                source: "action_button",
                submissionId,
                delta,
                adjustmentType: proposal.adjustmentType,
              },
            },
            tx,
          );

          applied.push({
            kind: proposal.kind,
            id: item.id,
            label: PROPOSAL_LABELS[proposal.kind],
            detail: `${item.name}: ${item.quantity} → ${quantityAfter} ${item.unit}`,
          });
          break;
        }

        case "shift_log_note": {
          const [entry] = await tx
            .insert(shiftLogEntries)
            .values({
              organizationId,
              locationId,
              shift,
              category: proposal.category,
              severity: proposal.severity,
              body: proposal.body,
              createdByUserId: actor.userId,
              sourceSubmissionId: submissionId,
            })
            .returning({ id: shiftLogEntries.id });

          if (!entry) throw new Error("Failed to write shift log note.");

          await recordAudit(
            {
              actor,
              action: "shift_log_entry.create",
              entityType: "shift_log_entry",
              entityId: entry.id,
              locationId,
              summary: `Logged a ${proposal.category} note (${proposal.severity}) on the ${shift} shift`,
              metadata: { source: "action_button", submissionId },
            },
            tx,
          );

          applied.push({
            kind: proposal.kind,
            id: entry.id,
            label: PROPOSAL_LABELS[proposal.kind],
            detail: proposalHeadline(proposal),
          });
          break;
        }

        case "case_manager_follow_up": {
          const [request] = await tx
            .insert(followUpRequests)
            .values({
              organizationId,
              locationId,
              subject: proposal.subject,
              details: proposal.details ?? null,
              urgency: proposal.urgency,
              requestedByUserId: actor.userId,
              sourceSubmissionId: submissionId,
            })
            .returning({ id: followUpRequests.id });

          if (!request) throw new Error("Failed to create follow-up request.");

          await recordAudit(
            {
              actor,
              action: "follow_up_request.create",
              entityType: "follow_up_request",
              entityId: request.id,
              locationId,
              summary: `Requested case manager follow-up (${proposal.urgency}): ${proposal.subject}`,
              metadata: { source: "action_button", submissionId },
            },
            tx,
          );

          applied.push({
            kind: proposal.kind,
            id: request.id,
            label: PROPOSAL_LABELS[proposal.kind],
            detail: proposalHeadline(proposal),
          });
          break;
        }
      }
    }

    await tx
      .update(actionSubmissions)
      .set({
        status: applied.length > 0 ? "confirmed" : "discarded",
        proposals: [...proposals],
        decidedAt: new Date(),
      })
      .where(
        and(
          eq(actionSubmissions.id, submissionId),
          eq(actionSubmissions.organizationId, organizationId),
        ),
      );

    await recordAudit(
      {
        actor,
        action:
          applied.length > 0
            ? "action_submission.confirm"
            : "action_submission.discard",
        entityType: "action_submission",
        entityId: submissionId,
        locationId,
        summary:
          applied.length > 0
            ? `Confirmed ${applied.length} AI-proposed action${applied.length === 1 ? "" : "s"}`
            : "Discarded all AI-proposed actions",
        metadata: {
          applied: applied.map((record) => ({
            kind: record.kind,
            id: record.id,
          })),
        },
      },
      tx,
    );

    return applied;
  });
}
