import type { ElementNode } from '@wirescript/dsl';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { hasFlag, toText } from '../layout.js';
import { cn } from '../lib/utils.js';
import { Button } from '../ui/button.js';
import { Calendar } from '../ui/calendar.js';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover.js';

interface DatePickerProps {
  element: ElementNode;
}

export function DatePicker({ element }: DatePickerProps) {
  const { props, content } = element;
  const textContent = toText(content);

  const placeholder = String(props.placeholder || 'Pick a date');
  const isDisabled = hasFlag(props, 'disabled');
  const isError = hasFlag(props, 'error');
  const isFull = props.full === true;

  // Parse initial value if provided
  const initialValue = props.value ? new Date(String(props.value)) : undefined;
  const [date, setDate] = useState<Date | undefined>(
    initialValue && !Number.isNaN(initialValue.getTime()) ? initialValue : undefined
  );

  // Date format (default: PPP which is like "January 1, 2025")
  const dateFormat = String(props.format || 'PPP');

  return (
    <div className={cn('flex flex-col gap-1', isFull && 'w-full')}>
      {textContent && <span className="text-sm font-medium text-foreground">{textContent}</span>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={isDisabled}
            className={cn(
              'justify-start text-left font-normal',
              !date && 'text-muted-foreground',
              isFull && 'w-full',
              isError && 'border-destructive'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, dateFormat) : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={setDate} initialFocus />
        </PopoverContent>
      </Popover>
    </div>
  );
}
