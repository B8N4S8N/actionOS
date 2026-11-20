import {
  ArrowRight,
  Boxes,
  ClipboardList,
  Layers,
  ListChecks,
  Lock,
  MapPin,
  MessageSquareText,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserCog,
  Wrench,
} from "lucide-react";
import Link from "next/link";

import { getActorContext } from "@/lib/actor";
import { ROLE_LABELS } from "@/lib/permissions";

const NAV = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#roles", label: "For your role" },
  { href: "#modules", label: "What's built" },
  { href: "#roadmap", label: "Roadmap" },
  { href: "#pricing", label: "Pricing" },
];

const MODULES = [
  {
    icon: ClipboardList,
    title: "Role-based dashboards",
    body: "Four dashboards today — site assistant and float staff, case manager, shelter manager, executive director. Each one shows the live numbers that role acts on, and the server enforces the boundary, not the UI.",
  },
  {
    icon: Sparkles,
    title: "The Action Button",
    body: "Staff type what they see. ActionOS proposes a maintenance ticket, an inventory change, a shift log note or a case manager follow-up. Nothing is written until a person confirms it.",
  },
  {
    icon: Wrench,
    title: "Maintenance tickets",
    body: "Open, prioritise and close work orders per site, with the area of the building, who reported it, and whether it came from the Action Button.",
  },
  {
    icon: Boxes,
    title: "Inventory and low-stock alerts",
    body: "Counts per site with a low-stock threshold on every item, a signed history of every change, and the reason it changed.",
  },
  {
    icon: ScrollText,
    title: "Shift log and AI briefing",
    body: "A searchable log by shift, plus a briefing of the shift that just ended. Without an LLM key configured, the briefing is a deterministic rollup of the same data.",
  },
  {
    icon: ShieldCheck,
    title: "Audit log",
    body: "Every create and update records who did it, when, at which site, and what changed — including which AI proposals a human approved.",
  },
];

const ROLE_CARDS = [
  {
    role: ROLE_LABELS.site_assistant,
    icon: ListChecks,
    summary: "Front line. Mostly entering what just happened.",
    points: [
      "Bed count for the site, and the beds still open",
      "Action Button for anything observed on shift",
      "Shift log for the handoff, and the last briefing",
      "Adjust supply counts without waiting for a manager",
    ],
  },
  {
    role: ROLE_LABELS.case_manager,
    icon: UserCog,
    summary: "Works a caseload. Needs the requests, not the supply closet.",
    points: [
      "Follow-up requests queued by front-line staff",
      "Urgency and status on each request",
      "Read-only inventory, so no accidental stock edits",
      "Shift log context before meeting someone",
    ],
  },
  {
    role: ROLE_LABELS.shelter_manager,
    icon: Layers,
    summary: "Runs the building and the shift.",
    points: [
      "Everything the floor staff see, across their sites",
      "Move tickets through in-progress, blocked, resolved",
      "Add and re-threshold inventory items",
      "Read the audit log for their sites",
    ],
  },
  {
    role: ROLE_LABELS.executive_director,
    icon: MapPin,
    summary: "Multi-site view and organization administration.",
    points: [
      "Every site in the organization in one roll-up",
      "Occupancy, open work, low stock and flagged notes by site",
      "Full audit log and Action Button history",
      "Staff roster with role and site assignments",
    ],
  },
];

const ROADMAP = [
  {
    title: "Voice and photo capture",
    body: "The Action Button is text-only in v1. Voice dictation and photo counting are the next inputs, once the text path has been used in a real building for a while.",
  },
  {
    title: "HUD HMIS and compliance reporting",
    body: "Reporting needs a data model that holds resident-level records, which means a security review and a privacy design first. Not started.",
  },
  {
    title: "Grant discovery and drafting",
    body: "Planned. The pattern will be the same as the Action Button: the system drafts, a human submits.",
  },
  {
    title: "HR, scheduling and risk prediction",
    body: "Planned, in that order. Prediction comes last, because it is the feature most likely to be wrong in a way that hurts someone.",
  },
];

