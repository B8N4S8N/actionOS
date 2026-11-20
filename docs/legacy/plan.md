# ActionOS - Development Plan & Roadmap

## Executive Summary

**ActionOS** is a comprehensive "Operational Nervous System" for homelessness services agencies, specifically designed for MWVCAA/ARCHES. It's a full-stack web application built with React 19, TypeScript, Express, SQLite, and Google Gemini AI integration.

**Current Status:** ~70% Complete - Core infrastructure is solid, but many frontend components use mock/hardcoded data and several API endpoints are missing.

---

## 1. Application Overview

### Purpose
ActionOS digitizes the entire workflow of a homelessness services agency:
- **Client Management:** Intake, case notes, bed assignments, document tracking
- **Inventory Control:** QR-based item tracking, AI-powered pile counting, predictive reordering
- **Outreach Operations:** Mobile street outreach logging with AI transcription
- **Staff Management:** Role-based access, scheduling, SOS emergency alerts
- **Facility Management:** Room assignments, maintenance requests

### Target Users
| Role | Dashboard | Key Features |
|------|-----------|--------------|
| Super Admin | AdminPanel | User management, location config, audit logs |
| Director | AdminPanel | Client oversight, inventory control, reports |
| Case Manager | CaseManagerDashboard | Client notes, AI resource matching, caseload |
| Facilities Manager | (shares AdminPanel) | Inventory, maintenance requests |
| HR Manager | HRDashboard | Staff roster, shift management |
| Outreach Worker | OutreachPanel | Mobile logging, AI note transcription |
| Client | ClientPortal | Bed requests, appointments, document upload |
| Site Staff | Dashboard | Bed capacity, activity feed, shift briefings |

### Tech Stack
- **Frontend:** React 19 + TypeScript + Tailwind CSS v4 + Motion
- **Backend:** Express.js + TypeScript
- **Database:** SQLite (better-sqlite3)
- **Authentication:** Clerk (@clerk/clerk-react + @clerk/express)
- **AI:** Google Gemini API (@google/genai)
- **Build:** Vite v6.2
- **QR Scanning:** html5-qrcode

---

## 2. Current State Assessment

### What's Working (Solid Foundation)
1. **Authentication Flow:** Clerk integration with role-based access control
2. **Database Schema:** 15+ tables with proper relationships, audit logging, HIPAA considerations
3. **Core CRUD APIs:** Users, clients, inventory, locations, rooms all have working endpoints
4. **AI Integration Endpoints:**
   - `/api/inventory/vision` - Computer vision for pile counting
   - `/api/inventory/reorder-intelligence` - Predictive analytics
   - `/api/outreach/ai-log` - Natural language to structured data
   - `/api/action` - Two-tier AI processing (Flash + Pro)
5. **Inventory System:** Full QR scanning, AI pile scanning, transaction logging
6. **Role Router:** Proper routing based on user roles

### Critical Issues (Blocking Features)

| Priority | Issue | Impact | Location |
|----------|-------|--------|----------|
| **P0** | ActionButton calls wrong API endpoint | AI action logging completely broken | `ActionButton.tsx:19` |
| **P0** | Missing `GET /api/logs` endpoint | Dashboard shows no activity | `Dashboard.tsx:12` |
| **P0** | Missing `GET /api/tasks` endpoint | Tasks never display | `Dashboard.tsx:13` |
| **P0** | Missing `GET /api/incidents` endpoint | SOS/incidents not visible | `Dashboard.tsx:14` |
| **P0** | Missing `POST /api/ai/resources` | Case manager AI resources broken | `CaseManagerDashboard.tsx:19` |
| **P1** | Missing database tables for Logs, Tasks, Incidents | Data persistence fails | `server.ts` |

### High Priority Issues (Major UX Impact)

| Issue | Current State | Expected Behavior |
|-------|---------------|-------------------|
| **ClientPortal** | 100% mock data - forms don't submit | Real bed requests, appointments, document upload |
| **HRDashboard** | Hardcoded 3 staff members | Live staff roster from `/api/admin/users` |
| **Dashboard Bed Count** | Hardcoded "84/100" | Real occupancy from `Rooms` + `Client_Roster` |
| **AI Shift Briefing** | Hardcoded text about "3 late arrivals" | Dynamic summary from actual log data |
| **ActionButton Voice** | Visual "Listening..." mock only | Actual voice-to-text recording |
| **Hardcoded User/Site IDs** | `user_id: 1`, `site_id: 1` throughout | Real IDs from Clerk auth context |
| **SOSSwipe** | No confirmation, no error feedback | Confirmation dialog, retry logic, status display |

