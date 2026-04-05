# ActionOS - Enterprise Production Readiness Plan

## Executive Summary

**Vision:** Transform ActionOS from a functional homelessness services management tool into a HIPAA-compliant, enterprise-grade "Operational Nervous System" for large nonprofit organizations managing multiple locations, diverse programs, and complex funding streams.

**Current State:** ~85% functional MVP with basic RBAC, AI integration, and core workflows.
**Target State:** Production-ready SaaS platform serving 50+ concurrent users across 10+ locations with SOC2/HIPAA compliance.

**Timeline:** 6-9 months to full production readiness
**Budget Estimate:** $150K-$250K (development, security audit, compliance certification)

---

## 1. Compliance & Security Framework

### 1.1 HIPAA Compliance (If Applicable)

**Applicability Determination:**
- **Covered Entity:** If ActionOS receives PHI from healthcare providers or shares data for treatment purposes
- **Business Associate:** If third-party AI (Google Gemini) processes PHI
- **Self-Determination:** Even if not HIPAA-mandated, implement as best practice

**Technical Safeguards Implementation:**

| Requirement | Implementation | Priority |
|-------------|----------------|----------|
| **Access Control** | UUID-based unique user IDs | P0 |
| | Role-based access control (RBAC) | P0 |
| | Multi-factor authentication (MFA) | P0 |
| | Automatic session timeout (15 min) | P1 |
| | Emergency access procedure | P2 |
| **Audit Controls** | Comprehensive logging of all PHI access | P0 |
| | 6-year log retention | P1 |
| | Tamper-proof audit storage | P1 |
| | Real-time anomaly detection | P2 |
| **Integrity** | Data validation at entry points | P0 |
| | Checksums for critical records | P1 |
| | Version control for client records | P2 |
| **Person Authentication** | MFA for admin/director roles | P0 |
| | Biometric support (fingerprint) | P3 |
| **Transmission Security** | TLS 1.3 minimum | P0 |
| | End-to-end encryption for mobile | P1 |
| | VPN for offsite access | P2 |

**Data Encryption Strategy:**
```
┌─────────────────────────────────────────────────────────┐
│                    ENCRYPTION LAYERS                     │
├─────────────────────────────────────────────────────────┤
│ Layer 1: Database (At Rest)                              │
│   - AES-256 for sensitive fields                         │
│   - Fields: SSN, medical_issues, medications,           │
│            addictions, DOB, phone, email                │
│   - Database: PostgreSQL with pgcrypto                  │
├─────────────────────────────────────────────────────────┤
│ Layer 2: Application (In Transit)                         │
│   - TLS 1.3 for all connections                          │
│   - Certificate pinning for mobile app                   │
├─────────────────────────────────────────────────────────┤
│ Layer 3: Field-Level (PII/PHI)                          │
│   - Encrypt before storing in DB                        │
│   - Decrypt only when displaying to authorized user       │
│   - Key rotation every 90 days                          │
├─────────────────────────────────────────────────────────┤
│ Layer 4: Backup Encryption                               │
│   - All backups encrypted with separate key              │
│   - Offsite storage with access logging                  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 SOC 2 Type II Certification

**Trust Service Criteria:**

| Criteria | Requirements | Implementation |
|----------|--------------|----------------|
| **Security** | System protected against unauthorized access | MFA, RBAC, encryption, monitoring |
| **Availability** | System available for operation and monitoring | 99.9% SLA, redundant infrastructure |
| **Processing Integrity** | System processing is complete, valid, accurate, timely | Data validation, audit trails |
| **Confidentiality** | Confidential information is protected | Encryption, access controls |
| **Privacy** | Personal information is collected, used, retained, disclosed per privacy notice | Consent management, data retention policies |

**SOC 2 Implementation Roadmap:**
- **Month 1-2:** Gap analysis and policy documentation
- **Month 3-4:** Technical controls implementation
- **Month 5-6:** Auditor engagement and Type I assessment
- **Month 7-12:** Type II monitoring period
- **Month 13:** SOC 2 Type II report issued

### 1.3 State Privacy Laws Compliance

**Applicable Regulations:**
- **CCPA/CPRA** (California) - Consumer privacy rights
- **GDPR** (EU visitors/staff) - Data protection
- **State-specific:** Virginia CDPA, Colorado CPA, etc.

**Implementation:**
- Privacy notice and consent management
- Data subject rights portal (access, delete, export)
- Cookie consent for web visitors
- Cross-border data transfer safeguards

### 1.4 HUD HMIS Compliance

**Requirements:**
- HUD-approved data standards
- Coordinated Entry System integration
- Federal reporting (Annual Progress Report)
- Data quality standards
- Privacy protections for homeless clients

**Implementation:**
- HMIS data element mapping
- Automated HUD report generation
- Data quality dashboards
- Coordinated Entry workflow integration

---

## 2. Enterprise Role-Based Access Control (RBAC)

### 2.1 Role Hierarchy

```
┌─────────────────────────────────────────────────────────┐
│                    ROLE HIERARCHY                        │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────┐                                        │
│  │ SUPER ADMIN  │ ◄── System configuration, all access  │
│  └──────┬───────┘                                        │
│         │                                                │
│  ┌──────▼───────┐  ┌──────────────┐  ┌──────────────┐   │
│  │   EXECUTIVE  │  │    PROGRAM   │  │   FINANCE    │   │
│  │   DIRECTOR   │  │   DIRECTOR   │  │   DIRECTOR   │   │
│  │              │  │              │  │              │   │
│  │ • All sites  │  │ • Site access │  │ • Budgets    │   │
│  │ • All data   │  │ • Programs    │  │ • Donations  │   │
│  │ • Reports    │  │ • Staff mgmt  │  │ • Reports    │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                 │                  │          │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐   │
│  │  SITE ADMIN  │  │ CASE MANAGER │  │  HR MANAGER  │   │
│  │              │  │              │  │              │   │
│  │ • Single site│  │ • Assigned   │  │ • Recruiting │   │
│  │ • Local staff│  │   clients    │  │ • Payroll    │   │
│  │ • Inventory  │  │ • Notes      │  │ • Compliance │   │
│  └──────┬───────┘  └──────────────┘  └──────────────┘   │
│         │                                                │
│  ┌──────▼───────┐  ┌──────────────┐  ┌──────────────┐   │
│  │FACILITIES    │  │  OUTREACH    │  │   ENGAGEMENT │   │
│  │  MANAGER     │  │  COORDINATOR │  │ COORDINATOR  │   │
│  │              │  │              │  │              │   │
│  │ • Maintenance│  │ • Street     │  │ • Events     │   │
│  │ • Safety     │  │   outreach   │  │ • Volunteers │   │
│  │ • Supplies   │  │ • Events     │  │ • Marketing  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  IT SUPPORT  │  │ DATA ANALYST │  │ GRANTS       │   │
│  │              │  │              │  │ MANAGER      │   │
│  │ • Help desk  │  │ • Reports    │  │ • Proposals  │   │
│  │ • Security   │  │ • Analytics  │  │ • Compliance │   │
│  │ • Systems    │  │ • Dashboards │  │ • Reporting  │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐                    │
│  │  FRONT DESK  │  │   VOLUNTEER  │                    │
│  │              │  │              │                    │
│  │ • Check-in   │  │ • Limited    │                    │
│  │ • Intake     │  │   read-only  │                    │
│  │ • Bed assign │  │ • Events     │                    │
│  └──────────────┘  └──────────────┘                    │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Permission Matrix

**Resource Types:**
1. **Clients** - View, Create, Update, Delete, Export
2. **Case Notes** - View Own, View Team, View All, Create, Edit, Delete
3. **Bed/Room Management** - View, Assign, Transfer, Release
4. **Inventory** - View, Check Out, Check In, Order, Manage Categories
5. **Staff** - View, Create, Update, Deactivate, Manage Roles
6. **Financial** - View Budget, Edit Budget, View Donations, Process Donations
7. **Maintenance** - View, Create Request, Manage Requests, Complete
8. **Reports** - View Standard, Create Custom, Export, Schedule
9. **Admin** - Manage Locations, System Settings, Audit Logs, Data Export
10. **AI Features** - Use Action Button, View Analytics, Configure Prompts

**Location-Based Permissions:**
- **Global Access:** Executive Director, Super Admin, Finance Director, Grants Manager
- **Multi-Location:** Program Director (assigned programs across sites)
- **Single Location:** Site Admin, Case Managers, Facilities Manager, Front Desk
- **Mobile:** Outreach Coordinator (all sites during outreach)

### 2.3 Permission Implementation

**Database Schema:**
```sql
-- Enhanced permissions system
CREATE TABLE Permissions (
  id TEXT PRIMARY KEY,
  resource TEXT NOT NULL, -- 'clients', 'beds', 'inventory', etc.
  action TEXT NOT NULL,   -- 'view', 'create', 'update', 'delete'
  scope TEXT DEFAULT 'own', -- 'own', 'team', 'location', 'organization', 'global'
  description TEXT
);

CREATE TABLE Role_Permissions (
  role_id TEXT REFERENCES Roles(id),
  permission_id TEXT REFERENCES Permissions(id),
  conditions JSON, -- { locations: ['loc1'], programs: ['emergency_shelter'] }
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE User_Permissions (
  user_id TEXT REFERENCES Users(id),
  permission_id TEXT REFERENCES Permissions(id),
  granted_by TEXT,
  granted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  reason TEXT
);
```

**API Middleware:**
```typescript
// Permission checking middleware
const requirePermission = (resource: string, action: string, scope: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.auth.userId;
    const userRole = await getUserRole(userId);
    
    // Check if user has permission
    const hasPermission = await checkPermission(userId, resource, action, scope, {
      locationId: req.query.location_id,
      clientId: req.params.clientId,
      targetUserId: req.body.user_id
    });
    
    if (!hasPermission) {
      auditLog('ACCESS_DENIED', { userId, resource, action, scope });
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Usage
app.get('/api/clients', 
  requirePermission('clients', 'view', 'location'),
  getClients
);
```

### 2.4 Segregation of Duties

**Critical Actions Requiring Dual Authorization:**
- Client data export (requires supervisor approval)
- Staff termination (requires HR + Supervisor approval)
- Budget modifications >$1,000 (requires Finance Director approval)
- System configuration changes (requires 2 admins)
- Data deletion (requires Super Admin + documented reason)

**Implementation:**
```typescript
// Dual authorization workflow
const requireDualAuth = async (action: string, primaryUserId: string) => {
  // Create pending action
  const pendingAction = await createPendingAction({
    action,
    requested_by: primaryUserId,
    status: 'pending_approval',
    expires_at: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  });
  
  // Notify approvers
  await notifyApprovers(action, pendingAction.id);
  
  return { pendingId: pendingAction.id, status: 'pending' };
};
```

---

## 3. Multi-Location Architecture

### 3.1 Location Hierarchy

```
ORGANIZATION (e.g., MWVCAA)
├── Program: Emergency Shelter Services
│   ├── Site: ARCHES Lodge (Main Campus)
│   │   ├── Building: Main Lodge
│   │   │   ├── Floor: 1st Floor
│   │   │   │   ├── Room: 101 (4 beds)
│   │   │   │   ├── Room: 102 (4 beds)
│   │   │   │   └── Room: 103 (2 beds - accessible)
│   │   │   └── Floor: 2nd Floor
│   │   ├── Building: Family Unit
│   │   └── Outdoor: Parking, Smoking Area
│   ├── Site: The Nest (Youth Shelter)
│   └── Site: Mobile Outreach Unit 1
├── Program: Permanent Supportive Housing
│   ├── Site: Oak Street Apartments
│   └── Site: Maple Grove Village
├── Program: Street Outreach
│   └── Site: Mobile (No fixed location)
└── Admin Office
    └── Site: Central Administration
```

### 3.2 Data Isolation & Sharing

