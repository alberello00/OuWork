'use client';

import * as Menu from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';

export const Dropdown = Menu.Root;
export const DropdownTrigger = Menu.Trigger;

export function DropdownContent({ className, ...props }: Menu.DropdownMenuContentProps) {
  return (
    <Menu.Portal>
      <Menu.Content
        sideOffset={8}
        collisionPadding={12}
        className={cn(
          'z-50 max-h-[70dvh] min-w-56 overflow-y-auto rounded-card border border-border bg-card p-1.5 text-text shadow-panel animate-fade-in',
          className
        )}
        {...props}
      />
    </Menu.Portal>
  );
}

export function DropdownItem({ className, ...props }: Menu.DropdownMenuItemProps) {
  return (
    <Menu.Item
      className={cn(
        'flex min-h-11 cursor-pointer select-none items-center gap-2.5 rounded-[9px] px-2.5 text-[13px] outline-none',
        'data-[highlighted]:bg-surface-2 data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        className
      )}
      {...props}
    />
  );
}

export function DropdownLabel({ className, ...props }: Menu.DropdownMenuLabelProps) {
  return (
    <Menu.Label
      className={cn('px-2.5 pb-1 pt-2 text-[10px] font-bold uppercase tracking-wider text-text-muted', className)}
      {...props}
    />
  );
}

export function DropdownSeparator() {
  return <Menu.Separator className="my-1.5 h-px bg-border" />;
}
