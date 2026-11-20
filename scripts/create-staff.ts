/**
 * Provision a staff account from the command line.
 *
 * ActionOS disables public sign-up, so this is how accounts are created until
 * an in-app invite flow exists. It builds its own Better Auth instance with
 * sign-up enabled — in a local process, never over HTTP — so the password is
 * hashed exactly the way a real sign-up would hash it.
 *
 *   npm run staff:create -- \
 *     --email sam@agency.org \
 *     --name "Sam Lee" \
 *     --role shelter_manager \
 *     --org riverbend-demo \
 *     --locations "Cedar Street Shelter,Hawthorne Family Shelter" \
 *     [--primary "Cedar Street Shelter"] [--password '...'] [--title 'Shelter manager']
 */
import { randomBytes } from "node:crypto";
import { parseArgs } from "node:util";

import { and, eq, inArray } from "drizzle-orm";

import { db, pool } from "@/db";
import { locations, organizations, staffLocations, user } from "@/db/schema";
import { buildAuth } from "@/lib/auth";
import { STAFF_ROLES, isStaffRole } from "@/lib/permissions";

function generatePassword(): string {
  return `${randomBytes(12).toString("base64url")}aA1!`;
}

async function main() {
  const { values } = parseArgs({
    options: {
      email: { type: "string" },
      name: { type: "string" },
      role: { type: "string" },
      org: { type: "string" },
      locations: { type: "string" },
      primary: { type: "string" },
      password: { type: "string" },
      title: { type: "string" },
    },
  });

  const email = values.email?.trim().toLowerCase();
  const name = values.name?.trim();
  const role = values.role?.trim();
  const orgSlug = values.org?.trim();

  if (!email || !name || !role || !orgSlug) {
    throw new Error(
      "--email, --name, --role and --org are all required. " +
        `Roles: ${STAFF_ROLES.join(", ")}`,
    );
  }

  if (!isStaffRole(role)) {
    throw new Error(`Unknown role "${role}". Roles: ${STAFF_ROLES.join(", ")}`);
  }

  const [organization] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.slug, orgSlug))
    .limit(1);

  if (!organization) {
    throw new Error(`No organization with slug "${orgSlug}".`);
  }

  const requestedLocations = (values.locations ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const matchedLocations = requestedLocations.length
    ? await db
        .select({ id: locations.id, name: locations.name })
        .from(locations)
        .where(
          and(
            eq(locations.organizationId, organization.id),
            inArray(locations.name, requestedLocations),
          ),
        )
    : [];

  const missing = requestedLocations.filter(
    (requested) => !matchedLocations.some((match) => match.name === requested),
  );
  if (missing.length > 0) {
    throw new Error(
      `These sites do not exist in ${organization.name}: ${missing.join(", ")}`,
    );
  }

  if (role !== "executive_director" && matchedLocations.length === 0) {
    throw new Error(
      "Every role except executive_director needs at least one --locations entry.",
    );
  }

  const password = values.password ?? generatePassword();
  const provisioningAuth = buildAuth({ allowSignUp: true });

  const created = await provisioningAuth.api.signUpEmail({
    body: { email, password, name },
  });

  await db
    .update(user)
    .set({
      role,
      organizationId: organization.id,
      jobTitle: values.title?.trim() ?? null,
      isActive: true,
    })
    .where(eq(user.id, created.user.id));

  if (matchedLocations.length > 0) {
    const primaryName = values.primary?.trim() ?? matchedLocations[0]?.name;
    await db.insert(staffLocations).values(
      matchedLocations.map((location) => ({
        userId: created.user.id,
        locationId: location.id,
        isPrimary: location.name === primaryName,
      })),
    );
  }

  console.log(`Created ${name} <${email}> as ${role} in ${organization.name}.`);
  if (matchedLocations.length > 0) {
    console.log(`Sites: ${matchedLocations.map((l) => l.name).join(", ")}`);
  }
  if (!values.password) {
    console.log(`Temporary password: ${password}`);
    console.log("Share it over a trusted channel and have them change it.");
  }
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error(
      `\nCould not create the account: ${error instanceof Error ? error.message : error}`,
    );
    await pool.end();
    process.exit(1);
  });
