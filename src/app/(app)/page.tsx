import { GalaxiesHome } from '@/components/galaxies/GalaxiesHome';
import { NewsBanner } from '@/components/news/NewsBanner';

export default function HomePage() {
  return <GalaxiesHome banner={<NewsBanner className="mb-5" />} />;
}
