import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { useSettings } from '../../hooks/useSettings';
import { useCreateTopic, useUpdateTopic } from '../../hooks/useTopics';
import type { Topic } from '../../types';
import { getErrorMessage } from '../../utils/formatters';
import { topicFormSchema, type TopicFormData } from '../../utils/schemas';

interface TopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId: string;
  topicToEdit?: Topic | null;
  siblingTopics?: Topic[];
}

export const TopicModal: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  goalId,
  topicToEdit,
  siblingTopics = [],
}) => {
  if (!isOpen) return null;

  return (
    <TopicModalContent
      key={topicToEdit ? topicToEdit.id : 'new-topic'}
      isOpen={isOpen}
      onClose={onClose}
      goalId={goalId}
      topicToEdit={topicToEdit}
      siblingTopics={siblingTopics}
    />
  );
};

const TopicModalContent: React.FC<TopicModalProps> = ({
  isOpen,
  onClose,
  goalId,
  topicToEdit,
  siblingTopics = [],
}) => {
  const isEditing = !!topicToEdit;
  const createMutation = useCreateTopic();
  const updateMutation = useUpdateTopic();
  const { data: settings } = useSettings();
  const maxPrereqs = settings?.maxPrerequisitesPerTopic ?? 5;

  const initialPrereqs = (topicToEdit?.prerequisites || []).map(
    (p) => p.prerequisiteTopicId,
  );
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<string[]>(initialPrereqs);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<TopicFormData>({
    resolver: zodResolver(topicFormSchema),
    mode: 'onTouched',
    defaultValues: {
      title: topicToEdit ? topicToEdit.title : '',
      description: topicToEdit ? topicToEdit.description || '' : '',
      position: topicToEdit ? topicToEdit.position : siblingTopics.length + 1,
    },
  });

  // Filter out the current topic if editing (cannot depend on itself)
  const candidatePrerequisites = siblingTopics.filter(
    (t) => !topicToEdit || t.id !== topicToEdit.id,
  );

  const togglePrereq = (id: string) => {
    if (selectedPrereqIds.includes(id)) {
      setSelectedPrereqIds((prev) => prev.filter((item) => item !== id));
    } else {
      if (selectedPrereqIds.length >= maxPrereqs) {
        setServerError(`A topic cannot have more than ${maxPrereqs} prerequisites.`);
        return;
      }
      setServerError(null);
      setSelectedPrereqIds((prev) => [...prev, id]);
    }
  };

  const onSubmit = async (data: TopicFormData) => {
    setServerError(null);
    try {
      if (isEditing && topicToEdit) {
        await updateMutation.mutateAsync({
          id: topicToEdit.id,
          payload: {
            title: data.title,
            description: data.description || undefined,
            prerequisiteTopicIds: selectedPrereqIds,
          },
        });
      } else {
        await createMutation.mutateAsync({
          goalId,
          title: data.title,
          description: data.description || undefined,
          position: data.position,
          prerequisiteTopicIds: selectedPrereqIds,
        });
      }
      onClose();
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Topic Milestone' : 'Add Curriculum Topic'}
      description={
        isEditing
          ? 'Modify topic details and configure prerequisite milestone dependencies.'
          : 'Create a milestone with required prerequisites.'
      }
      size="md"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            {isEditing ? 'Save Changes' : 'Add Topic'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <Alert variant="error" onClose={() => setServerError(null)}>
            {serverError}
          </Alert>
        )}

        <Input
          label="Topic Title"
          placeholder="e.g. Raft Consensus Algorithm"
          requiredIndicator
          error={errors.title?.message}
          helperText="At least 2 characters naming this milestone."
          {...register('title')}
        />

        <Textarea
          label="Description & Scope (Optional)"
          placeholder="Key concepts, algorithms, textbook chapters, or exercises..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />

        {candidatePrerequisites.length > 0 && (
          <div className="space-y-2 pt-3 border-t border-[#E4E2DE]">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-[#24242A] tracking-tight select-none">
                Prerequisite Milestones
              </label>
              <span className="text-[11px] text-[#777782] tabular-nums select-none">
                Selected {selectedPrereqIds.length}/{maxPrereqs} max
              </span>
            </div>
            <p className="text-[11px] text-[#777782]">
              Select milestones that must be completed before this topic unlocks.
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-[#E4E2DE] rounded-xl p-2 bg-[#F8F7F4]">
              {candidatePrerequisites.map((t) => {
                const isChecked = selectedPrereqIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2.5 p-2 rounded-lg text-xs transition cursor-pointer select-none ${
                      isChecked
                        ? 'bg-[#EEEEFC] border border-[#5557C8]/30 text-[#5557C8] font-medium'
                        : 'bg-white border border-[#E4E2DE] text-[#24242A] hover:bg-[#F8F7F4]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePrereq(t.id)}
                      className="rounded border-[#E4E2DE] text-[#5557C8] focus:ring-[#5557C8] w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-[#777782] font-mono text-[10px]">#{t.position}</span>
                    <span className="truncate flex-1 font-medium">{t.title}</span>
                    {t.isCompleted && (
                      <span className="text-[10px] text-[#278568] bg-[#278568]/12 px-2 py-0.5 rounded-md border border-[#278568]/25 font-medium">
                        Completed
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
};
