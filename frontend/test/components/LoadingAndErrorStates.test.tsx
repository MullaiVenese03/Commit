import { describe, it, expect, vi } from 'vitest';
import { renderWithProviders, screen } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { Spinner } from '../../src/components/ui/Spinner';
import { Alert } from '../../src/components/ui/Alert';
import { EmptyState } from '../../src/components/ui/EmptyState';
import { BookOpen } from 'lucide-react';

describe('Loading and Error States', () => {
  describe('Spinner Component', () => {
    it('renders with accessible role and aria-label', () => {
      renderWithProviders(<Spinner size="md" />);

      const spinner = screen.getByRole('status');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveAttribute('aria-label', 'Loading');
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('supports different sizes (sm, md, lg)', () => {
      const { rerender } = renderWithProviders(<Spinner size="sm" />);
      let spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-4', 'h-4');

      rerender(<Spinner size="md" />);
      spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-6', 'h-6');

      rerender(<Spinner size="lg" />);
      spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });
  });

  describe('Alert Component (Error, Warning, Success, Info)', () => {
    it('renders error alert with message and error styling', () => {
      renderWithProviders(
        <Alert variant="error" title="Action Failed">
          Could not persist study session.
        </Alert>,
      );

      expect(screen.getByText('Action Failed')).toBeInTheDocument();
      expect(screen.getByText('Could not persist study session.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-[#C45C5C]/10');
    });

    it('renders warning alert', () => {
      renderWithProviders(
        <Alert variant="warning" title="Prerequisite Notice">
          Dependencies not yet completed.
        </Alert>,
      );

      expect(screen.getByText('Prerequisite Notice')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-[#B98237]/10');
    });

    it('renders success alert', () => {
      renderWithProviders(
        <Alert variant="success">
          Settings updated successfully.
        </Alert>,
      );

      expect(screen.getByText('Settings updated successfully.')).toBeInTheDocument();
      expect(screen.getByRole('alert')).toHaveClass('bg-[#278568]/10');
    });

    it('supports dismissal via close button', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();

      renderWithProviders(
        <Alert variant="error" onClose={onClose}>
          Network timeout occurred.
        </Alert>,
      );

      const closeBtn = screen.getByRole('button', { name: /Close/i });
      expect(closeBtn).toBeInTheDocument();

      await user.click(closeBtn);
      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('EmptyState Component', () => {
    it('renders title, message, and action button', async () => {
      const user = userEvent.setup();
      const onAction = vi.fn();

      renderWithProviders(
        <EmptyState
          icon={<BookOpen data-testid="empty-icon" className="w-6 h-6" />}
          title="No Study Goals Created"
          description="Create your first study goal to organize learning milestones."
          actionLabel="Create Goal"
          onAction={onAction}
        />,
      );

      expect(screen.getByText('No Study Goals Created')).toBeInTheDocument();
      expect(
        screen.getByText('Create your first study goal to organize learning milestones.'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('empty-icon')).toBeInTheDocument();

      const actionBtn = screen.getByRole('button', { name: 'Create Goal' });
      await user.click(actionBtn);
      expect(onAction).toHaveBeenCalledTimes(1);
    });
  });
});
