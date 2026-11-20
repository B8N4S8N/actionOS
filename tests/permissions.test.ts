import { describe, expect, it } from "vitest";

import {
  AuthorizationError,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  STAFF_ROLES,
  assertCanActAtLocation,
  assertLocationAccess,
  assertPermission,
  canAccessLocation,
  hasAnyPermission,
  hasPermission,
  isStaffRole,
  roleHasPermission,
  type Actor,
  type Permission,
  type StaffRole,
} from "@/lib/permissions";

const SITE_A = "11111111-1111-4111-8111-111111111111";
const SITE_B = "22222222-2222-4222-8222-222222222222";
const SITE_C = "33333333-3333-4333-8333-333333333333";

function actor(overrides: Partial<Actor> = {}): Actor {
  return {
    userId: "user_1",
    name: "Test Staff",
    email: "test@example.org",
    role: "site_assistant",
    organizationId: "org_1",
    jobTitle: null,
    isActive: true,
    locationIds: [SITE_A, SITE_B],
    primaryLocationId: SITE_A,
    ...overrides,
  };
}

describe("role permission matrix", () => {
  it("covers every role", () => {
    for (const role of STAFF_ROLES) {
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it("only grants permissions that exist", () => {
    for (const role of STAFF_ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(PERMISSIONS).toContain(permission);
      }
    }
  });

  it("does not repeat a permission within a role", () => {
    for (const role of STAFF_ROLES) {
      const granted = ROLE_PERMISSIONS[role];
      expect(new Set(granted).size).toBe(granted.length);
    }
  });

  it("gives the executive director every permission", () => {
    for (const permission of PERMISSIONS) {
      expect(roleHasPermission("executive_director", permission)).toBe(true);
    }
  });

  it("limits organization-wide visibility to the executive director", () => {
    const withOrgView = STAFF_ROLES.filter((role) =>
      roleHasPermission(role, "org:view_all_locations"),
    );
    expect(withOrgView).toEqual(["executive_director"]);
  });

  it("limits the audit log to managers and above", () => {
    const withAudit = STAFF_ROLES.filter((role) =>
      roleHasPermission(role, "audit_log:read"),
    );
    expect(withAudit).toEqual(["shelter_manager", "executive_director"]);
  });

  it("keeps case managers out of stock edits but in the follow-up queue", () => {
    expect(roleHasPermission("case_manager", "inventory:read")).toBe(true);
    expect(roleHasPermission("case_manager", "inventory:adjust")).toBe(false);
    expect(roleHasPermission("case_manager", "inventory:manage_items")).toBe(false);
    expect(roleHasPermission("case_manager", "follow_up:resolve")).toBe(true);
  });

  it("lets front-line staff log and adjust but not close follow-ups or move tickets", () => {
    expect(roleHasPermission("site_assistant", "shift_log:create")).toBe(true);
    expect(roleHasPermission("site_assistant", "inventory:adjust")).toBe(true);
    expect(roleHasPermission("site_assistant", "maintenance:create")).toBe(true);
    expect(roleHasPermission("site_assistant", "maintenance:update")).toBe(false);
    expect(roleHasPermission("site_assistant", "follow_up:create")).toBe(true);
    expect(roleHasPermission("site_assistant", "follow_up:resolve")).toBe(false);
    expect(roleHasPermission("site_assistant", "inventory:manage_items")).toBe(false);
  });

  it("gives shelter managers everything their staff have", () => {
    const inherited: Permission[] = [
      ...ROLE_PERMISSIONS.site_assistant,
      ...ROLE_PERMISSIONS.case_manager,
    ];
    for (const permission of inherited) {
      expect(roleHasPermission("shelter_manager", permission)).toBe(true);
    }
  });

  it("treats an unknown role as having nothing", () => {
    expect(roleHasPermission(null, "dashboard:view")).toBe(false);
    expect(isStaffRole("supervisor")).toBe(false);
    expect(isStaffRole("shelter_manager")).toBe(true);
  });
});

describe("hasPermission", () => {
  it("fails closed for a missing actor", () => {
    expect(hasPermission(null, "dashboard:view")).toBe(false);
    expect(hasPermission(undefined, "dashboard:view")).toBe(false);
  });

  it("fails closed for a deactivated account", () => {
    expect(hasPermission(actor({ isActive: false }), "dashboard:view")).toBe(false);
  });

  it("fails closed when the account has no organization", () => {
    expect(hasPermission(actor({ organizationId: null }), "dashboard:view")).toBe(
      false,
    );
  });

  it("fails closed when the account has no role", () => {
    expect(hasPermission(actor({ role: null }), "dashboard:view")).toBe(false);
  });

  it("grants a permission the role has", () => {
    expect(hasPermission(actor(), "shift_log:create")).toBe(true);
  });

  it("supports any-of checks", () => {
    expect(hasAnyPermission(actor(), ["audit_log:read", "shift_log:create"])).toBe(
      true,
    );
    expect(hasAnyPermission(actor(), ["audit_log:read", "staff:read"])).toBe(false);
  });
});

describe("assertPermission", () => {
  it("passes for an allowed action", () => {
    expect(() => assertPermission(actor(), "inventory:adjust")).not.toThrow();
  });

  it("throws AuthorizationError with a 403 for a disallowed action", () => {
    try {
      assertPermission(actor(), "audit_log:read");
      throw new Error("should have thrown");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthorizationError);
      expect((error as AuthorizationError).status).toBe(403);
      expect((error as AuthorizationError).message).toContain("audit_log:read");
    }
  });
});

describe("location scoping", () => {
  it("allows a site the actor is assigned to", () => {
    expect(canAccessLocation(actor(), SITE_A)).toBe(true);
    expect(canAccessLocation(actor(), SITE_B)).toBe(true);
  });

  it("refuses a site the actor is not assigned to", () => {
    expect(canAccessLocation(actor(), SITE_C)).toBe(false);
    expect(() => assertLocationAccess(actor(), SITE_C)).toThrow(AuthorizationError);
  });

  it("refuses a missing site id", () => {
    expect(canAccessLocation(actor(), null)).toBe(false);
    expect(canAccessLocation(actor(), undefined)).toBe(false);
    expect(canAccessLocation(actor(), "")).toBe(false);
  });

  it("refuses every site for a deactivated account", () => {
    expect(canAccessLocation(actor({ isActive: false }), SITE_A)).toBe(false);
  });

  it("scopes an executive director to the sites materialized for their org", () => {
    const director = actor({
      role: "executive_director",
      locationIds: [SITE_A, SITE_B, SITE_C],
    });
    expect(canAccessLocation(director, SITE_C)).toBe(true);

    // Even a director cannot reach a site outside the organization, because the
    // scope list only ever contains their own org's sites.
    expect(canAccessLocation(director, "44444444-4444-4444-8444-444444444444")).toBe(
      false,
    );
  });
});

describe("assertCanActAtLocation", () => {
  it("requires both the permission and the site", () => {
    expect(() =>
      assertCanActAtLocation(actor(), "inventory:adjust", SITE_A),
    ).not.toThrow();

    // Right permission, wrong site.
    expect(() =>
      assertCanActAtLocation(actor(), "inventory:adjust", SITE_C),
    ).toThrow(AuthorizationError);

    // Right site, wrong permission.
    expect(() =>
      assertCanActAtLocation(actor(), "maintenance:update", SITE_A),
    ).toThrow(AuthorizationError);
  });

  it("lets a manager act at their own sites only", () => {
    const manager = actor({ role: "shelter_manager" as StaffRole });
    expect(() =>
      assertCanActAtLocation(manager, "maintenance:update", SITE_B),
    ).not.toThrow();
    expect(() =>
      assertCanActAtLocation(manager, "maintenance:update", SITE_C),
    ).toThrow(AuthorizationError);
  });
});
