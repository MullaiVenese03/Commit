import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { GoalCard } from '../../src/features/goals/GoalCard';
import type { Goal } from '../../src/types';

describe('GoalCard Component (Goal rendering)', () => {
  const baseGoal: Goal = {
    id: 'goal-1',
    learnerId: 'learner-1',
    title: 'Master TypeScript & Distributed Systems',
    description: 'Comprehensive study plan covering type systems and consensus',
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-01T00:00:00.000Z',
    topics: [],
  };

  it('renders goal title, description, and Draft / Not Started badge when topics are empty', () => {
    renderWithProviders(<GoalCard goal={baseGoal} />);

    expect(screen.getByText('Master TypeScript & Distributed Systems')).toBeInTheDocument();
    expect(
      screen.getByText('Comprehensive study plan covering type systems and consensus'),
    ).toBeInTheDocument();
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders "In Progress" badge and 50% progress when half of the topics are completed', () => {
    const inProgressGoal: Goal = {
      ...baseGoal,
      topics: [
        {
          id: 'topic-1',
          goalId: 'goal-1',
          title: 'Topic 1',
          position: 0,
          isCompleted: true,
          completedAt: '2026-10-05T00:00:00.000Z',
          createdAt: '2026-10-01T00:00:00.000Z',
          updatedAt: '2026-10-05T00:00:00.000Z',
          isUnlocked: true,
          missingPrerequisites: [],
          studySessions: [{ id: 's1', topicId: 'topic-1', minutes: 60, studyDate: '2026-10-05', createdAt: '2026-10-05T00:00:00.000Z' }],
        },
        {
          id: 'topic-2',
          goalId: 'goal-1',
          title: 'Topic 2',
          position: 1,
          isCompleted: false,
          completedAt: null,
          createdAt: '2026-10-01T00:00:00.000Z',
          updatedAt: '2026-10-01T00:00:00.000Z',
          isUnlocked: true,
          missingPrerequisites: [],
        },
      ],
    };

    renderWithProviders(<GoalCard goal={inProgressGoal} />);

    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 topics/i)).toBeInTheDocument();
  });

  it('renders "Mastered" badge when all topics are completed', () => {
    const masteredGoal: Goal = {
      ...baseGoal,
      topics: [
        {
          id: 'topic-1',
          goalId: 'goal-1',
          title: 'Topic 1',
          position: 0,
          isCompleted: true,
          completedAt: '2026-10-05T00:00:00.000Z',
          createdAt: '2026-10-01T00:00:00.000Z',
          updatedAt: '2026-10-05T00:00:00.000Z',
          isUnlocked: true,
          missingPrerequisites: [],
        },
      ],
    };

    renderWithProviders(<GoalCard goal={masteredGoal} />);

    expect(screen.getByText('Mastered')).toBeInTheDocument();
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('renders learner name attribution if present', () => {
    const goalWithLearner: Goal = {
      ...baseGoal,
      learner: {
        id: 'learner-1',
        name: 'Alex Mercer',
        email: 'alex.mercer@commit.dev',
        role: 'LEARNER',
        createdAt: '2026-10-01T00:00:00.000Z',
        updatedAt: '2026-10-01T00:00:00.000Z',
      },
    };

    renderWithProviders(<GoalCard goal={goalWithLearner} />);
    expect(screen.getByText('Alex Mercer')).toBeInTheDocument();
  });

  it('renders action menu and allows calling onEdit and onDelete when not read-only', async () => {
    const user = userEvent.setup();
    const editMock = vi.fn();
    const deleteMock = vi.fn();

    renderWithProviders(
      <GoalCard
        goal={baseGoal}
        onEdit={editMock}
        onDelete={deleteMock}
        isReadOnly={false}
      />,
    );

    const optionsBtn = screen.getByRole('button', { name: /Goal options/i });
    expect(optionsBtn).toBeInTheDocument();

    await user.click(optionsBtn);

    const editBtn = screen.getByRole('button', { name: /Edit Goal/i });
    expect(editBtn).toBeInTheDocument();
    await user.click(editBtn);
    expect(editMock).toHaveBeenCalledWith(baseGoal);
  });

  it('hides edit and delete action menu button when isReadOnly is true', () => {
    const editMock = vi.fn();
    renderWithProviders(
      <GoalCard goal={baseGoal} onEdit={editMock} isReadOnly={true} />,
    );

    expect(screen.queryByRole('button', { name: /Goal options/i })).not.toBeInTheDocument();
  });
});
