import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/** /notes opens the Notes view of the first shared galaxy (personal one as a fallback). */
export default async function NotesRedirect() {
  const supabase = await createClient();
  const { data } = await supabase.from('galaxies').select('id, is_personal').order('created_at');
  const target = data?.find((g) => !g.is_personal) ?? data?.[0];
  redirect(target ? `/w/${target.id}/notes` : '/');
}