**Data Access Rules:**
1. **Client Data:** Visible to all sites (client may access multiple programs)
2. **Bed/Room Data:** Site-specific (Site Admin sees only their site)
3. **Staff Data:** Organization-wide (HR sees all, managers see their team)
4. **Financial Data:** Program-specific with rollup to Finance Director
5. **Inventory:** Site-specific with transfer history visible to Facilities
6. **Case Notes:** Visible to case manager's site + client (with consent)

**Cross-Location Client Transfers:**
```typescript
// When client moves from ARCHES to PSH
const transferClient = async (clientId: string, fromSite: string, toSite: string) => {
  // 1. Verify both sites have permission to view client
  // 2. Transfer bed assignment (release from ARCHES)
  // 3. Create referral record (document the transfer)
  // 4. Notify receiving site case manager
  // 5. Copy relevant case notes (with date filter)
  // 6. Audit log the transfer
};
```

### 3.3 Site-Specific Configuration

**Per-Site Settings:**
- Bed capacity and room configuration
- Check-in/check-out times
- Intake forms and required documents
- Local inventory categories
- Staff shift schedules
- Site-specific workflows (e.g., family shelter vs single adult)
- Local policies and procedures
- Emergency contacts

**Configuration Database:**
```sql
CREATE TABLE Site_Configuration (
  site_id TEXT PRIMARY KEY REFERENCES Locations(id),
  config_key TEXT,
  config_value JSON,
  updated_by TEXT,
  updated_at DATETIME
);

-- Example configurations
INSERT INTO Site_Configuration VALUES 
  ('loc_arches', 'check_in_time', '"16:00"', 'admin', NOW()),
  ('loc_arches', 'check_out_time', '"08:00"', 'admin', NOW()),
  ('loc_arches', 'required_documents', '["ID", "TB_Test"]', 'admin', NOW()),
  ('loc_arches', 'max_nights_emergency', '90', 'admin', NOW());
```

---

## 4. Comprehensive Dashboard Suite

### 4.1 Executive Dashboard (Executive Director, Board Members)

**Purpose:** Organization-wide strategic overview and high-level metrics.

**Key Metrics:**
- **Client Flow:** Intake vs exits by program (trending 30/60/90 days)
- **Capacity Utilization:** Bed nights available vs used by site
- **Outcome Tracking:** Housing placements, employment gains, retention rates
- **Financial Health:** Budget vs actual by program, YTD spending
- **Staff Metrics:** Turnover rate, training compliance, incident reports
- **Grant Performance:** HUD compliance scores, funder satisfaction

**Visualizations:**
1. **Real-time Census Map:** Geographic view of all sites with current occupancy
2. **Sankey Diagram:** Client flow (Intake → Emergency → Transitional → Permanent → Exit)
3. **Budget Burn-Down Chart:** Program budgets with projections
4. **Donation Pipeline:** Prospect to donation funnel
5. **Compliance Scorecard:** HUD, OSHA, fire safety, health inspection status
6. **AI Insights Panel:** Anomaly detection (unusual patterns in intake, incidents)

**Features:**
- Date range selector (default: current fiscal year)
- Export to PDF/PowerPoint for board presentations
- Automated daily email summary
- Drill-down to site-specific dashboards

### 4.2 Program Director Dashboard

**Purpose:** Multi-site program oversight and performance management.

**Key Metrics:**
- **Program Census:** Current occupancy across all sites in program
- **Waiting List:** Number waiting by site, average wait time
- **Case Manager Caseload:** Cases per manager, high-priority clients
- **Incident Tracking:** Safety incidents by type and site
- **Outreach Activity:** Street contacts, successful intakes

**Visualizations:**
1. **Site Comparison Table:** Side-by-side metrics across sites
2. **Caseload Distribution Chart:** Even distribution monitoring
3. **Waiting List Trend:** Growth/decline over time
4. **Outcome Metrics:** Program-specific goals (90-day retention, etc.)

**Features:**
- Staff scheduling view and shift coverage alerts
- Client transfer workflow (between sites)
- Program-wide inventory management
- Performance review preparation tools

### 4.3 Site Administrator Dashboard

**Purpose:** Day-to-day operations management for a single location.

**Key Metrics:**
- **Bed Occupancy:** Real-time with upcoming check-outs
- **Waitlist Status:** Priority clients, estimated availability
- **Today's Schedule:** Check-ins, check-outs, appointments
- **Inventory Alerts:** Low stock items, reorder recommendations
- **Maintenance Queue:** Open work orders by priority
- **Staff on Duty:** Who's working now, contact info

**Visualizations:**
1. **Bed Map:** Visual room/bed layout with occupancy status
2. **Daily Timeline:** Hour-by-hour activity view
3. **Inventory Stock Levels:** Visual indicators for critical items
4. **Maintenance Triage:** Priority matrix (urgency × impact)

**Features:**
- Quick actions: Bed assignment, maintenance request, incident report
- Client check-in/check-out workflow
- Bed transfer/room change tools
- Daily shift briefing auto-generation
- Integration with facilities systems (HVAC, security cameras)

### 4.4 Case Manager Dashboard

**Purpose:** Client case management and progress tracking.

**Key Metrics:**
- **My Caseload:** Active clients, new intakes this week
- **High Priority:** Clients with barriers, upcoming deadlines
- **Appointment Calendar:** Client meetings, housing appointments
- **Goal Tracking:** SMART goals progress, barrier resolution
- **Documentation Status:** ROI status, required documents

**Visualizations:**
1. **Client Cards:** Photo, key info, recent activity, goals
2. **Barrier Matrix:** Common barriers and resolution strategies
3. **Housing Search Progress:** Applications submitted, interviews, placements
4. **Time Allocation:** Where case manager time is spent

**Features:**
- AI-powered resource matching (housing, employment, services)
- Note-taking with voice-to-text
- Document upload and organization
- Goal setting and tracking
- Automated reminder system (30-day check-ins, follow-ups)
- Mobile app for field work (street outreach, home visits)

### 4.5 HR & Talent Management Dashboard

**Purpose:** Staff management, recruiting, compliance, and development.

**Key Metrics:**
- **Headcount:** Active staff by role, site, FTE
- **Recruiting Pipeline:** Open positions, applicants, time-to-fill
- **Compliance:** Background checks, TB tests, training completions
- **Payroll:** Hours, overtime, shift differentials
- **Performance:** Review completion rate, training hours
- **Retention:** Turnover by role, exit interview themes

**Visualizations:**
1. **Org Chart:** Interactive with drill-down
2. **Compliance Matrix:** Individual vs requirements (color-coded)
3. **Recruiting Funnel:** Applications → Interviews → Offers → Hires
4. **Shift Coverage Calendar:** Gaps, overtime alerts

**Features:**
- Job posting and applicant tracking system (ATS)
- Onboarding workflow (checklist, document collection)
- Training management (assignments, completions, renewals)
- Performance review scheduling and documentation
- Time-off request and approval workflow
- Incident reporting (HR-related)

### 4.6 Finance & Donations Dashboard

**Purpose:** Budget management, donation tracking, grant compliance.

**Key Metrics:**
- **Budget Status:** YTD actual vs budget by program and category
- **Cash Flow:** Incoming donations, grants, expenses
- **Donor Pipeline:** Major donor cultivation, recurring giving trends
- **Grant Status:** Active grants, spending rates, reporting deadlines
- **Expense Categories:** Personnel, operations, supplies, utilities

**Visualizations:**
1. **Budget Variance Report:** Color-coded actual vs budget
2. **Donation Trend:** Monthly giving, YoY comparison
3. **Grant Timeline:** Multi-year view with renewal dates
4. **Expense Breakdown:** Pie chart of spending
5. **Cash Position:** Bank balance with projections

**Features:**
- QuickBooks/Xero integration (accounting sync)
- Donation entry and receipt generation
- Grant calendar with deadline alerts
- Automated HUD financial reports
- Restricted fund tracking
- Budget modification workflow with approval

### 4.7 Facilities & Maintenance Dashboard

**Purpose:** Building operations, maintenance, safety, and compliance.

**Key Metrics:**
- **Work Order Queue:** Open, in-progress, completed (by priority)
- **Preventive Maintenance:** Upcoming scheduled tasks
- **Safety Compliance:** Fire inspections, OSHA logs, incident-free days
- **Vendor Management:** Contracts, performance, contact info
- **Inventory Status:** Critical supplies, reorder alerts
- **Utility Costs:** Trending, anomaly detection

**Visualizations:**
1. **Work Order Board:** Kanban view (Open → Assigned → In Progress → Done)
2. **Maintenance Calendar:** Scheduled preventive tasks
3. **Safety Scorecard:** Inspection dates, deficiencies, corrections
4. **Vendor Performance:** Response time, completion rate, cost

**Features:**
- QR code asset tracking (equipment, furniture, systems)
- Work order mobile app (photo upload, signature capture)
- Preventive maintenance scheduling
- Vendor portal (work order acceptance, invoicing)
- Safety incident reporting and investigation
- Capital project tracking

### 4.8 IT & Systems Dashboard

**Purpose:** Technology management, security, user support, and infrastructure.

**Key Metrics:**
- **System Health:** API response times, error rates, uptime
- **Security:** Failed logins, suspicious activity, MFA adoption
- **User Support:** Open tickets, resolution time, satisfaction
- **Data Usage:** Storage, backup status, retention compliance
- **Software Licenses:** Utilization, renewals, compliance
- **Device Inventory:** Laptops, tablets, mobile hotspots

**Visualizations:**
1. **System Status Page:** Green/yellow/red indicators for all services
2. **Security Events Timeline:** Failed logins, password resets, lockouts
3. **Ticket Queue:** IT support requests with SLA tracking
4. **Data Growth Chart:** Storage trends with projections

**Features:**
- User account management (create, disable, reset, audit)
- Security incident response workflow
- Automated backup verification
- Software deployment and update management
- Help desk ticketing system
- Audit log viewer and export
- Integration health monitoring (Clerk, AI, external APIs)

### 4.9 Grants Management Dashboard

**Purpose:** Grant tracking, compliance, reporting, and opportunity pipeline.

**Key Metrics:**
- **Active Grants:** Award amount, spent to date, burn rate
- **Reporting Calendar:** Upcoming deadlines, submissions status
- **Compliance Status:** Required data elements, quality scores
- **Success Rate:** Applications submitted vs funded
- **Renewal Pipeline:** Grants up for renewal, likelihood assessment

**Visualizations:**
1. **Grant Portfolio:** Table view with status, spending, deadlines
2. **Funding Mix:** Pie chart by funder type (Federal, State, Local, Private)
3. **Application Pipeline:** Stages from prospect to award
4. **Performance Metrics:** HUD compliance scores, outcome achievements

**Features:**
- AI grant writing assistant (drafts based on data)
- Automatic data compilation for reports
- Document library (NOFA, applications, award letters)
- Funder relationship management (contact history, notes)
- Outcome tracking aligned with grant requirements
- Collaboration workspace (commenting, version control)

### 4.10 Marketing & Engagement Dashboard

**Purpose:** Community engagement, volunteer management, event coordination.

**Key Metrics:**
- **Volunteer Hours:** By individual, by event, trends
- **Event Attendance:** RSVPs, actual attendance, satisfaction
- **Community Partners:** Active collaborations, MOUs
- **Media Mentions:** News coverage, social engagement
- **Donor Retention:** Year-over-year giving patterns
- **Email/SMS Campaigns:** Open rates, click rates, conversions

**Visualizations:**
1. **Volunteer Activity Calendar:** Upcoming shifts, coverage gaps
2. **Event Success Metrics:** Attendance, feedback scores
3. **Donor Journey Map:** Acquisition → Cultivation → Giving → Retention
4. **Social Media Dashboard:** Follower growth, engagement rates

**Features:**
- Volunteer recruitment and onboarding
- Event planning and registration
- Email marketing (Mailchimp/SendGrid integration)
- Community partner database
- Photo/media library (with consent tracking)
- Testimonial collection and management