const PRICING = [
  {
    name: "Single site",
    price: "$299",
    cadence: "per month (indicative)",
    description: "One shelter or office, up to 25 staff accounts.",
    features: [
      "All four role dashboards",
      "Action Button, maintenance, inventory, shift log",
      "Audit log",
      "Email support",
    ],
  },
  {
    name: "Multi-site",
    price: "$799",
    cadence: "per month (indicative)",
    description: "Up to 10 sites and 100 staff accounts.",
    features: [
      "Everything in Single site",
      "Organization-wide roll-up for directors",
      "Per-site staff assignment",
      "Priority support",
    ],
    highlighted: true,
  },
  {
    name: "Agency",
    price: "Let's talk",
    cadence: "",
    description: "County-wide agencies and multi-program networks.",
    features: [
      "Unlimited sites and staff",
      "Migration help from spreadsheets and paper logs",
      "Named implementation contact",
      "Roadmap input",
    ],
  },
];

const FAQ = [
  {
    question: "Is this ready for resident data?",
    answer:
      "No, and it does not store any. v1 deliberately tracks the building, the supplies and the shift: bed counts, tickets, stock levels and log notes. Resident-level records come after a security and privacy review, not before.",
  },
  {
    question: "Is ActionOS HIPAA or HUD HMIS compliant?",
    answer:
      "No. It is built for the way shelter staff work, and the audit log, role-based access control and server-side authorization are the groundwork compliance work needs — but no audit, certification or BAA exists today, and we will not claim one until it does.",
  },
  {
    question: "Does it need an AI provider?",
    answer:
      "No. Set an OpenAI-compatible or Gemini API key and the Action Button and shift briefing use it. With no key, a deterministic keyword classifier and a rollup briefing do the same jobs, and every proposal still waits for a human.",
  },
  {
    question: "What happens to the data if we leave?",
    answer:
      "It is a standard Postgres database you can point at your own instance, and the schema is in the repository. Export is a pg_dump away.",
  },
  {
    question: "Who is building this?",
    answer:
      "It started with operations work at a veteran transitional housing shelter, which is why the first features are the ones that eat a shift: a broken heater, a supply count, and the handoff note.",
  },
];

