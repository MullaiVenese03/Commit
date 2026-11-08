import React, { useState } from 'react';
import { ArrowDown, ArrowUp, CheckCircle2, GripVertical } from 'lucide-react';
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
  const [isSaved, setIsSaved] = useState(false);
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
    setIsSaved(false);
    try {
      const topicIds = orderedTopics.map((t) => t.id);
      await reorderMutation.mutateAsync({ goalId, topicIds });
      setIsSaved(true);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Reorder Curriculum Topics"
      description="Adjust the sequential progression order for this curriculum."
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
            leftIcon={isSaved ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : undefined}
          >
            {isSaved ? 'Order Saved!' : 'Save Order'}
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

        <p className="text-xs text-[#777782] leading-normal">
          Use the arrow buttons to position milestones. The order reflects the intended learning sequence.
        </p>

        <div className="space-y-1.5 max-h-80 overflow-y-auto pr-1">
          {orderedTopics.map((topic, index) => {
            const isFirst = index === 0;
            const isLast = index === orderedTopics.length - 1;

            return (
              <div
                key={topic.id}
                className="flex items-center justify-between p-2.5 rounded-lg border border-[#E4E2DE] bg-white hover:border-[#5557C8]/40 transition-all duration-150 shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  <GripVertical className="w-4 h-4 text-[#777782] shrink-0 select-none opacity-60" />
                  <span className="w-6 h-6 rounded-md bg-[#F8F7F4] text-[#24242A] text-xs font-mono font-bold flex items-center justify-center shrink-0 border border-[#E4E2DE] select-none tabular-nums">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <h5 className="text-xs font-semibold text-[#24242A] truncate">
                      {topic.title}
                    </h5>
                    {topic.prerequisites && topic.prerequisites.length > 0 && (
                      <span className="text-[10px] text-[#777782] block truncate">
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
                    className="p-1.5 rounded-md text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition active:scale-95"
                    aria-label={`Move "${topic.title}" up`}
                    title={`Move up (currently position ${index + 1})`}
                  >
                    <ArrowUp className="w-3.5 h-3.5 pointer-events-none" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveDown(index)}
                    disabled={isLast || reorderMutation.isPending}
                    className="p-1.5 rounded-md text-[#777782] hover:text-[#24242A] hover:bg-[#24242A]/5 disabled:opacity-20 disabled:pointer-events-none cursor-pointer transition active:scale-95"
                    aria-label={`Move "${topic.title}" down`}
                    title={`Move down (currently position ${index + 1})`}
                  >
                    <ArrowDown className="w-3.5 h-3.5 pointer-events-none" />
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
