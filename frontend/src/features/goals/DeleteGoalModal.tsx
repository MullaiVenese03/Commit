import React, { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useDeleteGoal } from '../../hooks/useGoals';
import type { Goal } from '../../types';
import { getErrorMessage } from '../../utils/formatters';

interface DeleteGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  onSuccess?: () => void;
}

export const DeleteGoalModal: React.FC<DeleteGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onSuccess,
}) => {
  const deleteMutation = useDeleteGoal();
  const [error, setError] = useState<string | null>(null);

  if (!goal) return null;

  const handleDelete = async () => {
    setError(null);
    try {
      await deleteMutation.mutateAsync(goal.id);
      onClose();
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const topicCount = goal.topics?.length ?? 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delete Study Goal"
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={deleteMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDelete}
            isLoading={deleteMutation.isPending}
          >
            Delete Goal
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && <Alert variant="error">{error}</Alert>}

        <div className="flex items-start gap-3 text-xs text-[#777782]">
          <div className="p-2 bg-[#C45C5C]/10 text-[#C45C5C] rounded-lg shrink-0 border border-[#C45C5C]/25">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-[#24242A] text-sm">
              Are you sure you want to delete "{goal.title}"?
            </p>
            <p className="mt-1 text-[#777782] leading-normal">
              This action cannot be undone.
              {topicCount > 0 && (
                <span className="block mt-2 font-medium text-[#B98237] bg-[#B98237]/10 p-2.5 rounded-lg border border-[#B98237]/25">
                  Notice: Deleting this curriculum will permanently delete {topicCount} associated topic milestone{topicCount > 1 ? 's' : ''} and all logged study sessions.
                </span>
              )}
            </p>
          </div>
        </div>
      </div>
    </Modal>
  );
};
