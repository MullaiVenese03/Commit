import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../../src/features/auth/LoginForm';

describe('LoginForm Component', () => {
  it('renders login form inputs and submit button', () => {
    renderWithProviders(<LoginForm />);

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('validates invalid email format and shows error message', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LoginForm />);

    const emailInput = screen.getByLabelText(/Email Address/i);
    await user.type(emailInput, 'invalid-email-address');
    await user.tab();

    await waitFor(() => {
      expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
    });
  });

  it('submits valid credentials and calls login handler', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockResolvedValue(undefined);

    renderWithProviders(<LoginForm />, {
      authContext: { login: loginMock },
    });

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    await user.type(emailInput, 'alex.mercer@commit.dev');
    await user.type(passwordInput, 'Learner123!Pass');

    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });

    await user.click(submitBtn);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'alex.mercer@commit.dev',
        password: 'Learner123!Pass',
      });
    });
  });

  it('displays server error alert when login fails', async () => {
    const user = userEvent.setup();
    const loginMock = vi.fn().mockRejectedValue(new Error('Invalid email or password'));

    renderWithProviders(<LoginForm />, {
      authContext: { login: loginMock },
    });

    const emailInput = screen.getByLabelText(/Email Address/i);
    const passwordInput = screen.getByLabelText(/Password/i);
    const submitBtn = screen.getByRole('button', { name: /Sign In/i });

    await user.type(emailInput, 'alex.mercer@commit.dev');
    await user.type(passwordInput, 'WrongPassword!');

    await waitFor(() => {
      expect(submitBtn).toBeEnabled();
    });

    await user.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Invalid email or password/i)).toBeInTheDocument();
    });
  });
});
