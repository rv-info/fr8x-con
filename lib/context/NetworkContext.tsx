'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  networkSpeedManager,
  NetworkSpeedTier,
  NetworkConnectionInfo,
  QueuedOfflineAction,
} from '@/lib/network/NetworkSpeedManager';

interface NetworkContextType {
  isOnline: boolean;
  tier: NetworkSpeedTier;
  connection: NetworkConnectionInfo;
  pendingCount: number;
  recommendedBatchSize: number;
  isLowBandwidth: boolean;
  queueAction: (actionType: QueuedOfflineAction['actionType'], payload: any, actorUid?: string) => void;
  flushOutbox: () => Promise<{ synced: number; remaining: number }>;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{
    isOnline: boolean;
    tier: NetworkSpeedTier;
    connection: NetworkConnectionInfo;
    pendingCount: number;
  }>({
    isOnline: true,
    tier: 'hyper',
    connection: { effectiveType: '4g', downlink: 10, rtt: 50, saveData: false },
    pendingCount: 0,
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

  const isLowBandwidth = state.tier === 'saver' || state.tier === 'offline';
  const recommendedBatchSize = networkSpeedManager.getRecommendedBatchSize();

  return (
    <NetworkContext.Provider
      value={{
        isOnline: state.isOnline,
        tier: state.tier,
        connection: state.connection,
        pendingCount: state.pendingCount,
        recommendedBatchSize,
        isLowBandwidth,
        queueAction,
        flushOutbox,
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
