'use client';

import { ArrowLeft, Check, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Planet } from '@/components/universe/Planet';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { Input, Label } from '@/components/ui/Input';
import { copy } from '@/lib/copy';
import { buildSpheres, guessTemplate, isValidSetupSphere, TEMPLATE_IDS, TEMPLATES, type SetupSphere, type TemplateId } from '@/lib/galaxySetup';
import { useCompleteGalaxySetup } from '@/lib/queries/galaxies';
import type { GalaxyWithMembers } from '@/lib/queries/types';
import { SPHERE_COLORS, SPHERE_EMOJIS, sphereVar } from '@/lib/tokens';
import { ringAroundCenter } from '@/lib/universeLayout';
import { cn } from '@/lib/utils';

interface Props {
  galaxy: GalaxyWithMembers;
  /** top-level boards already there besides the Inbox (someone may have added some by hand) */
  existingCount: number;
  open: boolean;
  /** closing without finishing = "Maybe later": the workspace stays not set up */
  onOpenChange: (open: boolean) => void;
  /** setup completed; ids of the new boards, in order (empty for the blank template) */
  onDone: (sphereIds: string[]) => void;
}

const STEPS = 2;

/** RW2.9: pick a template, review its boards, create them in one transaction. */
export function GalaxySetupDialog({ galaxy, existingCount, open, onOpenChange, onDone }: Props) {
  const complete = useCompleteGalaxySetup(galaxy.id);
  const [step, setStep] = useState(0);
  const [template, setTemplate] = useState<TemplateId>(() => guessTemplate(galaxy.is_personal));
  const [preview, setPreview] = useState<SetupSphere[]>([]);
  const [editingKey, setEditingKey] = useState<string | null>(null);

  const blank = template === 'blank';
  const editing = preview.find((s) => s.key === editingKey);

  function toPreview() {
    // edits survive going back and forth as long as the template stays the same
    setPreview((cur) => (cur.length && cur[0]!.key.startsWith(`${template}:`) ? cur : buildSpheres(template)));
    setEditingKey(null);
    setStep(1);
  }

  function patch(key: string, change: Partial<SetupSphere>) {
    setPreview((cur) => cur.map((s) => (s.key === key ? { ...s, ...change } : s)));
  }

  function remove(key: string) {
    setPreview((cur) => cur.filter((s) => s.key !== key));
    setEditingKey(null);
  }

  function submit(spheres: SetupSphere[]) {
    const scratch = spheres.length === 0;
    const places = ringAroundCenter(spheres.map((s) => s.key), existingCount);
    complete.mutate(
      {
        answers: { version: 2, template, boards: spheres.map((s) => s.name.trim()) },
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

  const title = step === 0 ? copy.setup.templateTitle : copy.setup.previewTitle;
  const body = step === 0 ? copy.setup.templateBody : copy.setup.previewBody;
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
          <div role="radiogroup" aria-label={copy.setup.templateTitle} className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {TEMPLATE_IDS.map((id) => {
              const c = copy.setup.templates[id];
              const on = template === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setTemplate(id)}
                  className={cn(
                    'relative flex min-h-28 flex-col items-start gap-1 rounded-card border p-3.5 text-left transition-colors duration-200',
                    on ? 'border-text bg-surface-2' : 'border-border hover:bg-surface-2'
                  )}
                >
                  <span className="pr-6 text-[15px] font-semibold leading-tight">{c.label}</span>
                  <span className="text-[12px] text-text-muted">{c.hint}</span>
                  {TEMPLATES[id].length ? (
                    <span className="mt-auto pt-2 text-[12px] leading-snug text-text-muted">
                      {TEMPLATES[id].map((b) => `${b.emoji} ${copy.setup.boards[b.key]}`).join(' · ')}
                    </span>
                  ) : null}
                  {on ? <Check size={16} aria-hidden className="absolute right-3 top-3" /> : null}
                </button>
              );
            })}
          </div>
        ) : null}

        {step === 1 ? (
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
            <Button variant="ghost" onClick={() => onOpenChange(false)}>{copy.setup.later}</Button>
          ) : (
            <Button variant="ghost" onClick={() => setStep(0)}>
              <ArrowLeft size={15} aria-hidden />
              {copy.common.back}
            </Button>
          )}
          <span className="flex-1" />
          {step === 0 && blank ? (
            <Button variant="primary" disabled={complete.isPending} onClick={() => submit([])}>
              {complete.isPending ? copy.setup.creating : copy.setup.createBlank}
            </Button>
          ) : null}
          {step === 0 && !blank ? <Button variant="primary" onClick={toPreview}>{copy.setup.next}</Button> : null}
          {step === 1 ? (
            <Button variant="primary" disabled={!canCreate} onClick={() => submit(preview)}>
              {complete.isPending ? copy.setup.creating : copy.setup.create}
            </Button>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
