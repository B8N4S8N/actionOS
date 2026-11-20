# ActionOS Development Lessons

This file captures lessons learned during development to prevent repeating mistakes.

---

## 2026-04-04: API Endpoint Mismatch Crisis

**Problem:** ActionButton component called `/api/logs` but the actual endpoint in server.ts was `/api/action`. This broke the core AI action logging feature.

**Lesson:** Always verify frontend API calls match backend endpoints exactly. Maintain a shared API contract document or type definitions that both sides reference.

**Prevention:**
- Create shared API route constants
- Use TypeScript for both frontend and backend with shared types
- Implement API integration tests that catch 404s

---

## 2026-04-04: The Mock Data Trap

**Problem:** Multiple pages (ClientPortal, HRDashboard, Dashboard) use hardcoded mock data that appears functional but doesn't actually persist or reflect real state.

**Examples:**
- ClientPortal: All forms use setTimeout simulation instead of real API calls
- HRDashboard: Staff array is completely hardcoded with 3 fake employees
- Dashboard: "84/100 beds" and AI briefing are static strings

**Lesson:** Never ship hardcoded mock data, even as "temporary" placeholders. Users will think features work when they don't.

**Prevention:**
- Use loading skeletons instead of fake data
- Implement feature flags to hide unfinished features
- Mark WIP features clearly in UI with "Coming Soon" badges

---

## 2026-04-04: Database Schema Drift

**Problem:** Tables for Logs, Tasks_WorkOrders, and Incidents_SOS are referenced in INSERT statements but no CREATE TABLE statements exist. The database was created without these tables.

**Lesson:** Always create CREATE TABLE statements before writing INSERT logic. Schema initialization order matters.

**Prevention:**
- Use a migration system (node-pg-migrate, better-sqlite3 migrations)
- Never reference tables that don't exist in schema init
- Add startup schema validation

---

## 2026-04-04: Hardcoded IDs Everywhere

**Problem:** Throughout the codebase, `user_id: 1`, `user_id: "u1"`, `site_id: 1`, `site_id: "s1"` are hardcoded. This breaks multi-user functionality and data isolation.

**Locations Found:**
- ActionButton.tsx: Line 24
- SOSSwipe.tsx: Lines 18-19
- Server endpoints: Multiple locations

**Lesson:** Never hardcode IDs when authentication is available. Always use the authenticated user's context.

**Prevention:**
- Create a shared auth context/hook that provides user, site, and role
- Use TypeScript to enforce passing real IDs
- Code review checklist: "No hardcoded IDs allowed"

---

## 2026-04-04: Clerk Context Underutilized

**Problem:** Clerk is fully integrated for authentication, but components aren't using useUser() hook to get real user data. Instead, they're using hardcoded IDs.

**Lesson:** If you integrate an auth provider, use it fully. Partial integration creates confusion and bugs.

**Prevention:**
- Pass Clerk user through React Context
- Create typed wrappers for API calls that inject user_id automatically
- Add ESLint rule to prevent hardcoded user IDs

---

## 2026-04-04: Feature UI Without Feature Backend

**Problem:** ActionButton has voice and photo modes in UI, but no actual implementation. Voice mode shows "Listening..." but doesn't record. Photo mode accepts files but doesn't process them.

**Lesson:** Don't build UI for features you haven't implemented. It creates false expectations and technical debt.

**Prevention:**
- Implement backend first, then frontend
- Use feature flags to hide unimplemented UI
- Be honest in UI: "Voice input coming soon" vs fake functionality

---

## 2026-04-04: Styling Inconsistency Creep

**Problem:** Different pages use different styling conventions:
- Border radius: `rounded-2xl` vs `rounded-3xl`
- Max width: `max-w-4xl` vs `max-w-7xl`
- Padding: Inconsistent top-level padding
- Backgrounds: Some use `bg-zinc-50`, others don't

**Lesson:** Establish design system conventions early and stick to them. Shared components enforce consistency.

**Prevention:**
- Create a shared PageHeader component
- Define design tokens in Tailwind config
- Use CSS variables for spacing/sizing scale
- Audit styling in PR reviews

---

## 2026-04-04: Error Handling Neglect

**Problem:** Multiple API calls lack error handling:
- Dashboard fetches from non-existent endpoints (will 404 but no UI feedback)
- SOSSwipe has no error handling for failed API calls
- ClientPortal form submissions fail silently

**Lesson:** Every API call needs error handling. Users should know when something goes wrong.

**Prevention:**
- Use React Query for automatic loading/error states
- Create standardized error toast/notification system
- Add global error boundary for crashes

---

## 2026-04-04: AI Integration Without Fallbacks

**Problem:** AI features (Vision, Outreach AI, Action processing) don't have non-AI fallback flows. If Gemini API fails or hits rate limits, features break completely.

**Lesson:** AI should enhance, not replace, core functionality. Always have manual fallback.

**Prevention:**
- Add "Enter manually" buttons on all AI-assisted inputs
- Implement graceful degradation when AI is unavailable
- Cache AI responses where appropriate
- Monitor AI API quota/rate limits

---

## 2026-04-04: Single File Backend Bloat

**Problem:** server.ts is nearly 900 lines with all routes, schema, and logic in one file. It's becoming hard to maintain.

**Lesson:** Split code by responsibility as it grows. Monolithic files become unmanageable.

**Prevention:**
- Organize routes into /routes/ directory
- Separate middleware into /middleware/
- Move schema to /db/schema.ts or migrations
- Consider MVC pattern or similar organization

---

## General Principles

1. **Ship working features over perfect features.** Better to have 5 fully working features than 10 half-working ones.

2. **Real data over fake data.** Loading states > mock data. Users can wait; they can't use fake data.

3. **Auth context is sacred.** Never hardcode user IDs. The user context drives the entire app experience.

4. **API contract first.** Define types, endpoints, and contracts before implementing. Share between frontend and backend.

5. **Design system early.** Establish shared components and tokens before building multiple pages.

6. **AI is augmentation.** Core flows should work without AI. AI makes them faster/easier.

7. **Test the critical path.** SOS, client intake, inventory tracking - these must never break.

---

*Last updated: 2026-04-04*

---

## 2026-11-20: Rebuild — do not patch an AI Studio prototype

**Problem:** The Google AI Studio export mixed a Vite SPA, Express, SQLite, Clerk, and marketing claims (HIPAA/SOC 2/fake testimonials) into one unmaintainable tree. Patching it kept shipping fiction as product.

**Lesson:** When the foundation is wrong, replace the codebase and keep only the vision/copy that is still true. Seed only clearly fictional people and sites. Enforce roles on the server for every write, not by hiding UI. Make AI write paths two-step (propose → human confirm) so the app works without an API key via a keyword fallback.

**Prevention:**
- Prefer invite-only auth with a local seed over third-party keys for demos
- Keep permission logic pure and unit-tested
- Never claim compliance certifications that have not been audited
