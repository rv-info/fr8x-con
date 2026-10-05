/**
 * lib/supabase/audit.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Audit Logging Service for FR8X.
 * Persists immutable audit records to the `public.audit_logs` PostgreSQL table.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getSupabaseBrowserClient } from './client';
import { AuditLogInsert } from './types';

export class AuditLogger {
  /**
   * Records an audit event in PostgreSQL.
   */
  static async log(event: {
    userId?: string | null;
    action: string;
    entity: string;
    entityId?: string | null;
    oldData?: Record<string, any> | null;
    newData?: Record<string, any> | null;
  }): Promise<void> {
    try {
      const client = getSupabaseBrowserClient();
      const payload: AuditLogInsert = {
        user_id: event.userId || null,
        action: event.action,
        entity: event.entity,
        entity_id: event.entityId || null,
        old_data: event.oldData || null,
        new_data: event.newData || null,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : 'Server',
      };

      await (client.from('audit_logs') as any).insert(payload);
    } catch (err: any) {
      // Non-blocking: log to console if audit write encounters a transient issue
      console.warn('[AuditLogger] Failed to write audit log:', err.message);
    }
  }

  /**
   * Specialized helper to log user profile updates with before/after diffs.
   */
  static async logProfileChange(
    userId: string,
    field: string,
    oldValue: any,
    newValue: any
  ): Promise<void> {
    await this.log({
      userId,
      action: 'UPDATE_PROFILE_FIELD',
      entity: 'profiles',
      entityId: userId,
      oldData: { [field]: oldValue },
      newData: { [field]: newValue },
    });
  }
}