### 4.11 Data Analytics & BI Dashboard

**Purpose:** Advanced analytics, custom reports, data quality, and research.

**Key Metrics:**
- **Data Quality Score:** Completeness, accuracy, timeliness by dataset
- **System Usage:** Logins by role, feature adoption, active users
- **HMIS Compliance:** Data standards adherence, error rates
- **Research Projects:** Active studies, data sharing agreements
- **Report Generation:** Automated vs manual, distribution

**Visualizations:**
1. **Data Quality Heatmap:** Red/yellow/green by field and site
2. **Usage Analytics:** Most/least used features, user journeys
3. **Query Builder:** Drag-and-drop custom report creation
4. **Export History:** What data was exported, by whom, when

**Features:**
- SQL query builder for power users
- Scheduled report generation and delivery
- Data export with audit trail
- Anonymization tools for research
- Integration with external BI tools (Tableau, PowerBI)
- Machine learning model performance (AI feature metrics)

### 4.12 Client Portal Dashboard

**Purpose:** Self-service for clients to manage their information and appointments.

**Key Metrics (for client):**
- **Bed Status:** Current assignment, check-out date
- **Appointments:** Upcoming meetings, housing interviews
- **Documents:** Uploaded documents, pending requirements
- **Goals:** Progress on case plan goals
- **Messages:** Communications from case manager

**Features:**
- Bed request and availability check
- Appointment scheduling (with case manager calendar)
- Document upload (ID, income verification, etc.)
- Secure messaging with case manager
- Resource directory (community services, food banks)
- Feedback submission (satisfaction surveys)
- Mobile-responsive design for clients with smartphones only

---

## 5. Financial Management Module

### 5.1 Budget Management

**Features:**
- **Multi-Year Budgets:** Create and track multi-year budgets by program
- **Line Item Tracking:** Personnel, operating, supplies, capital
- **Variance Analysis:** Real-time actual vs budget with alerts
- **Reallocation Workflow:** Move funds between categories with approval
- **Forecasting:** Project year-end based on spending trends

**Budget Structure:**
```
Program: Emergency Shelter
├── Personnel (60%)
│   ├── Salaries
│   ├── Benefits
│   └── Overtime
├── Operating (25%)
│   ├── Utilities
│   ├── Food
│   └── Supplies
├── Administrative (10%)
│   ├── Insurance
│   ├── Rent
│   └── Communications
└── Reserve (5%)
```

### 5.2 Donation Management

**Donation Types:**
- One-time gifts (online, check, cash)
- Recurring donations (monthly, quarterly)
- Major gifts ($1,000+)
- In-kind donations (food, clothing, supplies)
- Corporate partnerships
- Grant funding (government, foundation)

**Features:**
- Donor database with giving history
- Automated receipt generation (email and PDF)
- Tax letter generation (year-end)
- Donor segmentation (LYBUNT, SYBUNT, major donor)
- Pledge tracking and fulfillment
- Matching gift tracking
- Soft credit (tribute/memorial gifts)
- Integration with Stripe, PayPal, Square

### 5.3 Grant Financial Management

**Features:**
- Grant budget setup with funder restrictions
- Expense allocation by grant
- Indirect cost rate calculations
- Cost allocation plans
- Grant drawdown tracking (federal grants)
- Match/in-kind tracking
- Financial reporting templates (SF-425, etc.)
- Audit preparation tools

---

## 6. Operations & Workflow Automation

### 6.1 Intake Workflow

**Steps:**
1. **Eligibility Screening:** HMIS data entry, VI-SPDAT assessment
2. **Document Collection:** ID, income verification, disability documentation
3. **Needs Assessment:** Medical, mental health, substance use, barriers
4. **Housing Plan:** Goals, timeline, action steps
5. **Bed Assignment:** Based on needs (gender, accessibility, family size)
6. **Orientation:** Rules, services, case manager assignment
7. **ROI Collection:** Release of information for data sharing

**Automation:**
- Duplicate client detection (across HMIS)
- Automatic prioritization (chronic homelessness, vulnerability)
- Bed availability alerts
- Missing document reminders
- 30/60/90-day check-in scheduling

### 6.2 Case Management Workflow

**Touchpoints:**
- Daily (high-need clients)
- Weekly (standard clients)
- Monthly (maintenance phase)
- Crisis (as needed)

**Tools:**
- Barrier assessment and resolution tracking
- Housing search log (applications, interviews, denials)
- Employment tracking (job search, interviews, placement)
- Benefit enrollment (SNAP, Medicaid, SSI/SSDI)
- Healthcare coordination (appointments, medications)
- Legal services tracking (expungement, civil legal aid)

### 6.3 Exit & Follow-Up Workflow

**Exit Types:**
- Positive: Permanent housing, transitional housing, family reunification
- Neutral: Moved to another shelter, unknown destination
- Negative: Involuntary discharge, left against advice

**Automation:**
- Exit interview scheduling
- 30-day follow-up contact
- Housing stability tracking (3, 6, 12 months post-exit)
- Outcome data for reporting
- Bed release and cleaning notification

### 6.4 Coordinated Entry System Integration

**Features:**
- Universal intake form for all homeless services
- Centralized prioritization (by-Name list)
- Referral acceptance/decline tracking
- Housing navigator coordination
- Real-time bed availability across system
- No wrong door approach (any entry point can access services)

---

## 7. Reporting & Analytics Suite

### 7.1 HUD Reporting

**Required Reports:**
- **APR (Annual Performance Report):** Submitted annually to HUD
- **CAPER (CoC Annual Performance and Evaluation Report):** Submitted by CoC lead
- **HDX (HMIS Data Exchange):** Quarterly data quality uploads
- **Point-in-Time Count:** Annual homeless census data

**Data Quality Measures:**
- Completeness (required fields filled)
- Accuracy (valid values, logical consistency)
- Timeliness (entered within timeframe)
- Consistency (matches external sources)

### 7.2 Funder-Specific Reports

**Common Requirements:**
- **Federal (HUD):** APR, CAPER, McKinney-Vento compliance
- **State:** Point-in-Time, utilization rates, outcome metrics
- **Local:** Service delivery, demographic breakdowns
- **Foundation:** Outcome-focused, storytelling narratives
- **United Way:** 211 integration, service volume

**Features:**
- Template library by funder
- Automatic data population
- Narrative generation (AI-assisted)
- Version control and collaboration
- Submission tracking

### 7.3 Custom Reports

**Report Builder Features:**
- Drag-and-drop field selection
- Filter by date range, site, program, demographics
- Grouping and aggregation (pivot tables)
- Chart type selection (bar, line, pie, map)
- Export formats (PDF, Excel, CSV, PowerPoint)
- Scheduled generation and email delivery
- Sharing and permissions

**Pre-Built Report Library:**
- Bed utilization by site (daily, weekly, monthly)
- Client demographic summary
- Entry/exit flow analysis
- Length of stay trends
- Recidivism tracking (returns to homelessness)
- Service utilization patterns
- Outcome achievement rates
- Staff productivity metrics

---

## 8. Mobile & Field Operations

### 8.1 Mobile App for Outreach Workers

**Features:**
- GPS-based location logging
- Offline data entry (syncs when connected)
- Photo capture (with consent checkbox)
- Voice-to-text notes
- Client lookup (by name, DOB, photo)
- Bed availability check
- Direct intake to shelter (bypass waitlist in emergencies)
- Pantry/distribution tracking
- Danger alerts (safety warnings for team)

### 8.2 Mobile App for Case Managers

**Features:**
- Client list with quick access
- Appointment scheduling and reminders
- Note-taking with templates
- Document photo upload
- Goal tracking updates
- Resource directory (offline capable)
- Bed transfer requests
- Communication with other staff

### 8.3 Mobile App for Facilities Staff

**Features:**
- Work order creation and updates
- Asset scanning (QR/barcode)
- Preventive maintenance checklist
- Safety inspection forms
- Inventory check-out/in
- Photo documentation of repairs
- Vendor communication

---

## 9. Integration Ecosystem

### 9.1 Core Integrations

**Authentication & Identity:**
- Clerk (current) - Authentication and user management
- OAuth2/OIDC - Single Sign-On (SSO)

**Communication:**
- Twilio - SMS notifications, 2FA
- SendGrid/Mailchimp - Email campaigns, transactional emails
- Slack/Teams - Internal notifications and alerts

**Financial:**
- Stripe/PayPal - Donation processing
- QuickBooks/Xero - Accounting sync
- Plaid - Bank account verification (for client benefits)

**Storage & Files:**
- AWS S3/Azure Blob - Document storage with encryption
- Cloudflare R2 - Cost-effective backup storage

**AI & Analytics:**
- Google Gemini (current) - AI features
- OpenAI - Alternative LLM option
- Mixpanel/Amplitude - Product analytics
- Sentry - Error tracking and performance

### 9.2 HMIS & External Systems

**HMIS Data Exchange:**
- HUD HDX - Data upload for CoC reporting
- Local HMIS - Bidirectional sync for Coordinated Entry
- By-Name List - Prioritization data exchange

**Service Providers:**
- 211/Crisis Lines - Referral integration
- Health Clinics - Appointment and health record access (with ROI)
- Employment Agencies - Job placement tracking
- Housing Authorities - Voucher status, application tracking
- Legal Aid - Case status updates
- Benefits Enrollment - SNAP, Medicaid, SSI application status

**Government Systems:**
- SSA - SSI/SSDI verification (limited access)
- State Medicaid - Eligibility verification
- VA - Veteran service connection (for VA-funded programs)
- Child Welfare - Coordination (with strict privacy controls)

### 9.3 API Architecture

**API Design Principles:**
- RESTful with OpenAPI/Swagger documentation
- Rate limiting (100 req/min per user, 1000 req/min per org)
- Versioning (v1, v2 in URL path)
- Webhooks for real-time events
- GraphQL option for complex queries

**API Gateway:**
- Kong or AWS API Gateway
- Request/response logging
- Authentication verification
- Rate limiting enforcement
- API key management for third-party integrators

---

## 10. Data Architecture & Scalability

### 10.1 Database Architecture

**Current:** SQLite (single file, single server)
**Production:** PostgreSQL (managed service)

**Migration Path:**
1. **Phase 1:** PostgreSQL on same server
2. **Phase 2:** Managed PostgreSQL (AWS RDS, Azure Database)
3. **Phase 3:** Read replicas for reporting
4. **Phase 4:** Connection pooling (PgBouncer)

**Database Partitioning:**
- Time-based partitioning for Audit_Logs (monthly)
- Tenant-based partitioning (if multi-tenant SaaS)
- Archive old data to S3 (7+ years)

**Performance Optimization:**
- Index on: user_id, location_id, created_at, status
- Materialized views for common reports
- Query result caching (Redis)
- Connection pooling

### 10.2 Data Retention & Archival

**Retention Policies:**
- **Active Data:** 7 years (HUD requirement)
- **Audit Logs:** 6 years (HIPAA requirement)
- **Deleted Records:** Soft delete + 1 year retention
- **Backups:** 30 days rolling + annual archives

**Archival Process:**
1. Identify records older than retention period
2. Export to encrypted archive (S3 Glacier)
3. Anonymize data for research use (if consented)
4. Hard delete from active database
5. Log archival action

### 10.3 Disaster Recovery

**RTO (Recovery Time Objective):** 4 hours
**RPO (Recovery Point Objective):** 15 minutes

**Backup Strategy:**
- Continuous replication to standby database
- Hourly incremental backups
- Daily full backups (retained 30 days)
- Weekly backups (retained 1 year)
- Monthly backups (retained 7 years)
- Geographic redundancy (multi-region)

**Disaster Scenarios:**
- Database corruption → Failover to replica
- Server failure → Auto-scaling replacement
- Data center outage → Multi-region failover
- Ransomware → Immutable backups restore

