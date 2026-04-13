# ActionOS

AI-powered nonprofit operations platform for homeless services, shelters, and case management.

## What This Is

ActionOS helps nonprofits manage day-to-day operations across multiple locations:

- **Client Management** - Case tracking, goals, service delivery
- **Inventory** - Multi-location stock tracking with AI-powered ordering
- **HR & Scheduling** - Staff management, shift coverage, certifications
- **Facilities** - Work orders, maintenance tracking
- **Grants** - AI finds and drafts grant applications
- **Compliance** - Audit logs, reporting, HIPAA/SOC 2 ready

## Tech Stack

- React 19 + TypeScript
- Express.js backend
- Tailwind CSS 4
- SQLite (better-sqlite3)
- Google Gemini API
- Clerk authentication

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.local.example .env.local
# Add your keys to .env.local

# Run dev server
npm run dev
```

## Environment Variables

Create `.env.local`:

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
GEMINI_API_KEY=AIza...
```

Get keys from:
- Clerk: https://clerk.com
- Gemini: https://ai.google.dev

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server

## Features

- **Role-based dashboards** - Custom views for directors, caseworkers, assistants, coordinators
- **AI Action Button** - Voice, photo, text input for quick logging
- **Inventory AI** - Snap photos to count stock, predictive ordering alerts
- **Grant Generator** - Finds opportunities, drafts applications
- **SOS System** - Emergency alerts with location
- **Multi-location** - GPS tracking for mobile outreach teams

## API Endpoints

- `POST /api/action` - Create logs/tasks via AI
- `GET /api/logs` - Retrieve activity logs
- `GET /api/tasks` - Get tasks/work orders
- `POST /api/sos` - Emergency alert
- `GET /api/occupancy` - Bed availability

## Deployment

### Vercel

```bash
npm i -g vercel
vercel
```

Set environment variables in Vercel dashboard after deploying.

### Docker

```bash
docker build -t actionos .
docker run -p 3000:3000 actionos
```

## Project Structure

```
├── src/
│   ├── components/     # React components
│   ├── contexts/       # Auth context
│   ├── pages/          # Route pages
│   └── main.tsx        # Entry point
├── server.ts           # Express backend
└── package.json
```

## Custom Roles

Super admins can create custom positions with specific permissions per location. Built-in roles include:

- Executive Director
- Site Director
- Case Manager
- Site Assistant / Lead Float
- Coordinator (inventory/ordering)
- Outreach Team
- IT / Facilities
- HR Manager

## Compliance

- HIPAA ready (encryption, audit logs)
- SOC 2 Type II aligned
- HUD HMIS compatible

## License

MIT
