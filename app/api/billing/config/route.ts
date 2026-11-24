import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';
import {
  getPlatformBillingConfig,
  updatePlatformBillingConfig,
} from '@/lib/billing/free-access-manager';

export const maxDuration = 10;

/**
 * GET /api/billing/config
 * Returns platform billing configuration.
 * Public view returns global mode & service policies; authenticated Godfather operators receive full config & audit logs.
 */
export async function GET(req: NextRequest) {
  const config = getPlatformBillingConfig();
  const gfAuth = authenticateGodfatherOperator(req);

  if (gfAuth.authenticated) {
    return NextResponse.json({
      success: true,
      config,
      isAdminView: true,
    });
  }

  // Public/Client Sanitized View
  return NextResponse.json({
    success: true,
    config: {
      globalBillingMode: config.globalBillingMode,
      servicePolicies: config.servicePolicies,
      updatedAt: config.updatedAt,
    },
    isAdminView: false,
  });
}

/**
 * POST /api/billing/config
 * Updates platform billing configuration (Godfather Super Admin only).
 */
export async function POST(req: NextRequest) {
  const gfAuth = authenticateGodfatherOperator(req);
  if (!gfAuth.authenticated || !gfAuth.operator) {
    return (gfAuth.errorResponse ||
      NextResponse.json(
        { success: false, error: 'Unauthorized: Godfather operator access required.' },
        { status: 401 }
      ))!;
  }

  try {
    const body = await req.json();
    const {
      globalBillingMode,
      superAdminPersonalFreeAccess,
      servicePolicies,
      addUserOverride,
      removeUserOverrideId,
      reason,
    } = body;

    const updated = updatePlatformBillingConfig({
      operatorId: gfAuth.operator.uid,
      operatorEmail: gfAuth.operator.email,
      globalBillingMode,
      superAdminPersonalFreeAccess,
      servicePolicies,
      addUserOverride,
      removeUserOverrideId,
      reason: reason || 'Godfather Super Admin Control Panel update',
    });

    return NextResponse.json({
      success: true,
      message: 'Platform billing configuration updated successfully.',
      config: updated,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to update billing config' },
      { status: 500 }
    );
  }
}
