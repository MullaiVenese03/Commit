import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { TopicCard } from '../../src/features/topics/TopicCard';
import type { Topic } from '../../src/types';

describe('TopicCard Component (Topic locked / unlocked states)', () => {
  const baseTopic: Topic = {
    id: 'topic-1',
    goalId: 'goal-1',
    title: 'Advanced Raft Consensus',
    description: 'Understand log compaction, snapshotting, and leader election',
    position: 1,
    isCompleted: false,
    completedAt: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    isUnlocked: true,
    missingPrerequisites: [],
    prerequisites: [],
    dependents: [],
  };

  it('renders unlocked topic with "Available to Study" badge and action buttons', () => {
    const onLogSession = vi.fn();
    renderWithProviders(
      <TopicCard topic={baseTopic} onLogSession={onLogSession} isReadOnly={false} />,
    );

    expect(screen.getByText('Advanced Raft Consensus')).toBeInTheDocument();
    expect(screen.getByText('#1')).toBeInTheDocument();
    expect(screen.getByText('Available to Study')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Complete/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log Study/i })).toBeInTheDocument();
  });

  it('renders locked topic with "Locked" badge and reports missing prerequisites', () => {
    const lockedTopic: Topic = {
      ...baseTopic,
      isUnlocked: false,
      missingPrerequisites: [
        { id: 'prereq-1', title: 'RPC Protocol Fundamentals' },
        { id: 'prereq-2', title: 'State Machine Replication' },
      ],
      prerequisites: [
        {
          id: 'rel-1',
          topicId: 'topic-1',
          prerequisiteTopicId: 'prereq-1',
          prerequisiteTopic: { id: 'prereq-1', title: 'RPC Protocol Fundamentals', isCompleted: false },
        },
        {
          id: 'rel-2',
          topicId: 'topic-1',
          prerequisiteTopicId: 'prereq-2',
          prerequisiteTopic: { id: 'prereq-2', title: 'State Machine Replication', isCompleted: false },
        },
      ],
    };

    renderWithProviders(<TopicCard topic={lockedTopic} />);

    expect(screen.getByText('Locked')).toBeInTheDocument();
    expect(screen.getByText(/Milestone Locked:/i)).toBeInTheDocument();
    expect(screen.getAllByText('RPC Protocol Fundamentals').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('State Machine Replication').length).toBeGreaterThanOrEqual(1);

    // Verify locked button is rendered and disabled
    const lockedBtn = screen.getByRole('button', { name: /Topic Locked/i });
    expect(lockedBtn).toBeDisabled();
  });

  it('renders completed topic with "Completed" badge and Reopen button', () => {
    const completedTopic: Topic = {
      ...baseTopic,
      isCompleted: true,
      completedAt: '2026-10-15T12:00:00.000Z',
    };

    renderWithProviders(<TopicCard topic={completedTopic} />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.getByText(/Completed on/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Reopen/i })).toBeInTheDocument();
  });

  it('calls onLogSession when clicking "Log Study" button', async () => {
    const user = userEvent.setup();
    const logMock = vi.fn();

    renderWithProviders(
      <TopicCard topic={baseTopic} onLogSession={logMock} isReadOnly={false} />,
    );

    const logBtn = screen.getByRole('button', { name: /Log Study/i });
    await user.click(logBtn);

    expect(logMock).toHaveBeenCalledWith(baseTopic);
  });
});
