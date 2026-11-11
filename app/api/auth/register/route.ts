import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { isCorporateEmail } from '@/lib/utils';
import { createSignedSessionToken } from '@/lib/crypto';
import { EmailService } from '@/lib/email-service';
import { createAdminClient } from '@/lib/supabase/server';

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
      isdCode,
      designation,
      position,
      department,
      city,
      state,
      country,
      address,
      registeredAddress,
      formattedAddress,
      postalCode,
      timezone,
      gstn,
      pan,
      iec,
      iecCode,
      mto,
      mtoNumber,
      role,
      plan,
    } = body;

    if (!email || !password || !company || !firstName) {
      return NextResponse.json(
        { success: false, error: 'Mandatory fields missing: email, password, company, and first name are required.' },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // Verify email format
    if (!isCorporateEmail(cleanEmail)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please provide a valid email address.',
        },
        { status: 400 }
      );
    }

    const displayName = `${firstName} ${lastName || ''}`.trim();
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const requestOrigin = host ? `${proto}://${host}` : undefined;
    const origin =
      requestOrigin ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://con.fr8x.in';

    // Disallow unverified privilege elevation (only 'company_admin' or 'user' allowed on registration)
    const assignedRole = role === 'user' ? 'user' : 'company_admin';
    const resolvedCompanyId = companyId || `CMP-${Math.floor(10000 + Math.random() * 90000)}`;
    const resolvedAddress = (registeredAddress || formattedAddress || address || '').trim();
    const resolvedIec = (iec || iecCode || '').trim();

    // Attempt authoritative Supabase Auth creation if admin client available
    let uid = body.uid ? String(body.uid).trim() : '';
    const adminClient = createAdminClient();
    if (adminClient) {
      try {
        const { data: authUser, error: authErr } = await adminClient.auth.admin.createUser({
          email: cleanEmail,
          password,
          email_confirm: false,
          user_metadata: {
            displayName,
            firstName: firstName.trim(),
            lastName: (lastName || '').trim(),
            company: company.trim(),
            companyId: resolvedCompanyId,
            mobile: mobile ? mobile.trim() : undefined,
            designation: designation || 'Freight Procurement Manager',
            role: assignedRole,
          },
        });
        if (authUser?.user?.id) {
          uid = authUser.user.id;
        } else if (authErr && authErr.message?.toLowerCase().includes('already')) {
          return NextResponse.json(
            {
              success: false,
              error: `An account with this email (${cleanEmail}) is already registered. Please sign in instead.`,
            },
            { status: 409 }
          );
        }
      } catch (authCreateErr: any) {
        console.warn('[RegisterAPI] Supabase auth.admin.createUser warning:', authCreateErr.message);
      }
    }

    if (!uid) {
      uid = `u-${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}`;
    }

    // Register user with email_verified = false and generate 15-minute hashed verification challenge
    const result = serverSecurityStore.registerUser(
      {
        uid,
        email: cleanEmail,
        password,
        displayName,
        firstName: firstName.trim(),
        lastName: (lastName || '').trim(),
        company: company.trim(),
        companyId: resolvedCompanyId,
        role: assignedRole,
        mobile: mobile ? mobile.trim() : undefined,
        phone: mobile ? mobile.trim() : undefined,
        designation: designation || position || 'Freight Procurement Manager',
        city: city ? String(city).trim() : undefined,
        state: state ? String(state).trim() : undefined,
        country: country ? String(country).trim() : undefined,
        address: resolvedAddress || undefined,
        formattedAddress: resolvedAddress || undefined,
        postalCode: postalCode ? String(postalCode).trim() : undefined,
        timezone: timezone ? String(timezone).trim() : undefined,
        gstn: gstn ? String(gstn).trim() : undefined,
        pan: pan ? String(pan).trim() : undefined,
        iec: resolvedIec || undefined,
        plan: plan || 'trial',
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

    // Verification is required: dispatch verification email
    if (result.isVerificationRequired) {
      let emailDispatched = false;
      let emailError: string | null = null;

      if (result.emailPromise) {
        try {
          const mailRes = await result.emailPromise;
          emailDispatched = Boolean(mailRes && mailRes.success);
          if (!emailDispatched && mailRes) {
            emailError = mailRes.error || 'Email delivery failure';
          }
        } catch (mailErr: any) {
          console.error('[RegisterAPI] Verification email delivery error:', mailErr.message);
          emailError = mailErr.message;
        }
      }

      const isDev = process.env.NODE_ENV !== 'production';

      return NextResponse.json(
        {
          success: true,
          isVerificationRequired: true,
          email_verified: false,
          emailDispatched,
          emailError: isDev ? emailError : undefined,
          message: emailDispatched
            ? `Account registered! A verification email with your 15-minute verification link has been sent to ${user.email}.`
            : `Account registered! Please check your email (${user.email}) for your 15-minute verification link.`,
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
            email_verified: false,
          },
        },
        { status: 201 }
      );
    }

    // Dispatch official Welcome onboarding email (FR8X_WELCOME_USER) from password@fr8x.in
    try {
      await EmailService.sendWelcomeEmail({
        to: user.email,
        firstName: user.displayName.split(' ')[0] || user.displayName,
        fullName: user.displayName,
        organizationName: user.company,
        verificationUrl: `${origin}/feeds`,
      });
    } catch (welcomeErr: any) {
      console.error('[RegisterAPI] Welcome email dispatch warning:', welcomeErr.message);
    }

    const res = NextResponse.json(
      {
        success: true,
        message: 'Account successfully registered under One User, One Login policy.',
        welcomeEmailSent: true,
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

    // Set cryptographically signed exclusive session cookie
    const userSessionToken = createSignedSessionToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      issuedAt: Date.now(),
    });

    res.cookies.set('fr8x_session', userSessionToken, {
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
