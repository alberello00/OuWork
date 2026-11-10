'use client';

import { cn } from '@/lib/utils';

interface Props {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  hint?: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export function Switch({ checked, onChange, label, hint, disabled, icon }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="flex min-h-11 w-full items-center gap-3 rounded-card text-left disabled:opacity-60"
    >
      <span
        aria-hidden
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-pill transition-colors duration-200',
          checked ? 'bg-text' : 'bg-border'
        )}
      >
        <span
          className={cn(
            'absolute top-0.5 h-5 w-5 rounded-full bg-card shadow transition-transform duration-200',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
      </span>
      <span className="min-w-0">
        <span className="flex items-center gap-1.5 text-[13px] font-medium">
          {icon}
          {label}
        </span>
        {hint ? <span className="block text-[12px] text-text-muted">{hint}</span> : null}
      </span>
    </button>
  );
}
