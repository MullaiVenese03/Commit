import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getLearnerProgress(targetLearnerId: string, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.LEARNER && currentUser.id !== targetLearnerId) {
      throw new ForbiddenException(
        "Learners cannot view another learner's progress",
      );
    }

    const learner = await this.prisma.user.findUnique({
      where: { id: targetLearnerId },
      select: { id: true, name: true, email: true, role: true },
    });

    if (!learner) {
      throw new NotFoundException(`Learner with ID ${targetLearnerId} not found`);
    }

    const [goals, sessions] = await Promise.all([
      this.prisma.goal.findMany({
        where: { learnerId: targetLearnerId },
        include: {
          topics: {
            select: {
              id: true,
              title: true,
              isCompleted: true,
              completedAt: true,
            },
          },
        },
      }),
      this.prisma.studySession.findMany({
        where: { learnerId: targetLearnerId },
        orderBy: { studyDate: 'desc' },
      }),
    ]);

    const totalGoals = goals.length;
    let totalTopics = 0;
    let completedTopics = 0;

    for (const goal of goals) {
      totalTopics += goal.topics.length;
      completedTopics += goal.topics.filter((t) => t.isCompleted).length;
    }

    const totalMinutes = sessions.reduce((acc, curr) => acc + curr.minutes, 0);
    const totalSessions = sessions.length;
    const completionPercentage =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
      learner,
      overview: {
        totalGoals,
        totalTopics,
        completedTopics,
        remainingTopics: totalTopics - completedTopics,
        completionPercentage,
        totalMinutes,
        totalHours: Number((totalMinutes / 60).toFixed(1)),
        totalSessions,
      },
      goals: goals.map((g) => ({
        id: g.id,
        title: g.title,
        totalTopics: g.topics.length,
        completedTopics: g.topics.filter((t) => t.isCompleted).length,
        progressPercentage:
          g.topics.length > 0
            ? Math.round(
                (g.topics.filter((t) => t.isCompleted).length / g.topics.length) *
                  100,
              )
            : 0,
      })),
      recentSessions: sessions.slice(0, 10),
    };
  }
}
