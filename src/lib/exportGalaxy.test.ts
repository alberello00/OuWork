import { describe, expect, it } from 'vitest';
import { toMarkdown, type ExportData } from './exportGalaxy';

const data: ExportData = {
  galaxy: { id: 'g', name: 'Lola & Alberto' },
  exported_at: '2026-11-10T10:00:00Z',
  members: [{ id: 'a', username: 'alberto', display_name: 'Alberto' }],
  spheres: [
    { id: 'r', parent_id: null, name: 'Random', emoji: '🎲', color: 'sage', is_private: false, is_inbox: true },
    { id: 'p', parent_id: null, name: 'Places', emoji: '📍', color: 'amber', is_private: false, is_inbox: false },
    { id: 'i', parent_id: 'p', name: 'Italy', emoji: '🇮🇹', color: 'sage', is_private: false, is_inbox: false },
  ],
  items: [
    { id: '1', sphere_id: 'i', type: 'note', title: 'Procida', body_md: 'Lemon salad', url: null, image_path: null, caption: null, is_private: false, created_by: 'a', created_at: '2026-11-01T00:00:00Z', updated_at: '2026-11-01T00:00:00Z' },
    { id: '2', sphere_id: 'p', type: 'link', title: null, body_md: null, url: 'https://lisbon.net', image_path: null, caption: null, is_private: true, created_by: 'a', created_at: '2026-11-02T00:00:00Z', updated_at: '2026-11-02T00:00:00Z' },
  ],
  links: [{ source_id: '1', target_id: '2' }],
};

describe('toMarkdown', () => {
  const md = toMarkdown(data);
  it('nests sub-spheres under their parent and puts the inbox last', () => {
    expect(md.indexOf('## 📍 Places')).toBeLessThan(md.indexOf('### 🇮🇹 Italy'));
    expect(md.indexOf('### 🇮🇹 Italy')).toBeLessThan(md.indexOf('## 🎲 Random'));
  });
  it('writes items with author, link and connections', () => {
    expect(md).toContain('#### Procida');
    expect(md).toContain('_Alberto · 2026-11-01_');
    expect(md).toContain('<https://lisbon.net>');
    expect(md).toContain('Connected to: https://lisbon.net');
  });
  it('marks private content', () => expect(md).toContain('### https://lisbon.net 🔒'));
});