### Medium Priority Issues (Polish & Consistency)

| Issue | Details |
|-------|---------|
| **Styling Inconsistencies** | Different border radius (`rounded-2xl` vs `rounded-3xl`), inconsistent padding/max-width |
| **No Shared Header Component** | Each page implements its own header |
| **Version Badge Hardcoded** | LandingPage shows "v1.2.0 Stable" - won't update |
| **CaseManagerDashboard Caseload** | "My Caseload: 24" is hardcoded |
| **InventorySystem UX** | Vision result quantities use uncontrolled inputs |

### Database Schema Gaps

Missing `CREATE TABLE` statements in `server.ts`:
- `Logs` - Referenced in `Audit_Logs` comments but no actual table
- `Tasks_WorkOrders` - Referenced in ActionButton logic but no table
- `Incidents_SOS` - Referenced in POST /api/sos but no table

---

## 3. Prioritized Implementation Roadmap

### Phase 1: Critical Fixes (Week 1)
**Goal:** Make broken features functional

#### 3.1.1 Fix ActionButton API Endpoint
**File:** `src/components/ActionButton.tsx`  
**Change:** Line 19 - Replace `/api/logs` with `/api/action`  
**Estimated Time:** 15 minutes

#### 3.1.2 Create Missing Database Tables
**File:** `server.ts` (schema initialization section)  
**Add:**
```sql
CREATE TABLE IF NOT EXISTS Logs (
  log_id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id TEXT NOT NULL,
  site_id INTEGER,
  action_type TEXT,
  description TEXT,
  metadata TEXT -- JSON
);

CREATE TABLE IF NOT EXISTS Tasks_WorkOrders (
  task_id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT NOT NULL,
  assigned_to TEXT,
  site_id INTEGER,
  category TEXT,
  priority TEXT, -- LOW, MEDIUM, HIGH, CRITICAL
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, IN_PROGRESS, COMPLETED, CANCELLED
  due_date DATETIME,
  completed_at DATETIME,
  related_client_id INTEGER,
  related_log_id INTEGER
);

CREATE TABLE IF NOT EXISTS Incidents_SOS (
  incident_id INTEGER PRIMARY KEY AUTOINCREMENT,
  triggered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME,
  triggered_by TEXT NOT NULL,
  site_id INTEGER,
  severity TEXT, -- LOW, MEDIUM, HIGH, CRITICAL
  location_description TEXT,
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, RESOLVED, FALSE_ALARM
  response_notes TEXT
);
```
**Estimated Time:** 30 minutes

#### 3.1.3 Implement Missing GET Endpoints
**File:** `server.ts`  
**Add:**
- `GET /api/logs` - Returns recent activity logs
- `GET /api/tasks` - Returns tasks for user's site/role
- `GET /api/incidents` - Returns SOS/incidents
- `GET /api/occupancy` - Returns bed occupancy stats

**Estimated Time:** 2 hours

#### 3.1.4 Implement Missing POST Endpoint
**File:** `server.ts`  
**Add:** `POST /api/ai/resources` - AI-powered resource matching for case managers  
**Estimated Time:** 1 hour

---

### Phase 2: Connect Frontend to Real Data (Week 2)
**Goal:** Replace all mock/hardcoded data with live API data

#### 3.2.1 Dashboard Real Data
**File:** `src/pages/Dashboard.tsx`
- [ ] Replace hardcoded bed capacity with `/api/occupancy`
- [ ] Connect activity feed to `GET /api/logs`
- [ ] Connect tasks to `GET /api/tasks`
- [ ] Connect incidents to `GET /api/incidents`
- [ ] Generate AI Shift Briefing from actual log data

**Estimated Time:** 3 hours

#### 3.2.2 HRDashboard Live Staff Data
**File:** `src/pages/HRDashboard.tsx`
- [ ] Replace hardcoded staff array with `GET /api/admin/users`
- [ ] Calculate "staff on shift" from user access data
- [ ] Calculate "open shifts" from scheduling data

**Estimated Time:** 2 hours

#### 3.2.3 CaseManagerDashboard Real Caseload
**File:** `src/pages/CaseManagerDashboard.tsx`
- [ ] Replace hardcoded "24" caseload with actual count from `HMIS_Records`
- [ ] Connect resource matching to `POST /api/ai/resources`

**Estimated Time:** 1.5 hours

---

