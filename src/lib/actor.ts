import { and, asc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

import { db } from "@/db";
import { locations, organizations, staffLocations, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { UnauthenticatedError } from "@/lib/errors";
import {
  assertPermission,
  isStaffRole,
  type Actor,
  type Permission,
} from "@/lib/permissions";

export interface LocationSummary {
  id: string;
  name: string;
  kind: "shelter" | "office" | "outreach";
  bedCapacity: number;
}

export interface ActorContext {
  actor: Actor;
  organization: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  /** Sites the actor may act on, in display order. */
  locations: LocationSummary[];
}

/**
 * Load the signed-in staff member and their site scope from the database.
 *
 * Role, organization and site assignments are read fresh on every request
 * rather than taken from the session cookie, so revoking access takes effect
 * immediately. `cache` dedupes the work within a single render pass.
 */
export const getActorContext = cache(async (): Promise<ActorContext | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) return null;

  const [row] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      jobTitle: user.jobTitle,
      isActive: user.isActive,
      organizationId: organizations.id,
      organizationName: organizations.name,
      organizationSlug: organizations.slug,
      organizationTimezone: organizations.timezone,
    })
    .from(user)
    .leftJoin(organizations, eq(user.organizationId, organizations.id))
    .where(eq(user.id, session.user.id))
    .limit(1);

  if (!row) return null;

  const role = isStaffRole(row.role) ? row.role : null;

  const assignments = row.organizationId
    ? await db
        .select({
          locationId: staffLocations.locationId,
          isPrimary: staffLocations.isPrimary,
        })
        .from(staffLocations)
        .where(eq(staffLocations.userId, row.id))
    : [];

  // An executive director is scoped to the whole organization; everyone else is
  // scoped to the sites they are explicitly assigned to.
  const visibleLocations = row.organizationId
    ? await db
        .select({
          id: locations.id,
          name: locations.name,
          kind: locations.kind,
          bedCapacity: locations.bedCapacity,
        })
        .from(locations)
        .where(
          and(
            eq(locations.organizationId, row.organizationId),
            eq(locations.isActive, true),
          ),
        )
        .orderBy(asc(locations.name))
    : [];

  const assignedIds = new Set(assignments.map((item) => item.locationId));
  const locationSummaries: LocationSummary[] =
    role === "executive_director"
      ? visibleLocations
      : visibleLocations.filter((item) => assignedIds.has(item.id));

  const primaryAssignment = assignments.find((item) => item.isPrimary);
  const primary =
    locationSummaries.find((item) => item.id === primaryAssignment?.locationId) ??
    locationSummaries[0];

  const actor: Actor = {
    userId: row.id,
    name: row.name,
    email: row.email,
    role,
    organizationId: row.organizationId ?? null,
    jobTitle: row.jobTitle ?? null,
    isActive: row.isActive,
    locationIds: locationSummaries.map((item) => item.id),
    primaryLocationId: primary?.id ?? null,
  };

  if (!row.organizationId) {
    return {
      actor,
      organization: {
        id: "",
        name: "Unassigned",
        slug: "unassigned",
        timezone: "America/Los_Angeles",
      },
      locations: [],
    };
  }

  return {
    actor,
    organization: {
      id: row.organizationId,
      name: row.organizationName ?? "Unnamed organization",
      slug: row.organizationSlug ?? "unknown",
      timezone: row.organizationTimezone ?? "America/Los_Angeles",
    },
    locations: locationSummaries,
  };
});

/** For pages: send anyone who is not signed in to the login screen. */
export async function requireActorContext(): Promise<ActorContext> {
  const context = await getActorContext();
  if (!context) redirect("/login");
  return context;
}

/** For API routes and server actions: throw instead of redirecting. */
export async function requireActorContextOrThrow(): Promise<ActorContext> {
  const context = await getActorContext();
  if (!context) throw new UnauthenticatedError();
  return context;
}

export async function requirePermission(
  permission: Permission,
): Promise<ActorContext> {
  const context = await requireActorContextOrThrow();
  assertPermission(context.actor, permission);
  return context;
}

/**
 * Resolve the site a request wants to act on, defaulting to the actor's primary
 * site, and verify they are scoped to it.
 */
export function resolveLocationId(
  context: ActorContext,
  requested?: string | null,
): string {
  const candidate = requested ?? context.actor.primaryLocationId;
  if (!candidate) {
    throw new UnauthenticatedError(
      "Your account is not assigned to a site yet. Ask a manager to add you.",
    );
  }
  return candidate;
}
