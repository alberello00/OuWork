import { Suspense } from 'react';
import { SphereView } from '@/components/spheres/SphereView';

export default async function SpherePage({ params }: { params: Promise<{ galaxyId: string; sphereId: string }> }) {
  const { galaxyId, sphereId } = await params;
  return (
    <Suspense>
      <SphereView galaxyId={galaxyId} sphereId={sphereId} />
    </Suspense>
  );
}
