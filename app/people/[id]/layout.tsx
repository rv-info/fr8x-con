import React from 'react';
import type { Metadata } from 'next';
import { getDbClient } from '@/lib/supabase/server';
import { generateProfileMetadata, generateProfileStructuredData } from '@/lib/seo/profile-seo';

interface PersonLayoutProps {
  params: { id: string };
  children: React.ReactNode;
}

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  try {
    const supabase = getDbClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, designation, position, company_name, city, country, avatar_url, privacy_settings')
      .eq('id', params.id)
      .maybeSingle();

    return generateProfileMetadata(profile);
  } catch {
    return generateProfileMetadata(null);
  }
}

export default async function PersonLayout({ params, children }: PersonLayoutProps) {
  let jsonLd: Record<string, any> | null = null;
  try {
    const supabase = getDbClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, first_name, last_name, designation, position, company_name, city, country, avatar_url, privacy_settings')
      .eq('id', params.id)
      .maybeSingle();

    jsonLd = generateProfileStructuredData(profile);
  } catch {}

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
