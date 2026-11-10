import { Avatar } from './Avatar';
import type { Member } from '@/lib/queries/types';

export function AvatarStack({ members, size = 22, max = 4 }: { members: Member[]; size?: number; max?: number }) {
  const shown = members.slice(0, max);
  const extra = members.length - shown.length;
  return (
    <span className="inline-flex items-center">
      {shown.map((m, i) => (
        <Avatar
          key={m.user_id}
          name={m.profile.display_name}
          color={m.profile.color}
          size={size}
          ring
          className={i > 0 ? '-ml-1.5' : undefined}
        />
      ))}
      {extra > 0 ? <span className="ml-1.5 text-[11px] text-text-muted">+{extra}</span> : null}
    </span>
  );
}
