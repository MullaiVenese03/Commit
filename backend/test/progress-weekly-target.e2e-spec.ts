import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Progress Weekly Target (e2e)', () => {
  let app: INestApplication;
  let learner1Token: string;
  let learner2Token: string;
  let mentorToken: string;

  const learner1Id = 'a0000000-0000-0000-0000-000000000001';
  const learner2Id = 'a0000000-0000-0000-0000-000000000002';
  const nonExistentId = 'a0000000-0000-0000-0000-000000000099';
  const topic1Id = 'c0000000-0000-0000-0000-000000000001'; // Learner 1 topic

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

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

    await app.init();

    // 1. Log in Learner 1
    const l1Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'alex.mercer@commit.dev',
        password: 'Learner123!Pass',
      });
    expect(l1Res.status).toBe(200);
    learner1Token = l1Res.body.accessToken;

    // 2. Log in Learner 2
    const l2Res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'samantha.reed@commit.dev',
        password: 'Learner456!Pass',
      });
    expect(l2Res.status).toBe(200);
    learner2Token = l2Res.body.accessToken;

    // 3. Log in Mentor
    const mRes = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'marcus.vance@commit.dev',
        password: 'Mentor789!Pass',
      });
    expect(mRes.status).toBe(200);
    mentorToken = mRes.body.accessToken;
  });

  afterAll(async () => {
    // Restore default 600 minutes for learner 1 if modified
    if (learner1Token) {
      await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 600 });
    }
    await app.close();
  });

  describe('GET /api/v1/progress/weekly-target', () => {
    it('Learner can fetch own weekly target and progress metrics (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('targetMinutes');
      expect(res.body).toHaveProperty('completedMinutes');
      expect(res.body).toHaveProperty('remainingMinutes');
      expect(res.body).toHaveProperty('completionPercentage');
      expect(res.body).toHaveProperty('isTargetMet');
      expect(res.body).toHaveProperty('weekStart');
      expect(res.body).toHaveProperty('weekEnd');
      expect(typeof res.body.targetMinutes).toBe('number');
      expect(typeof res.body.completedMinutes).toBe('number');
      expect(typeof res.body.remainingMinutes).toBe('number');
      expect(typeof res.body.completionPercentage).toBe('number');
      expect(typeof res.body.isTargetMet).toBe('boolean');
    });

    it('Calculates correct Monday to Sunday ISO week bounds when reference date is supplied', async () => {
      // 2026-11-04 is Wednesday -> week is 2026-11-02 to 2026-11-08
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/weekly-target?today=2026-11-04')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.weekStart).toBe('2026-11-02');
      expect(res.body.weekEnd).toBe('2026-11-08');
    });

    it('Learner cannot view another learner weekly target by passing learnerId (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/weekly-target?learnerId=${learner2Id}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Learners cannot view another learner's progress");
    });

    it('Mentor can view learner weekly target by supplying learnerId (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/weekly-target?learnerId=${learner1Id}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('targetMinutes');
      expect(res.body).toHaveProperty('completedMinutes');
      expect(res.body).toHaveProperty('weekStart');
      expect(res.body).toHaveProperty('weekEnd');
    });

    it('Mentor querying without learnerId is rejected with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('learnerId query parameter is required for mentors');
    });

    it('Mentor querying non-existent learner is rejected with 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/weekly-target?learnerId=${nonExistentId}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toContain('not found');
    });

    it('Rejects unauthenticated request with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/progress/weekly-target');

      expect(res.status).toBe(401);
    });

    it('Rejects invalid today date format with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/weekly-target?today=invalid-date')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/v1/progress/weekly-target', () => {
    it('Learner can update their weekly target within valid range (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 750 });

      expect(res.status).toBe(200);
      expect(res.body.targetMinutes).toBe(750);
      expect(res.body).toHaveProperty('completedMinutes');
      expect(res.body).toHaveProperty('remainingMinutes');
      expect(res.body).toHaveProperty('completionPercentage');
      expect(res.body).toHaveProperty('weekStart');
      expect(res.body).toHaveProperty('weekEnd');

      // Verify persistence via GET
      const verifyRes = await request(app.getHttpServer())
        .get('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(verifyRes.status).toBe(200);
      expect(verifyRes.body.targetMinutes).toBe(750);
    });

    it('Learner can update using weeklyStudyTargetMinutes field name alias (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ weeklyStudyTargetMinutes: 900 });

      expect(res.status).toBe(200);
      expect(res.body.targetMinutes).toBe(900);
    });

    it('Rejects conflicting targetMinutes and weeklyStudyTargetMinutes with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 600, weeklyStudyTargetMinutes: 900 });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot provide conflicting values');
    });

    it('Accepts matching targetMinutes and weeklyStudyTargetMinutes (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 700, weeklyStudyTargetMinutes: 700 });

      expect(res.status).toBe(200);
      expect(res.body.targetMinutes).toBe(700);
    });

    it('Rejects target below minimum (60 minutes) with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 59 });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('at least 60 minutes');
    });

    it('Rejects target above maximum (4,200 minutes) with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 4201 });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('cannot exceed 4,200 minutes');
    });

    it('Rejects non-integer target with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 120.5 });

      expect(res.status).toBe(400);
    });

    it('Rejects non-numeric string target with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('Rejects empty request body with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('targetMinutes is required');
    });

    it('Rejects extra unwhitelisted properties with 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 600, hackerField: true });

      expect(res.status).toBe(400);
      expect(JSON.stringify(res.body)).toContain('property hackerField should not exist');
    });

    it('Mentor cannot update learner weekly targets (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ targetMinutes: 800 });

      expect(res.status).toBe(403);
      expect(res.body.message).toContain('Mentors are not permitted to modify learner study targets');
    });

    it('Rejects unauthenticated update with 401 Unauthorized', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .send({ targetMinutes: 800 });

      expect(res.status).toBe(401);
    });
  });

  describe('Dynamic Recalculation on Session Mutation', () => {
    const testReferenceDate = '2026-11-04'; // Wednesday in week 2026-11-02..2026-11-08
    let createdSessionId: string;

    it('Adding and deleting a session dynamically updates completed minutes and completion percentage', async () => {
      // 1. Reset target to 600 minutes
      await request(app.getHttpServer())
        .patch('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ targetMinutes: 600 });

      // 2. Fetch baseline
      const baselineRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/weekly-target?today=${testReferenceDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(baselineRes.status).toBe(200);
      const baselineCompleted = baselineRes.body.completedMinutes;
      const baselineRemaining = baselineRes.body.remainingMinutes;

      // 3. Create a study session of 120 minutes inside this week
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicId: topic1Id,
          studyDate: `${testReferenceDate}T10:00:00.000Z`,
          minutes: 120,
          note: 'E2E weekly study session verification',
        });

      expect(createRes.status).toBe(201);
      createdSessionId = createRes.body.id;

      // 4. Verify weekly target metrics reflect +120 completed minutes
      const afterCreateRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/weekly-target?today=${testReferenceDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(afterCreateRes.status).toBe(200);
      expect(afterCreateRes.body.completedMinutes).toBe(baselineCompleted + 120);
      expect(afterCreateRes.body.remainingMinutes).toBe(Math.max(0, baselineRemaining - 120));

      const expectedPercentage = Math.min(100, Math.round(((baselineCompleted + 120) / 600) * 100));
      expect(afterCreateRes.body.completionPercentage).toBe(expectedPercentage);

      // 5. Edit session minutes from 120 to 180
      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({ minutes: 180 });
      expect(updateRes.status).toBe(200);

      // Verify recalculated weekly target reflects +180 minutes
      const afterEditRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/weekly-target?today=${testReferenceDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(afterEditRes.status).toBe(200);
      expect(afterEditRes.body.completedMinutes).toBe(baselineCompleted + 180);

      // 6. Complete and reopen topic, verifying target minutes remain unaffected
      const completeRes = await request(app.getHttpServer())
        .patch(`/api/v1/topics/${topic1Id}/complete`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(completeRes.status).toBe(200);

      const afterCompleteRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/weekly-target?today=${testReferenceDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(afterCompleteRes.status).toBe(200);
      expect(afterCompleteRes.body.completedMinutes).toBe(baselineCompleted + 180);

      const reopenRes = await request(app.getHttpServer())
        .patch(`/api/v1/topics/${topic1Id}/reopen`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(reopenRes.status).toBe(200);

      const afterReopenRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/weekly-target?today=${testReferenceDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(afterReopenRes.status).toBe(200);
      expect(afterReopenRes.body.completedMinutes).toBe(baselineCompleted + 180);

      // 7. Delete session
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(deleteRes.status).toBe(204);

      // 8. Verify weekly target metrics revert back to baseline
      const afterDeleteRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/weekly-target?today=${testReferenceDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(afterDeleteRes.status).toBe(200);
      expect(afterDeleteRes.body.completedMinutes).toBe(baselineCompleted);
      expect(afterDeleteRes.body.remainingMinutes).toBe(baselineRemaining);
    });
  });

  describe('GET /api/v1/progress (Enriched with weeklyTarget)', () => {
    it('Includes weeklyTarget metrics in authenticated learner overview', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('weeklyTarget');
      expect(res.body.weeklyTarget).toHaveProperty('targetMinutes');
      expect(res.body.weeklyTarget).toHaveProperty('completedMinutes');
      expect(res.body.weeklyTarget).toHaveProperty('remainingMinutes');
      expect(res.body.weeklyTarget).toHaveProperty('completionPercentage');
      expect(res.body.weeklyTarget).toHaveProperty('isTargetMet');
      expect(res.body.weeklyTarget).toHaveProperty('weekStart');
      expect(res.body.weeklyTarget).toHaveProperty('weekEnd');
    });

    it('Mentor can view learner progress with embedded weeklyTarget', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/${learner1Id}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('weeklyTarget');
      expect(res.body.weeklyTarget).toHaveProperty('targetMinutes');
      expect(res.body.weeklyTarget).toHaveProperty('completedMinutes');
    });
  });

  describe('Cross-Learner Target Isolation', () => {
    it('Learner 2 fetches their own default weekly target independently', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/weekly-target')
        .set('Authorization', `Bearer ${learner2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.targetMinutes).toBe(600);
    });
  });
});
