import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import {
  generateBillingQuote,
  ChargeableServiceType,
} from '@/lib/billing/billing-engine';
import {
  evaluateEntitlement,
} from '@/lib/billing/free-access-manager';
import {
  resolveCurrencyForCountry,
  detectCountryFromHeaders,
} from '@/lib/billing/currency-detector';

export const maxDuration = 10;

/**
 * POST /api/billing/quote
 * Generates a cryptographically signed, 15-minute locked quote for a requested service.
 */
export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req);
  const gfAuth = authenticateGodfatherOperator(req);

  const userId = userAuth.user?.uid || gfAuth.operator?.uid || null;
  const companyId = userAuth.user?.companyId || null;
  const userRole = userAuth.user?.role || gfAuth.operator?.role || null;

  try {
    const body = await req.json();
    const {
      catalogKey,
      serviceType = 'subscription',
      customCurrency,
      billingCountry,
      customTitle,
      liveRatesUSD,
    } = body;

    if (!catalogKey) {
      return NextResponse.json(
        { success: false, error: 'catalogKey is required (e.g., sub_pro, job_2d, ad_2d).' },
        { status: 400 }
      );
    }

    // 1. Resolve Currency
    let detectedCountry = billingCountry;
    if (!detectedCountry) {
      detectedCountry = detectCountryFromHeaders(req.headers);
    }
    const targetCurrency = customCurrency || resolveCurrencyForCountry(detectedCountry);

    // 2. Evaluate Free Entitlement
    const entitlement = evaluateEntitlement({
      userId,
      companyId,
      userRole,
      serviceType: serviceType as ChargeableServiceType,
    });

    // 3. Generate Quote
    const quote = generateBillingQuote({
      catalogKey,
      targetCurrency,
      customTitle,
      isFree: entitlement.isFree,
      freeReason: entitlement.reason,
      liveRatesUSD,
    });

    return NextResponse.json({
      success: true,
      quote,
      entitlement,
      billingCountry: detectedCountry,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to generate quote' },
      { status: 500 }
    );
  }
}
