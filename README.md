# ActionOS

Operations software for homeless services agencies, shelters, and community action organizations.

**Version 1** is a rebuild from scratch. Staff get role-based dashboards, an Action Button that turns a typed observation into proposed maintenance tickets / inventory changes / shift-log notes / case-manager follow-ups (a human confirms before anything is saved), and the modules behind those proposals. Every create and update is audit-logged.

Core rule: **AI recommends → a human decides → the system executes → everything is audit-logged.** No automatic orders, client outreach, or report submissions.

> v1 does **not** store resident / client personally identifying information. Bed counts are counts only. Security review comes before resident-level records.

---

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| App | **Next.js 16** (App Router) + React 19 + TypeScript | Deploys cleanly to Vercel; server components for dashboards; route handlers for the Action Button |
| UI | Tailwind CSS 4 | Fast, no design-system overhead for a first version |
| Auth | **Better Auth** (email/password) | Invite-only; no Clerk account required for local demos; session cookies with server-side role re-read |
| Database | **Postgres** + **Drizzle ORM** | Real relational data; migrations; works on Neon/Supabase/Vercel Postgres |
| Validation | Zod | Shared schemas for Action Button proposals (classify and confirm) |
| AI | OpenAI-compatible **or** Gemini (optional) | Env-var driven; deterministic keyword classifier + rollup briefing when no key is set |
| Tests | Vitest | Permission matrix and Action Button routing are unit-tested |

### Judgment calls

- **Not Clerk.** The previous AI Studio prototype depended on Clerk keys that most local clones do not have. Better Auth with email/password + a seed script makes “four demo roles log in” work from a fresh clone without a third-party dashboard.
- **No automatic LLM writes.** Classify and confirm are two separate endpoints. Confirm re-validates schemas and re-checks permissions and site scope.
- **No resident PII tables.** Inventory, tickets, occupancy, shift log, and follow-up subjects (room / bed / initials) only.
- **`cacheComponents` off.** Every authenticated screen is request-scoped to the signed-in staff member; turning on the Next 16 cache model here adds complexity without a payoff yet.

---

## Local setup

### Prerequisites

- Node.js 20.9+
- A Postgres 14+ database

### 1. Install

```bash
npm install
cp .env.example .env.local
```

### 2. Configure `.env.local`

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/actionos
BETTER_AUTH_SECRET=                      # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000
SEED_DEMO_PASSWORD=DemoPassword123!

# Optional — Action Button and briefing work without these via keyword/rollup fallbacks
# OPENAI_API_KEY=sk-...
# GEMINI_API_KEY=AIza...
```

Local Postgres example:

```bash
docker run --name actionos-pg -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16
docker exec -it actionos-pg createdb -U postgres actionos
```

### 3. Migrate and seed

```bash
npm run db:migrate
npm run db:seed
```

Seeding creates a **fictional** organization (`Riverbend Community Action (demo)`), three sites, inventory, tickets, shift notes, and four demo accounts. It refuses to run if any non-demo organization already exists.

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in from `/login`.

### Demo accounts

Password is `SEED_DEMO_PASSWORD` (default `DemoPassword123!`):

| Email | Role |
| --- | --- |
| `jamie.rivera@example.org` | Site assistant / float staff |
| `morgan.diaz@example.org` | Case manager |
| `priya.nakamura@example.org` | Shelter manager |
| `dana.whitfield@example.org` | Executive director |

These names and the agency are invented. Do not seed a database that holds real client data.

---

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (permissions + Action Button routing + briefing) |
| `npm run db:generate` | Generate a Drizzle migration from schema changes |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed fictional demo data |
| `npm run db:reset` | Truncate all tables (refuses production unless `ALLOW_DESTRUCTIVE_RESET=true`) |
| `npm run staff:create -- …` | Provision a staff account (public sign-up is disabled) |

Example staff create:

```bash
npm run staff:create -- \
  --email sam@agency.org \
  --name "Sam Lee" \
  --role shelter_manager \
  --org riverbend-demo \
  --locations "Cedar Street Shelter,Hawthorne Family Shelter"
```

---

## Deploying to Vercel

1. Create a Postgres database (Vercel Postgres, Neon, or Supabase) and put its URL in `DATABASE_URL`.
2. Set `BETTER_AUTH_SECRET` (32+ random bytes). Leave `BETTER_AUTH_URL` unset to use `VERCEL_URL`, or set it to the production origin (e.g. `https://your-app.vercel.app`).
3. Optionally set `OPENAI_API_KEY` or `GEMINI_API_KEY`.
4. For a hosted demo, set `SHOW_DEMO_LOGINS=true` and run `npm run db:migrate` then `npm run db:seed` against the production database once (CI or a one-off shell).
5. Deploy: Vercel auto-detects Next.js. No custom `vercel.json` is required.

`next build` does **not** need secrets — auth and the DB pool initialize lazily. Runtime still requires `DATABASE_URL` and `BETTER_AUTH_SECRET` in the Vercel project (Preview + Production). Without a seed, the landing page still works; sign-in needs at least one provisioned account (`staff:create` or seed).

---

## Architecture sketch

```
src/
  app/                  # App Router — landing, login, workspace pages, API routes
  components/           # UI + role dashboards + Action Button
  db/                   # Drizzle schema, queries, seed
  lib/
    permissions.ts      # Pure RBAC matrix (tested)
    action/             # Classify (LLM + keyword), apply (confirm writes)
    auth.ts             # Better Auth instance (sign-up disabled on the served app)
    actor.ts            # Fresh DB read of role + site scope per request
    audit.ts            # Append-only audit writer
  server/actions/       # Form server actions (maintenance, inventory, log, …)
  proxy.ts              # Cookie-only redirect; real auth is in pages/APIs
tests/                  # Vitest — permissions, Action Button routing, briefing
```

Authorization is enforced on the server. Hiding a nav item is never the control. Role and site assignments are re-read from Postgres on every request, not trusted from the session cookie alone.

### Roles (v1)

| Role | Focus |
| --- | --- |
| Site assistant / float | Bed counts, Action Button, shift log, inventory adjust, raise follow-ups |
| Case manager | Follow-up queue (ack / close); read shift context; cannot edit stock |
| Shelter manager | Everything for assigned sites + ticket status + manage inventory items + audit log |
| Executive director | Organization-wide roll-up, staff roster, full audit log |

---

## What was reused from the old code

Almost nothing as code. The previous Google AI Studio export (Vite + Express + SQLite + Clerk) was treated as a **vision and copy** reference:

- Kept: product vision, Action Button concept, role list, human-in-the-loop principle, pricing *ideas*
- Removed: HIPAA / SOC 2 / HUD HMIS badges, uptime SLA, “499+ nonprofits” stats, fake testimonials (including ARCHES Lodge name-drops), resident/client portals that implied PII storage
- Archived (not deleted): planning docs under `docs/legacy/`

---

## Roadmap (v2)

1. **Voice and photo input** for the Action Button (text path first, proven in a real building)
2. **Security hardening + privacy design** before any resident-level data
3. **HUD HMIS / compliance reporting** (APR, CAPER, PIT) on top of that model
4. **Grant discovery and drafting** — same AI-recommends / human-submits pattern
5. **HR and scheduling** (coverage, certifications, TB / background tracking)
6. **Client risk prediction** last — highest cost of being wrong

---

## License

MIT
