import Link from "next/link";

import { ActionButton } from "@/components/workspace/action-button";
import { WorkspaceNav, type NavItem } from "@/components/workspace/nav";
import { SignOutButton } from "@/components/workspace/sign-out-button";
import { requireActorContext } from "@/lib/actor";
import { ROLE_SHORT_LABELS, hasPermission, type Permission } from "@/lib/permissions";
import { SHIFT_LABELS, currentShift } from "@/lib/shift";

const NAV_ITEMS: (NavItem & { permission: Permission })[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    description: "Your shift at a glance",
    permission: "dashboard:view",
  },
  {
    href: "/maintenance",
    label: "Maintenance",
    description: "Work orders by site",
    permission: "maintenance:read",
  },
  {
    href: "/inventory",
    label: "Inventory",
    description: "Counts and low stock",
    permission: "inventory:read",
  },
  {
    href: "/shift-log",
    label: "Shift log",
    description: "Notes and briefing",
    permission: "shift_log:read",
  },
  {
    href: "/follow-ups",
    label: "Follow-ups",
    description: "Case manager requests",
    permission: "follow_up:read",
  },
  {
    href: "/team",
    label: "Team",
    description: "Roles and site access",
    permission: "staff:read",
  },
  {
    href: "/audit-log",
    label: "Audit log",
    description: "Who changed what",
    permission: "audit_log:read",
  },
];

export default async function WorkspaceLayout({ children }: LayoutProps<"/">) {
  const { actor, organization, locations } = await requireActorContext();

  if (!actor.role || !actor.organizationId) {
    return (
      <main className="mx-auto flex min-h-screen max-w-lg items-center px-6">
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">
            Your account is not set up yet
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            {actor.email} exists, but it has no role or organization. An
            administrator needs to assign those before ActionOS can show you
            anything.
          </p>
          <div className="mt-6">
            <SignOutButtonLight />
          </div>
        </div>
      </main>
    );
  }

  const items = NAV_ITEMS.filter((item) => hasPermission(actor, item.permission));
  const shift = currentShift(organization.timezone);

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-72 shrink-0 flex-col justify-between bg-slate-900 px-4 py-6 lg:flex">
        <div>
          <Link href="/" className="flex items-center gap-2 px-3">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              A
            </span>
            <span className="text-lg font-semibold tracking-tight text-white">
              Action<span className="text-brand-400">OS</span>
            </span>
          </Link>

          <p className="mt-6 px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
            {organization.name}
          </p>
          <p className="px-3 text-xs text-slate-400">
            {locations.length} site{locations.length === 1 ? "" : "s"} ·{" "}
            {SHIFT_LABELS[shift]} shift
          </p>

          <div className="mt-6">
            <WorkspaceNav items={items} />
          </div>
        </div>

        <div className="border-t border-slate-800 pt-4">
          <p className="px-3 text-sm font-semibold text-white">{actor.name}</p>
          <p className="px-3 text-xs text-slate-400">
            {ROLE_SHORT_LABELS[actor.role]}
          </p>
          <div className="mt-2">
            <SignOutButton />
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-3 lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold text-white">
              A
            </span>
            <span className="font-semibold tracking-tight">ActionOS</span>
          </Link>
          <span className="text-xs text-slate-500">
            {actor.name} · {ROLE_SHORT_LABELS[actor.role]}
          </span>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 lg:hidden">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href as "/dashboard"}
              className="rounded-lg px-3 py-1.5 text-sm font-medium whitespace-nowrap text-slate-600 hover:bg-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 px-5 py-6 pb-28 sm:px-8">{children}</main>
      </div>

      {hasPermission(actor, "action:submit") && locations.length > 0 ? (
        <ActionButton locations={locations} />
      ) : null}
    </div>
  );
}

function SignOutButtonLight() {
  return (
    <div className="inline-flex rounded-lg bg-slate-900 px-1">
      <SignOutButton />
    </div>
  );
}
