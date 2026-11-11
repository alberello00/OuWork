'use client';

import { ArrowLeft, Check, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Planet } from '@/components/universe/Planet';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Input, Label } from '@/components/ui/Input';
import { copy } from '@/lib/copy';
import {
  buildSpheres,
  GALAXY_KINDS,
  guessKind,
  INTERESTS,
  interestLabel,
  interestsFor,
  isValidSetupSphere,
  MAX_SETUP_SPHERES,
  mergePreview,
  type CustomInterest,
  type GalaxyKind,
  type InterestId,
  type SetupSphere,
} from '@/lib/galaxySetup';
import { useCompleteGalaxySetup } from '@/lib/queries/galaxies';
import type { GalaxyWithMembers } from '@/lib/queries/types';
import { SPHERE_COLORS, SPHERE_EMOJIS, sphereVar } from '@/lib/tokens';
import { ringAroundCenter } from '@/lib/universeLayout';
import { cn } from '@/lib/utils';

interface Props {
  galaxy: GalaxyWithMembers;
  /** top-level spheres already there besides Random (someone may have added some by hand) */
  existingCount: number;
  open: boolean;
  /** closing without finishing = "Maybe later": the galaxy stays not set up */
  onOpenChange: (open: boolean) => void;
  /** setup completed; ids of the new spheres, in order (empty for "Start from scratch") */
  onDone: (sphereIds: string[]) => void;
}

const STEPS = 3;

