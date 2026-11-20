"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton, inputClass } from "@/components/ui/form";
import { LOG_CATEGORIES, LOG_SEVERITIES } from "@/lib/action/types";
import type { LocationSummary } from "@/lib/actor";
import { cn } from "@/lib/cn";
import { createShiftLogEntryAction } from "@/server/actions/shift-log";
import { idleState } from "@/server/actions/shared";

export function LogNoteForm({
  locations,
  defaultLocationId,
}: {
  locations: LocationSummary[];
  defaultLocationId?: string | null;
}) {
  const [state, formAction] = useActionState(createShiftLogEntryAction, idleState);

  return (
    <form action={formAction} className="space-y-3">
      {locations.length > 1 ? (
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
      ) : (
        <input
          type="hidden"
          name="locationId"
          value={defaultLocationId ?? locations[0]?.id ?? ""}
        />
      )}

      <Field label="What happened" hint="No resident names — use a room, bed or initials.">
        <textarea
          name="body"
          rows={3}
          required
          className={cn(inputClass, "resize-y")}
          placeholder="Quiet night. Three late arrivals, all checked in by 1am."
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Category">
          <select name="category" defaultValue="general" className={inputClass}>
            {LOG_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category.replace("_", " ")}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Severity">
          <select name="severity" defaultValue="info" className={inputClass}>
            {LOG_SEVERITIES.map((severity) => (
              <option key={severity} value={severity}>
                {severity}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Saving…">Add to shift log</SubmitButton>
    </form>
  );
}
