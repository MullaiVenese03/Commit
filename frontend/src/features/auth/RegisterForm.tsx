import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/formatters';
import { registerSchema, type RegisterFormData } from '../../utils/schemas';

export const RegisterForm: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onTouched',
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setServerError(null);
    try {
      await registerUser(data);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5" noValidate>
      {serverError && (
        <Alert variant="error" onClose={() => setServerError(null)}>
          {serverError}
        </Alert>
      )}

      <Input
        label="Full Name"
        type="text"
        placeholder="Alex Mercer"
        autoComplete="name"
        requiredIndicator
        error={errors.name?.message}
        {...register('name')}
      />

      <Input
        label="Email Address"
        type="email"
        placeholder="alex.mercer@commit.dev"
        autoComplete="email"
        requiredIndicator
        error={errors.email?.message}
        {...register('email')}
      />

      <Input
        label="Password"
        type="password"
        placeholder="Minimum 8 characters"
        autoComplete="new-password"
        requiredIndicator
        helperText="Must be at least 8 characters long."
        error={errors.password?.message}
        {...register('password')}
      />

      <Button
        type="submit"
        variant="primary"
        isLoading={isSubmitting}
        disabled={!isValid || isSubmitting}
        className="w-full mt-2"
        size="md"
      >
        Create Learner Account
      </Button>
    </form>
  );
};
