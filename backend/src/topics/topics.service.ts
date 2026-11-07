import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateTopicDto } from './dto/create-topic.dto';
import { UpdateTopicDto } from './dto/update-topic.dto';

export interface MissingPrerequisite {
  id: string;
  title: string;
}

export interface EnrichedTopic {
  id: string;
  goalId: string;
  title: string;
  description: string | null;
  position: number;
  isCompleted: boolean;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  isUnlocked: boolean;
  missingPrerequisites: MissingPrerequisite[];
  prerequisites?: any[];
  dependents?: any[];
  studySessions?: any[];
  goal?: any;
}

@Injectable()
export class TopicsService {
  constructor(private readonly prisma: PrismaService) {}

  private enrichTopic(topic: any): EnrichedTopic {
    const incompletePrereqs = (topic.prerequisites || []).filter(
      (p: any) => p.prerequisiteTopic && !p.prerequisiteTopic.isCompleted,
    );
    const isUnlocked = incompletePrereqs.length === 0;
    const missingPrerequisites: MissingPrerequisite[] = incompletePrereqs.map(
      (p: any) => ({
        id: p.prerequisiteTopic.id,
        title: p.prerequisiteTopic.title,
      }),
    );

    return {
      ...topic,
      isUnlocked,
      missingPrerequisites,
    };
  }

  private async validatePrerequisites(
    tx: any,
    goalId: string,
    topicId: string | null,
    prerequisiteTopicIds: string[],
    maxPrereqs: number,
  ): Promise<void> {
    if (prerequisiteTopicIds.length > maxPrereqs) {
      throw new BadRequestException(
        `A topic cannot have more than ${maxPrereqs} prerequisites`,
      );
    }

    if (new Set(prerequisiteTopicIds).size !== prerequisiteTopicIds.length) {
      throw new BadRequestException(
        'Duplicate prerequisite topics are not allowed',
      );
    }

    if (topicId && prerequisiteTopicIds.includes(topicId)) {
      throw new BadRequestException('A topic cannot depend on itself');
    }

    if (prerequisiteTopicIds.length === 0) {
      return;
    }

    // COR-02: Verify prerequisite topics exist and belong strictly to the same goal
    const prereqTopics = await tx.topic.findMany({
      where: { id: { in: prerequisiteTopicIds } },
      select: { id: true, goalId: true },
    });

    if (prereqTopics.length !== prerequisiteTopicIds.length) {
      throw new BadRequestException(
        'One or more prerequisite topics do not exist',
      );
    }

    for (const pt of prereqTopics) {
      if (pt.goalId !== goalId) {
        throw new BadRequestException(
          'All prerequisite topics must belong to the same goal',
        );
      }
    }

    // COR-01: Circular dependency detection using DFS cycle check on the proposed DAG
    const existingPrereqs = await tx.topicPrerequisite.findMany({
      where: {
        topic: { goalId },
      },
      select: {
        topicId: true,
        prerequisiteTopicId: true,
      },
    });

    // Build adjacency list: node -> array of prerequisites it depends on
    const adj = new Map<string, string[]>();

    for (const edge of existingPrereqs) {
      if (topicId && edge.topicId === topicId) {
        continue; // Replace existing prerequisites of the updated topic
      }
      if (!adj.has(edge.topicId)) {
        adj.set(edge.topicId, []);
      }
      adj.get(edge.topicId)!.push(edge.prerequisiteTopicId);
    }

    const currentId = topicId || '__NEW_TOPIC__';
    adj.set(currentId, [...prerequisiteTopicIds]);

    // DFS 3-state cycle detection: 0 = unvisited, 1 = visiting, 2 = visited
    const state = new Map<string, number>();

    const checkCycle = (node: string): boolean => {
      state.set(node, 1);
      const neighbors = adj.get(node) || [];
      for (const neighbor of neighbors) {
        const neighborState = state.get(neighbor) || 0;
        if (neighborState === 1) {
          return true; // Cycle detected
        }
        if (neighborState === 0) {
          if (checkCycle(neighbor)) {
            return true;
          }
        }
      }
      state.set(node, 2);
      return false;
    };

    for (const node of adj.keys()) {
      if ((state.get(node) || 0) === 0) {
        if (checkCycle(node)) {
          throw new BadRequestException(
            'Circular dependency detected in topic prerequisites',
          );
        }
      }
    }
  }

