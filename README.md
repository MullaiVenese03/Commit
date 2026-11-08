# Commit - Study Progress Tracker with Prerequisite Rules

Full-stack assessment project for the Cardinality Study Progress Tracker platform.

Commit is designed to track learner study sessions against structured goals and topics, enforcing prerequisite dependencies and logging session metrics across multi-week periods.

---

## Current Project Status

- **Phase 0 (Environment Audit & Hardening)**: Completed.
- **Phase 1 (Database Seeding & Verification)**: Completed and verified.
- **Phase 2 (Authentication & Authorization)**: Completed and verified.
- **Phase 3 (Core Business Logic & Graph Integrity)**: Completed and verified.
- **Phase 4 (API Endpoints & Validation)**: Completed and verified.
- **Phase 5 (Frontend Implementation & UX Polish)**: Completed and verified.
- **Phase 6 (Automated Testing & Security Verification)**: All 171 automated tests passed across backend unit, E2E, and frontend test suites.
- **Phase 6.1 (Independent Testing, Security & Coverage Audit)**: Completed. Verified 100% test pass rate (171/171), test database isolation, dependency audit (zero production vulnerabilities), and asset optimizations.

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, TanStack React Query v5, Lucide Icons
- **Frontend Testing**: Vitest, React Testing Library, jsdom, `@testing-library/jest-dom`, `@vitest/coverage-v8`
- **Backend**: NestJS 12, TypeScript, CommonJS, Swagger OpenAPI
- **Backend Testing**: Jest, Supertest, ts-jest
- **Database**: PostgreSQL 16+ (`commit_db` development, `commit_test_db` isolated automated testing)
- **ORM**: Prisma 7.10.1 with `@prisma/adapter-pg` driver adapter
- **Password Security**: Argon2id (`argon2`)
- **Validation**: Zod (frontend), class-validator / class-transformer (backend)
- **Tooling & Linters**: Oxlint (backend), ESLint (frontend)

---

## Project Structure

