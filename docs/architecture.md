# Commit Architecture & Technical Design

Full technical architecture documentation for **Commit**, a study progress tracking platform with prerequisite graph enforcement, dynamic unlocking, cascading re-locking, study streaks, and weekly targets.

---

## 1. System Overview & High-Level Architecture

Commit follows a modern, decoupled client-server architecture:
- **Frontend**: Single Page Application (SPA) built with React 19, TypeScript, Vite, Tailwind CSS v4, and TanStack React Query v5.
- **Backend**: Modular RESTful API built with NestJS 12, TypeScript, Passport JWT authentication, class-validator validation, and OpenAPI Swagger documentation.
- **Data Persistence**: PostgreSQL 16+ accessed through Prisma 7.10.1 ORM with the `@prisma/adapter-pg` driver adapter.

```mermaid
flowchart TB
    subgraph Client["React 19 Frontend (Vite)"]
        UI["UI Layer (Tailwind CSS v4 & Lucide)"]
        Router["React Router v7 (Protected & Role Routes)"]
        QueryCache["TanStack React Query v5 (Cache & Invalidation)"]
        ApiClient["Axios API Client (Bearer Token Interceptor)"]
    end

    subgraph Server["NestJS 12 Modular Backend"]
        Pipes["ValidationPipe (Whitelist & Forbid Unknowns)"]
        Guards["Auth & Role Guards (JwtAuthGuard, RolesGuard)"]
        Controllers["REST Controllers (/api/v1/*)"]
        Services["Business Services (DAG Engine, Streaks, Targets)"]
        PrismaService["PrismaService (@prisma/adapter-pg)"]
    end

    subgraph Storage["PostgreSQL 16+ Database"]
        DevDB[("commit_db (Development)")]
        TestDB[("commit_test_db (E2E Isolated)")]
    end

    UI --> Router
    Router --> QueryCache
    QueryCache --> ApiClient
    ApiClient -- "HTTPS / JSON" --> Pipes
    Pipes --> Guards
    Guards --> Controllers
    Controllers --> Services
    Services --> PrismaService
    PrismaService --> DevDB
    PrismaService -. "Automated E2E" .-> TestDB
```

---

## 2. React Frontend Architecture

The frontend is organized by feature domains with shared layout and primitive UI components.

### 2.1 Directory Structure
```text
frontend/src/
├── app/
│   ├── providers/          # AuthProvider, QueryClientProvider
│   └── router/             # ProtectedRoute, RoleRoute, route definitions
├── components/
│   ├── layout/             # AppLayout, Sidebar, Navbar, Breadcrumbs
│   └── ui/                 # Button, Input, Modal, Card, StatCard, Badge, DatePicker, etc.
├── features/
│   ├── auth/               # LoginForm, RegisterForm, AuthContext
│   ├── dashboard/          # LearnerDashboard, StudyTimeline, WeeklyActivityChart
│   ├── goals/              # GoalListPage, GoalDetailPage, GoalCard, GoalModal
│   ├── topics/             # TopicCard, PrerequisiteBadge, TopicModal, ReorderModal
│   ├── sessions/           # SessionHistoryPage, SessionLogModal, SessionFilters, SessionTable
│   ├── progress/           # ProgressPage, ActivityHeatmap, StreakSummary, WeeklyTargetCard, EditWeeklyTargetModal
│   ├── mentor/             # MentorDashboard, LearnerListPage, LearnerDetailPage, MentorGoalsPage, MentorSessionsPage
│   └── settings/           # SettingsPage (System settings administration)
├── hooks/                  # Custom React Query hooks (useProgress, useSessions, useGoals, useTopics, etc.)
├── services/               # Axios API clients (api.ts, auth, goals, topics, sessions, progress, mentor, settings)
├── types/                  # TypeScript interfaces and domain models
└── utils/                  # Date formatters, Zod schemas, localStorage helpers
```

### 2.2 Client-Side Route Protection
Route protection is layered across authentication and role authorization:

```mermaid
flowchart TD
    Req["User navigates to Route"] --> AuthCheck{"Authenticated?"}
    AuthCheck -- No --> Login["Redirect to /login"]
    AuthCheck -- Yes --> RoleCheck{"Has Required Role?"}
    RoleCheck -- No --> Forbidden["Redirect to /dashboard (Role Mismatch)"]
    RoleCheck -- Yes --> Render["Render Protected Feature View"]
```

