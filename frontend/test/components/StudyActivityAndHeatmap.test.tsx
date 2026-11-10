import { describe, expect, it, vi } from 'vitest';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClientProvider } from '@tanstack/react-query';
import { Route, Routes } from 'react-router';
import { ActivityHeatmap } from '../../src/features/progress/ActivityHeatmap';
import { StreakSummary } from '../../src/features/progress/StreakSummary';
import { StudyActivitySection } from '../../src/features/progress/StudyActivitySection';
import { LearnerDashboard } from '../../src/features/dashboard/LearnerDashboard';
import { LearnerDetailPage } from '../../src/features/mentor/LearnerDetailPage';
import { useTodayReferenceDate } from '../../src/hooks/useProgress';
import { progressService } from '../../src/services/progress.service';
import * as formatters from '../../src/utils/formatters';
import type { ActivityResponse, DailyActivity, ProgressResponse, StreakMetrics } from '../../src/types';
import { createTestQueryClient, renderWithProviders, mockMentorUser } from '../test-utils';

describe('Study Streaks and Activity Heatmap Components', () => {
  const mockStreakNonZero: StreakMetrics = {
    learnerId: 'learner-1',
    currentStreak: 5,
    longestStreak: 14,
    totalActiveDays: 28,
    isActiveToday: true,
    isActiveYesterday: true,
    referenceDate: '2026-11-09',
  };

  const mockStreakZero: StreakMetrics = {
    learnerId: 'learner-1',
    currentStreak: 0,
    longestStreak: 3,
    totalActiveDays: 5,
    isActiveToday: false,
    isActiveYesterday: false,
    referenceDate: '2026-11-09',
  };

  const mockStreakAtRisk: StreakMetrics = {
    learnerId: 'learner-1',
    currentStreak: 4,
    longestStreak: 10,
    totalActiveDays: 15,
    isActiveToday: false,
    isActiveYesterday: true,
    referenceDate: '2026-11-09',
  };

  const mockDays: DailyActivity[] = [
    { date: '2026-11-06', sessionCount: 1, totalMinutes: 25, level: 1 },
    { date: '2026-11-07', sessionCount: 2, totalMinutes: 50, level: 2 },
    { date: '2026-11-08', sessionCount: 0, totalMinutes: 0, level: 0 },
    { date: '2026-11-09', sessionCount: 3, totalMinutes: 140, level: 4 },
  ];

  const mockActivityResponse: ActivityResponse = {
    learnerId: 'learner-1',
    startDate: '2025-11-10',
    endDate: '2026-11-09',
    totalDays: 4,
    activeDays: 3,
    totalMinutes: 215,
    days: mockDays,
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
      totalTopics: 10,
      completedTopics: 4,
      remainingTopics: 6,
      completionPercentage: 40,
      totalMinutes: 215,
      totalHours: 3.6,
      totalSessions: 6,
    },
    goals: [
      { id: 'g1', title: 'NestJS Architecture', totalTopics: 5, completedTopics: 2, progressPercentage: 40 },
    ],
    recentSessions: [],
  };

  describe('StreakSummary Component', () => {
    it('renders zero streak state correctly', () => {
      renderWithProviders(
        <StreakSummary streaks={mockStreakZero} totalStudyMinutes={300} />,
      );

      expect(screen.getByText('0 days')).toBeInTheDocument();
      expect(screen.getByText('Inactive')).toBeInTheDocument();
      expect(screen.getByText('Log a study session today to start')).toBeInTheDocument();
      expect(screen.getByText('3 days')).toBeInTheDocument(); // Longest streak
      expect(screen.getByText('5 days')).toBeInTheDocument(); // Active study days
      expect(screen.getByText('5h')).toBeInTheDocument(); // 300 minutes = 5h
    });

    it('renders active non-zero streak state with Active Today badge', () => {
      renderWithProviders(
        <StreakSummary streaks={mockStreakNonZero} totalStudyMinutes={840} />,
      );

      expect(screen.getByText('5 days')).toBeInTheDocument();
      expect(screen.getByText('Active Today')).toBeInTheDocument();
      expect(screen.getByText('Daily study goal achieved today')).toBeInTheDocument();
      expect(screen.getByText('14 days')).toBeInTheDocument();
      expect(screen.getByText('28 days')).toBeInTheDocument();
      expect(screen.getByText('14h')).toBeInTheDocument();
      expect(screen.getByText('Study Time')).toBeInTheDocument();
      expect(screen.getByText('Recorded in the past 365 days')).toBeInTheDocument();
    });

    it('renders at-risk streak state when active yesterday but inactive today', () => {
      renderWithProviders(
        <StreakSummary streaks={mockStreakAtRisk} totalStudyMinutes={600} />,
      );

      expect(screen.getByText('4 days')).toBeInTheDocument();
      expect(screen.getByText('At Risk')).toBeInTheDocument();
      expect(screen.getByText('Log study today to keep streak alive')).toBeInTheDocument();
    });

    it('renders loading state skeleton for streaks', () => {
      const { container } = renderWithProviders(
        <StreakSummary streaks={null} isLoading={true} />,
      );

      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });
  });

  describe('ActivityHeatmap Component', () => {
    it('renders active and inactive dates with accessible labels and legend', () => {
      renderWithProviders(
        <ActivityHeatmap
          days={mockDays}
          totalActiveDays={3}
          totalMinutes={215}
        />,
      );

      expect(screen.getByText('Study Activity Heatmap')).toBeInTheDocument();
      expect(screen.getByText('3 active days')).toBeInTheDocument();
      expect(screen.getByText(/3h 35m total/)).toBeInTheDocument();
      expect(screen.getByText('Less')).toBeInTheDocument();
      expect(screen.getByText('More')).toBeInTheDocument();

      // Check accessible gridcells
      const gridcells = screen.getAllByRole('gridcell');
      expect(gridcells.length).toBeGreaterThanOrEqual(4);

      // Inactive day label
      const inactiveCell = screen.getByLabelText(/Nov 8, 2026: 0 minutes across 0 sessions/);
      expect(inactiveCell).toBeInTheDocument();

      // Active day label
      const activeCell = screen.getByLabelText(/Nov 9, 2026: 140 minutes across 3 sessions/);
      expect(activeCell).toBeInTheDocument();
    });

    it('displays date inspection details when clicking an active cell and allows closing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ActivityHeatmap
          days={mockDays}
          totalActiveDays={3}
          totalMinutes={215}
        />,
      );

      const activeCell = screen.getByLabelText(/Nov 9, 2026: 140 minutes across 3 sessions/);
      await user.click(activeCell);

      // Detail card opens
      const detailCard = screen.getByTestId('heatmap-date-detail');
      expect(detailCard).toBeInTheDocument();
      expect(screen.getByText('Monday, Nov 9, 2026')).toBeInTheDocument();
      expect(screen.getByText('2h 20m')).toBeInTheDocument();
      expect(screen.getByText('3 sessions')).toBeInTheDocument();
      expect(screen.getByText(/Level 4/)).toBeInTheDocument();

      // Close detail card
      const closeButton = screen.getByLabelText('Close date details');
      await user.click(closeButton);

      expect(screen.queryByTestId('heatmap-date-detail')).not.toBeInTheDocument();
    });

    it('supports keyboard interaction to select date with Enter key', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ActivityHeatmap
          days={mockDays}
          totalActiveDays={3}
          totalMinutes={215}
        />,
      );

      const inactiveCell = screen.getByLabelText(/Nov 8, 2026: 0 minutes across 0 sessions/);
      inactiveCell.focus();
      await user.keyboard('{Enter}');

      expect(screen.getByTestId('heatmap-date-detail')).toBeInTheDocument();
      expect(screen.getByText('Sunday, Nov 8, 2026')).toBeInTheDocument();
      expect(screen.getByText('0 minutes')).toBeInTheDocument();
      expect(screen.getByText('0 sessions')).toBeInTheDocument();
    });

    it('toggles time range filters smoothly', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ActivityHeatmap
          days={mockDays}
          totalActiveDays={3}
          totalMinutes={215}
        />,
      );

      const threeMonthsBtn = screen.getByRole('button', { name: '3 Months' });
      await user.click(threeMonthsBtn);
      expect(threeMonthsBtn).toHaveClass('font-semibold');

      const sixMonthsBtn = screen.getByRole('button', { name: '6 Months' });
      await user.click(sixMonthsBtn);
      expect(sixMonthsBtn).toHaveClass('font-semibold');

      const pastYearBtn = screen.getByRole('button', { name: 'Past Year' });
      await user.click(pastYearBtn);
      expect(pastYearBtn).toHaveClass('font-semibold');
    });

    describe('Weekday alignment across different starting days', () => {
      it('aligns Monday start at row 0 without leading blank cells', () => {
        // 2026-11-02 is Monday
        const mondayStartDays: DailyActivity[] = [
          { date: '2026-11-02', sessionCount: 1, totalMinutes: 60, level: 3 },
          { date: '2026-11-03', sessionCount: 0, totalMinutes: 0, level: 0 },
        ];

        renderWithProviders(
          <ActivityHeatmap days={mondayStartDays} totalActiveDays={1} totalMinutes={60} />,
        );

        const mondayCell = screen.getByLabelText(/Nov 2, 2026: 60 minutes/);
        expect(mondayCell).toBeInTheDocument();
      });

      it('aligns Wednesday start with 2 leading empty cells at row 0 and 1', () => {
        // 2026-11-04 is Wednesday (ISO index 2)
        const wednesdayStartDays: DailyActivity[] = [
          { date: '2026-11-04', sessionCount: 1, totalMinutes: 45, level: 2 },
          { date: '2026-11-05', sessionCount: 0, totalMinutes: 0, level: 0 },
        ];

        renderWithProviders(
          <ActivityHeatmap days={wednesdayStartDays} totalActiveDays={1} totalMinutes={45} />,
        );

        const wednesdayCell = screen.getByLabelText(/Nov 4, 2026: 45 minutes/);
        expect(wednesdayCell).toBeInTheDocument();
      });

      it('aligns Saturday start with 5 leading empty cells', () => {
        // 2026-11-07 is Saturday (ISO index 5)
        const saturdayStartDays: DailyActivity[] = [
          { date: '2026-11-07', sessionCount: 1, totalMinutes: 90, level: 3 },
        ];

        renderWithProviders(
          <ActivityHeatmap days={saturdayStartDays} totalActiveDays={1} totalMinutes={90} />,
        );

        const saturdayCell = screen.getByLabelText(/Nov 7, 2026: 90 minutes/);
        expect(saturdayCell).toBeInTheDocument();
      });

      it('aligns Sunday start at row 6 with 6 leading empty cells', () => {
        // 2026-11-08 is Sunday (ISO index 6)
        const sundayStartDays: DailyActivity[] = [
          { date: '2026-11-08', sessionCount: 1, totalMinutes: 30, level: 2 },
        ];

        renderWithProviders(
          <ActivityHeatmap days={sundayStartDays} totalActiveDays={1} totalMinutes={30} />,
        );

        const sundayCell = screen.getByLabelText(/Nov 8, 2026: 30 minutes/);
        expect(sundayCell).toBeInTheDocument();
      });

      it('renders exactly 365 actual calendar dates in a 365-day history array', () => {
        // Generate continuous 365-day test array
        const fullYearDays: DailyActivity[] = [];
        const baseDate = new Date('2025-11-10T00:00:00.000Z');
        for (let i = 0; i < 365; i++) {
          const d = new Date(baseDate.getTime() + i * 86400000);
          fullYearDays.push({
            date: d.toISOString().slice(0, 10),
            sessionCount: i % 7 === 0 ? 1 : 0,
            totalMinutes: i % 7 === 0 ? 60 : 0,
            level: (i % 7 === 0 ? 3 : 0) as 0 | 1 | 2 | 3 | 4,
          });
        }

        expect(fullYearDays.length).toBe(365);

        renderWithProviders(
          <ActivityHeatmap days={fullYearDays} totalActiveDays={53} totalMinutes={3180} />,
        );

        const cells = screen.getAllByRole('gridcell');
        expect(cells.length).toBe(365);
      });
    });

    describe('ActivityHeatmap Intensity Levels, Color Rendering & Data Integrity', () => {
      const multiLevelDays: DailyActivity[] = [
        { date: '2026-11-05', sessionCount: 1, totalMinutes: 15, level: 1 },
        { date: '2026-11-06', sessionCount: 1, totalMinutes: 45, level: 2 },
        { date: '2026-11-07', sessionCount: 0, totalMinutes: 0, level: 0 },
        { date: '2026-11-08', sessionCount: 1, totalMinutes: 60, level: 3 },
        { date: '2026-11-09', sessionCount: 2, totalMinutes: 150, level: 4 },
      ];

      it('reads the actual backend intensity property (level) and does not treat active days as empty', () => {
        renderWithProviders(
          <ActivityHeatmap days={multiLevelDays} totalActiveDays={4} totalMinutes={270} />,
        );

        const level1Cell = screen.getByLabelText(/Nov 5, 2026: 15 minutes/);
        expect(level1Cell).toHaveAttribute('data-level', '1');
        expect(level1Cell).toHaveAttribute('data-minutes', '15');

        const level3Cell = screen.getByLabelText(/Nov 8, 2026: 60 minutes/);
        expect(level3Cell).toHaveAttribute('data-level', '3');
        expect(level3Cell).toHaveAttribute('data-minutes', '60');
      });

      it('maps missing activity records to level 0 without shifting dates', () => {
        // Only 2 dates provided with a gap: 2026-11-01 and 2026-11-03
        const sparseDays: DailyActivity[] = [
          { date: '2026-11-01', sessionCount: 1, totalMinutes: 60, level: 3 },
          { date: '2026-11-03', sessionCount: 1, totalMinutes: 30, level: 2 },
        ];

        renderWithProviders(<ActivityHeatmap days={sparseDays} />);

        // Nov 2 was omitted from data, so it must be generated as level 0
        const missingDayCell = screen.getByLabelText(/Nov 2, 2026: 0 minutes across 0 sessions/);
        expect(missingDayCell).toBeInTheDocument();
        expect(missingDayCell).toHaveAttribute('data-level', '0');
      });

      it('renders distinct expected colours for all 5 intensity levels', () => {
        renderWithProviders(
          <ActivityHeatmap days={multiLevelDays} totalActiveDays={4} totalMinutes={270} />,
        );

        // Level 0: neutral grey (#F0EFEA)
        const cell0 = screen.getByLabelText(/Nov 7, 2026: 0 minutes/);
        expect(cell0).toHaveStyle({ backgroundColor: '#F0EFEA' });
        expect(cell0).toHaveClass('bg-[#F0EFEA]');

        // Level 1: very light indigo (#DDDDF8)
        const cell1 = screen.getByLabelText(/Nov 5, 2026: 15 minutes/);
        expect(cell1).toHaveStyle({ backgroundColor: '#DDDDF8' });
        expect(cell1).toHaveClass('bg-[#DDDDF8]');

        // Level 2: light indigo (#ACAEF0)
        const cell2 = screen.getByLabelText(/Nov 6, 2026: 45 minutes/);
        expect(cell2).toHaveStyle({ backgroundColor: '#ACAEF0' });
        expect(cell2).toHaveClass('bg-[#ACAEF0]');

        // Level 3: medium indigo (#7375D8)
        const cell3 = screen.getByLabelText(/Nov 8, 2026: 60 minutes/);
        expect(cell3).toHaveStyle({ backgroundColor: '#7375D8' });
        expect(cell3).toHaveClass('bg-[#7375D8]');

        // Level 4: strong indigo (#4446B4)
        const cell4 = screen.getByLabelText(/Nov 9, 2026: 150 minutes/);
        expect(cell4).toHaveStyle({ backgroundColor: '#4446B4' });
        expect(cell4).toHaveClass('bg-[#4446B4]');
      });

      it('selected date inspector displays numerical intensity (e.g. Level 3 / 4) derived from the activity record', async () => {
        const user = userEvent.setup();
        const testNov9: DailyActivity[] = [
          { date: '2026-11-09', sessionCount: 1, totalMinutes: 60, level: 3 },
        ];

        renderWithProviders(<ActivityHeatmap days={testNov9} />);

        const cell = screen.getByLabelText(/Nov 9, 2026: 60 minutes/);
        await user.click(cell);

        const inspector = screen.getByTestId('heatmap-date-detail');
        expect(inspector).toBeInTheDocument();
        const intensityEl = screen.getByTestId('selected-date-intensity');
        expect(intensityEl).toHaveTextContent('Level 3 / 4');
        expect(screen.getByText('1h')).toBeInTheDocument();
        expect(screen.getByText('1 session')).toBeInTheDocument();
      });

      it('selected cell preserves its activity colour without outline replacing the fill', async () => {
        const user = userEvent.setup();
        const testNov9: DailyActivity[] = [
          { date: '2026-11-09', sessionCount: 1, totalMinutes: 60, level: 3 },
        ];

        renderWithProviders(<ActivityHeatmap days={testNov9} />);

        const cell = screen.getByLabelText(/Nov 9, 2026: 60 minutes/);
        await user.click(cell);

        // Retains medium indigo background and has selection ring
        expect(cell).toHaveStyle({ backgroundColor: '#7375D8' });
        expect(cell).toHaveClass('bg-[#7375D8]');
        expect(cell).toHaveClass('ring-2');
      });

      it('legend uses the exact same colour mapping as the grid', () => {
        renderWithProviders(<ActivityHeatmap days={multiLevelDays} />);

        const legend0 = screen.getByTestId('legend-level-0');
        expect(legend0).toHaveStyle({ backgroundColor: '#F0EFEA' });

        const legend1 = screen.getByTestId('legend-level-1');
        expect(legend1).toHaveStyle({ backgroundColor: '#DDDDF8' });

        const legend2 = screen.getByTestId('legend-level-2');
        expect(legend2).toHaveStyle({ backgroundColor: '#ACAEF0' });

        const legend3 = screen.getByTestId('legend-level-3');
        expect(legend3).toHaveStyle({ backgroundColor: '#7375D8' });

        const legend4 = screen.getByTestId('legend-level-4');
        expect(legend4).toHaveStyle({ backgroundColor: '#4446B4' });
      });
    });
  });

  describe('StudyActivitySection (Loading, Error & Integration)', () => {
    it('renders loading state skeleton when queries are pending', () => {
      vi.spyOn(progressService, 'getStreaks').mockReturnValue(new Promise(() => {}));
      vi.spyOn(progressService, 'getActivity').mockReturnValue(new Promise(() => {}));

      renderWithProviders(<StudyActivitySection />);

      expect(screen.getByTestId('study-activity-loading')).toBeInTheDocument();
    });

    it('renders error alert with retry button when query fails', async () => {
      vi.spyOn(progressService, 'getStreaks').mockRejectedValue(new Error('Network failure'));
      vi.spyOn(progressService, 'getActivity').mockRejectedValue(new Error('Network failure'));

      renderWithProviders(<StudyActivitySection />);

      await waitFor(() => {
        expect(screen.getByTestId('study-activity-error')).toBeInTheDocument();
      });
      expect(screen.getByText(/Failed to load study streaks and activity heatmap/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Retry Loading Activity/ })).toBeInTheDocument();
    });

    it('renders full study activity section when data is loaded successfully', async () => {
      vi.spyOn(progressService, 'getStreaks').mockResolvedValue(mockStreakNonZero);
      vi.spyOn(progressService, 'getActivity').mockResolvedValue(mockActivityResponse);

      renderWithProviders(<StudyActivitySection />);

      await waitFor(() => {
        expect(screen.getByTestId('study-activity-section')).toBeInTheDocument();
      });
      expect(screen.getByText('5 days')).toBeInTheDocument();
      expect(screen.getByText('Study Activity Heatmap')).toBeInTheDocument();
    });
  });

  describe('Learner Dashboard Integration', () => {
    it('integrates StudyActivitySection seamlessly into LearnerDashboard', async () => {
      vi.spyOn(progressService, 'getMyProgress').mockResolvedValue(mockProgressResponse);
      vi.spyOn(progressService, 'getStreaks').mockResolvedValue(mockStreakNonZero);
      vi.spyOn(progressService, 'getActivity').mockResolvedValue(mockActivityResponse);

      renderWithProviders(<LearnerDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/Good/)).toBeInTheDocument();
      });

      // Verifies StudyActivitySection is embedded
      await waitFor(() => {
        expect(screen.getByTestId('study-activity-section')).toBeInTheDocument();
      });
      expect(screen.getByText('Study Activity Heatmap')).toBeInTheDocument();
      expect(screen.getByText('Active Today')).toBeInTheDocument();
    });
  });

  describe('Mentor Learner Detail Page Read-Only Integration', () => {
    it('renders Activity & Streaks tab for mentors with read-only inspection', async () => {
      const user = userEvent.setup();
      vi.spyOn(progressService, 'getLearnerProgress').mockResolvedValue(mockProgressResponse);
      vi.spyOn(progressService, 'getStreaks').mockResolvedValue(mockStreakNonZero);
      vi.spyOn(progressService, 'getActivity').mockResolvedValue(mockActivityResponse);

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
      });

      // Click Activity & Streaks tab
      const activityTab = screen.getByRole('button', { name: 'Activity & Streaks' });
      await user.click(activityTab);

      // Verify heatmap and streak summary are rendered
      await waitFor(() => {
        expect(screen.getByTestId('study-activity-section')).toBeInTheDocument();
      });
      expect(screen.getByText('Study Activity Heatmap')).toBeInTheDocument();
      expect(screen.getByText('5 days')).toBeInTheDocument();
    });
  });

  describe('useTodayReferenceDate (Midnight & Focus Refresh)', () => {
    it('initializes with current browser-local date', () => {
      const { result } = renderHook(() => useTodayReferenceDate(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
        ),
      });

      expect(/^\d{4}-\d{2}-\d{2}$/.test(result.current)).toBe(true);
    });

    it('refreshes reference date and invalidates queries when returning to the tab (document visibilitychange) after local midnight', () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      let mockDateStr = '2026-11-09';
      vi.spyOn(formatters, 'getLocalTodayDate').mockImplementation(() => mockDateStr);

      const { result } = renderHook(() => useTodayReferenceDate(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      expect(result.current).toBe('2026-11-09');

      // Simulate clock crossing midnight to 2026-11-10
      mockDateStr = '2026-11-10';

      // Returning to tab: document visibilitychange fires while visible
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(result.current).toBe('2026-11-10');
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['progress'] });
    });

    it('refreshes reference date and invalidates queries on window focus after the date has changed', () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      let mockDateStr = '2026-11-09';
      vi.spyOn(formatters, 'getLocalTodayDate').mockImplementation(() => mockDateStr);

      const { result } = renderHook(() => useTodayReferenceDate(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      expect(result.current).toBe('2026-11-09');

      // Date advances
      mockDateStr = '2026-11-10';

      act(() => {
        window.dispatchEvent(new Event('focus'));
      });

      expect(result.current).toBe('2026-11-10');
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['progress'] });
    });

    it('does not invalidate queries when the date has not changed', () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      const mockDateStr = '2026-11-09';
      vi.spyOn(formatters, 'getLocalTodayDate').mockImplementation(() => mockDateStr);

      const { result } = renderHook(() => useTodayReferenceDate(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      expect(result.current).toBe('2026-11-09');

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
      });

      expect(result.current).toBe('2026-11-09');
      expect(invalidateSpy).not.toHaveBeenCalled();
    });

    it('does not trigger date check or invalidation when document is hidden', () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      let mockDateStr = '2026-11-09';
      vi.spyOn(formatters, 'getLocalTodayDate').mockImplementation(() => mockDateStr);

      const { result } = renderHook(() => useTodayReferenceDate(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      expect(result.current).toBe('2026-11-09');

      // Date changes while tab is hidden
      mockDateStr = '2026-11-10';
      const originalVisibilityState = document.visibilityState;
      Object.defineProperty(document, 'visibilityState', {
        value: 'hidden',
        configurable: true,
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
      });

      // While hidden, should not advance or invalidate
      expect(result.current).toBe('2026-11-09');
      expect(invalidateSpy).not.toHaveBeenCalled();

      // Tab becomes visible again
      Object.defineProperty(document, 'visibilityState', {
        value: 'visible',
        configurable: true,
      });

      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
      });

      expect(result.current).toBe('2026-11-10');
      expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['progress'] });

      // Restore original visibility state
      Object.defineProperty(document, 'visibilityState', {
        value: originalVisibilityState,
        configurable: true,
      });
    });

    it('avoids duplicate invalidations when both visibilitychange and focus fire for the same wake-up', () => {
      const queryClient = createTestQueryClient();
      const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

      let mockDateStr = '2026-11-09';
      vi.spyOn(formatters, 'getLocalTodayDate').mockImplementation(() => mockDateStr);

      const { result } = renderHook(() => useTodayReferenceDate(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        ),
      });

      expect(result.current).toBe('2026-11-09');

      // Date crosses midnight
      mockDateStr = '2026-11-10';

      // Both events fire in rapid succession during wake-up
      act(() => {
        document.dispatchEvent(new Event('visibilitychange'));
        window.dispatchEvent(new Event('focus'));
      });

      expect(result.current).toBe('2026-11-10');
      expect(invalidateSpy).toHaveBeenCalledTimes(1);
    });

    it('cleans up document and window event listeners on unmount', () => {
      const docRemoveSpy = vi.spyOn(document, 'removeEventListener');
      const winRemoveSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = renderHook(() => useTodayReferenceDate(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
        ),
      });

      unmount();

      expect(docRemoveSpy).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
      expect(winRemoveSpy).toHaveBeenCalledWith('focus', expect.any(Function));
    });

    it('cleans up midnight timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(window, 'clearTimeout');

      const { unmount } = renderHook(() => useTodayReferenceDate(), {
        wrapper: ({ children }) => (
          <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
        ),
      });

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });
});
