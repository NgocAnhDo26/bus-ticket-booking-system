import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';

import { useAuthStore } from '@/store/auth-store';

import { register as registerApi } from '../api';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import { type RegisterFormValues, registerSchema } from '../schema';

export const RegisterPage = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const navigate = useNavigate();
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      setAuth(data);
      navigate('/dashboard');
    },
  });

  const apiError = registerMutation.error?.message;

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    });
  };

  return (
    <AuthLayout>
      <RegisterForm
        form={form}
        onSubmit={onSubmit}
        isSubmitting={registerMutation.isPending}
        error={apiError}
      />
    </AuthLayout>
  );
};
