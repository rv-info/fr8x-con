/**
 * lib/supabase/authorization.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Authorization Layer for FR8X.
 * Validates identity, ownership, and role-based permissions against
 * Supabase Auth and PostgreSQL. Never trusts client-supplied user IDs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { User } from '@supabase/supabase-js';
import { AuthenticationError, AuthorizationError } from './errors';
import { getSupabaseBrowserClient } from './client';

export interface AuthContextUser {
  id: string;
  email: string;
  role?: string;
  companyId?: string;
}

/**
 * Ensures a user is actively authenticated via Supabase Auth.
 */
export async function requireUser(): Promise<User> {
  const client = getSupabaseBrowserClient();
  const { data: { user }, error } = await client.auth.getUser();

  if (error || !user) {
    throw new AuthenticationError('Active authenticated Supabase session required');
  }

  return user;
}

/**
 * Asserts that the authenticated user matches the target resource owner ID,
 * or has administrative privileges.
 */
export function requireOwnership(
  authenticatedUserId: string,
  targetUserId: string,
  userRole?: string
): void {
  if (userRole === 'super_admin' || userRole === 'moderator') {
    return; // Privileged access granted
  }

  if (authenticatedUserId !== targetUserId) {
    throw new AuthorizationError(
      'Access denied: You can only view or modify your own profile and resources.'
    );
  }
}

/**
 * Asserts that the user possesses one of the allowed roles.
 */
export function requireRole(userRole: string | undefined, allowedRoles: string[]): void {
  if (!userRole || !allowedRoles.includes(userRole)) {
    throw new AuthorizationError(
      `Access denied: Required role [${allowedRoles.join(', ')}], current role is [${userRole || 'none'}].`
    );
  }
}
