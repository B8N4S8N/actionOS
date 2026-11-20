import { ShieldAlert } from "lucide-react";
import Link from "next/link";

import type { Permission, StaffRole } from "@/lib/permissions";
import { ROLE_LABELS } from "@/lib/permissions";

/**
 * Shown when a signed-in staff member opens a page their role does not cover.
 * The server has already refused to load the data; this just explains why.
 */
export function AccessDenied({
  permission,
  role,
}: {
  permission: Permission;
  role: StaffRole | null;
}) {
  return (
    <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-amber-50 text-amber-700">
        <ShieldAlert className="size-5" />
      </span>
      <h1 className="mt-4 text-lg font-semibold text-slate-900">
        That page is not part of your role
      </h1>
      <p className="mt-2 text-sm text-slate-600">
        {role ? ROLE_LABELS[role] : "Your account"} does not include{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5">{permission}</code>.
        A shelter manager or executive director can change that.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
      >
        Back to your dashboard
      </Link>
    </div>
  );
}
