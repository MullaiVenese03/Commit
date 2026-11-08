import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { useSettings, useUpdateSettings } from '../../hooks/useSettings';
import { formatDate, getErrorMessage } from '../../utils/formatters';
import { settingsSchema, type SettingsFormData } from '../../utils/schemas';

export const SystemSettingsForm: React.FC = () => {
  const { isMentor } = useAuth();
  const { data: settings, isLoading } = useSettings();
  const updateMutation = useUpdateSettings();

  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (settings) {
      reset({
        minSessionMinutes: settings.minSessionMinutes,
        maxSessionMinutes: settings.maxSessionMinutes,
        maxPrerequisitesPerTopic: settings.maxPrerequisitesPerTopic,
      });
    }
  }, [settings, reset]);

  const onSubmit = async (data: SettingsFormData) => {
    setFeedback(null);
    try {
      await updateMutation.mutateAsync({
        minSessionMinutes: data.minSessionMinutes,
        maxSessionMinutes: data.maxSessionMinutes,
        maxPrerequisitesPerTopic: data.maxPrerequisitesPerTopic,
      });
      setFeedback({
        type: 'success',
        message: 'System settings successfully updated and applied globally.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: getErrorMessage(err),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center text-xs text-[#777782]">
        Loading system configuration parameters...
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl" noValidate>
      {feedback && (
        <Alert
          variant={feedback.type === 'success' ? 'success' : 'error'}
          onClose={() => setFeedback(null)}
        >
          {feedback.message}
        </Alert>
      )}

      <div className="space-y-4">
        <div>
          <Input
            label="Minimum Study Session Duration (Minutes)"
            type="number"
            min={1}
            max={60}
            hideSpinners
            requiredIndicator
            disabled={!isMentor || isSubmitting}
            helperText="Allowed range: 1 to 60 minutes (default: 5)"
            error={errors.minSessionMinutes?.message}
            {...register('minSessionMinutes', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Input
            label="Maximum Study Session Duration (Minutes)"
            type="number"
            min={60}
            max={1440}
            hideSpinners
            requiredIndicator
            disabled={!isMentor || isSubmitting}
            helperText="Allowed range: 60 to 1440 minutes (default: 480)"
            error={errors.maxSessionMinutes?.message}
            {...register('maxSessionMinutes', { valueAsNumber: true })}
          />
        </div>

        <div>
          <Input
            label="Maximum Prerequisites Per Topic"
            type="number"
            min={1}
            max={20}
            hideSpinners
            requiredIndicator
            disabled={!isMentor || isSubmitting}
            helperText="Allowed range: 1 to 20 prerequisites per milestone (default: 5)"
            error={errors.maxPrerequisitesPerTopic?.message}
            {...register('maxPrerequisitesPerTopic', { valueAsNumber: true })}
          />
        </div>
      </div>

      {settings && (
        <div className="p-3.5 bg-[#F8F7F4] rounded-xl border border-[#E4E2DE] text-xs text-[#777782] space-y-1">
          <p>
            <span className="font-semibold text-[#24242A]">Last Modified:</span>{' '}
            {formatDate(settings.updatedAt)}
          </p>
          {settings.updatedBy?.name && (
            <p>
              <span className="font-semibold text-[#24242A]">Modified By:</span>{' '}
              {settings.updatedBy.name} ({settings.updatedBy.email})
            </p>
          )}
        </div>
      )}

      {isMentor && (
        <div className="pt-2">
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={!isValid || isSubmitting}
            size="sm"
          >
            Save Global Settings
          </Button>
        </div>
      )}
    </form>
  );
};
