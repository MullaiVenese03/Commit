import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Progress Activity & Streaks (e2e)', () => {
  let app: INestApplication;
  let learner1Token: string;
  let learner2Token: string;
  let mentorToken: string;

  const learner1Id = 'a0000000-0000-0000-0000-000000000001';
  const learner2Id = 'a0000000-0000-0000-0000-000000000002';
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
    await app.close();
  });

  describe('GET /api/v1/progress/streaks', () => {
    it('Learner can fetch own study streak metrics (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/streaks')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('learnerId', learner1Id);
      expect(res.body).toHaveProperty('currentStreak');
      expect(res.body).toHaveProperty('longestStreak');
      expect(res.body).toHaveProperty('totalActiveDays');
      expect(res.body).toHaveProperty('isActiveToday');
      expect(res.body).toHaveProperty('isActiveYesterday');
      expect(res.body).toHaveProperty('referenceDate');
      expect(typeof res.body.currentStreak).toBe('number');
      expect(typeof res.body.longestStreak).toBe('number');
      expect(typeof res.body.totalActiveDays).toBe('number');
    });

    it('Learner can specify browser-local today reference date (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/streaks?today=2026-11-06')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.referenceDate).toBe('2026-11-06');
    });

    it('Learner explicitly passing own learnerId succeeds (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/streaks?learnerId=${learner1Id}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.learnerId).toBe(learner1Id);
    });

    it("Learner passing another learner's ID is rejected (403 Forbidden)", async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/streaks?learnerId=${learner2Id}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toContain("Learners cannot view another learner's progress");
    });

    it('Learner 2 can fetch own streaks independently (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/streaks')
        .set('Authorization', `Bearer ${learner2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.learnerId).toBe(learner2Id);
    });

    it('Mentor can view any learner streak metrics with learnerId (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/streaks?learnerId=${learner1Id}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.learnerId).toBe(learner1Id);
      expect(res.body).toHaveProperty('currentStreak');
    });

    it('Mentor request without learnerId returns 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/streaks')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('learnerId query parameter is required for mentors');
    });

    it('Mentor querying non-existent learner returns 404 Not Found', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/streaks?learnerId=a0000000-0000-0000-0000-999999999999')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(404);
    });

    it('Rejects invalid today date format or impossible calendar dates (400 Bad Request)', async () => {
      const res1 = await request(app.getHttpServer())
        .get('/api/v1/progress/streaks?today=invalid-date')
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(res1.status).toBe(400);

      const res2 = await request(app.getHttpServer())
        .get('/api/v1/progress/streaks?today=2026-02-30')
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(res2.status).toBe(400);
    });

    it('Rejects anonymous request without token (401 Unauthorized)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/streaks');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/progress/activity', () => {
    it('Learner can fetch default trailing 365-day activity heatmap (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/activity?today=2026-11-09')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('learnerId', learner1Id);
      expect(res.body).toHaveProperty('startDate');
      expect(res.body).toHaveProperty('endDate', '2026-11-09');
      expect(res.body).toHaveProperty('totalDays', 365);
      expect(res.body).toHaveProperty('activeDays');
      expect(res.body).toHaveProperty('totalMinutes');
      expect(Array.isArray(res.body.days)).toBe(true);
      expect(res.body.days.length).toBe(365);

      const firstDay = res.body.days[0];
      expect(firstDay).toHaveProperty('date');
      expect(firstDay).toHaveProperty('totalMinutes');
      expect(firstDay).toHaveProperty('sessionCount');
      expect(firstDay).toHaveProperty('level');
    });

    it('Supports custom bounded date range (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/activity?startDate=2026-10-01&endDate=2026-10-31')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.startDate).toBe('2026-10-01');
      expect(res.body.endDate).toBe('2026-10-31');
      expect(res.body.totalDays).toBe(31);
      expect(res.body.days.length).toBe(31);
    });

    it('Rejects startDate after endDate (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/activity?startDate=2026-11-10&endDate=2026-11-01')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('startDate cannot be after endDate');
    });

    it('Rejects date range exceeding 366 days (400 Bad Request)', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/activity?startDate=2024-01-01&endDate=2025-02-01')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Date range cannot exceed 366 calendar days');
    });

    it('Learner cannot access another learner activity (403 Forbidden)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/activity?learnerId=${learner2Id}`)
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(403);
    });

    it('Mentor can view learner activity with learnerId (200 OK)', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/activity?learnerId=${learner1Id}&startDate=2026-11-01&endDate=2026-11-05`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.learnerId).toBe(learner1Id);
      expect(res.body.totalDays).toBe(5);
    });

    it('Mentor request without learnerId returns 400 Bad Request', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress/activity')
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(400);
    });
  });

  describe('Dynamic Metric Recalculation on Session Mutation', () => {
    let createdSessionId: string;
    const testStudyDate = '2026-11-06';

    it('Logs a study session and immediately reflects in streak & activity', async () => {
      // 1. Initial streak on reference date
      const initialStreakRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/streaks?today=${testStudyDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(initialStreakRes.status).toBe(200);
      const initialActiveDays = initialStreakRes.body.totalActiveDays;

      // 2. Create a study session
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${learner1Token}`)
        .send({
          topicId: topic1Id,
          studyDate: `${testStudyDate}T12:00:00.000Z`,
          minutes: 45,
          note: 'Dynamic recalculation verification test',
        });
      expect(createRes.status).toBe(201);
      createdSessionId = createRes.body.id;

      // 3. Streaks reflect the newly logged session
      const updatedStreakRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/streaks?today=${testStudyDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(updatedStreakRes.status).toBe(200);
      expect(updatedStreakRes.body.isActiveToday).toBe(true);

      // 4. Activity endpoint reflects the newly logged minutes
      const activityRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/activity?startDate=${testStudyDate}&endDate=${testStudyDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(activityRes.status).toBe(200);
      expect(activityRes.body.days[0].totalMinutes).toBeGreaterThanOrEqual(45);
      expect(activityRes.body.days[0].sessionCount).toBeGreaterThanOrEqual(1);

      // 5. Delete the study session
      const deleteRes = await request(app.getHttpServer())
        .delete(`/api/v1/sessions/${createdSessionId}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(deleteRes.status).toBe(204);

      // 6. Streaks and active days are recalculated without the deleted session
      const postDeleteStreakRes = await request(app.getHttpServer())
        .get(`/api/v1/progress/streaks?today=${testStudyDate}`)
        .set('Authorization', `Bearer ${learner1Token}`);
      expect(postDeleteStreakRes.status).toBe(200);
      expect(postDeleteStreakRes.body.totalActiveDays).toBe(initialActiveDays);
    });
  });

  describe('GET /api/v1/progress (Enriched with streak)', () => {
    it('Includes streak metrics in authenticated learner overview', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/progress')
        .set('Authorization', `Bearer ${learner1Token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('overview');
      expect(res.body).toHaveProperty('streak');
      expect(res.body.streak).toHaveProperty('currentStreak');
      expect(res.body.streak).toHaveProperty('longestStreak');
      expect(res.body.streak).toHaveProperty('totalActiveDays');
    });

    it('Mentor can view learner progress with embedded streak', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/progress/${learner1Id}`)
        .set('Authorization', `Bearer ${mentorToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('streak');
      expect(res.body.streak).toHaveProperty('currentStreak');
    });
  });
});
