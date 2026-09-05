import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { isCorporateEmail } from '@/lib/utils';

/**
 * POST /api/auth/register
 * Registers a new organization user under the strict "One User, One Login" policy.
 * Rejects duplicate accounts across both the same organization and different organizations.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      firstName,
      lastName,
      email,
      password,
      company,
      companyId,
      mobile,
      designation,
      role,
    } = body;

    if (!email || !password || !company || !firstName) {
      return NextResponse.json(
        { success: false, error: 'Mandatory fields missing: email, password, company, and first name are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify corporate email policy
    if (!isCorporateEmail(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Registration requires a corporate email domain. Free email services are strictly prohibited.',
        },
        { status: 400 }
      );
    }

    const uid = body.uid || `u-${Date.now()}`;
    const displayName = `${firstName} ${lastName || ''}`.trim();
    const origin =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin ||
      'https://con.fr8x.in';

    // Enforce "One User, One Login" duplicate check and generate email verification challenge
    const result = serverSecurityStore.registerUser(
      {
        uid,
        email: cleanEmail,
        password,
        displayName,
        company: company.trim(),
        companyId: companyId || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
        role: role || 'company_admin',
        mobile: mobile ? mobile.trim() : undefined,
      },
      { origin }
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 409 } // 409 Conflict for duplicate accounts
      );
    }

    const user = result.user!;

    // If verification is required, do not issue session cookie yet
    if (result.isVerificationRequired) {
      return NextResponse.json(
        {
          success: true,
          isVerificationRequired: true,
          message: 'Account registered. A verification email has been dispatched from password@fr8x.in with your verification code and link.',
          user: {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            company: user.company,
            companyId: user.companyId,
            role: user.role,
            mobile: user.mobile,
            designation: designation || 'Freight Procurement Manager',
            status: user.status,
          },
        },
        { status: 201 }
      );
    }

    const res = NextResponse.json(
      {
        success: true,
        message: 'Account successfully registered under One User, One Login policy.',
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          company: user.company,
          companyId: user.companyId,
          role: user.role,
          mobile: user.mobile,
          designation: designation || 'Freight Procurement Manager',
        },
      },
      { status: 201 }
    );

    // Set exclusive session cookie
    res.cookies.set('fr8x_session', user.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Registration service encountered an error.' },
      { status: 500 }
    );
  }
}
