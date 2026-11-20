"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db";
import { getInventoryItemById } from "@/db/queries/inventory";
import { inventoryItems, inventoryTransactions } from "@/db/schema";
import { requirePermission } from "@/lib/actor";
import { recordAudit } from "@/lib/audit";
import { ValidationError } from "@/lib/errors";
import { assertCanActAtLocation, assertLocationAccess } from "@/lib/permissions";

import { formString, runFormAction, type FormState } from "./shared";

const adjustSchema = z.object({
  itemId: z.string().uuid(),
  adjustmentType: z.enum(["delta", "set"]),
  amount: z.coerce.number().int().min(-100_000).max(100_000),
  reason: z.string().trim().min(3, "Say why the count changed.").max(200),
});

const createItemSchema = z.object({
  locationId: z.string().uuid(),
  name: z.string().trim().min(2, "Name the item.").max(120),
  category: z.string().trim().max(60).optional(),
  unit: z.string().trim().min(1).max(30),
  quantity: z.coerce.number().int().min(0).max(1_000_000),
  lowStockThreshold: z.coerce.number().int().min(0).max(1_000_000),
});

export async function adjustInventoryAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction(async () => {
    const context = await requirePermission("inventory:adjust");
    const input = adjustSchema.parse({
      itemId: formString(formData, "itemId"),
      adjustmentType: formString(formData, "adjustmentType") || "delta",
      amount: formString(formData, "amount"),
      reason: formString(formData, "reason"),
    });

    const item = await getInventoryItemById(input.itemId);
    if (!item) throw new ValidationError("That item no longer exists.");

    assertCanActAtLocation(context.actor, "inventory:adjust", item.locationId);

    if (input.adjustmentType === "set" && input.amount < 0) {
      throw new ValidationError("A new count cannot be negative.");
    }
    if (input.adjustmentType === "delta" && input.amount === 0) {
      throw new ValidationError("A change of zero would not record anything.");
    }

    const requested =
      input.adjustmentType === "set" ? input.amount : item.quantity + input.amount;
    const quantityAfter = Math.max(0, requested);
    const delta = quantityAfter - item.quantity;

    await db.transaction(async (tx) => {
      await tx
        .update(inventoryItems)
        .set({ quantity: quantityAfter, updatedAt: new Date() })
        .where(eq(inventoryItems.id, item.id));

      await tx.insert(inventoryTransactions).values({
        itemId: item.id,
        delta,
        quantityAfter,
        reason: input.reason,
        note:
          requested < 0
            ? `Requested ${requested}; clamped to 0 because stock cannot be negative.`
            : null,
        createdByUserId: context.actor.userId,
      });

      await recordAudit(
        {
          actor: context.actor,
          action: "inventory_item.adjust",
          entityType: "inventory_item",
          entityId: item.id,
          locationId: item.locationId,
          summary: `${item.name}: ${item.quantity} → ${quantityAfter} ${item.unit} (${input.reason})`,
          metadata: { delta, adjustmentType: input.adjustmentType, source: "inventory_form" },
        },
        tx,
      );
    });

    revalidatePath("/inventory");
    revalidatePath("/dashboard");

    return {
      status: "success",
      message: `${item.name} is now ${quantityAfter} ${item.unit}.`,
    };
  });
}

export async function createInventoryItemAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  return runFormAction(async () => {
    const context = await requirePermission("inventory:manage_items");
    const input = createItemSchema.parse({
      locationId: formString(formData, "locationId"),
      name: formString(formData, "name"),
      category: formString(formData, "category") || undefined,
      unit: formString(formData, "unit") || "each",
      quantity: formString(formData, "quantity") || "0",
      lowStockThreshold: formString(formData, "lowStockThreshold") || "0",
    });

    assertLocationAccess(context.actor, input.locationId);

    await db.transaction(async (tx) => {
      const [item] = await tx
        .insert(inventoryItems)
        .values({
          organizationId: context.organization.id,
          locationId: input.locationId,
          name: input.name,
          category: input.category ?? "general",
          unit: input.unit,
          quantity: input.quantity,
          lowStockThreshold: input.lowStockThreshold,
        })
        .onConflictDoNothing()
        .returning({ id: inventoryItems.id });

      if (!item) {
        throw new ValidationError(
          `"${input.name}" already exists at this site. Adjust the existing item instead.`,
        );
      }

      await recordAudit(
        {
          actor: context.actor,
          action: "inventory_item.create",
          entityType: "inventory_item",
          entityId: item.id,
          locationId: input.locationId,
          summary: `Added inventory item ${input.name} (${input.quantity} ${input.unit}, low below ${input.lowStockThreshold})`,
        },
        tx,
      );
    });

    revalidatePath("/inventory");

    return { status: "success", message: `${input.name} added.` };
  });
}