### Phase 3: Client Portal Implementation (Week 3)
**Goal:** Make client-facing features fully functional

#### 3.3.1 Client Portal APIs
**File:** `server.ts`
- [ ] `GET /api/client/beds` - Available bed slots
- [ ] `POST /api/client/bed-request` - Submit bed request
- [ ] `GET /api/client/documents` - Client's uploaded documents
- [ ] `POST /api/client/documents` - Upload document
- [ ] `GET /api/client/appointments` - Upcoming appointments
- [ ] `POST /api/client/appointments` - Schedule appointment
- [ ] `GET /api/client/showers` - Shower schedule

**Estimated Time:** 4 hours

#### 3.3.2 Client Portal Integration
**File:** `src/pages/ClientPortal.tsx`
- [ ] Replace all hardcoded data with API calls
- [ ] Implement actual form submission handlers
- [ ] Add loading states and error handling

**Estimated Time:** 3 hours

---

### Phase 4: Authentication Context & Polish (Week 4)
**Goal:** Proper user context and UI consistency

#### 3.4.1 Clerk User Context
**Files:** All components using `user_id`
- [ ] Create `useAuth()` hook or context for real user data
- [ ] Replace all `user_id: 1` with actual Clerk user ID
- [ ] Replace all `site_id: 1` with user's assigned location

**Estimated Time:** 3 hours

#### 3.4.2 SOSSwipe Improvements
**File:** `src/components/SOSSwipe.tsx`
- [ ] Add confirmation dialog
- [ ] Add error handling with retry
- [ ] Add visual/audio feedback when triggered
- [ ] Add "Active SOS" status display

**Estimated Time:** 2 hours

#### 3.4.3 UI Standardization
**Files:** All page components
- [ ] Create shared `PageHeader` component
- [ ] Standardize on `rounded-3xl` for cards
- [ ] Standardize max-width (`max-w-7xl` for dashboards)
- [ ] Standardize background (`bg-zinc-50` consistently)
- [ ] Standardize card shadows (`shadow-sm` or `shadow-md`)

**Estimated Time:** 2 hours

---

### Phase 5: Feature Completion (Week 5-6)
**Goal:** Finish partially implemented features

#### 3.5.1 ActionButton Voice Mode
**File:** `src/components/ActionButton.tsx`
- [ ] Implement actual MediaRecorder API for voice capture
- [ ] Speech-to-text using Web Speech API or Gemini
- [ ] Or: Remove voice mode if not needed

**Estimated Time:** 4 hours (or 30 min to remove)

#### 3.5.2 ActionButton Photo Processing
**File:** `src/components/ActionButton.tsx`
- [ ] Actually send photo to `/api/action` endpoint
- [ ] Handle image preview and upload

**Estimated Time:** 1 hour

#### 3.5.3 Version Badge Automation
**File:** `src/pages/LandingPage.tsx`
- [ ] Read version from `package.json` dynamically
- [ ] Or: Use build-time environment variable

**Estimated Time:** 30 minutes

---

## 4. Suggested Additional Features

### High Value Additions

| Feature | Description | Priority |
|---------|-------------|----------|
| **Offline Mode** | PWA with service worker for field outreach | P1 |
| **Push Notifications** | SOS alerts, task assignments, bed availability | P1 |
| **Analytics Dashboard** | Charts for occupancy trends, inventory usage, case outcomes | P2 |
| **Bulk Data Import** | CSV import for client intake, inventory | P2 |
| **Document OCR** | AI-powered document scanning for ID cards, forms | P2 |
| **Multi-language Support** | i18n for Spanish, other languages | P3 |
| **SMS Integration** | Twilio for appointment reminders, bed availability | P3 |

### Technical Improvements

| Improvement | Description | Priority |
|-------------|-------------|----------|
| **API Documentation** | Swagger/OpenAPI spec | P2 |
| **Automated Tests** | Jest + React Testing Library | P2 |
| **Database Migrations** | Proper migration system (e.g., node-pg-migrate) | P2 |
| **Rate Limiting** | Express-rate-limit for AI endpoints | P2 |
| **Error Monitoring** | Sentry integration | P3 |
| **Performance Monitoring** | Lighthouse CI, Web Vitals | P3 |

---

## 5. Architecture Decisions & Recommendations

### 5.1 Database Migration Strategy
**Current:** Schema created in `server.ts` startup  
**Recommended:** Implement proper migration system:
```
/migrations
  001_initial_schema.sql
  002_add_logs_table.sql
  003_add_tasks_table.sql
  ...
```
**Tool:** `node-pg-migrate` or `better-sqlite3` with custom migration runner

