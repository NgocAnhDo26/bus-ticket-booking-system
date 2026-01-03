import * as React from 'react';

import { Clock } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface TimePickerProps {
  date?: Date;
  setDate: (date: Date | undefined) => void;
  disabled?: boolean;
}

export function TimePicker({ date, setDate, disabled }: TimePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  // Default to 00:00 if date not provided but interacting?
  // Or just don't show selected.
  // When opening, if no date, maybe we don't screw up?
  // If user clicks an hour, we need a base date.
  // We'll rely on parent passing a date, or if undefined, we create one as needed?
  // But usually parent controls "value". If value is undefined, what do we display?

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  const selectedHour = date ? date.getHours() : undefined;
  const selectedMinute = date ? date.getMinutes() : undefined;

  const handleTimeChange = (type: 'hour' | 'minute', value: number) => {
    const newDate = date ? new Date(date) : new Date();
    // specific logic: if no date provided, use "today" but set time.
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);

    if (type === 'hour') {
      newDate.setHours(value);
      // default minutes to 0 if not set yet?
      if (selectedMinute === undefined) newDate.setMinutes(0);
    } else {
      newDate.setMinutes(value);
      // default hour to 0 if not set yet?
      if (selectedHour === undefined) newDate.setHours(0);
    }
    setDate(newDate);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
          )}
          disabled={disabled}
        >
          <Clock className="mr-2 h-4 w-4" />
          {date ? formatTime(date) : <span>Chọn giờ</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex h-[300px] divide-x">
          <ScrollArea className="h-full w-24 p-2">
            <div className="flex flex-col gap-1 p-1">
              <div className="text-sm font-medium text-muted-foreground px-2 py-1 mb-1 text-center">
                Giờ
              </div>
              {hours.map((hour) => (
                <Button
                  key={hour}
                  variant={selectedHour === hour ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTimeChange('hour', hour)}
                  className="w-full shrink-0"
                >
                  {hour.toString().padStart(2, '0')}
                </Button>
              ))}
            </div>
            <ScrollBar />
          </ScrollArea>
          <ScrollArea className="h-full w-24 p-2">
            <div className="flex flex-col gap-1 p-1">
              <div className="text-sm font-medium text-muted-foreground px-2 py-1 mb-1 text-center">
                Phút
              </div>
              {minutes.map((minute) => (
                <Button
                  key={minute}
                  variant={selectedMinute === minute ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleTimeChange('minute', minute)}
                  className="w-full shrink-0"
                >
                  {minute.toString().padStart(2, '0')}
                </Button>
              ))}
            </div>
            <ScrollBar />
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function formatTime(date: Date) {
  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}
