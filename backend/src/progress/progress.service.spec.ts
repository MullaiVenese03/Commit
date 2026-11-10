import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let service: ProgressService;

  const mockLearnerUser: CurrentUserPayload = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'Alex Mercer',
    email: 'alex.mercer@commit.dev',
    role: Role.LEARNER,
  };

  const mockOtherLearnerUser: CurrentUserPayload = {
    id: 'a0000000-0000-0000-0000-000000000002',
    name: 'Samantha Reed',
    email: 'samantha.reed@commit.dev',
    role: Role.LEARNER,
  };

  const mockMentorUser: CurrentUserPayload = {
    id: 'a0000000-0000-0000-0000-000000000003',
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@commit.dev',
    role: Role.MENTOR,
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    goal: {
      findMany: jest.fn(),
    },
    studySession: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
  });

  describe('resolveTargetLearnerId', () => {
    it('returns currentUser.id for learner when learnerId is omitted', async () => {
      const id = await service.resolveTargetLearnerId(mockLearnerUser);
      expect(id).toBe(mockLearnerUser.id);
    });

    it('returns currentUser.id for learner when learnerId matches self', async () => {
      const id = await service.resolveTargetLearnerId(
        mockLearnerUser,
        mockLearnerUser.id,
      );
      expect(id).toBe(mockLearnerUser.id);
    });

    it('rejects learner attempting to access another learner with 403 Forbidden', async () => {
      await expect(
        service.resolveTargetLearnerId(
          mockLearnerUser,
          mockOtherLearnerUser.id,
        ),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.resolveTargetLearnerId(
          mockLearnerUser,
          mockOtherLearnerUser.id,
        ),
      ).rejects.toThrow("Learners cannot view another learner's progress");
    });

    it('rejects mentor request when learnerId is omitted with 400 Bad Request', async () => {
      await expect(
        service.resolveTargetLearnerId(mockMentorUser),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.resolveTargetLearnerId(mockMentorUser),
      ).rejects.toThrow('learnerId query parameter is required for mentors');
    });

    it('returns target learner ID when mentor queries valid existing learner', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: mockLearnerUser.id,
        role: Role.LEARNER,
      });

      const id = await service.resolveTargetLearnerId(
        mockMentorUser,
        mockLearnerUser.id,
      );
      expect(id).toBe(mockLearnerUser.id);
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockLearnerUser.id },
        select: { id: true, role: true },
      });
    });

    it('throws 404 NotFoundException when mentor queries non-existent learner', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce(null);

      await expect(
        service.resolveTargetLearnerId(
          mockMentorUser,
          'a0000000-0000-0000-0000-999999999999',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws 404 NotFoundException when mentor queries a user who is not a LEARNER', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: 'mentor-uuid',
        role: Role.MENTOR,
      });

      await expect(
        service.resolveTargetLearnerId(mockMentorUser, 'mentor-uuid'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStreaks', () => {
    const TODAY = '2026-11-09';

    it('calculates streaks for learner successfully', async () => {
      mockPrismaService.studySession.findMany.mockResolvedValueOnce([
        {
          studyDate: new Date('2026-11-09T00:00:00.000Z'),
          minutes: 60,
        },
        {
          studyDate: new Date('2026-11-08T00:00:00.000Z'),
          minutes: 45,
        },
      ]);

      const result = await service.getStreaks(mockLearnerUser, {
        today: TODAY,
      });

      expect(result.learnerId).toBe(mockLearnerUser.id);
      expect(result.currentStreak).toBe(2);
      expect(result.longestStreak).toBe(2);
      expect(result.totalActiveDays).toBe(2);
      expect(result.isActiveToday).toBe(true);
      expect(result.isActiveYesterday).toBe(true);
      expect(result.referenceDate).toBe(TODAY);
    });

    it('rejects invalid today date with 400 Bad Request', async () => {
      await expect(
        service.getStreaks(mockLearnerUser, { today: 'invalid-date' }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getStreaks(mockLearnerUser, { today: '2026-02-30' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('allows mentor to query learner streaks', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: mockLearnerUser.id,
        role: Role.LEARNER,
      });
      mockPrismaService.studySession.findMany.mockResolvedValueOnce([]);

      const result = await service.getStreaks(mockMentorUser, {
        learnerId: mockLearnerUser.id,
        today: TODAY,
      });

      expect(result.learnerId).toBe(mockLearnerUser.id);
      expect(result.currentStreak).toBe(0);
      expect(result.totalActiveDays).toBe(0);
    });
  });

  describe('getActivity', () => {
    const TODAY = '2026-11-09';

    it('returns trailing 365 days of activity by default', async () => {
      mockPrismaService.studySession.findMany.mockResolvedValueOnce([
        {
          studyDate: new Date('2026-11-09T00:00:00.000Z'),
          minutes: 90,
        },
      ]);

      const result = await service.getActivity(mockLearnerUser, {
        today: TODAY,
      });

      expect(result.learnerId).toBe(mockLearnerUser.id);
      expect(result.totalDays).toBe(365);
      expect(result.activeDays).toBe(1);
      expect(result.totalMinutes).toBe(90);
      expect(result.endDate).toBe(TODAY);
      expect(result.days.length).toBe(365);

      const todayRecord = result.days.find((d) => d.date === TODAY);
      expect(todayRecord).toEqual({
        date: TODAY,
        totalMinutes: 90,
        sessionCount: 1,
        level: 3,
      });
    });

    it('supports custom valid bounded date range', async () => {
      mockPrismaService.studySession.findMany.mockResolvedValueOnce([
        {
          studyDate: new Date('2026-11-01T00:00:00.000Z'),
          minutes: 45,
        },
      ]);

      const result = await service.getActivity(mockLearnerUser, {
        startDate: '2026-11-01',
        endDate: '2026-11-05',
        today: TODAY,
      });

      expect(result.totalDays).toBe(5);
      expect(result.activeDays).toBe(1);
      expect(result.totalMinutes).toBe(45);
      expect(result.days.length).toBe(5);
    });

    it('rejects startDate after endDate with 400 Bad Request', async () => {
      await expect(
        service.getActivity(mockLearnerUser, {
          startDate: '2026-11-10',
          endDate: '2026-11-05',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects date range exceeding 366 days with 400 Bad Request', async () => {
      await expect(
        service.getActivity(mockLearnerUser, {
          startDate: '2024-01-01',
          endDate: '2025-02-01',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid startDate or endDate format with 400 Bad Request', async () => {
      await expect(
        service.getActivity(mockLearnerUser, {
          startDate: 'not-a-date',
          endDate: '2026-11-05',
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.getActivity(mockLearnerUser, {
          startDate: '2026-11-01',
          endDate: '2026-13-40',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('calculateWeeklyTarget', () => {
    const REFERENCE_DATE = '2026-11-11'; // Wednesday -> ISO week: 2026-11-09 to 2026-11-15

    it('calculates below-target progress accurately', () => {
      const sessions = [
        { studyDate: new Date('2026-11-09T00:00:00.000Z'), minutes: 120 },
        { studyDate: new Date('2026-11-10T00:00:00.000Z'), minutes: 300 },
      ]; // Total 420 mins

      const result = service.calculateWeeklyTarget(600, sessions, REFERENCE_DATE);

      expect(result.targetMinutes).toBe(600);
      expect(result.completedMinutes).toBe(420);
      expect(result.remainingMinutes).toBe(180);
      expect(result.completionPercentage).toBe(70);
      expect(result.isTargetMet).toBe(false);
      expect(result.weekStart).toBe('2026-11-09');
      expect(result.weekEnd).toBe('2026-11-15');
    });

    it('calculates exactly meeting target', () => {
      const sessions = [
        { studyDate: new Date('2026-11-09T00:00:00.000Z'), minutes: 300 },
        { studyDate: new Date('2026-11-11T00:00:00.000Z'), minutes: 300 },
      ]; // Total 600 mins

      const result = service.calculateWeeklyTarget(600, sessions, REFERENCE_DATE);

      expect(result.completedMinutes).toBe(600);
      expect(result.remainingMinutes).toBe(0);
      expect(result.completionPercentage).toBe(100);
      expect(result.isTargetMet).toBe(true);
    });

    it('calculates exceeding target safely bounded at 100% completion and 0 remaining', () => {
      const sessions = [
        { studyDate: new Date('2026-11-09T00:00:00.000Z'), minutes: 400 },
        { studyDate: new Date('2026-11-10T00:00:00.000Z'), minutes: 350 },
      ]; // Total 750 mins

      const result = service.calculateWeeklyTarget(600, sessions, REFERENCE_DATE);

      expect(result.completedMinutes).toBe(750);
      expect(result.remainingMinutes).toBe(0);
      expect(result.completionPercentage).toBe(100);
      expect(result.isTargetMet).toBe(true);
    });

    it('correctly filters Monday to Sunday boundaries and excludes out-of-week sessions', () => {
      const sessions = [
        { studyDate: new Date('2026-11-08T00:00:00.000Z'), minutes: 120 }, // Sunday of previous week (excluded)
        { studyDate: new Date('2026-11-09T00:00:00.000Z'), minutes: 60 },  // Monday (included)
        { studyDate: new Date('2026-11-15T00:00:00.000Z'), minutes: 90 },  // Sunday (included)
        { studyDate: new Date('2026-11-16T00:00:00.000Z'), minutes: 60 },  // Monday of next week (excluded)
      ];

      const result = service.calculateWeeklyTarget(600, sessions, REFERENCE_DATE);

      expect(result.completedMinutes).toBe(150); // 60 + 90
      expect(result.remainingMinutes).toBe(450);
      expect(result.completionPercentage).toBe(25);
    });

    it('handles year-boundary reporting week correctly', () => {
      // 2026-01-01 (Thursday): ISO week is 2025-12-29 (Mon) to 2026-01-04 (Sun)
      const sessions = [
        { studyDate: new Date('2025-12-28T00:00:00.000Z'), minutes: 60 }, // Previous Sunday (excluded)
        { studyDate: new Date('2025-12-29T00:00:00.000Z'), minutes: 100 }, // Monday (included)
        { studyDate: new Date('2026-01-01T00:00:00.000Z'), minutes: 150 }, // New Year Day (included)
        { studyDate: new Date('2026-01-04T00:00:00.000Z'), minutes: 50 },  // Sunday (included)
        { studyDate: new Date('2026-01-05T00:00:00.000Z'), minutes: 60 },  // Next Monday (excluded)
      ];

      const result = service.calculateWeeklyTarget(600, sessions, '2026-01-01');

      expect(result.weekStart).toBe('2025-12-29');
      expect(result.weekEnd).toBe('2026-01-04');
      expect(result.completedMinutes).toBe(300); // 100 + 150 + 50
      expect(result.remainingMinutes).toBe(300);
      expect(result.completionPercentage).toBe(50);
      expect(result.isTargetMet).toBe(false);
    });

    it('handles leap-year February reporting week correctly', () => {
      // 2024-02-29 (Thursday): ISO week is 2024-02-26 (Mon) to 2024-03-03 (Sun)
      const sessions = [
        { studyDate: new Date('2024-02-26T00:00:00.000Z'), minutes: 120 }, // Monday (included)
        { studyDate: new Date('2024-02-29T00:00:00.000Z'), minutes: 180 }, // Leap Day (included)
        { studyDate: new Date('2024-03-03T00:00:00.000Z'), minutes: 60 },  // Sunday in March (included)
      ];

      const result = service.calculateWeeklyTarget(600, sessions, '2024-02-29');

      expect(result.weekStart).toBe('2024-02-26');
      expect(result.weekEnd).toBe('2024-03-03');
      expect(result.completedMinutes).toBe(360);
      expect(result.remainingMinutes).toBe(240);
      expect(result.completionPercentage).toBe(60);
    });

    it('handles new week with zero completed minutes while preserving target', () => {
      const result = service.calculateWeeklyTarget(600, [], REFERENCE_DATE);

      expect(result.completedMinutes).toBe(0);
      expect(result.remainingMinutes).toBe(600);
      expect(result.completionPercentage).toBe(0);
      expect(result.isTargetMet).toBe(false);
    });
  });

  describe('getWeeklyTarget', () => {
    it('returns learner weekly target metrics', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: mockLearnerUser.id,
        weeklyStudyTargetMinutes: 600,
      });

      mockPrismaService.studySession.findMany.mockResolvedValueOnce([
        {
          studyDate: new Date('2026-11-09T00:00:00.000Z'),
          minutes: 180,
        },
      ]);

      const result = await service.getWeeklyTarget(mockLearnerUser, {
        today: '2026-11-10',
      });

      expect(result.learnerId).toBe(mockLearnerUser.id);
      expect(result.targetMinutes).toBe(600);
      expect(result.completedMinutes).toBe(180);
      expect(result.remainingMinutes).toBe(420);
      expect(result.completionPercentage).toBe(30);
      expect(result.isTargetMet).toBe(false);
      expect(result.weekStart).toBe('2026-11-09');
      expect(result.weekEnd).toBe('2026-11-15');
    });

    it('allows mentor to view learner weekly target', async () => {
      mockPrismaService.user.findUnique
        .mockResolvedValueOnce({ id: mockLearnerUser.id, role: Role.LEARNER }) // resolveTargetLearnerId
        .mockResolvedValueOnce({ id: mockLearnerUser.id, weeklyStudyTargetMinutes: 750 }); // get user target

      mockPrismaService.studySession.findMany.mockResolvedValueOnce([]);

      const result = await service.getWeeklyTarget(mockMentorUser, {
        learnerId: mockLearnerUser.id,
        today: '2026-11-10',
      });

      expect(result.learnerId).toBe(mockLearnerUser.id);
      expect(result.targetMinutes).toBe(750);
      expect(result.completedMinutes).toBe(0);
      expect(result.remainingMinutes).toBe(750);
    });
  });

  describe('updateWeeklyTarget', () => {
    it('allows learner to update their own weekly study target', async () => {
      mockPrismaService.user.update.mockResolvedValueOnce({
        id: mockLearnerUser.id,
        weeklyStudyTargetMinutes: 750,
      });

      mockPrismaService.studySession.findMany.mockResolvedValueOnce([
        {
          studyDate: new Date('2026-11-09T00:00:00.000Z'),
          minutes: 300,
        },
      ]);

      const result = await service.updateWeeklyTarget(
        mockLearnerUser,
        { targetMinutes: 750 },
        { today: '2026-11-10' },
      );

      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockLearnerUser.id },
        data: { weeklyStudyTargetMinutes: 750 },
        select: { id: true, weeklyStudyTargetMinutes: true },
      });
      expect(result.targetMinutes).toBe(750);
      expect(result.completedMinutes).toBe(300);
      expect(result.remainingMinutes).toBe(450);
      expect(result.completionPercentage).toBe(40);
    });

    it('accepts weeklyStudyTargetMinutes as alias for targetMinutes', async () => {
      mockPrismaService.user.update.mockResolvedValueOnce({
        id: mockLearnerUser.id,
        weeklyStudyTargetMinutes: 900,
      });
      mockPrismaService.studySession.findMany.mockResolvedValueOnce([]);

      const result = await service.updateWeeklyTarget(
        mockLearnerUser,
        { weeklyStudyTargetMinutes: 900 },
        { today: '2026-11-10' },
      );

      expect(result.targetMinutes).toBe(900);
    });

    it('rejects conflicting targetMinutes and weeklyStudyTargetMinutes with 400 Bad Request', async () => {
      await expect(
        service.updateWeeklyTarget(mockLearnerUser, {
          targetMinutes: 600,
          weeklyStudyTargetMinutes: 900,
        }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateWeeklyTarget(mockLearnerUser, {
          targetMinutes: 600,
          weeklyStudyTargetMinutes: 900,
        }),
      ).rejects.toThrow(
        'Cannot provide conflicting values for targetMinutes and weeklyStudyTargetMinutes',
      );
    });

    it('accepts identical targetMinutes and weeklyStudyTargetMinutes without error', async () => {
      mockPrismaService.user.update.mockResolvedValueOnce({
        id: mockLearnerUser.id,
        weeklyStudyTargetMinutes: 700,
      });
      mockPrismaService.studySession.findMany.mockResolvedValueOnce([]);

      const result = await service.updateWeeklyTarget(mockLearnerUser, {
        targetMinutes: 700,
        weeklyStudyTargetMinutes: 700,
      });

      expect(result.targetMinutes).toBe(700);
    });

    it('rejects mentor attempting to update learner target with 403 Forbidden', async () => {
      await expect(
        service.updateWeeklyTarget(mockMentorUser, { targetMinutes: 750 }),
      ).rejects.toThrow(ForbiddenException);

      await expect(
        service.updateWeeklyTarget(mockMentorUser, { targetMinutes: 750 }),
      ).rejects.toThrow('Mentors are not permitted to modify learner study targets');
    });

    it('rejects missing target value with 400 Bad Request', async () => {
      await expect(
        service.updateWeeklyTarget(mockLearnerUser, {} as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects target values below 60 minutes with 400 Bad Request', async () => {
      await expect(
        service.updateWeeklyTarget(mockLearnerUser, { targetMinutes: 59 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateWeeklyTarget(mockLearnerUser, { targetMinutes: 0 }),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.updateWeeklyTarget(mockLearnerUser, { targetMinutes: -10 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects target values above 4200 minutes with 400 Bad Request', async () => {
      await expect(
        service.updateWeeklyTarget(mockLearnerUser, { targetMinutes: 4201 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects non-integer decimal target values with 400 Bad Request', async () => {
      await expect(
        service.updateWeeklyTarget(mockLearnerUser, { targetMinutes: 120.5 }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getLearnerProgress (Enriched with streak and weekly target)', () => {
    it('returns learner progress with embedded streak and weekly target calculation', async () => {
      mockPrismaService.user.findUnique.mockResolvedValueOnce({
        id: mockLearnerUser.id,
        name: 'Alex Mercer',
        email: 'alex.mercer@commit.dev',
        role: Role.LEARNER,
        weeklyStudyTargetMinutes: 600,
      });

      mockPrismaService.goal.findMany.mockResolvedValueOnce([
        {
          id: 'goal-1',
          title: 'Goal 1',
          topics: [
            { id: 't1', title: 'Topic 1', isCompleted: true, completedAt: new Date() },
          ],
        },
      ]);

      mockPrismaService.studySession.findMany.mockResolvedValueOnce([
        {
          id: 's1',
          learnerId: mockLearnerUser.id,
          topicId: 't1',
          studyDate: new Date('2026-11-09T00:00:00.000Z'),
          minutes: 60,
        },
      ]);

      const result = await service.getLearnerProgress(
        mockLearnerUser.id,
        mockLearnerUser,
        '2026-11-09',
      );

      expect(result.learner.id).toBe(mockLearnerUser.id);
      expect(result.overview.totalMinutes).toBe(60);
      expect(result.streak).toBeDefined();
      expect(result.streak.currentStreak).toBe(1);
      expect(result.streak.totalActiveDays).toBe(1);
      expect(result.weeklyTarget).toBeDefined();
      expect(result.weeklyTarget.targetMinutes).toBe(600);
      expect(result.weeklyTarget.completedMinutes).toBe(60);
      expect(result.weeklyTarget.remainingMinutes).toBe(540);
      expect(result.weeklyTarget.completionPercentage).toBe(10);
      expect(result.weeklyTarget.weekStart).toBe('2026-11-09');
      expect(result.weeklyTarget.weekEnd).toBe('2026-11-15');
    });
  });
});
