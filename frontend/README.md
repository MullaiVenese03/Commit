# Commit Frontend Web Application

Single Page Application (SPA) for **Commit - Study Progress Tracker with Prerequisite Rules**, built with React 19, TypeScript, Vite, Tailwind CSS v4, and TanStack React Query v5.

---

## Overview

The client application provides:
- **Role-Aware Navigation**: Separate views and permissions for Learners (Dashboard, Goals, Sessions, Progress) and Mentors (Cohort Roster, Learner Inspection, Settings).
- **Curriculum & Prerequisite UI**: Visual DAG milestone cards with status indicators (Completed, In Progress, Locked) and explicit missing prerequisite tags.
- **Dynamic Unlocking**: Instant UI re-render when prerequisites are satisfied without full-page reloads.
- **Study Analytics**:
  - Streak metric summary with "yesterday preservation" badges.
  - Interactive 365-day GitHub-inspired study activity heatmap with 5 discrete intensity levels.
  - Weekly study target tracker with ISO-8601 progress bar and inline target editor modal.
- **Study Session Logging**: Modal for recording study duration and notes with immediate client-side validation.

---

## Local Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Configuration
Create `.env` based on `.env.example`:
```env
VITE_API_URL=http://localhost:3000/api/v1
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## Available Scripts

| Script | Command | Purpose |
|---|---|---|
| **Development Server** | `npm run dev` | Starts Vite local development server on `http://localhost:5173` |
| **Production Build** | `npm run build` | Bundles and compiles production assets into `dist/` |
| **Preview Build** | `npm run preview` | Locally serves the compiled production build from `dist/` |
| **Unit & UI Tests** | `npm test` | Runs 120 Vitest unit and component tests across 12 suites |
| **Watch Tests** | `npm run test:watch` | Runs Vitest in interactive watch mode |
| **Test Coverage** | `npm run test:cov` | Generates Vitest code coverage report |
| **Code Linting** | `npm run lint` | Runs ESLint across `src/` and `test/` |

---

## Tech Stack Highlights

- **Framework**: React 19.3.1
- **Language**: TypeScript ~6.0.3
- **Bundler**: Vite 8.3.6
- **Styling**: Tailwind CSS 4.3.5
- **Server State**: TanStack React Query 5.107.1
- **Routing**: React Router 8.5.1
- **Icons**: Lucide React 1.70.0
- **Testing**: Vitest 5.1.0 + React Testing Library 16.3.3 + JSDOM 29.0.2
