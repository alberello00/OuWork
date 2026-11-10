import { GalaxyHome } from '@/components/galaxies/GalaxyHome';

export default async function GalaxyPage({ params }: { params: Promise<{ galaxyId: string }> }) {
  const { galaxyId } = await params;
  return <GalaxyHome galaxyId={galaxyId} />;
}
