import { ForbiddenException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { GoalsService } from './goals.service';

describe('GoalsService Authorization', () => {
  let service: GoalsService;

  const mockPrismaService = {
    goal: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const learner1 = {
    id: 'learner-1-id',
    email: 'alex.mercer@commit.dev',
    name: 'Alex Mercer',
    role: Role.LEARNER,
  };

  const learner2 = {
    id: 'learner-2-id',
    email: 'samantha.reed@commit.dev',
    name: 'Samantha Reed',
    role: Role.LEARNER,
  };

  const mentor = {
    id: 'mentor-1-id',
    email: 'marcus.vance@commit.dev',
    name: 'Dr. Marcus Vance',
    role: Role.MENTOR,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoalsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GoalsService>(GoalsService);
    jest.clearAllMocks();
  });

  describe('findOne', () => {
    it('allows a learner to access their own goal and computes topic unlock status', async () => {
      mockPrismaService.goal.findUnique.mockResolvedValue({
        id: 'goal-1',
        learnerId: learner1.id,
        title: 'Goal 1',
        topics: [
          {
            id: 'topic-1',
            title: 'Base Topic',
            isCompleted: true,
            prerequisites: [],
          },
          {
            id: 'topic-2',
            title: 'Dependent Topic',
            isCompleted: false,
            prerequisites: [
              {
                prerequisiteTopic: {
                  id: 'topic-1',
                  title: 'Base Topic',
                  isCompleted: true,
                },
              },
            ],
          },
        ],
      });

      const result = await service.findOne('goal-1', learner1);
      expect(result.id).toBe('goal-1');
      expect(result.topics[0].isUnlocked).toBe(true);
      expect(result.topics[1].isUnlocked).toBe(true);
    });

    it("prevents a learner from accessing another learner's goal", async () => {
      mockPrismaService.goal.findUnique.mockResolvedValue({
        id: 'goal-1',
        learnerId: learner1.id,
        title: 'Goal 1',
        topics: [],
      });

      await expect(service.findOne('goal-1', learner2)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it("allows a mentor to view any learner's goal", async () => {
      mockPrismaService.goal.findUnique.mockResolvedValue({
        id: 'goal-1',
        learnerId: learner1.id,
        title: 'Goal 1',
        topics: [],
      });

      const result = await service.findOne('goal-1', mentor);
      expect(result.id).toBe('goal-1');
    });
  });

  describe('update', () => {
    it('allows a learner to update their own goal', async () => {
      mockPrismaService.goal.findUnique.mockResolvedValue({
        id: 'goal-1',
        learnerId: learner1.id,
      });
      mockPrismaService.goal.update.mockResolvedValue({
        id: 'goal-1',
        title: 'Updated Title',
        topics: [],
      });

      const result = await service.update(
        'goal-1',
        { title: 'Updated Title' },
        learner1,
      );
      expect(result.title).toBe('Updated Title');
    });

    it("prevents a learner from updating another learner's goal", async () => {
      mockPrismaService.goal.findUnique.mockResolvedValue({
        id: 'goal-1',
        learnerId: learner1.id,
      });

      await expect(
        service.update('goal-1', { title: 'Hacked' }, learner2),
      ).rejects.toThrow(ForbiddenException);
    });

    it('prevents mentors from modifying learner records', async () => {
      await expect(
        service.update('goal-1', { title: 'Mentor Edit' }, mentor),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('allows a learner to delete their own goal', async () => {
      mockPrismaService.goal.findUnique.mockResolvedValue({
        id: 'goal-1',
        learnerId: learner1.id,
      });
      mockPrismaService.goal.delete.mockResolvedValue({ id: 'goal-1' });

      const result = await service.remove('goal-1', learner1);
      expect(result).toHaveProperty('id', 'goal-1');
    });

    it("prevents a learner from deleting another learner's goal", async () => {
      mockPrismaService.goal.findUnique.mockResolvedValue({
        id: 'goal-1',
        learnerId: learner1.id,
      });

      await expect(service.remove('goal-1', learner2)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('prevents mentors from deleting learner records', async () => {
      await expect(service.remove('goal-1', mentor)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });
});
