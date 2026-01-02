import * as React from 'react';

import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ComboboxProps {
  options: { value: string; label: string }[];
  value?: string;
  onSelect: (value: string) => void;
  onSearchChange?: (query: string) => void;
  placeholder?: string;
  emptyText?: string;
  className?: string;
  isLoading?: boolean;
}

export function Combobox({
  options,
  value,
  onSelect,
  onSearchChange,
  placeholder = 'Select option...',
  emptyText = 'No option found.',
  className,
  isLoading = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');

  // Debounce search query
  React.useEffect(() => {
    if (!onSearchChange) return;

    const timer = setTimeout(() => {
      if (searchQuery) {
        onSearchChange(searchQuery);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, onSearchChange]);

  // Reset search when popover closes
  React.useEffect(() => {
    if (!open) {
      setSearchQuery('');
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn('w-full justify-between', !value && 'text-muted-foreground', className)}
        >
          {value ? (options.find((option) => option.value === value)?.label ?? value) : placeholder}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200]">
        <Command shouldFilter={!onSearchChange}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang tìm...
              </div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={(currentValue) => {
                        // cmdk returns lowercased value
                        const selectedOption = options.find(
                          (option) => option.label.toLowerCase() === currentValue.toLowerCase(),
                        );
                        const newValue = selectedOption ? selectedOption.value : currentValue;
                        onSelect(newValue === value ? '' : newValue);
                        setOpen(false);
                      }}
                    >
                      {option.label}
                      <Check
                        className={cn(
                          'ml-auto',
                          value === option.value ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
