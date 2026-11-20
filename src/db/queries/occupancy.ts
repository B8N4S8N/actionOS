import { desc, inArray } from "drizzle-orm";

import { db } from "@/db";
import { occupancySnapshots } from "@/db/schema";

export interface LocationOccupancy {
  locationId: string;
  bedsOccupied: number;
  bedsOffline: number;
  recordedAt: Date;
}

/**
 * Most recent bed count for each of the given sites.
 *
 * Sites are few (a handful per staff member), so we fetch their snapshots
 * newest-first and keep the first row per site in JavaScript rather than
 * fighting Postgres array casting through the query builder.
 */
export async function getLatestOccupancy(
  locationIds: readonly string[],
): Promise<Map<string, LocationOccupancy>> {
  if (locationIds.length === 0) return new Map();

  const rows = await db
    .select({
      locationId: occupancySnapshots.locationId,
      bedsOccupied: occupancySnapshots.bedsOccupied,
      bedsOffline: occupancySnapshots.bedsOffline,
      recordedAt: occupancySnapshots.recordedAt,
    })
    .from(occupancySnapshots)
    .where(inArray(occupancySnapshots.locationId, [...locationIds]))
    .orderBy(desc(occupancySnapshots.recordedAt));

  const map = new Map<string, LocationOccupancy>();
  for (const row of rows) {
    if (!map.has(row.locationId)) {
      map.set(row.locationId, row);
    }
  }
  return map;
}
