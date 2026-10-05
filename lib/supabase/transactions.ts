/**
 * lib/supabase/transactions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-Step Atomic Operations and RPC Wrappers for FR8X.
 * Ensures data consistency across multi-table writes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getSupabaseBrowserClient } from './client';
import { handleSupabaseError } from './errors';

export class TransactionManager {
  /**
   * Executes a database RPC stored procedure.
   */
  static async executeRpc<T = any>(
    functionName: string,
    params: Record<string, any> = {}
  ): Promise<T> {
    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await client.rpc(functionName, params);

      if (error) {
        throw handleSupabaseError(error, `rpc.${functionName}`);
      }

      return data as T;
    } catch (err) {
      throw handleSupabaseError(err, `rpc.${functionName}`);
    }
  }
}
