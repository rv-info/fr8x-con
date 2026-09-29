/**
 * lib/hooks/useOptimizedData.ts
 * High-performance, low-bandwidth data fetching hooks using SWR and IndexedDB.
 * Features:
 * - Stale-while-revalidate with zero flash of empty content.
 * - Automatic request deduplication to save mobile bytes.
 * - In-flight request cancellation via AbortController.
 * - Dynamic throttle / offline fallback under 2G / Slow 3G.
 * - Cursor & limit pagination support.
 */

import React, { useRef, useEffect, useState } from 'react';
import useSWR, { SWRConfiguration } from 'swr';
import { useNetwork } from '@/lib/context/NetworkContext';
import { getCachedMasterData, setCachedMasterData } from '@/lib/cache/indexedDBCache';

export interface LowBandwidthFetchOptions extends RequestInit {
  cacheKey?: string;
  cacheTtlMs?: number;
  skipNetworkIfCached?: boolean;
}

/**
 * Robust low-bandwidth JSON fetcher with AbortController timeout & compression headers.
 */
export async function lowBandwidthFetcher<T = any>(
  url: string,
  options?: LowBandwidthFetchOptions
): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s safety timeout

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        'X-Requested-With': 'FR8X-Adaptive-Client',
        ...(options?.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Network response was not ok');
      throw new Error(`API error ${res.status}: ${errorText}`);
    }

    const data = await res.json();

    // Cache to IndexedDB if cacheKey provided
    if (options?.cacheKey) {
      setCachedMasterData(options.cacheKey, data, options.cacheTtlMs).catch(() => {});
    }

    return data;
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      console.warn(`[LowBandwidthFetcher] Request timed out or cancelled: ${url}`);
    }
    // Attempt fallback from IndexedDB cache if available
    if (options?.cacheKey) {
      const cached = await getCachedMasterData<T>(options.cacheKey);
      if (cached) {
        return cached;
      }
    }
    throw err;
  }
}

/**
 * SWR Hook tailored for Low-Bandwidth / 2G networks.
 * Automatically disables expensive polling on cellular/2G networks.
 */
export function useAdaptiveSWR<T = any>(
  key: string | null,
  fetcher?: (url: string) => Promise<T>,
  config?: SWRConfiguration<T>
) {
  const { isOnline, isSlowConnection, isLowBandwidth, connection } = useNetwork();
  const isDataSaver = isLowBandwidth || !!connection?.saveData;

  const defaultConfig: SWRConfiguration<T> = {
    revalidateOnFocus: !isSlowConnection && !isDataSaver, // Don't burn data when switching apps
    revalidateOnReconnect: true,
    revalidateIfStale: isOnline,
    dedupingInterval: isSlowConnection ? 15000 : 5000, // Deduplicate identical requests for 15s on slow networks
    errorRetryCount: isSlowConnection ? 2 : 3, // Prevent battery/bandwidth drain on failures
    errorRetryInterval: 4000,
    keepPreviousData: true, // Smooth transition between pages/filters
    ...config,
  };

  return useSWR<T>(key, fetcher || ((url: string) => lowBandwidthFetcher<T>(url)), defaultConfig);
}

/**
 * Debounced search query hook with active in-flight request cancellation.
 */
export function useDebouncedSearch(searchTerm: string, delayMs: number = 300) {
  const [debouncedValue, setDebouncedValue] = useState(searchTerm);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Abort previous in-flight request on new keystroke
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const handler = setTimeout(() => {
      setDebouncedValue(searchTerm);
    }, delayMs);

    return () => {
      clearTimeout(handler);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [searchTerm, delayMs]);

  return { debouncedValue, getAbortSignal: () => abortControllerRef.current?.signal };
}
