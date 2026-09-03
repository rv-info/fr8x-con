/**
 * lib/intelligence/operationalSignals.ts
 * Ingestion and verification interface for external operational disruptions and maritime signals.
 */

import { OperationalSignal, OperationalSignalType } from '@/lib/types';

class OperationalSignalManager {
  private inMemorySignals: Map<string, OperationalSignal> = new Map();

  /**
   * Ingest an operational signal with strict verification metadata
   */
  public ingestSignal(params: {
    signalType: OperationalSignalType;
    headline: string;
    description: string;
    source: string;
    observedAt: string;
    confidenceScore: number;
    expiresAt: string;
    verificationStatus: 'verified' | 'unverified' | 'debunked';
    severity: 'low' | 'medium' | 'high' | 'critical';
    portLocode?: string;
    tradeLane?: string;
    carrierScac?: string;
  }): OperationalSignal {
    // Validate confidence
    const confidence = Math.max(0.0, Math.min(1.0, params.confidenceScore));

    const id = `sig_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const signal: OperationalSignal = {
      id,
      signalType: params.signalType,
      headline: params.headline,
      description: params.description,
      source: params.source,
      observedAt: params.observedAt,
      confidenceScore: confidence,
      expiresAt: params.expiresAt,
      verificationStatus: params.verificationStatus,
      severity: params.severity,
      portLocode: params.portLocode,
      tradeLane: params.tradeLane,
      carrierScac: params.carrierScac,
    };

    this.inMemorySignals.set(id, signal);
    return signal;
  }

  /**
   * Query active, verified disruptions for a specific port or trade lane
   */
  public getActiveDisruptions(options: {
    portLocode?: string;
    tradeLane?: string;
    carrierScac?: string;
    onlyVerified?: boolean;
  }): OperationalSignal[] {
    const now = Date.now();
    const results: OperationalSignal[] = [];

    for (const signal of this.inMemorySignals.values()) {
      // Check expiry
      if (new Date(signal.expiresAt).getTime() < now) continue;

      if (options.onlyVerified !== false && signal.verificationStatus !== 'verified') {
        continue;
      }

      if (options.portLocode && signal.portLocode === options.portLocode) {
        results.push(signal);
      } else if (options.tradeLane && signal.tradeLane === options.tradeLane) {
        results.push(signal);
      } else if (options.carrierScac && signal.carrierScac === options.carrierScac) {
        results.push(signal);
      }
    }

    return results;
  }
}

export const signalManager = new OperationalSignalManager();
