import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient, Role } from '../src/generated/prisma/client';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required for database seeding.');
}

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_PRODUCTION_SEED !== 'true') {
  console.error(
    '❌ Database seeding aborted: Seeding demo data in a production environment is forbidden without ALLOW_PRODUCTION_SEED=true.',
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

// ============================================================================
// Deterministic Seed Data
// ============================================================================

export const SEED_DATA = {
  users: [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      name: 'Alex Mercer',
      email: 'alex.mercer@commit.dev',
      role: Role.LEARNER,
      plainPassword: 'Learner123!Pass',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      name: 'Samantha Reed',
      email: 'samantha.reed@commit.dev',
      role: Role.LEARNER,
      plainPassword: 'Learner456!Pass',
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      name: 'Dr. Marcus Vance',
      email: 'marcus.vance@commit.dev',
      role: Role.MENTOR,
      plainPassword: 'Mentor789!Pass',
    },
  ],
  systemSettings: {
    id: 'global',
    minSessionMinutes: 5,
    maxSessionMinutes: 480,
    maxPrerequisitesPerTopic: 5,
    updatedById: 'a0000000-0000-0000-0000-000000000003',
  },
  goals: [
    {
      id: 'b0000000-0000-0000-0000-000000000001',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      title: 'Enterprise NestJS Backend Architecture',
      description:
        'Mastering modular backend systems, dependency injection, relational persistence, and clean architecture.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000002',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      title: 'PostgreSQL Performance & Concurrency Mastery',
      description:
        'Deep dive into relational modeling, B-tree/GIN index optimization, query planning, and MVCC concurrency.',
    },
    {
      id: 'b0000000-0000-0000-0000-000000000003',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      title: 'Distributed Systems & Event-Driven Services',
      description:
        'Building resilient distributed architectures with message queues, consensus mechanisms, and failure mitigation.',
    },
  ],
  topics: [
    // Goal 1 Topics (Alex Mercer)
    {
      id: 'c0000000-0000-0000-0000-000000000001',
      goalId: 'b0000000-0000-0000-0000-000000000001',
      title: 'TypeScript Type Systems & Advanced Generics',
      description: 'Mapped types, conditional types, template literal types, and type inference engines.',
      position: 1,
      isCompleted: true,
      completedAt: new Date('2026-10-04T12:00:00.000Z'),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000002',
      goalId: 'b0000000-0000-0000-0000-000000000001',
      title: 'NestJS Inversion of Control & Custom Providers',
      description: 'Dynamic modules, custom injection tokens, circular dependency handling, and module scoping.',
      position: 2,
      isCompleted: true,
      completedAt: new Date('2026-10-18T14:30:00.000Z'),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000003',
      goalId: 'b0000000-0000-0000-0000-000000000001',
      title: 'Prisma ORM & PostgreSQL Database Migrations',
      description: 'Schema declaration, relation syntax, Prisma Studio, and safe forward-only migration workflows.',
      position: 3,
      isCompleted: true,
      completedAt: new Date('2026-10-25T16:00:00.000Z'),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000004',
      goalId: 'b0000000-0000-0000-0000-000000000001',
      title: 'RESTful Architecture & Standard Schema Validation',
      description: 'DTO generation, validation pipes with Standard Schema / Zod, and structured error responses.',
      position: 4,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000005',
      goalId: 'b0000000-0000-0000-0000-000000000001',
      title: 'Secure Authentication & Role-Based Access Control',
      description: 'Argon2 password verification, stateless JWT sessions, authorization guards, and reflection decorators.',
      position: 5,
      isCompleted: false,
      completedAt: null,
    },

    // Goal 2 Topics (Alex Mercer)
    {
      id: 'c0000000-0000-0000-0000-000000000006',
      goalId: 'b0000000-0000-0000-0000-000000000002',
      title: 'Relational Modeling & Normalization Form 1NF-BCNF',
      description: 'Entity relationship diagrams, foreign key cascades, functional dependencies, and normalization theorems.',
      position: 1,
      isCompleted: true,
      completedAt: new Date('2026-10-10T11:00:00.000Z'),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000007',
      goalId: 'b0000000-0000-0000-0000-000000000002',
      title: 'Indexing Strategies: B-Tree, GIN, & Partial Indexes',
      description: 'Index selectivity, EXPLAIN ANALYZE execution tree interpretation, and composite key ordering.',
      position: 2,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000008',
      goalId: 'b0000000-0000-0000-0000-000000000002',
      title: 'PostgreSQL Transaction Isolation & MVCC Concurrency',
      description: 'Snapshot isolation, row locks, advisory locks, serializable conflict graphs, and deadlock avoidance.',
      position: 3,
      isCompleted: false,
      completedAt: null,
    },

    // Goal 3 Topics (Samantha Reed)
    {
      id: 'c0000000-0000-0000-0000-000000000009',
      goalId: 'b0000000-0000-0000-0000-000000000003',
      title: 'Linux Core Networking & Container Isolation',
      description: 'Network namespaces, iptables, cgroups v2, and secure Docker multi-stage container builds.',
      position: 1,
      isCompleted: true,
      completedAt: new Date('2026-10-12T15:00:00.000Z'),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000010',
      goalId: 'b0000000-0000-0000-0000-000000000003',
      title: 'Asynchronous Messaging with RabbitMQ Streams',
      description: 'Exchanges, bindings, dead-letter queues, backpressure handling, and idempotent consumer workers.',
      position: 2,
      isCompleted: true,
      completedAt: new Date('2026-10-26T18:00:00.000Z'),
    },
    {
      id: 'c0000000-0000-0000-0000-000000000011',
      goalId: 'b0000000-0000-0000-0000-000000000003',
      title: 'Distributed Consensus & The Raft Algorithm',
      description: 'Leader election, log replication, term numbers, heartbeats, and handling network partitions.',
      position: 3,
      isCompleted: false,
      completedAt: null,
    },
    {
      id: 'c0000000-0000-0000-0000-000000000012',
      goalId: 'b0000000-0000-0000-0000-000000000003',
      title: 'Circuit Breakers & Microservice Fault Tolerance',
      description: 'Failure rate thresholds, half-open states, bulkhead concurrency limiters, and distributed tracing.',
      position: 4,
      isCompleted: false,
      completedAt: null,
    },
  ],
  prerequisites: [
    // Goal 1:
    // Topic 2 (NestJS IoC) depends on Topic 1 (TypeScript Generics) [1 prereq]
    {
      id: 'd0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000002',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000001',
    },
    // Topic 3 (Prisma ORM) depends on Topic 1 (TypeScript Generics) [1 prereq]
    {
      id: 'd0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000003',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000001',
    },
    // Topic 4 (REST Validation) depends on Topic 2 AND Topic 3 [MULTIPLE prereqs: 2]
    {
      id: 'd0000000-0000-0000-0000-000000000003',
      topicId: 'c0000000-0000-0000-0000-000000000004',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000002',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000004',
      topicId: 'c0000000-0000-0000-0000-000000000004',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000003',
    },
    // Topic 5 (Auth & RBAC) depends on Topic 4 (REST Validation) [1 prereq]
    {
      id: 'd0000000-0000-0000-0000-000000000005',
      topicId: 'c0000000-0000-0000-0000-000000000005',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000004',
    },

    // Goal 2:
    // Topic 7 (Indexing) depends on Topic 6 (Normalization) [1 prereq]
    {
      id: 'd0000000-0000-0000-0000-000000000006',
      topicId: 'c0000000-0000-0000-0000-000000000007',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000006',
    },
    // Topic 8 (Concurrency) depends on Topic 6 AND Topic 7 [MULTIPLE prereqs: 2]
    {
      id: 'd0000000-0000-0000-0000-000000000007',
      topicId: 'c0000000-0000-0000-0000-000000000008',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000006',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000008',
      topicId: 'c0000000-0000-0000-0000-000000000008',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000007',
    },

    // Goal 3:
    // Topic 10 (Messaging) depends on Topic 9 (Linux Containers) [1 prereq]
    {
      id: 'd0000000-0000-0000-0000-000000000009',
      topicId: 'c0000000-0000-0000-0000-000000000010',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000009',
    },
    // Topic 11 (Consensus) depends on Topic 9 (Linux Containers) [1 prereq]
    {
      id: 'd0000000-0000-0000-0000-000000000010',
      topicId: 'c0000000-0000-0000-0000-000000000011',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000009',
    },
    // Topic 12 (Resiliency) depends on Topic 10 AND Topic 11 [MULTIPLE prereqs: 2]
    {
      id: 'd0000000-0000-0000-0000-000000000011',
      topicId: 'c0000000-0000-0000-0000-000000000012',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000010',
    },
    {
      id: 'd0000000-0000-0000-0000-000000000012',
      topicId: 'c0000000-0000-0000-0000-000000000012',
      prerequisiteTopicId: 'c0000000-0000-0000-0000-000000000011',
    },
  ],
  studySessions: [
    // --- Week 1 (2026-09-28 to 2026-10-04) ---
    {
      id: 'e0000000-0000-0000-0000-000000000001',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000001',
      studyDate: new Date('2026-09-29T00:00:00.000Z'),
      minutes: 60,
      note: 'Deep dive into conditional types and infer keyword in generic signatures.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000002',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000009',
      studyDate: new Date('2026-09-30T00:00:00.000Z'),
      minutes: 75,
      note: 'Configuring Linux cgroups v2 resource limits and veth network namespaces.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000003',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000006',
      studyDate: new Date('2026-10-01T00:00:00.000Z'),
      minutes: 90,
      note: 'Entity relational diagrams and first through third normal form decomposition.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000004',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000001',
      studyDate: new Date('2026-10-02T00:00:00.000Z'),
      minutes: 45,
      note: 'Hands-on practice building mapped types with template literal string manipulations.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000005',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000009',
      studyDate: new Date('2026-10-03T00:00:00.000Z'),
      minutes: 60,
      note: 'Writing optimized multi-stage Dockerfiles with BuildKit cache mounts.',
    },

    // --- Week 2 (2026-10-05 to 2026-10-11) ---
    {
      id: 'e0000000-0000-0000-0000-000000000006',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000002',
      studyDate: new Date('2026-10-06T00:00:00.000Z'),
      minutes: 90,
      note: 'Implementing custom dynamic modules with registerAsync and ConfigurableModuleClass.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000007',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000010',
      studyDate: new Date('2026-10-07T00:00:00.000Z'),
      minutes: 60,
      note: 'RabbitMQ exchange topologies: direct, topic, and fanout routing keys.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000008',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000006',
      studyDate: new Date('2026-10-08T00:00:00.000Z'),
      minutes: 60,
      note: 'Boyce-Codd normal form decomposition exercises and loss-less joins verification.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000009',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000002',
      studyDate: new Date('2026-10-09T00:00:00.000Z'),
      minutes: 75,
      note: 'Custom provider injection tokens and circular dependency resolution with forwardRef.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000010',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000010',
      studyDate: new Date('2026-10-10T00:00:00.000Z'),
      minutes: 90,
      note: 'Implementing explicit consumer acknowledgements and prefetch count QoS.',
    },

    // --- Week 3 (2026-10-12 to 2026-10-18) ---
    {
      id: 'e0000000-0000-0000-0000-000000000011',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000003',
      studyDate: new Date('2026-10-13T00:00:00.000Z'),
      minutes: 120,
      note: 'Designing Prisma schema relationships, index directives, and foreign keys.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000012',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000009',
      studyDate: new Date('2026-10-14T00:00:00.000Z'),
      minutes: 45,
      note: 'Container security benchmarks, non-root user execution, and capability dropping.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000013',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000007',
      studyDate: new Date('2026-10-15T00:00:00.000Z'),
      minutes: 90,
      note: 'PostgreSQL B-tree leaf page architecture and composite index column ordering.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000014',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000003',
      studyDate: new Date('2026-10-16T00:00:00.000Z'),
      minutes: 90,
      note: 'Prisma migration diffing against shadow databases and zero-downtime schemas.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000015',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000010',
      studyDate: new Date('2026-10-17T00:00:00.000Z'),
      minutes: 60,
      note: 'Dead-letter exchange routing, exponential backoff retries, and poisoned message handling.',
    },

    // --- Week 4 (2026-10-19 to 2026-10-25) ---
    {
      id: 'e0000000-0000-0000-0000-000000000016',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000003',
      studyDate: new Date('2026-10-20T00:00:00.000Z'),
      minutes: 90,
      note: 'Type-safe queries with generated client models and interactive transactions.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000017',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000011',
      studyDate: new Date('2026-10-21T00:00:00.000Z'),
      minutes: 75,
      note: 'Raft consensus theory: randomized election timeouts and split-vote resolution.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000018',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000007',
      studyDate: new Date('2026-10-22T00:00:00.000Z'),
      minutes: 60,
      note: 'Benchmarking GIN indexes on JSONB path queries vs standard expression indexes.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000019',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000004',
      studyDate: new Date('2026-10-23T00:00:00.000Z'),
      minutes: 105,
      note: 'REST API resource naming conventions, idempotency headers, and pagination contracts.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000020',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000011',
      studyDate: new Date('2026-10-24T00:00:00.000Z'),
      minutes: 90,
      note: 'Raft log entry matching property, term invariants, and state machine commits.',
    },

    // --- Week 5 (2026-10-26 to 2026-11-01) ---
    {
      id: 'e0000000-0000-0000-0000-000000000021',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000004',
      studyDate: new Date('2026-10-27T00:00:00.000Z'),
      minutes: 90,
      note: 'Building StandardSchemaValidationPipe with Zod schema inference in NestJS controllers.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000022',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000012',
      studyDate: new Date('2026-10-28T00:00:00.000Z'),
      minutes: 60,
      note: 'State machine states of circuit breaker pattern: closed, open, and half-open probes.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000023',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000008',
      studyDate: new Date('2026-10-29T00:00:00.000Z'),
      minutes: 90,
      note: 'PostgreSQL MVCC row versioning, transaction xmin/xmax headers, and vacuum freezing.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000024',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000005',
      studyDate: new Date('2026-10-30T00:00:00.000Z'),
      minutes: 120,
      note: 'Argon2id hashing configuration: memory cost, time cost, and parallelism factors.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000025',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000011',
      studyDate: new Date('2026-10-31T00:00:00.000Z'),
      minutes: 60,
      note: 'Simulating Raft network partitions, asymmetric disconnects, and quorum rejoin.',
    },

    // --- Week 6 (2026-11-02 to 2026-11-06) ---
    {
      id: 'e0000000-0000-0000-0000-000000000026',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000004',
      studyDate: new Date('2026-11-02T00:00:00.000Z'),
      minutes: 75,
      note: 'Writing integration tests for validation error responses and exception formatting.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000027',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000012',
      studyDate: new Date('2026-11-03T00:00:00.000Z'),
      minutes: 90,
      note: 'Bulkhead isolation patterns and rate limiter concurrency bounds under load.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000028',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000008',
      studyDate: new Date('2026-11-04T00:00:00.000Z'),
      minutes: 90,
      note: 'Verifying Serializable isolation conflict anomalies and SSI serialization graph failure.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000029',
      learnerId: 'a0000000-0000-0000-0000-000000000001',
      topicId: 'c0000000-0000-0000-0000-000000000005',
      studyDate: new Date('2026-11-05T00:00:00.000Z'),
      minutes: 90,
      note: 'Implementing JWT authentication guard and Role guard with SetMetadata reflection.',
    },
    {
      id: 'e0000000-0000-0000-0000-000000000030',
      learnerId: 'a0000000-0000-0000-0000-000000000002',
      topicId: 'c0000000-0000-0000-0000-000000000012',
      studyDate: new Date('2026-11-06T00:00:00.000Z'),
      minutes: 60,
      note: 'W3C traceparent context injection and distributed spans over message brokers.',
    },
  ],
};

// ============================================================================
// Main Seed Routine
// ============================================================================

export async function main() {
  console.log('🌱 Starting database seed for Commit (Cardinality Progress Tracker)...');

  await prisma.$connect();

  // Execute seeding in an interactive transaction to guarantee atomicity and repeatability
  await prisma.$transaction(async (tx) => {
    // 1. Seed Users (with Argon2 password hashing)
    console.log('👤 Seeding accounts with Argon2 hashed passwords...');
    for (const user of SEED_DATA.users) {
      const passwordHash = await argon2.hash(user.plainPassword, {
        type: argon2.argon2id,
      });

      await tx.user.upsert({
        where: { id: user.id },
        update: {
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
        },
        create: {
          id: user.id,
          name: user.name,
          email: user.email,
          passwordHash,
          role: user.role,
        },
      });
    }

    // 2. Seed Global System Settings
    console.log('⚙️  Seeding global SystemSettings record...');
    const settings = SEED_DATA.systemSettings;
    await tx.systemSettings.upsert({
      where: { id: settings.id },
      update: {
        minSessionMinutes: settings.minSessionMinutes,
        maxSessionMinutes: settings.maxSessionMinutes,
        maxPrerequisitesPerTopic: settings.maxPrerequisitesPerTopic,
        updatedById: settings.updatedById,
      },
      create: {
        id: settings.id,
        minSessionMinutes: settings.minSessionMinutes,
        maxSessionMinutes: settings.maxSessionMinutes,
        maxPrerequisitesPerTopic: settings.maxPrerequisitesPerTopic,
        updatedById: settings.updatedById,
      },
    });

    // 3. Seed Study Goals (Exactly 3)
    console.log('🎯 Seeding study goals (exactly 3)...');
    for (const goal of SEED_DATA.goals) {
      await tx.goal.upsert({
        where: { id: goal.id },
        update: {
          learnerId: goal.learnerId,
          title: goal.title,
          description: goal.description,
        },
        create: {
          id: goal.id,
          learnerId: goal.learnerId,
          title: goal.title,
          description: goal.description,
        },
      });
    }

    // 4. Seed Topics (Exactly 12)
    console.log('📚 Seeding topics (exactly 12)...');
    for (const topic of SEED_DATA.topics) {
      await tx.topic.upsert({
        where: { id: topic.id },
        update: {
          goalId: topic.goalId,
          title: topic.title,
          description: topic.description,
          position: topic.position,
          isCompleted: topic.isCompleted,
          completedAt: topic.completedAt,
        },
        create: {
          id: topic.id,
          goalId: topic.goalId,
          title: topic.title,
          description: topic.description,
          position: topic.position,
          isCompleted: topic.isCompleted,
          completedAt: topic.completedAt,
        },
      });
    }

    // 5. Seed Prerequisites
    console.log('🔗 Seeding topic prerequisite relationships...');
    for (const prereq of SEED_DATA.prerequisites) {
      await tx.topicPrerequisite.upsert({
        where: {
          id: prereq.id,
        },
        update: {
          topicId: prereq.topicId,
          prerequisiteTopicId: prereq.prerequisiteTopicId,
        },
        create: {
          id: prereq.id,
          topicId: prereq.topicId,
          prerequisiteTopicId: prereq.prerequisiteTopicId,
        },
      });
    }

    // 6. Seed Study Sessions (Exactly 30 over 6 weeks)
    console.log('⏱️  Seeding study sessions (exactly 30 over 6 calendar weeks)...');
    for (const session of SEED_DATA.studySessions) {
      await tx.studySession.upsert({
        where: { id: session.id },
        update: {
          learnerId: session.learnerId,
          topicId: session.topicId,
          studyDate: session.studyDate,
          minutes: session.minutes,
          note: session.note,
        },
        create: {
          id: session.id,
          learnerId: session.learnerId,
          topicId: session.topicId,
          studyDate: session.studyDate,
          minutes: session.minutes,
          note: session.note,
        },
      });
    }
  });

  console.log('✅ Database seed completed successfully!');
}

const isDirectExecution = process.argv[1]?.replace(/\\/g, '/').endsWith('prisma/seed.ts');
if (isDirectExecution) {
  main()
    .catch((e) => {
      console.error('❌ Error during seeding:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
