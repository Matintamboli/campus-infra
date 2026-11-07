# CampusFix – Campus Infrastructure Incident Management Platform

A comprehensive web-based incident management system designed for educational institutions to streamline the reporting, tracking, and resolution of campus infrastructure issues such as network outages, hardware failures, facility problems, and equipment malfunctions.

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Database Architecture](#database-architecture)
- [API Documentation](#api-documentation)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Usage Guide](#usage-guide)
- [Security](#security)
- [Testing & Troubleshooting](#testing--troubleshooting)
- [Future Enhancements](#future-enhancements)

---

## Overview

**CampusFix** is a role-based incident management platform that enables students, faculty, and IT staff to efficiently report, track, and resolve campus infrastructure incidents. The system provides dedicated interfaces for different user roles with appropriate permissions and workflows.

### Target Users & Roles

1. **Reporter (Student/Faculty/Staff)** - Report incidents, track their status, and communicate with technicians
2. **Technician** - View assigned incidents, update work progress, and resolve issues
3. **Administrator** - Oversee all operations, manage users, assign work, and access analytics

### Complete Incident Management Workflow

```
1. Reporter creates incident → 2. System assigns ticket number
                           ↓
3. Administrator reviews → 4. Assigns to Technician
                           ↓
5. Technician accepts → 6. Updates to "In Progress"
                           ↓
7. Adds diagnostic notes → 8. Marks as "Resolved"
                           ↓
9. Reporter confirms → 10. Status changes to "Closed"
```

---

## Problem Statement

Educational institutions face challenges in managing infrastructure incidents across campus:

- **Scattered Reporting**: Incidents reported through email, phone, or in-person lack centralization
- **Lost Tracking**: No visibility into incident status or technician assignment
- **Delayed Response**: Critical issues not prioritized or assigned promptly
- **Poor Communication**: Limited updates between reporters and technicians
- **No Analytics**: Inability to identify recurring issues or measure response times

**CampusFix solves these problems** by providing a unified platform with real-time tracking, role-based workflows, automated notifications, and comprehensive analytics.

---

## Key Features

### For All Users
- Secure authentication with JWT tokens
- Role-based dashboard access
- Real-time notification system
- Incident search and filtering
- Mobile-responsive interface

### For Reporters
- Submit detailed incident reports with location and priority
- Upload supporting evidence/attachments
- Track incident status in real-time
- Communicate with assigned technicians via comments
- Confirm resolution before closure

### For Technicians
- View assigned and available incident queues
- Accept/claim unassigned work orders
- Update incident status and progress
- Add internal diagnostic notes
- Upload technical documentation
- Track active, in-progress, and resolved incidents

### For Administrators
- Comprehensive dashboard with system-wide analytics
- User management (create, modify, suspend accounts)
- Incident assignment and reassignment
- Priority and category management
- System activity audit logs
- Analytics & reports:
  - Incident trends over time
  - Resolution time metrics
  - Technician workload distribution
  - Category-wise breakdown
  - Recurring incident identification
  - Building/location-based statistics

---

## Technology Stack

### Frontend
- **React** 19.2.8 - UI library
- **Vite** 8.3.0 - Build tool and dev server
- **Tailwind CSS** 4.3.3 - Utility-first CSS framework
- **Lucide React** 1.48.0 - Icon library
- **Proxy**: API requests proxied to `http://localhost:5000`

### Backend
- **Node.js** with **Express** 5.3.0 - REST API server
- **Embedded PostgreSQL** 18.6 - Self-contained database
- **Prisma ORM** 6.4.1 - Database access and migrations
- **JWT** (jsonwebtoken 9.0.3) - Authentication
- **bcryptjs** 3.0.3 - Password hashing
- **CORS** 2.8.6 - Cross-origin resource sharing

### Database
- **PostgreSQL** 18.6 (embedded)
- **Prisma Schema** - Type-safe database modeling
- **Database Name**: `campusfix`
- **Port**: 5432 (localhost)

### Development Tools
- **Concurrently** 10.0.6 - Run frontend & backend simultaneously
- **OxLint** 1.81.0 - Fast JavaScript linter
- **dotenv** 18.0.8 - Environment variable management

---

## Project Structure

```
campusinfraproject/
├── .env                      # Environment variables (DO NOT COMMIT)
├── .env.example              # Environment variable template
├── .gitignore                # Git ignore configuration
├── package.json              # Root dependencies and scripts
├── vite.config.js            # Vite configuration with API proxy
├── index.html                # HTML entry point
│
├── prisma/                   # Database schema and migrations
│   ├── schema.prisma         # Prisma data model definition
│   ├── seed.js               # Database seeding script
│   └── migrations/           # Database migration history
│
├── server/                   # Backend API server
│   ├── index.js              # Express server entry point
│   ├── initPostgres.js       # Embedded PostgreSQL initialization
│   ├── prismaClient.js       # Prisma client singleton
│   │
│   ├── middleware/           # Express middleware
│   │   └── auth.js           # JWT authentication & role authorization
│   │
│   ├── routes/               # API route handlers
│   │   ├── auth.js           # Authentication endpoints
│   │   ├── incidents.js      # Incident CRUD operations
│   │   ├── tickets.js        # Ticket management (alias routes)
│   │   ├── notifications.js  # Notification endpoints
│   │   └── analytics.js      # Analytics and reporting
│   │
│   └── services/             # Business logic services
│       └── notificationService.js  # Notification creation & dispatch
│
└── src/                      # Frontend React application
    ├── main.jsx              # React app entry point
    ├── App.jsx               # Root component with routing
    ├── index.css             # Global styles (Tailwind)
    │
    ├── components/           # React components
    │   ├── dashboard/        # Role-specific dashboards
    │   │   ├── StudentDashboard.jsx
    │   │   ├── TechnicianDashboard.jsx
    │   │   ├── AdminDashboard.jsx
    │   │   ├── ReporterDashboard.jsx
    │   │   ├── UnifiedSidebar.jsx
    │   │   └── PlatformHeader.jsx
    │   │
    │   ├── analytics/        # Analytics components
    │   │   └── AnalyticsDashboard.jsx
    │   │
    │   ├── notifications/    # Notification center
    │   │   ├── NotificationBell.jsx
    │   │   └── NotificationCenterModal.jsx
    │   │
    │   ├── incident/         # Incident management components
    │   │
    │   ├── ui/               # Reusable UI components
    │   │   └── ErrorBoundary.jsx
    │   │
    │   ├── LoginForm.jsx
    │   ├── SignUpForm.jsx
    │   ├── ForgotPasswordModal.jsx
    │   └── Toast.jsx
    │
    ├── context/              # React Context providers
    │   ├── AuthContext.jsx   # Authentication state
    │   └── NotificationContext.jsx  # Notification state
    │
    └── services/             # API service layer
        ├── authService.js    # Authentication API calls
        └── api.js            # Generic API utilities
```

---

## Database Architecture

### Technology
- **PostgreSQL 18.6** (embedded, self-contained)
- **Prisma ORM 6.4.1** for type-safe database access
- **Connection**: `postgresql://postgres:password@localhost:5432/campusfix`

### Data Models

The database consists of 11 tables modeling the complete incident management workflow:

#### Core Models

**1. User** (`users`)
- Stores all platform users (Students, Faculty, Staff, Technicians, Administrators)
- Fields: `id`, `name`, `email`, `collegeId` (unique), `passwordHash`, `role`, `userType`, `department`, `status`
- Roles: `Reporter`, `Technician`, `Administrator`
- User Types: `Student`, `Faculty`, `Staff`, `IT Staff`

**2. Incident** (`tickets`)
- Central incident tracking entity
- Fields: `id`, `ticketNumber` (unique, e.g., INC-1082), `title`, `description`, `categoryName`, `building`, `floor`, `room`, `affectedService`, `priority`, `status`, `reporterId`, `technicianId`, `slaDeadline`, `resolvedAt`, `closedAt`, `resolutionNotes`
- Priorities: `Low`, `Medium`, `High`, `Critical`
- Statuses: `Open`, `Assigned`, `In Progress`, `Resolved`, `Closed`

**3. IncidentCategory** (`categories`)
- Predefined incident categories (Network, Hardware, Software, Power, etc.)
- Fields: `id`, `name`, `code`, `description`, `slaHours`, `status`

**4. CampusLocation** (`locations`)
- Physical locations across campus
- Fields: `id`, `building`, `floor`, `room`, `status`
- Unique constraint on `(building, floor, room)`

**5. CampusService** (`services`)
- Campus services affected by incidents
- Fields: `id`, `name`, `categoryId`, `slaHours`, `description`, `status`

#### Supporting Models

**6. IncidentComment** (`ticket_notes`)
- Comments and notes on incidents
- Fields: `id`, `incidentId`, `userId`, `message`, `isInternal`, `createdAt`
- Internal notes visible only to technicians/admins

**7. IncidentAttachment** (`ticket_attachments`)
- Evidence files attached to incidents
- Fields: `id`, `incidentId`, `fileName`, `fileType`, `fileSize`, `fileData` (base64)

**8. TechnicianAssignment** (`technician_assignments`)
- Assignment history tracking
- Fields: `id`, `incidentId`, `technicianId`, `assignedById`, `assignedAt`, `notes`, `status`, `completedAt`

**9. IncidentActivity** (`incident_activities`)
- Audit trail of all incident changes
- Fields: `id`, `incidentId`, `userId`, `action`, `fromState`, `toState`, `details`, `createdAt`
- Actions: `CREATED`, `STATUS_CHANGED`, `ASSIGNED`, `PRIORITY_CHANGED`, `RESOLVED`, `CLOSED`, `REOPENED`

**10. Notification** (`notifications`)
- Real-time notifications for users
- Fields: `id`, `userId`, `ticketId`, `ticketNumber`, `eventType`, `title`, `message`, `priority`, `building`, `isRead`, `createdAt`

**11. AuditLog** (`audit_logs`)
- System-wide audit logging
- Fields: `id`, `userId`, `action`, `details`, `ipAddress`, `createdAt`

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Incident : "reports"
    User ||--o{ Incident : "assigned_to"
    User ||--o{ IncidentComment : "writes"
    User ||--o{ IncidentActivity : "performs"
    User ||--o{ Notification : "receives"
    User ||--o{ TechnicianAssignment : "assigned"
    User ||--o{ AuditLog : "generates"
    
    Incident ||--o{ IncidentComment : "has"
    Incident ||--o{ IncidentAttachment : "has"
    Incident ||--o{ IncidentActivity : "tracks"
    Incident ||--o{ TechnicianAssignment : "has"
    Incident ||--o{ Notification : "triggers"
    Incident }o--|| IncidentCategory : "belongs_to"
    Incident }o--|| CampusLocation : "located_at"
    Incident }o--|| CampusService : "affects"
    
    IncidentCategory ||--o{ CampusService : "categorizes"
    
    User {
        int id PK
        string name
        string email UK
        string collegeId UK
        string passwordHash
        string role
        string userType
        string department
        string status
    }
    
    Incident {
        int id PK
        string ticketNumber UK
        string title
        string description
        string categoryName
        string building
        string priority
        string status
        int reporterId FK
        int technicianId FK
        datetime slaDeadline
        datetime resolvedAt
        datetime closedAt
    }
    
    IncidentCategory {
        int id PK
        string name UK
        string code UK
        int slaHours
        string status
    }
    
    CampusLocation {
        int id PK
        string building
        string floor
        string room
        string status
    }
    
    IncidentComment {
        int id PK
        int incidentId FK
        int userId FK
        string message
        boolean isInternal
        datetime createdAt
    }
    
    Notification {
        int id PK
        int userId FK
        int ticketId FK
        string eventType
        string title
        string message
        string priority
        boolean isRead
        datetime createdAt
    }
```

### Database Operations

**Initialize Database:**
The embedded PostgreSQL server initializes automatically when the backend starts. It creates a persistent data directory at `.pgdata/`.

**Apply Prisma Schema:**
```bash
npx prisma generate
npx prisma db push
```

**Seed Initial Data:**
```bash
node prisma/seed.js
```

**⚠️ WARNING**: The seed script **clears existing data** before inserting sample records. Only run on a fresh database or after backing up important data.

**Seeded Data Includes:**
- 6 incident categories (Network Infrastructure, Hardware Systems, Software & OS, Power & Electrical, Classroom Equipment, Campus Servers)
- 8 campus locations (various buildings and rooms)
- 6 campus services
- 5 test users (2 Reporters, 2 Technicians, 1 Administrator)
- 3 sample incidents with comments and activity logs
- 4 test notifications

**View Database Schema:**
```bash
npx prisma studio
```
Opens Prisma Studio GUI at `http://localhost:5555` for database browsing and editing.

**Database Migrations:**
Prisma tracks schema changes in `prisma/migrations/`. To create a new migration after schema changes:
```bash
npx prisma migrate dev --name description_of_change
```

---

## API Documentation

### Base URL
All API endpoints are prefixed with `/api` and proxied from the frontend.

- **Development Frontend**: `http://localhost:5174`
- **Development Backend**: `http://localhost:5000`
- **API Base URL**: `http://localhost:5000/api`

### Authentication

Most endpoints require a JWT token sent in the `Authorization` header:
```
Authorization: Bearer <jwt_token>
```

Obtain token via `POST /api/auth/login` or `POST /api/auth/register`.

### API Endpoints

#### Authentication (`/api/auth`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| POST | `/register` | Register new user account | No | Public |
| POST | `/login` | Authenticate user and get JWT | No | Public |
| GET | `/me` | Get current authenticated user | Yes | All |
| POST | `/logout` | Log out and record audit | Yes | All |
| POST | `/forgot-password` | Request password reset token | No | Public |
| POST | `/reset-password` | Reset password with token | No | Public |
| POST | `/google` | Google OAuth authentication | No | Public |

#### Incidents (`/api/incidents`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | List incidents with filters | Yes | All (scoped by role) |
| GET | `/:id` | Get single incident details | Yes | All (ownership check) |
| POST | `/` | Create new incident | Yes | All |
| PATCH | `/:id/status` | Update incident status | Yes | All (restricted actions by role) |
| PATCH | `/:id/assign` | Assign/reassign technician | Yes | Technician, Administrator |
| POST | `/:id/comments` | Add comment to incident | Yes | All (ownership check) |
| PATCH | `/:id/priority` | Update incident priority | Yes | Technician, Administrator |

**Query Parameters for GET `/`:**
- `status`: Filter by status (Open, In Progress, Resolved, Closed)
- `category`: Filter by category name
- `priority`: Filter by priority (Low, Medium, High, Critical)
- `search`: Search in title, ticket number, building, room
- `view`: Special view filters (all, assigned) for Technicians
- `building`: Filter by building name

#### Tickets (`/api/tickets`)

Alias routes for incidents with identical functionality:

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | List tickets with filters | Yes | All (scoped by role) |
| GET | `/:id` | Get single ticket details | Yes | All (ownership check) |
| POST | `/` | Create new ticket | Yes | All |
| PATCH | `/:id/status` | Update ticket status | Yes | All (restricted by role) |
| PATCH | `/:id/assign` | Assign/reassign technician | Yes | Technician, Administrator |
| POST | `/:id/notes` | Add note to ticket | Yes | All (ownership check) |
| POST | `/:id/attachments` | Upload attachments | Yes | All (ownership check) |

#### Notifications (`/api/notifications`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get user's notifications | Yes | All |
| PATCH | `/:id/read` | Mark notification as read | Yes | All |
| POST | `/mark-all-read` | Mark all notifications as read | Yes | All |
| DELETE | `/:id` | Delete notification | Yes | All |

**Query Parameters for GET `/`:**
- `unreadOnly`: Filter to only unread notifications (boolean)
- `limit`: Limit number of results (default: 50)

#### Analytics (`/api/analytics`)

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/` | Get comprehensive dashboard analytics | Yes | Administrator |
| GET | `/trends` | Get incident trends over time | Yes | Administrator |

**Query Parameters for GET `/`:**
- `timeRange`: Time period (7d, 30d, 90d, 1y)
- `startDate`: Custom start date (ISO format)
- `endDate`: Custom end date (ISO format)
- `building`: Filter by building
- `category`: Filter by category
- `priority`: Filter by priority

**Analytics Response Includes:**
- Total/open/in-progress/resolved/closed incident counts
- Critical incident count
- Average resolution time
- Incidents over time (30-day trend)
- Monthly trends (6 months)
- Status distribution
- Technician workload
- Affected services breakdown
- Recurring incident clusters
- Tickets ledger (recent incidents)

#### Health Check

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/health` | Server health status | No |

**Response:**
```json
{
  "status": "ok",
  "service": "CampusFix Infrastructure Incident Platform API",
  "version": "2.0.0",
  "database": "PostgreSQL",
  "timestamp": "2024-11-04T10:00:00.000Z"
}
```

### Role-Based Access Control

#### Reporter (Student/Faculty/Staff)
- ✅ Create incidents
- ✅ View own incidents only
- ✅ Comment on own incidents
- ✅ Update own incident status (limited: Resolved→Closed, Resolved/Closed→Open)
- ✅ Upload attachments to own incidents
- ❌ View other users' incidents
- ❌ Assign technicians
- ❌ Change priority
- ❌ Access analytics

#### Technician
- ✅ View all incidents OR only assigned incidents (based on `view` parameter)
- ✅ Self-assign available incidents
- ✅ Update status of assigned incidents
- ✅ Add internal/public comments
- ✅ Upload technical documentation
- ✅ Change priority of assigned incidents
- ❌ Assign other technicians (admin only)
- ❌ Access full analytics

#### Administrator
- ✅ Full access to all incidents
- ✅ User management
- ✅ Assign/reassign any technician
- ✅ Change any incident priority
- ✅ Access comprehensive analytics
- ✅ View system audit logs
- ✅ Override any incident status

---

## Installation & Setup

### Prerequisites

Ensure the following software is installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **npm** 9.x or higher (comes with Node.js)
- **Git** ([Download](https://git-scm.com/))

Windows users: The project uses embedded PostgreSQL binaries for Windows x64. No separate PostgreSQL installation needed.

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd campusinfraproject
```

### Step 2: Install Dependencies

The project has a single `package.json` at the root containing both frontend and backend dependencies.

```bash
npm install
```

This installs:
- React, Vite, Tailwind CSS (frontend)
- Express, Prisma, embedded-postgres (backend)
- Development tools (concurrently, oxlint)

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` with the following values:

```env
# Server Configuration
PORT=5000

# Authentication JWT Secret (CHANGE THIS IN PRODUCTION!)
JWT_SECRET=your_secure_random_string_here

# PostgreSQL Database Connection URL
DATABASE_URL="postgresql://postgres:password@localhost:5432/campusfix?schema=public"

# Optional: Google OAuth (leave empty if not using)
VITE_GOOGLE_CLIENT_ID=
```

**⚠️ SECURITY WARNING**: 
- Change `JWT_SECRET` to a strong random string in production
- Never commit `.env` to version control
- The example password is for local development only

### Step 4: Generate Prisma Client

Generate the Prisma client code from the schema:

```bash
npx prisma generate
```

This creates type-safe database client code in `node_modules/.prisma/client`.

### Step 5: Initialize Database

The embedded PostgreSQL server will automatically:
1. Start when you run the backend
2. Create the `campusfix` database
3. Initialize the data directory at `.pgdata/`

Push the Prisma schema to create tables:

```bash
npx prisma db push
```

**Output should confirm**: "Your database is now in sync with your Prisma schema."

### Step 6: Seed Initial Data (Optional but Recommended)

⚠️ **WARNING**: This command **deletes all existing data** before seeding.

```bash
node prisma/seed.js
```

**Seeded Test Accounts:**

| Role | Email | College ID | Password |
|------|-------|------------|----------|
| Reporter (Student) | alex.rivera@campus.edu | STU2024001 | student123! |
| Reporter (Faculty) | elena.rostova@campus.edu | FAC2024025 | faculty789# |
| Technician | m.vance.tech@campus.edu | TECH2024008 | infraOps99# |
| Technician | sarah.chen@campus.edu | TECH2024012 | fieldOps88$ |
| Administrator | admin@campus.edu | ADMIN001 | adminPass123! |

**Seeded Incidents:**
- INC-1082: Lab 304 Wi-Fi access point issue (In Progress, assigned to Marcus Vance)
- INC-1083: Server Rack 4 UPS battery warning (Assigned to Sarah Chen)
- INC-1084: Projector HDMI port flickering (Assigned to Sarah Chen)

### Step 7: Start the Application

The project uses **concurrently** to run both frontend and backend simultaneously:

```bash
npm run dev
```

This command:
1. Starts the Express API server on port **5000**
2. Starts the Vite dev server on port **5174** (or 5175 if 5174 is in use)
3. Automatically starts embedded PostgreSQL on port **5432**

**Expected Console Output:**
```
[API] [Server] Mounting API routes...
[API] [Server] ✓ /api/auth mounted
[API] [Server] ✓ /api/incidents mounted
[API] [Server] ✓ /api/tickets mounted
[API] [Server] ✓ /api/notifications mounted
[API] [Server] ✓ /api/analytics mounted
[API] [CampusFix API] Server running on http://localhost:5000
[API] [PostgreSQL] ✓ PostgreSQL server started successfully on port 5432
[VITE] ➜ Local: http://localhost:5174/
```

### Step 8: Access the Application

Open your browser and navigate to:

```
http://localhost:5174
```

You should see the CampusFix login screen.

**Quick Demo Buttons:**
- 🎓 **Student** - Login as Student Reporter
- 👨‍🏫 **Faculty** - Login as Faculty Reporter
- 🔧 **Tech** - Login as Technician
- 👔 **Admin** - Login as Administrator

Or login with any of the seeded accounts listed in Step 6.

---

## Environment Variables

### Backend Variables (Required)

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `PORT` | Express server port | No (default: 5000) | `5000` |
| `JWT_SECRET` | Secret key for signing JWT tokens | Yes | `your_random_secret_here` |
| `DATABASE_URL` | PostgreSQL connection string | Yes | `postgresql://postgres:password@localhost:5432/campusfix?schema=public` |

### Frontend Variables (Optional)

| Variable | Purpose | Required | Example |
|----------|---------|----------|---------|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID | No | `123456789-abc.apps.googleusercontent.com` |

**Notes:**
- Frontend variables must be prefixed with `VITE_` to be accessible in the React app
- Google OAuth is optional; users can register/login with email/password
- The Vite dev server automatically proxies `/api/*` requests to `http://localhost:5000`

### Sample .env File

```env
# Server Configuration
PORT=5000

# Authentication
JWT_SECRET=campusfix_production_secret_key_change_this_in_prod

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/campusfix?schema=public"

# Optional: Google OAuth
VITE_GOOGLE_CLIENT_ID=
```

---

## Usage Guide

### 1. Registration & Login

#### Registering a New Account
1. Click **"Create Campus Account"** on the login page
2. Fill in the registration form:
   - Full Name
   - College Email Address (must be unique)
   - Student/Staff ID (must be unique)
   - Password (minimum 8 characters)
   - Role: Student or Faculty/Staff
3. Click **"Register Campus Account"**
4. Upon success, you'll be automatically logged in

**Default Role**: All registered accounts start as "Reporter" role. Administrators must manually promote users to Technician or Administrator roles.

#### Logging In
1. Enter your College Email or Student ID
2. Enter your password
3. Optionally check **"Remember me"** to stay logged in
4. Click **"Sign In to CampusFix"**

Alternatively, use **Quick Demo** buttons for instant access to role-specific dashboards.

### 2. Reporting an Incident (Reporter Role)

1. Navigate to the Reporter Dashboard
2. Click **"Report Incident"** or the ➕ button
3. Fill in the incident form:
   - **Title**: Brief description (required)
   - **Category**: Network, Hardware, Software, Power, Classroom, Server
   - **Priority**: Low, Medium, High, Critical
   - **Building**: Campus building name (required)
   - **Floor**: Floor level
   - **Room**: Room number or area (required)
   - **Affected Service**: Service impacted by the issue
   - **Description**: Detailed problem description (required)
   - **Attachments**: Upload photos or documents (optional)
4. Click **"Submit Incident Report"**
5. System generates a unique ticket number (e.g., INC-1085)

**After Submission:**
- Incident appears in "My Incidents" list
- Notification sent to all Administrators
- If priority is "Critical", immediate alert sent to Technicians

### 3. Tracking Incident Status (Reporter Role)

**View Incident Details:**
1. Click on any incident in "My Incidents" table
2. See full details, current status, assigned technician
3. View activity timeline and comments

**Incident Statuses:**
- 🔵 **Open**: Newly reported, awaiting admin review
- 🟡 **Assigned**: Assigned to a technician
- 🟠 **In Progress**: Technician actively working on it
- 🟢 **Resolved**: Technician marked as fixed
- ✅ **Closed**: Reporter confirmed resolution

**Add Comments:**
- Click **"Add Comment"** in incident details
- Type your message or question
- Public comments visible to assigned technician

**Confirm Resolution:**
- When status is "Resolved", you'll see **"Confirm Resolution"** button
- Click to verify the issue is fixed
- Status changes to "Closed"

**Reopen Incident:**
- If issue persists after "Resolved", click **"Reopen Incident"**
- Provide a reason for reopening
- Status reverts to "Open" for reassignment

### 4. Technician Workflows

#### View Work Queues
The Technician Dashboard has multiple tabs:

- **Overview**: Summary stats and recent activity
- **Your Queue**: Incidents assigned specifically to you
- **Available Incidents**: Unassigned or open incidents you can claim
- **In Progress**: Your active work orders
- **Resolved**: Your completed work

#### Accept/Claim an Incident
1. Go to **"Available Incidents"** tab
2. Click on an unassigned incident
3. Click **"Accept Assignment"** or **"Claim This Work Order"**
4. Incident moves to your queue with status "Assigned"

#### Update Work Progress
1. Open an assigned incident from "Your Queue"
2. Click **"Update Status"** dropdown
3. Select new status:
   - **In Progress**: Started working on it
   - **Resolved**: Issue fixed
4. For "Resolved", optionally add resolution notes
5. Click **"Confirm Status Change"**

#### Add Diagnostic Notes
1. Open incident workspace
2. Click **"Add Investigation Note"** tab
3. Type technical details, findings, or actions taken
4. Toggle **"Internal Technician Note"** to hide from reporter
5. Click **"Post Note"**

**Note Visibility:**
- Public notes: Visible to reporter and admins
- Internal notes: Only visible to technicians and admins

#### Upload Technical Documentation
1. Open incident workspace
2. Scroll to **"Evidence & Attachments"** section
3. Click **"Choose Files"** or drag files
4. Add multiple images, PDFs, or documents
5. Click **"Upload Evidence"**

### 5. Administrator Operations

#### Dashboard Overview
The Admin Dashboard provides:
- Total/open/in-progress/resolved incident counts
- Recent incident ledger
- User activity statistics
- System health metrics

#### Manage Incidents
1. Go to **"All Incidents"** tab
2. Use filters: Status, Category, Priority, Search
3. Click on any incident to view details

**Admin Actions:**
- Assign/reassign technicians
- Change priority (Low → Critical)
- Override status changes
- Add admin notes
- Delete/close incidents

#### Assign Technician
1. Open incident details
2. Click **"Assign Technician"** button
3. Select technician from dropdown
4. Click **"Confirm Assignment"**
5. Notification sent to selected technician

**Reassign:**
- Use the same flow to change technician
- Previous technician notified of reassignment

#### User Management
1. Go to **"User Management"** tab
2. See all registered users
3. Click **"Edit"** next to a user
4. Change role: Reporter → Technician → Administrator
5. Change status: Active ↔ Suspended
6. Click **"Save Changes"**

**Create New User:**
- Click **"Create New User"**
- Fill in name, email, college ID, role, password
- Click **"Create User Account"**

#### Analytics & Reports
1. Go to **"Analytics & Reports"** tab
2. View visualizations:
   - Incidents over time (line chart)
   - Status distribution (donut chart)
   - Monthly trends (bar chart)
   - Technician workload (horizontal bars)
   - Affected services breakdown
3. Use filters: Time range, Building, Category, Priority
4. Export data (if implemented)

**Key Metrics:**
- Average resolution time
- Critical incident count
- Recurring issue clusters
- Building-wise incident distribution
- Technician performance comparison

### 6. Notifications

**Real-Time Updates:**
- 🔔 Bell icon shows unread notification count
- Click bell to open Notification Center
- Notifications for:
  - Incident status changes
  - New assignments
  - Comments on your incidents
  - Resolution confirmations
  - Critical incident alerts

**Managing Notifications:**
- Click on a notification to view related incident
- Mark individual notifications as read
- Click **"Mark All as Read"** to clear all
- Delete notifications individually

---

## Security

### Implemented Security Features

#### Authentication
- **JWT Token-Based**: Stateless authentication using JSON Web Tokens
- **Token Storage**: Stored in `localStorage` (Remember Me) or `sessionStorage` (Session only)
- **Token Expiration**: Configurable via JWT_SECRET and token payload
- **Secure Routes**: All API endpoints (except auth) require valid JWT

#### Password Security
- **Hashing**: Passwords hashed using bcryptjs with salt rounds
- **No Plain Text**: Passwords never stored in plain text
- **Minimum Length**: 8 characters minimum enforced
- **Password Reset**: Secure token-based reset flow with expiration

#### Authorization
- **Role-Based Access Control (RBAC)**: Enforced at API and UI levels
- **Middleware**: `authenticateToken` and `requireRole` middleware protect routes
- **Ownership Checks**: Users can only access their own data (incidents, notifications)
- **Admin Override**: Administrators have elevated permissions

#### Input Validation
- **Required Fields**: Server-side validation for all required fields
- **Email/ID Uniqueness**: Duplicate email and college ID prevented at database level
- **SQL Injection Protection**: Prisma ORM parameterizes all queries
- **XSS Prevention**: React automatically escapes rendered content

#### Error Handling
- **Generic Error Messages**: Authentication failures don't reveal if user exists
- **Stack Traces**: Hidden in production, shown only in development
- **Audit Logging**: All critical actions logged to `audit_logs` table
- **Rate Limiting**: Not yet implemented (see Future Enhancements)

#### CORS Configuration
- **CORS Enabled**: Allows frontend on different port to access API
- **Origin Validation**: Set to `true` (allow all) in development
- **Production**: Should restrict to specific frontend domain

#### Environment Variables
- **Sensitive Data**: JWT secrets, database credentials stored in `.env`
- **Git Ignored**: `.env` excluded from version control
- **Example Template**: `.env.example` provided without secrets

### Security Best Practices

**For Development:**
- Use strong JWT_SECRET (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
- Don't commit `.env` file
- Regularly update dependencies: `npm audit fix`

**For Production:**
- Use environment-specific `.env` files
- Enable HTTPS/TLS for all connections
- Restrict CORS to specific frontend origin
- Implement rate limiting on authentication endpoints
- Add input sanitization library (e.g., DOMPurify)
- Enable database connection pooling
- Set secure cookie flags if using cookies
- Implement session timeout and refresh tokens
- Add brute-force protection on login
- Enable database backups and disaster recovery

**Known Limitations:**
- No rate limiting on API endpoints
- No CSRF protection (stateless JWT approach)
- No email verification on registration
- File upload size not restricted
- No content-type validation on uploads

---

## Testing & Troubleshooting

### Verify Installation

**1. Check Node.js Version:**
```bash
node --version  # Should be 18.x or higher
npm --version   # Should be 9.x or higher
```

**2. Check Dependencies:**
```bash
npm list --depth=0
```
Should show all packages from `package.json` installed.

**3. Verify Backend is Running:**
```bash
curl http://localhost:5000/api/health
```
Expected response:
```json
{
  "status": "ok",
  "service": "CampusFix Infrastructure Incident Platform API",
  "version": "2.0.0",
  "database": "PostgreSQL",
  "timestamp": "2024-11-04T..."
}
```

**4. Verify Frontend is Running:**
Open `http://localhost:5174` in browser. Should see CampusFix login page.

**5. Check Database Connection:**
```bash
npx prisma studio
```
Opens Prisma Studio at `http://localhost:5555`. You should see all database tables.

### Common Issues & Solutions

#### Issue: "Port 5000 already in use"

**Cause**: Another application is using port 5000.

**Solution 1** - Change port in `.env`:
```env
PORT=5001
```
Then update `vite.config.js` proxy target to `http://localhost:5001`.

**Solution 2** - Kill process on port 5000 (Windows):
```powershell
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

#### Issue: "Prisma Client not generated"

**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
npx prisma generate
```

#### Issue: "Database tables not found"

**Error**: `Invalid prisma.incident.findMany()` invocation

**Solution**:
```bash
npx prisma db push
```
This creates all tables from the schema.

#### Issue: "Cannot connect to database"

**Check**:
1. Is PostgreSQL running? Look for `[PostgreSQL] ✓ PostgreSQL server started` in console
2. Is port 5432 available? Another PostgreSQL instance might be running
3. Check `.env` has correct `DATABASE_URL`

**Solution**:
```bash
# Stop any existing PostgreSQL
# Windows: Services → Stop "postgresql-x64-XX"

# Restart backend
npm run server
```

#### Issue: "Login fails with correct credentials"

**Check**:
1. Have you seeded the database? Test accounts won't exist otherwise
2. Browser console for errors (F12 → Console)
3. Network tab shows `/api/auth/login` returning 200 OK?

**Solution**:
```bash
# Reseed database (WARNING: deletes all data)
node prisma/seed.js
```

#### Issue: "Vite HMR connection error"

**Error**: WebSocket connection to `ws://localhost:5174/` failed

**Cause**: Vite dev server not running or port blocked.

**Solution**:
- Ensure `npm run dev` shows `[VITE] ➜ Local: http://localhost:5174/`
- Try different port in `vite.config.js`: `port: 5175`
- Check firewall isn't blocking the port

#### Issue: "API requests return 404 Not Found"

**Symptoms**: Frontend loads but API calls fail.

**Check**:
1. Backend console shows routes mounted:
   ```
   [Server] ✓ /api/auth mounted
   [Server] ✓ /api/incidents mounted
   ...
   ```
2. Browser DevTools → Network → Check request URL
3. Ensure proxy is configured in `vite.config.js`

**Solution**:
- Restart both frontend and backend: `npm run dev`
- Clear browser cache (Ctrl+Shift+Delete)

#### Issue: "Embedded PostgreSQL fails to start"

**Error**: `Failed to start PostgreSQL: lock file...`

**Cause**: PostgreSQL process didn't shut down cleanly.

**Solution (Windows)**:
```powershell
# Delete lock file
Remove-Item -Path ".pgdata\postmaster.pid" -Force

# Or delete entire .pgdata directory (WARNING: loses all data)
Remove-Item -Path ".pgdata" -Recurse -Force

# Restart backend
npm run dev
```

#### Issue: "CORS errors in browser console"

**Error**: `Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy`

**Cause**: Backend CORS not allowing frontend origin.

**Check**: `server/index.js` has:
```javascript
app.use(cors({
  origin: true,
  credentials: true,
}));
```

**Solution**: Restart backend after confirming CORS config.

### Development Tips

**Hot Module Replacement (HMR):**
- Frontend changes auto-reload via Vite HMR
- Backend changes require manual restart (Ctrl+C, then `npm run dev`)
- Database schema changes require `npx prisma generate` and restart

**Debugging:**
- Frontend: React DevTools browser extension
- Backend: Console logs in terminal
- Database: Prisma Studio (`npx prisma studio`)
- API: Browser DevTools Network tab
- Check `server/index.js` console logs show API routes mounted

**Reset Everything:**
```bash
# Stop all processes (Ctrl+C)

# Delete node_modules and reinstall
Remove-Item -Path "node_modules" -Recurse -Force
Remove-Item -Path ".pgdata" -Recurse -Force
npm install

# Regenerate Prisma client
npx prisma generate

# Recreate database
npx prisma db push

# Reseed data
node prisma/seed.js

# Restart
npm run dev
```

---

## Future Enhancements

The following features are **planned improvements** (not yet implemented):

### Security Enhancements
- Rate limiting on authentication and API endpoints
- CSRF token protection
- Email verification on registration
- Two-factor authentication (2FA)
- Password complexity requirements
- Session timeout and automatic logout
- IP-based access restrictions for admin accounts

### Functionality Improvements
- Email notifications (currently in-app only)
- SMS alerts for critical incidents
- File upload with virus scanning
- Incident escalation rules (SLA-based)
- Recurring incident pattern detection (basic version exists)
- Bulk incident operations (assign/close multiple)
- Incident templates for common issues
- Knowledge base articles linked to incidents
- SLA tracking dashboard with countdown timers

### Reporting & Analytics
- Export analytics to PDF/Excel
- Custom date range reporting
- Scheduled report generation
- Incident forecasting using historical data
- Technician performance rankings
- Building/department cost analysis
- Recurring issue root cause analysis

### User Experience
- Dark mode toggle
- Mobile app (React Native)
- Push notifications (web and mobile)
- Real-time chat between reporters and technicians
- Drag-and-drop file uploads
- Incident status tracking via public link (no login)
- Multi-language support (i18n)

### Integration
- Active Directory / LDAP authentication
- Google Calendar integration for scheduling
- Slack/Teams notification webhooks
- JIRA/ServiceNow sync
- REST API documentation (Swagger/OpenAPI)
- Webhook support for external systems

### Infrastructure
- Docker containerization
- CI/CD pipeline (GitHub Actions)
- Automated testing (Jest, Cypress)
- Production deployment guides (AWS, Azure, Heroku)
- Database backup automation
- Monitoring and alerting (Sentry, Datadog)
- Load balancing for high traffic

---


**Database Models Documented:** 11 tables
1. User (users)
2. Incident (tickets)
3. IncidentCategory (categories)
4. CampusLocation (locations)
5. CampusService (services)
6. IncidentComment (ticket_notes)
7. IncidentAttachment (ticket_attachments)
8. TechnicianAssignment (technician_assignments)
9. IncidentActivity (incident_activities)
10. Notification (notifications)
11. AuditLog (audit_logs)

**API Endpoints Documented:** 27 endpoints across 5 route files
- Authentication: 7 endpoints
- Incidents: 7 endpoints
- Tickets: 7 endpoints (alias routes)
- Notifications: 4 endpoints
- Analytics: 2 endpoints
- Health: 1 endpoint




---


---

**Note**: This README documents the actual implemented features and configuration of the CampusFix project as of November 2024. All commands, endpoints, and technical details have been verified against the codebase.
