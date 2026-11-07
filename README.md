# Commit - Study Progress Tracker with Prerequisite Rules

Full-stack assessment project for the Cardinality Study Progress Tracker platform.

Commit is designed to track learner study sessions against structured goals and topics, enforcing prerequisite dependencies and logging session metrics across multi-week periods.

---

## Current Project Status

- **Phase 0 (Environment Audit & Hardening)**: Completed.
- **Phase 1 (Database Seeding & Verification)**: Completed and verified.
- **Phase 2 (Authentication & Authorization)**: Pending implementation (demo accounts and Argon2id password hashes seeded in Phase 1).

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite
- **Backend**: NestJS 12, TypeScript, CommonJS
- **Database**: PostgreSQL 18 (`commit_db`)
- **ORM**: Prisma 7.10.1 with `@prisma/adapter-pg` driver adapter
- **Password Security**: Argon2id (`argon2`)
- **Tooling & Linters**: Oxlint (backend), ESLint (frontend), tsx (Prisma runner)

---

## Project Structure

```text
Commit/
├── backend/
│   ├── prisma/
│   │   ├── migrations/        # Applied PostgreSQL migrations
│   │   ├── schema.prisma      # Prisma schema (6 models, 1 enum)
│   │   ├── seed.ts            # Phase 1 deterministic seed script
│   │   └── verify-seed.ts     # Automated seed verification audit
│   ├── src/
│   │   ├── generated/prisma/  # Generated Prisma client
│   │   ├── prisma/            # PrismaModule and PrismaService
│   │   ├── app.controller.ts  # Root controller
│   │   ├── app.module.ts      # Root module
│   │   ├── app.service.ts     # Root service
│   │   └── main.ts            # NestJS entrypoint
│   ├── prisma7.config.ts      # Prisma 7 configuration file
│   └── package.json           # Backend dependencies and scripts
├── frontend/
│   ├── src/                   # React application source
│   ├── vite.config.ts         # Vite build configuration
│   └── package.json           # Frontend dependencies and scripts
└── README.md                  # Project documentation
```

---

## Database Architecture & Models

The database schema defines 6 models and 1 enum:

1. **`User`**: Learner and mentor user accounts.
2. **`Goal`**: Learning objectives owned by learners.
3. **`Topic`**: Study topics categorized under specific goals.
4. **`TopicPrerequisite`**: Directed prerequisite relations between topics within the same goal.
5. **`StudySession`**: Time logs of learner study activity (duration in minutes, study dates, and notes).
6. **`SystemSettings`**: Global system configuration (`minSessionMinutes: 5`, `maxSessionMinutes: 480`, `maxPrerequisitesPerTopic: 5`).
- **`Role`** (Enum): `LEARNER`, `MENTOR`.

---

## Database Seeding (Phase 1)

The database seeding system populates deterministic, realistic progress-tracking data for local development, verification, and testing.

### Seed Data Summary

- **Users (3 Accounts)**:
  - 2 Learners (`Role.LEARNER`)
  - 1 Mentor (`Role.MENTOR`)
  - All passwords hashed via **Argon2id** (`$argon2id$...`). Plaintext passwords are never stored in the database.
- **Global Settings (1 Record)**:
  - `minSessionMinutes`: 5
  - `maxSessionMinutes`: 480
  - `maxPrerequisitesPerTopic`: 5
  - Updated by mentor account (`Dr. Marcus Vance`).
- **Study Goals (Exactly 3 Goals)**:
  1. `Enterprise NestJS Backend Architecture` (Learner: Alex Mercer)
  2. `PostgreSQL Performance & Concurrency Mastery` (Learner: Alex Mercer)
  3. `Distributed Systems & Event-Driven Services` (Learner: Samantha Reed)
- **Topics (Exactly 12 Topics)**:
  - Goal 1 (5 topics): TypeScript generics, NestJS IoC, Prisma ORM, REST validation, Auth & RBAC
  - Goal 2 (3 topics): Relational normalization, Indexing strategies, Transaction isolation
  - Goal 3 (4 topics): Linux containers, RabbitMQ messaging, Raft consensus, Circuit breakers
- **Prerequisite Relationships (12 Relations)**:
  - Strict Directed Acyclic Graph (DAG) with zero cycles and zero self-dependencies.
  - All prerequisites strictly belong to the same goal (no cross-goal prerequisites).
  - 3 topics with no prerequisites, 6 topics with 1 prerequisite, 3 topics with multiple (2) prerequisites.
- **Study Sessions (Exactly 30 Sessions)**:
  - Distributed across 6 calendar weeks (`2026-09-29` through `2026-11-06`).
  - No future-dated sessions.
  - Session durations range from 45 to 120 minutes, adhering to the configured 5 to 480 minute limits.
  - Strict ownership validation: all study sessions belong to the learner who owns the associated goal and topic.

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

## Seeding & Verification Commands

### Database Seeding
From the repository root:
```bash
npm --prefix backend run seed
```

Or from the `backend` directory:
```bash
npm run seed
# or using Prisma CLI:
npx prisma db seed
```

### Seed Integrity Audit
To run the automated verification script against the database:
```bash
npm --prefix backend run seed:verify
```

Or from the `backend` directory:
```bash
npm run seed:verify
# or directly with tsx:
npx tsx prisma/verify-seed.ts
```

---

## Build & Quality Commands

```bash
# Build the NestJS backend
npm --prefix backend run build

# Build the React frontend
npm --prefix frontend run build

# Backend type-aware linting (Oxlint)
npm --prefix backend run lint

# Frontend linting (ESLint)
npm --prefix frontend run lint
```

---

## Technical Configuration Reference

### Prisma 7 Configuration (`backend/prisma7.config.ts`)

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