1. **`ProtectedRoute`**: Verifies JWT existence and active session in `AuthContext`. Unauthenticated users are redirected to `/login` with location preservation.
2. **`RoleRoute`**: Verifies role permissions (`Role.LEARNER` or `Role.MENTOR`). Learners cannot view mentor cohort pages; mentors navigating to learner-only creation routes are redirected to the mentor dashboard.

### 2.3 React Query State Management & Cache Invalidation
TanStack React Query v5 acts as the server-state manager. When mutations occur, queries are deterministically invalidated to maintain cache coherence:

```mermaid
sequenceDiagram
    autonumber
    actor Learner as Learner User
    participant Component as UI Component (e.g. SessionLogModal)
    participant Hook as useSessions / useProgress Hook
    participant API as Axios Service Client
    participant Backend as NestJS API
    participant Cache as React Query Cache

    Learner->>Component: Submits new study session (60m)
    Component->>Hook: trigger mutateAsync(payload)
    Hook->>API: POST /api/v1/sessions
    API->>Backend: HTTP POST with Bearer JWT
    Backend-->>API: 201 Created (new session record)
    API-->>Hook: Session data response
    Hook->>Cache: invalidateQueries(['sessions'])
    Hook->>Cache: invalidateQueries(['progress'])
    Hook->>Cache: invalidateQueries(['streaks'])
    Hook->>Cache: invalidateQueries(['activity'])
    Hook->>Cache: invalidateQueries(['weekly-target'])
    Cache->>Component: Re-render with refreshed streak, target, and heatmap
    Component-->>Learner: Displays updated progress & streak badge
```

---

## 3. NestJS Backend Architecture

The backend follows NestJS modular architecture with separation of concerns between HTTP controllers, business logic services, data access layer, and global security interceptors.

```text
backend/src/
├── common/
│   ├── decorators/         # @CurrentUser, @Roles, @Public
│   ├── filters/            # Global HttpExceptionFilter
│   ├── guards/             # JwtAuthGuard, RolesGuard
│   └── pipes/              # ParseUUIDPipe
├── config/                 # Environment validation via class-validator
├── prisma/                 # PrismaModule, PrismaService
├── auth/                   # Authentication, Argon2 hashing, JWT strategy
├── users/                  # User profile management
├── goals/                  # Learning goals CRUD and ownership enforcement
├── topics/                 # Topics CRUD, DAG prerequisite engine, cycle detection, re-locking
├── sessions/               # Study sessions logging, filtering, duration validation
├── progress/               # Progress summaries, 365-day heatmap, streaks, weekly targets
├── mentor/                 # Cohort inspection, student summaries, cross-student views
├── settings/               # System-wide configuration (min/max duration, max prerequisites)
├── app.module.ts           # Root application module
└── main.ts                 # Bootstrap entrypoint (CORS, Swagger, validation pipes)
```

### 3.1 Request Lifecycle Pipeline
Every inbound HTTP request traverses the following lifecycle pipeline:

```mermaid
flowchart LR
    Client["HTTP Request"] --> CORS["CORS Origin Validation"]
    CORS --> Pipe["Global ValidationPipe (whitelist: true, forbidNonWhitelisted: true)"]
    Pipe --> JwtGuard["JwtAuthGuard (Passport JWT Strategy)"]
    JwtGuard --> RolesGuard["RolesGuard (@Roles: LEARNER / MENTOR)"]
    RolesGuard --> Controller["Controller Route Handler"]
    Controller --> Service["Domain Service (Business Rules & Graph Engine)"]
    Service --> Prisma["Prisma 7 Client (@prisma/adapter-pg)"]
    Prisma --> DB[("PostgreSQL Database")]
```

---

## 4. PostgreSQL & Prisma Data Layer

The database schema is defined in [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma).

