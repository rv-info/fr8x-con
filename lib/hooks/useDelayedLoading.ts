'use client';

import { useEffect, useState } from 'react';

/**
 * Delays showing a loading indicator by `delayMs` (default 180ms) so fast
 * operations complete without a visual flash. Never delays hiding: as soon as
 * `active` turns false, `visible` becomes false immediately.
 */
export function useDelayedLoading(active: boolean, delayMs = 180): boolean {
  const [visible, setVisible] = useState<boolean>(active && delayMs <= 0);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    if (delayMs <= 0) {
      setVisible(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [active, delayMs]);

  return visible;
}
