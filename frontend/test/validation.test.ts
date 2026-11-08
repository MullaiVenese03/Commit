import { describe, it, expect } from 'vitest';
import {
  loginSchema,
  registerSchema,
  goalSchema,
  topicSchema,
  createSessionSchema,
  settingsSchema,
} from '../src/utils/schemas.ts';

describe('Validation Schemas Tests', () => {
  describe('loginSchema', () => {
    it('validates correct email and password', () => {
      const valid = loginSchema.safeParse({
        email: 'alex.mercer@commit.dev',
        password: 'Password123!',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects invalid email', () => {
      const invalid = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'Password123!',
      });
      expect(invalid.success).toBe(false);
      if (!invalid.success) {
        expect(invalid.error.issues.some((i) => i.path.includes('email'))).toBe(true);
      }
    });

    it('rejects empty password', () => {
      const invalid = loginSchema.safeParse({
        email: 'alex@example.com',
        password: '',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('registerSchema', () => {
    it('validates a valid registration payload', () => {
      const valid = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects short name or short password', () => {
      const shortName = registerSchema.safeParse({
        name: 'J',
        email: 'jane@example.com',
        password: 'Password123!',
      });
      expect(shortName.success).toBe(false);

      const shortPassword = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
      });
      expect(shortPassword.success).toBe(false);
    });
  });

  describe('goalSchema', () => {
    it('validates goal title and optional description', () => {
      const valid = goalSchema.safeParse({
        title: 'Learn Distributed Systems',
        description: 'Read designing data-intensive applications',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects goal with title under 3 characters', () => {
      const invalid = goalSchema.safeParse({
        title: 'AB',
        description: '',
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('topicSchema', () => {
    it('validates topic title and prerequisite array', () => {
      const valid = topicSchema.safeParse({
        title: 'Raft Consensus Algorithm',
        description: 'Leader election and log replication',
        prerequisiteIds: ['topic-1', 'topic-2'],
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.prerequisiteIds.length).toBe(2);
      }
    });

    it('defaults prerequisiteIds to empty array if omitted', () => {
      const valid = topicSchema.safeParse({
        title: 'Paxos',
      });
      expect(valid.success).toBe(true);
      if (valid.success) {
        expect(valid.data.prerequisiteIds).toEqual([]);
      }
    });
  });

  describe('createSessionSchema', () => {
    const sessionSchema = createSessionSchema(15, 240, '2026-11-07');

    it('validates valid session log', () => {
      const valid = sessionSchema.safeParse({
        topicId: 'topic-uuid-1',
        studyDate: '2026-11-06',
        minutes: 60,
        note: 'Completed section 1',
      });
      expect(valid.success).toBe(true);
    });

    it('rejects session with minutes below minimum', () => {
      const invalid = sessionSchema.safeParse({
        topicId: 'topic-uuid-1',
        studyDate: '2026-11-06',
        minutes: 10,
      });
      expect(invalid.success).toBe(false);
    });

    it('rejects session with future date', () => {
      const invalid = sessionSchema.safeParse({
        topicId: 'topic-uuid-1',
        studyDate: '2026-11-10',
        minutes: 45,
      });
      expect(invalid.success).toBe(false);
    });
  });

  describe('settingsSchema', () => {
    it('validates coherent mentor system settings', () => {
      const valid = settingsSchema.safeParse({
        minSessionMinutes: 15,
        maxSessionMinutes: 300,
        maxPrerequisitesPerTopic: 5,
      });
      expect(valid.success).toBe(true);
    });

    it('rejects minSessionMinutes >= maxSessionMinutes', () => {
      const invalid = settingsSchema.safeParse({
        minSessionMinutes: 60,
        maxSessionMinutes: 60,
        maxPrerequisitesPerTopic: 5,
      });
      expect(invalid.success).toBe(false);
    });

    it('rejects maxPrerequisitesPerTopic exceeding limit', () => {
      const invalid = settingsSchema.safeParse({
        minSessionMinutes: 15,
        maxSessionMinutes: 120,
        maxPrerequisitesPerTopic: 25,
      });
      expect(invalid.success).toBe(false);
    });
  });
});
