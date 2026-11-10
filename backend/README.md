# Commit Backend API

Modular RESTful API for **Commit - Study Progress Tracker with Prerequisite Rules**, built with NestJS 12, TypeScript, PostgreSQL, and Prisma 7 ORM.

---

## Overview

The backend service manages:
- **Authentication & RBAC**: Argon2id password hashing, stateless Passport JWT tokens, and role-based guards (`LEARNER`, `MENTOR`).
- **Prerequisite DAG Engine**: Directed Acyclic Graph validation, 3-state DFS cycle detection, self-dependency prevention, and intra-goal boundary enforcement.
- **Dynamic Unlocking & Re-locking**: Real-time topic lock evaluation and atomic cascading dependent re-locking across downstream completed topics.
- **Study Analytics**: Nominal calendar-day streak computation with yesterday preservation, trailing 365-day activity heatmaps, and ISO-8601 weekly study targets.
- **System Settings**: Mentor-administered duration limits and prerequisite capacities.

---

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env` based on `.env.example`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/commit_db"
PORT=3000
NODE_ENV=development
JWT_SECRET=super-secret-commit-jwt-key-2026-secure
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

For isolated E2E tests, configure `.env.test`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/commit_test_db"
PORT=3001
NODE_ENV=test
JWT_SECRET=super-secret-commit-jwt-key-2026-secure
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### 3. Database Migration & Seeding
```bash
# Generate Prisma Client
npx prisma generate

# Apply forward migrations to local PostgreSQL
npx prisma migrate deploy

# Seed baseline demo accounts, curriculums, and sessions
npm run seed

# Run automated seed integrity verification audit
npm run seed:verify
```

---

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| **Development Server** | `npm run start:dev` | Starts NestJS with hot reload on `http://localhost:3000` |
| **Production Build** | `npm run build` | Compiles TypeScript to `dist/` |
| **Production Server** | `npm run start:prod` | Runs compiled server from `dist/main.js` |
| **Unit Tests** | `npm run test` | Executes 143 Jest unit tests across 12 suites |
| **E2E Tests** | `npm run test:e2e` | Executes 98 integration tests against `commit_test_db` |
| **Test Coverage** | `npm run test:cov` | Generates Jest unit test coverage report |
| **Code Linting** | `npm run lint` | Runs Oxlint type-aware linter across `src/` and `test/` |
| **Code Formatting** | `npm run format` | Runs Prettier formatting |
| **Database Seed** | `npm run seed` | Safely populates baseline demo data via non-destructive upserts |
| **Verify Seed** | `npm run seed:verify` | Verifies user counts, password hashes, goals, and DAG rules |
| **Reset Dev DB** | `npm run db:reset-dev -- --confirm` | Development-only utility to purge and reseed `commit_db` |

---

## Development Evaluation Credentials

> [!NOTE]
> The following credentials are provided strictly for local assessment and demonstration. All passwords are stored as salted Argon2id hashes.

| Role | Name | Email | Password |
|---|---|---|---|
| **Learner 1** | Alex Mercer | `alex.mercer@commit.dev` | `Learner123!Pass` |
| **Learner 2** | Samantha Reed | `samantha.reed@commit.dev` | `Learner456!Pass` |
| **Mentor** | Dr. Marcus Vance | `marcus.vance@commit.dev` | `Mentor789!Pass` |

---

## API Documentation

- **Interactive Swagger UI**: `http://localhost:3000/api/docs`
- **OpenAPI JSON Spec**: `http://localhost:3000/api/docs-json`
- **Global API Prefix**: `/api/v1/*`
