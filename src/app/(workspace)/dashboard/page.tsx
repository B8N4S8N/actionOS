import type { Metadata } from "next";

import { CaseManagerDashboard } from "@/components/dashboards/case-manager";
import { ExecutiveDirectorDashboard } from "@/components/dashboards/executive-director";
import { ShelterManagerDashboard } from "@/components/dashboards/shelter-manager";
import { SiteAssistantDashboard } from "@/components/dashboards/site-assistant";
import { AccessDenied } from "@/components/workspace/access-denied";
import { listAuditLog } from "@/db/queries/audit";
import {
  getOperationsSnapshot,
  listRecentSubmissions,
  listStaff,
} from "@/db/queries/dashboard";
import { requireActorContext } from "@/lib/actor";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Dashboard" };

/**
 * One route, four dashboards. The role decides which component renders and
 * which queries run, so a staff member never loads data their role does not
 * cover — the dashboards are not the same page with pieces hidden.
 */
export default async function DashboardPage() {
  const context = await requireActorContext();

  if (!hasPermission(context.actor, "dashboard:view")) {
    return (
      <AccessDenied permission="dashboard:view" role={context.actor.role} />
    );
  }

  if (context.locations.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">
          No sites assigned
        </h1>
        <p className="mt-2 text-sm text-slate-600">
          Your account has a role but no site assignment, so there is nothing to
          show. A shelter manager or executive director can add you to a site.
        </p>
      </div>
    );
  }

  const snapshot = await getOperationsSnapshot(context.locations);
  const locationIds = context.locations.map((location) => location.id);

  switch (context.actor.role) {
    case "case_manager":
      return <CaseManagerDashboard context={context} snapshot={snapshot} />;

    case "shelter_manager": {
      const submissions = await listRecentSubmissions(
        context.organization.id,
        locationIds,
        8,
      );
      return (
        <ShelterManagerDashboard
          context={context}
          snapshot={snapshot}
          submissions={submissions}
        />
      );
    }

    case "executive_director": {
      const [submissions, auditEntries, staff] = await Promise.all([
        listRecentSubmissions(context.organization.id, locationIds, 10),
        listAuditLog({ organizationId: context.organization.id, limit: 10 }),
        listStaff(context.organization.id),
      ]);
      return (
        <ExecutiveDirectorDashboard
          context={context}
          snapshot={snapshot}
          submissions={submissions}
          auditEntries={auditEntries}
          staffCount={staff.length}
        />
      );
    }

    default:
      return <SiteAssistantDashboard context={context} snapshot={snapshot} />;
  }
}
