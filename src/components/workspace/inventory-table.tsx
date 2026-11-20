"use client";

import { useActionState, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { FormMessage, SubmitButton, inputClass } from "@/components/ui/form";
import type { InventoryItemRow } from "@/db/queries/inventory";
import { cn } from "@/lib/cn";
import { adjustInventoryAction } from "@/server/actions/inventory";
import { idleState } from "@/server/actions/shared";

/** Inventory list with an inline adjust form per item. */
export function InventoryTable({
  items,
  canAdjust,
  showLocation,
}: {
  items: InventoryItemRow[];
  canAdjust: boolean;
  showLocation: boolean;
}) {
  const [openItemId, setOpenItemId] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-slate-500">
        No inventory items at your sites yet.
      </p>
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                {item.name}
                {item.isLow ? (
                  <Badge tone={item.quantity === 0 ? "danger" : "warning"}>
                    {item.quantity === 0 ? "out of stock" : "low"}
                  </Badge>
                ) : null}
              </p>
              <p className="text-xs text-slate-500">
                {[showLocation ? item.locationName : null, item.category]
                  .filter(Boolean)
                  .join(" · ")}{" "}
                · threshold {item.lowStockThreshold} {item.unit}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <p className="text-right text-sm font-semibold text-slate-900">
                {item.quantity}
                <span className="ml-1 text-xs font-normal text-slate-500">
                  {item.unit}
                </span>
              </p>
              {canAdjust ? (
                <button
                  type="button"
                  onClick={() =>
                    setOpenItemId(openItemId === item.id ? null : item.id)
                  }
                  className="rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
                >
                  {openItemId === item.id ? "Cancel" : "Adjust"}
                </button>
              ) : null}
            </div>
          </div>

          {canAdjust && openItemId === item.id ? (
            <AdjustForm item={item} onDone={() => setOpenItemId(null)} />
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function AdjustForm({
  item,
  onDone,
}: {
  item: InventoryItemRow;
  onDone: () => void;
}) {
  const [state, formAction] = useActionState(adjustInventoryAction, idleState);

  if (state.status === "success") {
    return (
      <div className="mt-3">
        <FormMessage state={state} />
        <button
          type="button"
          onClick={onDone}
          className="mt-2 text-sm font-semibold text-brand-700 hover:underline"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="mt-3 space-y-2">
      <input type="hidden" name="itemId" value={item.id} />
      <div className="flex flex-wrap items-center gap-2">
        <select
          name="adjustmentType"
          defaultValue="delta"
          className={cn(inputClass, "w-auto py-1.5")}
          aria-label="Adjustment type"
        >
          <option value="delta">Add / subtract</option>
          <option value="set">Set new count</option>
        </select>
        <input
          name="amount"
          type="number"
          required
          placeholder="-6"
          className={cn(inputClass, "w-24 py-1.5")}
          aria-label="Amount"
        />
        <input
          name="reason"
          required
          placeholder="Used on shift"
          className={cn(inputClass, "w-auto flex-1 py-1.5")}
          aria-label="Reason"
        />
        <SubmitButton variant="secondary" pendingLabel="Saving…">
          Save
        </SubmitButton>
      </div>
      <FormMessage state={state} />
    </form>
  );
}
