'use client';

import React, { useState } from 'react';
import { getAssetPath } from '@/lib/assets/registry';

interface AssetImageProps {
  id: string;                   // Stable asset ID from registry
  overridePath?: string | null; // Database override path
  alt?: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none';
}

/**
 * AssetImage - Central component for rendering registered enterprise assets.
 * When administrators upload or replace an icon in the Icons & Branding panel,
 * all components referencing this stable ID update automatically.
 */
export function AssetImage({
  id,
  overridePath,
  alt,
  width,
  height,
  className,
  style,
  objectFit = 'contain',
}: AssetImageProps) {
  const [hasError, setHasError] = useState(false);
  const src = hasError ? '/ART/LOGOS/logo_primary.png' : getAssetPath(id, overridePath);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt || id}
      width={width}
      height={height}
      className={className}
      style={{
        objectFit,
        maxWidth: '100%',
        ...style,
      }}
      onError={() => {
        if (!hasError) setHasError(true);
      }}
    />
  );
}
