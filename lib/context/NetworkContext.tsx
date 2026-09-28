'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  networkSpeedManager,
  NetworkSpeedTier,
  NetworkConnectionInfo,
  QueuedOfflineAction,
  NetworkStatusPayload,
} from '@/lib/network/NetworkSpeedManager';

interface NetworkContextType {
  isOnline: boolean;
  tier: NetworkSpeedTier;
  connection: NetworkConnectionInfo;
  pendingCount: number;
  isSyncing: boolean;
  measuredLatency: number;
  lastSyncedAt: string | null;
  recommendedBatchSize: number;
  isLowBandwidth: boolean;
  isSlowConnection: boolean;
  queueAction: (actionType: QueuedOfflineAction['actionType'], payload: any, actorUid?: string) => void;
  flushOutbox: () => Promise<{ synced: number; remaining: number }>;
  measureLatency: () => Promise<number>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NetworkStatusPayload>({
    isOnline: true,
    tier: 'hyper',
    connection: { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false },
    pendingCount: 0,
    isSyncing: false,
    measuredLatency: 50,
    lastSyncedAt: null,
  });

  useEffect(() => {
    const unsubscribe = networkSpeedManager.subscribe((info) => {
      setState(info);
    });
    return unsubscribe;
  }, []);

  const queueAction = (
    actionType: QueuedOfflineAction['actionType'],
    payload: any,
    actorUid = 'anonymous'
  ) => {
    networkSpeedManager.queueAction(actionType, payload, actorUid);
  };

  const flushOutbox = () => {
    return networkSpeedManager.flushOutbox();
  };

  const measureLatency = () => {
    return networkSpeedManager.measureLatency();
  };

  const isLowBandwidth = state.tier === 'saver' || state.tier === 'offline';
  const isSlowConnection = state.tier === 'saver' || state.tier === 'adaptive';
  const recommendedBatchSize = networkSpeedManager.getRecommendedBatchSize();

  return (
    <NetworkContext.Provider
      value={{
        isOnline: state.isOnline,
        tier: state.tier,
        connection: state.connection,
        pendingCount: state.pendingCount,
        isSyncing: state.isSyncing,
        measuredLatency: state.measuredLatency,
        lastSyncedAt: state.lastSyncedAt,
        recommendedBatchSize,
        isLowBandwidth,
        isSlowConnection,
        queueAction,
        flushOutbox,
        measureLatency,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
}
