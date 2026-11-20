import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { BriefingPanel } from "@/components/workspace/briefing-panel";
import {
  FollowUpList,
  LowStockList,
  OccupancyList,
  ShiftLogList,
  formatWhen,
} from "@/components/workspace/lists";
import { PageHeader } from "@/components/workspace/page-header";
import { StatCard } from "@/components/workspace/stat-card";
import { TicketStatusControls } from "@/components/workspace/ticket-status-controls";
import type { OperationsSnapshot, SubmissionRow } from "@/db/queries/dashboard";
import type { ActorContext } from "@/lib/actor";

/**
 * Shelter manager dashboard: the operational board. Everything the floor sees,
 * plus the controls to move work along.
 */
export function ShelterManagerDashboard({
  context,
  snapshot,
  submissions,
}: {
  context: ActorContext;
  snapshot: OperationsSnapshot;
  submissions: SubmissionRow[];
}) {
  const { locations } = context;
  const sorted = [...snapshot.activeTickets].sort((a, b) => {
    const order = ["urgent", "high", "medium", "low"];
    return order.indexOf(a.priority) - order.indexOf(b.priority);
  });

  return (
    <>
      <PageHeader
        title="Site operations"
        description={`${locations.map((location) => location.name).join(" · ")} — occupancy, work orders, stock and the shift record.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Beds occupied"
          value={`${snapshot.totals.bedsOccupied}/${snapshot.totals.bedCapacity}`}
          detail={`${snapshot.totals.bedsAvailable} open`}
        />
        <StatCard
          label="Open work orders"
          value={snapshot.totals.openTickets}
          detail={`${snapshot.totals.urgentTickets} high or urgent`}
          tone={snapshot.totals.urgentTickets > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="Low stock"
          value={snapshot.totals.lowStockItems}
          tone={snapshot.totals.lowStockItems > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Pending follow-ups"
          value={snapshot.totals.pendingFollowUps}
        />
        <StatCard
          label="Flagged notes"
          value={snapshot.totals.flaggedLogEntries}
          detail="In the last 10 entries"
          tone={snapshot.totals.flaggedLogEntries > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Work order board"
              description="Highest priority first. Status changes are audit-logged."
            />
            <CardBody className="divide-y divide-slate-100 py-0">
              {sorted.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Nothing open. Good shift.
                </p>
              ) : (
                sorted
                  .slice(0, 8)
                  .map((ticket) => (
                    <div key={ticket.id} className="py-4">
                      <TicketStatusControls ticket={ticket} />
                    </div>
                  ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Action Button activity"
              description="What staff submitted and what they confirmed."
            />
            <CardBody>
              {submissions.length === 0 ? (
                <EmptyState>No submissions yet.</EmptyState>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {submissions.map((submission) => (
                    <li key={submission.id} className="py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge
                          tone={
                            submission.status === "confirmed"
                              ? "success"
                              : submission.status === "discarded"
                                ? "neutral"
                                : "warning"
                          }
                        >
                          {submission.status}
                        </Badge>
                        <Badge tone="brand">
                          <Sparkles className="size-3" />
                          {submission.classifier === "llm"
                            ? (submission.model ?? "llm")
                            : "keyword"}
                        </Badge>
                        <span className="text-xs text-slate-400">
                          {submission.proposalCount} proposed ·{" "}
                          {formatWhen(submission.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-800">
                        “{submission.inputText}”
                      </p>
                      <p className="text-xs text-slate-500">
                        {submission.submittedByName ?? "Unknown"} ·{" "}
                        {submission.locationName}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Shift log" />
            <CardBody>
              <ShiftLogList entries={snapshot.recentLog} limit={6} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Occupancy by site" />
            <CardBody>
              <OccupancyList views={snapshot.occupancy} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Last shift briefing" />
            <CardBody>
              <BriefingPanel locations={locations} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Low stock" />
            <CardBody>
              <LowStockList items={snapshot.lowStock} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Open follow-ups" />
            <CardBody>
              <FollowUpList followUps={snapshot.openFollowUps} limit={5} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
