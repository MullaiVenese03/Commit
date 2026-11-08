import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, type InitialEntry } from 'react-router';
import { AuthContext, type AuthContextType } from '../src/app/providers/AuthContext';
import type { User } from '../src/types';

export const mockLearnerUser: User = {
  id: 'learner-1',
  email: 'alex.mercer@commit.dev',
  name: 'Alex Mercer',
  role: 'LEARNER',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

export const mockMentorUser: User = {
  id: 'mentor-1',
  email: 'marcus.vance@commit.dev',
  name: 'Dr. Marcus Vance',
  role: 'MENTOR',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
};

export interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialEntries?: InitialEntry[];
  authContext?: Partial<AuthContextType>;
  queryClient?: QueryClient;
}

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

export function renderWithProviders(
  ui: ReactElement,
  options: CustomRenderOptions = {},
) {
  const {
    initialEntries = ['/'],
    authContext: authOverrides = {},
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = options;

  const defaultAuth: AuthContextType = {
    user: mockLearnerUser,
    token: 'mock-jwt-token',
    isAuthenticated: true,
    isMentor: false,
    isLearner: true,
    isLoading: false,
    login: async () => {},
    register: async () => {},
    logout: () => {},
    refreshUser: async () => {},
    ...authOverrides,
  };

  const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <AuthContext.Provider value={defaultAuth}>
          <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
        </AuthContext.Provider>
      </QueryClientProvider>
    );
  };

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
