import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { CreateSessionDto } from './dto/create-session.dto';
import { FilterSessionsDto } from './dto/filter-sessions.dto';
import { UpdateSessionDto } from './dto/update-session.dto';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(currentUser: CurrentUserPayload, filter?: FilterSessionsDto) {
    if (filter?.startDate && filter?.endDate) {
      const start = new Date(filter.startDate);
      const end = new Date(filter.endDate);
      if (start > end) {
        throw new BadRequestException('startDate cannot be after endDate');
      }
    }

    const where: any = {};

    if (currentUser.role === Role.LEARNER) {
      where.learnerId = currentUser.id;
    } else if (filter?.learnerId) {
      where.learnerId = filter.learnerId;
    }

    if (filter?.topicId) {
      where.topicId = filter.topicId;
    }

    if (filter?.goalId) {
      where.topic = {
        goalId: filter.goalId,
      };
    }

    if (filter?.startDate || filter?.endDate) {
      where.studyDate = {};
      if (filter.startDate) {
        where.studyDate.gte = new Date(filter.startDate);
      }
      if (filter.endDate) {
        where.studyDate.lte = new Date(filter.endDate);
      }
    }

    return this.prisma.studySession.findMany({
      where,
      include: {
        learner: {
          select: { id: true, name: true, email: true },
        },
        topic: {
          select: {
            id: true,
            title: true,
            goalId: true,
            goal: {
              select: { id: true, title: true },
            },
          },
        },
      },
      orderBy: { studyDate: 'desc' },
    });
  }

  async findOne(id: string, currentUser: CurrentUserPayload) {
    const session = await this.prisma.studySession.findUnique({
      where: { id },
      include: {
        learner: {
          select: { id: true, name: true, email: true },
        },
        topic: {
          include: { goal: true },
        },
      },
    });

    if (!session) {
      throw new NotFoundException(`Study session with ID ${id} not found`);
    }

    if (currentUser.role === Role.LEARNER && session.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot access another learner's study session",
      );
    }

    return session;
  }

  private validateAndParseStudyDate(studyDateStr: string): Date {
    const parsedDate = new Date(studyDateStr);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException('Invalid study date format');
    }

    const now = new Date();
    // Strict UTC calendar-date comparison: do not allow tomorrow or subsequent days
    const todayUTCStr = now.toISOString().slice(0, 10);
    const sessionUTCStr = parsedDate.toISOString().slice(0, 10);

    if (sessionUTCStr > todayUTCStr) {
      throw new BadRequestException('Study session date cannot be in the future');
    }

    // Reject future timestamps
    if (parsedDate.getTime() > now.getTime()) {
      throw new BadRequestException('Study session date cannot be in the future');
    }

    return parsedDate;
  }

  async create(dto: CreateSessionDto, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to modify learner records',
      );
    }

    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'global' },
    });
    const minMins = settings?.minSessionMinutes ?? 5;
    const maxMins = settings?.maxSessionMinutes ?? 480;

    if (dto.minutes < minMins || dto.minutes > maxMins) {
      throw new BadRequestException(
        `Session duration must be between ${minMins} and ${maxMins} minutes`,
      );
    }

    const parsedDate = this.validateAndParseStudyDate(dto.studyDate);

    const topic = await this.prisma.topic.findUnique({
      where: { id: dto.topicId },
      include: { goal: true },
    });

    if (!topic) {
      throw new NotFoundException(`Topic with ID ${dto.topicId} not found`);
    }

    if (topic.goal.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot log study sessions for another learner's topic",
      );
    }

    return this.prisma.studySession.create({
      data: {
        learnerId: currentUser.id,
        topicId: dto.topicId,
        studyDate: parsedDate,
        minutes: dto.minutes,
        note: dto.note?.trim(),
      },
      include: {
        topic: true,
      },
    });
  }

  async update(id: string, dto: UpdateSessionDto, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to modify learner records',
      );
    }

    const session = await this.prisma.studySession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Study session with ID ${id} not found`);
    }

    if (session.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot modify another learner's study session",
      );
    }

    const settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'global' },
    });
    const minMins = settings?.minSessionMinutes ?? 5;
    const maxMins = settings?.maxSessionMinutes ?? 480;

    if (dto.minutes !== undefined && (dto.minutes < minMins || dto.minutes > maxMins)) {
      throw new BadRequestException(
        `Session duration must be between ${minMins} and ${maxMins} minutes`,
      );
    }

    let parsedDate: Date | undefined;
    if (dto.studyDate) {
      parsedDate = this.validateAndParseStudyDate(dto.studyDate);
    }

    return this.prisma.studySession.update({
      where: { id },
      data: {
        ...(parsedDate ? { studyDate: parsedDate } : {}),
        ...(dto.minutes !== undefined ? { minutes: dto.minutes } : {}),
        ...(dto.note !== undefined ? { note: dto.note?.trim() } : {}),
      },
      include: {
        topic: true,
      },
    });
  }

  async remove(id: string, currentUser: CurrentUserPayload) {
    if (currentUser.role === Role.MENTOR) {
      throw new ForbiddenException(
        'Mentors are not permitted to delete learner records',
      );
    }

    const session = await this.prisma.studySession.findUnique({
      where: { id },
    });

    if (!session) {
      throw new NotFoundException(`Study session with ID ${id} not found`);
    }

    if (session.learnerId !== currentUser.id) {
      throw new ForbiddenException(
        "Learners cannot delete another learner's study session",
      );
    }

    return this.prisma.studySession.delete({
      where: { id },
    });
  }
}
