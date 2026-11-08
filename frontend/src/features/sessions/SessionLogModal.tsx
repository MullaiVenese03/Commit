import React, { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { DatePicker } from '../../components/ui/DatePicker';
import { DurationInput } from '../../components/ui/DurationInput';
import { Modal } from '../../components/ui/Modal';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
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
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const sessionSchema = createSessionSchema(minMinutes, maxMinutes, todayStr);
  type SessionFormData = z.infer<typeof sessionSchema>;

  const {
    register,
    handleSubmit,
    setValue,
    control,
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

  const selectedTopicId = useWatch({ control, name: 'topicId' }) ?? '';
  const selectedDate = useWatch({ control, name: 'studyDate' }) ?? todayStr;
  const selectedMinutes = useWatch({ control, name: 'minutes' }) ?? 30;

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

  // Aggregate all topics from all goals for the searchable selector
  const allTopicOptions: Array<{ value: string; label: string; secondaryLabel: string }> = [];
  for (const goal of goals) {
    for (const t of goal.topics || []) {
      allTopicOptions.push({
        value: t.id,
        label: t.title,
        secondaryLabel: goal.title,
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

        {/* Custom Searchable Topic Selector */}
        <SearchableSelect
          label="Curriculum Milestone"
          requiredIndicator
          options={allTopicOptions}
          value={selectedTopicId}
          onChange={(newTopicId) => setValue('topicId', newTopicId, { shouldValidate: true, shouldTouch: true })}
          error={errors.topicId?.message}
          helperText="Select the topic milestone you focused on."
          placeholder="Search and select milestone topic..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Custom macOS Calendar Date Picker Popover */}
          <DatePicker
            label="Study Date"
            requiredIndicator
            value={selectedDate}
            onChange={(newDate) => setValue('studyDate', newDate, { shouldValidate: true, shouldTouch: true })}
            maxDate={todayStr}
            error={errors.studyDate?.message}
            helperText="Cannot be in the future."
          />

          {/* Custom Duration Input with presets & hidden browser spinners */}
          <DurationInput
            label="Duration (Minutes)"
            requiredIndicator
            value={selectedMinutes}
            onChange={(newMinutes) => setValue('minutes', newMinutes, { shouldValidate: true, shouldTouch: true })}
            min={minMinutes}
            max={maxMinutes}
            error={errors.minutes?.message}
            helperText={`Allowed range: ${minMinutes}–${maxMinutes} minutes.`}
          />
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
