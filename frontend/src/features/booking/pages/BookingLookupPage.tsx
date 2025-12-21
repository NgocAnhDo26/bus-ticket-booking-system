import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useMutation } from '@tanstack/react-query';
import { Search, Ticket } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

import { lookupBooking } from '../api';

export const BookingLookupPage = () => {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');

  const lookupMutation = useMutation({
    mutationFn: (data: { code: string; email: string }) => lookupBooking(data.code, data.email),
    onSuccess: (data) => {
      toast.success('Tra cứu thành công', {
        description: `Đã tìm thấy vé #${data.code}`,
      });
      navigate(`/booking/confirmation/${data.id}`);
    },
    onError: () => {
      toast.error('Không tìm thấy vé', {
        description: 'Vui lòng kiểm tra lại Mã đặt vé và Email.',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code || !email) return;
    lookupMutation.mutate({ code, email });
  };

  return (
    <div className="container mx-auto p-4 flex items-center justify-center min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-t-primary">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-2">
            <Ticket className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Tra cứu đặt vé</CardTitle>
          <CardDescription>Nhập mã vé và email để xem thông tin đặt vé của bạn</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Mã đặt vé</Label>
              <Input
                id="code"
                placeholder="Ví dụ: BK-X8K29L"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email đặt vé</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full" size="lg" disabled={lookupMutation.isPending}>
              {lookupMutation.isPending ? (
                'Đang tìm kiếm...'
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" /> Tra cứu ngay
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};
