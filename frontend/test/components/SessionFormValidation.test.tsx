import { describe, it, expect } from 'vitest';
import { renderWithProviders, screen, createTestQueryClient } from '../test-utils';
import { createSessionSchema } from '../../src/utils/schemas';
import { DurationInput } from '../../src/components/ui/DurationInput';
import { SessionLogModal } from '../../src/features/sessions/SessionLogModal';
import type { Topic } from '../../src/types';

describe('Session Form Validation', () => {
  const minMinutes = 15;
  const maxMinutes = 480;
  const todayStr = '2026-11-08';
  const schema = createSessionSchema(minMinutes, maxMinutes, todayStr);

  it('validates a complete and correct session entry', () => {
    const result = schema.safeParse({
      topicId: 'topic-123',
      studyDate: '2026-11-08',
      minutes: 45,
      note: 'Deep dive into replication algorithms',
    });

    expect(result.success).toBe(true);
  });

  it('rejects session minutes below configured minimum', () => {
    const result = schema.safeParse({
      topicId: 'topic-123',
      studyDate: '2026-11-08',
      minutes: 10,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least 15 minutes');
    }
  });

  it('rejects session minutes above configured maximum', () => {
    const result = schema.safeParse({
      topicId: 'topic-123',
      studyDate: '2026-11-08',
      minutes: 500,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot exceed 480 minutes');
    }
  });

  it('rejects future study dates', () => {
    const result = schema.safeParse({
      topicId: 'topic-123',
      studyDate: '2026-11-09',
      minutes: 60,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('cannot be in the future');
    }
  });

  it('accepts past study dates', () => {
    const result = schema.safeParse({
      topicId: 'topic-123',
      studyDate: '2026-11-01',
      minutes: 60,
    });

    expect(result.success).toBe(true);
  });

  it('rejects missing or empty topicId', () => {
    const result = schema.safeParse({
      topicId: '',
      studyDate: '2026-11-08',
      minutes: 30,
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('Please select a topic');
    }
  });

  it('renders SessionLogModal with topic preselected when defaultTopic is passed', () => {
    const defaultTopic: Topic = {
      id: 'topic-1',
      goalId: 'goal-1',
      title: 'Topic A',
      position: 0,
      isCompleted: false,
      completedAt: null,
      createdAt: '2026-10-01T00:00:00.000Z',
      updatedAt: '2026-10-01T00:00:00.000Z',
      isUnlocked: true,
      missingPrerequisites: [],
    };

    const queryClient = createTestQueryClient();
    queryClient.setQueryData(['goals', 'list', { learnerId: undefined }], [
      { id: 'goal-1', title: 'Goal 1', topics: [defaultTopic] },
    ]);

    renderWithProviders(
      <SessionLogModal isOpen={true} onClose={() => {}} defaultTopic={defaultTopic} />,
      { queryClient },
    );

    expect(screen.getByText('Log Study Session')).toBeInTheDocument();
    expect(screen.getByText('Topic A')).toBeInTheDocument();
  });

  it('DurationInput renders quick preset chips within configured min and max', () => {
    let currentVal = 30;
    renderWithProviders(
      <DurationInput
        value={currentVal}
        onChange={(v) => { currentVal = v; }}
        min={15}
        max={120}
      />,
    );

    expect(screen.getByRole('button', { name: '15m' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '30m' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '60m' })).toBeInTheDocument();
  });
});
