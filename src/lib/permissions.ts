/**
 * Role-based access control for ActionOS.
 *
 * This module is deliberately pure: no database, no request context, no React.
 * Everything that enforces access (server actions, route handlers, page loads)
 * goes through `assertPermission` / `assertLocationAccess` here, and the unit
 * tests in `tests/permissions.test.ts` pin the matrix down.
 *
 * Two independent questions are answered:
 *   1. "Is this role allowed to do this at all?"  -> hasPermission
 *   2. "Is this staff member allowed to touch this site?" -> canAccessLocation
 * Both must pass. Hiding a button in the UI is never the control.
 */

export const STAFF_ROLES = [
  "site_assistant",
  "case_manager",
  "shelter_manager",
  "executive_director",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const ROLE_LABELS: Record<StaffRole, string> = {
  site_assistant: "Site assistant / float staff",
  case_manager: "Case manager",
  shelter_manager: "Shelter manager",
  executive_director: "Executive director",
};

export const ROLE_SHORT_LABELS: Record<StaffRole, string> = {
  site_assistant: "Site assistant",
  case_manager: "Case manager",
  shelter_manager: "Shelter manager",
  executive_director: "Executive director",
};

export const PERMISSIONS = [
  "dashboard:view",
  "action:submit",

  "maintenance:read",
  "maintenance:create",
  "maintenance:update",

  "inventory:read",
  "inventory:adjust",
  "inventory:manage_items",

  "shift_log:read",
  "shift_log:create",
  "briefing:generate",

  "follow_up:create",
  "follow_up:read",
  "follow_up:resolve",

  "occupancy:read",
  "occupancy:update",

  "staff:read",
  "audit_log:read",
  "org:view_all_locations",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const SITE_ASSISTANT_PERMISSIONS: readonly Permission[] = [
  "dashboard:view",
  "action:submit",
  "maintenance:read",
  "maintenance:create",
  "inventory:read",
  "inventory:adjust",
  "shift_log:read",
  "shift_log:create",
  "briefing:generate",
  // Front-line staff raise follow-ups and need to see whether one is being
  // worked, but only case management can close one out.
  "follow_up:create",
  "follow_up:read",
  "occupancy:read",
  "occupancy:update",
];

const CASE_MANAGER_PERMISSIONS: readonly Permission[] = [
  "dashboard:view",
  "action:submit",
  "maintenance:read",
  "maintenance:create",
  "inventory:read",
  "shift_log:read",
  "shift_log:create",
  "briefing:generate",
  "follow_up:create",
  "follow_up:read",
  "follow_up:resolve",
  "occupancy:read",
];

const SHELTER_MANAGER_PERMISSIONS: readonly Permission[] = [
  ...new Set<Permission>([
    ...SITE_ASSISTANT_PERMISSIONS,
    ...CASE_MANAGER_PERMISSIONS,
    "maintenance:update",
    "inventory:manage_items",
    "staff:read",
    "audit_log:read",
  ]),
];

// The executive director is the organization administrator in v1: read
// everything across every site, and able to act anywhere.
const EXECUTIVE_DIRECTOR_PERMISSIONS: readonly Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<StaffRole, readonly Permission[]> = {
  site_assistant: SITE_ASSISTANT_PERMISSIONS,
  case_manager: CASE_MANAGER_PERMISSIONS,
  shelter_manager: SHELTER_MANAGER_PERMISSIONS,
  executive_director: EXECUTIVE_DIRECTOR_PERMISSIONS,
};

/**
 * The minimum an authorization decision needs to know about the signed-in
 * staff member. Always built from a fresh database read, never from
 * client-supplied data.
 */
export interface Actor {
  userId: string;
  name: string;
  email: string;
  role: StaffRole | null;
  organizationId: string | null;
  jobTitle: string | null;
  isActive: boolean;
  /** Sites this actor may read and write. For an executive director this is every active site in the org. */
  locationIds: readonly string[];
  /** Site used as the default context for new records. */
  primaryLocationId: string | null;
}

export class AuthorizationError extends Error {
  readonly status = 403;

  constructor(message = "You do not have access to do that.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function isStaffRole(value: unknown): value is StaffRole {
  return (
    typeof value === "string" && (STAFF_ROLES as readonly string[]).includes(value)
  );
}

export function roleHasPermission(
  role: StaffRole | null | undefined,
  permission: Permission,
): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * An actor only has a permission when the account is active, provisioned into
 * an organization, and the role grants it. Anything unprovisioned fails closed.
 */
export function hasPermission(
  actor: Actor | null | undefined,
  permission: Permission,
): boolean {
  if (!actor) return false;
  if (!actor.isActive) return false;
  if (!actor.organizationId) return false;
  return roleHasPermission(actor.role, permission);
}

export function hasAnyPermission(
  actor: Actor | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => hasPermission(actor, permission));
}

export function assertPermission(
  actor: Actor | null | undefined,
  permission: Permission,
): asserts actor is Actor {
  if (!hasPermission(actor, permission)) {
    throw new AuthorizationError(
      `Your role does not allow "${permission}". Ask a manager if you need this access.`,
    );
  }
}

export function canAccessLocation(
  actor: Actor | null | undefined,
  locationId: string | null | undefined,
): boolean {
  if (!actor || !actor.isActive || !actor.organizationId) return false;
  if (!locationId) return false;
  return actor.locationIds.includes(locationId);
}

export function assertLocationAccess(
  actor: Actor | null | undefined,
  locationId: string | null | undefined,
): asserts actor is Actor {
  if (!canAccessLocation(actor, locationId)) {
    throw new AuthorizationError(
      "That site is not one you are assigned to. Ask a manager to add you to it.",
    );
  }
}

/** Convenience guard for mutations: permission *and* site scope in one call. */
export function assertCanActAtLocation(
  actor: Actor | null | undefined,
  permission: Permission,
  locationId: string | null | undefined,
): asserts actor is Actor {
  assertPermission(actor, permission);
  assertLocationAccess(actor, locationId);
}

export function permissionsForRole(role: StaffRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}
