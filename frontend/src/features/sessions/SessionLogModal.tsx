import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Textarea } from '../../components/ui/Textarea';
import { useGoals } from '../../hooks/useGoals';
import { useCreateSession } from '../../hooks/useSessions';
import { useSettings } from '../../hooks/useSettings';
import type { Topic } from '../../types';
import { getErrorMessage } from '../../utils/formatters';
import { createSessionSchema } from '../../utils/schemas';

interface SessionLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTopic?: Topic | null;
}

export const SessionLogModal: React.FC<SessionLogModalProps> = ({
  isOpen,
  onClose,
  defaultTopic,
}) => {
  const { data: settings } = useSettings();
  const { data: goals = [] } = useGoals();
  const createMutation = useCreateSession();
  const [serverError, setServerError] = useState<string | null>(null);

  const minMinutes = settings?.minSessionMinutes ?? 5;
  const maxMinutes = settings?.maxSessionMinutes ?? 480;

  // Today in YYYY-MM-DD local format
  const todayStr = new Date().toISOString().split('T')[0];

  const sessionSchema = createSessionSchema(minMinutes, maxMinutes, todayStr);
  type SessionFormData = z.infer<typeof sessionSchema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    mode: 'onTouched',
    defaultValues: {
      topicId: '',
      studyDate: todayStr,
      minutes: 30,
      note: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        topicId: defaultTopic ? defaultTopic.id : '',
        studyDate: todayStr,
        minutes: 30,
        note: '',
      });
    }
  }, [defaultTopic, reset, isOpen, todayStr]);

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  // Aggregate all topics from all goals for the selector
  const allTopics: Array<{ id: string; title: string; goalTitle: string }> = [];
  for (const goal of goals) {
    for (const t of goal.topics || []) {
      allTopics.push({
        id: t.id,
        title: t.title,
        goalTitle: goal.title,
      });
    }
  }

  const onSubmit = async (data: SessionFormData) => {
    setServerError(null);
    try {
      // Backend expects ISO string or date string
      const isoStudyDate = new Date(`${data.studyDate}T12:00:00.000Z`).toISOString();
      await createMutation.mutateAsync({
        topicId: data.topicId,
        studyDate: isoStudyDate,
        minutes: data.minutes,
        note: data.note || undefined,
      });
      onClose();
    } catch (err) {
      // Preserve user form state and present clear backend error
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Log Study Session"
      description="Record focused study time on a curriculum milestone."
      size="md"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={handleClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit(onSubmit)}
            isLoading={isSubmitting}
            disabled={!isValid || isSubmitting}
          >
            Save Session
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

        <Select
          label="Curriculum Milestone"
          requiredIndicator
          error={errors.topicId?.message}
          helperText="Select the topic milestone you focused on."
          {...register('topicId')}
        >
          <option value="">Select a topic milestone...</option>
          {allTopics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title} - ({t.goalTitle})
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Study Date"
            type="date"
            max={todayStr}
            requiredIndicator
            error={errors.studyDate?.message}
            helperText="Cannot be in the future."
            {...register('studyDate')}
          />

          <div>
            <Input
              label="Duration (Minutes)"
              type="number"
              min={minMinutes}
              max={maxMinutes}
              requiredIndicator
              error={errors.minutes?.message}
              helperText={`Allowed range: ${minMinutes}–${maxMinutes} minutes.`}
              {...register('minutes', { valueAsNumber: true })}
            />
          </div>
        </div>

        <Textarea
          label="Session Reflections & Notes (Optional)"
          placeholder="Key concepts grasped, problems solved, textbook reference..."
          rows={3}
          error={errors.note?.message}
          {...register('note')}
        />
      </form>
    </Modal>
  );
};