/** RF14: three quick steps that turn a few answers into the first spheres of a galaxy. */
export function GalaxySetupDialog({ galaxy, existingCount, open, onOpenChange, onDone }: Props) {
  const complete = useCompleteGalaxySetup(galaxy.id);
  const [step, setStep] = useState(0);
  const [kind, setKind] = useState<GalaxyKind>(() => guessKind(galaxy.is_personal, galaxy.members.length));
  const [selected, setSelected] = useState<InterestId[]>([]);
  const [customs, setCustoms] = useState<CustomInterest[]>([]);
  const [customName, setCustomName] = useState('');
  const [customEmoji, setCustomEmoji] = useState<string>('✨');
  const [preview, setPreview] = useState<SetupSphere[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const solo = kind === 'solo';
  const offered = interestsFor(kind);
  const picked = selected.filter((id) => offered.includes(id));
  const total = picked.length + customs.length;
  const full = total >= MAX_SETUP_SPHERES;
  const editing = preview.find((s) => s.key === editingKey);

  function toggle(id: InterestId) {
    setSelected((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : full ? cur : [...cur, id]));
  }

  function addCustom() {
    const name = customName.trim();
    if (!name || full) return;
    setCustoms((cur) => (cur.some((c) => c.name.toLowerCase() === name.toLowerCase()) ? cur : [...cur, { name, emoji: customEmoji }]));
    setCustomName('');
  }

  function toPreview() {
    const next = mergePreview(preview, buildSpheres(kind, picked, customs));
    setPreview(next);
    setEditingKey(null);
    setStep(2);
  }

  function patch(key: string, change: Partial<SetupSphere>) {
    setPreview((cur) => cur.map((s) => (s.key === key ? { ...s, ...change } : s)));
  }

  function remove(key: string) {
    setPreview((cur) => cur.filter((s) => s.key !== key));
    if (key.startsWith('custom:')) {
      // keys are positional: rebuild the remaining custom keys in the preview too
      const index = Number(key.slice('custom:'.length));
      setCustoms((cur) => cur.filter((_, i) => i !== index));
      setPreview((cur) =>
        cur.map((s) => {
          if (!s.key.startsWith('custom:')) return s;
          const i = Number(s.key.slice('custom:'.length));
          return i > index ? { ...s, key: `custom:${i - 1}` } : s;
        })
      );
    } else {
      setSelected((cur) => cur.filter((id) => id !== key));
    }
    setEditingKey(null);
  }

  function submit(spheres: SetupSphere[], scratch = false) {
    const places = ringAroundCenter(spheres.map((s) => s.key), existingCount);
    complete.mutate(
      {
        answers: scratch
          ? { version: 1, kind, scratch: true }
          : { version: 1, kind, interests: picked, custom: customs.map((c) => c.name) },
        spheres: spheres.map((s, i) => ({ name: s.name.trim(), emoji: s.emoji.trim(), color: s.color, x: places[i]!.x, y: places[i]!.y })),
      },
      {
        onSuccess: (created) => {
          toast(scratch ? copy.setup.scratchDone : copy.setup.created(created.length));
          onDone(created.map((s) => s.id));
        },
        onError: (error) => {
          if (error.message.includes('setup_already_completed')) {
            toast(copy.setup.alreadyDone);
            onDone([]);
          } else {
            toast.error(copy.common.genericError);
          }
        },
      }
    );
  }

  const title =
    step === 0 ? copy.setup.kindTitle : step === 1 ? copy.setup.interestsTitle[kind] : copy.setup.previewTitle[solo ? 'solo' : 'shared'];
  const body = step === 0 ? copy.setup.kindBody : step === 1 ? copy.setup.interestsBody : copy.setup.previewBody;
  const canCreate = preview.length > 0 && preview.every(isValidSetupSphere) && !complete.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        title={title}
        description={body}
        className="flex flex-col max-sm:inset-0 max-sm:max-h-none max-sm:rounded-none max-sm:border-0 sm:w-[min(94vw,600px)]"
      >
        <p className="order-first mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-text-muted" aria-live="polite">
          <span aria-hidden className="flex gap-1">
            {Array.from({ length: STEPS }, (_, i) => (
              <span key={i} className={cn('h-1.5 w-5 rounded-pill', i <= step ? 'bg-accent' : 'bg-border')} />
            ))}
          </span>
          {copy.setup.step(step + 1, STEPS)}
        </p>

        {step === 0 ? (
          <div role="radiogroup" aria-label={copy.setup.kindTitle} className="mt-5 grid grid-cols-2 gap-2.5">
            {GALAXY_KINDS.map((k) => {
              const c = copy.setup.kinds[k];
              const on = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setKind(k)}
                  className={cn(
                    'relative flex min-h-28 flex-col items-start justify-end gap-0.5 rounded-card border p-3.5 text-left transition-colors duration-200',
                    on ? 'border-text bg-surface-2' : 'border-border hover:bg-surface-2'
                  )}
                >
                  <span aria-hidden className="mb-auto text-[30px] leading-none">{c.emoji}</span>
                  <span className="font-heading text-[19px] leading-tight">{c.label}</span>
                  <span className="text-[12px] text-text-muted">{c.hint}</span>
                  {on ? <Check size={16} aria-hidden className="absolute right-3 top-3" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="mt-5">
            <div className="flex flex-wrap gap-2">
              {offered.map((id) => {
                const on = picked.includes(id);
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    disabled={!on && full}
                    onClick={() => toggle(id)}
                    className={cn(
                      'inline-flex min-h-11 items-center gap-2 rounded-pill border px-3.5 text-[13px] font-medium transition-colors duration-200 disabled:opacity-45',
                      on ? 'border-text bg-text text-bg' : 'border-border bg-card hover:bg-surface-2'
                    )}
                  >
                    <span aria-hidden className="text-[16px]">{INTERESTS[id].emoji}</span>
                    {interestLabel(id)}
                  </button>
                );
              })}
              {customs.map((c, i) => (
                <button
                  key={`${c.name}-${i}`}
                  type="button"
                  aria-pressed
                  onClick={() => setCustoms((cur) => cur.filter((_, j) => j !== i))}
                  className="inline-flex min-h-11 items-center gap-2 rounded-pill border border-text bg-text px-3.5 text-[13px] font-medium text-bg"
                >
                  <span aria-hidden className="text-[16px]">{c.emoji}</span>
                  {c.name}
                </button>
              ))}
            </div>

            <form
              className="mt-5"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                addCustom();
              }}
            >
              <Label htmlFor="setup-else">{copy.setup.else}</Label>
              <div className="flex gap-2">
                <select
                  aria-label={copy.setup.elseEmoji}
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  className="h-11 w-[68px] shrink-0 rounded-card border border-border bg-card px-2 text-[18px]"
                >
                  {SPHERE_EMOJIS.map((e) => (
                    <option key={e} value={e}>{e}</option>
                  ))}
                </select>
                <Input id="setup-else" value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder={copy.setup.elsePlaceholder} maxLength={40} disabled={full} />
                <Button type="submit" disabled={!customName.trim() || full}>
                  <Plus size={15} aria-hidden />
                  {copy.setup.elseAdd}
                </Button>
              </div>
            </form>
            <p className="mt-3 text-[12px] text-text-muted" aria-live="polite">
              {full ? copy.setup.limit(MAX_SETUP_SPHERES) : copy.setup.picked(total, MAX_SETUP_SPHERES)}
            </p>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-5">
            {preview.length ? (
              <ul className="grid grid-cols-3 gap-x-2 gap-y-3 min-[440px]:grid-cols-4 sm:grid-cols-5">
                {preview.map((s) => (
                  <li key={s.key}>
                    <button
                      type="button"
                      aria-pressed={editingKey === s.key}
                      aria-label={copy.setup.editing(s.name)}
                      onClick={() => setEditingKey(editingKey === s.key ? null : s.key)}
                      className={cn('flex w-full flex-col items-center gap-1.5 rounded-card px-1 py-2.5 transition-colors duration-200', editingKey === s.key ? 'bg-surface-2 ring-2 ring-text' : 'hover:bg-surface-2')}
                    >
                      <Planet color={s.color} emoji={s.emoji} size={58} glow={false} />
                      <span className="line-clamp-2 text-center text-[12px] font-medium leading-tight">{s.name || '…'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-card border border-dashed border-border px-4 py-8 text-center text-[13px] text-text-muted">{copy.setup.previewEmpty}</p>
            )}

            {editing ? (
              <div className="mt-4 space-y-3.5 rounded-card border border-border bg-surface-2 p-3.5 animate-fade-in">
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Label htmlFor="setup-name">{copy.spheres.name}</Label>
                    <Input id="setup-name" value={editing.name} onChange={(e) => patch(editing.key, { name: e.target.value })} maxLength={40} />
                  </div>
                  <Button onClick={() => remove(editing.key)} className="text-danger">
                    <Trash2 size={15} aria-hidden />
                    {copy.setup.remove}
                  </Button>
                </div>
                <fieldset>
                  <legend className="mb-1 text-[12px] font-medium text-text-muted">{copy.spheres.color}</legend>
                  <div className="flex flex-wrap gap-0.5">
                    {SPHERE_COLORS.map((c) => (
                      <button key={c} type="button" aria-label={c} aria-pressed={editing.color === c} onClick={() => patch(editing.key, { color: c })} className="flex h-11 w-11 items-center justify-center rounded-full">
                        <span className={cn('h-7 w-7 rounded-full', editing.color === c && 'ring-2 ring-text ring-offset-2 ring-offset-surface-2')} style={{ background: sphereVar(c) }} />
                      </button>
                    ))}
                  </div>
                </fieldset>
                <fieldset>
                  <legend className="mb-1 text-[12px] font-medium text-text-muted">{copy.spheres.emoji}</legend>
                  <div className="flex flex-wrap gap-0.5">
                    {[...new Set([editing.emoji, ...SPHERE_EMOJIS])].map((e) => (
                      <button key={e} type="button" aria-pressed={editing.emoji === e} onClick={() => patch(editing.key, { emoji: e })} className={cn('flex h-11 w-11 items-center justify-center rounded-card text-[19px]', editing.emoji === e ? 'bg-card ring-2 ring-text' : 'hover:bg-card')}>
                        {e}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-auto flex flex-wrap items-center gap-2 pt-6">
          {step === 0 ? (
            <>
              <Button variant="ghost" onClick={() => onOpenChange(false)}>{copy.setup.later}</Button>
              <Button variant="ghost" title={copy.setup.scratchHint} disabled={complete.isPending} onClick={() => submit([], true)} className="text-text-muted">
                {copy.setup.scratch}
              </Button>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setStep(step - 1)}>
              <ArrowLeft size={15} aria-hidden />
              {copy.common.back}
            </Button>
          )}
          <span className="flex-1" />
          {step === 0 ? <Button variant="primary" onClick={() => setStep(1)}>{copy.setup.next}</Button> : null}
          {step === 1 ? <Button variant="primary" disabled={total === 0} onClick={toPreview}>{copy.setup.next}</Button> : null}
          {step === 2 ? (
            <Button variant="primary" disabled={!canCreate} onClick={() => submit(preview)}>
              {complete.isPending ? copy.setup.creating : copy.setup.create[solo ? 'solo' : 'shared']}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