export default async function LandingPage() {
  const context = await getActorContext();
  const signedIn = context !== null;

  return (
    <div className="bg-white">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
              A
            </span>
            <span className="text-lg font-semibold tracking-tight">
              Action<span className="text-brand-600">OS</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-brand-700"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Link
            href={signedIn ? "/dashboard" : "/login"}
            className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            {signedIn ? "Open dashboard" : "Staff sign in"}
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </header>

      <main>
        <section className="border-b border-slate-200 bg-gradient-to-b from-brand-50/70 to-white">
          <div className="mx-auto grid max-w-6xl gap-12 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold tracking-wide text-brand-700 uppercase ring-1 ring-brand-200 ring-inset">
                <Sparkles className="size-3.5" />
                Version 1 · built for homeless services
              </p>

              <h1 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
                The operating system for shelter staff, not for a spreadsheet.
              </h1>

              <p className="mt-5 max-w-xl text-lg text-slate-600">
                ActionOS is built for homeless services agencies, shelters and
                community action organizations. Staff describe what they see;
                the system turns it into the right ticket, count or log entry —
                and a person confirms it before anything is saved.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={signedIn ? "/dashboard" : "/login"}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-700"
                >
                  {signedIn ? "Open your dashboard" : "Sign in with a demo account"}
                  <ArrowRight className="size-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 ring-inset transition hover:bg-slate-50"
                >
                  See how the Action Button works
                </a>
              </div>

              <dl className="mt-10 grid gap-4 sm:grid-cols-3">
                {[
                  { term: "AI recommends", detail: "proposals, never silent writes" },
                  { term: "A human decides", detail: "confirm, edit or discard" },
                  { term: "Everything logged", detail: "who, what, when, where" },
                ].map((item) => (
                  <div
                    key={item.term}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <dt className="text-sm font-semibold text-slate-900">
                      {item.term}
                    </dt>
                    <dd className="text-sm text-slate-500">{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-brand-900/5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-semibold tracking-wide text-slate-400 uppercase">
                  Action Button
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                  Overnight shift
                </span>
              </div>

              <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-slate-200 ring-inset">
                <MessageSquareText className="mb-2 size-4 text-slate-400" />
                “Heater in Dorm B is making a grinding noise and it&apos;s cold in
                there. Also we&apos;re down to 2 cases of body wash.”
              </div>

              <p className="mt-4 text-xs font-semibold tracking-wide text-slate-400 uppercase">
                Proposed · nothing saved yet
              </p>

              <ul className="mt-3 space-y-2 text-sm">
                <li className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50/70 px-3 py-2.5">
                  <Wrench className="mt-0.5 size-4 shrink-0 text-amber-700" />
                  <span>
                    <strong className="font-semibold">Maintenance ticket</strong>{" "}
                    — high priority, Dorm B: heater making a grinding noise
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50/70 px-3 py-2.5">
                  <Boxes className="mt-0.5 size-4 shrink-0 text-brand-700" />
                  <span>
                    <strong className="font-semibold">Inventory update</strong> —
                    Body wash set to 2 cases (below the threshold of 4)
                  </span>
                </li>
                <li className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5">
                  <ScrollText className="mt-0.5 size-4 shrink-0 text-slate-500" />
                  <span>
                    <strong className="font-semibold">Shift log note</strong> —
                    maintenance, needs attention, on the overnight shift
                  </span>
                </li>
              </ul>

              <div className="mt-4 flex items-center gap-2">
                <span className="flex-1 rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-semibold text-white">
                  Confirm 3 actions
                </span>
                <span className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-slate-600 ring-1 ring-slate-300 ring-inset">
                  Discard
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            One box to type in, four places it can go
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            A float staff member at 2am should not have to know which module a
            problem belongs in. They describe it once. ActionOS classifies it,
            shows exactly what it would write, and waits.
          </p>

          <ol className="mt-10 grid gap-6 md:grid-cols-4">
            {[
              {
                step: "1",
                title: "Describe it",
                body: "Type what you saw, in the words you would use on the radio.",
              },
              {
                step: "2",
                title: "See the proposal",
                body: "An LLM (or the built-in keyword classifier) suggests structured actions and says why.",
              },
              {
                step: "3",
                title: "Confirm or edit",
                body: "Change the priority, pick the right supply item, drop what does not apply.",
              },
              {
                step: "4",
                title: "It is written and logged",
                body: "Tickets, counts and log notes are saved together, with an audit record for each.",
              },
            ].map((item) => (
              <li
                key={item.step}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <span className="flex size-8 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {item.step}
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-1.5 text-sm text-slate-600">{item.body}</p>
              </li>
            ))}
          </ol>

          <div className="mt-10 flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50 p-5">
            <Lock className="mt-0.5 size-5 shrink-0 text-slate-500" />
            <p className="text-sm text-slate-600">
              <strong className="font-semibold text-slate-900">
                No automatic actions.
              </strong>{" "}
              ActionOS does not place orders, contact residents, or submit
              reports on its own. The AI drafts; a staff member decides; the
              system executes and writes an audit record. That rule is in the
              code, not just in the pitch.
            </p>
          </div>
        </section>

        <section id="roles" className="border-y border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              A dashboard per role, enforced on the server
            </h2>
            <p className="mt-3 max-w-3xl text-lg text-slate-600">
              Role and site assignment decide what loads. A case manager cannot
              edit stock counts, and a float staff member assigned to two sites
              cannot read a third — the check runs before the query, not in the
              browser.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {ROLE_CARDS.map((card) => (
                <article
                  key={card.role}
                  className="rounded-xl border border-slate-200 bg-white p-6"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <card.icon className="size-5" />
                    </span>
                    <div>
                      <h3 className="font-semibold text-slate-900">{card.role}</h3>
                      <p className="text-sm text-slate-500">{card.summary}</p>
                    </div>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {card.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-sm text-slate-600"
                      >
                        <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="modules" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            What is actually built in v1
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            Everything below works end to end against a Postgres database. The
            roadmap further down is honest about what is not here yet.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {MODULES.map((module) => (
              <article
                key={module.title}
                className="rounded-xl border border-slate-200 bg-white p-6"
              >
                <span className="flex size-10 items-center justify-center rounded-lg bg-slate-900 text-white">
                  <module.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-semibold text-slate-900">
                  {module.title}
                </h3>
                <p className="mt-2 text-sm text-slate-600">{module.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="roadmap" className="border-y border-slate-200 bg-slate-900 py-20 text-white">
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-3xl font-bold tracking-tight">
              Not built yet — and we will say so
            </h2>
            <p className="mt-3 max-w-3xl text-lg text-slate-300">
              Software for shelters gets sold with certification badges it has
              not earned. ActionOS does not carry any. Here is the real queue.
            </p>

            <div className="mt-10 grid gap-6 md:grid-cols-2">
              {ROADMAP.map((item) => (
                <article
                  key={item.title}
                  className="rounded-xl border border-white/10 bg-white/5 p-6"
                >
                  <h3 className="font-semibold">{item.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Pricing we are working toward
          </h2>
          <p className="mt-3 max-w-3xl text-lg text-slate-600">
            These are the plans we are designing around, not a checkout page.
            Nothing is billable while v1 is being piloted.
          </p>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {PRICING.map((tier) => (
              <article
                key={tier.name}
                className={
                  tier.highlighted
                    ? "rounded-xl border-2 border-brand-500 bg-white p-6 shadow-lg shadow-brand-900/5"
                    : "rounded-xl border border-slate-200 bg-white p-6"
                }
              >
                {tier.highlighted ? (
                  <p className="mb-3 inline-flex rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700 ring-1 ring-brand-200 ring-inset">
                    Most likely fit
                  </p>
                ) : null}
                <h3 className="font-semibold text-slate-900">{tier.name}</h3>
                <p className="mt-2 flex items-baseline gap-2">
                  <span className="text-3xl font-bold tracking-tight text-slate-900">
                    {tier.price}
                  </span>
                  <span className="text-sm text-slate-500">{tier.cadence}</span>
                </p>
                <p className="mt-2 text-sm text-slate-600">{tier.description}</p>
                <ul className="mt-4 space-y-2">
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-sm text-slate-600"
                    >
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-slate-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-200 bg-slate-50 py-20">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">
              Straight answers
            </h2>
            <dl className="mt-8 divide-y divide-slate-200">
              {FAQ.map((item) => (
                <div key={item.question} className="py-5">
                  <dt className="font-semibold text-slate-900">{item.question}</dt>
                  <dd className="mt-2 text-sm text-slate-600">{item.answer}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="flex items-center gap-2 text-white">
              <span className="flex size-7 items-center justify-center rounded-lg bg-brand-600 text-xs font-bold">
                A
              </span>
              <span className="font-semibold">ActionOS</span>
            </p>
            <p className="mt-2 max-w-md text-sm">
              Operations software for homeless services agencies, shelters and
              community action organizations. Built for the work, honest about
              what it does not do yet.
            </p>
          </div>
          <div className="text-sm">
            <Link href="/login" className="font-semibold text-white hover:underline">
              Staff sign in
            </Link>
            <p className="mt-2">No certifications claimed. No resident data stored in v1.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
