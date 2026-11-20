import { and, desc, eq, gte, inArray, lt } from "drizzle-orm";

import { db } from "@/db";
import { locations, shiftLogEntries, user } from "@/db/schema";

export interface ShiftLogRow {
  id: string;
  body: string;
  category:
    | "general"
    | "incident"
    | "maintenance"
    | "inventory"
    | "resident_support"
    | "handoff";
  severity: "info" | "attention" | "urgent";
  shift: "day" | "swing" | "overnight";
  locationId: string;
  locationName: string;
  authorName: string | null;
  occurredAt: Date;
  fromActionButton: boolean;
}

interface ListShiftLogOptions {
  locationIds: readonly string[];
  limit?: number;
  since?: Date;
  until?: Date;
}

export async function listShiftLog({
  locationIds,
  limit = 50,
  since,
  until,
}: ListShiftLogOptions): Promise<ShiftLogRow[]> {
  if (locationIds.length === 0) return [];

  const conditions = [inArray(shiftLogEntries.locationId, [...locationIds])];
  if (since) conditions.push(gte(shiftLogEntries.occurredAt, since));
  if (until) conditions.push(lt(shiftLogEntries.occurredAt, until));

  const rows = await db
    .select({
      id: shiftLogEntries.id,
      body: shiftLogEntries.body,
      category: shiftLogEntries.category,
      severity: shiftLogEntries.severity,
      shift: shiftLogEntries.shift,
      locationId: shiftLogEntries.locationId,
      locationName: locations.name,
      authorName: user.name,
      occurredAt: shiftLogEntries.occurredAt,
      sourceSubmissionId: shiftLogEntries.sourceSubmissionId,
    })
    .from(shiftLogEntries)
    .innerJoin(locations, eq(shiftLogEntries.locationId, locations.id))
    .leftJoin(user, eq(shiftLogEntries.createdByUserId, user.id))
    .where(and(...conditions))
    .orderBy(desc(shiftLogEntries.occurredAt))
    .limit(limit);

  return rows.map(({ sourceSubmissionId, ...row }) => ({
    ...row,
    fromActionButton: sourceSubmissionId !== null,
  }));
}
