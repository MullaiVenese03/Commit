import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { storage } from '../src/utils/storage.ts';

// Mock localStorage for Node runtime
class MockLocalStorage {
  private store: Map<string, string> = new Map();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}

// @ts-expect-error polyfill for Node test environment
globalThis.localStorage = new MockLocalStorage();

describe('Storage utility tests', () => {
  beforeEach(() => {
    storage.clear();
  });

  it('stores and retrieves auth token correctly', () => {
    assert.strictEqual(storage.getToken(), null);
    storage.setToken('mock-jwt-token-xyz');
    assert.strictEqual(storage.getToken(), 'mock-jwt-token-xyz');
  });

  it('stores and retrieves user profile correctly', () => {
    assert.strictEqual(storage.getUser(), null);
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
    assert.deepStrictEqual(retrieved, mockUser);
  });

  it('clears token and user on clear() call', () => {
    storage.setToken('token-to-delete');
    storage.setUser({
      id: 'usr-2',
      email: 'test@example.com',
      name: 'Test',
      role: 'LEARNER' as const,
      createdAt: '',
      updatedAt: '',
    });

    storage.clear();
    assert.strictEqual(storage.getToken(), null);
    assert.strictEqual(storage.getUser(), null);
  });
});
