import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUserPayload } from '../common/decorators/current-user.decorator';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async getSettings() {
    let settings = await this.prisma.systemSettings.findUnique({
      where: { id: 'global' },
      include: {
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    if (!settings) {
      settings = await this.prisma.systemSettings.create({
        data: {
          id: 'global',
          minSessionMinutes: 5,
          maxSessionMinutes: 480,
          maxPrerequisitesPerTopic: 5,
        },
        include: {
          updatedBy: {
            select: { id: true, name: true, email: true },
          },
        },
      });
    }

    return settings;
  }

  async updateSettings(dto: UpdateSettingsDto, currentUser: CurrentUserPayload) {
    const current = await this.getSettings();

    const min = dto.minSessionMinutes ?? current.minSessionMinutes;
    const max = dto.maxSessionMinutes ?? current.maxSessionMinutes;

    if (min >= max) {
      throw new BadRequestException(
        'Minimum session duration must be lower than maximum session duration',
      );
    }

    return this.prisma.systemSettings.update({
      where: { id: 'global' },
      data: {
        ...(dto.minSessionMinutes !== undefined
          ? { minSessionMinutes: dto.minSessionMinutes }
          : {}),
        ...(dto.maxSessionMinutes !== undefined
          ? { maxSessionMinutes: dto.maxSessionMinutes }
          : {}),
        ...(dto.maxPrerequisitesPerTopic !== undefined
          ? { maxPrerequisitesPerTopic: dto.maxPrerequisitesPerTopic }
          : {}),
        updatedById: currentUser.id,
      },
      include: {
        updatedBy: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
