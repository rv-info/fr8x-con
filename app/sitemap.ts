import { MetadataRoute } from 'next';
import { routeSeoConfigs, getCanonicalUrl } from '@/config/seo';
import { getDbClient } from '@/lib/supabase/server';
import { isProfilePubliclyIndexable } from '@/lib/seo/profile-seo';
import { SITE_URL } from '@/config/site-metadata';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = Object.values(routeSeoConfigs).filter((r) => !r.noIndex);
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = routes.map((route) => ({
    url: getCanonicalUrl(route.path),
    lastModified: now,
    changeFrequency: route.changeFrequency || 'weekly',
    priority: route.priority ?? 0.7,
  }));

  const profileEntries: MetadataRoute.Sitemap = [];

  try {
    const supabase = getDbClient();
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, privacy_settings, updated_at')
      .limit(500);

    if (!error && Array.isArray(profiles)) {
      for (const p of profiles) {
        // Explicit opt-in verification: Default is OFF.
        // Users who opt out are immediately excluded from sitemap.
        if (isProfilePubliclyIndexable(p as any)) {
          profileEntries.push({
            url: `${SITE_URL}/people/${p.id}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : now,
            changeFrequency: 'weekly',
            priority: 0.6,
          });
        }
      }
    }
  } catch {
    // Fail-closed: Never expose unverified profiles if database is unreachable
  }

  return [...staticEntries, ...profileEntries];
}
