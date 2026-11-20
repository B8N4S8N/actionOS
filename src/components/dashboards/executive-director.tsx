import { Sparkles } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import {
  FollowUpList,
  LowStockList,
  OccupancyList,
  ShiftLogList,
  TicketList,
  formatWhen,
} from "@/components/workspace/lists";
import { PageHeader } from "@/components/workspace/page-header";
import { StatCard } from "@/components/workspace/stat-card";
import type { AuditRow } from "@/db/queries/audit";
import type { OperationsSnapshot, SubmissionRow } from "@/db/queries/dashboard";
import type { ActorContext } from "@/lib/actor";

/**
 * Executive director dashboard: the organization-wide roll-up, plus the two
 * things a director is accountable for that no one else sees in one place —
 * the audit trail and how the AI is actually being used.
 */
export function ExecutiveDirectorDashboard({
  context,
  snapshot,
  submissions,
  auditEntries,
  staffCount,
}: {
  context: ActorContext;
  snapshot: OperationsSnapshot;
  submissions: SubmissionRow[];
  auditEntries: AuditRow[];
  staffCount: number;
}) {
  const { organization, locations } = context;
  const occupancyRate =
    snapshot.totals.bedCapacity > 0
      ? Math.round(
          (snapshot.totals.bedsOccupied / snapshot.totals.bedCapacity) * 100,
        )
      : null;

  const confirmed = submissions.filter(
    (submission) => submission.status === "confirmed",
  ).length;

  return (
    <>
      <PageHeader
        title={organization.name}
        description={`${locations.length} site${locations.length === 1 ? "" : "s"} · ${staffCount} staff account${staffCount === 1 ? "" : "s"} · organization-wide view`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard
          label="Occupancy"
          value={occupancyRate === null ? "—" : `${occupancyRate}%`}
          detail={`${snapshot.totals.bedsOccupied} of ${snapshot.totals.bedCapacity} beds`}
        />
        <StatCard
          label="Beds open"
          value={snapshot.totals.bedsAvailable}
          detail="Across all shelters"
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
          label="AI actions confirmed"
          value={confirmed}
          detail={`of ${submissions.length} recent submissions`}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Sites"
              description="Latest bed count per site. Counts are recorded by staff on shift."
            />
            <CardBody>
              <OccupancyList views={snapshot.occupancy} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Audit log"
              description="Every create and update, across the organization."
              action={
                <Link
                  href="/audit-log"
                  className="text-sm font-semibold text-brand-700 hover:underline"
                >
                  View all
                </Link>
              }
            />
            <CardBody>
              {auditEntries.length === 0 ? (
                <EmptyState>Nothing recorded yet.</EmptyState>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {auditEntries.slice(0, 8).map((entry) => (
                    <li key={entry.id} className="py-2.5">
                      <p className="text-sm text-slate-800">{entry.summary}</p>
                      <p className="text-xs text-slate-500">
                        {entry.actorName} ({entry.actorRole.replace("_", " ")}) ·{" "}
                        {entry.locationName ?? "organization"} ·{" "}
                        {formatWhen(entry.createdAt)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Action Button usage"
              description="Whether staff are trusting it, and what they discard."
            />
            <CardBody>
              {submissions.length === 0 ? (
                <EmptyState>No submissions yet.</EmptyState>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {submissions.slice(0, 6).map((submission) => (
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
                          {submission.locationName} ·{" "}
                          {formatWhen(submission.createdAt)}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-slate-800">
                        “{submission.inputText}”
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Highest priority work" />
            <CardBody>
              <TicketList
                tickets={snapshot.activeTickets.filter(
                  (ticket) =>
                    ticket.priority === "urgent" || ticket.priority === "high",
                )}
                limit={6}
              />
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

          <Card>
            <CardHeader title="Flagged notes" />
            <CardBody>
              <ShiftLogList
                entries={snapshot.recentLog.filter(
                  (entry) => entry.severity !== "info",
                )}
                limit={5}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
