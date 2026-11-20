"use client";

import { Sparkles } from "lucide-react";
import { useActionState } from "react";

import { Badge, priorityTone, statusTone } from "@/components/ui/badge";
import { FormMessage, SubmitButton, inputClass } from "@/components/ui/form";
import { formatWhen } from "@/components/workspace/lists";
import type { TicketRow } from "@/db/queries/maintenance";
import { updateTicketStatusAction } from "@/server/actions/maintenance";
import { idleState } from "@/server/actions/shared";

const NEXT_STATUS: Record<TicketRow["status"], TicketRow["status"]> = {
  open: "in_progress",
  in_progress: "resolved",
  blocked: "in_progress",
  resolved: "open",
};

/** One ticket with the status controls a manager needs. */
export function TicketStatusControls({ ticket }: { ticket: TicketRow }) {
  const [state, formAction] = useActionState(updateTicketStatusAction, idleState);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={priorityTone(ticket.priority)}>{ticket.priority}</Badge>
        <Badge tone={statusTone(ticket.status)}>
          {ticket.status.replace("_", " ")}
        </Badge>
        {ticket.fromActionButton ? (
          <Badge tone="brand">
            <Sparkles className="size-3" />
            Action Button
          </Badge>
        ) : null}
        <span className="text-xs text-slate-400">
          {ticket.locationName}
          {ticket.area ? ` · ${ticket.area}` : ""} ·{" "}
          {formatWhen(ticket.createdAt)}
        </span>
      </div>

      <p className="mt-1.5 text-sm font-semibold text-slate-900">{ticket.title}</p>
      {ticket.description ? (
        <p className="mt-0.5 text-sm text-slate-600">{ticket.description}</p>
      ) : null}
      <p className="mt-0.5 text-xs text-slate-500">
        Reported by {ticket.createdByName ?? "a former staff member"}
      </p>

      <form action={formAction} className="mt-3 space-y-2">
        <input type="hidden" name="ticketId" value={ticket.id} />
        <div className="flex flex-wrap items-center gap-2">
          <select
            name="status"
            defaultValue={NEXT_STATUS[ticket.status]}
            className={`${inputClass} w-auto py-1.5`}
            aria-label="New status"
          >
            {(["open", "in_progress", "blocked", "resolved"] as const).map(
              (status) => (
                <option key={status} value={status}>
                  {status.replace("_", " ")}
                </option>
              ),
            )}
          </select>
          <input
            name="resolutionNote"
            placeholder="Note (optional)"
            defaultValue={ticket.resolutionNote ?? ""}
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