---

## 11. Security Architecture

### 11.1 Defense in Depth

```
┌─────────────────────────────────────────────────────────────┐
│                    PERIMETER SECURITY                        │
│  • DDoS protection (Cloudflare/AWS Shield)                  │
│  • WAF (Web Application Firewall)                           │
│  • IP reputation filtering                                  │
│  • Bot detection                                            │
├─────────────────────────────────────────────────────────────┤
│                    NETWORK SECURITY                        │
│  • TLS 1.3 for all connections                              │
│  • VPN required for admin access                            │
│  • VPC/network segmentation                                 │
│  • Intrusion detection/prevention                           │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION SECURITY                    │
│  • Authentication (Clerk + MFA)                             │
│  • Authorization (RBAC with fine-grained permissions)       │
│  • Input validation and sanitization                        │
│  • Output encoding (XSS prevention)                       │
│  • CSRF protection                                          │
│  • Rate limiting                                            │
├─────────────────────────────────────────────────────────────┤
│                    DATA SECURITY                           │
│  • Field-level encryption (AES-256)                         │
│  • Database access controls                                 │
│  • Backup encryption                                        │
│  • Data masking for non-prod environments                   │
├─────────────────────────────────────────────────────────────┤
│                    MONITORING & RESPONSE                   │
│  • Real-time log analysis (SIEM)                          │
│  • Anomaly detection                                        │
│  • Automated alerting                                       │
│  • Incident response playbook                             │
│  • Security audit logs (6-year retention)                 │
└─────────────────────────────────────────────────────────────┘
```

### 11.2 Security Controls

**Authentication:**
- Multi-factor authentication (TOTP, SMS backup)
- Password policy (12+ chars, complexity, 90-day rotation)
- Account lockout (5 failed attempts, 30-min lockout)
- Session timeout (15 min idle, 8 hours max)
- Concurrent session limits

**Authorization:**
- Role-based access control (RBAC)
- Attribute-based access control (ABAC) for edge cases
- Principle of least privilege
- Regular access reviews (quarterly)

**Data Protection:**
- Encryption at rest (AES-256)
- Encryption in transit (TLS 1.3)
- Tokenization for SSNs
- Data masking (last 4 digits only for non-admins)
- Secure key management (AWS KMS/Azure Key Vault)

**Monitoring:**
- Login attempt logging (success and failure)
- Data access logging (who, what, when, where)
- Administrative action logging
- Failed authorization logging
- Real-time alerting for suspicious activity

### 11.3 Compliance Validation

**Penetration Testing:**
- Annual third-party penetration test
- Quarterly vulnerability scans
- Continuous dependency scanning (Snyk)

**Security Audits:**
- Annual SOC 2 Type II audit
- HIPAA security risk assessment (annual)
- Code security review (semi-annual)
- Infrastructure audit (annual)

**Incident Response:**
- Incident response plan documented
- 24/7 on-call security team
- Breach notification procedures
- Forensic capabilities

---

## 12. Implementation Roadmap

### Phase 1: Foundation (Months 1-3)
**Goal:** HIPAA/SOC2 compliant, enterprise RBAC, core modules stable

**Key Deliverables:**
1. **Security & Compliance:**
   - Implement field-level encryption
   - Add MFA for admin roles
   - Complete audit logging
   - Security policy documentation
   - SOC 2 readiness assessment

2. **RBAC Enhancement:**
   - Expand to 12+ roles
   - Implement fine-grained permissions
   - Add API authorization middleware
   - Segregation of duties framework

3. **Database Migration:**
   - Migrate SQLite → PostgreSQL
   - Implement connection pooling
   - Set up read replicas
   - Configure automated backups

4. **Core Features:**
   - Enhanced Case Manager dashboard
   - Full Facilities management module
   - HR/Talent management module
   - Basic Finance module

**Success Criteria:**
- All API routes protected by role-based authorization
- Zero high/critical security vulnerabilities
- SOC 2 Type I ready
- 99.5% uptime achieved

### Phase 2: Expansion (Months 4-6)
**Goal:** Multi-location, advanced workflows, comprehensive reporting

**Key Deliverables:**
1. **Multi-Location Architecture:**
   - Site hierarchy implementation
   - Cross-location data sharing
   - Site-specific configuration
   - Location-based permissions

2. **Advanced Workflows:**
   - Automated intake workflows
   - Case management automation
   - Exit and follow-up automation
   - Coordinated Entry integration

3. **Reporting Suite:**
   - HUD APR/CAPER generation
   - Custom report builder
   - Automated report scheduling
   - Data quality dashboards

4. **Mobile Apps:**
   - Outreach worker mobile app
   - Case manager mobile app
   - Facilities mobile app

**Success Criteria:**
- Support for 10+ locations
- 50+ concurrent users
- Automated HUD reporting
- 99.9% uptime

### Phase 3: Enterprise Features (Months 7-9)
**Goal:** Full nonprofit operations suite, AI enhancement, integrations

**Key Deliverables:**
1. **Financial Management:**
   - Full budget management
   - Donation management
   - Grant financial tracking
   - Accounting integration

2. **Advanced Modules:**
   - Grants management with AI writing
   - Marketing/engagement platform
   - IT service management
   - Data analytics/BI tools

3. **Integration Ecosystem:**
   - HMIS data exchange
   - Government system integrations
   - Service provider network
   - Accounting/CRM sync

4. **AI Enhancement:**
   - Predictive analytics (risk, outcomes)
   - Automated case note summarization
   - Resource matching optimization
   - Anomaly detection

**Success Criteria:**
- SOC 2 Type II certified
- Full HIPAA compliance
- 100+ concurrent users
- 99.95% uptime
- Complete nonprofit operations coverage

---

## 13. Cost Estimates & Budget

### 13.1 Infrastructure Costs (Monthly)

| Component | Provider | Monthly Cost |
|-------------|----------|--------------|
| Application Servers (2x) | AWS/Azure | $200-400 |
| PostgreSQL (managed) | AWS RDS | $150-300 |
| Redis (caching) | Redis Cloud | $50-100 |
| File Storage (S3) | AWS S3 | $50-200 |
| CDN | Cloudflare | $20-50 |
| Monitoring | DataDog/New Relic | $100-200 |
| Security (WAF, SIEM) | Various | $150-300 |
| **Total Infrastructure** | | **$720-1,550/month** |

### 13.2 Software & Services (Monthly/Annual)

| Service | Cost | Frequency |
|---------|------|-----------|
| Clerk (auth) | $25-100 | Monthly |
| Twilio (SMS) | $50-200 | Monthly (usage-based) |
| SendGrid (email) | $50-100 | Monthly |
| Sentry (error tracking) | $26 | Monthly |
| Google AI (Gemini) | $50-500 | Monthly (usage-based) |
| SOC 2 Audit | $15,000-25,000 | Annual |
| Security Tools (Snyk) | $100 | Monthly |
| **Total Software** | **$300-1,100/mo + audit** | |

### 13.3 Development Costs

| Phase | Duration | Estimated Cost |
|-------|----------|----------------|
| Phase 1: Foundation | 3 months | $60,000-90,000 |
| Phase 2: Expansion | 3 months | $60,000-90,000 |
| Phase 3: Enterprise | 3 months | $60,000-90,000 |
| **Total Development** | 9 months | **$180,000-270,000** |

**Team Composition:**
- 2 Full-stack developers
- 1 DevOps/Security engineer
- 1 UI/UX designer
- 1 Project manager/BA

### 13.4 Ongoing Costs (Post-Launch)

| Category | Annual Cost |
|----------|-------------|
| Infrastructure | $10,000-20,000 |
| Software/Services | $5,000-15,000 |
| Security Audits | $15,000-25,000 |
| Maintenance (20% of dev cost) | $36,000-54,000 |
| Support/Training | $10,000-20,000 |
| **Total Annual** | **$76,000-134,000** |

---

## 14. Success Metrics & KPIs

### 14.1 System Performance

| Metric | Target | Measurement |
|--------|--------|-------------|
| Uptime | 99.95% | Monitoring dashboard |
| API Response Time | < 200ms (p95) | APM tools |
| Page Load Time | < 2 seconds | Real user monitoring |
| Concurrent Users | 100+ | Load testing |
| Data Import Speed | < 5 min for 1000 records | Performance tests |

### 14.2 User Adoption

| Metric | Target | Measurement |
|--------|--------|-------------|
| Daily Active Users | 80% of licensed users | Analytics |
| Feature Adoption | 70% using core features | Analytics |
| Mobile App Downloads | 100% of field staff | App store metrics |
| Training Completion | 100% within 30 days | LMS tracking |
| Support Tickets | < 5 per week per 100 users | Help desk |

### 14.3 Compliance & Security

| Metric | Target | Measurement |
|--------|--------|-------------|
| Security Incidents | 0 critical | Security dashboard |
| Vulnerabilities | 0 high/critical | Scan reports |
| Audit Findings | 0 material weaknesses | Audit reports |
| MFA Adoption | 100% of admins | Auth logs |
| Data Quality Score | > 95% | HMIS reports |

### 14.4 Business Outcomes

| Metric | Target | Measurement |
|--------|--------|-------------|
| Staff Time Saved | 20% reduction in admin time | Time study |
| Data Entry Errors | 50% reduction | Quality reports |
| Report Generation Time | 80% reduction (manual → auto) | User surveys |
| Client Outcomes | Improved retention/housing | Outcome tracking |
| Grant Compliance | 100% on-time submission | Grant calendar |

---

## 15. Risk Assessment & Mitigation

### 15.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Data migration issues | Medium | High | Parallel run, rollback plan, data validation |
| Performance degradation | Low | High | Load testing, optimization, scaling |
| Integration failures | Medium | Medium | Sandbox testing, fallback mechanisms |
| Security breach | Low | Critical | Security controls, monitoring, insurance |
| Vendor lock-in | Low | Medium | Open standards, data portability, multi-cloud |

### 15.2 Organizational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| User resistance to change | High | Medium | Change management, training, champions |
| Staff turnover during project | Medium | Medium | Documentation, pair programming, succession planning |
| Budget overruns | Medium | High | Phased approach, contingency budget (20%) |
| Timeline delays | High | Medium | Buffer time, prioritize MVP features |
| Compliance audit failure | Low | High | Pre-audit assessment, remediation plan |

### 15.3 External Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Regulatory changes | Medium | Medium | Compliance monitoring, flexible architecture |
| Economic downturn | Medium | High | Phased investment, ROI demonstration |
| Cyber attack | Medium | Critical | Insurance, incident response, backups |
| Vendor discontinuation | Low | Medium | Alternative vendors, data export capability |

---

## 17. SaaS Multi-Tenant Architecture

### 17.1 Multi-Tenancy Model

**Architecture Decision: Hybrid Tenant Model**

```
┌─────────────────────────────────────────────────────────────┐
│                     ACTIONOS SaaS PLATFORM                  │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │  Nonprofit  │  │  Nonprofit  │  │  Nonprofit  │         │
│  │    A        │  │    B        │  │    C        │         │
│  │ (MWVCAA)    │  │   (XYZ)     │  │   (ABC)     │         │
│  │             │  │             │  │             │         │
│  │ • Custom    │  │ • Custom    │  │ • Custom    │         │
│  │   roles     │  │   roles     │  │   roles     │         │
│  │ • Custom    │  │ • Custom    │  │ • Custom    │         │
│  │   workflow  │  │   workflow  │  │   workflow  │         │
│  │ • Org data  │  │ • Org data  │  │ • Org data  │         │
│  │ • Isolated  │  │ • Isolated  │  │ • Isolated  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                  │
│         └────────────────┴────────────────┘                  │
│                      │                                       │
│              ┌───────▼────────┐                             │
│              │  SHARED CORE    │                             │
│              │                 │                             │
│              │ • AI services   │                             │
│              │ • Auth (Clerk)  │                             │
│              │ • Infrastructure│                             │
│              │ • Base features │                             │
│              └─────────────────┘                             │
└─────────────────────────────────────────────────────────────┘
```

