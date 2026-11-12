import { Suspense } from 'react';
import { ItemDetailHost } from '@/components/items/ItemDetailHost';

export default async function GalaxyLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ galaxyId: string }>;
}) {
  const { galaxyId } = await params;
  return (
    <>
      {children}
      <Suspense>
        <ItemDetailHost galaxyId={galaxyId} />
      </Suspense>
    </>
  );
}
