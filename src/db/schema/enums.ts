import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Staff roles, ordered from front line to executive. The permission matrix in
 * `src/lib/permissions.ts` is keyed off these exact values.
 */
export const staffRole = pgEnum("staff_role", [
  "site_assistant",
  "case_manager",
  "shelter_manager",
  "executive_director",
]);

export const locationKind = pgEnum("location_kind", [
  "shelter",
  "office",
  "outreach",
]);

export const ticketPriority = pgEnum("ticket_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const ticketStatus = pgEnum("ticket_status", [
  "open",
  "in_progress",
  "blocked",
  "resolved",
]);

export const shiftName = pgEnum("shift_name", ["day", "swing", "overnight"]);

export const logCategory = pgEnum("log_category", [
  "general",
  "incident",
  "maintenance",
  "inventory",
  "resident_support",
  "handoff",
]);

export const logSeverity = pgEnum("log_severity", [
  "info",
  "attention",
  "urgent",
]);

export const followUpUrgency = pgEnum("follow_up_urgency", [
  "routine",
  "soon",
  "urgent",
]);

export const followUpStatus = pgEnum("follow_up_status", [
  "pending",
  "acknowledged",
  "closed",
]);

export const submissionStatus = pgEnum("submission_status", [
  "proposed",
  "confirmed",
  "discarded",
]);

export const classifierKind = pgEnum("classifier_kind", ["llm", "keyword"]);
