import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';

@Injectable()
export class GoalsService {
  constructor(private readonly prisma: PrismaService) {}

  private enrichGoalTopics(topics: any[]) {
    return topics.map((t) => {
      const incompletePrereqs = (t.prerequisites || []).filter(
        (p: any) => p.prerequisiteTopic && !p.prerequisiteTopic.isCompleted,
      );
      const isUnlocked = incompletePrereqs.length === 0;
      const missingPrerequisites = incompletePrereqs.map((p: any) => ({
        id: p.prerequisiteTopic.id,
        title: p.prerequisiteTopic.title,
      }));
      return {
        ...t,
        isUnlocked,
        missingPrerequisites,
      };
    });
  }

  async findAll(currentUser: CurrentUserPayload, learnerIdQuery?: string) {
    const topicInclude = {
      orderBy: { position: 'asc' as const },
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
    };

    if (currentUser.role === Role.LEARNER) {
      // Learners can only list their own goals
      const goals = await this.prisma.goal.findMany({
        where: { learnerId: currentUser.id },
        include: {
          topics: topicInclude,
        },
        orderBy: { createdAt: 'desc' },
      });

      return goals.map((g: any) => ({
        ...g,
        topics: this.enrichGoalTopics(g.topics || []),
      }));
    }

    // Mentors can list all goals or filter by learner
    const goals = await this.prisma.goal.findMany({
      where: learnerIdQuery ? { learnerId: learnerIdQuery } : undefined,
      include: {
        learner: {
          select: { id: true, name: true, email: true },
        },
        topics: topicInclude,
      },
      orderBy: { createdAt: 'desc' },
    });

    return goals.map((g: any) => ({
      ...g,
      topics: this.enrichGoalTopics(g.topics || []),
    }));
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const goal = await this.prisma.goal.findUnique({
      where: { id },
      include: {
        learner: {
          select: { id: true, name: true, email: true },
        },
        topics: {
          orderBy: { position: 'asc' },
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
        },
      },
    });

    if (!goal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    if (currentUser.role === Role.LEARNER && goal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot access another learner's goals",
      );
    }

    return {
      ...goal,
      topics: this.enrichGoalTopics(goal.topics || []),
    };
  }

  async create(dto: CreateGoalDto, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to create learner goals',
      );
    }

    return this.prisma.goal.create({
      data: {
        title: dto.title.trim(),
        description: dto.description?.trim(),
        learnerId: currentUser.id,
      },
      include: {
        topics: true,
      },
    });
  }

  async update(id: string, dto: UpdateGoalDto, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to modify learner records',
      );
    }

    const existingGoal = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    if (existingGoal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot modify another learner's goals",
      );
    }

    return this.prisma.goal.update({
      where: { id },
      data: {
        ...(dto.title ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description?.trim() } : {}),
      },
      include: {
        topics: true,
      },
    });
  }

  async remove(id: string, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to delete learner records',
      );
    }

    const existingGoal = await this.prisma.goal.findUnique({
      where: { id },
    });

    if (!existingGoal) {
      throw new NotFoundException(`Goal with ID ${id} not found`);
    }

    if (existingGoal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot delete another learner's goals",
      );
    }

    return this.prisma.goal.delete({
      where: { id },
    });
  }
}
