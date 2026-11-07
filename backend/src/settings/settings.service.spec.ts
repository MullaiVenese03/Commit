import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  let service: SettingsService;

  const mockPrismaService = {
    systemSettings: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mentorUser = {
    id: 'mentor-uuid-1',
    name: 'Dr. Marcus Vance',
    email: 'marcus.vance@commit.dev',
    role: Role.MENTOR,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
    jest.clearAllMocks();
  });

  it('should return global system settings', async () => {
    mockPrismaService.systemSettings.findUnique.mockResolvedValue({
      id: 'global',
      minSessionMinutes: 5,
      maxSessionMinutes: 480,
      maxPrerequisitesPerTopic: 5,
      updatedById: mentorUser.id,
    });

    const settings = await service.getSettings();
    expect(settings.minSessionMinutes).toBe(5);
    expect(settings.maxSessionMinutes).toBe(480);
  });

  it('should update system settings and record updatedById', async () => {
    mockPrismaService.systemSettings.findUnique.mockResolvedValue({
      id: 'global',
      minSessionMinutes: 5,
      maxSessionMinutes: 480,
      maxPrerequisitesPerTopic: 5,
    });

    mockPrismaService.systemSettings.update.mockResolvedValue({
      id: 'global',
      minSessionMinutes: 10,
      maxSessionMinutes: 300,
      maxPrerequisitesPerTopic: 4,
      updatedById: mentorUser.id,
    });

    const updated = await service.updateSettings(
      { minSessionMinutes: 10, maxSessionMinutes: 300 },
      mentorUser,
    );

    expect(updated.minSessionMinutes).toBe(10);
    expect(updated.updatedById).toBe(mentorUser.id);
  });

  it('should throw BadRequestException if minSessionMinutes >= maxSessionMinutes', async () => {
    mockPrismaService.systemSettings.findUnique.mockResolvedValue({
      id: 'global',
      minSessionMinutes: 5,
      maxSessionMinutes: 480,
      maxPrerequisitesPerTopic: 5,
    });

    await expect(
      service.updateSettings(
        { minSessionMinutes: 500, maxSessionMinutes: 300 },
        mentorUser,
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      service.updateSettings(
        { minSessionMinutes: 60, maxSessionMinutes: 60 },
        mentorUser,
      ),
    ).rejects.toThrow(
      'Minimum session duration must be lower than maximum session duration',
    );
  });
});
