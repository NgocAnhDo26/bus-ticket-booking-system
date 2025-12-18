import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import type { SeatType } from '@/features/catalog/types';

export type PassengerFormValues = {
  passengerName: string;
  passengerPhone: string;
};

type PassengerFormProps = {
  seatCode: string;
  seatType: SeatType;
  price: number;
  index: number;
  values: PassengerFormValues;
  onChange: (values: PassengerFormValues) => void;
  errors?: { passengerName?: string; passengerPhone?: string };
};

export function PassengerForm({
  seatCode,
  seatType,
  price,
  index,
  values,
  onChange,
  errors,
}: PassengerFormProps) {
  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">
              {index + 1}
            </span>
            Ghế {seatCode}
            <span
              className={`text-xs px-2 py-0.5 rounded ${
                seatType === 'VIP' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'
              }`}
            >
              {seatType}
            </span>
          </span>
          <span className="text-primary font-semibold">
            {new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(price)}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Họ và tên hành khách" error={errors?.passengerName}>
            <Input
              placeholder="Nguyễn Văn A"
              value={values.passengerName}
              onChange={(e) => onChange({ ...values, passengerName: e.target.value })}
            />
          </FormField>
          <FormField label="Số điện thoại" error={errors?.passengerPhone}>
            <Input
              placeholder="0901234567"
              value={values.passengerPhone}
              onChange={(e) => onChange({ ...values, passengerPhone: e.target.value })}
            />
          </FormField>
        </div>
      </CardContent>
    </Card>
  );
}
