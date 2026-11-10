import { NextResponse, type NextRequest } from 'next/server';
import { copy } from '@/lib/copy';
import { toMarkdown, type ExportData } from '@/lib/exportGalaxy';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/export?galaxy=<id>&format=json|md (RF11.3).
 * Uses the caller's own session: RLS limits the backup to what they can see,
 * so other members' private content is never included.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const galaxyId = request.nextUrl.searchParams.get('galaxy') ?? '';
  const format = request.nextUrl.searchParams.get('format') === 'md' ? 'md' : 'json';

  const { data: galaxy } = await supabase.from('galaxies').select('id, name').eq('id', galaxyId).maybeSingle();
  if (!galaxy) return NextResponse.json({ error: 'not found' }, { status: 404 });

  const [members, spheres, items, links] = await Promise.all([
    supabase.from('galaxy_members').select('profiles(id, username, display_name)').eq('galaxy_id', galaxyId),
    supabase.from('spheres').select('id, parent_id, name, emoji, color, is_private, is_inbox').eq('galaxy_id', galaxyId).order('created_at'),
    supabase
      .from('items')
      .select('id, sphere_id, type, title, body_md, url, image_path, caption, is_private, created_by, created_at, updated_at, x, y')
      .eq('galaxy_id', galaxyId)
      .order('created_at'),
    supabase.from('item_links').select('source_id, target_id, items!item_links_source_id_fkey!inner(galaxy_id)').eq('items.galaxy_id', galaxyId),
  ]);
  if (members.error || spheres.error || items.error || links.error) {
    return NextResponse.json({ error: 'export failed' }, { status: 500 });
  }

  const data: ExportData = {
    galaxy,
    exported_at: new Date().toISOString(),
    members: (members.data ?? []).flatMap((m) => (m.profiles ? [m.profiles] : [])),
    spheres: spheres.data ?? [],
    items: items.data ?? [],
    links: (links.data ?? []).map(({ source_id, target_id }) => ({ source_id, target_id })),
  };

  const body = format === 'md' ? toMarkdown(data) : JSON.stringify(data, null, 2);
  return new NextResponse(body, {
    headers: {
      'content-type': format === 'md' ? 'text/markdown; charset=utf-8' : 'application/json; charset=utf-8',
      'content-disposition': `attachment; filename="${copy.exportData.filename(galaxy.name, format)}"`,
      'cache-control': 'no-store',
    },
  });
}
