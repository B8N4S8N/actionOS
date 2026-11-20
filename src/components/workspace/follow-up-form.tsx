"use client";

import { useActionState } from "react";

import { Field, FormMessage, SubmitButton, inputClass } from "@/components/ui/form";
import { FOLLOW_UP_URGENCIES } from "@/lib/action/types";
import type { LocationSummary } from "@/lib/actor";
import { cn } from "@/lib/cn";
import { createFollowUpAction } from "@/server/actions/follow-ups";
import { idleState } from "@/server/actions/shared";

export function FollowUpForm({
  locations,
  defaultLocationId,
}: {
  locations: LocationSummary[];
  defaultLocationId?: string | null;
}) {
  const [state, formAction] = useActionState(createFollowUpAction, idleState);

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

      <Field label="Subject" hint="Room, bed or initials — not a full name.">
        <input
          name="subject"
          required
          className={inputClass}
          placeholder="Bed 14 — state ID replacement"
        />
      </Field>

      <Field label="Details">
        <textarea
          name="details"
          rows={3}
          className={cn(inputClass, "resize-y")}
          placeholder="Asked overnight staff about replacing a state ID. Needs the DMV form."
        />
      </Field>

      <Field label="Urgency">
        <select name="urgency" defaultValue="routine" className={inputClass}>
          {FOLLOW_UP_URGENCIES.map((urgency) => (
            <option key={urgency} value={urgency}>
              {urgency}
            </option>
          ))}
        </select>
      </Field>

      <FormMessage state={state} />
      <SubmitButton pendingLabel="Sending…">Request follow-up</SubmitButton>
    </form>
  );
}
