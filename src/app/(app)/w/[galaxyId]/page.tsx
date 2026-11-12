import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const WorkspaceOverview = dynamic(() => import('@/components/workspace/WorkspaceOverview').then((m) => m.WorkspaceOverview));

export default async function GalaxyPage({ params }: { params: Promise<{ galaxyId: string }> }) {
  const { galaxyId } = await params;
  return (
    <Suspense>
      <WorkspaceOverview galaxyId={galaxyId} />
    </Suspense>
  );
}
