import { NextResponse, type NextRequest } from 'next/server';
import { fetchPreview } from '@/lib/server/linkPreview';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

/** GET /api/link-preview?url=… — signed-in users only. */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const url = request.nextUrl.searchParams.get('url') ?? '';
  if (!/^https?:\/\//i.test(url) || url.length > 2000) {
    return NextResponse.json({ error: 'invalid url' }, { status: 400 });
  }
  try {
    const preview = await fetchPreview(url);
    return NextResponse.json(preview, { headers: { 'cache-control': 'private, max-age=3600' } });
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 422 });
  }
}
