/**
 * Seed a development or demo database with entirely fictional data.
 *
 * Run with `npm run db:seed`. The script refuses to touch a database that
 * already contains a real (non-demo) organization, deletes and recreates the
 * demo organization otherwise, and creates the four demo staff accounts
 * through Better Auth so their passwords are hashed the same way a real
 * account's would be.
 */
import { eq, inArray, ne } from "drizzle-orm";

import { db, pool } from "@/db";
import {
  DEMO_ACCOUNTS,
  DEMO_LOCATIONS,
  DEMO_ORGANIZATION,
} from "@/db/demo-accounts";
import {
  actionSubmissions,
  auditLogs,
  followUpRequests,
  inventoryItems,
  inventoryTransactions,
  locations,
  maintenanceTickets,
  occupancySnapshots,
  organizations,
  shiftLogEntries,
  staffLocations,
  user,
} from "@/db/schema";
import { buildAuth } from "@/lib/auth";
import { env } from "@/lib/env";
import { currentShift, previousShift } from "@/lib/shift";

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * HOUR);
}

async function assertSafeToSeed() {
  const foreign = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(ne(organizations.slug, DEMO_ORGANIZATION.slug))
    .limit(1);

  if (foreign.length > 0) {
    throw new Error(
      `Refusing to seed: this database already contains "${foreign[0]?.name}". ` +
        "Seeding is for empty development or demo databases only.",
    );
  }
}

async function clearExistingDemoData() {
  const emails = DEMO_ACCOUNTS.map((account) => account.email);

  // Deleting the organization cascades to locations, tickets, inventory, log
  // entries, follow-ups, submissions and audit records.
  await db
    .delete(organizations)
    .where(eq(organizations.slug, DEMO_ORGANIZATION.slug));

  // Users are not cascaded (their organization link is ON DELETE SET NULL), so
  // remove the demo accounts explicitly; sessions and credentials cascade.
  await db.delete(user).where(inArray(user.email, emails));
}

