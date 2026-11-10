import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'OurWorld',
    short_name: 'OurWorld',
    description: 'Our little universe: notes, links and pictures, shared in galaxies.',
    start_url: '/',
    display: 'standalone',
    background_color: '#14152B',
    theme_color: '#14152B',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
    ],
  };
}
