/**
 * ActionOS domain schema.
 *
 * Deliberately *not* in here: anything that stores client / resident personally
 * identifying information. v1 tracks the building, the supplies and the shift —
 * bed counts, tickets, stock and log notes. Resident-level records wait until
 * the security review described in the README roadmap.
 */
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

import type { ActionProposal } from "@/lib/action/types";

import { user } from "./auth";
import {
  classifierKind,
  followUpStatus,
  followUpUrgency,
  locationKind,
  logCategory,
  logSeverity,
  shiftName,
  submissionStatus,
  ticketPriority,
  ticketStatus,
} from "./enums";

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  timezone: text("timezone").default("America/Los_Angeles").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const locations = pgTable(
  "locations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: locationKind("kind").default("shelter").notNull(),
    /** Total beds at this site. 0 for offices and outreach teams. */
    bedCapacity: integer("bed_capacity").default(0).notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("locations_organization_idx").on(table.organizationId),
    unique("locations_org_name_unique").on(table.organizationId, table.name),
  ],
);

/**
 * Which sites a staff member can see. Float staff cover several; an executive
 * director is scoped to the whole organization by role instead of by rows here.
 */
export const staffLocations = pgTable(
  "staff_locations",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.locationId] }),
    index("staff_locations_location_idx").on(table.locationId),
  ],
);

/** Point-in-time bed counts. Counts only — no resident records. */
export const occupancySnapshots = pgTable(
  "occupancy_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    bedsOccupied: integer("beds_occupied").notNull(),
    bedsOffline: integer("beds_offline").default(0).notNull(),
    note: text("note"),
    recordedByUserId: text("recorded_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    recordedAt: timestamp("recorded_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("occupancy_location_recorded_idx").on(
      table.locationId,
      table.recordedAt,
    ),
  ],
);

