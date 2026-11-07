import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Textarea } from '../../components/ui/Textarea';
import { useCreateGoal, useUpdateGoal } from '../../hooks/useGoals';
import type { Goal } from '../../types';
import { getErrorMessage } from '../../utils/formatters';
import { goalSchema, type GoalFormData } from '../../utils/schemas';

interface GoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
}

export const GoalModal: React.FC<GoalModalProps> = ({
  isOpen,
  onClose,
  goalToEdit,
}) => {
  const isEditing = !!goalToEdit;
  const createMutation = useCreateGoal();
  const updateMutation = useUpdateGoal();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    mode: 'onTouched',
    defaultValues: {
      title: '',
      description: '',
    },
  });

  useEffect(() => {
    if (goalToEdit) {
      reset({
        title: goalToEdit.title,
        description: goalToEdit.description || '',
      });
    } else {
      reset({
        title: '',
        description: '',
      });
    }
  }, [goalToEdit, reset, isOpen]);

  const handleClose = () => {
    setServerError(null);
    onClose();
  };

  const onSubmit = async (data: GoalFormData) => {
    setServerError(null);
    try {
      if (isEditing && goalToEdit) {
        await updateMutation.mutateAsync({
          id: goalToEdit.id,
          payload: {
            title: data.title,
            description: data.description || undefined,
          },
        });
      } else {
        await createMutation.mutateAsync({
          title: data.title,
          description: data.description || undefined,
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
      onClose={handleClose}
      title={isEditing ? 'Edit Study Goal' : 'Create New Study Goal'}
      description={
        isEditing
          ? 'Update the title and scope of your study curriculum.'
          : 'Define a high-level subject or technical curriculum to master.'
      }
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
            {isEditing ? 'Save Changes' : 'Create Goal'}
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
          label="Curriculum Title"
          placeholder="e.g. Distributed Systems & Consensus"
          requiredIndicator
          error={errors.title?.message}
          helperText="At least 3 characters describing the goal."
          {...register('title')}
        />

        <Textarea
          label="Scope & Learning Objectives (Optional)"
          placeholder="Detail key resources, textbook chapters, or competencies..."
          rows={3}
          error={errors.description?.message}
          {...register('description')}
        />
      </form>
    </Modal>
  );
};
