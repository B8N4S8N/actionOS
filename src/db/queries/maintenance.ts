import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/db";
import { locations, maintenanceTickets, user } from "@/db/schema";

export interface TicketRow {
  id: string;
  title: string;
  description: string | null;
  area: string | null;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "blocked" | "resolved";
  locationId: string;
  locationName: string;
  createdByName: string | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt: Date | null;
  fromActionButton: boolean;
}

interface ListTicketsOptions {
  locationIds: readonly string[];
  /** Omit for every status; "active" means anything not resolved. */
  status?: TicketRow["status"] | "active";
  limit?: number;
}

export async function listTickets({
  locationIds,
  status,
  limit = 100,
}: ListTicketsOptions): Promise<TicketRow[]> {
  if (locationIds.length === 0) return [];

  const conditions = [inArray(maintenanceTickets.locationId, [...locationIds])];
  if (status === "active") {
    conditions.push(ne(maintenanceTickets.status, "resolved"));
  } else if (status) {
    conditions.push(eq(maintenanceTickets.status, status));
  }

  const rows = await db
    .select({
      id: maintenanceTickets.id,
      title: maintenanceTickets.title,
      description: maintenanceTickets.description,
      area: maintenanceTickets.area,
      priority: maintenanceTickets.priority,
      status: maintenanceTickets.status,
      locationId: maintenanceTickets.locationId,
      locationName: locations.name,
      createdByName: user.name,
      resolutionNote: maintenanceTickets.resolutionNote,
      createdAt: maintenanceTickets.createdAt,
      updatedAt: maintenanceTickets.updatedAt,
      resolvedAt: maintenanceTickets.resolvedAt,
      sourceSubmissionId: maintenanceTickets.sourceSubmissionId,
    })
    .from(maintenanceTickets)
    .innerJoin(locations, eq(maintenanceTickets.locationId, locations.id))
    .leftJoin(user, eq(maintenanceTickets.createdByUserId, user.id))
    .where(and(...conditions))
    .orderBy(desc(maintenanceTickets.createdAt))
    .limit(limit);

  return rows.map(({ sourceSubmissionId, ...row }) => ({
    ...row,
    fromActionButton: sourceSubmissionId !== null,
  }));
}

export async function getTicketById(
  id: string,
): Promise<{ id: string; locationId: string; status: TicketRow["status"]; title: string } | null> {
  const [row] = await db
    .select({
      id: maintenanceTickets.id,
      locationId: maintenanceTickets.locationId,
      status: maintenanceTickets.status,
      title: maintenanceTickets.title,
    })
    .from(maintenanceTickets)
    .where(eq(maintenanceTickets.id, id))
    .limit(1);

  return row ?? null;
}
