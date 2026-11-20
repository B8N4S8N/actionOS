import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BriefingPanel } from "@/components/workspace/briefing-panel";
import { FollowUpActions } from "@/components/workspace/follow-up-actions";
import { OccupancyList, ShiftLogList } from "@/components/workspace/lists";
import { PageHeader } from "@/components/workspace/page-header";
import { StatCard } from "@/components/workspace/stat-card";
import type { OperationsSnapshot } from "@/db/queries/dashboard";
import type { ActorContext } from "@/lib/actor";

/**
 * Case manager dashboard: the follow-up queue first, then the context needed
 * before walking into a conversation. Inventory is intentionally absent —
 * case managers can read it from the nav, but it is not their work.
 */
export function CaseManagerDashboard({
  context,
  snapshot,
}: {
  context: ActorContext;
  snapshot: OperationsSnapshot;
}) {
  const { actor, locations } = context;

  const pending = snapshot.openFollowUps.filter(
    (followUp) => followUp.status === "pending",
  );
  const urgent = snapshot.openFollowUps.filter(
    (followUp) => followUp.urgency === "urgent",
  );
  const supportNotes = snapshot.recentLog.filter(
    (entry) => entry.category === "resident_support" || entry.severity !== "info",
  );

  return (
    <>
      <PageHeader
        title={`Caseload queue, ${actor.name.split(" ")[0]}`}
        description="Follow-up requests raised by front-line staff, newest first. Acknowledge one to show the floor that it is being worked."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Pending requests"
          value={pending.length}
          detail="Not yet acknowledged"
          tone={pending.length > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Urgent"
          value={urgent.length}
          detail="Flagged urgent by staff"
          tone={urgent.length > 0 ? "danger" : "neutral"}
        />
        <StatCard
          label="Open total"
          value={snapshot.openFollowUps.length}
          detail="Pending or acknowledged"
        />
        <StatCard
          label="Beds occupied"
          value={`${snapshot.totals.bedsOccupied}/${snapshot.totals.bedCapacity}`}
          detail="Across your sites"
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Follow-up requests"
              description="Subjects are rooms, beds or initials — ActionOS does not store resident records."
            />
            <CardBody className="divide-y divide-slate-100 py-0">
              {snapshot.openFollowUps.length === 0 ? (
                <p className="py-6 text-center text-sm text-slate-500">
                  Nothing in the queue.
                </p>
              ) : (
                snapshot.openFollowUps.map((followUp) => (
                  <div key={followUp.id} className="py-4">
                    <FollowUpActions followUp={followUp} />
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Notes worth reading"
              description="Resident support and anything flagged on recent shifts."
            />
            <CardBody>
              <ShiftLogList
                entries={supportNotes}
                limit={6}
                showLocation={locations.length > 1}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Last shift briefing" />
            <CardBody>
              <BriefingPanel locations={locations} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Occupancy" />
            <CardBody>
              <OccupancyList views={snapshot.occupancy} />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
