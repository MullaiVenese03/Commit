import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocation, useNavigate } from 'react-router';
import { Alert } from '../../components/ui/Alert';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../hooks/useAuth';
import { getErrorMessage } from '../../utils/formatters';
import { loginSchema, type LoginFormData } from '../../utils/schemas';

interface LoginFormProps {
  initialEmail?: string;
  initialPassword?: string;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  initialEmail = '',
  initialPassword = '',
}) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onTouched',
    defaultValues: {
      email: initialEmail,
      password: initialPassword,
    },
  });

  // Watch for external demo credential selection
  React.useEffect(() => {
    if (initialEmail) setValue('email', initialEmail, { shouldValidate: true });
    if (initialPassword) setValue('password', initialPassword, { shouldValidate: true });
  }, [initialEmail, initialPassword, setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setServerError(null);
    try {
      await login(data);
      const destination = location.state?.from?.pathname || '/';
      navigate(destination, { replace: true });
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
        placeholder="••••••••"
        autoComplete="current-password"
        requiredIndicator
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
        Sign In
      </Button>
    </form>
  );
};
