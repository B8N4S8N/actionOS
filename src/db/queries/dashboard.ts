import { and, desc, eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { actionSubmissions, locations, staffLocations, user } from "@/db/schema";
import type { LocationSummary } from "@/lib/actor";
import type { StaffRole } from "@/lib/permissions";

import { listFollowUps, type FollowUpRow } from "./follow-ups";
import { listInventory, listLowStock, type InventoryItemRow } from "./inventory";
import { listTickets, type TicketRow } from "./maintenance";
import { getLatestOccupancy, type LocationOccupancy } from "./occupancy";
import { listShiftLog, type ShiftLogRow } from "./shift-log";

export interface OccupancyView {
  location: LocationSummary;
  bedsOccupied: number;
  bedsOffline: number;
  bedsAvailable: number;
  recordedAt: Date | null;
  occupancyRate: number | null;
}

export interface OperationsSnapshot {
  occupancy: OccupancyView[];
  totals: {
    bedCapacity: number;
    bedsOccupied: number;
    bedsAvailable: number;
    openTickets: number;
    urgentTickets: number;
    lowStockItems: number;
    pendingFollowUps: number;
    flaggedLogEntries: number;
  };
  activeTickets: TicketRow[];
  lowStock: InventoryItemRow[];
  recentLog: ShiftLogRow[];
  openFollowUps: FollowUpRow[];
}

function toOccupancyView(
  location: LocationSummary,
  snapshot: LocationOccupancy | undefined,
): OccupancyView {
  const bedsOccupied = snapshot?.bedsOccupied ?? 0;
  const bedsOffline = snapshot?.bedsOffline ?? 0;
  const bedsAvailable = Math.max(
    0,
    location.bedCapacity - bedsOccupied - bedsOffline,
  );

  return {
    location,
    bedsOccupied,
    bedsOffline,
    bedsAvailable,
    recordedAt: snapshot?.recordedAt ?? null,
    occupancyRate:
      location.bedCapacity > 0 ? bedsOccupied / location.bedCapacity : null,
  };
}

/**
 * One round trip per concern, assembled into the numbers every dashboard
 * shows. Scope is always the caller's permitted sites — a dashboard cannot
 * widen it by asking.
 */
export async function getOperationsSnapshot(
  scopedLocations: readonly LocationSummary[],
): Promise<OperationsSnapshot> {
  const locationIds = scopedLocations.map((location) => location.id);

  const [occupancySnapshots, activeTickets, lowStock, recentLog, openFollowUps] =
    await Promise.all([
      getLatestOccupancy(locationIds),
      listTickets({ locationIds, status: "active", limit: 50 }),
      listLowStock(locationIds),
      listShiftLog({ locationIds, limit: 10 }),
      listFollowUps({ locationIds, status: "open", limit: 25 }),
    ]);

  const occupancy = scopedLocations
    .filter((location) => location.kind === "shelter" || location.bedCapacity > 0)
    .map((location) => toOccupancyView(location, occupancySnapshots.get(location.id)));

  return {
    occupancy,
    totals: {
      bedCapacity: occupancy.reduce(
        (sum, view) => sum + view.location.bedCapacity,
        0,
      ),
      bedsOccupied: occupancy.reduce((sum, view) => sum + view.bedsOccupied, 0),
      bedsAvailable: occupancy.reduce((sum, view) => sum + view.bedsAvailable, 0),
      openTickets: activeTickets.length,
      urgentTickets: activeTickets.filter(
        (ticket) => ticket.priority === "urgent" || ticket.priority === "high",
      ).length,
      lowStockItems: lowStock.length,
      pendingFollowUps: openFollowUps.filter(
        (followUp) => followUp.status === "pending",
      ).length,
      flaggedLogEntries: recentLog.filter((entry) => entry.severity !== "info")
        .length,
    },
    activeTickets,
    lowStock,
    recentLog,
    openFollowUps,
  };
}

export interface SubmissionRow {
  id: string;
  inputText: string;
  classifier: "llm" | "keyword";
  model: string | null;
  status: "proposed" | "confirmed" | "discarded";
  proposalCount: number;
  submittedByName: string | null;
  locationName: string;
  createdAt: Date;
  decidedAt: Date | null;
}

export async function listRecentSubmissions(
  organizationId: string,
  locationIds: readonly string[],
  limit = 10,
): Promise<SubmissionRow[]> {
  if (locationIds.length === 0) return [];

  const rows = await db
    .select({
      id: actionSubmissions.id,
      inputText: actionSubmissions.inputText,
      classifier: actionSubmissions.classifier,
      model: actionSubmissions.model,
      status: actionSubmissions.status,
      proposals: actionSubmissions.proposals,
      submittedByName: user.name,
      locationName: locations.name,
      createdAt: actionSubmissions.createdAt,
      decidedAt: actionSubmissions.decidedAt,
    })
    .from(actionSubmissions)
    .innerJoin(locations, eq(actionSubmissions.locationId, locations.id))
    .leftJoin(user, eq(actionSubmissions.submittedByUserId, user.id))
    .where(
      and(
        eq(actionSubmissions.organizationId, organizationId),
        inArray(actionSubmissions.locationId, [...locationIds]),
      ),
    )
    .orderBy(desc(actionSubmissions.createdAt))
    .limit(limit);

  return rows.map(({ proposals, ...row }) => ({
    ...row,
    proposalCount: proposals.length,
  }));
}

export interface StaffRow {
  id: string;
  name: string;
  email: string;
  role: StaffRole | null;
  jobTitle: string | null;
  isActive: boolean;
  locationNames: string[];
}

export async function listStaff(organizationId: string): Promise<StaffRow[]> {
  const people = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      jobTitle: user.jobTitle,
      isActive: user.isActive,
    })
    .from(user)
    .where(eq(user.organizationId, organizationId))
    .orderBy(user.name);

  if (people.length === 0) return [];

  const assignments = await db
    .select({ userId: staffLocations.userId, locationName: locations.name })
    .from(staffLocations)
    .innerJoin(locations, eq(staffLocations.locationId, locations.id))
    .where(eq(locations.organizationId, organizationId));

  const byUser = new Map<string, string[]>();
  for (const assignment of assignments) {
    const existing = byUser.get(assignment.userId) ?? [];
    existing.push(assignment.locationName);
    byUser.set(assignment.userId, existing);
  }

  return people.map((person) => ({
    ...person,
    locationNames: (byUser.get(person.id) ?? []).sort(),
  }));
}

export async function listInventoryForLocations(
  locationIds: readonly string[],
): Promise<InventoryItemRow[]> {
  return listInventory(locationIds);
}
