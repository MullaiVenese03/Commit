import { describe, it, expect, beforeEach } from 'vitest';
import { storage } from '../src/utils/storage.ts';

describe('Storage utility tests', () => {
  beforeEach(() => {
    localStorage.clear();
    storage.clear();
  });

  it('stores and retrieves auth token correctly', () => {
    expect(storage.getToken()).toBeNull();
    storage.setToken('mock-jwt-token-xyz');
    expect(storage.getToken()).toBe('mock-jwt-token-xyz');
  });

  it('stores and retrieves user profile correctly', () => {
    expect(storage.getUser()).toBeNull();
    const mockUser = {
      id: 'usr-1',
      email: 'alex.mercer@commit.dev',
      name: 'Alex Mercer',
      role: 'LEARNER' as const,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    };
    storage.setUser(mockUser);
    const retrieved = storage.getUser();
    expect(retrieved).toEqual(mockUser);
  });

  it('clears token and user on clear() call', () => {
    storage.setToken('token-to-delete');
    storage.setUser({
      id: 'usr-2',
      email: 'test@example.com',
      name: 'Test',
      role: 'MENTOR' as const,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
    });
    storage.clear();
    expect(storage.getToken()).toBeNull();
    expect(storage.getUser()).toBeNull();
  });
});