**Data Isolation Strategy: Row-Level Security (RLS)**

```sql
-- PostgreSQL Row-Level Security for multi-tenancy
ALTER TABLE Clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON Clients
  USING (organization_id = current_setting('app.current_tenant')::TEXT);

-- All queries automatically filtered by tenant
SET app.current_tenant = 'org_mwvcaa';
SELECT * FROM Clients; -- Only returns MWVCAA clients
```

**Organization Schema:**

```sql
CREATE TABLE Organizations (
  id TEXT PRIMARY KEY,           -- org_mwvcaa, org_habitat, etc.
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,     -- URL-safe identifier
  status TEXT DEFAULT 'active',  -- active, suspended, trial
  plan TEXT DEFAULT 'basic',     -- basic, standard, enterprise
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  settings JSON,                 -- Org-specific configuration
  billing_info JSON,
  subscription_expires_at DATETIME
);

-- All tables get organization_id column
ALTER TABLE Users ADD COLUMN organization_id TEXT REFERENCES Organizations(id);
ALTER TABLE Clients ADD COLUMN organization_id TEXT REFERENCES Organizations(id);
ALTER TABLE Locations ADD COLUMN organization_id TEXT REFERENCES Organizations(id);
ALTER TABLE Inventory ADD COLUMN organization_id TEXT REFERENCES Organizations(id);
-- ... all other tables
```

### 17.2 Organization Configuration

**Per-Organization Customization:**

| Configuration | Scope | Example |
|---------------|-------|---------|
| **Custom Roles** | Full CRUD | MWVCAA creates "Float Assistant", "Site Coordinator" |
| **Workflows** | Configurable | Check-in times, required docs, approval chains |
| **Fields** | Custom client fields | Org-specific intake questions |
| **Branding** | Logo, colors, domain | White-label client portal |
| **Integrations** | Selective | Enable/disable specific integrations |
| **Compliance** | Region-specific | State-specific forms, reporting |

**Custom Field System:**

```sql
CREATE TABLE Organization_Fields (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES Organizations(id),
  entity_type TEXT,           -- 'client', 'case_note', 'donation'
  field_name TEXT,
  field_type TEXT,            -- 'text', 'number', 'date', 'select', 'boolean'
  field_options JSON,         -- For select: ['Option A', 'Option B']
  is_required BOOLEAN DEFAULT FALSE,
  display_order INTEGER,
  section TEXT                -- Group fields: 'intake', 'medical', 'employment'
);

-- Usage: Dynamic form generation based on org config
```

### 17.3 Custom Role & Position Builder

**Super Admin Capability: Create Any Role**

```
┌─────────────────────────────────────────────────────────────┐
│              ROLE BUILDER INTERFACE (Super Admin)          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: Role Definition                                      │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Role Name: [Site Assistant                          ]  ││
│  │ Description: Front-line operations staff handling     ]  ││
│  │              cleaning, feeding, laundry, basic client ]  ││
│  │              support, case notes, bed management    ]  ││
│  │ Role Type: [☐ Generic  ☑ Location-specific         ]  ││
│  │ Can Float: [☑ Yes (multiple locations)                ]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Step 2: Location Assignment                                │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [☑ ARCHES Lodge] [☐ The Nest] [☐ Oak Street Apts]    ││
│  │ [☑ Mobile/Outreach] [☑ All Facilities (Float)      ]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Step 3: Permission Matrix                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ Resource        │ View  │ Create │ Update │ Delete  │  ││
│  │ ────────────────┼───────┼────────┼────────┼─────────│  ││
│  │ Clients         │  ☑ Own│   ☑    │   ☑    │    ☐    │  ││
│  │ Case Notes      │  ☑ Own│   ☑    │   ☑    │    ☑    │  ││
│  │ Bed Assign      │  ☑    │   ☑    │   ☐    │    ☐    │  ││
│  │ Inventory       │  ☑    │   ☑    │   ☑    │    ☐    │  ││
│  │ Maintenance     │  ☑    │   ☑    │   ☑    │    ☐    │  ││
│  │ Reports         │  ☑    │   ☐    │   ☐    │    ☐    │  ││
│  │ Budget          │  ☐    │   ☐    │   ☐    │    ☐    │  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  Step 4: Special Capabilities                               │
│  ┌─────────────────────────────────────────────────────────┐│
│  │ [☑ Can override bed assignment in emergency          ]  ││
│  │ [☑ Can access client medical records (limited)       ]  ││
│  │ [☑ Can submit maintenance requests (no approval)     ]  ││
│  │ [☐ Can approve other staff time-off requests         ]  ││
│  │ [☑ Mobile app access                                  ]  ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  [Save Role Template] [Preview Dashboard] [Deploy to Staff] │
└─────────────────────────────────────────────────────────────┘
```

**Role Template System:**

```sql
CREATE TABLE Role_Templates (
  id TEXT PRIMARY KEY,
  organization_id TEXT REFERENCES Organizations(id),
  template_name TEXT,
  description TEXT,
  base_role TEXT,              -- Inherit from base system role
  permissions JSON,            -- Full permission matrix
  capabilities JSON,           -- Special flags
  is_system_template BOOLEAN DEFAULT FALSE, -- MWVCAA created
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Example templates for MWVCAA
INSERT INTO Role_Templates VALUES
  ('tmpl_site_assistant', 'org_mwvcaa', 'Site Assistant', 
   'Front-line operations', 'operations',
   '{"clients": {"view": "own", "create": true, "update": "own"},
     "inventory": {"view": true, "use": true},
     "maintenance": {"view": true, "create": true}}',
   '{"can_float": false, "mobile_access": true}', TRUE),
   
  ('tmpl_float_lead', 'org_mwvcaa', 'Lead Float Assistant',
   'Senior float staff', 'operations',
   '{"clients": {"view": "team", "create": true, "update": "team"},
     "beds": {"view": true, "assign": true, "override": true},
     "inventory": {"view": true, "manage": true}}',
   '{"can_float": true, "all_locations": true, "supervised_by": "site_admin"}', TRUE);
```

**MWVCAA-Specific Role Examples:**

| Role | Description | Scope | Key Capabilities |
|------|-------------|-------|------------------|
| **Site Assistant** | Front-line operations: cleaning, feeding, laundry, basic client support, case notes | Single location (can float if needed) | Case notes, bed check-in/out, maintenance requests, inventory use, client interaction |
| **Lead Float Site Assistant** | Senior float staff, fills gaps across all facilities, supervises site assistants | All locations | Bed override, inventory management, supervise site assistants, advanced client support |
| **Site Coordinator** | Location manager: inventory ordering, budgeting, scheduling | Single location (coordination) | Full inventory control, budget tracking, staff scheduling, vendor management |
| **Outreach Coordinator** | Mobile services: street outreach, mobile showers, clinics | Mobile + all sites | Client intake, mobile unit tracking, resource distribution, GPS location sharing |

### 17.4 Tenant Onboarding Flow

```
┌─────────────────────────────────────────────────────────────┐
│              NEW NONPROFIT ONBOARDING WORKFLOW               │
└─────────────────────────────────────────────────────────────┘

1. SIGNUP (5 minutes)
   └─> Organization name, EIN, contact info
   └─> Select base template (Homeless Services, Food Bank, Youth Program, etc.)
   └─> Create super admin account

2. ORG CONFIGURATION (15 minutes)
   └─> Set locations (sites, mobile units, admin offices)
   └─> Configure programs (Emergency Shelter, PSH, Outreach)
   └─> Set fiscal year, timezone, currency
   └─> Upload logo, set brand colors

3. ROLE SETUP (30 minutes)
   └─> Review system role templates
   └─> Customize or create new roles
   └─> Set role hierarchy and approval chains
   └─> Configure permissions per role

4. DATA MIGRATION (varies)
   └─> Import existing client roster (CSV/Excel)
   └─> Import staff directory
   └─> Import historical data (optional)
   └─> Map custom fields from old system

5. INTEGRATION SETUP (20 minutes)
   └─> Connect Clerk for authentication
   └─> Configure email (SendGrid/Mailgun)
   └─> Set up file storage (S3)
   └─> Connect accounting system (optional)

6. STAFF INVITATION (ongoing)
   └─> Bulk invite staff via email
   └─> Staff accept, complete profile
   └─> Auto-assign roles based on email domain rules

7. GO LIVE
   └─> Soft launch (pilot with 5 users)
   └─> Full deployment
   └─> Training sessions scheduled
```

---

## 18. Enhanced Client Portal & Mobile Client Experience

### 18.1 Client Portal Features

**Dashboard Sections:**

