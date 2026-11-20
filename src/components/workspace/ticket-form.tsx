"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton, inputClass } from "@/components/ui/form";
import { TICKET_PRIORITIES } from "@/lib/action/types";
import type { LocationSummary } from "@/lib/actor";
import { cn } from "@/lib/cn";
import { createTicketAction } from "@/server/actions/maintenance";
import { idleState } from "@/server/actions/shared";

export function TicketForm({
  locations,
  defaultLocationId,
}: {
  locations: LocationSummary[];
  defaultLocationId?: string | null;
}) {
  const [state, formAction] = useActionState(createTicketAction, idleState);

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

      <Field label="What is wrong">
        <input
          name="title"
          required
          className={inputClass}
          placeholder="Heater in Dorm B making a grinding noise"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Area">
          <input name="area" className={inputClass} placeholder="Dorm B" />
        </Field>
        <Field label="Priority">
          <select name="priority" defaultValue="medium" className={inputClass}>
            {TICKET_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Details" hint="Optional. What you saw, heard or tried.">
        <textarea
          name="description"
          rows={3}
          className={cn(inputClass, "resize-y")}
        />
      </Field>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Opening…">Open work order</SubmitButton>
    </form>
  );
}
