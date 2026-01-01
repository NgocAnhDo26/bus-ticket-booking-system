import { useEffect, useState } from 'react';
import type { DateRange } from 'react-day-picker';

import { endOfDay, format } from 'date-fns';
import { CalendarIcon, ListFilter, Search, X } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

import { type AdminBookingFilters, type BookingStatus } from '../types';

interface BookingFilterProps {
  filters: AdminBookingFilters;
  onFilterChange: (filters: AdminBookingFilters) => void;
}

export const BookingFilter = ({ filters, onFilterChange }: BookingFilterProps) => {
  const [date, setDate] = useState<DateRange | undefined>(
    filters.startDate
      ? {
          from: new Date(filters.startDate),
          to: filters.endDate ? new Date(filters.endDate) : new Date(filters.startDate),
        }
      : undefined,
  );
  const [open, setOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (value: string) => {
    const status = value === 'ALL' ? undefined : (value as BookingStatus);
    onFilterChange({ ...filters, statuses: status ? [status] : undefined });
  };

  const handleDateSelect = (range: DateRange | undefined) => {
    setDate(range); // Update local state immediately for UI feedback
    if (range?.from) {
      // Only trigger API call if we have at least a start date
      // If 'to' is undefined (selection in progress), we can either wait or filter >= from
      // Let's filter >= from immediately.
      onFilterChange({
        ...filters,
        startDate: range.from.toISOString(),
        endDate: range.to ? endOfDay(range.to).toISOString() : undefined,
      });
    } else {
      // If range is undefined (cleared), clear filters
      onFilterChange({ ...filters, startDate: undefined, endDate: undefined });
    }
  };

  const clearFilters = () => {
    setDate(undefined);
    onFilterChange({ search: filters.search });
  };

  const activeFilterCount = (filters.statuses?.length ? 1 : 0) + (filters.startDate ? 1 : 0);

  return (
    <div className="flex flex-col sm:flex-row gap-4 mb-2 items-center justify-between">
      <div className="relative flex max-w-[400px] w-full">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm mã vé, tên, sđt..."
          className="pl-8"
          value={filters.search || ''}
          onChange={handleSearchChange}
        />
      </div>

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2 relative">
            <ListFilter className="h-4 w-4" />
            Bộ lọc
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 w-5 justify-center p-0 text-[10px]">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="end">
          <div className="space-y-4 min-w-[300px]">
            <div className="flex items-center justify-between">
              <h4 className="font-medium leading-none">Bộ lọc tìm kiếm</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                disabled={activeFilterCount === 0}
                className="text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                Xóa lọc
                <X className="ml-1 h-3 w-3" />
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select value={filters.statuses?.[0] || 'ALL'} onValueChange={handleStatusChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tất cả</SelectItem>
                  <SelectItem value="CONFIRMED">Đã xác nhận</SelectItem>
                  <SelectItem value="PENDING">Đang chờ</SelectItem>
                  <SelectItem value="CANCELLED">Đã hủy</SelectItem>
                  <SelectItem value="REFUNDED">Đã hoàn tiền</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Ngày đặt</Label>
              <div className="grid gap-2">
                <Button
                  id="date"
                  variant={'outline'}
                  onClick={() => setShowCalendar(!showCalendar)}
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !date && 'text-muted-foreground',
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, 'dd/MM/yyyy')} - {format(date.to, 'dd/MM/yyyy')}
                      </>
                    ) : (
                      format(date.from, 'dd/MM/yyyy')
                    )
                  ) : (
                    <span>Chọn ngày</span>
                  )}
                </Button>

                {showCalendar && (
                  <div className="rounded-md border p-2">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={date?.from}
                      selected={date}
                      onSelect={handleDateSelect}
                      numberOfMonths={isMobile ? 1 : 2}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
