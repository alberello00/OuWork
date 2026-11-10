import { Suspense } from 'react';
import { NotesView } from '@/components/notes/NotesView';

export default async function NotesPage({ params }: { params: Promise<{ galaxyId: string }> }) {
  const { galaxyId } = await params;
  return (
    <Suspense>
      <NotesView galaxyId={galaxyId} />
    </Suspense>
  );
}
