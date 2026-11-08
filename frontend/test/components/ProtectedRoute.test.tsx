import { describe, it, expect } from 'vitest';
import { Route, Routes } from 'react-router';
import { renderWithProviders, screen, mockLearnerUser, mockMentorUser } from '../test-utils';
import { ProtectedRoute } from '../../src/app/router/ProtectedRoute';
import { RoleRoute } from '../../src/app/router/RoleRoute';

describe('Protected and Role-Based Routes', () => {
  it('displays loading indicator while session is verifying', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<div>Protected Dashboard Content</div>} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/'],
        authContext: {
          isLoading: true,
          isAuthenticated: false,
          user: null,
        },
      },
    );

    expect(screen.getByText(/Verifying session.../i)).toBeInTheDocument();
    expect(screen.queryByText(/Protected Dashboard Content/i)).not.toBeInTheDocument();
  });

  it('redirects unauthenticated visitor to /login', () => {
    renderWithProviders(
      <Routes>
        <Route path="/login" element={<div>Login Page Form</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/dashboard'],
        authContext: {
          isLoading: false,
          isAuthenticated: false,
          user: null,
        },
      },
    );

    expect(screen.getByText(/Login Page Form/i)).toBeInTheDocument();
    expect(screen.queryByText(/Protected Dashboard Content/i)).not.toBeInTheDocument();
  });

  it('renders protected child content when authenticated', () => {
    renderWithProviders(
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<div>Protected Dashboard Content</div>} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/dashboard'],
        authContext: {
          isLoading: false,
          isAuthenticated: true,
          user: mockLearnerUser,
        },
      },
    );

    expect(screen.getByText(/Protected Dashboard Content/i)).toBeInTheDocument();
  });

  it('RoleRoute allows user with matching role', () => {
    renderWithProviders(
      <Routes>
        <Route element={<RoleRoute allowedRoles={['MENTOR']} />}>
          <Route path="/mentor/settings" element={<div>Mentor Settings Page</div>} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/mentor/settings'],
        authContext: {
          isAuthenticated: true,
          isMentor: true,
          user: mockMentorUser,
        },
      },
    );

    expect(screen.getByText(/Mentor Settings Page/i)).toBeInTheDocument();
  });

  it('RoleRoute blocks learner from accessing mentor-only routes and redirects to /dashboard', () => {
    renderWithProviders(
      <Routes>
        <Route path="/dashboard" element={<div>Learner Dashboard Home</div>} />
        <Route element={<RoleRoute allowedRoles={['MENTOR']} />}>
          <Route path="/mentor/settings" element={<div>Mentor Settings Page</div>} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/mentor/settings'],
        authContext: {
          isAuthenticated: true,
          isMentor: false,
          isLearner: true,
          user: mockLearnerUser,
        },
      },
    );

    expect(screen.getByText(/Learner Dashboard Home/i)).toBeInTheDocument();
    expect(screen.queryByText(/Mentor Settings Page/i)).not.toBeInTheDocument();
  });

  it('RoleRoute blocks mentor from accessing learner-only routes and redirects to /mentor', () => {
    renderWithProviders(
      <Routes>
        <Route path="/mentor" element={<div>Mentor Dashboard Home</div>} />
        <Route element={<RoleRoute allowedRoles={['LEARNER']} />}>
          <Route path="/goals" element={<div>Learner Goals List</div>} />
        </Route>
      </Routes>,
      {
        initialEntries: ['/goals'],
        authContext: {
          isAuthenticated: true,
          isMentor: true,
          isLearner: false,
          user: mockMentorUser,
        },
      },
    );

    expect(screen.getByText(/Mentor Dashboard Home/i)).toBeInTheDocument();
    expect(screen.queryByText(/Learner Goals List/i)).not.toBeInTheDocument();
  });
});
