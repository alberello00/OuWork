'use client';

import { GraduationCap, LogOut } from 'lucide-react';
import { signOut } from '@/app/(auth)/login/actions';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger } from '@/components/ui/Dropdown';
import { copy } from '@/lib/copy';
import { useTutorial } from '@/components/tutorial/TutorialProvider';
import { useSession } from './SessionProvider';

export function UserMenu({ showName }: { showName?: boolean }) {
  const { profile } = useSession();
  const tutorial = useTutorial();
  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={copy.nav.account}
        className={showName ? 'inline-flex h-9 min-w-0 flex-1 items-center gap-2 rounded-pill px-1.5 text-left text-[13px] font-medium hover:bg-surface-2' : 'inline-flex h-9 w-9 items-center justify-center rounded-pill hover:bg-surface-2'}
      >
        <Avatar name={profile.display_name} color={profile.color} size={24} />
        {showName ? <span className="truncate">{profile.display_name}</span> : null}
      </DropdownTrigger>
      <DropdownContent align="end">
        <DropdownLabel>
          {profile.display_name} · @{profile.username}
        </DropdownLabel>
        <DropdownItem onSelect={() => tutorial.start()}>
          <GraduationCap size={15} aria-hidden className="text-text-muted" />
          {copy.tutorial.replay}
        </DropdownItem>
        <DropdownItem onSelect={() => void signOut()}>
          <LogOut size={15} aria-hidden className="text-text-muted" />
          {copy.nav.signOut}
        </DropdownItem>
      </DropdownContent>
    </Dropdown>
  );
}
