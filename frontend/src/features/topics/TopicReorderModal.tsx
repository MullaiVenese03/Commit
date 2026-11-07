import React, { useState } from 'react';
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { useReorderTopics } from '../../hooks/useTopics';
import type { Topic } from '../../types';
import { getErrorMessage } from '../../utils/formatters';

interface TopicReorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  topics: Topic[];
}

export const TopicReorderModal: React.FC<TopicReorderModalProps> = ({
  isOpen,
  onClose,
  goalId,
  topics,
}) => {
  if (!isOpen) return null;

  return (
    <TopicReorderModalContent
      key={`reorder-${goalId}-${topics.length}`}
      isOpen={isOpen}
      onClose={onClose}
      goalId={goalId}
      topics={topics}
    />
  );
};

const TopicReorderModalContent: React.FC<TopicReorderModalProps> = ({
  isOpen,
  onClose,
  goalId,
  topics,
}) => {
  const [orderedTopics, setOrderedTopics] = useState<Topic[]>(() =>
    [...topics].sort((a, b) => a.position - b.position),
  );
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const reorderMutation = useReorderTopics();

  const moveUp = (index: number) => {
    if (index === 0) return;
    const newItems = [...orderedTopics];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    setOrderedTopics(newItems);
  };

  const moveDown = (index: number) => {
    if (index === orderedTopics.length - 1) return;
    const newItems = [...orderedTopics];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    setOrderedTopics(newItems);
  };

  const handleSave = async () => {
    setError(null);
    setSuccessMessage(null);
    try {
      const topicIds = orderedTopics.map((t) => t.id);
      await reorderMutation.mutateAsync({ goalId, topicIds });
      setSuccessMessage('Curriculum progression order successfully updated.');
      setTimeout(() => {
        onClose();
      }, 400);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reorder Curriculum Topics"
      description="Adjust the sequential milestone order for this curriculum."
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={reorderMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={reorderMutation.isPending}
            disabled={reorderMutation.isPending}
          >
            Save Order
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {error && (
          <Alert variant="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert variant="success">
            {successMessage}
          </Alert>
        )}

        <p className="text-xs text-zinc-500 leading-normal">
          Use the up and down arrow controls to reorder milestones. Sequence positions update automatically.
        </p>

        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {orderedTopics.map((topic, index) => {
            const isFirst = index === 0;
            const isLast = index === orderedTopics.length - 1;

            return (
              <div
                key={topic.id}
                className="flex items-center justify-between p-2.5 rounded-md border border-zinc-200 bg-white hover:border-zinc-300 transition-colors duration-150 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <GripVertical className="w-4 h-4 text-zinc-400 shrink-0" />
                  <span className="w-5 h-5 rounded bg-zinc-100 text-zinc-700 text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-zinc-200/80">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-zinc-900 truncate">
                      {topic.title}
                    </h5>
                    {topic.prerequisites && topic.prerequisites.length > 0 && (
                      <span className="text-[10px] text-zinc-400">
                        {topic.prerequisites.length} prerequisite{topic.prerequisites.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => moveUp(index)}
                    disabled={isFirst || reorderMutation.isPending}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition"
                    aria-label={`Move "${topic.title}" up`}
                    title={`Move up (currently position ${index + 1})`}
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={isLast || reorderMutation.isPending}
                    className="p-1 rounded text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 disabled:opacity-25 disabled:cursor-not-allowed cursor-pointer transition"
                    aria-label={`Move "${topic.title}" down`}
                    title={`Move down (currently position ${index + 1})`}
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};
