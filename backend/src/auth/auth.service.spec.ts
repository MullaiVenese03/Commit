import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as argon2 from 'argon2';
import { Role } from '../generated/prisma/enums';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrismaService)),
  };

  const mockJwtService = {
    sign: jest.fn().mockReturnValue('mock-jwt-token'),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue('mock-secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new learner and return accessToken and user without passwordHash', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockPrismaService.user.create.mockImplementation(({ data }) => ({
        id: 'user-uuid-1',
        name: data.name,
        email: data.email,
        role: data.role,
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      const result = await service.register({
        name: 'Test Learner',
        email: 'test@learner.dev',
        password: 'Password123!',
      });

      expect(mockPrismaService.user.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            role: Role.LEARNER,
          }),
        }),
      );

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result.user).toHaveProperty('id', 'user-uuid-1');
      expect(result.user).toHaveProperty('email', 'test@learner.dev');
      expect(result.user).toHaveProperty('role', Role.LEARNER);
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should throw ConflictException if user email already exists', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-id',
        email: 'test@learner.dev',
      });

      await expect(
        service.register({
          name: 'Test Learner',
          email: 'test@learner.dev',
          password: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should successfully authenticate user with valid credentials and verify password using argon2', async () => {
      const plainPassword = 'Learner123!Pass';
      const hash = await argon2.hash(plainPassword, { type: argon2.argon2id });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        name: 'Alex Mercer',
        email: 'alex.mercer@commit.dev',
        passwordHash: hash,
        role: Role.LEARNER,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.login({
        email: 'alex.mercer@commit.dev',
        password: plainPassword,
      });

      expect(result).toHaveProperty('accessToken', 'mock-jwt-token');
      expect(result.user.email).toBe('alex.mercer@commit.dev');
      expect((result.user as any).passwordHash).toBeUndefined();
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const hash = await argon2.hash('CorrectPassword123!', {
        type: argon2.argon2id,
      });

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-uuid-1',
        email: 'alex.mercer@commit.dev',
        passwordHash: hash,
        role: Role.LEARNER,
      });

      await expect(
        service.login({
          email: 'alex.mercer@commit.dev',
          password: 'WrongPassword!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login({
          email: 'nonexistent@commit.dev',
          password: 'Password123!',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
