"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton, inputClass } from "@/components/ui/form";
import type { LocationSummary } from "@/lib/actor";
import { recordOccupancyAction } from "@/server/actions/shift-log";
import { idleState } from "@/server/actions/shared";

export function OccupancyForm({
  locations,
  defaultLocationId,
}: {
  locations: LocationSummary[];
  defaultLocationId?: string | null;
}) {
  const [state, formAction] = useActionState(recordOccupancyAction, idleState);
  const bedLocations = locations.filter((location) => location.bedCapacity > 0);

  if (bedLocations.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        None of your sites have beds to count.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Site" className="sm:col-span-2">
          <select
            name="locationId"
            defaultValue={defaultLocationId ?? bedLocations[0]?.id}
            className={inputClass}
          >
            {bedLocations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name} ({location.bedCapacity} beds)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Beds occupied">
          <input
            name="bedsOccupied"
            type="number"
            min={0}
            required
            className={inputClass}
          />
        </Field>
        <Field label="Beds offline" hint="Out of service, e.g. no heat">
          <input
            name="bedsOffline"
            type="number"
            min={0}
            defaultValue={0}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Note" hint="Optional. No resident names.">
        <input name="note" className={inputClass} placeholder="Three late arrivals" />
      </Field>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Recording…">Record bed count</SubmitButton>
    </form>
  );
}
