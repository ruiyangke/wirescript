import type { ElementNode } from '@wirescript/dsl';
import { hasFlag, toText } from '../layout.js';
import { cn } from '../lib/utils.js';
import { Input as ShadcnInput } from '../ui/input.js';

interface InputProps {
  element: ElementNode;
}

export function Input({ element }: InputProps) {
  const { props, content } = element;
  const textContent = toText(content);

  const inputType = String(props.type || 'text');
  const placeholder = String(props.placeholder || '');
  const isError = hasFlag(props, 'error');
  const isDisabled = hasFlag(props, 'disabled');
  const isChecked = hasFlag(props, 'checked') || hasFlag(props, 'on');
  const isFull = props.full === true;

  // Handle different input types
  if (inputType === 'checkbox' || inputType === 'toggle') {
    return (
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={isChecked}
          disabled={isDisabled}
          readOnly
          className="h-4 w-4 rounded border-input"
        />
        <span className="text-sm text-foreground">{textContent}</span>
      </label>
    );
  }

  if (inputType === 'radio') {
    const options = String(props.options || '')
      .split(',')
      .map((s) => s.trim());
    const value = String(props.value || '');
    return (
      <div className={cn('flex flex-col gap-1', isFull && 'w-full')}>
        {textContent && <span className="text-sm font-medium text-foreground">{textContent}</span>}
        <div className="flex flex-col gap-1">
          {options.map((option) => (
            <label key={`radio-${option}`} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                checked={option === value}
                disabled={isDisabled}
                readOnly
                className="h-4 w-4"
              />
              <span className="text-sm text-muted-foreground">{option}</span>
            </label>
          ))}
        </div>
      </div>
    );
  }

  if (inputType === 'select') {
    const options = String(props.options || '')
      .split(',')
      .map((s) => s.trim());
    return (
      <div className={cn('flex flex-col gap-1', isFull && 'w-full')}>
        {textContent && <span className="text-sm font-medium text-foreground">{textContent}</span>}
        <select
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm disabled:opacity-50"
          disabled={isDisabled}
        >
          {options.map((option) => (
            <option key={`option-${option}`} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  if (inputType === 'textarea') {
    const rows = typeof props.rows === 'number' ? props.rows : 3;
    return (
      <div className={cn('flex flex-col gap-1', isFull && 'w-full')}>
        {textContent && <span className="text-sm font-medium text-foreground">{textContent}</span>}
        <textarea
          className="flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground disabled:opacity-50 resize-y"
          placeholder={placeholder}
          rows={rows}
          disabled={isDisabled}
          readOnly
        />
      </div>
    );
  }

  // Default text-like inputs
  return (
    <div className={cn('flex flex-col gap-1', isFull && 'w-full')}>
      {textContent && <span className="text-sm font-medium text-foreground">{textContent}</span>}
      <ShadcnInput
        type={inputType}
        placeholder={placeholder}
        disabled={isDisabled}
        readOnly
        className={cn(isError && 'border-destructive')}
      />
    </div>
  );
}
