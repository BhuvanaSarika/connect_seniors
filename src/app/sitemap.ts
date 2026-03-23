import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://seniors.solvempire.com';
  
  const routes = [
    '',
    '/dashboard',
    '/roadmaps',
    '/projects',
    '/mentorship',
    '/resume',
    '/courses',
    '/login',
    '/register',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : 0.8,
  }));

  return routes;
}
