import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import type { Actor } from "@/lib/permissions";

type DbExecutor =
  | typeof db
  | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface AuditEntry {
  actor: Actor;
  /** Dotted verb, e.g. "maintenance_ticket.create". */
  action: string;
  entityType: string;
  entityId?: string | null;
  locationId?: string | null;
  /** One line a human can read in the audit log view. */
  summary: string;
  metadata?: Record<string, unknown>;
}

/**
 * Append an audit record.
 *
 * Every create/update in ActionOS calls this, inside the same transaction as
 * the change where one is available, so the log cannot drift from the data.
 * The actor's name and role are copied in so history still reads correctly
 * after someone changes job or leaves.
 */
export async function recordAudit(
  entry: AuditEntry,
  executor: DbExecutor = db,
): Promise<void> {
  if (!entry.actor.organizationId) {
    throw new Error("Cannot write an audit record without an organization.");
  }

  await executor.insert(auditLogs).values({
    organizationId: entry.actor.organizationId,
    actorUserId: entry.actor.userId,
    actorName: entry.actor.name,
    actorRole: entry.actor.role ?? "unassigned",
    action: entry.action,
    entityType: entry.entityType,
    entityId: entry.entityId ?? null,
    locationId: entry.locationId ?? null,
    summary: entry.summary,
    metadata: entry.metadata ?? null,
  });
}
