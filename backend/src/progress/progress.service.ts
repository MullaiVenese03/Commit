import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { GetActivityDto } from './dto/get-activity.dto';
import { GetStreaksDto } from './dto/get-streaks.dto';
import { GetWeeklyTargetDto } from './dto/get-weekly-target.dto';
import { UpdateWeeklyTargetDto } from './dto/update-weekly-target.dto';
import {
  extractNominalDate,
  getCalendarDaysDiff,
  getIsoWeekBounds,
  getTodayCalendarDate,
  isValidCalendarDate,
  shiftCalendarDate,
} from './utils/date.util';
import {
  calculateStreakAndActivity,
  SessionRecord,
} from './utils/streak-calculator.util';

export interface WeeklyTargetMetrics {
  targetMinutes: number;
  completedMinutes: number;
  remainingMinutes: number;
  completionPercentage: number;
  isTargetMet: boolean;
  weekStart: string;
  weekEnd: string;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resolves target learner ID and validates learner/mentor authorization boundaries.
   * - Learners can only view their own activity/streaks/targets.
   * - Mentors can view any learner's activity/streaks/targets by providing learnerId.
   */
  async resolveTargetLearnerId(
    currentUser: CurrentUserPayload,
    requestedLearnerId?: string,
  ): Promise<string> {
    if (currentUser.role === Role.LEARNER) {
      if (requestedLearnerId && requestedLearnerId !== currentUser.id) {
        throw new ForbiddenException(
          "Learners cannot view another learner's progress",
        );
      }
      return currentUser.id;
    }

    if (currentUser.role === Role.MENTOR) {
      if (!requestedLearnerId) {
        throw new BadRequestException(
          'learnerId query parameter is required for mentors',
        );
      }

      const learner = await this.prisma.user.findUnique({
        where: { id: requestedLearnerId },
        select: { id: true, role: true },
      });

      if (!learner || learner.role !== Role.LEARNER) {
        throw new NotFoundException(
          `Learner with ID ${requestedLearnerId} not found`,
        );
      }

      return requestedLearnerId;
    }

    throw new ForbiddenException('Access denied: unrecognized user role');
  }

  /**
   * Validates and normalizes reference browser-local today date.
   */
  private validateReferenceToday(todayParam?: string): string {
    if (!todayParam) {
      return getTodayCalendarDate();
    }

    if (!isValidCalendarDate(todayParam)) {
      throw new BadRequestException(
        'Invalid calendar date for today parameter. Expected valid YYYY-MM-DD.',
      );
    }

    return todayParam;
  }

  /**
   * Pure calculation helper for weekly target metrics.
   * Uses Monday-to-Sunday ISO week boundaries.
   */
  calculateWeeklyTarget(
    targetMinutes: number,
    sessions: SessionRecord[],
    referenceToday: string,
  ): WeeklyTargetMetrics {
    const { weekStart, weekEnd } = getIsoWeekBounds(referenceToday);

    // Sum session minutes where nominal calendar date falls within [weekStart, weekEnd]
    let completedMinutes = 0;
    for (const session of sessions) {
      if (session.minutes <= 0) continue;
      const dateStr = extractNominalDate(session.studyDate);
      if (dateStr >= weekStart && dateStr <= weekEnd) {
        completedMinutes += session.minutes;
      }
    }

    const remainingMinutes = Math.max(0, targetMinutes - completedMinutes);
    const completionPercentage =
      targetMinutes > 0
        ? Math.min(100, Math.round((completedMinutes / targetMinutes) * 100))
        : 0;
    const isTargetMet = completedMinutes >= targetMinutes;

    return {
      targetMinutes,
      completedMinutes,
      remainingMinutes,
      completionPercentage,
      isTargetMet,
      weekStart,
      weekEnd,
    };
  }

  /**
   * Get streaks for current learner or specified learner (Mentor).
   */
  async getStreaks(currentUser: CurrentUserPayload, query: GetStreaksDto) {
    const targetLearnerId = await this.resolveTargetLearnerId(
      currentUser,
      query.learnerId,
    );
    const referenceToday = this.validateReferenceToday(query.today);

    const sessions = await this.prisma.studySession.findMany({
      where: { learnerId: targetLearnerId },
      select: { studyDate: true, minutes: true },
      orderBy: { studyDate: 'desc' },
    });

    const { streaks } = calculateStreakAndActivity(sessions, referenceToday);

    return {
      learnerId: targetLearnerId,
      ...streaks,
    };
  }

  /**
   * Get daily study activity / heatmap for current learner or specified learner (Mentor).
   */
  async getActivity(currentUser: CurrentUserPayload, query: GetActivityDto) {
    const targetLearnerId = await this.resolveTargetLearnerId(
      currentUser,
      query.learnerId,
    );
    const referenceToday = this.validateReferenceToday(query.today);

    if (query.startDate && !isValidCalendarDate(query.startDate)) {
      throw new BadRequestException(
        'Invalid calendar date for startDate parameter. Expected valid YYYY-MM-DD.',
      );
    }

    if (query.endDate && !isValidCalendarDate(query.endDate)) {
      throw new BadRequestException(
        'Invalid calendar date for endDate parameter. Expected valid YYYY-MM-DD.',
      );
    }

    let startDate = query.startDate;
    let endDate = query.endDate;

    if (startDate && endDate) {
      if (startDate > endDate) {
        throw new BadRequestException('startDate cannot be after endDate');
      }

      const diff = getCalendarDaysDiff(startDate, endDate);
      if (diff > 366) {
        throw new BadRequestException(
          'Date range cannot exceed 366 calendar days',
        );
      }
    } else if (startDate && !endDate) {
      endDate = shiftCalendarDate(startDate, 364);
    } else if (!startDate && endDate) {
      startDate = shiftCalendarDate(endDate, -364);
    } else {
      endDate = referenceToday;
      startDate = shiftCalendarDate(endDate, -364);
    }

    const sessions = await this.prisma.studySession.findMany({
      where: { learnerId: targetLearnerId },
      select: { studyDate: true, minutes: true },
      orderBy: { studyDate: 'desc' },
    });

    const { activity } = calculateStreakAndActivity(sessions, referenceToday, {
      startDate,
      endDate,
    });

    return {
      learnerId: targetLearnerId,
      ...activity,
    };
  }

