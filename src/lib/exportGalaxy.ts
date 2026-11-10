// Pure helpers for the galaxy backup (RF11.3). The data passed in is already
// filtered by RLS: it only contains what the requesting user can see.

export interface ExportSphere {
  id: string;
  parent_id: string | null;
  name: string;
  emoji: string;
  color: string;
  is_private: boolean;
  is_inbox: boolean;
}

export interface ExportItem {
  id: string;
  sphere_id: string;
  type: string;
  title: string | null;
  body_md: string | null;
  url: string | null;
  image_path: string | null;
  caption: string | null;
  is_private: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExportData {
  galaxy: { id: string; name: string };
  exported_at: string;
  members: { id: string; username: string; display_name: string }[];
  spheres: ExportSphere[];
  items: ExportItem[];
  links: { source_id: string; target_id: string }[];
}

function itemHeading(i: ExportItem): string {
  return (i.title?.trim() || (i.type === 'link' ? i.url : i.caption?.trim()) || i.body_md?.trim().split('\n')[0]?.slice(0, 60) || 'Untitled')!;
}

export function toMarkdown(d: ExportData): string {
  const who = new Map(d.members.map((m) => [m.id, m.display_name]));
  const byId = new Map(d.items.map((i) => [i.id, i]));
  const out: string[] = [`# ${d.galaxy.name}`, '', `_Exported on ${d.exported_at.slice(0, 10)} · ${d.items.length} items_`, ''];

  const writeSphere = (s: ExportSphere, level: number) => {
    out.push(`${'#'.repeat(level)} ${s.emoji} ${s.name}${s.is_private ? ' 🔒 (only me)' : ''}`, '');
    for (const i of d.items.filter((x) => x.sphere_id === s.id)) {
      out.push(`${'#'.repeat(level + 1)} ${itemHeading(i)}${i.is_private ? ' 🔒' : ''}`, '');
      out.push(`_${who.get(i.created_by ?? '') ?? 'Someone'} · ${i.created_at.slice(0, 10)}_`, '');
      if (i.type === 'link' && i.url) out.push(`<${i.url}>`, '');
      if (i.type === 'image') out.push(`Picture: \`${i.image_path}\`${i.caption ? ` — ${i.caption}` : ''}`, '');
      if (i.body_md) out.push(i.body_md.trim(), '');
      const linked = d.links
        .filter((l) => l.source_id === i.id || l.target_id === i.id)
        .map((l) => byId.get(l.source_id === i.id ? l.target_id : l.source_id))
        .filter(Boolean) as ExportItem[];
      if (linked.length) out.push(`Connected to: ${linked.map(itemHeading).join(', ')}`, '');
    }
    for (const c of d.spheres.filter((x) => x.parent_id === s.id)) writeSphere(c, level + 1);
  };

  const top = d.spheres.filter((s) => !s.parent_id).sort((a, b) => Number(a.is_inbox) - Number(b.is_inbox));
  for (const s of top) writeSphere(s, 2);
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}
