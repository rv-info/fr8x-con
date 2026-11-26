'use client';

import { createClient, Client } from 'graphql-ws';

export type ChatConnectionState =
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'DISCONNECTED'
  | 'AUTHENTICATION_ERROR';

export interface NhostChatClientConfig {
  graphqlUrl?: string;
  wsUrl?: string;
  tokenEndpoint?: string;
  onStateChange?: (state: ChatConnectionState) => void;
  onReconnected?: () => void;
}

const DEFAULT_GRAPHQL_URL =
  process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL ||
  'https://utweonkbxcuhvsetvxjo.graphql.ap-south-1.nhost.run/v1';

const DEFAULT_WS_URL =
  process.env.NEXT_PUBLIC_NHOST_WS_URL ||
  'wss://utweonkbxcuhvsetvxjo.graphql.ap-south-1.nhost.run/v1';

export class NhostChatRealtimeClient {
  private readonly graphqlUrl: string;
  private readonly wsUrl: string;
  private readonly tokenEndpoint: string;
  private readonly onStateChange?: (state: ChatConnectionState) => void;
  private readonly onReconnected?: () => void;

  private wsClient: Client | null = null;
  private state: ChatConnectionState = 'DISCONNECTED';
  private token: string | null = null;
  private tokenExpiresAt = 0;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private hasConnectedOnce = false;
  private destroyed = false;
  private activeTokenFetch: Promise<string | null> | null = null;

  constructor(config: NhostChatClientConfig = {}) {
    this.graphqlUrl = config.graphqlUrl || DEFAULT_GRAPHQL_URL;
    this.wsUrl = config.wsUrl || DEFAULT_WS_URL;
    this.tokenEndpoint = config.tokenEndpoint || '/api/chat/token';
    this.onStateChange = config.onStateChange;
    this.onReconnected = config.onReconnected;
  }

  public getState(): ChatConnectionState {
    return this.state;
  }

  private setState(next: ChatConnectionState) {
    if (this.state === next) return;
    this.state = next;
    this.onStateChange?.(next);
  }

  public async getValidToken(forceRefresh = false): Promise<string | null> {
    if (this.destroyed) return null;
    const now = Date.now();
    if (!forceRefresh && this.token && now < this.tokenExpiresAt - 30_000) {
      return this.token;
    }
    if (this.activeTokenFetch) {
      return this.activeTokenFetch;
    }

    this.activeTokenFetch = (async () => {
      try {
        const res = await fetch(this.tokenEndpoint, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data?.success || !data?.token) {
          this.token = null;
          this.tokenExpiresAt = 0;
          this.setState('AUTHENTICATION_ERROR');
          return null;
        }
        this.token = data.token;
        this.tokenExpiresAt = typeof data.expiresAt === 'number' ? data.expiresAt : Date.now() + 14 * 60_000;
        this.scheduleTokenRefresh();
        return this.token;
      } catch {
        return null;
      } finally {
        this.activeTokenFetch = null;
      }
    })();

    return this.activeTokenFetch;
  }

  private scheduleTokenRefresh() {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.destroyed || !this.tokenExpiresAt) return;
    const refreshInMs = Math.max(15_000, this.tokenExpiresAt - Date.now() - 90_000);
    this.refreshTimer = setTimeout(async () => {
      if (this.destroyed) return;
      const fresh = await this.getValidToken(true);
      if (fresh && this.wsClient) {
        // Restart socket cleanly so new connectionParams JWT is used
        try {
          this.wsClient.terminate();
        } catch {}
      }
    }, refreshInMs);
  }

  public ensureWsClient(): Client {
    if (this.wsClient) return this.wsClient;

    this.setState('CONNECTING');
    this.wsClient = createClient({
      url: this.wsUrl,
      lazy: true,
      keepAlive: 25_000,
      retryAttempts: Infinity,
      shouldRetry: (errOrCloseEvent: any) => {
        if (this.destroyed) return false;
        if (this.state === 'AUTHENTICATION_ERROR') return false;
        // Stop retrying if server explicitly closed with unauthorized code
        const code = errOrCloseEvent?.code;
        if (code === 4401 || code === 4403) {
          this.setState('AUTHENTICATION_ERROR');
          return false;
        }
        return true;
      },
      retryWait: async (retries: number) => {
        const base = Math.min(30_000, 1000 * Math.pow(2, retries));
        const jitter = Math.floor(Math.random() * 400);
        await new Promise((resolve) => setTimeout(resolve, base + jitter));
      },
      connectionParams: async () => {
        const jwt = await this.getValidToken();
        if (!jwt) {
          throw new Error('AUTHENTICATION_ERROR');
        }
        return {
          headers: {
            Authorization: `Bearer ${jwt}`,
          },
        };
      },
      on: {
        connecting: () => {
          this.setState(this.hasConnectedOnce ? 'RECONNECTING' : 'CONNECTING');
        },
        connected: () => {
          const isReconnect = this.hasConnectedOnce;
          this.hasConnectedOnce = true;
          this.setState('CONNECTED');
          if (isReconnect) {
            this.onReconnected?.();
          }
        },
        closed: () => {
          if (!this.destroyed && this.state !== 'AUTHENTICATION_ERROR') {
            this.setState(this.hasConnectedOnce ? 'RECONNECTING' : 'DISCONNECTED');
          }
        },
        error: () => {
          if (!this.destroyed && this.state !== 'AUTHENTICATION_ERROR') {
            this.setState(this.hasConnectedOnce ? 'RECONNECTING' : 'DISCONNECTED');
          }
        },
      },
    });

    return this.wsClient;
  }

  public subscribe<T = any>(
    query: string,
    variables: Record<string, any> | undefined,
    handlers: {
      next: (data: T) => void;
      error?: (err: unknown) => void;
      complete?: () => void;
    }
  ): () => void {
    const client = this.ensureWsClient();
    return client.subscribe<T>(
      { query, variables },
      {
        next: (result) => {
          if (result.data) {
            handlers.next(result.data);
          }
        },
        error: (err) => {
          handlers.error?.(err);
        },
        complete: () => {
          handlers.complete?.();
        },
      }
    );
  }

  public async executeGraphQL<T = any>(
    query: string,
    variables?: Record<string, any>
  ): Promise<{ data?: T; errors?: Array<{ message: string }> }> {
    const jwt = await this.getValidToken();
    if (!jwt) {
      return { errors: [{ message: 'Chat authentication unavailable' }] };
    }

    const res = await fetch(this.graphqlUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ query, variables }),
    });

    if (res.status === 401 || res.status === 403) {
      // Retry once with forced token refresh
      const refreshed = await this.getValidToken(true);
      if (!refreshed) {
        this.setState('AUTHENTICATION_ERROR');
        return { errors: [{ message: 'Chat authentication expired' }] };
      }
      const retryRes = await fetch(this.graphqlUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${refreshed}`,
        },
        body: JSON.stringify({ query, variables }),
      });
      return retryRes.json();
    }

    return res.json();
  }

  public async dispose() {
    this.destroyed = true;
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
    if (this.wsClient) {
      try {
        await this.wsClient.dispose();
      } catch {}
      this.wsClient = null;
    }
    this.setState('DISCONNECTED');
  }
}
