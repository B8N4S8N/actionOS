"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { getTicketById } from "@/db/queries/maintenance";
import { maintenanceTickets } from "@/db/schema";
import { requirePermission } from "@/lib/actor";
import { TICKET_PRIORITIES } from "@/lib/action/types";
import { recordAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { assertCanActAtLocation, assertLocationAccess } from "@/lib/permissions";

import { formString, runFormAction, type FormState } from "./shared";

const createSchema = z.object({
  locationId: z.string().uuid(),
  title: z.string().trim().min(3, "Give the ticket a short title.").max(140),
  description: z.string().trim().max(2000).optional(),
  area: z.string().trim().max(80).optional(),
  priority: z.enum(TICKET_PRIORITIES),
});

const statusSchema = z.object({
  ticketId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "blocked", "resolved"]),
  resolutionNote: z.string().trim().max(1000).optional(),
});

export async function createTicketAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction(async () => {
    const context = await requirePermission("maintenance:create");
    const input = createSchema.parse({
      locationId: formString(formData, "locationId"),
      title: formString(formData, "title"),
      description: formString(formData, "description") || undefined,
      area: formString(formData, "area") || undefined,
      priority: formString(formData, "priority") || "medium",
    });

    assertLocationAccess(context.actor, input.locationId);

    const ticketId = await db.transaction(async (tx) => {
      const [ticket] = await tx
        .insert(maintenanceTickets)
        .values({
          organizationId: context.organization.id,
          locationId: input.locationId,
          title: input.title,
          description: input.description ?? null,
          area: input.area ?? null,
          priority: input.priority,
          createdByUserId: context.actor.userId,
        })
        .returning({ id: maintenanceTickets.id });

      if (!ticket) throw new Error("Failed to create ticket.");

      await recordAudit(
        {
          actor: context.actor,
          action: "maintenance_ticket.create",
          entityType: "maintenance_ticket",
          entityId: ticket.id,
          locationId: input.locationId,
          summary: `Opened ${input.priority} priority ticket "${input.title}"`,
          metadata: { source: "maintenance_form" },
        },
        tx,
      );

      return ticket.id;
    });

    revalidatePath("/maintenance");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `Ticket opened. Reference ${ticketId.slice(0, 8)}.`,
    };
  });
}

export async function updateTicketStatusAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction(async () => {
    const context = await requirePermission("maintenance:update");
    const input = statusSchema.parse({
      ticketId: formString(formData, "ticketId"),
      status: formString(formData, "status"),
      resolutionNote: formString(formData, "resolutionNote") || undefined,
    });

    const ticket = await getTicketById(input.ticketId);
    if (!ticket) throw new ValidationError("That ticket no longer exists.");

    assertCanActAtLocation(context.actor, "maintenance:update", ticket.locationId);

    if (ticket.status === input.status) {
      return { status: "idle", message: "Nothing changed." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(maintenanceTickets)
        .set({
          status: input.status,
          resolutionNote: input.resolutionNote ?? null,
          updatedAt: new Date(),
          resolvedAt: input.status === "resolved" ? new Date() : null,
        })
        .where(
          and(
            eq(maintenanceTickets.id, ticket.id),
            eq(maintenanceTickets.organizationId, context.organization.id),
          ),
        );

      await recordAudit(
        {
          actor: context.actor,
          action: "maintenance_ticket.update_status",
          entityType: "maintenance_ticket",
          entityId: ticket.id,
          locationId: ticket.locationId,
          summary: `Moved ticket "${ticket.title}" from ${ticket.status} to ${input.status}`,
          metadata: {
            from: ticket.status,
            to: input.status,
            resolutionNote: input.resolutionNote ?? null,
          },
        },
        tx,
      );
    });

    revalidatePath("/maintenance");
    revalidatePath("/dashboard");

    return { status: "success", message: `Ticket moved to ${input.status}.` };
  });
}
