import { useMemo, useState } from 'react';

import { Plus, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import { useUpdateTripStops } from '../hooks';
import type { Trip, TripStopDto } from '../types';

interface TripStopsDialogProps {
  trip: Trip | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type EditableStop = {
  customName: string;
  customAddress: string;
  stopOrder: number;
  durationMinutesFromOrigin: number;
  stopType: 'PICKUP' | 'DROPOFF' | 'BOTH';
  scheduledTime?: string;
  actualTime?: string;
};

// Inner component that resets state when remounted via key
const TripStopsDialogContent = ({
  trip,
  onOpenChange,
}: {
  trip: Trip;
  onOpenChange: (open: boolean) => void;
}) => {
  const updateTripStops = useUpdateTripStops();

  // Derive initial stops from trip points if available, otherwise fallback to route stops template
  const initialStops = useMemo<EditableStop[]>(() => {
    if (trip.tripPoints && trip.tripPoints.length > 0) {
      // Sort by pointOrder
      return [...trip.tripPoints]
        .sort((a, b) => a.pointOrder - b.pointOrder)
        .map((p) => ({
          customName: p.station?.name ?? '', // TripPoints always have station or we should handle custom names if added to TripPoint
          customAddress: p.station?.address ?? '',
          stopOrder: p.pointOrder,
          durationMinutesFromOrigin: 0, // Not used primarily for display anymore, but kept for compatibility
          stopType: p.pointType,
          scheduledTime: p.scheduledTime, // Display absolute time
          actualTime: p.actualTime,
        }));
    }

    // Fallback to route stops (Template mode)
    // Fallback to route stops (Template mode)
    return (trip.route.stops || []).map((s) => ({
      customName: s.customName ?? s.station?.name ?? '',
      customAddress: s.customAddress ?? s.station?.address ?? '',
      stopOrder: s.stopOrder,
      durationMinutesFromOrigin: s.durationMinutesFromOrigin,
      stopType: s.stopType,
    }));
  }, [trip]);

  const [stops, setStops] = useState<EditableStop[]>(initialStops);

  // For adding new stops
  const [newName, setNewName] = useState<string>('');
  const [newAddress, setNewAddress] = useState<string>('');

  const handleAddStop = () => {
    if (!newAddress.trim()) return;

    const maxOrder = stops.length > 0 ? Math.max(...stops.map((s) => s.stopOrder)) : 0;

    // Simple heuristic for new stop time: +30 mins from last stop or departure time
    const lastStop = stops.length > 0 ? stops[stops.length - 1] : null;
    let newScheduledTime = new Date(trip.departureTime); // Default to departure

    if (lastStop && lastStop.scheduledTime) {
      newScheduledTime = new Date(lastStop.scheduledTime);
      newScheduledTime.setMinutes(newScheduledTime.getMinutes() + 30);
    } else {
      newScheduledTime.setMinutes(newScheduledTime.getMinutes() + 30);
    }

    const newStop: EditableStop = {
      customName: newName.trim() || newAddress.trim(),
      customAddress: newAddress.trim(),
      stopOrder: maxOrder + 1,
      durationMinutesFromOrigin: 0,
      stopType: 'BOTH',
      scheduledTime: newScheduledTime.toISOString(),
    };

    setStops((prev) => [...prev, newStop]);
    setNewName('');
    setNewAddress('');
  };

  const handleNameChange = (index: number, value: string) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, customName: value } : s)));
  };

  const handleAddressChange = (index: number, value: string) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, customAddress: value } : s)));
  };

  const handleScheduledTimeChange = (index: number, value: string) => {
    // Value comes from input type="datetime-local" (YYYY-MM-DDTHH:mm)
    // Need to convert to ISO string
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      setStops((prev) =>
        prev.map((s, i) => (i === index ? { ...s, scheduledTime: date.toISOString() } : s)),
      );
    }
  };

  const handleActualTimeChange = (index: number, value: string) => {
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      setStops((prev) =>
        prev.map((s, i) => (i === index ? { ...s, actualTime: date.toISOString() } : s)),
      );
    }
  };

  const handleStopTypeChange = (index: number, value: 'PICKUP' | 'DROPOFF' | 'BOTH') => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, stopType: value } : s)));
  };

  const handleStopOrderChange = (index: number, value: number) => {
    setStops((prev) => prev.map((s, i) => (i === index ? { ...s, stopOrder: value } : s)));
  };

  const handleRemove = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    // Sort by stopOrder before saving
    const sortedStops = [...stops].sort((a, b) => a.stopOrder - b.stopOrder);

    const payload: TripStopDto[] = sortedStops.map((s) => ({
      customName: s.customName,
      customAddress: s.customAddress,
      stopOrder: s.stopOrder,
      durationMinutesFromOrigin: s.durationMinutesFromOrigin, // Might calculate delta if backend requires it
      stopType: s.stopType,
    }));

    updateTripStops.mutate(
      { id: trip.id, data: { stops: payload } },
      {
        onSuccess: () => {
          onOpenChange(false);
        },
        onError: (error) => {
          alert('Lỗi cập nhật trạm: ' + error.message);
        },
      },
    );
  };

  const formatDateTimeLocal = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    // Format to YYYY-MM-DDTHH:mm for input type="datetime-local"
    // Adjust to local timezone logic if needed, but simple slice works for UTC-like behavior in browsers sometimes
    // Better to use library or simple offset construction
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - offset * 60 * 1000);
    return localDate.toISOString().slice(0, 16);
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Quản lý Trạm dừng & Lịch trình</DialogTitle>
        <DialogDescription>Cập nhật giờ đón/trả thực tế cho chuyến xe.</DialogDescription>
      </DialogHeader>

      {/* Add new stop section */}
      <div className="border rounded-lg p-4 bg-muted/50 space-y-3">
        <Label className="font-medium">Thêm trạm mới</Label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-sm text-muted-foreground">Tên trạm</Label>
            <Input
              placeholder="VD: Ngã tư Bình Phước"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </div>
          <div>
            <Label className="text-sm text-muted-foreground">Địa chỉ *</Label>
            <Input
              placeholder="VD: 123 Quốc Lộ 1A, Q.12, TP.HCM"
              value={newAddress}
              onChange={(e) => setNewAddress(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={handleAddStop} disabled={!newAddress.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm trạm
          </Button>
        </div>
      </div>

      {/* Stops table */}
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">#</TableHead>
              <TableHead>Tên trạm / Địa chỉ</TableHead>
              <TableHead className="w-[180px]">Giờ Dự Kiến</TableHead>
              <TableHead className="w-[180px]">Giờ Thực Tế</TableHead>
              <TableHead className="w-[100px]">Loại</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stops.map((stop, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Input
                    type="number"
                    min={1}
                    value={stop.stopOrder}
                    onChange={(e) => handleStopOrderChange(index, parseInt(e.target.value) || 1)}
                    className="w-12 px-2"
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <Input
                      value={stop.customName}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      placeholder="Tên trạm"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={stop.customAddress}
                      onChange={(e) => handleAddressChange(index, e.target.value)}
                      placeholder="Địa chỉ"
                      className="h-8 text-xs text-muted-foreground"
                    />
                  </div>
                </TableCell>
                <TableCell>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeLocal(stop.scheduledTime)}
                    onChange={(e) => handleScheduledTimeChange(index, e.target.value)}
                    className="w-full text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Input
                    type="datetime-local"
                    value={formatDateTimeLocal(stop.actualTime)}
                    onChange={(e) => handleActualTimeChange(index, e.target.value)}
                    className="w-full text-xs"
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={stop.stopType}
                    onValueChange={(v) =>
                      handleStopTypeChange(index, v as 'PICKUP' | 'DROPOFF' | 'BOTH')
                    }
                  >
                    <SelectTrigger className="w-full h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PICKUP">Đón</SelectItem>
                      <SelectItem value="DROPOFF">Trả</SelectItem>
                      <SelectItem value="BOTH">Cả hai</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    className="text-destructive hover:text-destructive h-8 w-8"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {stops.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  Chưa có trạm nào. Thêm trạm dừng ở form phía trên.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Hủy
        </Button>
        <Button onClick={handleSave} disabled={updateTripStops.isPending}>
          {updateTripStops.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
        </Button>
      </DialogFooter>
    </>
  );
};

// Exported wrapper component - uses key to remount inner component when trip changes
export const TripStopsDialog = ({ trip, open, onOpenChange }: TripStopsDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="min-w-[600px]">
        {trip && <TripStopsDialogContent key={trip.id} trip={trip} onOpenChange={onOpenChange} />}
      </DialogContent>
    </Dialog>
  );
};
