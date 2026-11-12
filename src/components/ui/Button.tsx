import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'night';
type Size = 'sm' | 'md' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent-strong text-on-accent hover:brightness-110',
  secondary: 'bg-card text-text border border-border hover:bg-surface-2',
  ghost: 'text-text hover:bg-surface-2',
  danger: 'bg-danger text-card hover:brightness-110',
  night: 'bg-night-surface text-night-text border border-night-border hover:bg-night-border',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-2.5 text-[12.5px] max-sm:h-11',
  md: 'h-9 px-3.5 text-[13px] max-sm:h-11',
  icon: 'h-9 w-9 max-sm:h-11 max-sm:w-11',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'secondary', size = 'md', type = 'button', ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-pill font-medium',
        'transition-[background-color,filter] duration-150',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
});
