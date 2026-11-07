import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth & Role-Based Access Control (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let learner1Token: string;
  let learner2Token: string;
  let mentorToken: string;
  let learner1GoalId: string;
  let learner2GoalId: string;
  let learner1SessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    prisma = app.get(PrismaService);

    app.setGlobalPrefix('api/v1', {
      exclude: ['/', 'api/docs', 'api/docs-json'],
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    const swaggerConfig = new DocumentBuilder()
      .setTitle('Commit API')
      .setDescription('Commit Backend API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    await app.init();

    // 1. Log in Learner 1 (Alex Mercer)
    const l1Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'alex.mercer@commit.dev',
        password: 'Learner123!Pass',
      });
    expect(l1Res.status).toBe(200);
    learner1Token = l1Res.body.accessToken;

    // 2. Log in Learner 2 (Samantha Reed)
    const l2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'samantha.reed@commit.dev',
        password: 'Learner456!Pass',
      });
    expect(l2Res.status).toBe(200);
    learner2Token = l2Res.body.accessToken;

    // 3. Log in Mentor (Dr. Marcus Vance)
    const mRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'marcus.vance@commit.dev',
        password: 'Mentor789!Pass',
      });
    expect(mRes.status).toBe(200);
    mentorToken = mRes.body.accessToken;

    // Retrieve seeded goals
    const l1GoalsRes = await request(app.getHttpServer())
      .get('/api/v1/goals')
      .set('Authorization', `Bearer ${learner1Token}`);
    expect(l1GoalsRes.status).toBe(200);
    expect(l1GoalsRes.body.length).toBeGreaterThan(0);
    learner1GoalId = l1GoalsRes.body[0].id;

    const l2GoalsRes = await request(app.getHttpServer())
      .get('/api/v1/goals')
      .set('Authorization', `Bearer ${learner2Token}`);
    expect(l2GoalsRes.status).toBe(200);
    expect(l2GoalsRes.body.length).toBeGreaterThan(0);
    learner2GoalId = l2GoalsRes.body[0].id;

    const sessionsRes = await request(app.getHttpServer())
      .get('/api/v1/sessions')
      .set('Authorization', `Bearer ${learner1Token}`);
    expect(sessionsRes.status).toBe(200);
    expect(sessionsRes.body.length).toBeGreaterThan(0);
    learner1SessionId = sessionsRes.body[0].id;
  });

  afterAll(async () => {
    // TST-01: Isolate test state by cleaning up test data and restoring settings
    try {
      await prisma.user.deleteMany({
        where: {
          email: {
            contains: 'commit.dev',
            notIn: [
              'alex.mercer@commit.dev',
              'samantha.reed@commit.dev',
              'marcus.vance@commit.dev',
            ],
          },
        },
      });

      // Restore baseline global settings
      await prisma.systemSettings.update({
        where: { id: 'global' },
        data: {
          minSessionMinutes: 5,
          maxSessionMinutes: 480,
          maxPrerequisitesPerTopic: 5,
          updatedById: 'a0000000-0000-0000-0000-000000000003',
        },
      });
    } catch {}

    await app.close();
  });

  describe('Authentication Endpoints & SEC-01 Security', () => {
    it('POST /api/v1/auth/register - registers new learner without exposing passwordHash', async () => {
      const uniqueEmail = `test.learner.${Date.now()}@commit.dev`;
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'New Registered Learner',
          email: uniqueEmail,
          password: 'ValidPassword123!',
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.user).toHaveProperty('id');
      expect(res.body.user.email).toBe(uniqueEmail);
      expect(res.body.user.role).toBe('LEARNER');
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    it('POST /api/v1/auth/register - SEC-01 rejects registration attempt with role: "MENTOR"', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Fake Mentor Attacker',
          email: `attacker.${Date.now()}@commit.dev`,
          password: 'ValidPassword123!',
          role: 'MENTOR',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('property role should not exist');
    });

    it('POST /api/v1/auth/register - rejects registration attempt with role: "LEARNER" (unknown field)', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Learner Explicit Role',
          email: `explicit.${Date.now()}@commit.dev`,
          password: 'ValidPassword123!',
          role: 'LEARNER',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('property role should not exist');
    });

    it('PATCH /api/v1/users/me - SEC-01 rejects attempt to modify user role', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          role: 'MENTOR',
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('property role should not exist');
    });

    it('POST /api/v1/auth/register - rejects duplicate email with 409 Conflict', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Duplicate Alex',
          email: 'alex.mercer@commit.dev',
          password: 'Password123!',
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Conflict');
    });

    it('POST /api/v1/auth/register - rejects weak password (< 8 chars) with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          name: 'Weak Password User',
          email: `weak.${Date.now()}@commit.dev`,
          password: 'short',
        });

      expect(res.status).toBe(400);
    });

    it('POST /api/v1/auth/login - fails with 401 on wrong password', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({
          email: 'alex.mercer@commit.dev',
          password: 'IncorrectPassword!',
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('GET /api/v1/auth/me - returns authenticated user profile', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('alex.mercer@commit.dev');
      expect(res.body.role).toBe('LEARNER');
      expect(res.body.passwordHash).toBeUndefined();
    });

    it('GET /api/v1/auth/me - rejects request without JWT token with 401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Learner Authorization Boundaries', () => {
    it("Learner cannot view another learner's goal (403 Forbidden)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/goals/${learner1GoalId}`)
        .set('Authorization', `Bearer ${learner2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Learners cannot access another learner's goals");
    });

    it("Learner cannot modify another learner's goal (403 Forbidden)", async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/goals/${learner1GoalId}`)
        .set('Authorization', `Bearer ${learner2Token}`)
        .send({ title: 'Malicious Update' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Learners cannot modify another learner's goals");
    });

    it("Learner cannot delete another learner's goal (403 Forbidden)", async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/goals/${learner1GoalId}`)
        .set('Authorization', `Bearer ${learner2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Learners cannot delete another learner's goals");
    });

    it('Learner can create, list, update and delete own goal', async () => {
      // 1. Create goal
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/goals')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          title: 'Full Lifecycle Goal',
          description: 'Goal to test full CRUD lifecycle',
        });
      expect(createRes.status).toBe(201);
      const createdGoalId = createRes.body.id;

      // 2. List own goals
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/goals')
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(listRes.status).toBe(200);
      expect(listRes.body.some((g: any) => g.id === createdGoalId)).toBe(true);

      // 3. Update goal
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/goals/${createdGoalId}`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          title: 'Updated Lifecycle Goal Title',
        });
      expect(updateRes.status).toBe(200);
      expect(updateRes.body.title).toBe('Updated Lifecycle Goal Title');

      // 4. Delete goal
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/goals/${createdGoalId}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(deleteRes.status).toBe(204);
    });

    it("Learner cannot access another learner's study session (403 Forbidden)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sessions/${learner1SessionId}`)
        .set('Authorization', `Bearer ${learner2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Learners cannot access another learner's study session");
    });

    it("Learner cannot access another learner's progress directly (403 Forbidden)", async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/a0000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${learner2Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Learners cannot view another learner's progress");
    });

    it('Learner cannot modify global system settings (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/settings')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ minSessionMinutes: 15 });

      expect(res.status).toBe(403);
    });

    it('Learner cannot access mentor-only management routes (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/mentor/learners')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(403);
    });
  });

  describe('Mentor Authorization Boundaries', () => {
    it("Mentor CAN view any learner's goal (200 OK)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/goals/${learner1GoalId}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(learner1GoalId);
    });

    it("Mentor CAN view any learner's progress (200 OK)", async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/a0000000-0000-0000-0000-000000000001')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('overview');
      expect(res.body.overview).toHaveProperty('totalGoals');
    });

    it('Mentor CAN access mentor learners dashboard (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/mentor/learners')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(2);
    });

    it('Mentor MUST NOT be permitted to modify learner goals (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/goals/${learner1GoalId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ title: 'Mentor Overriding Goal Title' });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Mentors are not permitted to modify learner records');
    });

    it('Mentor MUST NOT be permitted to delete learner goals (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/api/v1/goals/${learner1GoalId}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Mentors are not permitted to delete learner records');
    });

    it('Mentor MUST NOT be permitted to modify learner study sessions (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/sessions/${learner1SessionId}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ minutes: 120 });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Mentors are not permitted to modify learner records');
    });

    it('Mentor CAN modify global system settings (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/settings')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          minSessionMinutes: 10,
          maxSessionMinutes: 360,
        });

      expect(res.status).toBe(200);
      expect(res.body.minSessionMinutes).toBe(10);
      expect(res.body.maxSessionMinutes).toBe(360);
      expect(res.body.updatedById).toBe('a0000000-0000-0000-0000-000000000003'); // Marcus Vance
    });
  });

  describe('COR-01, COR-02 & MED-01: Prerequisite Graph & Dynamic Unlocking (e2e)', () => {
    let createdTopic1Id: string;
    let createdTopic2Id: string;

    it('creates topic with no prerequisites and verifies it is dynamically unlocked', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          goalId: learner1GoalId,
          title: 'E2E Base Topic A',
          description: 'Topic with no prereqs',
          position: 100,
        });

      expect(res.status).toBe(201);
      expect(res.body.isUnlocked).toBe(true);
      expect(res.body.missingPrerequisites).toEqual([]);
      createdTopic1Id = res.body.id;
    });

    it('creates topic depending on Base Topic A and verifies it is locked until A completes', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/topics')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          goalId: learner1GoalId,
          title: 'E2E Dependent Topic B',
          description: 'Topic depending on A',
          position: 101,
          prerequisiteTopicIds: [createdTopic1Id],
        });

      expect(res.status).toBe(201);
      expect(res.body.isUnlocked).toBe(false);
      expect(res.body.missingPrerequisites.length).toBe(1);
      expect(res.body.missingPrerequisites[0].id).toBe(createdTopic1Id);
      createdTopic2Id = res.body.id;
    });

    it('COR-01 rejects circular dependency when updating topic A to depend on topic B', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/topics/${createdTopic1Id}`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          prerequisiteTopicIds: [createdTopic2Id],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Circular dependency detected');
    });

    it('COR-02 rejects cross-goal prerequisites', async () => {
      // Fetch a topic from Learner 2's goal
      const l2TopicsRes = await request(app.getHttpServer())
        .get(`/api/v1/topics/goal/${learner2GoalId}`)
        .set('Authorization', `Bearer ${learner2Token}`);
      expect(l2TopicsRes.status).toBe(200);
      const l2TopicId = l2TopicsRes.body[0].id;

      // Attempt to add l2TopicId as prerequisite to learner1's topic
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/topics/${createdTopic1Id}`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          prerequisiteTopicIds: [l2TopicId],
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('All prerequisite topics must belong to the same goal');
    });

    it('MED-01 completing topic A unlocks dependent topic B', async () => {
      // Complete Topic A
      const completeARes = await request(app.getHttpServer())
        .patch(`/api/v1/topics/${createdTopic1Id}`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ isCompleted: true });
      expect(completeARes.status).toBe(200);

      // Verify Topic B is now unlocked
      const getBRes = await request(app.getHttpServer())
        .get(`/api/v1/topics/${createdTopic2Id}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(getBRes.status).toBe(200);
      expect(getBRes.body.isUnlocked).toBe(true);
      expect(getBRes.body.missingPrerequisites).toEqual([]);
    });

    it('MED-01 reopening topic A cascades and re-locks dependent topic B', async () => {
      // First, complete Topic B
      const completeBRes = await request(app.getHttpServer())
        .patch(`/api/v1/topics/${createdTopic2Id}`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ isCompleted: true });
      expect(completeBRes.status).toBe(200);
      expect(completeBRes.body.isCompleted).toBe(true);

      // Now reopen Topic A
      const reopenARes = await request(app.getHttpServer())
        .patch(`/api/v1/topics/${createdTopic1Id}`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ isCompleted: false });
      expect(reopenARes.status).toBe(200);
      expect(reopenARes.body.isCompleted).toBe(false);

      // Verify Topic B has been automatically re-locked and reset to isCompleted: false
      const getBRes = await request(app.getHttpServer())
        .get(`/api/v1/topics/${createdTopic2Id}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(getBRes.status).toBe(200);
      expect(getBRes.body.isCompleted).toBe(false);
      expect(getBRes.body.completedAt).toBeNull();
      expect(getBRes.body.isUnlocked).toBe(false);
      expect(getBRes.body.missingPrerequisites.length).toBe(1);
    });

    it('rejects attempt to complete topic B via /complete while its prerequisite topic A is incomplete', async () => {
      const completeBRes = await request(app.getHttpServer())
        .patch(`/api/v1/topics/${createdTopic2Id}/complete`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(completeBRes.status).toBe(400);
      expect(completeBRes.body.message).toContain('Cannot complete a topic whose prerequisites are not yet completed');
    });

    it('DEF-01 rejects partial topic list when reordering topics in a goal', async () => {
      const reorderRes = await request(app.getHttpServer())
        .patch(`/api/v1/topics/goal/${learner1GoalId}/reorder`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicIds: [createdTopic2Id, createdTopic1Id],
        });

      expect(reorderRes.status).toBe(400);
      expect(reorderRes.body.message).toContain(
        'Reordering requires all topic IDs for the specified goal',
      );
    });

    it('reorders topics in a goal successfully when complete list is provided', async () => {
      const allTopicsRes = await request(app.getHttpServer())
        .get(`/api/v1/topics/goal/${learner1GoalId}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(allTopicsRes.status).toBe(200);

      const otherTopicIds = allTopicsRes.body
        .map((t: any) => t.id)
        .filter(
          (id: string) => id !== createdTopic1Id && id !== createdTopic2Id,
        );

      const completeOrder = [createdTopic2Id, createdTopic1Id, ...otherTopicIds];

      const reorderRes = await request(app.getHttpServer())
        .patch(`/api/v1/topics/goal/${learner1GoalId}/reorder`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicIds: completeOrder,
        });

      expect(reorderRes.status).toBe(200);
      expect(Array.isArray(reorderRes.body)).toBe(true);
      const t2 = reorderRes.body.find((t: any) => t.id === createdTopic2Id);
      const t1 = reorderRes.body.find((t: any) => t.id === createdTopic1Id);
      expect(t2.position).toBe(0);
      expect(t1.position).toBe(1);
    });
  });

  describe('Session Logging, Validation & Filtering (e2e)', () => {
    it('rejects tomorrow study session date with 400 Bad Request', async () => {
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      const studyDate = tomorrow.toISOString().slice(0, 10);

      const res = await request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicId: 'c0000000-0000-0000-0000-000000000001',
          studyDate,
          minutes: 45,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Study session date cannot be in the future');
    });

    it('accepts today calendar date for study session', async () => {
      const today = new Date().toISOString().slice(0, 10);

      const res = await request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicId: 'c0000000-0000-0000-0000-000000000001',
          studyDate: today,
          minutes: 30,
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('rejects session logging for another learner\'s topic (403 Forbidden)', async () => {
      // Learner 2's topic: c0000000-0000-0000-0000-000000000009
      const res = await request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicId: 'c0000000-0000-0000-0000-000000000009',
          studyDate: '2026-11-01',
          minutes: 30,
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Learners cannot log study sessions for another learner's topic");
    });

    it('filters sessions by goalId', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sessions?goalId=${learner1GoalId}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      for (const session of res.body) {
        expect(session.topic.goalId).toBe(learner1GoalId);
      }
    });

    it('filters sessions by topicId', async () => {
      const targetTopicId = 'c0000000-0000-0000-0000-000000000001';
      const res = await request(app.getHttpServer())
        .get(`/api/v1/sessions?topicId=${targetTopicId}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      for (const session of res.body) {
        expect(session.topicId).toBe(targetTopicId);
      }
    });

    it('filters sessions by date range', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/sessions?startDate=2026-10-01&endDate=2026-10-15')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      for (const session of res.body) {
        const sessionDate = new Date(session.studyDate);
        expect(sessionDate >= new Date('2026-10-01')).toBe(true);
        expect(sessionDate <= new Date('2026-10-15')).toBe(true);
      }
    });

    it('rejects invalid date range with startDate > endDate (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/sessions?startDate=2026-11-15&endDate=2026-10-01')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('startDate cannot be after endDate');
    });
  });

  describe('System Settings Lifecycle & Dynamic Business Rule Enforcement (e2e)', () => {
    it('rejects settings update where minSessionMinutes >= maxSessionMinutes (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/settings')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          minSessionMinutes: 60,
          maxSessionMinutes: 60,
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Minimum session duration must be lower than maximum session duration');
    });

    it('dynamically enforces updated settings on subsequent session creations without code change', async () => {
      // 1. Mentor sets min: 20, max: 90
      const settingsRes = await request(app.getHttpServer())
        .patch('/api/v1/settings')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          minSessionMinutes: 20,
          maxSessionMinutes: 90,
        });
      expect(settingsRes.status).toBe(200);

      // 2. Learner tries to log 15 mins (< 20 min new minimum)
      const lowRes = await request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicId: 'c0000000-0000-0000-0000-000000000001',
          studyDate: '2026-11-01',
          minutes: 15,
        });
      expect(lowRes.status).toBe(400);
      expect(lowRes.body.message).toContain('Session duration must be between 20 and 90 minutes');

      // 3. Learner tries to log 120 mins (> 90 min new maximum)
      const highRes = await request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicId: 'c0000000-0000-0000-0000-000000000001',
          studyDate: '2026-11-01',
          minutes: 120,
        });
      expect(highRes.status).toBe(400);
      expect(highRes.body.message).toContain('Session duration must be between 20 and 90 minutes');

      // 4. Learner logs valid 45 mins (within 20 to 90 mins)
      const validRes = await request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicId: 'c0000000-0000-0000-0000-000000000001',
          studyDate: '2026-11-01',
          minutes: 45,
        });
      expect(validRes.status).toBe(201);

      // 5. Restore settings to baseline: min: 5, max: 480
      const restoreRes = await request(app.getHttpServer())
        .patch('/api/v1/settings')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({
          minSessionMinutes: 5,
          maxSessionMinutes: 480,
          maxPrerequisitesPerTopic: 5,
        });
      expect(restoreRes.status).toBe(200);
    });
  });

  describe('Swagger Documentation', () => {
    it('GET /api/docs - serves Swagger UI html', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('swagger-ui');
    });

    it('GET /api/docs-json - serves valid OpenAPI spec', async () => {
      const res = await request(app.getHttpServer()).get('/api/docs-json');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('openapi');
      expect(res.body.info.title).toBe('Commit API');
      expect(res.body.paths).toHaveProperty('/api/v1/auth/login');
      expect(res.body.paths).toHaveProperty('/api/v1/auth/register');
      expect(res.body.paths).toHaveProperty('/api/v1/goals');
      expect(res.body.paths).toHaveProperty('/api/v1/sessions');
      expect(res.body.paths).toHaveProperty('/api/v1/settings');
    });
  });
});
