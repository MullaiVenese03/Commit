# Commit

**Study Progress Tracker with Prerequisite Rules**

Commit is a full-stack study progress tracking platform designed for structured technical learning. The application models curriculums as a Directed Acyclic Graph (DAG) to enforce foundational prerequisite rules, log study sessions, validate study durations, compute calendar-accurate study streaks with midnight preservation, visualize annual study habits through an interactive 365-day activity heatmap, and track weekly study targets with role-based access control for learners and mentors.

This project is built and configured exclusively for **local execution** as part of the Cardinality technical assessment.

---

## Project Demonstration

A screen recording demonstrating the complete, locally running application:

🎬 **[Watch the Commit Project Demonstration](VIDEO_LINK_PLACEHOLDER)**

> [!NOTE]
> The demonstration video runs for under five minutes and shows the complete workflow running locally: learner authentication, goal curriculum inspection, locked topics with missing prerequisites, dynamic unlocking upon completing prerequisites, study session logging, progress analytics (study streaks, 365-day activity heatmap, weekly study target), cascading dependent re-locking, mentor cohort monitoring, and system settings administration.
>
> The video file will be placed in the [`demo/`](demo/) directory prior to final submission.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Core Features](#2-core-features)
3. [Technology Stack](#3-technology-stack)
4. [Architecture Overview](#4-architecture-overview)
5. [Database Design](#5-database-design)
6. [Prerequisite Engine](#6-prerequisite-engine)
7. [Authentication and Authorization](#7-authentication-and-authorization)
8. [Installation Requirements](#8-installation-requirements)
9. [Local Installation and Setup](#9-installation-and-local-setup)
10. [Environment Variables](#10-environment-variables)
11. [Running Locally](#11-running-locally)
12. [Development Demo Accounts](#12-development-demo-accounts)
13. [Automated Testing](#13-automated-testing)
14. [API Documentation](#14-api-documentation)
15. [Project Structure](#15-project-structure)
16. [Known Limitations](#16-known-limitations)

---

## 1. Project Overview

In self-directed technical education and curriculum tracking:

1. **Unordered Learning**: Students frequently attempt advanced milestones before acquiring foundational knowledge, leading to high cognitive load, frustration, and dropouts.
2. **Fragile Milestone Tracking**: Traditional progress trackers treat study goals as flat checklists without dependency graphs. This allows circular dependencies ($A \to B \to A$) or false completion claims where dependent topics are marked complete while their prerequisites remain unstudied.
3. **Cascading State Inconsistency**: When a foundational prerequisite is reopened for review, downstream milestones in conventional systems remain marked as completed, corrupting educational integrity.
4. **Timezone Shifts & Broken Streaks**: Standard UTC date implementations frequently register study sessions on incorrect calendar dates around midnight, unfairly penalizing learners with broken streaks.
5. **Absence of Role Separation**: Mentors lack dedicated observation tools to audit student pace, prerequisite adherence, and study habits without accidentally modifying or deleting student records.

Commit solves these challenges by combining strict graph validation algorithms, automated downstream cascading re-locking, nominal calendar-date math, and robust role-based access control.

---

## 2. Core Features

- **Learner and Mentor Roles**:
  - **Learners**: Manage learning goals, build topic curriculums with prerequisite rules, log study sessions, track progress percentages, maintain study streaks, visualize annual study habits on a 365-day activity heatmap, and set weekly study targets.
  - **Mentors**: Inspect cohort-wide student activity rosters, audit individual learner progress and prerequisites in read-only mode, and administer global system configuration limits.
- **Study Goal Management**:
  - Categorized learning objectives with titles, descriptions, and dynamic aggregate completion metrics.
- **Topic Management**:
  - Sequential curriculum milestones with dependency relationships governed by a Directed Acyclic Graph (DAG).
- **Prerequisite Dependency Management**:
  - Assign multiple prerequisite topics within the same goal. Topics evaluate prerequisite completion dynamically.
- **Circular Dependency Detection**:
  - 3-state Depth-First Search (DFS) validation rejecting self-dependencies ($A \to A$), duplicate edges, cross-goal links, and circular reference cycles ($A \to B \to A$ or $A \to B \to C \to A$).
- **Dynamic Topic Unlocking**:
  - Incomplete prerequisites produce an amber "Locked" state with explicit missing prerequisite tags; completing all prerequisites instantly unlocks downstream topics without page reloads.
- **Cascading Dependent Topic Re-locking**:
  - Reopening a completed topic recursively identifies all downstream completed topics via Breadth-First Search (BFS) and resets them to incomplete in a single atomic PostgreSQL transaction.
- **Study Session Logging**:
  - Time logging associated with specific topics and calendar dates with optional notes.
- **Configurable Study Duration Limits**:
  - Dynamic server-side validation enforcing that logged minutes fall strictly within global system boundaries (default: 5 to 480 minutes). Future study dates are strictly rejected.
- **Goal Progress Calculation**:
  - Deterministic progress computation at both individual goal and overall curriculum levels.
- **Study Time Analytics**:
  - Quantitative breakdowns of completed milestone ratios, total study hours, and subject-level velocity.
- **Study Streaks with Yesterday Preservation**:
  - Pure nominal calendar-day processing (`YYYY-MM-DD`) with zero UTC timezone drift. If no session is logged today, yesterday's streak is preserved as "At Risk" until midnight rollover. Longest streak is tracked across full learner history.
- **Activity Heatmap Matrix**:
  - 365-day GitHub-inspired annual grid covering 52 weeks (Monday start) with 5 discrete study intensity levels (Level 0: 0m, Level 1: 1–29m, Level 2: 30–59m, Level 3: 60–119m, Level 4: 120m+) and an active date inspector card.
- **Weekly Study Targets**:
  - Configurable weekly target per learner (default 600m / 10h; allowed range: 60m to 4,200m) evaluated within Monday 00:00:00 through Sunday 23:59:59 ISO week boundaries.
- **Mentor Learner Monitoring**:
  - Cohort roster displaying total hours, completion rates, active streaks, and full student curriculum inspection strictly in read-only mode.
- **Configurable System Settings**:
  - Mentor-only configuration of minimum/maximum session durations and maximum prerequisites per topic (default: 5).

---

## 3. Technology Stack

Commit is built with a modern, fully typed TypeScript stack:

| Layer | Technology | Version | Purpose |
|---|---|---|---|
| **Frontend Framework** | React | 19.3.1 | Component-driven user interface |
| **Frontend Language** | TypeScript | ~6.0.3 | Strict type safety and client domain models |
| **Frontend Bundler** | Vite | 8.3.6 | Local development server and production bundler |
| **Styling** | Tailwind CSS | 4.3.5 | Modern utility-first responsive styling |
| **Server State** | TanStack React Query | 5.107.1 | Declarative caching, mutation, and cache invalidation |
| **Routing** | React Router | 8.5.1 | Client-side routing with `ProtectedRoute` and `RoleRoute` |
| **Icons** | Lucide React | 1.70.0 | UI icons |
| **Backend Framework** | NestJS | 12.0.1 | Modular architecture, controllers, and dependency injection |
| **Backend Language** | TypeScript | 6.0.2 | Server-side type safety |
| **Database** | PostgreSQL | 15+ / 16+ | Local relational persistence (`commit_db`, `commit_test_db`) |
| **ORM & Driver** | Prisma ORM | 7.10.1 | Type-safe queries with `@prisma/adapter-pg` driver adapter |
| **Password Security** | Argon2id (`argon2`) | 0.45.2 | Salted memory-hard password hashing (`m=65536, t=3, p=4`) |
| **Authentication** | Passport JWT | 0.7.0 / 12.0.4 | Stateless HMAC-signed JWT access tokens |
| **Validation** | class-validator & Zod | 0.15.1 / 4.6.7 | Whitelisted request validation (backend DTOs and frontend forms) |
| **API Documentation** | Swagger OpenAPI | 12.1.1 | Auto-generated interactive API explorer (`/api/docs`) |
| **Backend Testing** | Jest & Supertest | 30.5.2 / 7.0.0 | Unit and isolated E2E HTTP integration testing |
| **Frontend Testing** | Vitest & Testing Library | 5.1.0 / 16.3.3 | Unit and component testing with `jsdom` |
| **Linters** | Oxlint & ESLint | 1.58.0 / 10.14.0 | Type-aware backend and frontend code quality checks |

---

## 4. Architecture Overview

Commit implements a clean client-server architecture with strict separation of concerns:

```text
React 19 Frontend (Vite :5173)  <--->  NestJS 12 REST API (:3000)  <--->  PostgreSQL 16 (:5432)
        │                                      │                                  │
  TanStack Query v5                  Passport JWT & Guards                @prisma/adapter-pg
  Tailwind CSS v4                    DAG Prerequisite Engine             Atomic Transactions
  Axios Interceptors                 Calendar-Date Math                  Isolated Test DB
```

### Frontend Architecture
- **App Layout & Navigation**: Role-aware navbar and sidebar displaying learner navigation (Dashboard, Goals, Sessions, Progress) or mentor navigation (Learners, Goals, Sessions, Settings).
- **Route Protection**:
  - `ProtectedRoute`: Verifies active JWT session; unauthenticated requests redirect to `/login`.
  - `RoleRoute`: Verifies role permissions; learners navigating to mentor routes or mentors navigating to learner mutation routes are redirected.
- **State Management**: TanStack React Query manages server state. Mutations (completing a topic, logging a session, updating settings) trigger deterministic cache invalidation (`invalidateQueries`) to instantly reflect changes without manual page refreshes.
- **API Communication**: Axios instance configured with base URL `http://localhost:3000/api/v1` with request interceptors attaching Bearer JWT tokens and response interceptors handling `401 Unauthorized`.

### Backend Architecture
- **Modular Domains**: Dedicated modules for `AuthModule`, `UsersModule`, `GoalsModule`, `TopicsModule`, `SessionsModule`, `ProgressModule`, `MentorModule`, `SettingsModule`, and `PrismaModule`.
- **Validation Pipe**: Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` strictly rejects unknown properties, preventing mass assignment and role escalation.
- **Database Access**: `PrismaService` utilizes the `@prisma/adapter-pg` driver adapter for connection pooling and transaction support.
- **Progress Calculation**: Pure nominal calendar-day processing (`YYYY-MM-DD`) prevents UTC timezone discrepancies around midnight.

For full architectural diagrams, module breakdowns, and sequence flows, see [docs/architecture.md](docs/architecture.md).

---

## 5. Database Design

The relational schema is defined in `backend/prisma/schema.prisma` and contains 6 models and 1 enum:

```mermaid
erDiagram
    USER ||--o{ GOAL : "creates"
    USER ||--o{ STUDY_SESSION : "logs"
    USER ||--o{ SYSTEM_SETTINGS : "updates"
    GOAL ||--o{ TOPIC : "contains"
    TOPIC ||--o{ TOPIC_PREREQUISITE : "requires"
    TOPIC ||--o{ TOPIC_PREREQUISITE : "unlocks"
    TOPIC ||--o{ STUDY_SESSION : "referenced by"

    USER {
        uuid id PK
        string name
        string email UK
        string passwordHash
        enum role "LEARNER | MENTOR"
        int weeklyStudyTargetMinutes "default 600"
        datetime createdAt
        datetime updatedAt
    }

    GOAL {
        uuid id PK
        uuid learnerId FK
        string title
        string description
        datetime createdAt
        datetime updatedAt
    }

    TOPIC {
        uuid id PK
        uuid goalId FK
        string title
        string description
        int position
        boolean isCompleted "default false"
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    TOPIC_PREREQUISITE {
        uuid id PK
        uuid topicId FK
        uuid prerequisiteTopicId FK
        datetime createdAt
    }

    STUDY_SESSION {
        uuid id PK
        uuid learnerId FK
        uuid topicId FK
        date studyDate
        int minutes
        string note
        datetime createdAt
    }

    SYSTEM_SETTINGS {
        string id PK "global"
        int minSessionMinutes "default 5"
        int maxSessionMinutes "default 480"
        int maxPrerequisitesPerTopic "default 5"
        uuid updatedById FK
        datetime updatedAt
    }
```

### Models Summary
1. **`User`**: Learner and mentor user accounts. Includes `weeklyStudyTargetMinutes` (default: 600m / 10h), representing a learner-level weekly commitment.
2. **`Goal`**: Learning objectives owned by learners. Cascades deletion to child topics.
3. **`Topic`**: Curriculum milestones categorized under specific goals. Tracks `position`, `isCompleted`, and `completedAt`.
4. **`TopicPrerequisite`**: Directed edges representing prerequisite dependencies. Unique constraint `[topicId, prerequisiteTopicId]` prevents duplicate links.
5. **`StudySession`**: Time records of learner study activity. Stores `studyDate` as `@db.Date` for nominal calendar math.
6. **`SystemSettings`**: Global singleton configuration (`id: "global"`), editable only by mentors.
- **`Role`** (Enum): `LEARNER`, `MENTOR`.

---

## 6. Prerequisite Engine

The prerequisite system enforces curriculum dependencies using graph-theoretic rules:

### Graph Invariants
1. **Intra-Goal Boundaries**: All prerequisite topics must belong to the exact same `goalId`. Cross-goal dependencies are rejected.
2. **No Self-Dependencies**: A topic cannot depend on itself ($A \to A$).
3. **No Duplicate Dependencies**: Redundant edges between the same two topics are rejected.
4. **Configurable Capacity**: Number of prerequisites cannot exceed `maxPrerequisitesPerTopic` (default: 5).

### 3-State DFS Cycle Detection
When creating or updating prerequisites, a 3-state Depth-First Search algorithm traverses the graph:
- `0 (UNVISITED)`: Node not yet evaluated.
- `1 (VISITING)`: Node currently in the active DFS recursion stack. Encountering a node in this state indicates a back-edge (cycle detected $\to$ `HTTP 400 Bad Request`).
- `2 (VISITED)`: Node and all descendants confirmed acyclic.

### Dynamic Unlocking
Topics are evaluated dynamically when fetched:
- If all prerequisites have `isCompleted: true`, the topic returns `isUnlocked: true`.
- If any prerequisite is incomplete, the topic returns `isUnlocked: false` along with an explicit `missingPrerequisites` list containing `{ id, title }`.

### Cascading Dependent Re-Locking
When a completed topic is reopened (`isCompleted: false`), downstream completed topics that depend upon it are automatically reset:
- Breadth-First Search (BFS) traverses downstream along `prerequisiteTopicId -> topicId` edges.
- All downstream completed topics are identified.
- An atomic PostgreSQL transaction resets `isCompleted: false` and `completedAt: null` across all identified descendants.

---

## 7. Authentication and Authorization

### Password Security & Tokens
- Passwords hashed using **Argon2id** (`argon2.argon2id`, memory cost 64 MB, 3 iterations, 4 parallelism).
- JWT access tokens signed with `JWT_SECRET` (validated at startup to be $\ge 16$ characters).
- Token payload contains `{ sub: userId, email, role }` with configurable expiry (`JWT_EXPIRES_IN`).

### Role-Based Access Control (RBAC)
- **Learners**:
  - Full CRUD on owned goals, topics, and study sessions.
  - Can update own weekly study target (`PATCH /api/v1/progress/weekly-target`).
  - Cross-learner queries rejected with `HTTP 403 Forbidden`.
  - Mutating system settings rejected with `HTTP 403 Forbidden`.
- **Mentors**:
  - Cohort-wide read access to student rosters, goals, sessions, and analytics.
  - Read-only inspection of learner weekly targets and heatmaps.
  - Mutation of learner records (goals, topics, sessions, targets) rejected with `HTTP 403 Forbidden`.
  - Exclusively authorized to modify global system settings (`PATCH /api/v1/settings`).

### Role Escalation Prevention
- `RegisterDto` strictly forbids `role` input (`whitelist: true`, `forbidNonWhitelisted: true`). Registration defaults to `LEARNER`.
- `UpdateUserDto` strictly forbids updating `role` or `email`.

---

## 8. Installation Requirements

Verify that your local machine has the following software installed:

- **Node.js**: v20.x or higher (LTS recommended; tested on Node 20, 22, and 26).
- **npm**: v10.x or higher.
- **PostgreSQL**: v15.x or v16+ running locally on port `5432`.
- **Git**: Installed and available in your terminal path.

---

## 9. Local Installation and Setup

Follow these clean-machine steps to set up the project locally:

### Step 1: Clone Repository
```bash
git clone https://github.com/MullaiVenese03/Commit.git
cd Commit
```

### Step 2: Install Backend Dependencies
```bash
npm --prefix backend install
```

### Step 3: Install Frontend Dependencies
```bash
npm --prefix frontend install
```

### Step 4: Create Local PostgreSQL Databases
Connect to your local PostgreSQL instance and create the development and test databases:
```bash
psql -U postgres -c "CREATE DATABASE commit_db;"
psql -U postgres -c "CREATE DATABASE commit_test_db;"
```

### Step 5: Configure Backend Environment Variables
Copy the backend example environment file to `backend/.env`:
```bash
# Windows PowerShell
Copy-Item backend\.env.example backend\.env

# Linux / macOS
cp backend/.env.example backend/.env
```
Ensure `backend/.env` points to your local PostgreSQL instance:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/commit_db"
PORT=3000
NODE_ENV=development
JWT_SECRET=super-secret-commit-jwt-key-2026-secure
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

Also configure `backend/.env.test` for running isolated E2E tests:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/commit_test_db"
PORT=3001
NODE_ENV=test
JWT_SECRET=super-secret-commit-jwt-key-2026-secure
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Step 6: Configure Frontend Environment Variables
Copy the frontend example environment file to `frontend/.env`:
```bash
# Windows PowerShell
Copy-Item frontend\.env.example frontend\.env

# Linux / macOS
cp frontend/.env.example frontend/.env
```
Ensure `frontend/.env` points to the local backend API:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Step 7: Generate Prisma Client
```bash
npx --prefix backend prisma generate
```

### Step 8: Apply Database Migrations
```bash
# Apply schema migrations to the development database
npx --prefix backend prisma migrate deploy
```

For the isolated test database:
```bash
# Apply schema to the test database
powershell -Command "$env:DATABASE_URL='postgresql://postgres:postgres@localhost:5432/commit_test_db'; npx --prefix backend prisma db push"
```

### Step 9: Seed Development Data
```bash
# Safely populate baseline demo accounts, curriculums, and study sessions
npm --prefix backend run seed

# Run the automated seed verification audit
npm --prefix backend run seed:verify
```

---

## 10. Environment Variables

### Backend Configuration (`backend/.env`)

| Variable | Required | Default / Safe Placeholder | Purpose |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | `postgresql://postgres:postgres@localhost:5432/commit_db` | Connection string to local PostgreSQL development database |
| `PORT` | No | `3000` | HTTP port for the NestJS server |
| `NODE_ENV` | **Yes** | `development` | Application mode (`development`, `test`, `production`) |
| `JWT_SECRET` | **Yes** | `super-secret-commit-jwt-key-2026-secure` | HMAC secret for signing JWTs (must be at least 16 characters) |
| `JWT_EXPIRES_IN` | No | `7d` | Expiration window for JWT access tokens |
| `FRONTEND_URL` | **Yes** | `http://localhost:5173` | Allowed CORS origin for the frontend application |

### Frontend Configuration (`frontend/.env`)

| Variable | Required | Default / Safe Placeholder | Purpose |
|---|---|---|---|
| `VITE_API_URL` | **Yes** | `http://localhost:3000/api/v1` | Base URL of the backend REST API |

---

## 11. Running Locally

Run the backend and frontend in two separate terminal windows:

### Terminal 1: Backend API
```bash
npm --prefix backend run start:dev
```
- **REST API Base URL**: `http://localhost:3000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:3000/api/docs`

### Terminal 2: Frontend Web Application
```bash
npm --prefix frontend run dev
```
- **Web Application URL**: `http://localhost:5173`

> [!IMPORTANT]
> Open **`http://localhost:5173`** in your web browser to use the application.

---

## 12. Development Demo Accounts

The database seed provides verified demo accounts for assessment testing:

| Role | Name | Email | Password (Development Only) | Stored Hash Type |
|---|---|---|---|---|
| **Learner 1** | Alex Mercer | `alex.mercer@commit.dev` | `Learner123!Pass` | Argon2id (`$argon2id$...`) |
| **Learner 2** | Samantha Reed | `samantha.reed@commit.dev` | `Learner456!Pass` | Argon2id (`$argon2id$...`) |
| **Mentor** | Dr. Marcus Vance | `marcus.vance@commit.dev` | `Mentor789!Pass` | Argon2id (`$argon2id$...`) |

> [!NOTE]
> All credentials above are strictly for local development and assessment demonstration. All passwords are stored in the database as salted Argon2id hashes and are never returned in API payloads.

---

## 13. Automated Testing

The Commit codebase includes **361 automated tests** with a 100% pass rate across backend and frontend suites.

### Automated Test Summary

| Test Layer | Framework | Suites | Tests | Passed | Failed | Duration | Pass Rate |
|---|---|---|---|---|---|---|---|
| **Backend Unit Tests** | Jest (`ts-jest`) | 12 suites | 143 | 143 | 0 | ~6.0s | **100%** |
| **Backend E2E Tests** | Jest + Supertest | 4 suites | 98 | 98 | 0 | ~10.5s | **100%** |
| **Frontend Unit & UI Tests** | Vitest + React Testing Library | 12 suites | 120 | 120 | 0 | ~10.3s | **100%** |
| **Total Automated Tests** | | **28 suites** | **361** | **361** | **0** | | **100%** |

### Execution Commands

```bash
# 1. Run backend unit tests
npm --prefix backend run test

# 2. Run backend end-to-end tests (requires local PostgreSQL commit_test_db)
npm --prefix backend run test:e2e

# 3. Run frontend unit and UI component tests
npm --prefix frontend test

# 4. Validate Prisma database schema
powershell -Command "Set-Location backend; npx prisma validate"

# 5. Run backend linter (Oxlint)
npm --prefix backend run lint

# 6. Run frontend linter (ESLint)
npm --prefix frontend run lint

# 7. Verify backend production build
npm --prefix backend run build

# 8. Verify frontend production build
npm --prefix frontend run build
```

---

## 14. API Documentation

Commit provides interactive OpenAPI / Swagger documentation generated directly from NestJS controllers and DTOs:

- **Swagger UI**: `http://localhost:3000/api/docs`
- **Swagger JSON Specification**: `http://localhost:3000/api/docs-json`
- **API Prefix**: All REST endpoints are versioned under `/api/v1/*`

Features documented in Swagger include:
- `auth`: User registration, login, and profile retrieval.
- `goals`: Curriculum goal creation, retrieval, updating, and deletion.
- `topics`: Milestone management, ordering, completion toggling, and prerequisite assignment.
- `sessions`: Study session logging and filtering by goal, topic, and date range.
- `progress`: Overall progress percentage, study streaks, 365-day heatmap data, and weekly study targets.
- `mentor`: Cohort roster, student progress inspection, and learner detail audits.
- `settings`: Global system settings administration (min/max durations and prerequisite capacity).

---

## 15. Project Structure

```text
Commit/
├── README.md                           # Root project documentation
├── .gitignore                          # Git ignore rules
│
├── demo/                               # Assessment demonstration video directory
│   └── README.md                       # Video placement and file size guidelines
│
├── docs/                               # Assessment technical documentation
│   └── architecture.md                 # Full technical architecture and system design
│
├── backend/                            # NestJS 12 modular REST API
│   ├── prisma/
│   │   ├── migrations/                 # PostgreSQL schema migrations
│   │   ├── schema.prisma               # Prisma data models and relationships
│   │   ├── seed.ts                     # Deterministic demo data seed script
│   │   ├── verify-seed.ts              # Automated seed integrity verification audit
│   │   └── reset-dev.ts                # Confirmed development-only database reset utility
│   ├── src/
│   │   ├── auth/                       # JWT authentication, Argon2id, login/register
│   │   ├── common/                     # RBAC decorators and guards (RolesGuard)
│   │   ├── config/                     # Environment configuration and class-validator schemas
│   │   ├── generated/prisma/           # Generated Prisma Client
│   │   ├── goals/                      # Goal CRUD and ownership verification
│   │   ├── mentor/                     # Mentor cohort oversight and student audits
│   │   ├── prisma/                     # PrismaService with @prisma/adapter-pg
│   │   ├── progress/                   # Streaks, heatmaps, weekly targets, calculations
│   │   ├── sessions/                   # Session logging and duration validation
│   │   ├── settings/                   # Global system constraints administration
│   │   ├── topics/                     # DAG prerequisite engine, cycle detection, re-lock
│   │   ├── users/                      # User profiles and password hashing
│   │   ├── app.module.ts               # Root NestJS module
│   │   └── main.ts                     # Server bootstrap, CORS, validation pipe, Swagger
│   ├── test/                           # End-to-end integration test suites
│   ├── package.json                    # Backend dependencies and scripts
│   ├── prisma7.config.ts               # Prisma 7 configuration file
│   └── tsconfig.json                   # Backend TypeScript compiler configuration
│
└── frontend/                           # React 19 + Vite Single Page Application
    ├── public/                         # Static icons, favicon, branding assets
    ├── src/
    │   ├── app/                        # Providers and route protection (ProtectedRoute, RoleRoute)
    │   ├── components/                 # Shared UI primitives (Button, Modal, Card, DatePicker, etc.)
    │   ├── features/
    │   │   ├── auth/                   # Login and registration forms
    │   │   ├── dashboard/              # Learner dashboard, summary metrics
    │   │   ├── goals/                  # Goal list and detail views
    │   │   ├── mentor/                 # Mentor cohort dashboard and learner audits
    │   │   ├── progress/               # Heatmap, streak cards, weekly target modal
    │   │   ├── sessions/               # Study session table and log modal
    │   │   ├── settings/               # System settings administration
    │   │   └── topics/                 # Topic cards, prerequisite badges, modals
    │   ├── hooks/                      # TanStack React Query custom hooks
    │   ├── services/                   # Axios API clients
    │   ├── types/                      # TypeScript domain models and DTO interfaces
    │   ├── utils/                      # Nominal date formatters, Zod schemas, storage
    │   ├── App.tsx                     # Top-level application router
    │   └── main.tsx                    # React DOM root entry point
    ├── test/                           # Vitest component and unit test suites
    ├── package.json                    # Frontend dependencies and scripts
    ├── vite.config.ts                  # Vite and Vitest configuration
    └── tsconfig.json                   # Frontend TypeScript compiler configuration
```

---

## 16. Known Limitations

- **Local-Only Execution**: The application is configured exclusively for local execution on `localhost:3000` (backend) and `localhost:5173` (frontend); cloud deployment configurations have been intentionally removed.
- **Single System Settings Record**: Global system settings (`id: "global"`) are shared across the system rather than scoped per cohort.
- **PostgreSQL Requirement**: Requires a local PostgreSQL server listening on port `5432` with active `commit_db` and `commit_test_db` databases.
- **Demonstration Video Placeholder**: The video link placeholder `VIDEO_LINK_PLACEHOLDER` in this README will be updated with the actual recording URL prior to final assessment review.