```text
Commit/
├── backend/
│   ├── prisma/
│   │   ├── migrations/            # Applied PostgreSQL database migrations
│   │   ├── schema.prisma          # Prisma schema (6 models, 1 enum)
│   │   ├── seed.ts                # Deterministic seed script (demo accounts & curriculum)
│   │   └── verify-seed.ts         # Automated seed verification audit script
│   ├── src/
│   │   ├── auth/                  # Authentication, Argon2id hashing, JWT strategies & guards
│   │   ├── common/                # Shared filters, decorators, and validation pipes
│   │   ├── config/                # Environment configuration and validation
│   │   ├── generated/prisma/      # Generated Prisma client
│   │   ├── goals/                 # Goal creation, ownership, and management
│   │   ├── mentor/                # Mentor learner progress inspection endpoints
│   │   ├── prisma/                # PrismaModule and PrismaService integration
│   │   ├── progress/              # Progress metrics and study analytics
│   │   ├── sessions/              # Study session logging and filtering
│   │   ├── settings/              # System settings (min/max duration, max prerequisites)
│   │   ├── topics/                # Topics, DAG prerequisite engine, cycle detection & re-locking
│   │   ├── users/                 # User profile management
│   │   ├── app.module.ts          # Root application module
│   │   └── main.ts                # NestJS bootstrap entrypoint (CORS, Swagger, validation)
│   ├── test/
│   │   ├── auth-and-rbac.e2e-spec.ts              # E2E test suite: Auth, RBAC, learner isolation
│   │   ├── topics-and-prerequisites.e2e-spec.ts   # E2E test suite: Goals, DAG, cycles, sessions
│   │   ├── jest-e2e.json                          # Supertest Jest configuration
│   │   └── setup-e2e.ts                           # Test database environment loader (.env.test)
│   ├── prisma7.config.ts          # Prisma 7 configuration file
│   └── package.json               # Backend dependencies and execution scripts
├── frontend/
│   ├── public/
│   │   ├── branding/
│   │   │   └── commit-logo.png    # Original full-resolution Commit brand logo
│   │   ├── apple-touch-icon.png   # Optimized square 180x180 touch icon
│   │   ├── favicon.png            # Optimized square 64x64 favicon
│   │   └── icons.svg              # SVG sprite assets
│   ├── src/
│   │   ├── app/                   # App layout, providers, and protected router guards
│   │   ├── components/            # Reusable UI primitives (Button, Modal, Card, Input, etc.)
│   │   ├── features/
│   │   │   ├── auth/              # Login, registration, and AuthContext
│   │   │   ├── dashboard/         # Learner dashboard, activity charts, stat cards
│   │   │   ├── goals/             # Goal list, creation modal, and detail views
│   │   │   ├── mentor/            # Mentor dashboard, learner directory, and progress views
│   │   │   ├── progress/          # Curriculum progress visualization
│   │   │   ├── sessions/          # Session logging modal, filter controls, history tables
│   │   │   ├── settings/          # System settings administration
│   │   │   └── topics/            # Topic cards, prerequisite badges, reorder modal
│   │   ├── hooks/                 # TanStack React Query data fetching hooks
│   │   ├── services/              # Axios HTTP API client services
│   │   ├── utils/                 # Formatters, local storage, and Zod validation schemas
│   │   └── main.tsx               # React application entrypoint
│   ├── test/
│   │   ├── components/            # Vitest + React Testing Library component test suites
│   │   ├── formatters.test.ts     # Formatting utility tests
│   │   ├── setup.ts               # Vitest environment setup
│   │   ├── storage.test.ts        # Storage utility tests
│   │   └── validation.test.ts     # Zod schema validation tests
│   ├── eslint.config.js           # ESLint configuration
│   ├── index.html                 # Single Page Application HTML shell
│   ├── vite.config.ts             # Vite & Vitest configuration
│   └── package.json               # Frontend dependencies and execution scripts
└── README.md                      # Comprehensive project documentation
```

---

## Database Architecture & Models

The database schema is defined in [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma) and consists of 6 models and 1 enum:

1. **`User`**: Learner and mentor user accounts.
   - Fields: `id` (UUID), `name`, `email` (unique), `passwordHash` (Argon2id), `role` (`Role`), timestamps.
2. **`Goal`**: Learning objectives owned by learners.
   - Fields: `id` (UUID), `learnerId` (FK to `User`), `title`, `description`, timestamps.
3. **`Topic`**: Study topics categorized under specific goals.
   - Fields: `id` (UUID), `goalId` (FK to `Goal`), `title`, `description`, `position`, `isCompleted`, `completedAt`, timestamps.
4. **`TopicPrerequisite`**: Directed prerequisite relationships between topics within the same goal.
   - Fields: `id` (UUID), `topicId` (FK to `Topic`), `prerequisiteTopicId` (FK to `Topic`), `createdAt`.
   - Unique constraint: `[topicId, prerequisiteTopicId]`.
5. **`StudySession`**: Time logs of learner study activity.
   - Fields: `id` (UUID), `learnerId` (FK to `User`), `topicId` (FK to `Topic`), `studyDate` (Date), `minutes` (Int), `note`, `createdAt`.
6. **`SystemSettings`**: Global system configuration singleton (`id: "global"`).
   - Fields: `minSessionMinutes` (default: 5), `maxSessionMinutes` (default: 480), `maxPrerequisitesPerTopic` (default: 5), `updatedById` (FK to `User`), `updatedAt`.
- **`Role`** (Enum): `LEARNER`, `MENTOR`.

---

## Fresh-Clone Setup Instructions

Follow these step-by-step instructions to set up, configure, migrate, seed, and run the complete Commit application on a fresh machine.

### 1. Prerequisites

Ensure the following tools are installed on your workstation:
- **Node.js**: v20.x or higher
- **npm**: v10.x or higher
- **PostgreSQL**: v15.x or v16+ (running on `localhost:5432`)
- **Git**

