import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MentorService {
  constructor(private readonly prisma: PrismaService) {}

  async listLearners() {
    const learners = await this.prisma.user.findMany({
      where: { role: Role.LEARNER },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        goals: {
          select: {
            id: true,
            title: true,
            topics: {
              select: {
                id: true,
                isCompleted: true,
              },
            },
          },
        },
        studySessions: {
          select: {
            minutes: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return learners.map((learner) => {
      let totalTopics = 0;
      let completedTopics = 0;

      for (const goal of learner.goals) {
        totalTopics += goal.topics.length;
        completedTopics += goal.topics.filter((t) => t.isCompleted).length;
      }

      const totalMinutes = learner.studySessions.reduce(
        (sum, s) => sum + s.minutes,
        0,
      );

      return {
        id: learner.id,
        name: learner.name,
        email: learner.email,
        createdAt: learner.createdAt,
        totalGoals: learner.goals.length,
        totalTopics,
        completedTopics,
        completionPercentage:
          totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0,
        totalMinutes,
        totalHours: Number((totalMinutes / 60).toFixed(1)),
      };
    });
  }

  async getLearnerGoals(learnerId: string) {
    const learner = await this.prisma.user.findUnique({
      where: { id: learnerId },
    });

    if (!learner || learner.role !== Role.LEARNER) {
      throw new NotFoundException(`Learner with ID ${learnerId} not found`);
    }

    return this.prisma.goal.findMany({
      where: { learnerId },
      include: {
        topics: {
          orderBy: { position: 'asc' },
          include: {
            prerequisites: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getLearnerSessions(learnerId: string) {
    const learner = await this.prisma.user.findUnique({
      where: { id: learnerId },
    });

    if (!learner || learner.role !== Role.LEARNER) {
      throw new NotFoundException(`Learner with ID ${learnerId} not found`);
    }

    return this.prisma.studySession.findMany({
      where: { learnerId },
      include: {
        topic: true,
      },
      orderBy: { studyDate: 'desc' },
    });
  }
}
