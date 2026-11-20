import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { actionSubmissions } from "@/db/schema";
import { requirePermission } from "@/lib/actor";
import { applyProposals } from "@/lib/action/apply";
import { confirmRequestSchema } from "@/lib/action/types";
import { ValidationError } from "@/lib/errors";
import { jsonError, readJson } from "@/lib/http";
import { AuthorizationError, assertLocationAccess } from "@/lib/permissions";

/**
 * Step two of the Action Button: a human has reviewed the proposals, so write
 * the ones they kept.
 *
 * The client sends proposals back (possibly edited), and every one is
 * re-validated and re-authorized here. Only the staff member who made the
 * submission can confirm it, and a submission can only be decided once.
 */
export async function POST(request: Request) {
  try {
    const context = await requirePermission("action:submit");
    const { submissionId, proposals } = confirmRequestSchema.parse(
      await readJson(request),
    );

    const [submission] = await db
      .select({
        id: actionSubmissions.id,
        locationId: actionSubmissions.locationId,
        submittedByUserId: actionSubmissions.submittedByUserId,
        status: actionSubmissions.status,
      })
      .from(actionSubmissions)
      .where(
        and(
          eq(actionSubmissions.id, submissionId),
          eq(actionSubmissions.organizationId, context.organization.id),
        ),
      )
      .limit(1);

    if (!submission) {
      throw new ValidationError("That submission no longer exists.");
    }
    if (submission.submittedByUserId !== context.actor.userId) {
      throw new AuthorizationError(
        "Only the staff member who submitted an observation can confirm it.",
      );
    }
    if (submission.status !== "proposed") {
      throw new ValidationError("That submission has already been decided.");
    }

    assertLocationAccess(context.actor, submission.locationId);

    const applied = await applyProposals({
      actor: context.actor,
      organizationId: context.organization.id,
      locationId: submission.locationId,
      submissionId: submission.id,
      proposals,
      timezone: context.organization.timezone,
    });

    for (const path of [
      "/dashboard",
      "/maintenance",
      "/inventory",
      "/shift-log",
      "/follow-ups",
      "/audit-log",
    ]) {
      revalidatePath(path);
    }

    return Response.json({ applied });
  } catch (error) {
    return jsonError(error);
  }
}