### 2. Clone Repository & Install Dependencies

```bash
# Clone the repository
git clone <repository-url>
cd Commit

# Install backend dependencies
npm --prefix backend install

# Install frontend dependencies
npm --prefix frontend install
```

### 3. Environment Configuration

Create the environment files from their provided examples:

#### Backend Development Environment (`backend/.env`)
Copy [`backend/.env.example`](backend/.env.example) to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```
Ensure the values match your local PostgreSQL credentials:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/commit_db"
PORT=3000
NODE_ENV=development
JWT_SECRET=replace-with-a-random-secret-of-at-least-16-characters
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

#### Backend Test Environment (`backend/.env.test`)
For running isolated E2E tests, create `backend/.env.test`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/commit_test_db"
PORT=3001
NODE_ENV=test
JWT_SECRET=test-e2e-dummy-jwt-secret-at-least-16-characters
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

#### Frontend Environment (`frontend/.env`)
Copy [`frontend/.env.example`](frontend/.env.example) to `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 4. Database Creation & Migrations

Create the PostgreSQL databases for development and testing:

```bash
# Connect to PostgreSQL and create the databases
psql -U postgres -c "CREATE DATABASE commit_db;"
psql -U postgres -c "CREATE DATABASE commit_test_db;"
```

Apply database migrations and generate the Prisma client:

```bash
# Generate the Prisma client
npx --prefix backend prisma generate

# Apply migrations to the development database
npx --prefix backend prisma migrate deploy
```

For the test database (used by E2E suites):
```bash
# Apply schema to the test database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/commit_test_db" npx --prefix backend prisma db push
```

### 5. Database Seeding

Populate the development database with deterministic baseline accounts, goals, topics, prerequisites, and study sessions:

```bash
# Run the seed script
npm --prefix backend run seed

# Run the automated seed integrity verification audit
npm --prefix backend run seed:verify
```

### 6. Start the Development Servers

Open two terminal sessions to run both services concurrently:

#### Terminal 1 — Backend API
```bash
npm --prefix backend run start:dev
```
- API Base URL: `http://localhost:3000/api/v1`
- Interactive Swagger OpenAPI Docs: `http://localhost:3000/api/docs`

#### Terminal 2 — Frontend Application
```bash
npm --prefix frontend run dev
```
- Web Application: `http://localhost:5173`

---

## Automated Testing & Security Verification

Automated testing covers unit, integration, end-to-end, and UI component layers across the NestJS backend and React frontend.

### Test Execution & Pass Rate

All 171 automated tests pass with zero failures:

| Test Layer | Test Runner | Files / Suites | Tests Executed | Passed | Failed | Duration | Pass Rate |
|---|---|---|---|---|---|---|---|
| **Backend Unit Tests** | Jest (`ts-jest`) | 8 suites | 56 | 56 | 0 | ~6.4s | **100%** |
| **Backend E2E Tests** | Jest + Supertest | 2 suites | 54 | 54 | 0 | ~6.2s | **100%** |
| **Frontend Unit & Component Tests** | Vitest + RTL | 10 suites | 61 | 61 | 0 | ~9.6s | **100%** |
| **Total Automated Tests** | | **20 suites** | **171** | **171** | **0** | | **100%** |

### Code Coverage Metrics

> [!NOTE]
> Code coverage represents the percentage of code statements, branches, functions, and lines executed during test runs. It is distinct from the 100% test pass rate shown above.

#### Backend Unit Test Coverage (Jest Clover Report)

