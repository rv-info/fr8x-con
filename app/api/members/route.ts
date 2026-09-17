import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const roleFilter = (searchParams.get('role') || '').trim().toLowerCase();
    const statusFilter = (searchParams.get('status') || '').trim().toLowerCase();
    const limit = Math.min(Number(searchParams.get('limit') || 100), 200);

    const allRecords = serverSecurityStore.getAllRegisteredUsers();

    // Map to sanitized public profile
    const sanitized = allRecords.map((uRaw) => {
      const u = uRaw as any;
      const displayName = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
      const role = u.role || 'freight_forwarder';
      const isVerified = Boolean(u.isEmailVerified || u.email_verified || u.isVerified);
      const hasGoldenTick = Boolean(u.hasGoldenTick || u.plan === 'premium');

      return {
        uid: u.uid,
        id: u.uid,
        email: u.email,
        displayName,
        firstName: u.firstName || displayName.split(' ')[0] || '',
        lastName: u.lastName || displayName.split(' ').slice(1).join(' ') || '',
        company: u.company || 'Enterprise Logistics Member',
        designation: u.designation || 'Trade Specialist',
        role,
        city: u.city || 'Mumbai',
        country: u.country || 'India',
        location: `${u.city || 'Mumbai'}, ${u.country || 'India'}`,
        timezone: u.timezone || 'Asia/Kolkata',
        isVerified,
        hasGoldenTick,
        plan: u.plan || 'trial',
        gstn: u.gstn || '',
        pan: u.pan || '',
        mobile: u.mobile || '',
        operatingCorridors: u.operatingCorridors || 'Nhava Sheva ⇄ Jebel Ali, Rotterdam',
        avatarUrl: u.avatarUrl || null,
        isOnline: true,
        createdAt: u.createdAt || new Date().toISOString(),
      };
    });

    // Apply filtering
    let results = sanitized;

    if (q) {
      results = results.filter((m) => {
        return (
          m.displayName.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q) ||
          m.company.toLowerCase().includes(q) ||
          m.designation.toLowerCase().includes(q) ||
          m.city.toLowerCase().includes(q) ||
          m.country.toLowerCase().includes(q) ||
          (m.gstn && m.gstn.toLowerCase().includes(q))
        );
      });
    }

    if (roleFilter) {
      if (roleFilter === 'forwarder_nvocc' || roleFilter === 'bidder') {
        results = results.filter((m) =>
          ['freight_forwarder', 'nvocc', 'forwarder', 'company_admin', 'operator'].includes(m.role.toLowerCase())
        );
      } else {
        results = results.filter((m) => m.role.toLowerCase().includes(roleFilter));
      }
    }

    if (statusFilter) {
      if (statusFilter === 'verified') {
        results = results.filter((m) => m.isVerified);
      } else if (statusFilter === 'active') {
        results = results.filter((m) => m.isVerified || m.plan === 'premium' || m.plan === 'professional' || m.plan === 'trial');
      } else if (statusFilter === 'gold') {
        results = results.filter((m) => m.hasGoldenTick);
      }
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      members: results.slice(0, limit),
    });
  } catch (err: any) {
    console.error('[API/Members] Error fetching members:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve registered members' },
      { status: 500 }
    );
  }
}
