import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, mockLearnerUser, mockMentorUser } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { Sidebar } from '../../src/components/layout/Sidebar';

describe('Role-Specific Navigation (Sidebar)', () => {
  it('renders learner navigation links and hides mentor management links for learners', () => {
    renderWithProviders(<Sidebar isMobileOpen={false} onMobileClose={() => {}} />, {
      authContext: {
        user: mockLearnerUser,
        isMentor: false,
        isLearner: true,
      },
    });

    // Learner navigation items should be visible
    const studyNavLabels = screen.getAllByText('Study Navigation');
    expect(studyNavLabels.length).toBeGreaterThan(0);

    const dashboardLinks = screen.getAllByRole('link', { name: /Dashboard/i });
    expect(dashboardLinks[0]).toHaveAttribute('href', '/dashboard');

    const goalsLinks = screen.getAllByRole('link', { name: /Study Goals/i });
    expect(goalsLinks[0]).toHaveAttribute('href', '/goals');

    const sessionLinks = screen.getAllByRole('link', { name: /Study Sessions/i });
    expect(sessionLinks[0]).toHaveAttribute('href', '/sessions');

    const progressLinks = screen.getAllByRole('link', { name: /Progress & Analytics/i });
    expect(progressLinks[0]).toHaveAttribute('href', '/progress');

    // Mentor links must NOT be rendered
    expect(screen.queryByText('Cohort Management')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Learners Directory/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /System Settings/i })).not.toBeInTheDocument();
  });

  it('renders mentor navigation links and hides learner-exclusive links for mentors', () => {
    renderWithProviders(<Sidebar isMobileOpen={false} onMobileClose={() => {}} />, {
      authContext: {
        user: mockMentorUser,
        isMentor: true,
        isLearner: false,
      },
    });

    // Mentor navigation items should be visible
    const cohortLabels = screen.getAllByText('Cohort Management');
    expect(cohortLabels.length).toBeGreaterThan(0);

    const mentorDashboardLinks = screen.getAllByRole('link', { name: /Mentor Dashboard/i });
    expect(mentorDashboardLinks[0]).toHaveAttribute('href', '/mentor');

    const learnersLinks = screen.getAllByRole('link', { name: /Learners Directory/i });
    expect(learnersLinks[0]).toHaveAttribute('href', '/mentor/learners');

    const progressLinks = screen.getAllByRole('link', { name: /Progress Monitoring/i });
    expect(progressLinks[0]).toHaveAttribute('href', '/mentor/goals');

    const settingsLinks = screen.getAllByRole('link', { name: /System Settings/i });
    expect(settingsLinks[0]).toHaveAttribute('href', '/mentor/settings');

    // Learner-only links should NOT be rendered
    expect(screen.queryByText('Study Navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Progress & Analytics/i })).not.toBeInTheDocument();
  });

  it('clicking sign out button calls logout', async () => {
    const user = userEvent.setup();
    const logoutMock = vi.fn();

    renderWithProviders(<Sidebar isMobileOpen={false} onMobileClose={() => {}} />, {
      authContext: {
        user: mockLearnerUser,
        logout: logoutMock,
      },
    });

    const logoutButtons = screen.getAllByRole('button', { name: /Sign Out/i });
    await user.click(logoutButtons[0]);

    expect(logoutMock).toHaveBeenCalledTimes(1);
  });
});