| Metric | Overall Backend Unit | `SettingsService` | `TopicsService` | `SessionsService` | `AuthService` |
|---|---|---|---|---|---|
| **Statements** | **36.94%** (331 / 896) | 92.85% (26 / 28) | 69.87% (109 / 156) | 58.75% (47 / 80) | 48.38% (30 / 62) |
| **Branches** | **30.34%** (189 / 623) | 70.00% (7 / 10) | 61.22% (30 / 49) | 55.00% (22 / 40) | 40.00% (10 / 25) |
| **Functions** | **33.58%** (45 / 134) | 100.00% (4 / 4) | 72.72% (8 / 11) | 66.66% (4 / 6) | 60.00% (3 / 5) |
| **Lines** | **36.94%** (331 / 896) | 92.85% (26 / 28) | 69.87% (109 / 156) | 58.75% (47 / 80) | 48.38% (30 / 62) |

*Note: Backend controllers, HTTP status codes, guards, and database transactions are extensively covered by the 54 tests in the Supertest End-to-End suite.*

#### Frontend Test Coverage (Vitest v8 Report)

| Metric | Overall Frontend | Router Guards | UI Primitives | Validation & Utils | `Sidebar` | `LoginForm` | `GoalCard` |
|---|---|---|---|---|---|---|---|
| **Statements** | **55.22%** (1501 / 2718) | 100% | 100% | 100% | 91.30% | 94.44% | 83.33% |
| **Branches** | **63.87%** (297 / 465) | 100% | 100% | 100% | 88.88% | 88.88% | 75.00% |
| **Functions** | **41.20%** (68 / 165) | 100% | 100% | 100% | 100% | 100% | 75.00% |
| **Lines** | **55.38%** (1492 / 2694) | 100% | 100% | 100% | 100% | 94.44% | 83.33% |

---

## Detailed Test Suite Coverage

### Backend Unit & E2E Suites

1. **Authentication & Role-Based Access Control**:
   - Valid credentials return signed JWT token and user profile omitting `passwordHash`.
   - Invalid passwords rejected with HTTP 401 Unauthorized (`Invalid email or password`).
   - Passwords hashed using salted Argon2id (`$argon2id$`).
   - Protected endpoints require Bearer JWT token; missing/invalid tokens return HTTP 401.
   - Learner vs. mentor role separation: learners cannot mutate system settings (HTTP 403 Forbidden); mentors cannot create/edit learner study records.
2. **Goal Management**:
   - Learner creates, retrieves, and deletes goals.
   - Ownership boundaries strictly enforced: cross-learner goal access returns HTTP 403 Forbidden.
   - Mentors have read-only visibility into learner goals and curriculum progression.
3. **Topic Prerequisite Graph (DAG) & Dynamic Validation**:
   - **Self-Dependency Rejection**: Rejects a topic depending on itself (HTTP 400 Bad Request).
   - **Direct Cycle Rejection**: Rejects 2-node cycles ($A \to B \to A$).
   - **Indirect Cycle Rejection**: Traverses transitive dependencies using BFS to reject multi-node cycles ($A \to B \to C \to A$).
   - **Missing Prerequisites Reporting**: Dynamically returns `isUnlocked: false` and lists missing prerequisite titles.
   - **Dynamic Unlocking**: Recomputes `isUnlocked: true` when all prerequisites are complete.
   - **Cascading Dependent Re-Locking**: Reverting a completed prerequisite topic automatically cascades downstream to reset and re-lock dependent topics.
   - **Maximum Prerequisite Limit**: Dynamically enforces `maxPrerequisitesPerTopic` from `SystemSettings`.
4. **Study Session Logging**:
   - Session duration validated dynamically against `minSessionMinutes` and `maxSessionMinutes`.
   - Sessions with future dates are strictly rejected.
   - Ownership verification: logging a session against another learner's topic returns HTTP 403.
5. **System Settings**:
   - Mentors can update system settings; learners are forbidden (HTTP 403).
   - Updated setting values immediately gate subsequent session log validations without restarts.

### Frontend Component Suites (Vitest + RTL)

