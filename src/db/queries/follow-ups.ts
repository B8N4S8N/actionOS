import { and, desc, eq, inArray, ne } from "drizzle-orm";

import { db } from "@/db";
import { followUpRequests, locations, user } from "@/db/schema";

export interface FollowUpRow {
  id: string;
  subject: string;
  details: string | null;
  urgency: "routine" | "soon" | "urgent";
  status: "pending" | "acknowledged" | "closed";
  locationId: string;
  locationName: string;
  requestedByName: string | null;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}

interface ListFollowUpsOptions {
  locationIds: readonly string[];
  status?: FollowUpRow["status"] | "open";
  limit?: number;
}

export async function listFollowUps({
  locationIds,
  status,
  limit = 50,
}: ListFollowUpsOptions): Promise<FollowUpRow[]> {
  if (locationIds.length === 0) return [];

  const conditions = [inArray(followUpRequests.locationId, [...locationIds])];
  if (status === "open") {
    conditions.push(ne(followUpRequests.status, "closed"));
  } else if (status) {
    conditions.push(eq(followUpRequests.status, status));
  }

  return db
    .select({
      id: followUpRequests.id,
      subject: followUpRequests.subject,
      details: followUpRequests.details,
      urgency: followUpRequests.urgency,
      status: followUpRequests.status,
      locationId: followUpRequests.locationId,
      locationName: locations.name,
      requestedByName: user.name,
      resolutionNote: followUpRequests.resolutionNote,
      createdAt: followUpRequests.createdAt,
      updatedAt: followUpRequests.updatedAt,
    })
    .from(followUpRequests)
    .innerJoin(locations, eq(followUpRequests.locationId, locations.id))
    .leftJoin(user, eq(followUpRequests.requestedByUserId, user.id))
    .where(and(...conditions))
    .orderBy(desc(followUpRequests.createdAt))
    .limit(limit);
}

export async function getFollowUpById(id: string) {
  const [row] = await db
    .select({
      id: followUpRequests.id,
      locationId: followUpRequests.locationId,
      status: followUpRequests.status,
      subject: followUpRequests.subject,
    })
    .from(followUpRequests)
    .where(eq(followUpRequests.id, id))
    .limit(1);

  return row ?? null;
}
