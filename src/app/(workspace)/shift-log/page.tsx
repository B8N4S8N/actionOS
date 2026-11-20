import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AccessDenied } from "@/components/workspace/access-denied";
import { BriefingPanel } from "@/components/workspace/briefing-panel";
import { ShiftLogList } from "@/components/workspace/lists";
import { LogNoteForm } from "@/components/workspace/log-note-form";
import { PageHeader } from "@/components/workspace/page-header";
import { listShiftLog } from "@/db/queries/shift-log";
import { requireActorContext } from "@/lib/actor";
import { hasPermission } from "@/lib/permissions";
import { SHIFT_LABELS, currentShift } from "@/lib/shift";

export const metadata: Metadata = { title: "Shift log" };

export default async function ShiftLogPage() {
  const context = await requireActorContext();

  if (!hasPermission(context.actor, "shift_log:read")) {
    return <AccessDenied permission="shift_log:read" role={context.actor.role} />;
  }

  const entries = await listShiftLog({
    locationIds: context.locations.map((location) => location.id),
    limit: 60,
  });

  const canWrite = hasPermission(context.actor, "shift_log:create");
  const shift = currentShift(context.organization.timezone);

  return (
    <>
      <PageHeader
        title="Shift log"
        description={`Current shift: ${SHIFT_LABELS[shift]}. The log is the handoff record — write it as if the next person has no other context.`}
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader
              title={`Entries (${entries.length})`}
              description="Newest first, across your sites."
            />
            <CardBody>
              <ShiftLogList
                entries={entries}
                showLocation={context.locations.length > 1}
              />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Last shift briefing"
              description="Summarizes the shift that just ended."
            />
            <CardBody>
              <BriefingPanel locations={context.locations} />
            </CardBody>
          </Card>

          {canWrite ? (
            <Card>
              <CardHeader title="Add an entry" />
              <CardBody>
                <LogNoteForm
                  locations={context.locations}
                  defaultLocationId={context.actor.primaryLocationId}
                />
              </CardBody>
            </Card>
          ) : null}
        </div>
      </div>
    </>
  );
}
