import type { Metadata } from "next";

import { Badge } from "@/components/ui/badge";
import { Card, CardBody, CardHeader, EmptyState } from "@/components/ui/card";
import { AccessDenied } from "@/components/workspace/access-denied";
import { PageHeader } from "@/components/workspace/page-header";
import { listAuditLog } from "@/db/queries/audit";
import { requireActorContext } from "@/lib/actor";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Audit log" };

export default async function AuditLogPage() {
  const context = await requireActorContext();

  if (!hasPermission(context.actor, "audit_log:read")) {
    return <AccessDenied permission="audit_log:read" role={context.actor.role} />;
  }

  // An executive director sees the whole organization; a shelter manager sees
  // only the sites they are assigned to.
  const orgWide = hasPermission(context.actor, "org:view_all_locations");
  const entries = await listAuditLog({
    organizationId: context.organization.id,
    locationIds: orgWide
      ? undefined
      : context.locations.map((location) => location.id),
    limit: 200,
  });

  return (
    <>
      <PageHeader
        title="Audit log"
        description={
          orgWide
            ? "Every create and update across the organization, newest first."
            : "Every create and update at your sites, newest first."
        }
      />

      <Card>
        <CardHeader
          title={`${entries.length} record${entries.length === 1 ? "" : "s"}`}
          description="Append-only. Actor name and role are stored as they were at the time."
        />
        <CardBody className="py-0">
          {entries.length === 0 ? (
            <div className="py-6">
              <EmptyState>Nothing recorded yet.</EmptyState>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs tracking-wide text-slate-500 uppercase">
                    <th className="py-2.5 pr-4 font-semibold">When</th>
                    <th className="py-2.5 pr-4 font-semibold">Who</th>
                    <th className="py-2.5 pr-4 font-semibold">Action</th>
                    <th className="py-2.5 pr-4 font-semibold">Site</th>
                    <th className="py-2.5 font-semibold">What changed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="align-top">
                      <td className="py-2.5 pr-4 whitespace-nowrap text-slate-500">
                        {entry.createdAt.toLocaleString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-2.5 pr-4">
                        <span className="font-medium text-slate-900">
                          {entry.actorName}
                        </span>
                        <span className="block text-xs text-slate-500">
                          {entry.actorRole.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-2.5 pr-4">
                        <Badge>{entry.action}</Badge>
                      </td>
                      <td className="py-2.5 pr-4 text-slate-600">
                        {entry.locationName ?? "—"}
                      </td>
                      <td className="py-2.5 text-slate-700">{entry.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </>
  );
}
