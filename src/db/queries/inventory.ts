import { and, asc, desc, eq, inArray, lte, sql } from "drizzle-orm";

import { db } from "@/db";
import { inventoryItems, inventoryTransactions, locations, user } from "@/db/schema";

export interface InventoryItemRow {
  id: string;
  name: string;
  category: string;
  unit: string;
  quantity: number;
  lowStockThreshold: number;
  locationId: string;
  locationName: string;
  updatedAt: Date;
  isLow: boolean;
}

export async function listInventory(
  locationIds: readonly string[],
): Promise<InventoryItemRow[]> {
  if (locationIds.length === 0) return [];

  const rows = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      category: inventoryItems.category,
      unit: inventoryItems.unit,
      quantity: inventoryItems.quantity,
      lowStockThreshold: inventoryItems.lowStockThreshold,
      locationId: inventoryItems.locationId,
      locationName: locations.name,
      updatedAt: inventoryItems.updatedAt,
    })
    .from(inventoryItems)
    .innerJoin(locations, eq(inventoryItems.locationId, locations.id))
    .where(inArray(inventoryItems.locationId, [...locationIds]))
    .orderBy(asc(locations.name), asc(inventoryItems.name));

  return rows.map((row) => ({
    ...row,
    isLow: row.quantity <= row.lowStockThreshold,
  }));
}

export async function listLowStock(
  locationIds: readonly string[],
): Promise<InventoryItemRow[]> {
  if (locationIds.length === 0) return [];

  const rows = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      category: inventoryItems.category,
      unit: inventoryItems.unit,
      quantity: inventoryItems.quantity,
      lowStockThreshold: inventoryItems.lowStockThreshold,
      locationId: inventoryItems.locationId,
      locationName: locations.name,
      updatedAt: inventoryItems.updatedAt,
    })
    .from(inventoryItems)
    .innerJoin(locations, eq(inventoryItems.locationId, locations.id))
    .where(
      and(
        inArray(inventoryItems.locationId, [...locationIds]),
        lte(inventoryItems.quantity, inventoryItems.lowStockThreshold),
      ),
    )
    .orderBy(
      asc(sql`${inventoryItems.quantity} - ${inventoryItems.lowStockThreshold}`),
      asc(inventoryItems.name),
    );

  return rows.map((row) => ({ ...row, isLow: true }));
}

export interface InventoryTransactionRow {
  id: string;
  itemName: string;
  unit: string;
  delta: number;
  quantityAfter: number;
  reason: string;
  note: string | null;
  authorName: string | null;
  createdAt: Date;
}

export async function listRecentInventoryActivity(
  locationIds: readonly string[],
  limit = 20,
): Promise<InventoryTransactionRow[]> {
  if (locationIds.length === 0) return [];

  return db
    .select({
      id: inventoryTransactions.id,
      itemName: inventoryItems.name,
      unit: inventoryItems.unit,
      delta: inventoryTransactions.delta,
      quantityAfter: inventoryTransactions.quantityAfter,
      reason: inventoryTransactions.reason,
      note: inventoryTransactions.note,
      authorName: user.name,
      createdAt: inventoryTransactions.createdAt,
    })
    .from(inventoryTransactions)
    .innerJoin(inventoryItems, eq(inventoryTransactions.itemId, inventoryItems.id))
    .leftJoin(user, eq(inventoryTransactions.createdByUserId, user.id))
    .where(inArray(inventoryItems.locationId, [...locationIds]))
    .orderBy(desc(inventoryTransactions.createdAt))
    .limit(limit);
}

export async function getInventoryItemById(id: string) {
  const [row] = await db
    .select({
      id: inventoryItems.id,
      name: inventoryItems.name,
      unit: inventoryItems.unit,
      quantity: inventoryItems.quantity,
      lowStockThreshold: inventoryItems.lowStockThreshold,
      locationId: inventoryItems.locationId,
      organizationId: inventoryItems.organizationId,
    })
    .from(inventoryItems)
    .where(eq(inventoryItems.id, id))
    .limit(1);

  return row ?? null;
}
