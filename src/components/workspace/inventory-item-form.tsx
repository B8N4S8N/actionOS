"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton, inputClass } from "@/components/ui/form";
import type { LocationSummary } from "@/lib/actor";
import { createInventoryItemAction } from "@/server/actions/inventory";
import { idleState } from "@/server/actions/shared";

export function InventoryItemForm({
  locations,
  defaultLocationId,
}: {
  locations: LocationSummary[];
  defaultLocationId?: string | null;
}) {
  const [state, formAction] = useActionState(
    createInventoryItemAction,
    idleState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Site">
        <select
          name="locationId"
          defaultValue={defaultLocationId ?? locations[0]?.id}
          className={inputClass}
        >
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Item">
        <input name="name" required className={inputClass} placeholder="Body wash" />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Unit" hint="case, pair, each…">
          <input name="unit" required defaultValue="each" className={inputClass} />
        </Field>
        <Field label="Category">
          <input name="category" className={inputClass} placeholder="hygiene" />
        </Field>
        <Field label="On hand">
          <input
            name="quantity"
            type="number"
            min={0}
            defaultValue={0}
            className={inputClass}
          />
        </Field>
        <Field label="Low below" hint="Alert at or under this count">
          <input
            name="lowStockThreshold"
            type="number"
            min={0}
            defaultValue={0}
            className={inputClass}
          />
        </Field>
      </div>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Adding…">Add item</SubmitButton>
    </form>
  );
}
