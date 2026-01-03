import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { getFriendlyErrorMessage } from '@/utils/error-utils';

import { register as registerApi } from '../api';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import { type RegisterFormValues, registerSchema } from '../schema';

export const RegisterPage = () => {
  const [isSuccess, setIsSuccess] = useState(false);

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
    onSuccess: () => {
      setIsSuccess(true);
      toast.success('Đăng ký thành công!');
    },
    onError: (err) => {
      const msg = getFriendlyErrorMessage(err);
      toast.error(msg);
    },
  });

  const onSubmit = (values: RegisterFormValues) => {
    registerMutation.mutate({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    });
  };

  if (isSuccess) {
    return (
      <AuthLayout>
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="bg-green-100 p-3 rounded-full">
            <CheckCircle2 className="h-12 w-12 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-700">Đăng ký thành công!</h1>
          <div className="text-muted-foreground space-y-2">
            <p>Tài khoản của bạn đã được tạo.</p>
            <p>
              Vui lòng kiểm tra email <strong>{form.getValues('email')}</strong> để kích hoạt tài
              khoản.
            </p>
          </div>
          <Button asChild className="w-full">
            <Link to="/login">Quay lại trang đăng nhập</Link>
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <RegisterForm form={form} onSubmit={onSubmit} isSubmitting={registerMutation.isPending} />
    </AuthLayout>
  );
};
