import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from './sessions.service';

describe('SessionsService', () => {
  let service: SessionsService;

  const mockLearner = {
    id: 'learner-1',
    email: 'alex@commit.dev',
    role: Role.LEARNER,
  };

  const mockTopic = {
    id: 'topic-1',
    goalId: 'goal-1',
    title: 'Topic Title',
    goal: {
      id: 'goal-1',
      learnerId: 'learner-1',
    },
  };

  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      systemSettings: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'global',
          minSessionMinutes: 5,
          maxSessionMinutes: 480,
        }),
      },
      topic: {
        findUnique: jest.fn().mockResolvedValue(mockTopic),
      },
      studySession: {
        create: jest.fn().mockImplementation(({ data }) => ({
          id: 'session-1',
          ...data,
          topic: mockTopic,
        })),
        findUnique: jest.fn(),
        findMany: jest.fn().mockResolvedValue([]),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SessionsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SessionsService>(SessionsService);
    jest.clearAllMocks();
  });

  describe('COR-03: Calendar Date and Timestamp Validation', () => {
    it('accepts yesterday as a valid historical study date', async () => {
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      const studyDate = yesterday.toISOString().slice(0, 10);

      const result = await service.create(
        {
          topicId: 'topic-1',
          studyDate,
          minutes: 45,
        },
        mockLearner,
      );

      expect(result).toHaveProperty('id', 'session-1');
      expect(mockPrismaService.studySession.create).toHaveBeenCalled();
    });

    it('accepts today (UTC midnight calendar date) as a valid study date', async () => {
      const todayUTC = new Date().toISOString().slice(0, 10);

      const result = await service.create(
        {
          topicId: 'topic-1',
          studyDate: todayUTC,
          minutes: 60,
        },
        mockLearner,
      );

      expect(result).toHaveProperty('id', 'session-1');
      expect(mockPrismaService.studySession.create).toHaveBeenCalled();
    });

    it('rejects tomorrow date (calendar future) with 400 Bad Request', async () => {
      const tomorrow = new Date();
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
      const studyDate = tomorrow.toISOString().slice(0, 10);

      await expect(
        service.create(
          {
            topicId: 'topic-1',
            studyDate,
            minutes: 60,
          },
          mockLearner,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(
          {
            topicId: 'topic-1',
            studyDate,
            minutes: 60,
          },
          mockLearner,
        ),
      ).rejects.toThrow('Study session date cannot be in the future');
    });

    it('rejects future timestamp (e.g. 2 hours ahead today) with 400 Bad Request', async () => {
      const futureTimestamp = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();

      await expect(
        service.create(
          {
            topicId: 'topic-1',
            studyDate: futureTimestamp,
            minutes: 60,
          },
          mockLearner,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create(
          {
            topicId: 'topic-1',
            studyDate: futureTimestamp,
            minutes: 60,
          },
          mockLearner,
        ),
      ).rejects.toThrow('Study session date cannot be in the future');
    });

    it('rejects invalid date string with 400 Bad Request', async () => {
      await expect(
        service.create(
          {
            topicId: 'topic-1',
            studyDate: 'not-a-valid-date',
            minutes: 60,
          },
          mockLearner,
        ),
      ).rejects.toThrow('Invalid study date format');
    });
  });

  describe('Session Filtering', () => {
    it('filters sessions by goalId for authenticated learner', async () => {
      mockPrismaService.studySession.findMany.mockResolvedValue([
        { id: 'session-1', topicId: 'topic-1', minutes: 60 },
      ]);

      const result = await service.findAll(mockLearner, {
        goalId: 'goal-1',
      });

      expect(mockPrismaService.studySession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            learnerId: mockLearner.id,
            topic: { goalId: 'goal-1' },
          }),
        }),
      );
      expect(result).toHaveLength(1);
    });

    it('filters sessions by topicId and date range', async () => {
      await service.findAll(mockLearner, {
        topicId: 'topic-1',
        startDate: '2026-10-01',
        endDate: '2026-10-31',
      });

      expect(mockPrismaService.studySession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            learnerId: mockLearner.id,
            topicId: 'topic-1',
            studyDate: {
              gte: new Date('2026-10-01'),
              lte: new Date('2026-10-31'),
            },
          }),
        }),
      );
    });

    it('throws BadRequestException if startDate > endDate', async () => {
      await expect(
        service.findAll(mockLearner, {
          startDate: '2026-11-10',
          endDate: '2026-11-01',
        }),
      ).rejects.toThrow('startDate cannot be after endDate');
    });

    it('allows mentor to filter sessions by learnerId', async () => {
      const mockMentor = {
        id: 'mentor-1',
        email: 'marcus@commit.dev',
        role: Role.MENTOR,
      };

      await service.findAll(mockMentor, {
        learnerId: 'learner-1',
      });

      expect(mockPrismaService.studySession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            learnerId: 'learner-1',
          }),
        }),
      );
    });
  });
});
