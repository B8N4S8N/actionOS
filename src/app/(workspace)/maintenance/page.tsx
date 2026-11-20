import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AccessDenied } from "@/components/workspace/access-denied";
import { TicketForm } from "@/components/workspace/ticket-form";
import { TicketList } from "@/components/workspace/lists";
import { PageHeader } from "@/components/workspace/page-header";
import { TicketStatusControls } from "@/components/workspace/ticket-status-controls";
import { listTickets } from "@/db/queries/maintenance";
import { requireActorContext } from "@/lib/actor";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Maintenance" };

export default async function MaintenancePage() {
  const context = await requireActorContext();

  if (!hasPermission(context.actor, "maintenance:read")) {
    return (
      <AccessDenied permission="maintenance:read" role={context.actor.role} />
    );
  }

  const locationIds = context.locations.map((location) => location.id);
  const [active, resolved] = await Promise.all([
    listTickets({ locationIds, status: "active", limit: 100 }),
    listTickets({ locationIds, status: "resolved", limit: 20 }),
  ]);

  const canUpdate = hasPermission(context.actor, "maintenance:update");
  const canCreate = hasPermission(context.actor, "maintenance:create");

  return (
    <>
      <PageHeader
        title="Maintenance"
        description={
          canUpdate
            ? "Work orders across your sites. Status changes are recorded in the audit log."
            : "Work orders across your sites. A shelter manager moves tickets between statuses."
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title={`Open work orders (${active.length})`}
              description="Anything not yet resolved."
            />
            <CardBody className={canUpdate ? "divide-y divide-slate-100 py-0" : undefined}>
              {canUpdate ? (
                active.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Nothing open.
                  </p>
                ) : (
                  active.map((ticket) => (
                    <div key={ticket.id} className="py-4">
                      <TicketStatusControls ticket={ticket} />
                    </div>
                  ))
                )
              ) : (
                <TicketList tickets={active} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Recently resolved"
              description="Last 20 closed tickets."
            />
            <CardBody>
              <TicketList tickets={resolved} />
            </CardBody>
          </Card>
        </div>

        {canCreate ? (
          <div>
            <Card>
              <CardHeader
                title="Report a problem"
                description="Or use the Action Button and let it route itself."
              />
              <CardBody>
                <TicketForm
                  locations={context.locations}
                  defaultLocationId={context.actor.primaryLocationId}
                />
              </CardBody>
            </Card>
          </div>
        ) : null}
      </div>
    </>
  );
}