  /**
   * Get weekly study target and current-week progress.
   * Learners view own; Mentors can view any learner with learnerId.
   */
  async getWeeklyTarget(
    currentUser: CurrentUserPayload,
    query: GetWeeklyTargetDto,
  ) {
    const targetLearnerId = await this.resolveTargetLearnerId(
      currentUser,
      query.learnerId,
    );
    const referenceToday = this.validateReferenceToday(query.today);

    const user = await this.prisma.user.findUnique({
      where: { id: targetLearnerId },
      select: { id: true, weeklyStudyTargetMinutes: true },
    });

    if (!user) {
      throw new NotFoundException(`Learner with ID ${targetLearnerId} not found`);
    }

    const { weekStart, weekEnd } = getIsoWeekBounds(referenceToday);

    const sessions = await this.prisma.studySession.findMany({
      where: {
        learnerId: targetLearnerId,
        studyDate: {
          gte: new Date(weekStart),
          lte: new Date(weekEnd),
        },
      },
      select: { studyDate: true, minutes: true },
      orderBy: { studyDate: 'desc' },
    });

    const targetMetrics = this.calculateWeeklyTarget(
      user.weeklyStudyTargetMinutes,
      sessions,
      referenceToday,
    );

    return {
      learnerId: targetLearnerId,
      ...targetMetrics,
    };
  }

  /**
   * Update weekly study target.
   * Only learners can update their own weekly study target. Mentors forbidden.
   */
  async updateWeeklyTarget(
    currentUser: CurrentUserPayload,
    dto: UpdateWeeklyTargetDto,
    query?: GetWeeklyTargetDto,
  ) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to modify learner study targets',
      );
    }

    const hasTargetMinutes = dto.targetMinutes !== undefined;
    const hasWeeklyStudyTargetMinutes =
      dto.weeklyStudyTargetMinutes !== undefined;

    if (
      hasTargetMinutes &&
      hasWeeklyStudyTargetMinutes &&
      dto.targetMinutes !== dto.weeklyStudyTargetMinutes
    ) {
      throw new BadRequestException(
        'Cannot provide conflicting values for targetMinutes and weeklyStudyTargetMinutes',
      );
    }

    const newTarget = dto.targetMinutes ?? dto.weeklyStudyTargetMinutes;

    if (newTarget === undefined) {
      throw new BadRequestException('targetMinutes is required');
    }

    if (
      !Number.isInteger(newTarget) ||
      typeof newTarget !== 'number'
    ) {
      throw new BadRequestException('targetMinutes must be an integer');
    }

    if (newTarget < 60 || newTarget > 4200) {
      throw new BadRequestException(
        'Weekly target must be between 60 and 4,200 minutes (1 to 70 hours)',
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: currentUser.id },
      data: {
        weeklyStudyTargetMinutes: newTarget,
      },
      select: { id: true, weeklyStudyTargetMinutes: true },
    });

    const referenceToday = this.validateReferenceToday(query?.today);
    const { weekStart, weekEnd } = getIsoWeekBounds(referenceToday);

    const sessions = await this.prisma.studySession.findMany({
      where: {
        learnerId: currentUser.id,
        studyDate: {
          gte: new Date(`${weekStart}T00:00:00.000Z`),
          lte: new Date(`${weekEnd}T23:59:59.999Z`),
        },
      },
      select: { studyDate: true, minutes: true },
      orderBy: { studyDate: 'desc' },
    });

    const targetMetrics = this.calculateWeeklyTarget(
      updatedUser.weeklyStudyTargetMinutes,
      sessions,
      referenceToday,
    );

    return {
      learnerId: currentUser.id,
      ...targetMetrics,
    };
  }

  /**
   * Progress summary method enriched with streak and weekly target calculations.
   */
  async getLearnerProgress(
    targetLearnerId: string,
    currentUser: CurrentUserPayload,
    todayParam?: string,
  ) {
    if (currentUser.role === Role.LEARNER && currentUser.id !== targetLearnerId) {
      throw new ForbiddenException(
        "Learners cannot view another learner's progress",
      );
    }

    const learner = await this.prisma.user.findUnique({
      where: { id: targetLearnerId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        weeklyStudyTargetMinutes: true,
      },
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

    const referenceToday = this.validateReferenceToday(todayParam);
    const { streaks } = calculateStreakAndActivity(sessions, referenceToday);
    const weeklyTarget = this.calculateWeeklyTarget(
      learner.weeklyStudyTargetMinutes,
      sessions,
      referenceToday,
    );

    return {
      learner: {
        id: learner.id,
        name: learner.name,
        email: learner.email,
        role: learner.role,
      },
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
      streak: streaks,
      weeklyTarget,
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
