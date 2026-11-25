import React from 'react';
import Link from 'next/link';
import { buildRouteMetadata } from '@/config/seo';
import { Footer } from '@/components/layout/Footer';
import {
  ShieldCheck,
  Lock,
  FileText,
  AlertTriangle,
  Scale,
  Database,
  Eye,
  Server,
  UserCheck,
  Trash2,
  HelpCircle,
} from 'lucide-react';

export const metadata = buildRouteMetadata('privacy');

const cardStyle: React.CSSProperties = {
  background: 'var(--surface-primary, #FFFFFF)',
  border: '1px solid var(--border-subtle, #E5E7EB)',
  borderRadius: '10px',
  padding: '24px',
  boxShadow: 'var(--shadow-card)',
};

const iconBoxStyle: React.CSSProperties = {
  padding: '8px',
  borderRadius: '8px',
  background: 'var(--surface-secondary, #F9FAFB)',
  border: '1px solid var(--border-subtle, #E5E7EB)',
  color: 'var(--accent-primary, #006B68)',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 16, 2026';
  const policyVersion = 'v4.0.0-PROD';

  return (
    <div style={{ minHeight: '100vh', background: 'var(--app-bg, #FFFFFF)', color: 'var(--text-primary, #1F2937)', fontFamily: 'var(--font-family-primary)' }}>
      {/* Navigation Header */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid var(--border-subtle, #E5E7EB)',
          background: 'var(--surface-primary, #FFFFFF)',
          padding: '12px 24px',
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <img
              src="/ART/LOGOS/logo_primary.png"
              alt="FR8X"
              style={{ width: '28px', height: '28px', objectFit: 'contain' }}
            />
            <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--accent-primary, #006B68)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
              FR8X
            </div>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px' }}>
            <Link
              href="https://con.fr8x.in/terms"
              style={{
                color: 'var(--accent-primary, #006B68)',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-default, #D9DEE5)',
                background: 'var(--surface-primary, #FFFFFF)',
              }}
            >
              <Scale size={14} /> Master Terms of Service
            </Link>
            <Link
              href="/"
              style={{
                color: 'var(--text-primary, #1F2937)',
                fontWeight: 600,
                textDecoration: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                border: '1px solid var(--border-default, #D9DEE5)',
                background: 'var(--surface-secondary, #F9FAFB)',
              }}
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div
        style={{
          background: 'var(--surface-primary, #FFFFFF)',
          borderBottom: '1px solid var(--border-subtle, #E5E7EB)',
          padding: '32px 24px',
        }}
      >
        <div style={{ maxWidth: '1040px', margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 12px',
              borderRadius: '20px',
              background: 'var(--surface-secondary, #F9FAFB)',
              border: '1px solid var(--border-default, #D9DEE5)',
              color: 'var(--accent-primary, #006B68)',
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '12px',
            }}
          >
            <ShieldCheck size={14} style={{ color: '#059669' }} />
            DPDPA 2023 &amp; DPDP Rules 2025 Verified Compliance Architecture
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: 'var(--text-primary, #1F2937)', letterSpacing: '-0.02em', lineHeight: 1.25, margin: '0 0 10px' }}>
            FR8X Comprehensive Privacy Documentation &amp; Data Governance System
          </h1>
          <p style={{ color: 'var(--text-secondary, #64748B)', fontSize: '13px', maxWidth: '780px', lineHeight: 1.55, margin: 0 }}>
            Legal Entity: <strong style={{ color: 'var(--text-primary, #1F2937)' }}>FR8X Technology Private Limited</strong> (Mumbai, Maharashtra, India).
            Effective Date: <strong style={{ color: 'var(--text-primary, #1F2937)' }}>{lastUpdated}</strong> | Document Version: <strong style={{ color: 'var(--text-primary, #1F2937)' }}>{policyVersion}</strong>.
            Governs the <code>con.fr8x.in</code> web application, Android ecosystem (<code>com.fr8x.app</code>), and associated freight APIs.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main style={{ maxWidth: '1040px', margin: '0 auto', padding: '28px 24px 48px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Policy Section Navigation Quick Links */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary, #64748B)', margin: '0 0 12px' }}>
            Policy Navigation Directory (12 Statutory Governance Documents)
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '8px', fontSize: '12px' }}>
            {[
              { id: 'sec-1', label: '1. Privacy Policy & Notice' },
              { id: 'sec-2', label: '2. Registration Notice' },
              { id: 'sec-3', label: '3. Cookie & Local Storage' },
              { id: 'sec-4', label: '4. Retention & Deletion' },
              { id: 'sec-5', label: '5. Security Practices' },
              { id: 'sec-6', label: '6. User Rights Procedure' },
              { id: 'sec-7', label: '7. Acceptable Use Policy' },
              { id: 'sec-8', label: '8. Third-Party Processors' },
              { id: 'sec-9', label: '9. Breach Response' },
              { id: 'sec-10', label: '10. Children & Eligibility' },
              { id: 'sec-11', label: '11. Privacy Controls' },
              { id: 'sec-12', label: '12. Admin Data Access' },
            ].map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                style={{
                  padding: '8px 10px',
                  borderRadius: '6px',
                  background: 'var(--surface-secondary, #F9FAFB)',
                  color: 'var(--text-primary, #1F2937)',
                  border: '1px solid var(--border-subtle, #E5E7EB)',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Section 1: Main Privacy Policy & Data Protection Notice */}
        <section id="sec-1" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
            <div style={iconBoxStyle}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: 0 }}>1. Privacy Policy &amp; Data Protection Notice</h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0' }}>Core Public-Facing Legal Notice under India DPDPA 2023 &amp; Global Data Protection Laws</p>
            </div>
          </div>
          <p style={{ color: 'var(--text-primary, #1F2937)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 16px' }}>
            FR8X Technology Private Limited operates an enterprise B2B platform connecting cargo shippers, freight forwarders, Non-Vessel Operating Common Carriers (NVOCCs), shipping lines, and logistics professionals. We respect the fundamental digital autonomy of our members and implement strict privacy-by-design principles across every query, API, and storage pipeline.
          </p>

          <h3 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', textTransform: 'uppercase', letterSpacing: '0.04em', margin: '0 0 10px' }}>
            Comprehensive Data Category &amp; Processing Matrix
          </h3>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-secondary, #F9FAFB)', borderBottom: '1px solid var(--border-default, #D9DEE5)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Data Category</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Specific Data Elements</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Purpose &amp; Lawful Basis</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Visibility &amp; Sharing</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Statutory Retention</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Account &amp; Corporate Identity</td>
                  <td style={{ padding: '10px 12px' }}>First name, last name, corporate email, mobile number, ISD code, designation, department</td>
                  <td style={{ padding: '10px 12px' }}>Contractual performance, authentication, One User One Login enforcement</td>
                  <td style={{ padding: '10px 12px' }}>Name &amp; company public in directory; email/phone restricted until connection accepted</td>
                  <td style={{ padding: '10px 12px' }}>Account duration + 180 days post-closure</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Corporate &amp; KYC Records</td>
                  <td style={{ padding: '10px 12px' }}>Company name, CIN, GSTIN, PAN, IEC, MTO registration numbers, business address</td>
                  <td style={{ padding: '10px 12px' }}>Statutory compliance (Customs Act 1962, GST Act, PMLA), anti-fraud verification</td>
                  <td style={{ padding: '10px 12px' }}>Verified business badges public; underlying tax documents restricted to verified counterparties</td>
                  <td style={{ padding: '10px 12px' }}>7 Years (Mandatory statutory accounting/customs audit rule)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Freight Inquiry &amp; Auction Data</td>
                  <td style={{ padding: '10px 12px' }}>Origin/destination ports, container type (FCL/LCL), commodity, quotation values, bill of lading references</td>
                  <td style={{ padding: '10px 12px' }}>Marketplace operations, rate benchmarking, auction contract facilitation</td>
                  <td style={{ padding: '10px 12px' }}>Anonymized/aggregate rates published; specific shipment details visible only to auction participants</td>
                  <td style={{ padding: '10px 12px' }}>7 Years (Commercial contract limitation &amp; DGFT requirement)</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Messages &amp; Communications</td>
                  <td style={{ padding: '10px 12px' }}>Direct message text, quotation notes, trade negotiation attachments</td>
                  <td style={{ padding: '10px 12px' }}>Facilitating commercial logistics contracts between connected counterparties</td>
                  <td style={{ padding: '10px 12px' }}>Strictly private to participants of accepted connections; RLS enforced</td>
                  <td style={{ padding: '10px 12px' }}>Retained while connection active; purged 90 days after mutual deletion</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px', fontWeight: 600 }}>Security &amp; Audit Logs</td>
                  <td style={{ padding: '10px 12px' }}>Hashed session tokens, IP address, user-agent, authentication timestamps, incident logs</td>
                  <td style={{ padding: '10px 12px' }}>Legitimate security interest, CERT-In compliance (Cyber Security Directions 2022)</td>
                  <td style={{ padding: '10px 12px' }}>Confidential internal security stream; strictly PII-redacted</td>
                  <td style={{ padding: '10px 12px' }}>180 Days (CERT-In statutory mandate for ICT logs)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Registration Privacy Notice */}
        <section id="sec-2" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBoxStyle}>
              <UserCheck size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: 0 }}>2. Registration Privacy Notice</h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0' }}>Presented during corporate account onboarding and profile provisioning</p>
            </div>
          </div>
          <p style={{ color: 'var(--text-primary, #1F2937)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 10px' }}>
            When you register on FR8X, you are establishing a verified corporate membership. We require a valid corporate business email, designation, and company identity to prevent unauthorized commercial impersonation.
          </p>
          <ul style={{ paddingLeft: '20px', fontSize: '12.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.6, margin: 0 }}>
            <li><strong style={{ color: 'var(--text-primary, #1F2937)' }}>Mandatory Fields:</strong> Corporate email, full name, mobile number, company name, designation, city, and country are required to create an active profile.</li>
            <li><strong style={{ color: 'var(--text-primary, #1F2937)' }}>Optional Fields:</strong> Bio, profile avatar, statutory identifiers (GSTIN, IEC, PAN) may be furnished at registration or completed subsequently during KYC tier verification.</li>
            <li><strong style={{ color: 'var(--text-primary, #1F2937)' }}>Contractual Agreement:</strong> Account registration concludes with mandatory digital acceptance of the <Link href="https://con.fr8x.in/terms" style={{ color: 'var(--accent-primary, #006B68)', fontWeight: 600, textDecoration: 'underline' }}>FR8X Master Terms of Service</Link>.</li>
          </ul>
        </section>

        {/* Section 3: Cookie & Local Storage Policy */}
        <section id="sec-3" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBoxStyle}>
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: 0 }}>3. Cookie &amp; Similar Technologies Policy</h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0' }}>Audit of browser storage, sessions, and telemetry</p>
            </div>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-primary, #1F2937)', lineHeight: 1.6, margin: '0 0 12px' }}>
            FR8X does not use third-party behavioral advertising cookies, cross-site trackers, or data-broker pixels. We utilize only essential and functional state technologies:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
            <div style={{ border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', padding: '12px', background: 'var(--surface-secondary, #F9FAFB)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary, #1F2937)', marginBottom: '4px', fontSize: '12.5px' }}>Supabase Auth Session</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.45 }}>Secure, HttpOnly, SameSite=Lax JWT token cookies used exclusively to maintain authenticated platform sessions.</div>
            </div>
            <div style={{ border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', padding: '12px', background: 'var(--surface-secondary, #F9FAFB)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary, #1F2937)', marginBottom: '4px', fontSize: '12.5px' }}>Local Storage (Client State)</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.45 }}>Stores UI preferences (sidebar collapse, dark/light theme, search filters, and client-side audit metadata).</div>
            </div>
            <div style={{ border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', padding: '12px', background: 'var(--surface-secondary, #F9FAFB)' }}>
              <div style={{ fontWeight: 700, color: 'var(--text-primary, #1F2937)', marginBottom: '4px', fontSize: '12.5px' }}>IndexedDB Cache</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.45 }}>Local offline cache for active quotation drafts and trade directory records to improve response latency.</div>
            </div>
          </div>
        </section>

        {/* Section 4: Data Retention & Deletion Policy */}
        <section id="sec-4" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBoxStyle}>
              <Trash2 size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: 0 }}>4. Data Retention &amp; Deletion Policy</h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0' }}>Statutory holding schedules and verified account purge workflows</p>
            </div>
          </div>
          <p style={{ color: 'var(--text-primary, #1F2937)', fontSize: '13px', lineHeight: 1.6, margin: '0 0 12px' }}>
            FR8X does not retain personal or commercial data indefinitely. We adhere strictly to statutory retention boundaries governed by applicable Indian commercial and international trade legislation:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12.5px', color: 'var(--text-secondary, #64748B)' }}>
            <div style={{ padding: '12px', borderLeft: '4px solid var(--accent-primary, #006B68)', background: 'var(--surface-secondary, #F9FAFB)', borderRadius: '0 8px 8px 0', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
              <strong style={{ color: 'var(--text-primary, #1F2937)' }}>Statutory Tax &amp; Customs Records (7 Years):</strong> Invoices, shipping orders, bills of lading references, and GSTN/PAN records are preserved for 7 years pursuant to Section 36 of the Central Goods and Services Tax Act 2017 and Section 43 of the Indian Customs Act 1962.
            </div>
            <div style={{ padding: '12px', borderLeft: '4px solid #d97706', background: 'var(--surface-secondary, #F9FAFB)', borderRadius: '0 8px 8px 0', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
              <strong style={{ color: 'var(--text-primary, #1F2937)' }}>Cybersecurity Logs (180 Days):</strong> In compliance with CERT-In directions under Section 70B of the Information Technology Act 2000, system access and authentication logs are retained for 180 days before automated cryptographic sanitization.
            </div>
            <div style={{ padding: '12px', borderLeft: '4px solid #059669', background: 'var(--surface-secondary, #F9FAFB)', borderRadius: '0 8px 8px 0', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
              <strong style={{ color: 'var(--text-primary, #1F2937)' }}>Account Deletion Workflow:</strong> Members may initiate account closure via Settings or by submitting an authenticated request to <code>privacy@fr8x.in</code>. Personal profile fields, avatars, and direct messaging records are purged within 30 days of verification, subject to mandatory statutory tax preservation.
            </div>
          </div>
        </section>

        {/* Section 5: Information Security & Data Protection Practices */}
        <section id="sec-5" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBoxStyle}>
              <Lock size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: 0 }}>5. Information Security &amp; Data Protection Practices</h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0' }}>Technical, organizational, and architectural safeguards</p>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '12.5px' }}>
            <div style={{ border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', padding: '14px', background: 'var(--surface-secondary, #F9FAFB)' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheck size={15} style={{ color: '#059669' }} /> Encryption in Transit &amp; At Rest
              </h4>
              <p style={{ color: 'var(--text-secondary, #64748B)', lineHeight: 1.5, margin: 0 }}>
                All client-server communications are enforced over TLS 1.3 with HSTS enabled. PostgreSQL databases and storage buckets enforce AES-256 at-rest encryption. One-time passcodes and sensitive authentication secrets use PBKDF2 with SHA-256 derivation.
              </p>
            </div>
            <div style={{ border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', padding: '14px', background: 'var(--surface-secondary, #F9FAFB)' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Server size={15} style={{ color: 'var(--accent-primary, #006B68)' }} /> PostgreSQL Row-Level Security (RLS)
              </h4>
              <p style={{ color: 'var(--text-secondary, #64748B)', lineHeight: 1.5, margin: 0 }}>
                Every sensitive data table enforces PostgreSQL Row Level Security. Data isolation is verified at the database query engine level, preventing cross-tenant leakage or parameter tampering even in the event of an API proxy misconfiguration.
              </p>
            </div>
            <div style={{ border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', padding: '14px', background: 'var(--surface-secondary, #F9FAFB)' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={15} style={{ color: '#d97706' }} /> Quarantine &amp; Upload Scanning
              </h4>
              <p style={{ color: 'var(--text-secondary, #64748B)', lineHeight: 1.5, margin: 0 }}>
                Uploaded files are initially placed into an isolated quarantine zone (<code>PENDING_SCAN</code>). File bytes are inspected for magic signatures and scanned for malware before being marked <code>CLEAN</code> and accessible.
              </p>
            </div>
            <div style={{ border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', padding: '14px', background: 'var(--surface-secondary, #F9FAFB)' }}>
              <h4 style={{ fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Eye size={15} style={{ color: '#7c3aed' }} /> Zero-Leakage PII Redaction
              </h4>
              <p style={{ color: 'var(--text-secondary, #64748B)', lineHeight: 1.5, margin: 0 }}>
                Application telemetry and log streams automatically mask PAN, GSTIN, passwords, tokens, and email addresses prior to log persistence, preventing exposure of credentials in monitoring sinks.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: User Rights & Privacy Request Procedure */}
        <section id="sec-6" style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBoxStyle}>
              <HelpCircle size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: 0 }}>6. User Rights &amp; Privacy Request Procedure</h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0' }}>Statutory data principal rights under Section 11–14 of DPDPA 2023</p>
            </div>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-primary, #1F2937)', lineHeight: 1.6, margin: '0 0 12px' }}>
            As a Data Principal under the Digital Personal Data Protection Act 2023, you have enforceable legal rights regarding your personal information:
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '12px', color: 'var(--text-secondary, #64748B)', marginBottom: '12px' }}>
            <div style={{ padding: '12px', background: 'var(--surface-secondary, #F9FAFB)', borderRadius: '6px', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
              <strong style={{ color: 'var(--text-primary, #1F2937)' }}>Right to Access Summary:</strong> Request an auditable summary of personal data processed, identities of data fiduciaries/processors, and categories of data shared.
            </div>
            <div style={{ padding: '12px', background: 'var(--surface-secondary, #F9FAFB)', borderRadius: '6px', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
              <strong style={{ color: 'var(--text-primary, #1F2937)' }}>Right to Correction &amp; Erasure:</strong> Rectify inaccurate personal data or request deletion of data that has completed its designated statutory processing purpose.
            </div>
            <div style={{ padding: '12px', background: 'var(--surface-secondary, #F9FAFB)', borderRadius: '6px', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
              <strong style={{ color: 'var(--text-primary, #1F2937)' }}>Right of Grievance Redressal:</strong> Dedicated redressal mechanism through our appointed Data Protection Grievance Officer with a 72-hour acknowledgment window.
            </div>
            <div style={{ padding: '12px', background: 'var(--surface-secondary, #F9FAFB)', borderRadius: '6px', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
              <strong style={{ color: 'var(--text-primary, #1F2937)' }}>Right to Nominate:</strong> Designate a lawful representative to exercise rights on your behalf in the event of death or incapacity.
            </div>
          </div>
          <div style={{ padding: '14px', background: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', fontSize: '12px', color: 'var(--text-primary, #1F2937)', lineHeight: 1.55 }}>
            <strong>Official Privacy Contact &amp; Grievance Office:</strong><br />
            Attn: Data Protection Officer / Grievance Officer<br />
            FR8X Technology Private Limited, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051, India.<br />
            Direct Privacy Email: <code>privacy@fr8x.in</code> | Platform Support: <code>support@fr8x.in</code>
          </div>
        </section>

        {/* Section 7 to 12: Policies 7–12 */}
        <section id="sec-7" style={{ ...cardStyle, display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px' }}>7. User-Generated Content &amp; Acceptable Use Policy</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.55, margin: 0 }}>
              Users may not upload defamatory, deceptive, malicious, or unverified commercial rate content. Automated scraping, vulnerability scanning without authorization, multi-accounting, and rate manipulation are strictly prohibited and result in immediate account termination.
            </p>
          </div>

          <div id="sec-8" style={{ borderTop: '1px solid var(--border-subtle, #E5E7EB)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px' }}>8. Third-Party Processors &amp; Data Sharing Disclosures</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.55, margin: '0 0 8px' }}>
              We work only with vetted SOC-2 / ISO-27001 compliant technical infrastructure providers:
            </p>
            <ul style={{ paddingLeft: '20px', fontSize: '12px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.6, margin: 0 }}>
              <li><strong style={{ color: 'var(--text-primary, #1F2937)' }}>Database &amp; Storage:</strong> Supabase Inc. (AWS Mumbai / Singapore infrastructure with encryption at rest).</li>
              <li><strong style={{ color: 'var(--text-primary, #1F2937)' }}>Hosting &amp; Edge:</strong> Cloudflare, Inc. (Global Edge Workers routing with global TLS termination).</li>
              <li><strong style={{ color: 'var(--text-primary, #1F2937)' }}>Transactional Email:</strong> Resend / Nodemailer relay (Strict DKIM/SPF/DMARC authenticated relays for OTPs and security notices).</li>
            </ul>
          </div>

          <div id="sec-9" style={{ borderTop: '1px solid var(--border-subtle, #E5E7EB)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px' }}>9. Security Incident &amp; Data Breach Response Procedure</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.55, margin: 0 }}>
              In the event of a verified cybersecurity incident affecting digital personal data, FR8X executes its Incident Response Protocol: containment within 1 hour, root-cause forensics, mandatory notification to the <strong style={{ color: 'var(--text-primary, #1F2937)' }}>Data Protection Board of India</strong> and <strong style={{ color: 'var(--text-primary, #1F2937)' }}>CERT-In</strong> within 6 hours as prescribed by law, and proactive notification to affected Data Principals.
            </p>
          </div>

          <div id="sec-10" style={{ borderTop: '1px solid var(--border-subtle, #E5E7EB)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px' }}>10. Children &amp; Age Eligibility Notice</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.55, margin: 0 }}>
              FR8X is an exclusive B2B commercial logistics workspace. Individuals under 18 years of age are not permitted to register or conduct reverse auctions on the platform. We do not knowingly process data of minors.
            </p>
          </div>

          <div id="sec-11" style={{ borderTop: '1px solid var(--border-subtle, #E5E7EB)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px' }}>11. Privacy Settings &amp; Communication Preferences</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.55, margin: 0 }}>
              Members have granular control over presence broadcasts (online/offline indicator), directory searchability, and contact disclosure. Email addresses and mobile phone numbers remain shielded from unconnected members until a connection invitation is mutually accepted.
            </p>
          </div>

          <div id="sec-12" style={{ borderTop: '1px solid var(--border-subtle, #E5E7EB)', paddingTop: '16px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: '0 0 6px' }}>12. Administrator &amp; Internal Data-Access Policy</h3>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.55, margin: 0 }}>
              FR8X personnel access production environments only under strict principle of least privilege, requiring multi-factor authentication, hardware security keys, and time-bound privileged session authorization. All administrator queries are logged to immutable, tamper-evident audit streams.
            </p>
          </div>
        </section>

        {/* Section 13: India DPDPA 2023 & DPDP Rules 2025 Compliance Matrix */}
        <section style={cardStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <div style={iconBoxStyle}>
              <Scale size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', margin: 0 }}>India DPDPA 2023 &amp; DPDP Rules 2025 Compliance Matrix</h2>
              <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', margin: '2px 0 0' }}>Statutory Mapping &amp; Technical Implementation Ledger</p>
            </div>
          </div>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px' }}>
            <table className="table" style={{ width: '100%', textAlign: 'left', fontSize: '12px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--surface-secondary, #F9FAFB)', borderBottom: '1px solid var(--border-default, #D9DEE5)' }}>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Statutory Clause</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Legal Requirement</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>FR8X Implementation Status</th>
                  <th style={{ padding: '10px 12px', fontWeight: 700 }}>Technical Verification Proof</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Section 5(1) DPDPA</td>
                  <td style={{ padding: '10px 12px' }}>Notice accompanying or preceding consent request with clear itemized purposes</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#059669', fontWeight: 600 }}>Fully Enforced</span></td>
                  <td style={{ padding: '10px 12px' }}>Registration flow renders itemized notice prior to submission with unbundled checkbox</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Section 6 DPDPA</td>
                  <td style={{ padding: '10px 12px' }}>Consent must be free, specific, informed, unconditional, and unambiguous with clear affirmative action</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#059669', fontWeight: 600 }}>Fully Enforced</span></td>
                  <td style={{ padding: '10px 12px' }}>Unchecked checkbox required; submit button gated with <code>disabled=&#123;!termsAccepted&#125;</code></td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Section 8(4) DPDPA</td>
                  <td style={{ padding: '10px 12px' }}>Reasonable security safeguards to prevent personal data breach</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#059669', fontWeight: 600 }}>Fully Enforced</span></td>
                  <td style={{ padding: '10px 12px' }}>PostgreSQL RLS on all tables, TLS 1.3 transit, AES-256 storage, file quarantine scanner</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Section 8(6) DPDPA</td>
                  <td style={{ padding: '10px 12px' }}>Mandatory reporting of personal data breach to Data Protection Board and affected users</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border-default, #D9DEE5)', color: 'var(--accent-primary, #006B68)', fontWeight: 600 }}>Operational SOP</span></td>
                  <td style={{ padding: '10px 12px' }}>Breach Response Procedure codified with 6-hour CERT-In / DPB reporting escalation SLA</td>
                </tr>
                <tr style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Section 8(7) DPDPA</td>
                  <td style={{ padding: '10px 12px' }}>Erase personal data upon purpose completion unless retention required by law</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#059669', fontWeight: 600 }}>Fully Enforced</span></td>
                  <td style={{ padding: '10px 12px' }}>Account purge automated; statutory 7-year records segregated into read-only tax archive</td>
                </tr>
                <tr>
                  <td style={{ padding: '10px 12px', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>Section 13 DPDPA</td>
                  <td style={{ padding: '10px 12px' }}>Appoint Grievance Officer with published contact details and redressal timeline</td>
                  <td style={{ padding: '10px 12px' }}><span style={{ padding: '2px 8px', borderRadius: '4px', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.35)', color: '#059669', fontWeight: 600 }}>Fully Enforced</span></td>
                  <td style={{ padding: '10px 12px' }}>Official email <code>privacy@fr8x.in</code> published with 72-hour acknowledgment commitment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Legal Disclaimer & Master Terms Link */}
        <div
          style={{
            background: 'var(--surface-secondary, #F9FAFB)',
            border: '1px solid var(--border-subtle, #E5E7EB)',
            borderRadius: '10px',
            padding: '20px',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--text-secondary, #64748B)',
          }}
        >
          <p style={{ margin: '0 0 8px' }}>
            These documents represent the active data governance policy of <strong style={{ color: 'var(--text-primary, #1F2937)' }}>FR8X Technology Private Limited</strong>.
            Commercial membership terms, auction rules, and liability limitations are independently governed by the{' '}
            <Link href="https://con.fr8x.in/terms" style={{ color: 'var(--accent-primary, #006B68)', fontWeight: 700, textDecoration: 'underline' }}>
              Master Terms of Service &amp; Commercial Agreement
            </Link>.
          </p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary, #64748B)', margin: 0 }}>
            FR8X Corporate Registry: Mumbai, MH, India · DPDPA Registration Readiness: Compliant · Document SHA: 8f9b2c3d4e · 2026
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
