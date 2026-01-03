import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { LoginForm } from '@/features/auth/components/LoginForm';
import { useAuthStore } from '@/store/auth-store';
import { getFriendlyErrorMessage } from '@/utils/error-utils';

import { login, loginWithGoogle } from '../api';
import { AuthLayout } from '../components/AuthLayout';
import { type LoginFormValues, loginSchema } from '../schema';

export const LoginPage = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const navigate = useNavigate();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Đăng nhập thành công!');
      navigate('/');
    },
    onError: (error) => {
      const msg = getFriendlyErrorMessage(error);
      toast.error('Đăng nhập thất bại: ' + msg);
    },
  });

  const googleMutation = useMutation({
    mutationFn: loginWithGoogle,
    onSuccess: (data) => {
      setAuth(data);
      toast.success('Đăng nhập Google thành công!');
      navigate('/');
    },
    onError: (error) => {
      const msg = getFriendlyErrorMessage(error);
      toast.error(msg);
    },
  });

  const onSubmit = (values: LoginFormValues) => {
    // Clear any existing local auth state before login attempt
    clearAuth();
    loginMutation.mutate(values);
  };

  return (
    <AuthLayout>
      <LoginForm
        form={form}
        isSubmitting={loginMutation.isPending}
        onSubmit={onSubmit}
        onGoogleLogin={(credential) => googleMutation.mutate({ credential })}
        onGoogleError={() => {
          toast.error('Lỗi khi kết nối Google');
        }}
      />
    </AuthLayout>
  );
};
