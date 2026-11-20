import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { BriefingPanel } from "@/components/workspace/briefing-panel";
import {
  LowStockList,
  OccupancyList,
  ShiftLogList,
  TicketList,
} from "@/components/workspace/lists";
import { LogNoteForm } from "@/components/workspace/log-note-form";
import { OccupancyForm } from "@/components/workspace/occupancy-form";
import { PageHeader } from "@/components/workspace/page-header";
import { StatCard } from "@/components/workspace/stat-card";
import type { OperationsSnapshot } from "@/db/queries/dashboard";
import type { ActorContext } from "@/lib/actor";
import { SHIFT_LABELS, currentShift } from "@/lib/shift";

/**
 * Front-line dashboard. Built around the three things a float staff member
 * does on shift: count beds, log what happened, and flag what is broken or
 * running out.
 */
export function SiteAssistantDashboard({
  context,
  snapshot,
}: {
  context: ActorContext;
  snapshot: OperationsSnapshot;
}) {
  const { actor, organization, locations } = context;
  const shift = currentShift(organization.timezone);

  return (
    <>
      <PageHeader
        title={`${SHIFT_LABELS[shift]} shift, ${actor.name.split(" ")[0]}`}
        description={`${locations.map((location) => location.name).join(" · ")} — use the Action Button for anything you notice and it will route itself.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Beds open"
          value={snapshot.totals.bedsAvailable}
          detail={`${snapshot.totals.bedsOccupied} of ${snapshot.totals.bedCapacity} occupied`}
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
          detail="At or below threshold"
          tone={snapshot.totals.lowStockItems > 0 ? "warning" : "success"}
        />
        <StatCard
          label="Flagged notes"
          value={snapshot.totals.flaggedLogEntries}
          detail="In the last 10 log entries"
          tone={snapshot.totals.flaggedLogEntries > 0 ? "danger" : "neutral"}
        />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title="Last shift briefing"
              description="Generated on demand from the shift that just ended."
            />
            <CardBody>
              <BriefingPanel locations={locations} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recent shift log" description="Newest first." />
            <CardBody>
              <ShiftLogList
                entries={snapshot.recentLog}
                limit={6}
                showLocation={locations.length > 1}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Open work orders"
              description="Anything not yet resolved at your sites."
            />
            <CardBody>
              <TicketList
                tickets={snapshot.activeTickets}
                limit={5}
                showLocation={locations.length > 1}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader title="Bed count" description="Record the count for your site." />
            <CardBody>
              <OccupancyForm
                locations={locations}
                defaultLocationId={actor.primaryLocationId}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Occupancy" />
            <CardBody>
              <OccupancyList views={snapshot.occupancy} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Low stock" />
            <CardBody>
              <LowStockList
                items={snapshot.lowStock}
                showLocation={locations.length > 1}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Quick log note" />
            <CardBody>
              <LogNoteForm
                locations={locations}
                defaultLocationId={actor.primaryLocationId}
              />
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
