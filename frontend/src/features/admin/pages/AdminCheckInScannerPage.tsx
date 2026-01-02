import { Html5QrcodeScanner } from 'html5-qrcode';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { checkInBooking } from '@/features/booking/api';
import type { BookingResponse } from '@/features/booking/types';

export const AdminCheckInScannerPage = () => {
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannedBooking, setScannedBooking] = useState<BookingResponse | null>(null);

  // Use a ref to control the scanner instance to prevent double rendering issues in React Strict Mode
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const handleCheckIn = useCallback(
    async (code: string) => {
      // Debounce or prevent multiple calls if needed, but for now simple state check
      if (isLoading) return;

      setIsLoading(true);
      try {
        const booking = await checkInBooking(code);
        setScannedBooking(booking);
        toast.success(`Check-in thành công: ${code}`, {
          description: `Khách hàng: ${booking.passengerName} - ${booking.tickets.length} vé`,
        });
      } catch (error) {
        console.error('Check-in failed:', error);
        toast.error('Check-in thất bại', {
          description: 'Mã vé không hợp lệ hoặc lỗi hệ thống.',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading],
  );

  useEffect(() => {
    // Clean up previous scanner if exists
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error);
    }

    const scanner = new Html5QrcodeScanner(
      'reader',
      {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      },
      /* verbose= */ false,
    );

    scannerRef.current = scanner;

    scanner.render(
      (decodedText) => {
        handleCheckIn(decodedText);
        // Optional: Pause scanner after successful scan
        // scanner.pause();
      },
      () => {
        // console.log(_errorMessage); // Ignore scan errors
      },
    );

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
      }
    };
  }, [handleCheckIn]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCheckIn(manualCode.trim());
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-center text-2xl">Quét Vé Check-in</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div id="reader" className="w-full"></div>

          <div className="flex items-center gap-2">
            <div className="h-px bg-muted flex-1" />
            <span className="text-muted-foreground text-xs">HOẶC NHẬP MÃ</span>
            <div className="h-px bg-muted flex-1" />
          </div>

          <form onSubmit={handleManualSubmit} className="flex gap-2">
            <Input
              placeholder="Nhập mã vé (VD: BK-12345)"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button type="submit" disabled={isLoading || !manualCode}>
              {isLoading ? 'Đang xử lý...' : 'Check-in'}
            </Button>
          </form>

          {scannedBooking && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-bold text-green-800 mb-2">Check-in Thành Công!</h3>
              <div className="text-sm space-y-1 text-green-700">
                <p>
                  <span className="font-semibold">Mã vé:</span> {scannedBooking.code}
                </p>
                <p>
                  <span className="font-semibold">Hành khách:</span> {scannedBooking.passengerName}
                </p>
                <p>
                  <span className="font-semibold">SĐT:</span> {scannedBooking.passengerPhone}
                </p>
                <p>
                  <span className="font-semibold">Tuyến:</span>{' '}
                  {scannedBooking.trip.route.originStation.city} ➝{' '}
                  {scannedBooking.trip.route.destinationStation.city}
                </p>
                <p>
                  <span className="font-semibold">Ghế:</span>{' '}
                  {scannedBooking.tickets.map((t) => t.seatCode).join(', ')}
                </p>
              </div>
              <Button
                className="w-full mt-4"
                variant="outline"
                onClick={() => {
                  setScannedBooking(null);
                  setManualCode('');
                }}
              >
                Quét vé tiếp theo
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
