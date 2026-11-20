"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { occupancySnapshots, shiftLogEntries } from "@/db/schema";
import { requirePermission } from "@/lib/actor";
import { LOG_CATEGORIES, LOG_SEVERITIES } from "@/lib/action/types";
import { recordAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { assertLocationAccess } from "@/lib/permissions";
import { currentShift } from "@/lib/shift";

import { formString, runFormAction, type FormState } from "./shared";

const logSchema = z.object({
  locationId: z.string().uuid(),
  body: z.string().trim().min(3, "Write what happened.").max(2000),
  category: z.enum(LOG_CATEGORIES),
  severity: z.enum(LOG_SEVERITIES),
});

const occupancySchema = z.object({
  locationId: z.string().uuid(),
  bedsOccupied: z.coerce.number().int().min(0).max(5000),
  bedsOffline: z.coerce.number().int().min(0).max(5000),
  note: z.string().trim().max(500).optional(),
});

export async function createShiftLogEntryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction(async () => {
    const context = await requirePermission("shift_log:create");
    const input = logSchema.parse({
      locationId: formString(formData, "locationId"),
      body: formString(formData, "body"),
      category: formString(formData, "category") || "general",
      severity: formString(formData, "severity") || "info",
    });

    assertLocationAccess(context.actor, input.locationId);
    const shift = currentShift(context.organization.timezone);

    await db.transaction(async (tx) => {
      const [entry] = await tx
        .insert(shiftLogEntries)
        .values({
          organizationId: context.organization.id,
          locationId: input.locationId,
          shift,
          category: input.category,
          severity: input.severity,
          body: input.body,
          createdByUserId: context.actor.userId,
        })
        .returning({ id: shiftLogEntries.id });

      if (!entry) throw new Error("Failed to write the log entry.");

      await recordAudit(
        {
          actor: context.actor,
          action: "shift_log_entry.create",
          entityType: "shift_log_entry",
          entityId: entry.id,
          locationId: input.locationId,
          summary: `Logged a ${input.category} note (${input.severity}) on the ${shift} shift`,
          metadata: { source: "shift_log_form" },
        },
        tx,
      );
    });

    revalidatePath("/shift-log");
    revalidatePath("/dashboard");

    return { status: "success", message: "Added to the shift log." };
  });
}

export async function recordOccupancyAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction(async () => {
    const context = await requirePermission("occupancy:update");
    const input = occupancySchema.parse({
      locationId: formString(formData, "locationId"),
      bedsOccupied: formString(formData, "bedsOccupied"),
      bedsOffline: formString(formData, "bedsOffline") || "0",
      note: formString(formData, "note") || undefined,
    });

    assertLocationAccess(context.actor, input.locationId);

    const location = context.locations.find(
      (item) => item.id === input.locationId,
    );
    if (!location) throw new ValidationError("Unknown site.");

    if (input.bedsOccupied + input.bedsOffline > location.bedCapacity) {
      throw new ValidationError(
        `${location.name} has ${location.bedCapacity} beds; occupied plus offline cannot exceed that.`,
      );
    }

    await db.transaction(async (tx) => {
      const [snapshot] = await tx
        .insert(occupancySnapshots)
        .values({
          locationId: input.locationId,
          bedsOccupied: input.bedsOccupied,
          bedsOffline: input.bedsOffline,
          note: input.note ?? null,
          recordedByUserId: context.actor.userId,
        })
        .returning({ id: occupancySnapshots.id });

      if (!snapshot) throw new Error("Failed to record the bed count.");

      await recordAudit(
        {
          actor: context.actor,
          action: "occupancy_snapshot.create",
          entityType: "occupancy_snapshot",
          entityId: snapshot.id,
          locationId: input.locationId,
          summary: `Counted ${input.bedsOccupied} of ${location.bedCapacity} beds occupied at ${location.name}${
            input.bedsOffline > 0 ? ` (${input.bedsOffline} offline)` : ""
          }`,
        },
        tx,
      );
    });

    revalidatePath("/dashboard");

    return { status: "success", message: "Bed count recorded." };
  });
}
