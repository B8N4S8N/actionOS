import type { Metadata } from "next";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AccessDenied } from "@/components/workspace/access-denied";
import { FollowUpActions } from "@/components/workspace/follow-up-actions";
import { FollowUpForm } from "@/components/workspace/follow-up-form";
import { FollowUpList } from "@/components/workspace/lists";
import { PageHeader } from "@/components/workspace/page-header";
import { listFollowUps } from "@/db/queries/follow-ups";
import { requireActorContext } from "@/lib/actor";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Follow-ups" };

export default async function FollowUpsPage() {
  const context = await requireActorContext();

  if (!hasPermission(context.actor, "follow_up:read")) {
    return <AccessDenied permission="follow_up:read" role={context.actor.role} />;
  }

  const locationIds = context.locations.map((location) => location.id);
  const [open, closed] = await Promise.all([
    listFollowUps({ locationIds, status: "open", limit: 50 }),
    listFollowUps({ locationIds, status: "closed", limit: 20 }),
  ]);

  const canResolve = hasPermission(context.actor, "follow_up:resolve");
  const canCreate = hasPermission(context.actor, "follow_up:create");

  return (
    <>
      <PageHeader
        title="Case manager follow-ups"
        description="Requests for case management attention. Use a room, bed or initials as the subject — ActionOS does not store resident records in v1."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader
              title={`Open (${open.length})`}
              description={
                canResolve
                  ? "Acknowledge to show the floor it is being worked."
                  : "A case manager acknowledges and closes these."
              }
            />
            <CardBody className={canResolve ? "divide-y divide-slate-100 py-0" : undefined}>
              {canResolve ? (
                open.length === 0 ? (
                  <p className="py-6 text-center text-sm text-slate-500">
                    Nothing in the queue.
                  </p>
                ) : (
                  open.map((followUp) => (
                    <div key={followUp.id} className="py-4">
                      <FollowUpActions followUp={followUp} />
                    </div>
                  ))
                )
              ) : (
                <FollowUpList followUps={open} />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Recently closed" />
            <CardBody>
              <FollowUpList followUps={closed} />
            </CardBody>
          </Card>
        </div>

        {canCreate ? (
          <div>
            <Card>
              <CardHeader
                title="Request a follow-up"
                description="Or use the Action Button and let it route itself."
              />
              <CardBody>
                <FollowUpForm
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
