'use client';

import { GraduationCap, LogOut } from 'lucide-react';
import { signOut } from '@/app/(auth)/login/actions';
import { Avatar } from '@/components/ui/Avatar';
import { Dropdown, DropdownContent, DropdownItem, DropdownLabel, DropdownTrigger } from '@/components/ui/Dropdown';
import { copy } from '@/lib/copy';
import { useTutorial } from '@/components/tutorial/TutorialProvider';
import { useSession } from './SessionProvider';

export function UserMenu() {
  const { profile } = useSession();
  const tutorial = useTutorial();
  return (
    <Dropdown>
      <DropdownTrigger
        aria-label={copy.nav.account}
        className="inline-flex h-11 w-11 items-center justify-center rounded-pill hover:bg-surface-2"
      >
        <Avatar name={profile.display_name} color={profile.color} size={28} />
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