### 5.2 API Organization
**Current:** All routes in single `server.ts` file (~900 lines)  
**Recommended:** Split into route modules:
```
/server
  /routes
    auth.ts
    users.ts
    clients.ts
    inventory.ts
    outreach.ts
    ai.ts
  /middleware
    auth.ts
    errorHandler.ts
  server.ts
```

### 5.3 Frontend State Management
**Current:** Local state with `useState`, prop drilling  
**Recommended:** Consider for future scale:
- React Query (TanStack Query) for server state
- Zustand for client state (if needed beyond React Query)

### 5.4 Type Safety
**Current:** Some `any` types, hardcoded IDs as numbers/strings  
**Recommended:**
- Define shared types in `src/types/`:
  ```typescript
  // types/index.ts
  export interface User {
    id: string; // Clerk ID
    role: 'SUPER_ADMIN' | 'DIRECTOR' | ...;
    siteId: number;
    ...
  }
  ```
- Share types between frontend and backend via TypeScript project references

---

## 6. Testing Strategy

### 6.1 Unit Tests
- **Components:** React Testing Library + Jest
- **API Routes:** Supertest for Express endpoints
- **AI Integration:** Mock Gemini responses for deterministic tests

### 6.2 Integration Tests
- End-to-end flows: Login → Role routing → Dashboard data
- Critical paths: SOS alert, Inventory transaction, Client intake

### 6.3 Manual Testing Checklist
| Feature | Test Steps |
|---------|------------|
| Role Routing | Login with each role → correct dashboard |
| Inventory QR | Scan QR → checkout → check back in |
| AI Vision | Upload photo of item pile → correct count |
| SOS | Trigger SOS → verify in incidents list |
| Client Portal | Submit bed request → verify in admin panel |

---

## 7. Deployment & DevOps

### 7.1 Environment Variables
**Required:**
```
VITE_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
GEMINI_API_KEY=AIza...
```

### 7.2 Build Configuration
**Current:** Vite with ES modules  
**Production Build:**
```bash
npm run build  # Creates dist/ for frontend
# Server: tsx server.ts (or compile to dist-server/)
```

### 7.3 Database Backup
**SQLite:** Copy `actionos.db` file for backup  
**Recommended:** Automated daily backups with timestamp

### 7.4 Hosting Recommendations
| Component | Recommendation |
|-----------|----------------|
| Frontend | Vercel or Netlify |
| Backend | Railway, Render, or Fly.io |
| Database | SQLite (included) or migrate to PostgreSQL |
| File Storage | Cloudinary or AWS S3 for document uploads |

---

## 8. Lessons Learned & Documentation

Add to `lessons.cursorrules`:
```markdown
## ActionOS Development Lessons

### 2026-04-04: API Endpoint Mismatch
Always verify frontend API calls match backend endpoints exactly.
ActionButton called `/api/logs` but endpoint was `/api/action`.

### 2026-04-04: Mock Data Trap
Don't hardcode mock data - even "temporary" mock data persists.
Use feature flags or loading states instead.

### 2026-04-04: Database Schema Drift
Always create CREATE TABLE statements before writing INSERT logic.
Logs/Tasks/Incidents tables were referenced but never created.

### 2026-04-04: Clerk Context
Use Clerk's useUser() hook everywhere - never hardcode user_id.
Create shared auth context for user + site + role data.
```

---

## 9. Success Metrics

Define completion criteria:

| Metric | Target | Current |
|--------|--------|---------|
| API Endpoint Coverage | 100% | ~70% |
| Mock Data Removal | 0 hardcoded | ~40 locations |
| Test Coverage | 80% | 0% |
| Lighthouse Score | 90+ all categories | Unknown |
| AI Feature Reliability | 95%+ accuracy | ~85% |
| Load Time | <2s | Unknown |

---

## 10. Immediate Next Steps (Start Here)

1. **Fix ActionButton API call** (15 min) - Unblocks AI logging
2. **Add missing database tables** (30 min) - Unblocks data persistence
3. **Implement GET /api/logs** (45 min) - Unblocks Dashboard
4. **Connect Dashboard to real data** (2 hours) - Big UX improvement
5. **Create shared auth context** (1 hour) - Fixes hardcoded IDs

**Total: ~4 hours to get from 70% → 85% functional**

---

*Plan created: 2026-04-04*  
*ActionOS Version: 1.2.0*  
*Maintainer: Ryan Fortin*
