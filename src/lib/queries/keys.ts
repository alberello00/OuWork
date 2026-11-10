export const keys = {
  galaxies: ['galaxies'] as const,
  invites: (galaxyId: string) => ['invites', galaxyId] as const,
  spheres: (galaxyId: string) => ['spheres', galaxyId] as const,
  allSpheres: ['spheres', 'all'] as const,
  stats: (galaxyId: string) => ['stats', galaxyId] as const,
  allStats: ['stats', 'all'] as const,
  items: (galaxyId: string) => ['items', galaxyId] as const,
  allItems: ['items', 'all'] as const,
  links: (galaxyId: string) => ['links', galaxyId] as const,
  annotations: (sphereId: string) => ['annotations', sphereId] as const,
  search: (q: string, galaxyId: string | null) => ['search', q, galaxyId] as const,
  signedUrl: (path: string) => ['signed-url', path] as const,
};
