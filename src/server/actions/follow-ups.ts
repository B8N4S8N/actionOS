"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { getFollowUpById } from "@/db/queries/follow-ups";
import { followUpRequests } from "@/db/schema";
import { requirePermission } from "@/lib/actor";
import { FOLLOW_UP_URGENCIES } from "@/lib/action/types";
import { recordAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { assertCanActAtLocation, assertLocationAccess } from "@/lib/permissions";

import { formString, runFormAction, type FormState } from "./shared";

const createSchema = z.object({
  locationId: z.string().uuid(),
  subject: z
    .string()
    .trim()
    .min(3, "Say which room or bed this is about.")
    .max(140),
  details: z.string().trim().max(2000).optional(),
  urgency: z.enum(FOLLOW_UP_URGENCIES),
});

const statusSchema = z.object({
  followUpId: z.string().uuid(),
  status: z.enum(["pending", "acknowledged", "closed"]),
  resolutionNote: z.string().trim().max(1000).optional(),
});

export async function createFollowUpAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction(async () => {
    const context = await requirePermission("follow_up:create");
    const input = createSchema.parse({
      locationId: formString(formData, "locationId"),
      subject: formString(formData, "subject"),
      details: formString(formData, "details") || undefined,
      urgency: formString(formData, "urgency") || "routine",
    });

    assertLocationAccess(context.actor, input.locationId);

    await db.transaction(async (tx) => {
      const [request] = await tx
        .insert(followUpRequests)
        .values({
          organizationId: context.organization.id,
          locationId: input.locationId,
          subject: input.subject,
          details: input.details ?? null,
          urgency: input.urgency,
          requestedByUserId: context.actor.userId,
        })
        .returning({ id: followUpRequests.id });

      if (!request) throw new Error("Failed to create the follow-up request.");

      await recordAudit(
        {
          actor: context.actor,
          action: "follow_up_request.create",
          entityType: "follow_up_request",
          entityId: request.id,
          locationId: input.locationId,
          summary: `Requested case manager follow-up (${input.urgency}): ${input.subject}`,
          metadata: { source: "follow_up_form" },
        },
        tx,
      );
    });

    revalidatePath("/follow-ups");
    revalidatePath("/dashboard");

    return { status: "success", message: "Follow-up requested." };
  });
}

export async function updateFollowUpStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction(async () => {
    const context = await requirePermission("follow_up:resolve");
    const input = statusSchema.parse({
      followUpId: formString(formData, "followUpId"),
      status: formString(formData, "status"),
      resolutionNote: formString(formData, "resolutionNote") || undefined,
    });

    const followUp = await getFollowUpById(input.followUpId);
    if (!followUp) throw new ValidationError("That request no longer exists.");

    assertCanActAtLocation(context.actor, "follow_up:resolve", followUp.locationId);

    await db.transaction(async (tx) => {
      await tx
        .update(followUpRequests)
        .set({
          status: input.status,
          resolutionNote: input.resolutionNote ?? null,
          acknowledgedByUserId: context.actor.userId,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(followUpRequests.id, followUp.id),
            eq(followUpRequests.organizationId, context.organization.id),
          ),
        );

      await recordAudit(
        {
          actor: context.actor,
          action: "follow_up_request.update_status",
          entityType: "follow_up_request",
          entityId: followUp.id,
          locationId: followUp.locationId,
          summary: `Marked follow-up "${followUp.subject}" as ${input.status}`,
          metadata: { from: followUp.status, to: input.status },
        },
        tx,
      );
    });

    revalidatePath("/follow-ups");
    revalidatePath("/dashboard");

    return { status: "success", message: `Marked ${input.status}.` };
  });
}