### 4.1 Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Goal : "owns"
    User ||--o{ StudySession : "logs"
    User ||--o{ SystemSettings : "updates"
    Goal ||--o{ Topic : "contains"
    Topic ||--o{ TopicPrerequisite : "has prerequisites"
    Topic ||--o{ TopicPrerequisite : "is prerequisite for"
    Topic ||--o{ StudySession : "records"

    User {
        uuid id PK
        string name
        string email UK
        string passwordHash
        Role role "LEARNER | MENTOR"
        int weeklyStudyTargetMinutes "default: 600"
        datetime createdAt
        datetime updatedAt
    }

    Goal {
        uuid id PK
        uuid learnerId FK
        string title
        string description
        datetime createdAt
        datetime updatedAt
    }

    Topic {
        uuid id PK
        uuid goalId FK
        string title
        string description
        int position
        boolean isCompleted "default: false"
        datetime completedAt
        datetime createdAt
        datetime updatedAt
    }

    TopicPrerequisite {
        uuid id PK
        uuid topicId FK
        uuid prerequisiteTopicId FK
        datetime createdAt
    }

    StudySession {
        uuid id PK
        uuid learnerId FK
        uuid topicId FK
        date studyDate "@db.Date"
        int minutes
        string note
        datetime createdAt
    }

    SystemSettings {
        string id PK "fixed: 'global'"
        int minSessionMinutes "default: 5"
        int maxSessionMinutes "default: 480"
        int maxPrerequisitesPerTopic "default: 5"
        uuid updatedById FK
        datetime updatedAt
    }
```

### 4.2 Relational Integrity & Cascades
- **Unique Constraints**:
  - `User.email`: Enforces distinct user identities.
  - `TopicPrerequisite(topicId, prerequisiteTopicId)`: Prevents duplicate prerequisite edges.
- **Cascading Deletions**:
  - Deleting a `Goal` automatically cascades to delete all child `Topic` records.
  - Deleting a `Topic` automatically removes all associated `TopicPrerequisite` rows and `StudySession` logs.
  - Deleting a `User` cascades to all owned goals, topics, and study sessions.

---

## 5. Authentication & Authorization Flows

### 5.1 Authentication (Argon2id & JWT)
All user passwords are encrypted using salted **Argon2id** (`argon2.argon2id`) with memory cost of 64MB (65,536 KiB), 3 iterations, and parallelism of 4.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Frontend as React Client
    participant AuthCtrl as AuthController
    participant AuthService as AuthService
    participant Argon as Argon2 Engine
    participant DB as PostgreSQL

    User->>Frontend: Enters email & password
    Frontend->>AuthCtrl: POST /api/v1/auth/login
    AuthCtrl->>AuthService: validateUser(email, password)
    AuthService->>DB: findUnique({ where: { email } })
    DB-->>AuthService: User record with passwordHash
    AuthService->>Argon: verify(passwordHash, password)
    alt Invalid Credentials
        Argon-->>AuthService: false
        AuthService-->>Frontend: 401 Unauthorized ("Invalid email or password")
    else Valid Credentials
        Argon-->>AuthService: true
        AuthService->>AuthService: signJwtToken({ sub: id, email, role })
        AuthService-->>Frontend: 200 OK { accessToken, user (no passwordHash) }
        Frontend->>Frontend: Store token in memory & localStorage
    end
```

### 5.2 Role Escalation Prevention
- **Registration**: The registration DTO strictly disallows any role specification. Requests attempting to pass `role: "MENTOR"` or `role: "LEARNER"` are rejected with `HTTP 400 Bad Request` by NestJS `forbidNonWhitelisted: true`.
- **User Modification**: The `PATCH /api/v1/users/me` endpoint only permits updating `name`. Attempting to supply `role` or `email` triggers HTTP 400 rejection.

### 5.3 Authorization & Data Isolation
Authorization is verified across two boundaries:
1. **Role-Based Guards (`RolesGuard`)**:
   - `Role.LEARNER`: Allowed to create and manage own goals, topics, sessions, and weekly targets. Forbidden from modifying system settings (HTTP 403).
   - `Role.MENTOR`: Allowed to update global system settings (min/max duration, max prereqs). Forbidden from mutating learner records (HTTP 403).
2. **Resource Ownership Isolation**:
   - Every learner endpoint strictly enforces `record.learnerId === currentUser.id`.
   - Attempting to inspect or modify another learner's goal, topic, or study session produces `HTTP 403 Forbidden` (`"Learners cannot access another learner's study session"`).

---

## 6. Prerequisite DAG Engine & Graph Integrity

The prerequisite relationship between topics inside a goal forms a **Directed Acyclic Graph (DAG)**.

### 6.1 Validation Rules
Whenever a topic is created or updated with prerequisites:
1. **Self-Dependency Rejection**: A topic cannot depend on itself ($A \to A$).
2. **Duplicate Edge Rejection**: Duplicate prerequisite IDs in a single topic are rejected.
3. **Capacity Limit**: Prerequisite count cannot exceed `SystemSettings.maxPrerequisitesPerTopic` (default 5).
4. **Goal Boundary Constraint**: All prerequisite topics must belong to the exact same `goalId`. Cross-goal dependencies are strictly rejected.
5. **Cycle Detection (DFS)**: Any directed cycle ($A \to B \to A$ or $A \to B \to C \to A$) is rejected.

### 6.2 3-State DFS Cycle Detection Algorithm
The cycle detection algorithm constructs an adjacency list representing all existing edges in the goal plus the proposed modifications, then executes a 3-color Depth First Search:
- `0 (UNVISITED)`: Node not yet examined.
- `1 (VISITING)`: Node currently in the active DFS recursion stack. If an edge points to a node in this state, **a back-edge exists, proving a directed cycle**.
- `2 (VISITED)`: Node and all downstream descendants fully verified acyclic.

```mermaid
flowchart TD
    Start(["Start Cycle Check for Proposed DAG"]) --> InitState["Set all nodes to State 0 (UNVISITED)"]
    InitState --> PickNode{"Any UNVISITED node remaining?"}
    PickNode -- Yes --> DFS["Run DFS(node)"]
    PickNode -- No --> Valid(["DAG Valid: No Cycles Detected"])

    DFS --> MarkVisiting["Set node state = 1 (VISITING)"]
    MarkVisiting --> Neighbors{"Has more prerequisite neighbors?"}
    Neighbors -- Yes --> CheckState{"Neighbor State?"}
    CheckState -- "State 1 (VISITING)" --> CycleError(["CYCLE DETECTED! Throw BadRequestException"])
    CheckState -- "State 0 (UNVISITED)" --> Recurse["DFS(neighbor)"]
    Recurse --> Neighbors
    CheckState -- "State 2 (VISITED)" --> Neighbors
    Neighbors -- No --> MarkVisited["Set node state = 2 (VISITED)"]
    MarkVisited --> PickNode
```

---

## 7. Dynamic Topic Unlocking & Cascading Re-locking

### 7.1 Dynamic Unlocking
Topics are dynamically enriched upon retrieval:
- `isUnlocked = (prerequisites.filter(p => !p.isCompleted).length === 0)`
- `missingPrerequisites = [{ id, title }, ...]` for all incomplete prerequisites.

A learner cannot complete a topic if any prerequisite is incomplete:
```typescript
if (dto.isCompleted === true && !topic.isCompleted) {
  const incompletePrereq = topic.prerequisites.find(
    (p: any) => !p.prerequisiteTopic?.isCompleted,
  );
  if (incompletePrereq) {
    throw new BadRequestException(
      'Cannot complete a topic whose prerequisites are not yet completed',
    );
  }
}
```

### 7.2 Cascading Dependent Re-locking
When an already-completed topic is reopened (`isCompleted: false`), all downstream completed topics that transitively depend upon it would be left in an inconsistent state. The engine executes a breadth-first search (BFS) downstream traversal inside an atomic Prisma database transaction to reset downstream topics:

```mermaid
sequenceDiagram
    autonumber
    actor Learner
    participant Service as TopicsService
    participant Engine as BFS Transitive Traversal
    participant Tx as Prisma $transaction

    Learner->>Service: POST /api/v1/topics/:id/reopen (Topic A)
    Service->>Tx: Begin atomic transaction
    Service->>Engine: getTransitiveDependents(Topic A)
    Note over Engine: Traverses A -> B -> C<br/>Identifies B and C as downstream
    Engine-->>Service: [Topic B, Topic C]
    Service->>Tx: updateMany Topic where id IN [B, C] SET isCompleted=false, completedAt=null
    Service->>Tx: update Topic A SET isCompleted=false, completedAt=null
    Tx-->>Service: Commit transaction
    Service-->>Learner: Returns updated Topic A (dependents re-locked)
```

---

## 8. Study Streak & Activity Heatmap Logic

### 8.1 Calendar-Day Normalization (Zero Timezone Shift)
All study sessions store their date as `@db.Date` in PostgreSQL. All calculations operate purely on nominal calendar date strings (`YYYY-MM-DD`), preventing time-of-day offsets or daylight saving jumps from altering streaks:
- `shiftCalendarDate(dateStr, +/- days)`
- `getCalendarDaysDiff(earlier, later)`
- `extractNominalDate(Date)`

### 8.2 Streak Calculation with "Yesterday Preservation"
Learners retain their active streak throughout the current calendar day even before logging their first session of the day:

```mermaid
flowchart TD
    Start(["Calculate Streak for Learner"]) --> FetchSessions["Group study sessions by YYYY-MM-DD"]
    FetchSessions --> CheckToday{"Has study session TODAY?"}

    CheckToday -- Yes --> TodayStreak["currentStreak = 1<br/>Check yesterday, 2 days ago, ...<br/>Increment for each consecutive active day"]
    TodayStreak --> ReturnStreak["Return currentStreak, isActiveToday=true"]

    CheckToday -- No --> CheckYesterday{"Has study session YESTERDAY?"}
    CheckYesterday -- Yes --> PreservedStreak["currentStreak = 1<br/>Preserve streak from yesterday backwards<br/>isActiveToday=false, isActiveYesterday=true"]
    PreservedStreak --> ReturnPreserved["Return preserved currentStreak ('At Risk' until midnight)"]

    CheckYesterday -- No --> BrokenStreak["currentStreak = 0<br/>Streak broken"]
    BrokenStreak --> ReturnBroken["Return currentStreak = 0"]
```

### 8.3 Activity Heatmap Matrix & Intensities
The trailing 365-day activity heatmap aggregates session duration per calendar day and assigns discrete visual intensity levels:

| Level | Range (Minutes) | Hex Color | Visual Style | Role / Label |
|:---:|:---:|:---:|:---|:---|
| **0** | `0 min` | `#F0EFEA` | `bg-[#F0EFEA] border-[#E4E2DE]` | Neutral / Inactive |
| **1** | `1 – 29 min` | `#DDDDF8` | `bg-[#DDDDF8] border-[#C4C5F0]` | Light review (<30m) |
| **2** | `30 – 59 min` | `#ACAEF0` | `bg-[#ACAEF0] border-[#8E91E2]` | Moderate study (30m–1h) |
| **3** | `60 – 119 min` | `#7375D8` | `bg-[#7375D8] border-[#5557C8]` | High study velocity (1h–2h) |
| **4** | `120+ min` | `#4446B4` | `bg-[#4446B4] border-[#36389A]` | Deep focus study (2h+) |

- Matrix layout: 7 rows corresponding to Monday through Sunday.
- Bounded date range: Maximum 366 calendar days.
- Inverted ranges (`startDate > endDate`) rejected with HTTP 400.

---

## 9. Weekly Study Target Calculation

Each learner has a configurable weekly target stored in `User.weeklyStudyTargetMinutes` (default: 600 minutes / 10 hours).

### 9.1 ISO-8601 Monday–Sunday Reporting Boundaries
Weekly progress is computed strictly between Monday 00:00:00 and Sunday 23:59:59 of the reference week:

```mermaid
flowchart LR
    Ref["Reference Date (Browser-Local 'today')"] --> ISO["getIsoWeekBounds(referenceToday)"]
    ISO --> Start["weekStart: Monday (Day 1) 00:00:00"]
    ISO --> End["weekEnd: Sunday (Day 7) 23:59:59"]
    Start --> Filter["Filter Sessions in [weekStart, weekEnd]"]
    End --> Filter
    Filter --> Sum["Sum(session.minutes) = completedMinutes"]
```

### 9.2 Metric Formulas
$$\text{completedMinutes} = \sum_{s \in \text{WeekSessions}} s.\text{minutes}$$
$$\text{remainingMinutes} = \max(0, \text{weeklyStudyTargetMinutes} - \text{completedMinutes})$$
$$\text{percentage} = \min\left(100, \text{round}\left(\frac{\text{completedMinutes}}{\text{weeklyStudyTargetMinutes}} \times 100\right)\right)$$
$$\text{isTargetMet} = \text{completedMinutes} \ge \text{weeklyStudyTargetMinutes}$$

### 9.3 Validation Constraints
- Target range: Strictly bounded between **60 minutes** (1 hour) and **4,200 minutes** (70 hours).
- Value must be an integer.
- Mentor accounts are strictly forbidden from modifying learner targets (`HTTP 403 Forbidden`).

---

## 10. Summary of Architectural Guarantees

1. **Strict Zero-Trust Role Boundaries**: Mentors can inspect learner metrics cohort-wide but can never mutate learner curricula, sessions, or targets.
2. **Deterministic Graph Integrity**: Cycle detection ensures the prerequisite structure remains a strict DAG.
3. **Atomic Consistency**: Cascading dependent re-locking executes within atomic PostgreSQL transactions (`prisma.$transaction`).
4. **Timezone-Agnostic Analytics**: Streak and activity metrics operate on nominal calendar days, ensuring zero UTC drift across midnight.
5. **Real-Time Client Coherence**: React Query cache invalidations guarantee immediate UI synchronization upon logging, completing, reopening, or editing study activities.
