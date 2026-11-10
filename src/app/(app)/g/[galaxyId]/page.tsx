import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const GalaxyUniverse = dynamic(() => import('@/components/universe/GalaxyUniverse').then((m) => m.GalaxyUniverse));

export default async function GalaxyPage({ params }: { params: Promise<{ galaxyId: string }> }) {
  const { galaxyId } = await params;
  return (
    <Suspense>
      <GalaxyUniverse galaxyId={galaxyId} />
    </Suspense>
  );
}
