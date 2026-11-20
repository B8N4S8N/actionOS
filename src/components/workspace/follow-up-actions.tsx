"use client";

import { useActionState } from "react";

import { Badge, statusTone } from "@/components/ui/badge";
import { FormMessage, SubmitButton, inputClass } from "@/components/ui/form";
import type { FollowUpRow } from "@/db/queries/follow-ups";
import { formatWhen } from "@/components/workspace/lists";
import { updateFollowUpStatusAction } from "@/server/actions/follow-ups";
import { idleState } from "@/server/actions/shared";

/** One follow-up request with the status controls a case manager needs. */
export function FollowUpActions({ followUp }: { followUp: FollowUpRow }) {
  const [state, formAction] = useActionState(
    updateFollowUpStatusAction,
    idleState,
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          tone={
            followUp.urgency === "urgent"
              ? "danger"
              : followUp.urgency === "soon"
                ? "warning"
                : "neutral"
          }
        >
          {followUp.urgency}
        </Badge>
        <Badge tone={statusTone(followUp.status)}>{followUp.status}</Badge>
        <span className="text-xs text-slate-400">
          {followUp.locationName} · {formatWhen(followUp.createdAt)}
        </span>
      </div>

      <p className="mt-1.5 text-sm font-semibold text-slate-900">
        {followUp.subject}
      </p>
      {followUp.details ? (
        <p className="mt-0.5 text-sm text-slate-600">{followUp.details}</p>
      ) : null}
      <p className="mt-0.5 text-xs text-slate-500">
        Raised by {followUp.requestedByName ?? "a former staff member"}
      </p>

      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="followUpId" value={followUp.id} />
        <div className="flex flex-wrap items-center gap-2">
          <select
            name="status"
            defaultValue={followUp.status === "pending" ? "acknowledged" : "closed"}
            className={`${inputClass} w-auto py-1.5`}
            aria-label="New status"
          >
            <option value="acknowledged">Acknowledged</option>
            <option value="closed">Closed</option>
            <option value="pending">Back to pending</option>
          </select>
          <input
            name="resolutionNote"
            placeholder="Note (optional)"
            className={`${inputClass} w-auto flex-1 py-1.5`}
          />
          <SubmitButton variant="secondary" pendingLabel="Saving…">
            Update
          </SubmitButton>
        </div>
        <FormMessage state={state} />
      </form>
    </div>
  );
}
