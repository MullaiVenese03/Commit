import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { TopicsService } from './topics.service';

describe('TopicsService', () => {
  let service: TopicsService;

  const mockLearner = {
    id: 'learner-1',
    email: 'alex@commit.dev',
    role: Role.LEARNER,
  };

  const mockGoal = {
    id: 'goal-1',
    learnerId: 'learner-1',
    title: 'Test Goal',
  };

  let mockPrismaService: any;

  beforeEach(async () => {
    mockPrismaService = {
      goal: {
        findUnique: jest.fn().mockResolvedValue(mockGoal),
      },
      systemSettings: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'global',
          maxPrerequisitesPerTopic: 5,
        }),
      },
      topic: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        delete: jest.fn(),
      },
      topicPrerequisite: {
        findMany: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrismaService)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TopicsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TopicsService>(TopicsService);
    jest.clearAllMocks();
  });

  describe('COR-01 & COR-02: Prerequisite Graph Integrity', () => {
    it('rejects direct self-dependencies', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue({
        id: 'topic-A',
        goalId: 'goal-1',
        isCompleted: false,
        goal: mockGoal,
        prerequisites: [],
      });

      await expect(
        service.update(
          'topic-A',
          { prerequisiteTopicIds: ['topic-A'] },
          mockLearner,
        ),
      ).rejects.toThrow(BadRequestException);
      await expect(
        service.update(
          'topic-A',
          { prerequisiteTopicIds: ['topic-A'] },
          mockLearner,
        ),
      ).rejects.toThrow('A topic cannot depend on itself');
    });

    it('rejects mutual dependencies (A -> B and B -> A)', async () => {
      // Existing graph: topic-A depends on topic-B
      // Attempt to update topic-B to depend on topic-A
      mockPrismaService.topic.findUnique.mockResolvedValue({
        id: 'topic-B',
        goalId: 'goal-1',
        isCompleted: false,
        goal: mockGoal,
        prerequisites: [],
      });

      mockPrismaService.topic.findMany.mockResolvedValue([
        { id: 'topic-A', goalId: 'goal-1' },
      ]);

      mockPrismaService.topicPrerequisite.findMany.mockResolvedValue([
        { topicId: 'topic-A', prerequisiteTopicId: 'topic-B' },
      ]);

      await expect(
        service.update(
          'topic-B',
          { prerequisiteTopicIds: ['topic-A'] },
          mockLearner,
        ),
      ).rejects.toThrow('Circular dependency detected in topic prerequisites');
    });

    it('rejects multi-level cycles (A -> B -> C -> A)', async () => {
      // Existing: A depends on B, B depends on C
      // Updating C to depend on A creates A -> B -> C -> A
      mockPrismaService.topic.findUnique.mockResolvedValue({
        id: 'topic-C',
        goalId: 'goal-1',
        isCompleted: false,
        goal: mockGoal,
        prerequisites: [],
      });

      mockPrismaService.topic.findMany.mockResolvedValue([
        { id: 'topic-A', goalId: 'goal-1' },
      ]);

      mockPrismaService.topicPrerequisite.findMany.mockResolvedValue([
        { topicId: 'topic-A', prerequisiteTopicId: 'topic-B' },
        { topicId: 'topic-B', prerequisiteTopicId: 'topic-C' },
      ]);

      await expect(
        service.update(
          'topic-C',
          { prerequisiteTopicIds: ['topic-A'] },
          mockLearner,
        ),
      ).rejects.toThrow('Circular dependency detected in topic prerequisites');
    });

    it('rejects cross-goal prerequisites (COR-02)', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue({
        id: 'topic-A',
        goalId: 'goal-1',
        isCompleted: false,
        goal: mockGoal,
        prerequisites: [],
      });

      // topic-X belongs to another goal (goal-2)
      mockPrismaService.topic.findMany.mockResolvedValue([
        { id: 'topic-X', goalId: 'goal-2' },
      ]);

      await expect(
        service.update(
          'topic-A',
          { prerequisiteTopicIds: ['topic-X'] },
          mockLearner,
        ),
      ).rejects.toThrow('All prerequisite topics must belong to the same goal');
    });

    it('allows valid acyclic prerequisite chains', async () => {
      mockPrismaService.topic.findUnique.mockImplementation(({ where }: any) => ({
        id: where.id || 'topic-C',
        goalId: 'goal-1',
        isCompleted: false,
        goal: mockGoal,
        prerequisites: [],
      }));

      mockPrismaService.topic.findMany.mockResolvedValue([
        { id: 'topic-B', goalId: 'goal-1' },
      ]);

      mockPrismaService.topicPrerequisite.findMany.mockResolvedValue([
        { topicId: 'topic-B', prerequisiteTopicId: 'topic-A' },
      ]);

      // C depends on B (A -> B -> C) is valid DAG
      const result = await service.update(
        'topic-C',
        { prerequisiteTopicIds: ['topic-B'] },
        mockLearner,
      );

      expect(result).toHaveProperty('isUnlocked');
    });
  });

  describe('MED-01: Dynamic Unlocking & Dependent Re-locking', () => {
    it('computes isUnlocked=true when topic has no prerequisites', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue({
        id: 'topic-1',
        goalId: 'goal-1',
        title: 'Foundations',
        isCompleted: false,
        goal: mockGoal,
        prerequisites: [],
      });

      const topic = await service.findOne('topic-1', mockLearner);
      expect(topic.isUnlocked).toBe(true);
      expect(topic.missingPrerequisites).toEqual([]);
    });

    it('computes isUnlocked=false and returns missingPrerequisites when prerequisites are incomplete', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue({
        id: 'topic-2',
        goalId: 'goal-1',
        title: 'Advanced NestJS',
        isCompleted: false,
        goal: mockGoal,
        prerequisites: [
          {
            prerequisiteTopic: {
              id: 'topic-1',
              title: 'Foundations',
              isCompleted: false,
            },
          },
        ],
      });

      const topic = await service.findOne('topic-2', mockLearner);
      expect(topic.isUnlocked).toBe(false);
      expect(topic.missingPrerequisites).toEqual([
        { id: 'topic-1', title: 'Foundations' },
      ]);
    });

    it('computes isUnlocked=true when all prerequisites are completed', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue({
        id: 'topic-2',
        goalId: 'goal-1',
        title: 'Advanced NestJS',
        isCompleted: false,
        goal: mockGoal,
        prerequisites: [
          {
            prerequisiteTopic: {
              id: 'topic-1',
              title: 'Foundations',
              isCompleted: true,
            },
          },
        ],
      });

      const topic = await service.findOne('topic-2', mockLearner);
      expect(topic.isUnlocked).toBe(true);
      expect(topic.missingPrerequisites).toEqual([]);
    });

    it('reopening a completed topic cascades and re-locks dependent topics', async () => {
      // Completed topic-A is being reopened (isCompleted: false)
      mockPrismaService.topic.findUnique.mockImplementation(({ where }: any) => ({
        id: where.id || 'topic-A',
        goalId: 'goal-1',
        isCompleted: true, // currently completed
        goal: mockGoal,
        prerequisites: [],
      }));

      // topic-B depends on topic-A; topic-C depends on topic-B
      mockPrismaService.topicPrerequisite.findMany
        .mockResolvedValueOnce([{ topicId: 'topic-B' }]) // dependents of A
        .mockResolvedValueOnce([{ topicId: 'topic-C' }]) // dependents of B
        .mockResolvedValueOnce([]); // dependents of C

      await service.update(
        'topic-A',
        { isCompleted: false },
        mockLearner,
      );

      // Verify updateMany was called on tx.topic to re-lock topic-B and topic-C
      expect(mockPrismaService.topic.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: ['topic-B', 'topic-C'] },
          isCompleted: true,
        },
        data: {
          isCompleted: false,
          completedAt: null,
        },
      });
    });

    it('rejects attempt to complete a locked topic whose prerequisites are not yet completed', async () => {
      mockPrismaService.topic.findUnique.mockResolvedValue({
        id: 'topic-locked',
        goalId: 'goal-1',
        isCompleted: false,
        goal: mockGoal,
        prerequisites: [
          {
            prerequisiteTopic: {
              id: 'topic-prereq',
              isCompleted: false,
            },
          },
        ],
      });

      await expect(
        service.complete('topic-locked', mockLearner),
      ).rejects.toThrow(
        'Cannot complete a topic whose prerequisites are not yet completed',
      );
    });

    describe('DEF-01: Topic Reordering Validation', () => {
      it('reorders a complete list of topics successfully', async () => {
        mockPrismaService.topic.count.mockResolvedValue(2);
        mockPrismaService.topic.findMany
          .mockResolvedValueOnce([
            { id: 'topic-2', goalId: 'goal-1' },
            { id: 'topic-1', goalId: 'goal-1' },
          ])
          .mockResolvedValueOnce([
            { id: 'topic-2', goalId: 'goal-1', position: 0, prerequisites: [] },
            { id: 'topic-1', goalId: 'goal-1', position: 1, prerequisites: [] },
          ]);

        const result = await service.reorder(
          'goal-1',
          ['topic-2', 'topic-1'],
          mockLearner,
        );

        expect(mockPrismaService.topic.count).toHaveBeenCalledWith({
          where: { goalId: 'goal-1' },
        });
        expect(mockPrismaService.topic.update).toHaveBeenCalledWith({
          where: { id: 'topic-2' },
          data: { position: 0 },
        });
        expect(mockPrismaService.topic.update).toHaveBeenCalledWith({
          where: { id: 'topic-1' },
          data: { position: 1 },
        });
        expect(result).toHaveLength(2);
        expect(result[0].id).toBe('topic-2');
        expect(result[1].id).toBe('topic-1');
      });

      it('rejects a partial list when reordering topics', async () => {
        // Goal contains 3 topics, caller only provides 2
        mockPrismaService.topic.count.mockResolvedValue(3);

        await expect(
          service.reorder('goal-1', ['topic-1', 'topic-2'], mockLearner),
        ).rejects.toThrow(
          new BadRequestException(
            'Reordering requires all topic IDs for the specified goal',
          ),
        );

        expect(mockPrismaService.topic.update).not.toHaveBeenCalled();
      });

      it('rejects duplicate IDs when reordering topics', async () => {
        // Goal contains 2 topics, caller provides ['topic-1', 'topic-1']
        mockPrismaService.topic.count.mockResolvedValue(2);
        // findMany returns only 1 row due to SQL deduplication of in: ['topic-1', 'topic-1']
        mockPrismaService.topic.findMany.mockResolvedValueOnce([
          { id: 'topic-1', goalId: 'goal-1' },
        ]);

        await expect(
          service.reorder('goal-1', ['topic-1', 'topic-1'], mockLearner),
        ).rejects.toThrow(
          new BadRequestException(
            'All topics to reorder must exist and belong to the specified goal',
          ),
        );

        expect(mockPrismaService.topic.update).not.toHaveBeenCalled();
      });

      it('rejects topic IDs belonging to another goal', async () => {
        // Goal-1 contains 2 topics, caller provides ['topic-1', 'topic-other-goal']
        mockPrismaService.topic.count.mockResolvedValue(2);
        // findMany with where { goalId: 'goal-1' } only finds topic-1
        mockPrismaService.topic.findMany.mockResolvedValueOnce([
          { id: 'topic-1', goalId: 'goal-1' },
        ]);

        await expect(
          service.reorder('goal-1', ['topic-1', 'topic-other-goal'], mockLearner),
        ).rejects.toThrow(
          new BadRequestException(
            'All topics to reorder must exist and belong to the specified goal',
          ),
        );

        expect(mockPrismaService.topic.update).not.toHaveBeenCalled();
      });

      it('rejects an empty list when the goal contains topics', async () => {
        // Goal contains 2 topics, caller provides []
        mockPrismaService.topic.count.mockResolvedValue(2);

        await expect(
          service.reorder('goal-1', [], mockLearner),
        ).rejects.toThrow(
          new BadRequestException(
            'Reordering requires all topic IDs for the specified goal',
          ),
        );

        expect(mockPrismaService.topic.update).not.toHaveBeenCalled();
      });

      it('behaves consistently when reordering an empty goal with empty list', async () => {
        // Goal contains 0 topics, caller provides []
        mockPrismaService.topic.count.mockResolvedValue(0);
        mockPrismaService.topic.findMany
          .mockResolvedValueOnce([])
          .mockResolvedValueOnce([]);

        const result = await service.reorder('goal-1', [], mockLearner);

        expect(result).toEqual([]);
        expect(mockPrismaService.topic.update).not.toHaveBeenCalled();
      });

      it('leaves all original positions unchanged when reordering fails', async () => {
        mockPrismaService.topic.count.mockResolvedValue(3);

        await expect(
          service.reorder('goal-1', ['topic-1'], mockLearner),
        ).rejects.toThrow(
          'Reordering requires all topic IDs for the specified goal',
        );

        expect(mockPrismaService.topic.update).not.toHaveBeenCalled();
        expect(mockPrismaService.topic.updateMany).not.toHaveBeenCalled();
      });
    });
  });
});