1. **`LoginForm.test.tsx`**: Validates email format, disables submission on invalid inputs, submits valid credentials, and renders error alerts.
2. **`ProtectedRoute.test.tsx`**: Tests session loading spinner, unauthorized redirection to `/login`, and protected route rendering.
3. **`RoleRoute.test.tsx`**: Restricts learner access from mentor routes and mentor access from learner routes.
4. **`Sidebar.test.tsx`**: Verifies role-specific navigation menus (learner sees study views; mentor sees cohort management).
5. **`GoalCard.test.tsx`**: Tests progress percentage calculation, status badges, target hours, and mentor attribution labels.
6. **`TopicCard.test.tsx`**: Tests locked/unlocked visual badges, missing prerequisite notices, completion buttons, and study modal triggers.
7. **`UIComponents.test.tsx`**: Verifies `Button`, `Alert`, `Badge`, `Input`, `ProgressBar`, `RoleBadge`, and `EmptyState` component behavior.
8. **`validation.test.ts` & `formatters.test.ts`**: Verifies Zod schemas, minute formatting, and storage recovery.

---

## Test Execution Commands

```bash
# Run backend unit tests
npm --prefix backend run test

# Run backend end-to-end tests (requires PostgreSQL running commit_test_db)
npm --prefix backend run test:e2e

# Run backend unit test coverage
npm --prefix backend run test:cov

# Run frontend unit and component tests
npm --prefix frontend test

# Run frontend tests in watch mode
npm --prefix frontend run test:watch

# Run frontend test coverage
npm --prefix frontend run test:cov
```

---

## Build & Lint Verification Commands

```bash
# Compile the NestJS backend
npm --prefix backend run build

# Compile the React frontend
npm --prefix frontend run build

# Backend static analysis and type-aware linting (Oxlint)
npm --prefix backend run lint

# Frontend static analysis and linting (ESLint)
npm --prefix frontend run lint
```

---

## Security Verification Checklist

- [x] **Zero Password Hash Exposure**: Verified across `/auth/register`, `/auth/login`, `/auth/me`, and user profile endpoints.
- [x] **Argon2id Hashing**: Passwords stored as Argon2id hashes with memory cost 65,536 KiB, 3 iterations, and parallelism 4.
- [x] **Strict Data Ownership**: Learners cannot read or mutate goals, topics, or sessions belonging to other learners.
- [x] **Role Guards & Boundary Enforcement**: Learners cannot modify system settings; mentors cannot alter learner study records.
- [x] **Input Validation & Body Sanitization**: Global `ValidationPipe` with `whitelist: true` and `forbidNonWhitelisted: true` rejects unknown fields.
- [x] **Directed Acyclic Graph (DAG) Enforcement**: BFS cycle detection prevents self-dependencies, 2-node cycles, and indirect transitive cycles.
- [x] **Zero Production Secrets in Bundles**: Production frontend build verified free of hardcoded API keys, JWT secrets, and credentials.
- [x] **Dependency Safety**: Zero vulnerabilities detected in production dependencies across both backend and frontend.

---

## Demo Credentials (DEVELOPMENT ONLY)

> [!WARNING]
> **DEVELOPMENT ONLY**: The credentials below are strictly for local development and testing. Never use these credentials in staging or production environments. Plaintext passwords are not stored in the database; all passwords are hashed using Argon2id.

| Role | Name | Email | Password (Development Only) | Stored Hash Type |
|---|---|---|---|---|
| **Learner** | Alex Mercer | `alex.mercer@commit.dev` | `Learner123!Pass` | Argon2id (`$argon2id$...`) |
| **Learner** | Samantha Reed | `samantha.reed@commit.dev` | `Learner456!Pass` | Argon2id (`$argon2id$...`) |
| **Mentor** | Dr. Marcus Vance | `marcus.vance@commit.dev` | `Mentor789!Pass` | Argon2id (`$argon2id$...`) |

---

## Technical Configuration Reference

### Prisma 7 Configuration (`backend/prisma7.config.ts`)

Prisma 7 uses the new configuration standard with `@prisma/adapter-pg` driver adapter:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
```
