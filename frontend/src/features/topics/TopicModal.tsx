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
          <div className="space-y-2 pt-2 border-t border-zinc-100">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-zinc-700 tracking-tight">
                Prerequisite Milestones
              </label>
              <span className="text-[11px] text-zinc-400">
                Selected {selectedPrereqIds.length}/{maxPrereqs} max
              </span>
            </div>
            <p className="text-[11px] text-zinc-500">
              Select milestones that must be completed before this topic unlocks.
            </p>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border border-zinc-200/90 rounded-md p-2 bg-zinc-50/50">
              {candidatePrerequisites.map((t) => {
                const isChecked = selectedPrereqIds.includes(t.id);
                return (
                  <label
                    key={t.id}
                    className={`flex items-center gap-2.5 p-2 rounded text-xs transition cursor-pointer select-none ${
                      isChecked
                        ? 'bg-blue-50/80 border border-blue-200 text-blue-900 font-medium'
                        : 'bg-white border border-zinc-200/80 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => togglePrereq(t.id)}
                      className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span className="text-zinc-400 font-mono text-[10px]">#{t.position}</span>
                    <span className="truncate flex-1">{t.title}</span>
                    {t.isCompleted && (
                      <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
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