```
┌─────────────────────────────────────────────────────────────┐
│                   CLIENT PORTAL DASHBOARD                    │
├─────────────────────────────────────────────────────────────┤
│  [My Goals] [Messages] [Resources] [Schedule] [Documents]  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MY GOALS & PROGRESS                                 │   │
│  │                                                      │   │
│  │  ▓▓▓▓▓▓▓░░░ Housing (70%) - Working on applications│   │
│  │  ▓▓▓▓░░░░░░░ Employment (40%) - Resume submitted   │   │
│  │  ▓▓▓▓▓▓▓▓▓▓░ Benefits (90%) - Medicaid approved!   │   │
│  │                                                      │   │
│  │  [+ Add New Goal] [View All Goals]                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────┐  ┌─────────────────────────────┐  │
│  │  MESSAGES           │  │  UPCOMING SCHEDULE          │  │
│  │                      │  │                              │  │
│  │  💬 Case Manager      │  │  📅 Tomorrow 2:00 PM        │  │
│  │     "See you at our │  │     Case Manager Meeting     │  │
│  │      meeting..."    │  │     [Reschedule] [Confirm]  │  │
│  │     [Reply] [Mark   │  │                              │  │
│  │      Read]          │  │  📅 Friday 10:00 AM          │  │
│  │                      │  │     Housing Interview         │  │
│  │  💬 Outreach Team     │  │     [Get Directions]         │  │
│  │     "Mobile shower  │  │                              │  │
│  │      van will be..."│  │  [View Full Calendar]        │  │
│  │     [View Map]      │  │                              │  │
│  └─────────────────────┘  └─────────────────────────────┘  │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MOBILE SERVICES & RESOURCES (LIVE GPS TRACKING)   │   │
│  │                                                      │   │
│  │  🚐 Mobile Shower Van                                │   │
│  │     📍 Currently: Near City Hall (updated 3 min ago)│   │
│  │     🕐 Hours: 2:00 PM - 6:00 PM                      │   │
│  │     👤 Staff: Maria G., John T. (GPS location on)   │   │
│  │     [Get Directions] [See Live Map] [ETA to Me]    │   │
│  │                                                      │   │
│  │  🏥 Mobile Clinic                                    │   │
│  │     📍 Currently: Library Parking Lot               │   │
│  │     🕐 Hours: 2:00 PM - 5:00 PM                      │   │
│  │     👤 Staff: Dr. Chen, Nurse Rodriguez            │   │
│  │     [View Services] [Join Waitlist] [Live Chat]    │   │
│  │                                                      │   │
│  │  🍞 Food Distribution                                │   │
│  │     📍 St. Mary's Church                            │   │
│  │     🕐 Today 6:00 PM - 8:00 PM                      │   │
│  │     [See All Resources] [Save to Calendar]          │   │
│  │                                                      │   │
│  │  📱 Staff Location Sharing:                          │   │
│  │     Outreach workers can share location (opt-in)   │   │
│  │     for client safety and resource coordination    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  BED STATUS & CHECK-IN                               │   │
│  │                                                      │   │
│  │  🛏️ Currently Assigned: ARCHES Lodge • Room 105    │   │
│  │  📅 Check-out: January 15, 2026                    │   │
│  │  ⏰ Curfew: 10:00 PM                                │   │
│  │                                                      │   │
│  │  [Request Bed Extension] [Request Different Site]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ASK QUESTIONS / GET HELP                           │   │
│  │                                                      │   │
│  │  [Type your question or concern...        ] [Send]  │   │
│  │                                                      │   │
│  │  Quick Questions:                                   │   │
│  │  [?] How do I apply for housing?                   │   │
│  │  [?] What documents do I need?                      │   │
│  │  [?] Can I get a bus pass?                          │   │
│  │  [?] I need to talk to someone urgently               │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

**Client Portal Features:**

| Feature | Description | Access |
|---------|-------------|--------|
| **Goal Setting** | Clients create SMART goals, track progress, celebrate milestones | All enrolled clients |
| **Case Manager Chat** | Secure messaging with case manager, file attachments | Assigned clients |
| **Resource Directory** | Filterable list: housing, food, healthcare, employment, legal | Public access |
| **Mobile Services Map** | Real-time location of mobile showers, clinics, food trucks | Public + push notifications |
| **Appointment Scheduling** | View availability, request appointments, reschedule | Enrolled clients |
| **Document Upload** | ID, income verification, medical records, housing apps | Enrolled clients |
| **Bed Management** | Check bed status, request extensions, request transfers | Shelter residents |
| **Feedback System** | Satisfaction surveys, grievances, compliments | All clients |
| **Peer Support** | Optional: Connect with peer mentors (consent-based) | Opt-in clients |

### 18.2 Street-Reach Client Experience

**For Clients Not Yet Enrolled:**

```
┌─────────────────────────────────────────────────────────────┐
│           PUBLIC CLIENT ACCESS (No Account Required)       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  I NEED HELP NOW                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [📍 Find Services Near Me]                          │    │
│  │  [📋 Check Eligibility]                              │    │
│  │  [📞 Emergency Hotlines]                             │    │
│  │  [🚑 I'm in Crisis - Connect Now]                   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  MOBILE SERVICES TODAY (LIVE GPS TRACKING)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🚐 Mobile Shower Van                                │    │
│  │     📍 Live Location: Moving toward Downtown area   │    │
│  │     🕐 Serving: Now - 6:00 PM                      │    │
│  │     📊 Queue: 3 people waiting | Staff: 2 on duty    │    │
│  │     [Track Live] [Get ETA] [Join Virtual Queue]    │    │
│  │                                                      │    │
│  │  🏥 Mobile Clinic                                    │    │
│  │     📍 Live Location: Library Parking Lot          │    │
│  │     🕐 Hours: 2:00 PM - 5:00 PM                      │    │
│  │     📋 Services: Medical, wound care, mental health │    │
│  │     [View Services] [Check Wait Time] [Save]       │    │
│  │                                                      │    │
│  │  📱 How to find us:                                  │    │
│  │     Text "LOCATE SHOWER" to (555) 123-4567         │    │
│  │     Get SMS with current location and walking dirs   │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  SIGN UP FOR SERVICES (Quick 5-min intake)                    │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [Start Intake] - No ID required initially           │    │
│  │  What to expect:                                    │    │
│  │  • Basic info (name, age, contact preference)        │    │
│  │  • Current situation (sleeping outside, in car, etc)│    │
│  │  • Immediate needs (shelter, food, medical)           │    │
│  │  • Connect to outreach team for follow-up            │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  TEXT/SMS SERVICE (No smartphone needed)                      │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Text "HELP" to (555) 123-4567                       │    │
│  │  Get automated replies for:                          │    │
│  │  • Bed availability                                  │    │
│  │  • Mobile service locations (with live GPS tracking) │    │
│  │  • Weather alerts                                    │    │
│  │  • Appointment reminders                            │    │
│  │                                                      │    │
│  │  📍 MOBILE TEAM GPS TRACKING:                        │    │
│  │  • Outreach team locations updated every 5 minutes   │    │
│  │  • Mobile shower van current position & ETA          │    │
│  │  • Mobile clinic location and service hours          │    │
│  │  • Staff can opt-in to location sharing (privacy)  │    │
│  │                                                      │    │
│  │  Example: "Text LOCATE SHOWER for nearest mobile    │    │
│  │  shower location and estimated arrival time"        │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**Progressive Enrollment:**

```
Anonymous Inquiry ──> Basic Info (SMS/Web) ──> Outreach Contact ──> 
                                                      │
                                                      ▼
                              ┌───────────────────────┴───────────────────────┐
                              │                                               │
                              ▼                                               ▼
                    Immediate Services Provided                    Full Intake Scheduled
                    (shower, food, harm reduction)                        │
                                                                            ▼
                                                                  Complete HMIS Intake
                                                                  ID Documents Collected
                                                                            │
                                                                            ▼
                                                                  Enrolled in Program
                                                                  Case Manager Assigned
                                                                            │
                                                                            ▼
                                                                  Full Client Portal Access
```

---

## 19. Agentic AI Inventory Management

### 19.1 AI-Powered Inventory Capture

**Vision-Based Inventory Intake:**

```
┌─────────────────────────────────────────────────────────────┐
│           AI INVENTORY CAPTURE WORKFLOW                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step 1: CAPTURE                                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  [📸 Take Photo of Item Pile/Shelf]                │    │
│  │                                                      │    │
│  │  ┌─────────────────────────────────────────────┐    │    │
│  │  │  📷 Photo Preview                            │    │    │
│  │  │                                              │    │    │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │    │    │
│  │  │  │🧴   │ │🧴   │ │🧴   │ │🧴   │  <- 12x │    │    │
│  │  │  │Soap │ │Soap │ │Soap │ │Soap │     Body │    │    │
│  │  │  │Wash │ │Wash │ │Wash │ │Wash │     Wash │    │    │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘          │    │    │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │    │    │
│  │  │  │🧻   │ │🧻   │ │🧻   │ │🧻   │  <- 24x │    │    │
│  │  │  │ TP  │ │ TP  │ │ TP  │ │ TP  │     TP   │    │    │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘          │    │    │
│  │  │  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐          │    │    │
│  │  │  │🧼   │ │🧼   │ │🧼   │ │     │  <- 8x  │    │    │
│  │  │  │ Bar │ │ Bar │ │ Bar │ │     │     Soap │    │    │
│  │  │  └─────┘ └─────┘ └─────┘ └─────┘          │    │    │
│  │  │                                              │    │    │
│  │  │  [🔄 Retake]  [✓ Looks Good - Process]      │    │    │
│  │  └─────────────────────────────────────────────┘    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Step 2: AI PROCESSING                                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  🤖 Gemini Vision Analyzing...                        │    │
│  │                                                      │    │
│  │  ✓ Identified: Body Wash (12 units)                 │    │
│  │  ✓ Identified: Toilet Paper (24 rolls)            │    │
│  │  ✓ Identified: Bar Soap (8 bars)                  │    │
│  │  ✓ Brand detected: Dial, Charmin, Ivory           │    │
│  │  ⚠ New item: "Unknown red bottle" (needs review)  │    │
│  │                                                      │    │
│  │  [View AI Confidence Scores]                        │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Step 3: HUMAN REVIEW & APPROVAL                           │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Review AI Detection Results:                        │    │    │
│  │                                                      │    │    │
│  │  Body Wash (12)  [✓ Correct] [✏️ Edit] [🗑️ Remove]│    │    │
│  │    └─> Category: Personal Hygiene > Body Wash      │    │    │
│  │    └─> Location: Storage Room A - Shelf 3           │    │    │
│  │    └─> Min Threshold: 10 units                      │    │    │
│  │                                                      │    │    │
│  │  Toilet Paper (24) [✓ Correct] [✏️ Edit]           │    │    │
│  │    └─> Category: Personal Hygiene > Toiletries      │    │    │
│  │                                                      │    │    │
│  │  Bar Soap (8) [✏️ Change to: 10?] [✓ Correct]      │    │    │
│  │    AI noted 8, but I see 2 more behind...          │    │    │
│  │                                                      │    │    │
│  │  Unknown red bottle [Identify] [🗑️ Skip]          │    │    │
│  │    └─> [Dropdown: Shampoo / Conditioner / Lotion]   │    │    │
│  │                                                      │    │    │
│  │  [✅ Approve All] [💾 Save as Draft]               │    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  Step 4: CONFIRMED INVENTORY UPDATE                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  ✅ Inventory Updated Successfully!                 │    │    │
│  │                                                      │    │    │
│  │  Total Items Added: 46 units across 4 categories   │    │    │
│  │  Photos archived for audit trail                    │    │    │
│  │  QR codes auto-generated for Body Wash shelf       │    │    │
│  │                                                      │    │    │
│  │  [📸 Add More Items] [📊 View Inventory] [🏠 Home] │    │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### 19.2 Automatic Usage Tracking

**Smart Checkout System:**

```
┌─────────────────────────────────────────────────────────────┐
│           INVENTORY CHECKOUT (Employee Use)                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [📷 Scan QR] or [🔍 Search] or [📸 Photo]                 │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📸 AI Checkout - Take Photo of Items Being Used    │   │
│  │                                                      │   │
│  │  Photo taken: 3 items identified                     │   │
│  │                                                      │   │
│  │  • Cleaning Supplies (Spray bottles × 2)          │   │
│  │    └─> Auto-detected usage: "Cleaning Room 104"    │   │
│  │                                                      │   │
│  │  • Trash Bags (roll × 1)                            │   │
│  │    └─> Auto-detected: "General waste collection"   │   │
│  │                                                      │   │
│  │  [✓ Confirm] [✏️ Edit Purpose] [🔄 Retake]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  CHECKOUT DETAILS (Auto-populated, editable)               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Staff Member: Sarah Jenkins (Auto: logged-in user) │   │
│  │  Location: ARCHES Lodge - 1st Floor (Auto: GPS/last)│   │
│  │  Timestamp: Jan 14, 2026 2:34 PM (Auto: current)     │   │
│  │  Purpose: Cleaning Room 104 (Auto: AI detected)    │   │
│  │  Items:                                             │   │
│  │    • All-Purpose Cleaner (2 bottles)                │   │
│  │    • Trash Bags (1 roll = 50 bags)                  │   │
│  │                                                      │   │
│  │  [✅ Confirm Checkout] [💾 Save Draft] [❌ Cancel]  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ⚡ AUTO-ACTIONS TRIGGERED:                                   │
│  • Updated inventory counts (Cleaner: 45 → 43)              │
│  • Logged to transaction history                            │
│  • Noted Room 104 cleaning in maintenance log               │
│  • No reorder needed (above threshold)                      │
└─────────────────────────────────────────────────────────────┘
```

### 19.3 Agentic Reorder & Donor Outreach

**Autonomous Inventory Agents:**

```
┌─────────────────────────────────────────────────────────────┐
│           AGENTIC INVENTORY MANAGEMENT                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  AGENT 1: Inventory Monitor (runs every 4 hours)           │
│  ─────────────────────────────────────────────────────────  │
│  Status: ✅ Active                                          │
│  Last Run: 2 hours ago                                       │
│                                                              │
│  Current Alerts:                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🟡 CAUTION: Toilet Paper (24 rolls remaining)        │   │
│  │     Trend: -6 rolls/day | Projected depletion: 4 days│   │
│  │     Action: Monitoring, will escalate at 20 rolls    │   │
│  │                                                      │   │
│  │  🔴 CRITICAL: Body Wash (8 bottles remaining)       │   │
│  │     Trend: -3 bottles/day | Projected depletion: 2.6│   │
│  │     Threshold: 10 | Current: 8 | DEFICIT: -2       │   │
│  │     Action: TRIGGERING DONOR OUTREACH AGENT          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  AGENT 2: Donor Outreach (triggered by Agent 1)            │
│  ─────────────────────────────────────────────────────────  │
│  Status: 🔴 ACTIVE - Body Wash Campaign                     │
│  Triggered: 5 minutes ago                                    │
│                                                              │
│  Multi-Channel Outreach Executing:                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📧 EMAIL (Past Donors - Hygiene Products)          │   │
│  │     Status: ✅ Sent to 45 donors                   │   │
│  │     Open Rate: 12% (5 opens so far)                │   │
│  │     Clicks: 2 (to donation page)                   │   │
│  │                                                      │   │
│  │  📱 SOCIAL MEDIA (Auto-posted)                      │   │
│  │     Platform: Facebook, Instagram, Twitter          │   │
│  │     Message: "Urgent need: Body wash & soap for     │   │
│  │     100+ residents. Can you help? Link in bio"    │   │
│  │     Engagement: 23 likes, 5 shares, 2 comments      │   │
│  │                                                      │   │
│  │  🔔 STAFF ALERT (Slack #inventory-alerts)         │   │
│  │     "@channel Body wash critically low. Outreach   │   │
│  │     campaign launched. Consider emergency purchase"│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  AGENT 3: Procurement Intelligence (HUMAN-IN-LOOP)         │
│  ─────────────────────────────────────────────────────────  │
│  Status: 🔴 ACTIVE - Body Wash Recommendations Ready      │
│  Triggered: Low stock detected + no donor response (48hrs)   │
│                                                              │
│  ⚠️  IMPORTANT: NEVER AUTO-ORDERS - ALWAYS HUMAN APPROVAL   │
│                                                              │
│  AI PROCUREMENT RECOMMENDATIONS:                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  🔍 BODY WASH - Market Research Complete            │   │
│  │                                                      │   │
│  │  Need: 40 bottles (2.6 week supply at current use)   │   │
│  │                                                      │   │
│  │  OPTION 1: ⭐ BEST VALUE                            │   │
│  │  • Vendor: Amazon Business                            │   │
│  │  • Item: Dove Body Wash (24-pack) × 2 cases         │   │
│  │  • Unit Price: $1.87/bottle (lowest found)          │   │
│  │  • Total: $89.98 | Lead Time: 2 days (Prime)        │   │
│  │  • Budget Impact: 20% of monthly hygiene budget       │   │
│  │                                                      │   │
│  │  OPTION 2: 🚀 FASTEST DELIVERY                      │   │
│  │  • Vendor: Staples Business                           │   │
│  │  • Item: Dial Body Wash (bulk 48-pack) × 1 case     │   │
│  │  • Unit Price: $2.10/bottle                          │   │
│  │  • Total: $100.80 | Lead Time: Next day (local)     │   │
│  │  • Note: Slightly higher cost, immediate availability│   │
│  │                                                      │   │
│  │  OPTION 3: 💰 BULK SAVINGS (if storage available)  │   │
│  │  • Vendor: Costco Business                            │   │
│  │  • Item: Kirkland Body Wash (60-pack) × 1 case      │   │
│  │  • Unit Price: $1.45/bottle (bulk discount)        │   │
│  │  • Total: $87.00 | Lead Time: 3-5 days            │   │
│  │  • Note: Higher upfront, better per-unit cost        │   │
│  │                                                      │   │
│  │  [📋 View Full Comparison] [🔍 Check Alternatives]    │   │
│  │                                                      │   │
│  │  HUMAN DECISION REQUIRED:                            │   │
│  │  [✅ Approve Option 1] [✅ Approve Option 2]        │   │
│  │  [✅ Approve Option 3] [✏️ Modify Order]           │   │
│  │  [🗑️ Reject All - I'll find donors]               │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  🤖 PREDICTIVE INTELLIGENCE ALERT                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  📊 Usage Pattern Analysis:                           │   │
│  │                                                      │   │
│  │  Based on your 18-month inventory history:         │   │
│  │                                                      │   │
│  │  • ZEP Antibacterial Cleaner usage increases 340%   │   │
│  │    during December (flu season deep cleaning)      │   │
│  │                                                      │   │
│  │  • Current stock: 12 bottles (normal: 45)         │   │
│  │  • Current date: October 15                         │   │
│  │  • Predicted need by Dec 1: 38 additional bottles   │   │
│  │                                                      │   │
│  │  💡 AI SUGGESTION:                                   │   │
│  │  "I found a seasonal sale at WebstaurantStore:     │   │
│  │   ZEP Cleaner case (12 bottles) for $89.99         │   │
│  │   (normally $124.99). That's 28% off - should I    │   │
│  │   add this to your procurement recommendations?"  │   │
│  │                                                      │   │
│  │  [🛒 Add to Procurement Queue] [⏰ Remind Me Dec 1] │   │
│  │  [🚫 Dismiss] [📊 Show Full Usage Analytics]        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  📈 PROCUREMENT HISTORY (Last 90 Days)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Item          │ Avg Cost  │ Vendor       │ Lead  │   │
│  │  ──────────────┼───────────┼──────────────┼───────│   │
│  │  Body Wash     │ $1.95/btl │ Amazon       │ 2 day │   │
│  │  Toilet Paper  │ $0.42/rl  │ Staples      │ 1 day │   │
│  │  Trash Bags    │ $0.08/bag │ Costco       │ 3 day │   │
│  │  Coffee        │ $8.50/lb  │ Webstaurant  │ 5 day │   │
│  │                                                      │   │
│  │  [📊 Full Reports] [⚙️ Configure AI Preferences]    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 20. Grant Lead Generator & AI Grant Writer

### 20.1 Automated Grant Discovery

**Grant Scraper & Lead Generation:**

```
┌─────────────────────────────────────────────────────────────┐
│           GRANT LEAD GENERATOR DASHBOARD                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  SEARCH PARAMETERS                                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Organization: MWVCAA                               │   │
│  │  Programs: Emergency Shelter, Street Outreach, PSH  │   │
│  │  Focus Areas: Homelessness, Mental Health, Veterans │   │
│  │  Grant Types: Federal, State, Foundation, Corporate │   │
│  │  Award Range: $10,000 - $500,000                    │   │
│  │  Deadline: Next 12 months                           │   │
│  │                                                      │   │
│  │  [🔄 Refresh Search] [⚙️ Modify Criteria] [📥 Export]│   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ACTIVE LEADS (Auto-discovered & AI-ranked)                  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  🔥 HIGH MATCH (95%)                                  │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ HUD Continuum of Care Program                    │ │   │
│  │  │ Funder: US Department of Housing                 │ │   │
│  │  │ Award: $250,000 - $1,000,000                     │ │   │
│  │  │ Deadline: March 15, 2026 (60 days)               │ │   │
│  │  │ Match Score: 95% (perfect program alignment)     │ │   │
│  │  │ History: Funded 3 of last 5 years               │ │   │
│  │  │                                                    │ │   │
│  │  │ Why it matches:                                  │ │   │
│  │  │ • MWVCAA is CoC Collaborative Applicant        │ │   │
│  │  │ • Strong PIT count data                          │ │   │
│  │  │ • High housing placement rates (78%)             │ │   │
│  │  │                                                    │ │   │
│  │  │ [📄 View RFP] [🤖 AI Draft Application] [⭐ Save]│ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  🔶 GOOD MATCH (78%)                                │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ Robert Wood Johnson Foundation                 │ │   │
│  │  │ Focus: Health & Housing Integration             │ │   │
│  │  │ Award: $150,000 - $300,000                     │ │   │
│  │  │ Deadline: April 30, 2026 (105 days)            │ │   │
│  │  │ Match Score: 78% (health program expansion)    │ │   │
│  │  │                                                    │ │   │
│  │  │ Opportunity: Add healthcare coordination focus  │ │   │
│  │  │ to existing case management program             │ │   │
│  │  │                                                    │ │   │
│  │  │ [📄 View Guidelines] [📝 Readiness Check] [⭐ Save]│ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  │  🔷 EMERGING (New Opportunity)                        │   │
│  │  ┌─────────────────────────────────────────────────┐ │   │
│  │  │ Walmart Foundation - Local Community Grants     │ │   │
│  │  │ Award: $250 - $5,000 (small but quick)         │ │   │
│  │  │ Deadline: Rolling (monthly decisions)            │ │   │
│  │  │ Match: General operating support               │ │   │
│  │  │                                                    │ │   │
│  │  │ [📄 View Application] [🤖 Quick Apply (AI)] [⭐] │ │   │
│  │  └─────────────────────────────────────────────────┘ │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  DATA SOURCES (Continuously Monitored)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  ✅ Grants.gov (Federal) - Checked daily            │   │
│  │  ✅ HUD Exchange - Checked daily                    │   │
│  │  ✅ SAM.gov - Checked daily                         │   │
│  │  ✅ Foundation Directory Online - Weekly            │   │
│  │  ✅ State grant portals (CA, OR, WA) - Daily        │   │
│  │  ✅ Corporate giving pages (50+ companies) - Weekly │   │
│  │  ✅ Google Alerts ("homelessness grant 2026") - Real-time│   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 20.2 AI Grant Writing Assistant

**Automated Application Drafting:**

```
┌─────────────────────────────────────────────────────────────┐
│           AI GRANT WRITING WORKFLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  RFP: HUD CoC Program FY2026                                 │
│  Deadline: March 15, 2026 (58 days remaining)               │
│  Status: 🟡 DRAFTING IN PROGRESS                            │
│                                                              │
│  AI ASSISTANT PROGRESS                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Section                      │ Status   │ AI Score│   │
│  │  ─────────────────────────────┼──────────┼─────────│   │
│  │  Executive Summary            │ ✅ Draft │ 92%     │   │
│  │  Need Statement               │ ✅ Draft │ 88%     │   │
│  │  Project Description          │ 🔄 Writing│ --     │   │
│  │  Organizational Capacity      │ ⏳ Pending│ --     │   │
│  │  Budget & Budget Narrative    │ ⏳ Pending│ --     │   │
│  │  Evaluation Plan              │ ⏳ Pending│ --     │   │
│  │  Sustainability Plan          │ ⏳ Pending│ --     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  AI-GENERATED EXECUTIVE SUMMARY (Preview)                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  MWVCAA ARCHES Lodge: Expanding Emergency Shelter   │   │
│  │  and Permanent Supportive Housing                   │   │
│  │                                                      │   │
│  │  [AI Draft - Based on organization data & past apps]│   │
│  │                                                      │   │
│  │  The Mid-Willamette Valley Community Action Agency │   │
│  │  (MWVCAA) operates ARCHES Lodge, a 100-bed         │   │
│  │  emergency shelter serving individuals experiencing│   │
│  │  homelessness in Marion and Polk counties, Oregon.  │   │
│  │                                                      │   │
│  │  In 2025, ARCHES Lodge provided 31,025 bed nights  │   │
│  │  of care and achieved a 78% successful exit rate to │   │
│  │  permanent housing. [Data from system analytics]   │   │
│  │                                                      │   │
│  │  This application requests $487,500 to:           │   │
│  │  1. Expand shelter capacity by 25 beds              │   │
│  │  2. Launch Rapid Rehousing program                 │   │
│  │  3. Enhance supportive services coordination      │   │
│  │                                                      │   │
│  │  Our evidence-based approach combines Housing       │   │
│  │  First principles with trauma-informed care...     │   │
│  │                                                      │   │
│  │  [✏️ Edit Section] [🔄 Regenerate] [✅ Approve]     │   │
│  │  [📊 View Data Sources Used]                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  DATA SOURCES PULLED AUTOMATICALLY:                          │
│  ✓ 2025 Program statistics (bed nights, exits, outcomes)      │
│  ✓ Demographics from HMIS records (anonymized)              │
│  ✓ Budget actuals from finance module                         │
│  ✓ Staff credentials from HR module                           │
│  ✓ Previous CoC application (2025 - reference)              │
│  ✓ Letters of support (auto-request sent to partners)       │
│                                                              │
│  AI ACTIONS QUEUED:                                          │
│  • Drafting "Need Statement" (analyzing PIT data, comparing  │
│    to regional benchmarks)                                    │
│  • Will request: Client success stories (auto-prompt staff) │
│  • Will compile: Partner organization MOUs (checking files)  │
│                                                              │
│  [⏸️ Pause AI] [⚙️ Writing Preferences] [👤 Assign to Staff]│
└─────────────────────────────────────────────────────────────┘
```

### 20.3 Grant Calendar & Workflow

```
┌─────────────────────────────────────────────────────────────┐
│           GRANT MANAGEMENT CALENDAR                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  JANUARY 2026                                                │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Week 1  │  Week 2  │  Week 3  │  Week 4  │ Week 5   │   │
│  │  ────────┼──────────┼──────────┼──────────┼────────  │   │
│  │  [🟢]    │  [🟢]    │  [🔴]    │  [🟡]    │ [🟢]    │   │
│  │  Start   │  Draft   │  CRIT    │  Review  │ Submit  │   │
│  │  HUD CoC │  Due 15th│  Health  │  Walmart│  HUD    │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ACTIVE APPLICATIONS                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  🔴 DUE IN 15 DAYS: Robert Wood Johnson Foundation  │   │
│  │     Status: Draft 60% complete                        │   │
│  │     Assigned to: Jane Smith (Grants Manager)       │   │
│  │     AI Assist: Active (generating evaluation section)│   │
│  │     [View Draft] [Upload Documents] [Submit]          │   │
│  │                                                      │   │
│  │  🟡 IN REVIEW: Walmart Local Grant ($2,500)         │   │
│  │     Status: Pending final budget approval            │   │
│  │     Assigned to: Jane Smith                           │   │
│  │     [View] [Approve Budget] [Submit]                  │   │
│  │                                                      │   │
│  │  🟢 SUBMITTED: HUD CoC (FY2026)                     │   │
│  │     Status: Awaiting announcement (Sept 2026)        │   │
│  │     Award probability: 78% (based on history)       │   │
│  │     [View Submission] [Check Status]                │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 21. Highly Agentic Platform Architecture

### 21.1 Agent Ecosystem

**ActionOS Agent Framework:**

```
┌─────────────────────────────────────────────────────────────┐
│              AGENTIC AI ECOSYSTEM                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ORCHESTRATOR AGENT (Master Coordinator)                    │
│  └─> Monitors all agents, resolves conflicts, optimizes      │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │              SPECIALIZED AGENTS                        ││
│  ├─────────────────────────────────────────────────────────┤│
│  │                                                          ││
│  │  🤖 CLIENT CARE AGENTS                                   ││
│  │  ├─> Bed Availability Agent                               ││
│  │  │   └─> Predicts bed demand, optimizes assignments      ││
│  │  ├─> Risk Assessment Agent                              ││
│  │  │   └─> Identifies clients at risk of return            ││
│  │  ├─> Resource Matching Agent                            ││
│  │  │   └─> Auto-finds housing, jobs, services             ││
│  │  └─> Follow-up Agent                                    ││
│  │      └─> Schedules 30/60/90 day check-ins               ││
│  │                                                          ││
│  │  📦 OPERATIONS AGENTS                                    ││
│  │  ├─> Inventory Monitor Agent (Section 19)               ││
│  │  ├─> Donor Outreach Agent (Section 19)                  ││
│  │  ├─> Procurement Intelligence Agent (Section 19)      ││
│  │  │   └─> Researches options, NEVER auto-orders,     ││
│  │  │      human approval required, predictive alerts   ││
│  │  ├─> Maintenance Predictor                              ││
│  │  │   └─> Predicts equipment failure, schedules PM      ││
│  │  └─> Safety Monitor Agent                               ││
│  │      └─> Detects incident patterns, escalates           ││
│  │                                                          ││
│  │  💰 FINANCIAL AGENTS                                     ││
│  │  ├─> Grant Scout Agent (Section 20)                     ││
│  │  ├─> Grant Writer Agent (Section 20)                    ││
│  │  ├─> Budget Optimizer                                   ││
│  │  │   └─> Identifies savings, reallocates               ││
│  │  └─> Donation Forecast Agent                            ││
│  │      └─> Predicts giving trends, suggests campaigns     ││
│  │                                                          ││
│  │  👥 HR AGENTS                                            ││
│  │  ├─> Compliance Monitor                                   ││
│  │  │   └─> Tracks expiring certs, TB tests, training      ││
│  │  ├─> Shift Optimizer                                      ││
│  │  │   └─> Optimizes schedules, fills gaps               ││
│  │  └─> Recruiting Screener                                 ││
│  │      └─> Auto-screens applicants, schedules interviews   ││
│  │                                                          ││
│  │  📊 DATA & COMPLIANCE AGENTS                              ││
│  │  ├─> HMIS Quality Agent                                   ││
│  │  │   └─> Detects data errors, prompts corrections        ││
│  │  ├─> Report Generator Agent                             ││
│  │  │   └─> Auto-compiles HUD, state, funder reports        ││
│  │  └─> Anomaly Detector                                     ││
│  │      └─> Flags unusual patterns (fraud, errors)          ││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
│                                                              │
│  AGENT INTERACTION EXAMPLES:                                  │
│  ┌─────────────────────────────────────────────────────────┐│
│  │                                                          ││
│  │  Scenario 1: Low Inventory triggers Donor Outreach        ││
│  │  ──────────────────────────────────────────────────────  ││
│  │  Inventory Agent: "Body wash below threshold"          ││
│  │    ↓                                                      ││
│  │  Donor Agent: "Launching campaign" + Drafting emails      ││
│  │    ↓                                                      ││
│  │  Orchestrator: "Log action, notify admin, set 48hr timer" ││
│  │    ↓                                                      ││
│  │  (48 hours later, no response)                           ││
│  │    ↓                                                      ││
│  │  Order Agent: "Triggering emergency purchase"            ││
│  │    ↓                                                      ││
│  │  Budget Agent: "Checking available budget"               ││
│  │    ↓                                                      ││
│  │  Compliance Agent: "Logging purchase for audit trail"   ││
│  │                                                          ││
│  │  Scenario 2: Client at Risk of Homelessness Return     ││
│  │  ──────────────────────────────────────────────────────  ││
│  │  Risk Agent: "Client missed 2 appointments, no case note││
│  │                in 30 days - 85% return risk"               ││
│  │    ↓                                                      ││
│  │  Care Agent: "Auto-scheduling wellness check"            ││
│  │    ↓                                                      ││
│  │  Resource Agent: "Identifying barriers, suggesting services"││
│  │    ↓                                                      ││
│  │  Case Manager: Gets alert + AI-suggested intervention plan││
│  │                                                          ││
│  └─────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────┘
```

### 21.2 AI Action Button 2.0

**Enhanced AI Action System:**

```
┌─────────────────────────────────────────────────────────────┐
│           ACTION BUTTON - UNIVERSAL AI INTERFACE             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Input Modes: [🎤 Voice] [📷 Photo] [📝 Text] [📎 Attach]   │
│                                                              │
│  EXAMPLE INTERACTIONS:                                       │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │  User (Site Assistant):                            │   │
│  │  [🎤 Voice] "The heater in dorm B is making a    │   │
│  │   weird noise and it's cold in there. Client      │   │
│  │   John asked if he can get a new blanket too.      │   │
│  │   Also, we're almost out of coffee in the break   │   │
│  │   room."                                           │   │
│  │                                                      │   │
│  │  AI Processing:                                    │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ 🏠 MAINTENANCE REQUEST                      │   │   │
│  │  │ • Issue: HVAC noise + inadequate heating   │   │   │
│  │  │ • Location: Dormitory B                    │   │   │
│  │  │ • Priority: HIGH (affects resident comfort)│   │   │
│  │  │ • Auto-assigned to: Facilities Manager      │   │   │
│  │  │                                               │   │   │
│  │  │ 👤 CLIENT REQUEST                             │   │   │
│  │  │ • Client: John [ID: C-2024-00891]           │   │   │
│  │  │ • Request: Additional blanket              │   │   │
│  │  │ • Fulfilled: Inventory checkout initiated  │   │   │
│  │  │ • Case Note: "Client advocacy - comfort need"│   │   │
│  │  │                                               │   │   │
│  │  │ 📦 INVENTORY ALERT                            │   │   │
│  │  │ • Item: Coffee (staff supplies)              │   │   │
│  │  │ • Current: 2 bags (below threshold: 5)     │   │   │
│  │  │ • Agent: Monitoring, will order at < 1     │   │   │
│  │  │                                               │   │   │
│  │  │ ✅ Actions Taken Automatically:               │   │   │
│  │  │ • Work order #WO-2847 created               │   │   │
│  │  │ • Client note added to John's case file     │   │   │
│  │  │ • Blanket checked out: Inventory tx #4829   │   │   │
│  │  │ • Slack alert sent to #facilities-alerts   │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                      │   │
│  │  [✅ Confirm All] [✏️ Edit Actions] [🔄 Revise]     │   │
│  │                                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  AGENT ROUTING LOGIC:                                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Input Type        │ Primary Agent │ Secondary       │   │
│  │  ──────────────────┼───────────────┼────────────────│   │
│  │  "heater broke"   │ Maintenance   │ Safety Monitor   │   │
│  │  "client needs..."│ Case Manager  │ Resource Match   │   │
│  │  "we're out of..."│ Inventory     │ Donor/Order      │   │
│  │  "grant due..."   │ Grant Writer  │ Budget          │   │
│  │  "staff called..."│ HR Compliance │ Shift Optimizer  │   │
│  │  "data looks..."  │ Data Quality  │ Report Generator │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

*Document Version: 2.0*  
*Last Updated: April 2026*  
*Author: ActionOS Architecture Team*  
*Classification: Internal - Confidential*


```
[Organization] 1--* [Location] 1--* [Program]
    |              |              |
    |              |              |
    *              *              *
[User] 1--* [User_Access] *--1 [Role]
    |
    *
[Client] 1--* [Case_Note] *--1 [User]
    |              |
    *              *
[Client_Roster] 1--1 [Room] 1--1 [Location]
    |
    |
    *
[Exit_Record] 1--* [Follow_Up]

[Financial]
├── [Budget] 1--* [Budget_Line]
├── [Donation] *--1 [Donor]
├── [Grant] 1--* [Grant_Budget] 1--* [Expense]
└── [Invoice]

[Inventory]
├── [Item_Master] 1--* [Inventory_Location]
├── [Transaction] *--1 [User]
└── [Purchase_Order]

[HR]
├── [Employee] 1--* [Time_Entry]
├── [Position] 1--* [Employee]
├── [Benefit] *--* [Employee]
└── [Training] *--* [Employee]
```

### Appendix B: API Endpoint Reference

See OpenAPI specification in `/docs/api/openapi.yaml`

### Appendix C: Third-Party Service Agreements

**Business Associate Agreements (BAAs) Required:**
- Hosting provider (AWS/Azure)
- Database service (managed PostgreSQL)
- AI service (Google Gemini)
- Email service (SendGrid)
- SMS service (Twilio)
- File storage (S3)
- Authentication (Clerk)
- Monitoring (DataDog)

### Appendix D: Training Curriculum

**Role-Based Training:**
1. **Executive Director:** Dashboard overview, report generation, compliance monitoring
2. **Site Admin:** Operations workflow, bed management, maintenance requests
3. **Case Manager:** Client intake, case notes, goal tracking, mobile app
4. **Facilities:** Work orders, inventory, safety inspections
5. **HR:** Staff management, recruiting, compliance tracking
6. **Finance:** Budget entry, donation processing, grant reporting

### Appendix E: Disaster Recovery Procedures

See `/docs/runbooks/disaster-recovery.md`

---

*Document Version: 1.0*  
*Last Updated: April 2026*  
*Author: ActionOS Architecture Team*  
*Classification: Internal - Confidential*
