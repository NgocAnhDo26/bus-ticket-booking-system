import { useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import { useMutation } from '@tanstack/react-query';
import { CheckCircle2, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { customInstance } from '@/lib/api-client';
import type { ApiResponseAuthResponse } from '@/model';

import { AuthLayout } from '../components/AuthLayout';

// We need to define this manually or use generated one if available later
const activateAccount = (token: string) => {
  return customInstance<ApiResponseAuthResponse>({
    url: `/api/auth/activate?token=${token}`,
    method: 'POST',
  });
};

export const ActivationPage = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const hasActivated = useRef(false);

  const activationMutation = useMutation({
    mutationFn: activateAccount,
  });

  useEffect(() => {
    if (hasActivated.current) return;

    if (token) {
      hasActivated.current = true;
      activationMutation.mutate(token);
    }
  }, [token, activationMutation]);

  // Derive status from mutation state and token
  const status = !token
    ? 'error'
    : activationMutation.isSuccess
      ? 'success'
      : activationMutation.isError
        ? 'error'
        : 'loading';

  return (
    <AuthLayout>
      <div className="flex flex-col items-center text-center space-y-6">
        {status === 'loading' && (
          <>
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <h1 className="text-2xl font-bold">Đang kích hoạt tài khoản...</h1>
            <p className="text-muted-foreground">Vui lòng đợi trong giây lát.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-green-700">Kích hoạt thành công!</h1>
            <p className="text-muted-foreground">
              Tài khoản của bạn đã được kích hoạt. Bạn có thể đăng nhập ngay bây giờ.
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Đăng nhập ngay</Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="bg-red-100 p-3 rounded-full">
              <XCircle className="h-12 w-12 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-red-700">Kích hoạt thất bại</h1>
            <p className="text-muted-foreground">
              Link kích hoạt không hợp lệ hoặc đã hết hạn. Vui lòng thử lại hoặc liên hệ hỗ trợ.
            </p>
            <Button asChild className="w-full" variant="outline">
              <Link to="/login">Quay lại đăng nhập</Link>
            </Button>
          </>
        )}
      </div>
    </AuthLayout>
  );
};
