import { Sparkles } from "lucide-react";

import { Badge, priorityTone, severityTone, statusTone } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/card";
import type { FollowUpRow } from "@/db/queries/follow-ups";
import type { InventoryItemRow } from "@/db/queries/inventory";
import type { TicketRow } from "@/db/queries/maintenance";
import type { ShiftLogRow } from "@/db/queries/shift-log";
import type { OccupancyView } from "@/db/queries/dashboard";

export function formatWhen(date: Date): string {
  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const hours = Math.round(diffMinutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function OccupancyList({ views }: { views: OccupancyView[] }) {
  if (views.length === 0) {
    return <EmptyState>No sites with beds are in your scope.</EmptyState>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {views.map((view) => (
        <li key={view.location.id} className="flex items-center gap-4 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {view.location.name}
            </p>
            <p className="text-xs text-slate-500">
              {view.recordedAt
                ? `Counted ${formatWhen(view.recordedAt)}`
                : "No bed count recorded yet"}
              {view.bedsOffline > 0 ? ` · ${view.bedsOffline} offline` : ""}
            </p>
          </div>
          <div className="w-28">
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-brand-500"
                style={{
                  width: `${Math.min(100, Math.round((view.occupancyRate ?? 0) * 100))}%`,
                }}
              />
            </div>
          </div>
          <p className="w-24 text-right text-sm font-semibold text-slate-900">
            {view.bedsOccupied}/{view.location.bedCapacity}
            <span className="block text-xs font-normal text-slate-500">
              {view.bedsAvailable} open
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export function TicketList({
  tickets,
  showLocation = true,
  limit,
}: {
  tickets: TicketRow[];
  showLocation?: boolean;
  limit?: number;
}) {
  const visible = limit ? tickets.slice(0, limit) : tickets;

  if (visible.length === 0) {
    return <EmptyState>No open work orders. Good shift.</EmptyState>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {visible.map((ticket) => (
        <li key={ticket.id} className="py-3">
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
              {formatWhen(ticket.createdAt)}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">
            {ticket.title}
          </p>
          <p className="text-xs text-slate-500">
            {[showLocation ? ticket.locationName : null, ticket.area, ticket.createdByName]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function LowStockList({
  items,
  showLocation = true,
}: {
  items: InventoryItemRow[];
  showLocation?: boolean;
}) {
  if (items.length === 0) {
    return <EmptyState>Nothing is at or below its threshold.</EmptyState>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {items.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 py-2.5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {item.name}
            </p>
            <p className="text-xs text-slate-500">
              {[showLocation ? item.locationName : null, item.category]
                .filter(Boolean)
                .join(" · ")}
            </p>
          </div>
          <p className="text-right text-sm">
            <span
              className={
                item.quantity === 0
                  ? "font-bold text-rose-700"
                  : "font-semibold text-amber-700"
              }
            >
              {item.quantity} {item.unit}
            </span>
            <span className="block text-xs text-slate-500">
              threshold {item.lowStockThreshold}
            </span>
          </p>
        </li>
      ))}
    </ul>
  );
}

export function ShiftLogList({
  entries,
  showLocation = true,
  limit,
}: {
  entries: ShiftLogRow[];
  showLocation?: boolean;
  limit?: number;
}) {
  const visible = limit ? entries.slice(0, limit) : entries;

  if (visible.length === 0) {
    return <EmptyState>Nothing logged yet.</EmptyState>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {visible.map((entry) => (
        <li key={entry.id} className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={severityTone(entry.severity)}>{entry.severity}</Badge>
            <Badge>{entry.category.replace("_", " ")}</Badge>
            <span className="text-xs text-slate-400">
              {entry.shift} shift · {formatWhen(entry.occurredAt)}
            </span>
            {entry.fromActionButton ? (
              <Badge tone="brand">
                <Sparkles className="size-3" />
                Action Button
              </Badge>
            ) : null}
          </div>
          <p className="mt-1.5 text-sm text-slate-800">{entry.body}</p>
          <p className="text-xs text-slate-500">
            {[entry.authorName, showLocation ? entry.locationName : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function FollowUpList({
  followUps,
  showLocation = true,
  limit,
}: {
  followUps: FollowUpRow[];
  showLocation?: boolean;
  limit?: number;
}) {
  const visible = limit ? followUps.slice(0, limit) : followUps;

  if (visible.length === 0) {
    return <EmptyState>No open follow-up requests.</EmptyState>;
  }

  return (
    <ul className="divide-y divide-slate-100">
      {visible.map((followUp) => (
        <li key={followUp.id} className="py-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={followUp.urgency === "urgent" ? "danger" : followUp.urgency === "soon" ? "warning" : "neutral"}>
              {followUp.urgency}
            </Badge>
            <Badge tone={statusTone(followUp.status)}>{followUp.status}</Badge>
            <span className="text-xs text-slate-400">
              {formatWhen(followUp.createdAt)}
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-slate-900">
            {followUp.subject}
          </p>
          {followUp.details ? (
            <p className="text-sm text-slate-600">{followUp.details}</p>
          ) : null}
          <p className="text-xs text-slate-500">
            {[followUp.requestedByName, showLocation ? followUp.locationName : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        </li>
      ))}
    </ul>
  );
}
