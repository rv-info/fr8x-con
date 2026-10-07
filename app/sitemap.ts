import { MetadataRoute } from 'next';
import { routeSeoConfigs, getCanonicalUrl } from '@/config/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = Object.values(routeSeoConfigs).filter((r) => !r.noIndex);
  const now = new Date();

  return routes.map((route) => ({
    url: getCanonicalUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency || 'weekly',
    priority: route.priority ?? 0.7,
  }));
}
