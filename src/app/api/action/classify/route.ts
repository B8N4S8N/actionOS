import { db } from "@/db";
import { listInventory } from "@/db/queries/inventory";
import { actionSubmissions } from "@/db/schema";
import { requirePermission } from "@/lib/actor";
import { classifyObservation } from "@/lib/action/classify";
import {
  classifyRequestSchema,
  PROPOSAL_PERMISSION,
  type ProposalDecision,
} from "@/lib/action/types";
import { recordAudit } from "@/lib/audit";
import { jsonError, readJson } from "@/lib/http";
import { assertLocationAccess, hasPermission } from "@/lib/permissions";
import { currentShift } from "@/lib/shift";

/**
 * Step one of the Action Button: classify, persist the proposal set, save
 * nothing operational.
 *
 * Proposals are returned with an `allowed` flag so the UI can explain why a
 * suggestion is not available to this role, but the real check happens again
 * in `/api/action/confirm`.
 */
export async function POST(request: Request) {
  try {
    const context = await requirePermission("action:submit");
    const { text, locationId } = classifyRequestSchema.parse(
      await readJson(request),
    );

    assertLocationAccess(context.actor, locationId);
    const location = context.locations.find((item) => item.id === locationId);
    if (!location) {
      return Response.json({ error: "Unknown site." }, { status: 400 });
    }

    const items = await listInventory([locationId]);
    const classification = await classifyObservation(text, {
      locationName: location.name,
      knownItems: items.map((item) => ({
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
      })),
      shift: currentShift(context.organization.timezone),
    });

    const [submission] = await db
      .insert(actionSubmissions)
      .values({
        organizationId: context.organization.id,
        locationId,
        submittedByUserId: context.actor.userId,
        inputText: text,
        classifier: classification.classifier,
        model: classification.model ?? null,
        proposals: classification.proposals,
        status: "proposed",
      })
      .returning({ id: actionSubmissions.id });

    if (!submission) throw new Error("Failed to record the submission.");

    await recordAudit({
      actor: context.actor,
      action: "action_submission.create",
      entityType: "action_submission",
      entityId: submission.id,
      locationId,
      summary: `Submitted an observation to the Action Button (${classification.classifier} classifier, ${classification.proposals.length} proposal${
        classification.proposals.length === 1 ? "" : "s"
      })`,
      metadata: { classifier: classification.classifier, model: classification.model },
    });

    const proposals: ProposalDecision[] = classification.proposals.map(
      (proposal) => ({
        proposal,
        allowed: hasPermission(context.actor, PROPOSAL_PERMISSION[proposal.kind]),
        requiredPermission: PROPOSAL_PERMISSION[proposal.kind],
      }),
    );

    return Response.json({
      submissionId: submission.id,
      summary: classification.summary,
      classifier: classification.classifier,
      model: classification.model ?? null,
      fallbackReason: classification.fallbackReason ?? null,
      proposals,
      inventoryItems: items.map((item) => ({
        name: item.name,
        unit: item.unit,
        quantity: item.quantity,
      })),
    });
  } catch (error) {
    return jsonError(error);
  }
}
