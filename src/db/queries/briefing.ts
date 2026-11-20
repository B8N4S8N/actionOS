import { and, desc, eq, gte, lte } from "drizzle-orm";

import { db } from "@/db";
import { inventoryItems, occupancySnapshots } from "@/db/schema";
import type { LocationSummary } from "@/lib/actor";
import type { BriefingData } from "@/lib/briefing";
import { findLastShiftWindow, previousShift, type Shift } from "@/lib/shift";

import { listFollowUps } from "./follow-ups";
import { listTickets } from "./maintenance";
import { listShiftLog } from "./shift-log";

/** Gather everything the briefing summarizes for one site and one shift. */
export async function getBriefingData(
  location: LocationSummary,
  timezone: string,
  currentShift: Shift,
): Promise<BriefingData> {
  const shift = previousShift(currentShift);
  const { start, end } = findLastShiftWindow(shift, timezone);
  const locationIds = [location.id];

  const [logEntries, openTickets, lowStock, pendingFollowUps, occupancyRows] =
    await Promise.all([
      listShiftLog({ locationIds, since: start, until: end, limit: 40 }),
      listTickets({ locationIds, status: "active", limit: 25 }),
      db
        .select({
          name: inventoryItems.name,
          quantity: inventoryItems.quantity,
          unit: inventoryItems.unit,
          lowStockThreshold: inventoryItems.lowStockThreshold,
        })
        .from(inventoryItems)
        .where(
          and(
            eq(inventoryItems.locationId, location.id),
            lte(inventoryItems.quantity, inventoryItems.lowStockThreshold),
          ),
        ),
      listFollowUps({ locationIds, status: "pending", limit: 10 }),
      db
        .select({
          bedsOccupied: occupancySnapshots.bedsOccupied,
          bedsOffline: occupancySnapshots.bedsOffline,
          recordedAt: occupancySnapshots.recordedAt,
        })
        .from(occupancySnapshots)
        .where(
          and(
            eq(occupancySnapshots.locationId, location.id),
            gte(occupancySnapshots.recordedAt, start),
          ),
        )
        .orderBy(desc(occupancySnapshots.recordedAt))
        .limit(1),
    ]);

  const occupancy = occupancyRows[0];

  return {
    locationName: location.name,
    shift,
    windowStart: start,
    windowEnd: end,
    logEntries: logEntries.map((entry) => ({
      category: entry.category,
      severity: entry.severity,
      body: entry.body,
      authorName: entry.authorName,
      occurredAt: entry.occurredAt,
    })),
    openTickets: openTickets.map((ticket) => ({
      title: ticket.title,
      priority: ticket.priority,
      status: ticket.status,
      area: ticket.area,
    })),
    lowStockItems: lowStock,
    pendingFollowUps: pendingFollowUps.map((followUp) => ({
      subject: followUp.subject,
      urgency: followUp.urgency,
    })),
    occupancy: occupancy
      ? {
          bedsOccupied: occupancy.bedsOccupied,
          bedsOffline: occupancy.bedsOffline,
          bedCapacity: location.bedCapacity,
          recordedAt: occupancy.recordedAt,
        }
      : null,
  };
}
