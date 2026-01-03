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
  icon?: React.ReactNode;
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
  icon,
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
    }, 300);

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
          variant="outline" // Base variant
          role="combobox"
          aria-expanded={open}
          className={cn(
            // --- JoyRide Input Mimicry ---
            'w-full justify-between h-auto py-3 px-4 text-base font-normal',
            'bg-white dark:bg-emerald-900/50',
            'border-2 border-emerald-100 dark:border-emerald-800',
            'rounded-2xl',
            'text-emerald-900 dark:text-emerald-50',
            'hover:bg-white hover:border-emerald-400 hover:translate-y-0 hover:shadow-sm', // Override standard button hover
            'focus:ring-4 focus:ring-emerald-100 focus:border-emerald-400',
            !value && 'text-emerald-300 dark:text-emerald-600',
            className,
          )}
        >
          {icon && <span className="shrink-0 text-emerald-500">{icon}</span>}
          <span className="flex-1 text-left truncate">
            {value
              ? (options.find((option) => option.value === value)?.label ?? value)
              : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 size-4 shrink-0 text-emerald-400 opacity-50" />
        </Button>
      </PopoverTrigger>

      {/* Popover Content (Dropdown) */}
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0 z-[200] rounded-2xl border-emerald-100 dark:border-emerald-800 shadow-xl shadow-emerald-900/5 dark:shadow-black/20">
        <Command shouldFilter={!onSearchChange}>
          <CommandInput
            placeholder={placeholder}
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 p-4 text-sm text-emerald-500">
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
                          'ml-auto text-emerald-600 dark:text-emerald-400',
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
