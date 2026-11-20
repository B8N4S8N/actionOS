/**
 * Delete every row in the application and auth tables.
 *
 * Intended for development only: `npm run db:reset`. Refuses to run with
 * NODE_ENV=production unless ALLOW_DESTRUCTIVE_RESET=true is also set.
 */
import { sql } from "drizzle-orm";

import { db, pool } from "@/db";

const TABLES = [
  "audit_logs",
  "action_submissions",
  "follow_up_requests",
  "shift_log_entries",
  "inventory_transactions",
  "inventory_items",
  "maintenance_tickets",
  "occupancy_snapshots",
  "staff_locations",
  "session",
  "account",
  "verification",
  "user",
  "locations",
  "organizations",
];

async function main() {
  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_DESTRUCTIVE_RESET !== "true"
  ) {
    throw new Error(
      "Refusing to truncate a production database. Set ALLOW_DESTRUCTIVE_RESET=true if you really mean it.",
    );
  }

  await db.execute(
    sql.raw(`truncate table ${TABLES.map((t) => `"${t}"`).join(", ")} cascade`),
  );

  console.log(`Truncated ${TABLES.length} tables.`);
}

main()
  .then(async () => {
    await pool.end();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("Reset failed:", error);
    await pool.end();
    process.exit(1);
  });
