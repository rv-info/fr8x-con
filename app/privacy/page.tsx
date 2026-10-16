import React from 'react';
import Link from 'next/link';
import { buildRouteMetadata } from '@/config/seo';
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
  Globe,
  Trash2,
  HelpCircle,
} from 'lucide-react';

export const metadata = buildRouteMetadata('privacy');

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 16, 2026';
  const policyVersion = 'v4.0.0-PROD';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased font-sans">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 py-3 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group text-decoration-none">
            <img
              src="/logo.png"
              alt="FR8X"
              className="w-8 h-8 object-contain"
            />
            <div className="text-xl font-black text-[#002b66] tracking-wider uppercase">
              FR8X
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <Link
              href="https://con.fr8x.in/terms"
              className="text-[#0284c7] hover:text-[#0369a1] font-semibold transition-colors flex items-center gap-1"
            >
              <Scale className="w-4 h-4" /> Master Terms of Service
            </Link>
            <Link
              href="/"
              className="text-slate-600 hover:text-slate-900 font-semibold transition-colors"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-white to-slate-100 border-b border-slate-200 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-[#002b66] text-xs font-bold uppercase tracking-wider mb-4">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            DPDPA 2023 &amp; DPDP Rules 2025 Verified Compliance Architecture
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight mb-4">
            FR8X Comprehensive Privacy Documentation &amp; Data Governance System
          </h1>
          <p className="text-slate-600 text-sm sm:text-base max-w-3xl leading-relaxed">
            Legal Entity: <strong>FR8X Technology Private Limited</strong> (Mumbai, Maharashtra, India).
            Effective Date: <strong>{lastUpdated}</strong> | Document Version: <strong>{policyVersion}</strong>.
            Governs the <code>con.fr8x.in</code> web application, Android ecosystem (<code>com.fr8x.app</code>), and associated freight APIs.
          </p>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-12">
        {/* Policy Section Navigation Quick Links */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
            Policy Navigation Directory (12 Statutory Governance Documents)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 text-xs">
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
                className="p-2 rounded bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-[#002b66] border border-slate-200 font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        {/* Section 1: Main Privacy Policy & Data Protection Notice */}
        <section id="sec-1" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#002b66]">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">1. Privacy Policy &amp; Data Protection Notice</h2>
              <p className="text-xs text-slate-500">Core Public-Facing Legal Notice under India DPDPA 2023 &amp; Global Data Protection Laws</p>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed mb-4">
            FR8X Technology Private Limited operates an enterprise B2B platform connecting cargo shippers, freight forwarders, Non-Vessel Operating Common Carriers (NVOCCs), shipping lines, and logistics professionals. We respect the fundamental digital autonomy of our members and implement strict privacy-by-design principles across every query, API, and storage pipeline.
          </p>

          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-3">Comprehensive Data Category &amp; Processing Matrix</h3>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Data Category</th>
                  <th className="py-3 px-4">Specific Data Elements</th>
                  <th className="py-3 px-4">Purpose &amp; Lawful Basis</th>
                  <th className="py-3 px-4">Visibility &amp; Sharing</th>
                  <th className="py-3 px-4">Statutory Retention</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Account &amp; Corporate Identity</td>
                  <td className="py-3 px-4">First name, last name, corporate email, mobile number, ISD code, designation, department</td>
                  <td className="py-3 px-4">Contractual performance, authentication, One User One Login enforcement</td>
                  <td className="py-3 px-4">Name &amp; company public in directory; email/phone restricted until connection accepted</td>
                  <td className="py-3 px-4">Account duration + 180 days post-closure</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Corporate &amp; KYC Records</td>
                  <td className="py-3 px-4">Company name, CIN, GSTIN, PAN, IEC, MTO registration numbers, business address</td>
                  <td className="py-3 px-4">Statutory compliance (Customs Act 1962, GST Act, PMLA), anti-fraud verification</td>
                  <td className="py-3 px-4">Verified business badges public; underlying tax documents restricted to verified counterparties</td>
                  <td className="py-3 px-4">7 Years (Mandatory statutory accounting/customs audit rule)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Freight Inquiry &amp; Auction Data</td>
                  <td className="py-3 px-4">Origin/destination ports, container type (FCL/LCL), commodity, quotation values, bill of lading references</td>
                  <td className="py-3 px-4">Marketplace operations, rate benchmarking, auction contract facilitation</td>
                  <td className="py-3 px-4">Anonymized/aggregate rates published; specific shipment details visible only to auction participants</td>
                  <td className="py-3 px-4">7 Years (Commercial contract limitation &amp; DGFT requirement)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Messages &amp; Communications</td>
                  <td className="py-3 px-4">Direct message text, quotation notes, trade negotiation attachments</td>
                  <td className="py-3 px-4">Facilitating commercial logistics contracts between connected counterparties</td>
                  <td className="py-3 px-4">Strictly private to participants of accepted connections; RLS enforced</td>
                  <td className="py-3 px-4">Retained while connection active; purged 90 days after mutual deletion</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-slate-900">Security &amp; Audit Logs</td>
                  <td className="py-3 px-4">Hashed session tokens, IP address, user-agent, authentication timestamps, incident logs</td>
                  <td className="py-3 px-4">Legitimate security interest, CERT-In compliance (Cyber Security Directions 2022)</td>
                  <td className="py-3 px-4">Confidential internal security stream; strictly PII-redacted</td>
                  <td className="py-3 px-4">180 Days (CERT-In statutory mandate for ICT logs)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 2: Registration Privacy Notice */}
        <section id="sec-2" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#002b66]">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">2. Registration Privacy Notice</h2>
              <p className="text-xs text-slate-500">Presented during corporate account onboarding and profile provisioning</p>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed mb-3">
            When you register on FR8X, you are establishing a verified corporate membership. We require a valid corporate business email, designation, and company identity to prevent unauthorized commercial impersonation.
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 space-y-2">
            <li><strong>Mandatory Fields:</strong> Corporate email, full name, mobile number, company name, designation, city, and country are required to create an active profile.</li>
            <li><strong>Optional Fields:</strong> Bio, profile avatar, statutory identifiers (GSTIN, IEC, PAN) may be furnished at registration or completed subsequently during KYC tier verification.</li>
            <li><strong>Contractual Agreement:</strong> Account registration concludes with mandatory digital acceptance of the <Link href="https://con.fr8x.in/terms" className="text-[#0284c7] font-semibold underline">FR8X Master Terms of Service</Link>.</li>
          </ul>
        </section>

        {/* Section 3: Cookie & Local Storage Policy */}
        <section id="sec-3" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#002b66]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">3. Cookie &amp; Similar Technologies Policy</h2>
              <p className="text-xs text-slate-500">Audit of browser storage, sessions, and telemetry</p>
            </div>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700">
            <p>
              FR8X does not use third-party behavioral advertising cookies, cross-site trackers, or data-broker pixels. We utilize only essential and functional state technologies:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="font-bold text-slate-900 mb-1">Supabase Auth Session</div>
                <div className="text-xs text-slate-600">Secure, HttpOnly, SameSite=Lax JWT token cookies used exclusively to maintain authenticated platform sessions.</div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="font-bold text-slate-900 mb-1">Local Storage (Client State)</div>
                <div className="text-xs text-slate-600">Stores UI preferences (sidebar collapse, dark/light theme, search filters, and client-side audit metadata).</div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="font-bold text-slate-900 mb-1">IndexedDB Cache</div>
                <div className="text-xs text-slate-600">Local offline cache for active quotation drafts and trade directory records to improve response latency.</div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Data Retention & Deletion Policy */}
        <section id="sec-4" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#002b66]">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">4. Data Retention &amp; Deletion Policy</h2>
              <p className="text-xs text-slate-500">Statutory holding schedules and verified account purge workflows</p>
            </div>
          </div>
          <p className="text-slate-700 text-sm leading-relaxed mb-3">
            FR8X does not retain personal or commercial data indefinitely. We adhere strictly to statutory retention boundaries governed by applicable Indian commercial and international trade legislation:
          </p>
          <div className="space-y-3 text-xs sm:text-sm text-slate-600">
            <div className="p-3 border-l-4 border-[#002b66] bg-slate-50 rounded-r-lg">
              <strong className="text-slate-900">Statutory Tax &amp; Customs Records (7 Years):</strong> Invoices, shipping orders, bills of lading references, and GSTN/PAN records are preserved for 7 years pursuant to Section 36 of the Central Goods and Services Tax Act 2017 and Section 43 of the Indian Customs Act 1962.
            </div>
            <div className="p-3 border-l-4 border-amber-500 bg-slate-50 rounded-r-lg">
              <strong className="text-slate-900">Cybersecurity Logs (180 Days):</strong> In compliance with CERT-In directions under Section 70B of the Information Technology Act 2000, system access and authentication logs are retained for 180 days before automated cryptographic sanitization.
            </div>
            <div className="p-3 border-l-4 border-emerald-500 bg-slate-50 rounded-r-lg">
              <strong className="text-slate-900">Account Deletion Workflow:</strong> Members may initiate account closure via Settings or by submitting an authenticated request to <code>privacy@fr8x.in</code>. Personal profile fields, avatars, and direct messaging records are purged within 30 days of verification, subject to mandatory statutory tax preservation.
            </div>
          </div>
        </section>

        {/* Section 5: Information Security & Data Protection Practices */}
        <section id="sec-5" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#002b66]">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">5. Information Security &amp; Data Protection Practices</h2>
              <p className="text-xs text-slate-500">Technical, organizational, and architectural safeguards</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm text-slate-700">
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> Encryption in Transit &amp; At Rest
              </h4>
              <p className="text-slate-600 leading-relaxed">
                All client-server communications are enforced over TLS 1.3 with HSTS enabled. PostgreSQL databases and storage buckets enforce AES-256 at-rest encryption. One-time passcodes and sensitive authentication secrets use PBKDF2 with SHA-256 derivation.
              </p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Server className="w-4 h-4 text-blue-600" /> PostgreSQL Row-Level Security (RLS)
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Every sensitive data table enforces PostgreSQL Row Level Security. Data isolation is verified at the database query engine level, preventing cross-tenant leakage or parameter tampering even in the event of an API proxy misconfiguration.
              </p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Quarantine &amp; Upload Scanning
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Uploaded files are initially placed into an isolated quarantine zone (<code>PENDING_SCAN</code>). File bytes are inspected for magic signatures and scanned for malware before being marked <code>CLEAN</code> and accessible.
              </p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-600" /> Zero-Leakage PII Redaction
              </h4>
              <p className="text-slate-600 leading-relaxed">
                Application telemetry and log streams automatically mask PAN, GSTIN, passwords, tokens, and email addresses prior to log persistence, preventing exposure of credentials in monitoring sinks.
              </p>
            </div>
          </div>
        </section>

        {/* Section 6: User Rights & Privacy Request Procedure */}
        <section id="sec-6" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#002b66]">
              <HelpCircle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">6. User Rights &amp; Privacy Request Procedure</h2>
              <p className="text-xs text-slate-500">Statutory data principal rights under Section 11–14 of DPDPA 2023</p>
            </div>
          </div>
          <div className="space-y-3 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <p>
              As a Data Principal under the Digital Personal Data Protection Act 2023, you have enforceable legal rights regarding your personal information:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <strong>Right to Access Summary:</strong> Request an auditable summary of personal data processed, identities of data fiduciaries/processors, and categories of data shared.
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <strong>Right to Correction &amp; Erasure:</strong> Rectify inaccurate personal data or request deletion of data that has completed its designated statutory processing purpose.
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <strong>Right of Grievance Redressal:</strong> Dedicated redressal mechanism through our appointed Data Protection Grievance Officer with a 72-hour acknowledgment window.
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200">
                <strong>Right to Nominate:</strong> Designate a lawful representative to exercise rights on your behalf in the event of death or incapacity.
              </div>
            </div>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-xs text-[#002b66] mt-3">
              <strong>Official Privacy Contact &amp; Grievance Office:</strong><br />
              Attn: Data Protection Officer / Grievance Officer<br />
              FR8X Technology Private Limited, Bandra Kurla Complex (BKC), Mumbai, Maharashtra 400051, India.<br />
              Direct Privacy Email: <code>privacy@fr8x.in</code> | Platform Support: <code>support@fr8x.in</code>
            </div>
          </div>
        </section>

        {/* Section 7 to 12: Policies 7–12 */}
        <section id="sec-7" className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900 mb-2">7. User-Generated Content &amp; Acceptable Use Policy</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Users may not upload defamatory, deceptive, malicious, or unverified commercial rate content. Automated scraping, vulnerability scanning without authorization, multi-accounting, and rate manipulation are strictly prohibited and result in immediate account termination.
            </p>
          </div>

          <div id="sec-8" className="border-t border-slate-200 pt-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">8. Third-Party Processors &amp; Data Sharing Disclosures</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
              We work only with vetted SOC-2 / ISO-27001 compliant technical infrastructure providers:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li><strong>Database &amp; Storage:</strong> Supabase Inc. (AWS Mumbai / Singapore infrastructure with encryption at rest).</li>
              <li><strong>Hosting &amp; Edge:</strong> Vercel Inc. (Edge serverless routing with global TLS termination).</li>
              <li><strong>Transactional Email:</strong> Resend / Nodemailer relay (Strict DKIM/SPF/DMARC authenticated relays for OTPs and security notices).</li>
            </ul>
          </div>

          <div id="sec-9" className="border-t border-slate-200 pt-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">9. Security Incident &amp; Data Breach Response Procedure</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              In the event of a verified cybersecurity incident affecting digital personal data, FR8X executes its Incident Response Protocol: containment within 1 hour, root-cause forensics, mandatory notification to the <strong>Data Protection Board of India</strong> and <strong>CERT-In</strong> within 6 hours as prescribed by law, and proactive notification to affected Data Principals.
            </p>
          </div>

          <div id="sec-10" className="border-t border-slate-200 pt-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">10. Children &amp; Age Eligibility Notice</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              FR8X is an exclusive B2B commercial logistics workspace. Individuals under 18 years of age are not permitted to register or conduct reverse auctions on the platform. We do not knowingly process data of minors.
            </p>
          </div>

          <div id="sec-11" className="border-t border-slate-200 pt-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">11. Privacy Settings &amp; Communication Preferences</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Members have granular control over presence broadcasts (online/offline indicator), directory searchability, and contact disclosure. Email addresses and mobile phone numbers remain shielded from unconnected members until a connection invitation is mutually accepted.
            </p>
          </div>

          <div id="sec-12" className="border-t border-slate-200 pt-6">
            <h3 className="text-base font-bold text-slate-900 mb-2">12. Administrator &amp; Internal Data-Access Policy</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              FR8X personnel access production environments only under strict principle of least privilege, requiring multi-factor authentication, hardware security keys, and time-bound privileged session authorization. All administrator queries are logged to immutable, tamper-evident audit streams.
            </p>
          </div>
        </section>

        {/* Section 13: India DPDPA 2023 & DPDP Rules 2025 Compliance Matrix */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 text-[#002b66]">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">India DPDPA 2023 &amp; DPDP Rules 2025 Compliance Matrix</h2>
              <p className="text-xs text-slate-500">Statutory Mapping &amp; Technical Implementation Ledger</p>
            </div>
          </div>
          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100 text-slate-900 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Statutory Clause</th>
                  <th className="py-3 px-4">Legal Requirement</th>
                  <th className="py-3 px-4">FR8X Implementation Status</th>
                  <th className="py-3 px-4">Technical Verification Proof</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">Section 5(1) DPDPA</td>
                  <td className="py-3 px-4">Notice accompanying or preceding consent request with clear itemized purposes</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Fully Enforced</span></td>
                  <td className="py-3 px-4">Registration flow renders itemized notice prior to submission with unbundled checkbox</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">Section 6 DPDPA</td>
                  <td className="py-3 px-4">Consent must be free, specific, informed, unconditional, and unambiguous with clear affirmative action</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Fully Enforced</span></td>
                  <td className="py-3 px-4">Unchecked checkbox required; submit button gated with <code>disabled=&#123;!termsAccepted&#125;</code></td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">Section 8(4) DPDPA</td>
                  <td className="py-3 px-4">Reasonable security safeguards to prevent personal data breach</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Fully Enforced</span></td>
                  <td className="py-3 px-4">PostgreSQL RLS on all tables, TLS 1.3 transit, AES-256 storage, file quarantine scanner</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">Section 8(6) DPDPA</td>
                  <td className="py-3 px-4">Mandatory reporting of personal data breach to Data Protection Board and affected users</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-semibold">Operational SOP</span></td>
                  <td className="py-3 px-4">Breach Response Procedure codified with 6-hour CERT-In / DPB reporting escalation SLA</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">Section 8(7) DPDPA</td>
                  <td className="py-3 px-4">Erase personal data upon purpose completion unless retention required by law</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Fully Enforced</span></td>
                  <td className="py-3 px-4">Account purge automated; statutory 7-year records segregated into read-only tax archive</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">Section 13 DPDPA</td>
                  <td className="py-3 px-4">Appoint Grievance Officer with published contact details and redressal timeline</td>
                  <td className="py-3 px-4"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">Fully Enforced</span></td>
                  <td className="py-3 px-4">Official email <code>privacy@fr8x.in</code> published with 72-hour acknowledgment commitment</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Legal Disclaimer & Master Terms Link */}
        <div className="bg-slate-100 border border-slate-200 rounded-xl p-6 text-center text-xs text-slate-600">
          <p className="mb-2">
            These documents represent the active data governance policy of <strong>FR8X Technology Private Limited</strong>.
            Commercial membership terms, auction rules, and liability limitations are independently governed by the{' '}
            <Link href="https://con.fr8x.in/terms" className="text-[#0284c7] font-bold underline">
              Master Terms of Service &amp; Commercial Agreement
            </Link>.
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            FR8X Corporate Registry: Mumbai, MH, India · DPDPA Registration Readiness: Compliant · Document SHA: 8f9b2c3d4e · 2026
          </p>
        </div>
      </main>
    </div>
  );
}
