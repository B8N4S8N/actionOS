import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { DEMO_ACCOUNTS } from "@/db/demo-accounts";
import { getActorContext } from "@/lib/actor";
import { showDemoLogins } from "@/lib/env";
import { ROLE_LABELS } from "@/lib/permissions";

export const metadata: Metadata = { title: "Staff sign in" };

export default async function LoginPage() {
  const context = await getActorContext();
  if (context) redirect("/dashboard");

  const demo = showDemoLogins();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              A
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Action<span className="text-brand-600">OS</span>
            </span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 items-start gap-10 px-6 py-14 lg:items-center">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Staff sign in
          </h1>
          <p className="mt-1 mb-6 text-sm text-slate-500">
            ActionOS is invite-only. Accounts are created by your agency, not
            self-registered.
          </p>
          <LoginForm defaultEmail={demo ? DEMO_ACCOUNTS[0]?.email : undefined} />
        </div>

        {demo ? (
          <aside className="hidden w-full max-w-sm lg:block">
            <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
              Seeded demo accounts
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Created by <code className="rounded bg-slate-200 px-1">npm run db:seed</code>.
              All four use the password from{" "}
              <code className="rounded bg-slate-200 px-1">SEED_DEMO_PASSWORD</code>{" "}
              (default <code className="rounded bg-slate-200 px-1">DemoPassword123!</code>).
              Fictional people, fictional agency.
            </p>
            <ul className="mt-4 space-y-2">
              {DEMO_ACCOUNTS.map((account) => (
                <li
                  key={account.email}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2.5"
                >
                  <p className="font-mono text-sm text-slate-900">{account.email}</p>
                  <p className="text-xs text-slate-500">
                    {ROLE_LABELS[account.role]} · {account.siteNote}
                  </p>
                </li>
              ))}
            </ul>
          </aside>
        ) : null}
      </main>
    </div>
  );
}
