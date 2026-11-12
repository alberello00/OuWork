'use client';

import { Copy, Download, Link2, LogOut, Sparkles, Trash2, UserMinus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useSession } from '@/components/shell/SessionProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Input, Label } from '@/components/ui/Input';
import { copy } from '@/lib/copy';
import { useDeleteGalaxy, useRemoveMember, useRenameGalaxy } from '@/lib/queries/galaxies';
import { useCreateInvite, useInvites, useRevokeInvite } from '@/lib/queries/invites';
import type { GalaxyWithMembers } from '@/lib/queries/types';
import { timeAgo } from '@/lib/utils';

interface Props {
  galaxy: GalaxyWithMembers;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** opens the setup survey; shown to the owner while the galaxy is not set up (RF14.2) */
  onSetup?: () => void;
  /** extra section rendered at the end (export, phase 6) */
  children?: React.ReactNode;
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-6">
      <h3 className="font-body text-[11px] font-bold uppercase tracking-wider text-text-muted">{title}</h3>
      {hint ? <p className="mt-1 text-[12px] text-text-muted">{hint}</p> : null}
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

/** Rename, members, invite links, leave/delete (RF1.2, RF1.3). */
export function GalaxySettingsDialog({ galaxy, open, onOpenChange, onSetup, children }: Props) {
  const router = useRouter();
  const { userId } = useSession();
  const isOwner = galaxy.owner_id === userId;
  const canManage = isOwner && !galaxy.is_personal;

  const rename = useRenameGalaxy();
  const removeMember = useRemoveMember();
  const deleteGalaxy = useDeleteGalaxy();
  const invites = useInvites(galaxy.id, open && canManage);
  const createInvite = useCreateInvite(galaxy.id);
  const revokeInvite = useRevokeInvite(galaxy.id);

  const [name, setName] = useState(galaxy.name);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [typedName, setTypedName] = useState('');

  useEffect(() => {
    if (open) {
      setName(galaxy.name);
      setConfirmDelete(false);
      setTypedName('');
    }
  }, [open, galaxy.name]);

  const onError = () => toast.error(copy.common.genericError);

  function inviteUrl(token: string) {
    return `${window.location.origin}/invite/${token}`;
  }

  async function copyLink(token: string) {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      toast(copy.settings.copied);
    } catch {
      window.prompt(copy.settings.copyLink, inviteUrl(token));
    }
  }

