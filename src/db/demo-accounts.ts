import type { StaffRole } from "@/lib/permissions";

/**
 * Fictional demo organization used by `npm run db:seed`.
 *
 * Everything here is invented: the agency, the sites and the people. No real
 * organization, staff member or resident appears anywhere in the seed data,
 * and the seed script refuses to run against a database that already holds a
 * different organization.
 */
export const DEMO_ORGANIZATION = {
  name: "Riverbend Community Action (demo)",
  slug: "riverbend-demo",
  timezone: "America/Los_Angeles",
} as const;

export interface DemoLocation {
  name: string;
  kind: "shelter" | "office" | "outreach";
  bedCapacity: number;
}

export const DEMO_LOCATIONS: readonly DemoLocation[] = [
  { name: "Cedar Street Shelter", kind: "shelter", bedCapacity: 48 },
  { name: "Hawthorne Family Shelter", kind: "shelter", bedCapacity: 24 },
  { name: "Mill District Office", kind: "office", bedCapacity: 0 },
];

export interface DemoAccount {
  email: string;
  name: string;
  role: StaffRole;
  jobTitle: string;
  /** Sites this account is assigned to, by name. */
  locations: readonly string[];
  primaryLocation: string;
  /** Short description shown next to the credentials on the sign-in page. */
  siteNote: string;
}

export const DEMO_ACCOUNTS: readonly DemoAccount[] = [
  {
    email: "jamie.rivera@example.org",
    name: "Jamie Rivera",
    role: "site_assistant",
    jobTitle: "Lead float staff (demo)",
    locations: ["Cedar Street Shelter", "Hawthorne Family Shelter"],
    primaryLocation: "Cedar Street Shelter",
    siteNote: "floats between both shelters",
  },
  {
    email: "morgan.diaz@example.org",
    name: "Morgan Diaz",
    role: "case_manager",
    jobTitle: "Case manager (demo)",
    locations: ["Cedar Street Shelter", "Mill District Office"],
    primaryLocation: "Cedar Street Shelter",
    siteNote: "Cedar Street + office",
  },
  {
    email: "priya.nakamura@example.org",
    name: "Priya Nakamura",
    role: "shelter_manager",
    jobTitle: "Shelter manager (demo)",
    locations: ["Cedar Street Shelter", "Hawthorne Family Shelter"],
    primaryLocation: "Cedar Street Shelter",
    siteNote: "manages both shelters",
  },
  {
    email: "dana.whitfield@example.org",
    name: "Dana Whitfield",
    role: "executive_director",
    jobTitle: "Executive director (demo)",
    locations: ["Mill District Office"],
    primaryLocation: "Mill District Office",
    siteNote: "whole organization",
  },
];