async function main() {
  console.log(`Seeding ${env.DATABASE_URL.replace(/:\/\/.*@/, "://***@")}`);

  await assertSafeToSeed();
  await clearExistingDemoData();

  const [organization] = await db
    .insert(organizations)
    .values({
      name: DEMO_ORGANIZATION.name,
      slug: DEMO_ORGANIZATION.slug,
      timezone: DEMO_ORGANIZATION.timezone,
    })
    .returning({ id: organizations.id });

  if (!organization) throw new Error("Failed to create the demo organization.");

  const insertedLocations = await db
    .insert(locations)
    .values(
      DEMO_LOCATIONS.map((location) => ({
        organizationId: organization.id,
        name: location.name,
        kind: location.kind,
        bedCapacity: location.bedCapacity,
      })),
    )
    .returning({ id: locations.id, name: locations.name });

  const locationId = (name: string): string => {
    const match = insertedLocations.find((location) => location.name === name);
    if (!match) throw new Error(`Missing seeded location: ${name}`);
    return match.id;
  };

  const cedar = locationId("Cedar Street Shelter");
  const hawthorne = locationId("Hawthorne Family Shelter");
  const office = locationId("Mill District Office");

  // Sign-up is disabled on the served app; the seeder opts in locally so that
  // passwords go through Better Auth's hashing rather than being written by hand.
  const provisioningAuth = buildAuth({ allowSignUp: true });
  const userIds = new Map<string, string>();

  for (const account of DEMO_ACCOUNTS) {
    const created = await provisioningAuth.api.signUpEmail({
      body: {
        email: account.email,
        password: env.SEED_DEMO_PASSWORD,
        name: account.name,
      },
    });

    const createdId = created.user.id;
    userIds.set(account.email, createdId);

    await db
      .update(user)
      .set({
        role: account.role,
        organizationId: organization.id,
        jobTitle: account.jobTitle,
        isActive: true,
        emailVerified: true,
      })
      .where(eq(user.id, createdId));

    await db.insert(staffLocations).values(
      account.locations.map((name) => ({
        userId: createdId,
        locationId: locationId(name),
        isPrimary: name === account.primaryLocation,
      })),
    );
  }

  const staffId = (email: string): string => {
    const id = userIds.get(email);
    if (!id) throw new Error(`Missing seeded user: ${email}`);
    return id;
  };

  const jamie = staffId("jamie.rivera@example.org");
  const morgan = staffId("morgan.diaz@example.org");
  const priya = staffId("priya.nakamura@example.org");
  const dana = staffId("dana.whitfield@example.org");

  await db.insert(occupancySnapshots).values([
    {
      locationId: cedar,
      bedsOccupied: 41,
      bedsOffline: 2,
      note: "Two beds down in Dorm B until the heater is fixed.",
      recordedByUserId: jamie,
      recordedAt: hoursAgo(2),
    },
    {
      locationId: cedar,
      bedsOccupied: 44,
      bedsOffline: 0,
      recordedByUserId: jamie,
      recordedAt: hoursAgo(14),
    },
    {
      locationId: hawthorne,
      bedsOccupied: 19,
      bedsOffline: 0,
      note: "Three family rooms open.",
      recordedByUserId: priya,
      recordedAt: hoursAgo(3),
    },
  ]);

  const items = await db
    .insert(inventoryItems)
    .values([
      {
        organizationId: organization.id,
        locationId: cedar,
        name: "Body wash",
        category: "hygiene",
        unit: "case",
        quantity: 2,
        lowStockThreshold: 4,
      },
      {
        organizationId: organization.id,
        locationId: cedar,
        name: "Towels",
        category: "linens",
        unit: "each",
        quantity: 36,
        lowStockThreshold: 20,
      },
      {
        organizationId: organization.id,
        locationId: cedar,
        name: "Socks",
        category: "clothing",
        unit: "pair",
        quantity: 14,
        lowStockThreshold: 25,
      },
      {
        organizationId: organization.id,
        locationId: cedar,
        name: "Bus passes",
        category: "transit",
        unit: "each",
        quantity: 31,
        lowStockThreshold: 15,
      },
      {
        organizationId: organization.id,
        locationId: cedar,
        name: "Sharps containers",
        category: "safety",
        unit: "each",
        quantity: 3,
        lowStockThreshold: 3,
      },
      {
        organizationId: organization.id,
        locationId: hawthorne,
        name: "Diapers size 4",
        category: "family",
        unit: "pack",
        quantity: 6,
        lowStockThreshold: 10,
      },
      {
        organizationId: organization.id,
        locationId: hawthorne,
        name: "Baby formula",
        category: "family",
        unit: "can",
        quantity: 11,
        lowStockThreshold: 8,
      },
      {
        organizationId: organization.id,
        locationId: hawthorne,
        name: "Laundry detergent",
        category: "housekeeping",
        unit: "bottle",
        quantity: 9,
        lowStockThreshold: 6,
      },
      {
        organizationId: organization.id,
        locationId: office,
        name: "Printer paper",
        category: "office",
        unit: "ream",
        quantity: 12,
        lowStockThreshold: 5,
      },
    ])
    .returning({ id: inventoryItems.id, name: inventoryItems.name });

  const itemId = (name: string): string => {
    const match = items.find((item) => item.name === name);
    if (!match) throw new Error(`Missing seeded item: ${name}`);
    return match.id;
  };

  await db.insert(inventoryTransactions).values([
    {
      itemId: itemId("Body wash"),
      delta: -2,
      quantityAfter: 2,
      reason: "Used on shift (restock run due Thursday)",
      createdByUserId: jamie,
      createdAt: hoursAgo(13),
    },
    {
      itemId: itemId("Socks"),
      delta: -11,
      quantityAfter: 14,
      reason: "Handed out during cold snap",
      createdByUserId: jamie,
      createdAt: hoursAgo(20),
    },
    {
      itemId: itemId("Diapers size 4"),
      delta: -4,
      quantityAfter: 6,
      reason: "Family intake kits",
      createdByUserId: priya,
      createdAt: hoursAgo(26),
    },
  ]);

  const tickets = await db
    .insert(maintenanceTickets)
    .values([
      {
        organizationId: organization.id,
        locationId: cedar,
        title: "Heater in Dorm B making a grinding noise",
        description:
          "Grinding started around 11pm and the room is noticeably colder. Two beds pulled offline until it is looked at.",
        area: "Dorm B",
        priority: "urgent",
        status: "in_progress",
        createdByUserId: jamie,
        createdAt: hoursAgo(9),
        updatedAt: hoursAgo(4),
      },
      {
        organizationId: organization.id,
        locationId: cedar,
        title: "Men's restroom sink draining slowly",
        description: "Standing water after about a minute of use.",
        area: "Restroom",
        priority: "medium",
        status: "open",
        createdByUserId: jamie,
        createdAt: hoursAgo(30),
        updatedAt: hoursAgo(30),
      },
      {
        organizationId: organization.id,
        locationId: cedar,
        title: "Exterior door latch sticks when it is cold",
        area: "Front entry",
        priority: "high",
        status: "blocked",
        description: "Vendor says the part is on order.",
        createdByUserId: priya,
        createdAt: hoursAgo(72),
        updatedAt: hoursAgo(20),
      },
      {
        organizationId: organization.id,
        locationId: hawthorne,
        title: "Playroom light flickering",
        area: "Playroom",
        priority: "low",
        status: "open",
        createdByUserId: priya,
        createdAt: hoursAgo(50),
        updatedAt: hoursAgo(50),
      },
      {
        organizationId: organization.id,
        locationId: hawthorne,
        title: "Dryer on the second floor not heating",
        area: "Laundry",
        priority: "high",
        status: "resolved",
        resolutionNote: "Vent was blocked; cleared and tested.",
        createdByUserId: priya,
        createdAt: hoursAgo(96),
        updatedAt: hoursAgo(60),
        resolvedAt: hoursAgo(60),
      },
    ])
    .returning({ id: maintenanceTickets.id, title: maintenanceTickets.title });

  const shift = currentShift(DEMO_ORGANIZATION.timezone);
  const lastShift = previousShift(shift);

  await db.insert(shiftLogEntries).values([
    {
      organizationId: organization.id,
      locationId: cedar,
      shift: lastShift,
      category: "maintenance",
      severity: "urgent",
      body:
        "Heater in Dorm B started grinding around 11pm. Moved two residents to open beds in Dorm A and pulled those beds offline.",
      createdByUserId: jamie,
      occurredAt: hoursAgo(9),
    },
    {
      organizationId: organization.id,
      locationId: cedar,
      shift: lastShift,
      category: "inventory",
      severity: "attention",
      body: "Down to 2 cases of body wash. Flagged for the Thursday supply run.",
      createdByUserId: jamie,
      occurredAt: hoursAgo(8),
    },
    {
      organizationId: organization.id,
      locationId: cedar,
      shift: lastShift,
      category: "resident_support",
      severity: "info",
      body:
        "Bed 14 asked to be put on the list for a case manager — needs help replacing a state ID.",
      createdByUserId: jamie,
      occurredAt: hoursAgo(7),
    },
    {
      organizationId: organization.id,
      locationId: cedar,
      shift: lastShift,
      category: "handoff",
      severity: "info",
      body: "Quiet night otherwise. Three late arrivals, all checked in by 1am.",
      createdByUserId: jamie,
      occurredAt: hoursAgo(6),
    },
    {
      organizationId: organization.id,
      locationId: hawthorne,
      shift: lastShift,
      category: "general",
      severity: "info",
      body: "Family in room 3 exited to permanent housing. Room turned over and ready.",
      createdByUserId: priya,
      occurredAt: hoursAgo(11),
    },
    {
      organizationId: organization.id,
      locationId: cedar,
      shift,
      category: "incident",
      severity: "attention",
      body:
        "Verbal argument in the dayroom at shift change. De-escalated, both parties agreed to separate for the evening. No injuries, no police contact.",
      createdByUserId: priya,
      occurredAt: hoursAgo(2),
    },
  ]);

  await db.insert(followUpRequests).values([
    {
      organizationId: organization.id,
      locationId: cedar,
      subject: "Bed 14 — state ID replacement",
      details:
        "Asked overnight staff about replacing a state ID. Needs the DMV form and a bus pass.",
      urgency: "soon",
      status: "pending",
      requestedByUserId: jamie,
      createdAt: hoursAgo(7),
      updatedAt: hoursAgo(7),
    },
    {
      organizationId: organization.id,
      locationId: cedar,
      subject: "Bed 2 — missed two appointments",
      details: "No case note in three weeks. Wellness check suggested.",
      urgency: "routine",
      status: "acknowledged",
      requestedByUserId: priya,
      acknowledgedByUserId: morgan,
      createdAt: hoursAgo(40),
      updatedAt: hoursAgo(18),
    },
    {
      organizationId: organization.id,
      locationId: hawthorne,
      subject: "Room 5 — childcare voucher paperwork",
      urgency: "routine",
      status: "closed",
      details: "Packet handed over and submitted.",
      resolutionNote: "Submitted 2 days ago; confirmation received.",
      requestedByUserId: priya,
      acknowledgedByUserId: morgan,
      createdAt: hoursAgo(90),
      updatedAt: hoursAgo(44),
    },
  ]);

  const [submission] = await db
    .insert(actionSubmissions)
    .values({
      organizationId: organization.id,
      locationId: cedar,
      submittedByUserId: jamie,
      inputText:
        "Heater in Dorm B is making a grinding noise and it's cold in there. Also we're down to 2 cases of body wash.",
      classifier: "keyword",
      proposals: [
        {
          kind: "maintenance_ticket",
          title: "Heater in Dorm B is making a grinding noise",
          area: "Dorm B",
          priority: "urgent",
        },
        {
          kind: "inventory_adjustment",
          itemName: "Body wash",
          adjustmentType: "set",
          amount: 2,
          reason: "Count reported on shift",
        },
        {
          kind: "shift_log_note",
          body: "Heater in Dorm B started grinding around 11pm.",
          category: "maintenance",
          severity: "urgent",
        },
      ],
      status: "confirmed",
      createdAt: hoursAgo(9),
      decidedAt: new Date(hoursAgo(9).getTime() + 2 * MINUTE),
    })
    .returning({ id: actionSubmissions.id });

  await db.insert(auditLogs).values([
    {
      organizationId: organization.id,
      actorUserId: jamie,
      actorName: "Jamie Rivera",
      actorRole: "site_assistant",
      action: "action_submission.confirm",
      entityType: "action_submission",
      entityId: submission?.id ?? null,
      locationId: cedar,
      summary: "Confirmed 3 AI-proposed actions",
      metadata: { classifier: "keyword" },
      createdAt: hoursAgo(9),
    },
    {
      organizationId: organization.id,
      actorUserId: jamie,
      actorName: "Jamie Rivera",
      actorRole: "site_assistant",
      action: "maintenance_ticket.create",
      entityType: "maintenance_ticket",
      entityId: tickets[0]?.id ?? null,
      locationId: cedar,
      summary:
        'Opened urgent priority ticket "Heater in Dorm B making a grinding noise" from the Action Button',
      createdAt: hoursAgo(9),
    },
    {
      organizationId: organization.id,
      actorUserId: priya,
      actorName: "Priya Nakamura",
      actorRole: "shelter_manager",
      action: "maintenance_ticket.update_status",
      entityType: "maintenance_ticket",
      entityId: tickets[0]?.id ?? null,
      locationId: cedar,
      summary:
        'Moved ticket "Heater in Dorm B making a grinding noise" from open to in_progress',
      metadata: { from: "open", to: "in_progress" },
      createdAt: hoursAgo(4),
    },
    {
      organizationId: organization.id,
      actorUserId: morgan,
      actorName: "Morgan Diaz",
      actorRole: "case_manager",
      action: "follow_up_request.update_status",
      entityType: "follow_up_request",
      locationId: cedar,
      summary: 'Marked follow-up "Bed 2 — missed two appointments" as acknowledged',
      metadata: { from: "pending", to: "acknowledged" },
      createdAt: hoursAgo(18),
    },
    {
      organizationId: organization.id,
      actorUserId: dana,
      actorName: "Dana Whitfield",
      actorRole: "executive_director",
      action: "occupancy_snapshot.create",
      entityType: "occupancy_snapshot",
      locationId: hawthorne,
      summary: "Counted 19 of 24 beds occupied at Hawthorne Family Shelter",
      createdAt: hoursAgo(3),
    },
  ]);

  console.log("\nSeeded the demo organization:");
  console.log(`  ${DEMO_ORGANIZATION.name}`);
  console.log(`  ${DEMO_LOCATIONS.map((l) => l.name).join(", ")}`);
  console.log("\nDemo accounts (password from SEED_DEMO_PASSWORD):");
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${account.email.padEnd(32)} ${account.role}`);
  }
  console.log(`\nPassword: ${env.SEED_DEMO_PASSWORD}`);
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\nSeed failed:", error);
    await pool.end();
    process.exit(1);
  });