  function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || name.trim() === galaxy.name) return;
    rename.mutate({ id: galaxy.id, name }, { onSuccess: () => toast(copy.galaxies.renamed), onError });
  }

  function remove(userIdToRemove: string, displayName: string) {
    if (!window.confirm(copy.settings.removeConfirm(displayName))) return;
    removeMember.mutate(
      { galaxyId: galaxy.id, userId: userIdToRemove },
      { onSuccess: () => toast(copy.settings.removed), onError }
    );
  }

  function leave() {
    if (!window.confirm(copy.settings.leaveConfirm)) return;
    removeMember.mutate(
      { galaxyId: galaxy.id, userId },
      {
        onSuccess: () => {
          toast(copy.galaxies.left);
          onOpenChange(false);
          router.push('/');
        },
        onError,
      }
    );
  }

  function destroy() {
    deleteGalaxy.mutate(galaxy.id, {
      onSuccess: () => {
        toast(copy.galaxies.deleted);
        onOpenChange(false);
        router.push('/');
      },
      onError,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={copy.settings.title} description={galaxy.is_personal ? copy.settings.personalNote : undefined}>
        {canManage ? (
          <Section title={copy.settings.rename}>
            <form onSubmit={saveName} className="flex gap-2">
              <Label htmlFor="rename-galaxy" className="sr-only">
                {copy.settings.rename}
              </Label>
              <Input id="rename-galaxy" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} required />
              <Button type="submit" disabled={rename.isPending || !name.trim() || name.trim() === galaxy.name}>
                {copy.common.save}
              </Button>
            </form>
          </Section>
        ) : null}

        {isOwner && !galaxy.setup_completed_at && onSetup ? (
          <Section title={copy.settings.setup} hint={copy.settings.setupHint}>
            <Button onClick={() => { onOpenChange(false); onSetup(); }}>
              <Sparkles size={15} aria-hidden />
              {copy.setup.emptyCta}
            </Button>
          </Section>
        ) : null}

        <Section title={copy.settings.members} hint={!isOwner ? copy.settings.onlyOwner : undefined}>
          <ul className="divide-y divide-border rounded-card border border-border">
            {galaxy.members.map((m) => (
              <li key={m.user_id} className="flex min-h-12 items-center gap-2.5 px-3">
                <Avatar name={m.profile.display_name} color={m.profile.color} size={26} />
                <span className="min-w-0 flex-1 truncate text-[13px]">
                  {m.profile.display_name}
                  {m.user_id === userId ? <span className="text-text-muted"> ({copy.common.you})</span> : null}
                </span>
                {m.role === 'owner' ? (
                  <span className="text-[11px] text-text-muted">{copy.settings.owner}</span>
                ) : canManage ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(m.user_id, m.profile.display_name)}
                    disabled={removeMember.isPending}
                  >
                    <UserMinus size={14} aria-hidden />
                    {copy.settings.remove}
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        </Section>

        {canManage ? (
          <Section title={copy.settings.invites} hint={copy.settings.invitesHint}>
            <Button
              onClick={() =>
                createInvite.mutate(undefined, { onSuccess: (invite) => invite && void copyLink(invite.token), onError })
              }
              disabled={createInvite.isPending}
            >
              <Link2 size={15} aria-hidden />
              {copy.settings.newInvite}
            </Button>
            {invites.data?.length ? (
              <ul className="mt-3 divide-y divide-border rounded-card border border-border">
                {invites.data.map((inv) => {
                  const used = !!inv.used_at;
                  const expired = !used && new Date(inv.expires_at) <= new Date();
                  return (
                    <li key={inv.id} className="flex min-h-12 items-center gap-2 px-3">
                      <code className="min-w-0 flex-1 truncate text-[12px] text-text-muted">…{inv.token.slice(-10)}</code>
                      <span className="shrink-0 text-[11px] text-text-muted">
                        {used ? copy.settings.used : expired ? copy.settings.expired : copy.settings.expires(timeAgo(inv.expires_at))}
                      </span>
                      {!used && !expired ? (
                        <Button size="sm" variant="ghost" onClick={() => void copyLink(inv.token)} aria-label={copy.settings.copyLink}>
                          <Copy size={14} aria-hidden />
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        variant="ghost"
                        aria-label={copy.settings.revoke}
                        onClick={() => revokeInvite.mutate(inv.id, { onSuccess: () => toast(copy.settings.revoked), onError })}
                      >
                        <Trash2 size={14} aria-hidden />
                      </Button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-[12px] text-text-muted">{copy.settings.noInvites}</p>
            )}
          </Section>
        ) : null}

        <Section title={copy.settings.export} hint={copy.settings.exportHint}>
          <div className="flex gap-2">
            {(['json', 'md'] as const).map((f) => (
              <a
                key={f}
                href={`/api/export?galaxy=${galaxy.id}&format=${f}`}
                download
                className="inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-card px-4 text-[13px] font-medium hover:bg-surface-2"
              >
                <Download size={15} aria-hidden />
                {f === 'json' ? copy.settings.exportJson : copy.settings.exportMarkdown}
              </a>
            ))}
          </div>
        </Section>

        {children}

        {!galaxy.is_personal && !isOwner ? (
          <Section title={copy.settings.dangerZone}>
            <Button onClick={leave} disabled={removeMember.isPending}>
              <LogOut size={15} aria-hidden />
              {copy.settings.leave}
            </Button>
          </Section>
        ) : null}

        {canManage ? (
          <Section title={copy.settings.dangerZone}>
            {confirmDelete ? (
              <div className="rounded-card border border-danger bg-danger-soft p-3.5">
                <p className="text-[14px] font-medium">{copy.settings.deleteConfirmTitle}</p>
                <p className="mt-1 text-[13px] leading-relaxed">{copy.settings.deleteConfirmBody(galaxy.name)}</p>
                <Label htmlFor="confirm-galaxy-name" className="mt-3 text-text">
                  {copy.settings.deleteTypeName}
                </Label>
                <Input id="confirm-galaxy-name" value={typedName} onChange={(e) => setTypedName(e.target.value)} autoComplete="off" />
                <div className="mt-3 flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
                    {copy.common.cancel}
                  </Button>
                  <Button
                    variant="danger"
                    onClick={destroy}
                    disabled={deleteGalaxy.isPending || typedName.trim() !== galaxy.name}
                  >
                    {copy.settings.deleteGalaxy}
                  </Button>
                </div>
              </div>
            ) : (
              <Button onClick={() => setConfirmDelete(true)} className="text-danger">
                <Trash2 size={15} aria-hidden />
                {copy.settings.deleteGalaxy}
              </Button>
            )}
          </Section>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
