import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../generated/prisma/enums';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockExecutionContext(user: any): ExecutionContext {
    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user }),
      }),
    } as unknown as ExecutionContext;
  }

  it('should allow access if no roles are required', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(null);
    const context = createMockExecutionContext({ role: Role.LEARNER });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow access if user has required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MENTOR]);
    const context = createMockExecutionContext({ role: Role.MENTOR });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should throw ForbiddenException if user has wrong role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MENTOR]);
    const context = createMockExecutionContext({ role: Role.LEARNER });

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it('should throw ForbiddenException if no user is attached to request', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.LEARNER]);
    const context = createMockExecutionContext(null);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });
});
