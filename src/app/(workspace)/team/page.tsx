import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { AccessDenied } from "@/components/workspace/access-denied";
import { PageHeader } from "@/components/workspace/page-header";
import { listStaff } from "@/db/queries/dashboard";
import { requireActorContext } from "@/lib/actor";
import {
  ROLE_SHORT_LABELS,
  hasPermission,
  permissionsForRole,
} from "@/lib/permissions";

export const metadata: Metadata = { title: "Team" };

export default async function TeamPage() {
  const context = await requireActorContext();

  if (!hasPermission(context.actor, "staff:read")) {
    return <AccessDenied permission="staff:read" role={context.actor.role} />;
  }

  const staff = await listStaff(context.organization.id);

  return (
    <>
      <PageHeader
        title="Team"
        description="Who has which role and which sites they can see. Accounts are provisioned from the command line in v1 — there is no in-app invite flow yet."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader title={`${staff.length} staff accounts`} />
            <CardBody className="py-0">
              <ul className="divide-y divide-slate-100">
                {staff.map((person) => (
                  <li
                    key={person.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">
                        {person.name}
                        {person.isActive ? null : (
                          <Badge tone="danger" className="ml-2">
                            inactive
                          </Badge>
                        )}
                      </p>
                      <p className="text-xs text-slate-500">
                        {person.email}
                        {person.jobTitle ? ` · ${person.jobTitle}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge tone="brand">
                        {person.role
                          ? ROLE_SHORT_LABELS[person.role]
                          : "no role assigned"}
                      </Badge>
                      <p className="mt-1 text-xs text-slate-500">
                        {person.role === "executive_director"
                          ? "all sites"
                          : person.locationNames.length > 0
                            ? person.locationNames.join(", ")
                            : "no sites assigned"}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </CardBody>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Add a staff account"
              description="Public sign-up is disabled, so accounts are created by an administrator."
            />
            <CardBody>
              <pre className="overflow-x-auto rounded-lg bg-slate-900 px-3.5 py-3 text-xs leading-relaxed text-slate-100">
{`npm run staff:create -- \\
  --email sam@agency.org \\
  --name "Sam Lee" \\
  --role shelter_manager \\
  --org ${context.organization.slug} \\
  --locations "${context.locations[0]?.name ?? "Site name"}"`}
              </pre>
              <p className="mt-3 text-sm text-slate-600">
                The script prints a temporary password. An in-app invite flow is
                on the v2 list.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="What your role can do"
              description="The same list the server checks."
            />
            <CardBody>
              <ul className="flex flex-wrap gap-1.5">
                {context.actor.role
                  ? permissionsForRole(context.actor.role).map((permission) => (
                      <li key={permission}>
                        <Badge>{permission}</Badge>
                      </li>
                    ))
                  : null}
              </ul>
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
