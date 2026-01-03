import { useCallback, useEffect, useRef, useState } from 'react';

import { Html5Qrcode } from 'html5-qrcode';
import { Camera, HelpCircle, Monitor, RefreshCcw, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { checkInBooking } from '@/features/booking/api';
import type { BookingResponse } from '@/features/booking/types';

export const AdminCheckInScannerPage = () => {
  const [manualCode, setManualCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scannedBooking, setScannedBooking] = useState<BookingResponse | null>(null);

  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  // Use a ref to control the scanner instance
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'reader-custom';

  const handleCheckIn = useCallback(
    async (code: string) => {
      if (isLoading) return;

      setIsLoading(true);

      // Pause scanner immediately upon detection to prevent duplicate scans
      if (scannerRef.current && isScannerRunning) {
        try {
          await scannerRef.current.pause(true);
        } catch {
          console.warn('Could not pause scanner');
        }
      }

      try {
        const booking = await checkInBooking(code);
        setScannedBooking(booking);
        toast.success(`Check-in thành công: ${code}`, {
          description: `Khách hàng: ${booking.passengerName} - ${booking.tickets.length} vé`,
        });
      } catch (error) {
        console.error('Check-in failed:', error);

        // Cast to unknown first then to a shape we expect
        const err = error as {
          response?: { status?: number; data?: { message?: string } };
          message?: string;
        };
        const errorMessage = err?.response?.data?.message || err?.message || '';
        const status = err?.response?.status;

        if (status === 404 || errorMessage.includes('Booking not found')) {
          toast.error('Mã không hợp lệ', {
            description: 'Không tìm thấy mã vé này trong hệ thống.',
          });
        } else if (errorMessage.includes('ALREADY_CHECKED_IN')) {
          toast.warning('Mã đã sử dụng', {
            description: 'Hành khách này đã check-in trước đó.',
            duration: 5000,
          });
        } else if (errorMessage.includes('INVALID_STATUS')) {
          toast.error('Mã không hợp lệ', {
            description: 'Vé chưa thanh toán hoặc đã bị hủy.',
            duration: 5000,
          });
        } else {
          toast.error('Check-in thất bại', {
            description: 'Vui lòng thử lại hoặc kiểm tra kết nối.',
          });
        }

        // If error, resume scanning after a short delay so user can try another code or re-scan
        // Let's resume automatically for errors to keep flow smooth.
        if (scannerRef.current && isScannerRunning) {
          setTimeout(() => {
            scannerRef.current?.resume();
          }, 2000);
        }
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, isScannerRunning],
  );

  // Use a ref for the callback to avoid re-creating startScanner when state changes
  const handleCheckInRef = useRef(handleCheckIn);
  useEffect(() => {
    handleCheckInRef.current = handleCheckIn;
  }, [handleCheckIn]);

  const startScanner = useCallback(async () => {
    // If we think it's running or initializing, we should probably be careful.
    // However, with stabilized startScanner, this function won't be called repeatedly by useEffect.

    if (scannerRef.current) {
      try {
        try {
          await scannerRef.current.stop();
        } catch {
          // ignore
        }
        try {
          scannerRef.current.clear();
        } catch {
          // ignore
        }
      } catch {
        // ignore
      }
    }

    setCameraError(null);
    setIsInitializing(true);
    setIsScannerRunning(false);

    try {
      // 1. Check if camera exists on device first (fail fast)
      const devices = await Html5Qrcode.getCameras().catch((err) => {
        throw new Error(err || 'Không thể liệt kê danh sách camera.');
      });

      if (!devices || devices.length === 0) {
        throw new Error('Không tìm thấy Camera trên thiết bị này.');
      }

      const html5QrCode = new Html5Qrcode(scannerContainerId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // 2. Start with timeout to prevent hanging forever
      const startPromise = html5QrCode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Use the ref here
          handleCheckInRef.current(decodedText);
        },
        () => {
          // error - ignored for individual frames
        },
      );

      // Race against a 10s timeout
      await Promise.race([
        startPromise,
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Khởi động Camera quá lâu (Timeout).')), 10000),
        ),
      ]);

      setIsScannerRunning(true);
    } catch (err) {
      console.error('Error starting scanner', err);
      setIsScannerRunning(false);

      const error = err as { message?: string; name?: string };
      let friendlyMsg = error?.message || 'Không thể khởi động camera.';

      if (error?.name === 'NotAllowedError' || error?.message?.includes('permission')) {
        friendlyMsg = 'Quyền truy cập Camera bị từ chối. Vui lòng cấp quyền và thử lại.';
      } else if (friendlyMsg.includes('Timeout')) {
        friendlyMsg = 'Camera không phản hồi. Vui lòng tải lại trang.';
      }

      setCameraError(friendlyMsg);
    } finally {
      setIsInitializing(false);
    }
  }, []); // Empty dependency array = Stable function identity

  const resetScanner = () => {
    setScannedBooking(null);
    setManualCode('');
    // Resume scanner if it was just paused
    if (scannerRef.current && isScannerRunning) {
      try {
        scannerRef.current.resume();
      } catch {
        startScanner();
      }
    } else {
      startScanner();
    }
  };

  // Initial start - only runs once on mount because startScanner is stable
  useEffect(() => {
    const timer = setTimeout(() => {
      startScanner();
    }, 500);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current && scannerRef.current.isScanning) {
        try {
          scannerRef.current.stop().catch(console.error);
          scannerRef.current.clear();
        } catch (e) {
          console.error(e);
        }
      }
    };
  }, [startScanner]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleCheckIn(manualCode.trim());
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-3xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Scanner Column */}
        <Card className="order-2 md:order-1 h-full flex flex-col">
          <CardHeader className="pb-3 shrink-0">
            <div className="flex justify-between items-start">
              <CardTitle className="text-xl flex items-center gap-2">
                {isScannerRunning && !cameraError ? (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                  </span>
                ) : (
                  <Camera className="h-5 w-5 text-muted-foreground" />
                )}
                Quét mã QR
              </CardTitle>
              <div className="flex gap-1">
                {(!isScannerRunning || isInitializing) && (
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={startScanner}
                    disabled={isInitializing}
                    title="Bật Camera"
                  >
                    <RefreshCcw className={`h-4 w-4 ${isInitializing ? 'animate-spin' : ''}`} />
                  </Button>
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary"
                    >
                      <HelpCircle className="h-5 w-5" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Hướng dẫn bật Camera</DialogTitle>
                      <DialogDescription>
                        Nếu không thấy Camera hoạt động, hãy kiểm tra cài đặt quyền truy cập.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Monitor className="h-4 w-4" /> Trên Máy tính (Chrome/Edge)
                        </h4>
                        <ol className="list-decimal list-inside space-y-1 text-muted-foreground ml-2">
                          <li>
                            Nhấn vào biểu tượng <strong>ổ khóa</strong> 🔒 hoặc{' '}
                            <strong>cài đặt</strong> bên trái thanh địa chỉ.
                          </li>
                          <li>
                            Tìm mục <strong>Máy ảnh (Camera)</strong>.
                          </li>
                          <li>
                            Chuyển sang trạng thái <strong>Cho phép (Allow)</strong>.
                          </li>
                          <li>Tải lại trang web.</li>
                        </ol>
                      </div>
                      <Separator />
                      <div className="space-y-2">
                        <h4 className="font-semibold flex items-center gap-2">
                          <Smartphone className="h-4 w-4" /> Trên Điện thoại
                        </h4>
                        <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                          <li>
                            Khi trình duyệt hỏi quyền truy cập Camera, hãy chọn{' '}
                            <strong>Cho phép</strong>.
                          </li>
                          <li>
                            Nếu đã lỡ chặn: Vào <strong>Cài đặt điện thoại</strong> &gt;{' '}
                            <strong>Ứng dụng</strong> &gt; <strong>Trình duyệt</strong> &gt;{' '}
                            <strong>Quyền</strong> &gt; Bật <strong>Máy ảnh</strong>.
                          </li>
                          <li>
                            Với iPhone (iOS): Vào <strong>Cài đặt</strong> &gt;{' '}
                            <strong>Safari</strong> &gt; <strong>Camera</strong> &gt; Chọn{' '}
                            <strong>Cho phép</strong>.
                          </li>
                        </ul>
                      </div>
                      <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-md text-yellow-800 text-xs">
                        <strong>Lưu ý:</strong> Camera có thể không hoạt động nếu bạn truy cập qua
                        địa chỉ IP (http://192.168...) mà không có bảo mật (HTTPS). Hãy dùng{' '}
                        <strong>localhost</strong> hoặc cấu hình HTTPS.
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Hướng camera về phía mã QR trên vé của khách.
            </p>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col">
            <div className="w-full rounded-lg overflow-hidden border bg-black/90 min-h-[300px] flex items-center justify-center relative">
              <div id="reader-custom" className="w-full h-full"></div>

              {/* Initializing Spinner Overlay */}
              {isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white bg-black/80 z-20">
                  <RefreshCcw className="h-10 w-10 animate-spin mb-4 text-blue-400" />
                  <p className="font-medium animate-pulse">Đang khởi động Camera...</p>
                </div>
              )}

              {cameraError && !isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white bg-black/80 z-10">
                  <Camera className="h-12 w-12 mb-4 text-red-500 opacity-80" />
                  <p className="font-semibold text-lg mb-2">Lỗi Camera</p>
                  <p className="text-sm text-gray-300 mb-6 max-w-[250px]">{cameraError}</p>
                  <Button onClick={startScanner} variant="secondary" size="sm">
                    <RefreshCcw className="mr-2 h-4 w-4" /> Thử lại
                  </Button>
                </div>
              )}

              {!isScannerRunning && !cameraError && !isInitializing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-white z-10">
                  <Button onClick={startScanner} variant="secondary">
                    <Camera className="mr-2 h-4 w-4" /> Bật Camera
                  </Button>
                </div>
              )}
            </div>

            <div className="mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-muted flex-1" />
                <span className="text-muted-foreground text-sm uppercase font-medium tracking-wider">
                  Hoặc nhập mã thủ công
                </span>
                <div className="h-px bg-muted flex-1" />
              </div>

              <form onSubmit={handleManualSubmit} className="flex flex-col gap-4">
                <Input
                  className="h-14 text-xl font-mono uppercase placeholder:normal-case tracking-widest text-center border-2 focus-visible:ring-offset-2"
                  placeholder="Mã vé (VD: BK-X8K9L2)"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                />
                <Button
                  type="submit"
                  size="lg"
                  className="h-12 text-lg w-full transition-all"
                  disabled={isLoading || !manualCode}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCcw className="h-4 w-4 animate-spin" /> Đang xử lý...
                    </span>
                  ) : (
                    'Kiểm tra & Check-in'
                  )}
                </Button>
              </form>
            </div>
          </CardContent>
        </Card>

        {/* Result Column */}
        <div className="order-1 md:order-2 space-y-6">
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-4 text-sm text-blue-800">
            <p className="font-semibold mb-1">💡 Mẹo quét mã:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700/80">
              <li>Giữ vé thẳng và đủ ánh sáng</li>
              <li>Sử dụng trình duyệt Chrome/Edge/Safari mới nhất</li>
              <li>Nếu dùng PC, đảm bảo đã cấp quyền Camera</li>
            </ul>
          </div>

          {scannedBooking ? (
            <div className="bg-white border rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-green-600 text-white p-4 text-center">
                <div className="mx-auto bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-2 text-2xl">
                  ✓
                </div>
                <h3 className="font-bold text-lg">Check-in Thành Công!</h3>
                <p className="opacity-90 text-sm">Khách đã lên xe</p>
              </div>
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Mã vé</p>
                    <p className="font-mono font-bold text-lg">{scannedBooking.code}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Họ tên</p>
                    <p className="font-semibold">{scannedBooking.passengerName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Số điện thoại</p>
                    <p className="font-semibold">{scannedBooking.passengerPhone}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase">Số ghế</p>
                    <p className="font-semibold text-primary">
                      {scannedBooking.tickets.map((t) => t.seatCode).join(', ')}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground uppercase mb-1">Hành trình</p>
                  <p className="font-medium">
                    {scannedBooking.trip.route.originStation.city}{' '}
                    <span className="text-muted-foreground">➝</span>{' '}
                    {scannedBooking.trip.route.destinationStation.city}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(scannedBooking.trip.departureTime).toLocaleString('vi-VN')}
                  </p>
                </div>

                <Button className="w-full mt-2" size="lg" onClick={resetScanner}>
                  Quét vé tiếp theo
                </Button>
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed rounded-xl p-8 text-center text-muted-foreground h-[300px] flex flex-col items-center justify-center bg-muted/5">
              <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-scan-line opacity-50"
                >
                  <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                  <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                  <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                  <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                  <path d="M7 12h10" />
                </svg>
              </div>
              <p>Thông tin vé sẽ hiện tại đây</p>
              <p className="text-xs opacity-70 mt-1">Sau khi quét thành công</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
