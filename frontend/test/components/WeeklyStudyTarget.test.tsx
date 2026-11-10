import { describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Route, Routes } from 'react-router';
import { AxiosError, AxiosHeaders } from 'axios';
import { WeeklyTargetCard } from '../../src/features/progress/WeeklyTargetCard';
import { EditWeeklyTargetModal } from '../../src/features/progress/EditWeeklyTargetModal';
import { LearnerDashboard } from '../../src/features/dashboard/LearnerDashboard';
import { LearnerDetailPage } from '../../src/features/mentor/LearnerDetailPage';
import { progressService } from '../../src/services/progress.service';
import type { ProgressResponse, WeeklyTargetResponse } from '../../src/types';
import {
  mockMentorUser,
  renderWithProviders,
} from '../test-utils';

describe('Weekly Study Targets Component Suite', () => {
  const mockDefaultTarget: WeeklyTargetResponse = {
    learnerId: 'learner-1',
    targetMinutes: 600,
    completedMinutes: 0,
    remainingMinutes: 600,
    completionPercentage: 0,
    isTargetMet: false,
    weekStart: '2026-11-09',
    weekEnd: '2026-11-15',
  };

  const mockBelowTarget: WeeklyTargetResponse = {
    learnerId: 'learner-1',
    targetMinutes: 600,
    completedMinutes: 420,
    remainingMinutes: 180,
    completionPercentage: 70,
    isTargetMet: false,
    weekStart: '2026-11-09',
    weekEnd: '2026-11-15',
  };

  const mockEqualToTarget: WeeklyTargetResponse = {
    learnerId: 'learner-1',
    targetMinutes: 600,
    completedMinutes: 600,
    remainingMinutes: 0,
    completionPercentage: 100,
    isTargetMet: true,
    weekStart: '2026-11-09',
    weekEnd: '2026-11-15',
  };

  const mockExceedingTarget: WeeklyTargetResponse = {
    learnerId: 'learner-1',
    targetMinutes: 600,
    completedMinutes: 720,
    remainingMinutes: 0,
    completionPercentage: 100, // Capped at 100 in backend contract
    isTargetMet: true,
    weekStart: '2026-11-09',
    weekEnd: '2026-11-15',
  };

  const mockCustomTarget: WeeklyTargetResponse = {
    learnerId: 'learner-1',
    targetMinutes: 900,
    completedMinutes: 300,
    remainingMinutes: 600,
    completionPercentage: 33,
    isTargetMet: false,
    weekStart: '2026-11-09',
    weekEnd: '2026-11-15',
  };

  const mockProgressResponse: ProgressResponse = {
    learner: {
      id: 'learner-1',
      name: 'Alex Mercer',
      email: 'alex.mercer@commit.dev',
      role: 'LEARNER',
    },
    overview: {
      totalGoals: 2,
      completedGoals: 0,
      totalTopics: 10,
      completedTopics: 5,
      completionPercentage: 50,
      remainingTopics: 5,
      totalMinutes: 300,
      totalHours: 5,
      totalSessions: 6,
    },
    goals: [],
    recentSessions: [],
  };

  describe('1. Default target rendering', () => {
    it('displays the default 600-minute target as 10 hours', () => {
      renderWithProviders(<WeeklyTargetCard initialData={mockDefaultTarget} />);

      expect(screen.getByText('Weekly Study Target')).toBeInTheDocument();
      expect(screen.getByTestId('target-duration')).toHaveTextContent('10 hours');
      expect(screen.getByTestId('completed-duration')).toHaveTextContent('0 hours');
      expect(screen.getByTestId('remaining-duration')).toHaveTextContent('10 hours');
      expect(screen.getByTestId('progress-metric')).toHaveTextContent('0%');
      expect(screen.getByText('In Progress')).toBeInTheDocument();
    });
  });

  describe('2. Custom target rendering', () => {
    it('displays custom target (15 hours / 900 mins) and corresponding progress', () => {
      renderWithProviders(<WeeklyTargetCard initialData={mockCustomTarget} />);

      expect(screen.getByTestId('target-duration')).toHaveTextContent('15 hours');
      expect(screen.getByTestId('completed-duration')).toHaveTextContent('5 hours');
      expect(screen.getByTestId('remaining-duration')).toHaveTextContent('10 hours');
      expect(screen.getByTestId('progress-metric')).toHaveTextContent('33%');
    });
  });

  describe('3. Progress below target', () => {
    it('displays in-progress status, correct remaining time, and partial completion percentage', () => {
      renderWithProviders(<WeeklyTargetCard initialData={mockBelowTarget} />);

      expect(screen.getByTestId('target-duration')).toHaveTextContent('10 hours');
      expect(screen.getByTestId('completed-duration')).toHaveTextContent('7 hours');
      expect(screen.getByTestId('remaining-duration')).toHaveTextContent('3 hours');
      expect(screen.getByTestId('progress-metric')).toHaveTextContent('70%');
      expect(screen.getByText('In Progress')).toBeInTheDocument();
      expect(screen.queryByTestId('target-exceeded-banner')).not.toBeInTheDocument();
    });
  });

  describe('4. Progress equal to target', () => {
    it('displays Target Met badge and 100% completion with 0 remaining hours', () => {
      renderWithProviders(<WeeklyTargetCard initialData={mockEqualToTarget} />);

      expect(screen.getByTestId('completed-duration')).toHaveTextContent('10 hours');
      expect(screen.getByTestId('remaining-duration')).toHaveTextContent('0 hours');
      expect(screen.getByTestId('progress-metric')).toHaveTextContent('100%');
      expect(screen.getByText('Target Met')).toBeInTheDocument();
      expect(screen.getByText('Weekly commitment satisfied!')).toBeInTheDocument();
    });
  });

  describe('5. Progress exceeding target', () => {
    it('displays Exceeded badge, celebratory banner, and avoids negative remaining time', () => {
      renderWithProviders(<WeeklyTargetCard initialData={mockExceedingTarget} />);

      expect(screen.getByTestId('target-duration')).toHaveTextContent('10 hours');
      expect(screen.getByTestId('completed-duration')).toHaveTextContent('12 hours');
      expect(screen.getByTestId('remaining-duration')).toHaveTextContent('0 hours');
      expect(screen.getByTestId('progress-metric')).toHaveTextContent('100%');

      // Banner should display
      expect(screen.getByTestId('target-exceeded-banner')).toBeInTheDocument();
      expect(screen.getByText(/Target exceeded by/)).toBeInTheDocument();
      expect(screen.getByText('2 hours')).toBeInTheDocument();
      expect(screen.getByText('120m over target')).toBeInTheDocument();
      expect(screen.getByText('Exceeded')).toBeInTheDocument();
    });
  });

  describe('6. Target validation', () => {
    it('validates boundary values 60, 4200, 59, 4201, decimals, and empty inputs', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <EditWeeklyTargetModal
          isOpen={true}
          onClose={vi.fn()}
          currentTargetMinutes={600}
        />,
      );

      // Switch to Total Minutes mode for exact validation testing
      const totalMinutesModeBtn = screen.getByRole('button', { name: 'Total Minutes' });
      await user.click(totalMinutesModeBtn);

      const input = screen.getByLabelText(/Total Weekly Target Minutes/);
      const saveBtn = screen.getByRole('button', { name: 'Save Target' });

      // Test 59 (below min 60) -> rejected
      await user.clear(input);
      await user.type(input, '59');
      expect(
        screen.getByText('Weekly target must be at least 1 hour (60 minutes).'),
      ).toBeInTheDocument();
      expect(saveBtn).toBeDisabled();

      // Test 60 (exact minimum) -> accepted
      await user.clear(input);
      await user.type(input, '60');
      expect(
        screen.queryByText(/Weekly target must be at least|Weekly target cannot exceed/),
      ).not.toBeInTheDocument();
      expect(saveBtn).not.toBeDisabled();

      // Test 4200 (exact maximum) -> accepted
      await user.clear(input);
      await user.type(input, '4200');
      expect(
        screen.queryByText(/Weekly target must be at least|Weekly target cannot exceed/),
      ).not.toBeInTheDocument();
      expect(saveBtn).not.toBeDisabled();

      // Test 4201 (above max 4200) -> rejected
      await user.clear(input);
      await user.type(input, '4201');
      expect(
        screen.getByText('Weekly target cannot exceed 70 hours (4,200 minutes).'),
      ).toBeInTheDocument();
      expect(saveBtn).toBeDisabled();

      // Test decimal values (e.g. 60.5) -> rejected
      await user.clear(input);
      await user.type(input, '60.5');
      expect(
        screen.getByText('Target minutes must be a whole number.'),
      ).toBeInTheDocument();
      expect(saveBtn).toBeDisabled();

      // Test empty input -> rejected
      await user.clear(input);
      expect(
        screen.getByText('Please enter a valid study duration.'),
      ).toBeInTheDocument();
      expect(saveBtn).toBeDisabled();
    });

    it('preserves target value across mode switching without silent mutation', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <EditWeeklyTargetModal
          isOpen={true}
          onClose={vi.fn()}
          currentTargetMinutes={750} // 12h 30m
        />,
      );

      // Initially in Hours & Minutes
      expect(screen.getByLabelText(/Hours/)).toHaveValue(12);
      expect(screen.getByLabelText(/Minutes/)).toHaveValue(30);

      // Switch to Total Minutes
      await user.click(screen.getByRole('button', { name: 'Total Minutes' }));
      expect(screen.getByLabelText(/Total Weekly Target Minutes/)).toHaveValue(750);

      // Switch back to Hours & Minutes
      await user.click(screen.getByRole('button', { name: 'Hours & Minutes' }));
      expect(screen.getByLabelText(/Hours/)).toHaveValue(12);
      expect(screen.getByLabelText(/Minutes/)).toHaveValue(30);
    });

    it('allows selection via quick preset buttons', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <EditWeeklyTargetModal
          isOpen={true}
          onClose={vi.fn()}
          currentTargetMinutes={600}
        />,
      );

      const preset15 = screen.getByRole('button', { name: '15 hours' });
      await user.click(preset15);

      expect(screen.getByText(/15 hours \(900 mins\)/)).toBeInTheDocument();
    });
  });

  describe('7. Successful target update', () => {
    it('calls updateWeeklyTarget and closes modal upon successful submission', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      const updateSpy = vi.spyOn(progressService, 'updateWeeklyTarget').mockResolvedValue({
        ...mockDefaultTarget,
        targetMinutes: 900,
      });

      renderWithProviders(
        <EditWeeklyTargetModal
          isOpen={true}
          onClose={onClose}
          currentTargetMinutes={600}
        />,
      );

      // Click 15 hours preset
      const preset15 = screen.getByRole('button', { name: '15 hours' });
      await user.click(preset15);

      // Submit
      const saveBtn = screen.getByRole('button', { name: 'Save Target' });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(updateSpy).toHaveBeenCalledWith(
          { targetMinutes: 900 },
          expect.any(String),
        );
        expect(onClose).toHaveBeenCalled();
      });
    });
  });

  describe('8. Failed target update', () => {
    it('displays server validation error message and keeps modal open', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      const axiosError = new AxiosError(
        'Request failed with status code 400',
        'ERR_BAD_REQUEST',
        undefined,
        undefined,
        {
          data: { message: 'Weekly target must not exceed 4200 minutes' },
          status: 400,
          statusText: 'Bad Request',
          headers: {},
          config: { headers: new AxiosHeaders() },
        },
      );

      vi.spyOn(progressService, 'updateWeeklyTarget').mockRejectedValue(axiosError);

      renderWithProviders(
        <EditWeeklyTargetModal
          isOpen={true}
          onClose={onClose}
          currentTargetMinutes={600}
        />,
      );

      const saveBtn = screen.getByRole('button', { name: 'Save Target' });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(
          screen.getByText('Weekly target must not exceed 4200 minutes'),
        ).toBeInTheDocument();
        expect(onClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('9. Loading and Error states', () => {
    it('renders skeleton loading indicator while fetching', () => {
      vi.spyOn(progressService, 'getWeeklyTarget').mockImplementation(
        () => new Promise(() => {}),
      );

      renderWithProviders(<WeeklyTargetCard />);

      expect(screen.getByTestId('weekly-target-loading')).toBeInTheDocument();
    });

    it('renders error notice when API fails and no initial data is provided', async () => {
      vi.spyOn(progressService, 'getWeeklyTarget').mockRejectedValue(
        new Error('Network error loading weekly target'),
      );

      renderWithProviders(<WeeklyTargetCard />);

      await waitFor(() => {
        expect(screen.getByTestId('weekly-target-error')).toBeInTheDocument();
      });
      expect(
        screen.getByText('Failed to load weekly study target'),
      ).toBeInTheDocument();
    });
  });

  describe('10. Mentor read-only state', () => {
    it('hides the Edit Target button and displays read-only indicator for mentors', () => {
      renderWithProviders(
        <WeeklyTargetCard
          learnerId="learner-1"
          isReadOnly={true}
          initialData={mockBelowTarget}
        />,
      );

      expect(screen.queryByTestId('edit-target-button')).not.toBeInTheDocument();
      expect(screen.getByText('Read-only')).toBeInTheDocument();
    });

    it('renders read-only weekly target card on Mentor LearnerDetailPage', async () => {
      vi.spyOn(progressService, 'getLearnerProgress').mockResolvedValue(mockProgressResponse);
      vi.spyOn(progressService, 'getWeeklyTarget').mockResolvedValue(mockBelowTarget);

      renderWithProviders(
        <Routes>
          <Route path="/mentor/learners/:learnerId" element={<LearnerDetailPage />} />
        </Routes>,
        {
          initialEntries: ['/mentor/learners/learner-1'],
          authContext: { user: mockMentorUser, isMentor: true, isLearner: false },
        },
      );

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Alex Mercer' })).toBeInTheDocument();
        expect(screen.getByTestId('weekly-target-card')).toBeInTheDocument();
      });

      expect(screen.queryByTestId('edit-target-button')).not.toBeInTheDocument();
      expect(screen.getByText('Read-only')).toBeInTheDocument();
      expect(screen.getByTestId('target-duration')).toHaveTextContent('10 hours');
    });

    it('renders interactive weekly target card on LearnerDashboard with Edit Target button', async () => {
      vi.spyOn(progressService, 'getMyProgress').mockResolvedValue(mockProgressResponse);
      vi.spyOn(progressService, 'getWeeklyTarget').mockResolvedValue(mockBelowTarget);

      renderWithProviders(<LearnerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('weekly-target-card')).toBeInTheDocument();
      });

      const editBtn = screen.getByTestId('edit-target-button');
      expect(editBtn).toBeInTheDocument();
    });
  });
});
