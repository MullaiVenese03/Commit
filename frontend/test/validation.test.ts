import { describe, it } from 'node:test';
import assert from 'node:assert';
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
      assert.strictEqual(valid.success, true);
    });

    it('rejects invalid email', () => {
      const invalid = loginSchema.safeParse({
        email: 'not-an-email',
        password: 'Password123!',
      });
      assert.strictEqual(invalid.success, false);
      if (!invalid.success) {
        assert.ok(invalid.error.issues.some((i) => i.path.includes('email')));
      }
    });

    it('rejects empty password', () => {
      const invalid = loginSchema.safeParse({
        email: 'alex@example.com',
        password: '',
      });
      assert.strictEqual(invalid.success, false);
    });
  });

  describe('registerSchema', () => {
    it('validates a valid registration payload', () => {
      const valid = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'Password123!',
      });
      assert.strictEqual(valid.success, true);
    });

    it('rejects short name or short password', () => {
      const shortName = registerSchema.safeParse({
        name: 'J',
        email: 'jane@example.com',
        password: 'Password123!',
      });
      assert.strictEqual(shortName.success, false);

      const shortPassword = registerSchema.safeParse({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'short',
      });
      assert.strictEqual(shortPassword.success, false);
    });
  });

  describe('goalSchema', () => {
    it('validates goal title and optional description', () => {
      const valid = goalSchema.safeParse({
        title: 'Learn Distributed Systems',
        description: 'Read designing data-intensive applications',
      });
      assert.strictEqual(valid.success, true);
    });

    it('rejects goal with title under 3 characters', () => {
      const invalid = goalSchema.safeParse({
        title: 'AB',
        description: '',
      });
      assert.strictEqual(invalid.success, false);
    });
  });

  describe('topicSchema', () => {
    it('validates topic title and prerequisite array', () => {
      const valid = topicSchema.safeParse({
        title: 'Raft Consensus Algorithm',
        description: 'Leader election and log replication',
        prerequisiteIds: ['topic-1', 'topic-2'],
      });
      assert.strictEqual(valid.success, true);
      if (valid.success) {
        assert.strictEqual(valid.data.prerequisiteIds.length, 2);
      }
    });

    it('defaults prerequisiteIds to empty array if omitted', () => {
      const valid = topicSchema.safeParse({
        title: 'Paxos',
      });
      assert.strictEqual(valid.success, true);
      if (valid.success) {
        assert.deepStrictEqual(valid.data.prerequisiteIds, []);
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
      assert.strictEqual(valid.success, true);
    });

    it('rejects session with minutes below minimum', () => {
      const invalid = sessionSchema.safeParse({
        topicId: 'topic-uuid-1',
        studyDate: '2026-11-06',
        minutes: 10,
      });
      assert.strictEqual(invalid.success, false);
    });

    it('rejects session with future date', () => {
      const invalid = sessionSchema.safeParse({
        topicId: 'topic-uuid-1',
        studyDate: '2026-11-10',
        minutes: 45,
      });
      assert.strictEqual(invalid.success, false);
    });
  });

  describe('settingsSchema', () => {
    it('validates coherent mentor system settings', () => {
      const valid = settingsSchema.safeParse({
        minSessionMinutes: 15,
        maxSessionMinutes: 300,
        maxPrerequisitesPerTopic: 5,
      });
      assert.strictEqual(valid.success, true);
    });

    it('rejects minSessionMinutes >= maxSessionMinutes', () => {
      const invalid = settingsSchema.safeParse({
        minSessionMinutes: 60,
        maxSessionMinutes: 60,
        maxPrerequisitesPerTopic: 5,
      });
      assert.strictEqual(invalid.success, false);
    });

    it('rejects maxPrerequisitesPerTopic exceeding limit', () => {
      const invalid = settingsSchema.safeParse({
        minSessionMinutes: 15,
        maxSessionMinutes: 120,
        maxPrerequisitesPerTopic: 25,
      });
      assert.strictEqual(invalid.success, false);
    });
  });
});
