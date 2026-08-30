'use client';

import React from 'react';

interface GoldenTickProps {
  title?: string;
}

export function GoldenTick({ title = 'FR8X Premium Verified' }: GoldenTickProps) {
  return (
    <span className="golden-tick" title={title}>
      ✓
    </span>
  );
}