export const maintenanceTickets = pgTable(
  "maintenance_tickets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    /** Free text such as "Dorm B" or "Kitchen". */
    area: text("area"),
    priority: ticketPriority("priority").default("medium").notNull(),
    status: ticketStatus("status").default("open").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    assignedToUserId: text("assigned_to_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    resolutionNote: text("resolution_note"),
    sourceSubmissionId: uuid("source_submission_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  },
  (table) => [
    index("tickets_location_status_idx").on(table.locationId, table.status),
    index("tickets_org_status_idx").on(table.organizationId, table.status),
  ],
);

export const inventoryItems = pgTable(
  "inventory_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    category: text("category").default("general").notNull(),
    /** "case", "box", "each" — whatever staff count in. */
    unit: text("unit").default("each").notNull(),
    quantity: integer("quantity").default(0).notNull(),
    lowStockThreshold: integer("low_stock_threshold").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("inventory_location_idx").on(table.locationId),
    unique("inventory_location_name_unique").on(table.locationId, table.name),
  ],
);

export const inventoryTransactions = pgTable(
  "inventory_transactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    itemId: uuid("item_id")
      .notNull()
      .references(() => inventoryItems.id, { onDelete: "cascade" }),
    /** Signed change; -6 for "used six cases". */
    delta: integer("delta").notNull(),
    quantityAfter: integer("quantity_after").notNull(),
    reason: text("reason").notNull(),
    note: text("note"),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    sourceSubmissionId: uuid("source_submission_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [index("inventory_tx_item_idx").on(table.itemId, table.createdAt)],
);

export const shiftLogEntries = pgTable(
  "shift_log_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    shift: shiftName("shift").default("day").notNull(),
    category: logCategory("category").default("general").notNull(),
    severity: logSeverity("severity").default("info").notNull(),
    body: text("body").notNull(),
    createdByUserId: text("created_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    sourceSubmissionId: uuid("source_submission_id"),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("shift_log_location_occurred_idx").on(
      table.locationId,
      table.occurredAt,
    ),
  ],
);

/**
 * "Someone should talk to the person in room 4" — a request for case management
 * attention. Staff are told not to put names in here; `subject` is for a room,
 * bed or initials.
 */
export const followUpRequests = pgTable(
  "follow_up_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    subject: text("subject").notNull(),
    details: text("details"),
    urgency: followUpUrgency("urgency").default("routine").notNull(),
    status: followUpStatus("status").default("pending").notNull(),
    requestedByUserId: text("requested_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    acknowledgedByUserId: text("acknowledged_by_user_id").references(
      () => user.id,
      { onDelete: "set null" },
    ),
    resolutionNote: text("resolution_note"),
    sourceSubmissionId: uuid("source_submission_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("follow_ups_location_status_idx").on(table.locationId, table.status),
  ],
);

/**
 * Every Action Button submission, with the proposals the classifier produced
 * and whether a human confirmed them. This is the record of "AI recommended,
 * human decided".
 */
export const actionSubmissions = pgTable(
  "action_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    locationId: uuid("location_id")
      .notNull()
      .references(() => locations.id, { onDelete: "cascade" }),
    submittedByUserId: text("submitted_by_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    inputText: text("input_text").notNull(),
    classifier: classifierKind("classifier").notNull(),
    model: text("model"),
    proposals: jsonb("proposals").$type<ActionProposal[]>().notNull(),
    status: submissionStatus("status").default("proposed").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (table) => [
    index("submissions_org_created_idx").on(table.organizationId, table.createdAt),
  ],
);

/** Append-only record of who did what, when, and to which record. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").references(() => user.id, {
      onDelete: "set null",
    }),
    actorName: text("actor_name").notNull(),
    actorRole: text("actor_role").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    locationId: uuid("location_id").references(() => locations.id, {
      onDelete: "set null",
    }),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("audit_org_created_idx").on(table.organizationId, table.createdAt),
    index("audit_entity_idx").on(table.entityType, table.entityId),
  ],
);

export const organizationRelations = relations(organizations, ({ many }) => ({
  locations: many(locations),
  staff: many(user),
}));

export const locationRelations = relations(locations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [locations.organizationId],
    references: [organizations.id],
  }),
  staffLocations: many(staffLocations),
  tickets: many(maintenanceTickets),
  inventoryItems: many(inventoryItems),
  shiftLogEntries: many(shiftLogEntries),
}));

export const staffLocationRelations = relations(staffLocations, ({ one }) => ({
  user: one(user, {
    fields: [staffLocations.userId],
    references: [user.id],
  }),
  location: one(locations, {
    fields: [staffLocations.locationId],
    references: [locations.id],
  }),
}));

export const maintenanceTicketRelations = relations(
  maintenanceTickets,
  ({ one }) => ({
    location: one(locations, {
      fields: [maintenanceTickets.locationId],
      references: [locations.id],
    }),
    createdBy: one(user, {
      fields: [maintenanceTickets.createdByUserId],
      references: [user.id],
    }),
  }),
);

export const inventoryItemRelations = relations(
  inventoryItems,
  ({ one, many }) => ({
    location: one(locations, {
      fields: [inventoryItems.locationId],
      references: [locations.id],
    }),
    transactions: many(inventoryTransactions),
  }),
);

export const inventoryTransactionRelations = relations(
  inventoryTransactions,
  ({ one }) => ({
    item: one(inventoryItems, {
      fields: [inventoryTransactions.itemId],
      references: [inventoryItems.id],
    }),
  }),
);

export const shiftLogEntryRelations = relations(shiftLogEntries, ({ one }) => ({
  location: one(locations, {
    fields: [shiftLogEntries.locationId],
    references: [locations.id],
  }),
  createdBy: one(user, {
    fields: [shiftLogEntries.createdByUserId],
    references: [user.id],
  }),
}));

export const followUpRequestRelations = relations(
  followUpRequests,
  ({ one }) => ({
    location: one(locations, {
      fields: [followUpRequests.locationId],
      references: [locations.id],
    }),
  }),
);