  private async getTransitiveDependents(
    tx: any,
    rootTopicId: string,
  ): Promise<string[]> {
    const visited = new Set<string>();
    const queue = [rootTopicId];
    const dependents: string[] = [];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const rows = await tx.topicPrerequisite.findMany({
        where: { prerequisiteTopicId: currentId },
        select: { topicId: true },
      });

      for (const row of rows) {
        if (!visited.has(row.topicId)) {
          visited.add(row.topicId);
          dependents.push(row.topicId);
          queue.push(row.topicId);
        }
      }
    }

    return dependents;
  }

  async findByGoal(goalId: string, currentUser: CurrentUserPayload) {
    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    if (currentUser.role === Role.LEARNER && goal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot access another learner's topics",
      );
    }

    const topics = await this.prisma.topic.findMany({
      where: { goalId },
      include: {
        prerequisites: {
          include: {
            prerequisiteTopic: {
              select: { id: true, title: true, isCompleted: true },
            },
          },
        },
        dependents: {
          include: {
            topic: {
              select: { id: true, title: true, isCompleted: true },
            },
          },
        },
      },
      orderBy: { position: 'asc' },
    });

    return topics.map((t) => this.enrichTopic(t));
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        goal: true,
        prerequisites: {
          include: {
            prerequisiteTopic: {
              select: { id: true, title: true, isCompleted: true },
            },
          },
        },
        dependents: {
          include: {
            topic: {
              select: { id: true, title: true, isCompleted: true },
            },
          },
        },
        studySessions: {
          orderBy: { studyDate: 'desc' },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    if (currentUser.role === Role.LEARNER && topic.goal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot access another learner's topic",
      );
    }

    return this.enrichTopic(topic);
  }

  async create(dto: CreateTopicDto, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to modify learner records',
      );
    }

    const goal = await this.prisma.goal.findUnique({
      where: { id: dto.goalId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${dto.goalId} not found`);
    }

    if (goal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot add topics to another learner's goal",
      );
    }

    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'global' },
    });
    const maxPrereqs = settings?.maxPrerequisitesPerTopic ?? 5;

    return this.prisma.$transaction(async (tx: any) => {
      if (dto.prerequisiteTopicIds && dto.prerequisiteTopicIds.length > 0) {
        await this.validatePrerequisites(
          tx,
          dto.goalId,
          null,
          dto.prerequisiteTopicIds,
          maxPrereqs,
        );
      }

      const topic = await tx.topic.create({
        data: {
          goalId: dto.goalId,
          title: dto.title.trim(),
          description: dto.description?.trim(),
          position: dto.position ?? 0,
        },
      });

      if (dto.prerequisiteTopicIds && dto.prerequisiteTopicIds.length > 0) {
        for (const prereqId of dto.prerequisiteTopicIds) {
          await tx.topicPrerequisite.create({
            data: {
              topicId: topic.id,
              prerequisiteTopicId: prereqId,
            },
          });
        }
      }

      const created = await tx.topic.findUnique({
        where: { id: topic.id },
        include: {
          prerequisites: {
            include: {
              prerequisiteTopic: {
                select: { id: true, title: true, isCompleted: true },
              },
            },
          },
          dependents: {
            include: {
              topic: {
                select: { id: true, title: true, isCompleted: true },
              },
            },
          },
        },
      });

      return this.enrichTopic(created);
    });
  }

  async update(id: string, dto: UpdateTopicDto, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to modify learner records',
      );
    }

    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: {
        goal: true,
        prerequisites: {
          include: {
            prerequisiteTopic: true,
          },
        },
      },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    if (topic.goal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot modify another learner's topic",
      );
    }

    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'global' },
    });
    const maxPrereqs = settings?.maxPrerequisitesPerTopic ?? 5;

    // Check if user is attempting to mark a topic completed when prerequisites are incomplete
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

    let completedAt = topic.completedAt;
    if (dto.isCompleted !== undefined) {
      if (dto.isCompleted && !topic.isCompleted) {
        completedAt = new Date();
      } else if (!dto.isCompleted) {
        completedAt = null;
      }
    }

    return this.prisma.$transaction(async (tx: any) => {
      if (dto.prerequisiteTopicIds !== undefined) {
        await this.validatePrerequisites(
          tx,
          topic.goalId,
          id,
          dto.prerequisiteTopicIds,
          maxPrereqs,
        );

        await tx.topicPrerequisite.deleteMany({
          where: { topicId: id },
        });

        for (const prereqId of dto.prerequisiteTopicIds) {
          await tx.topicPrerequisite.create({
            data: {
              topicId: id,
              prerequisiteTopicId: prereqId,
            },
          });
        }
      }

      // MED-01: When a completed topic is reopened, recursively identify and re-lock dependent topics
      if (topic.isCompleted && dto.isCompleted === false) {
        const dependentIds = await this.getTransitiveDependents(tx, id);
        if (dependentIds.length > 0) {
          await tx.topic.updateMany({
            where: {
              id: { in: dependentIds },
              isCompleted: true,
            },
            data: {
              isCompleted: false,
              completedAt: null,
            },
          });
        }
      }

      await tx.topic.update({
        where: { id },
        data: {
          ...(dto.title ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
          ...(dto.position !== undefined ? { position: dto.position } : {}),
          ...(dto.isCompleted !== undefined ? { isCompleted: dto.isCompleted } : {}),
          completedAt,
        },
      });

      const updated = await tx.topic.findUnique({
        where: { id },
        include: {
          prerequisites: {
            include: {
              prerequisiteTopic: {
                select: { id: true, title: true, isCompleted: true },
              },
            },
          },
          dependents: {
            include: {
              topic: {
                select: { id: true, title: true, isCompleted: true },
              },
            },
          },
        },
      });

      return this.enrichTopic(updated);
    });
  }

  async complete(id: string, currentUser: CurrentUserPayload) {
    return this.update(id, { isCompleted: true }, currentUser);
  }

  async reopen(id: string, currentUser: CurrentUserPayload) {
    return this.update(id, { isCompleted: false }, currentUser);
  }

  async reorder(
    goalId: string,
    topicIds: string[],
    currentUser: CurrentUserPayload,
  ) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to modify learner records',
      );
    }

    const goal = await this.prisma.goal.findUnique({
      where: { id: goalId },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${goalId} not found`);
    }

    if (goal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot reorder topics in another learner's goal",
      );
    }

    return this.prisma.$transaction(async (tx: any) => {
      const totalTopics = await tx.topic.count({
        where: { goalId },
      });

      if (topicIds.length !== totalTopics) {
        throw new BadRequestException(
          'Reordering requires all topic IDs for the specified goal',
        );
      }

      const existingTopics = await tx.topic.findMany({
        where: { id: { in: topicIds }, goalId },
        select: { id: true },
      });

      if (existingTopics.length !== topicIds.length) {
        throw new BadRequestException(
          'All topics to reorder must exist and belong to the specified goal',
        );
      }

      for (let i = 0; i < topicIds.length; i++) {
        await tx.topic.update({
          where: { id: topicIds[i] },
          data: { position: i },
        });
      }

      const reordered = await tx.topic.findMany({
        where: { goalId },
        include: {
          prerequisites: {
            include: {
              prerequisiteTopic: {
                select: { id: true, title: true, isCompleted: true },
              },
            },
          },
          dependents: {
            include: {
              topic: {
                select: { id: true, title: true, isCompleted: true },
              },
            },
          },
        },
        orderBy: { position: 'asc' },
      });

      return reordered.map((t: any) => this.enrichTopic(t));
    });
  }

  async remove(id: string, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to delete learner records',
      );
    }

    const topic = await this.prisma.topic.findUnique({
      where: { id },
      include: { goal: true },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${id} not found`);
    }

    if (topic.goal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot delete another learner's topic",
      );
    }

    return this.prisma.topic.delete({
      where: { id },
    });
  }
}
