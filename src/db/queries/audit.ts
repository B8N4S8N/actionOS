import { and, desc, eq, inArray, isNull, or, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { auditLogs, locations } from "@/db/schema";

export interface AuditRow {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  locationName: string | null;
  createdAt: Date;
}

interface ListAuditOptions {
  organizationId: string;
  /** When provided, limits the log to these sites (plus org-wide entries). */
  locationIds?: readonly string[];
  limit?: number;
}

export async function listAuditLog({
  organizationId,
  locationIds,
  limit = 100,
}: ListAuditOptions): Promise<AuditRow[]> {
  const conditions: SQL[] = [eq(auditLogs.organizationId, organizationId)];

  if (locationIds) {
    if (locationIds.length === 0) return [];
    const scoped = or(
      inArray(auditLogs.locationId, [...locationIds]),
      isNull(auditLogs.locationId),
    );
    if (scoped) conditions.push(scoped);
  }

  return db
    .select({
      id: auditLogs.id,
      actorName: auditLogs.actorName,
      actorRole: auditLogs.actorRole,
      action: auditLogs.action,
      entityType: auditLogs.entityType,
      entityId: auditLogs.entityId,
      summary: auditLogs.summary,
      locationName: locations.name,
      createdAt: auditLogs.createdAt,
    })
    .from(auditLogs)
    .leftJoin(locations, eq(auditLogs.locationId, locations.id))
    .where(and(...conditions))
    .orderBy(desc(auditLogs.createdAt))
    .limit(limit);
}
