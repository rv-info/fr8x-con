import { MetadataRoute } from 'next';
import { robotsPolicy } from '@/config/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: robotsPolicy.rules,
    sitemap: robotsPolicy.sitemap,
    host: robotsPolicy.host,
  };
}
