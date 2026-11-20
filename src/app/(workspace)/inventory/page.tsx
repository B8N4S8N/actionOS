import type { Metadata } from "next";

import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { AccessDenied } from "@/components/workspace/access-denied";
import { InventoryItemForm } from "@/components/workspace/inventory-item-form";
import { InventoryTable } from "@/components/workspace/inventory-table";
import { formatWhen } from "@/components/workspace/lists";
import { PageHeader } from "@/components/workspace/page-header";
import { StatCard } from "@/components/workspace/stat-card";
import {
  listInventory,
  listRecentInventoryActivity,
} from "@/db/queries/inventory";
import { requireActorContext } from "@/lib/actor";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const context = await requireActorContext();

  if (!hasPermission(context.actor, "inventory:read")) {
    return (
      <AccessDenied permission="inventory:read" role={context.actor.role} />
    );
  }

  const locationIds = context.locations.map((location) => location.id);
  const [items, activity] = await Promise.all([
    listInventory(locationIds),
    listRecentInventoryActivity(locationIds, 15),
  ]);

  const canAdjust = hasPermission(context.actor, "inventory:adjust");
  const canManage = hasPermission(context.actor, "inventory:manage_items");
  const low = items.filter((item) => item.isLow);

  return (
    <>
      <PageHeader
        title="Inventory"
        description={
          canAdjust
            ? "Counts per site. Every change records who made it and why."
            : "Counts per site, read-only for your role."
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Items tracked" value={items.length} />
        <StatCard
          label="At or below threshold"
          value={low.length}
          tone={low.length > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Out of stock"
          value={items.filter((item) => item.quantity === 0).length}
          tone={
            items.some((item) => item.quantity === 0) ? "danger" : "neutral"
          }
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Stock"
              description={
                canAdjust
                  ? "Adjust a count with a reason, or use the Action Button."
                  : undefined
              }
            />
            <CardBody className="py-0">
              <InventoryTable
                items={items}
                canAdjust={canAdjust}
                showLocation={context.locations.length > 1}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Recent changes"
              description="Signed history of every adjustment."
            />
            <CardBody>
              {activity.length === 0 ? (
                <EmptyState>No adjustments recorded yet.</EmptyState>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {activity.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex items-start justify-between gap-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-slate-800">
                          <span className="font-semibold">{entry.itemName}</span>{" "}
                          {entry.reason}
                        </p>
                        <p className="text-xs text-slate-500">
                          {entry.authorName ?? "Unknown"} ·{" "}
                          {formatWhen(entry.createdAt)}
                          {entry.note ? ` · ${entry.note}` : ""}
                        </p>
                      </div>
                      <p className="text-right text-sm font-semibold whitespace-nowrap">
                        <span
                          className={
                            entry.delta < 0 ? "text-rose-700" : "text-emerald-700"
                          }
                        >
                          {entry.delta > 0 ? "+" : ""}
                          {entry.delta}
                        </span>
                        <span className="block text-xs font-normal text-slate-500">
                          → {entry.quantityAfter} {entry.unit}
                        </span>
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        {canManage ? (
          <div>
            <Card>
              <CardHeader
                title="Add an item"
                description="Managers set what is tracked and where the low-stock line sits."
              />
              <CardBody>
                <InventoryItemForm
                  locations={context.locations}
                  defaultLocationId={context.actor.primaryLocationId}
                />
              </CardBody>
            </Card>
          </div>
        ) : null}
      </div>
    </>
  );
}
