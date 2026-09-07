import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy & Android Data Safety | FR8X Global Freight Workspace',
  description:
    'FR8X Enterprise Privacy Policy and Google Play Data Safety Disclosures regarding personal information, permissions, location, camera, and data deletion rights.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'September 5, 2026';

  return (
    <div className="min-h-screen bg-[#070d18] text-slate-200 font-sans antialiased selection:bg-cyan-500 selection:text-white">
      {/* Background radial glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Navigation Header */}
      <header className="relative z-10 border-b border-slate-800/80 bg-[#070d18]/80 backdrop-blur-md sticky top-0 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 p-0.5 shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
              <div className="w-full h-full bg-[#070d18] rounded-[10px] flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
                  <path d="m3.3 7 8.7 5 8.7-5"/>
                  <path d="M12 22V12"/>
                </svg>
              </div>
            </div>
            <span className="font-extrabold text-xl tracking-tight text-white">
              FR8<span className="text-cyan-400">X</span>
            </span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 hidden sm:inline-block">
              ENTERPRISE LEGAL
            </span>
          </Link>

          <div className="flex items-center gap-4 text-sm">
            <Link
              href="/"
              className="text-slate-400 hover:text-white transition-colors flex items-center gap-1 font-medium"
            >
              ← Back to App
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 py-12 md:py-16">
        {/* Document Header */}
        <div className="mb-12 border-b border-slate-800 pb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            Google Play & Android Policy Compliant
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
            Privacy Policy &amp; Data Safety Disclosures
          </h1>
          <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
            Effective Date: <strong>September 5, 2026</strong> | Applicable to FR8X Web Workspace (<code>con.fr8x.in</code>) and FR8X Android Mobile App (<code>com.fr8x.app</code>).
          </p>
        </div>

        {/* Section 1: Introduction */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-sm font-black border border-cyan-500/20">1</span>
            Introduction &amp; Scope
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm mb-3">
            FR8X Global Freight Workspace (&quot;FR8X&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) operates international freight reverse auction platforms, container booking workflows, and logistics intelligence solutions. We are dedicated to protecting your privacy and ensuring maximum transparency regarding how personal and operational freight data is collected, processed, and safeguarded.
          </p>
          <p className="text-slate-300 leading-relaxed text-sm">
            This policy applies to all users of our Android mobile application (<strong>FR8X Mobile</strong>, package: <code>com.fr8x.app</code>) and web workspace (<code>https://con.fr8x.in</code>). It fulfills requirements under the <strong>Google Play Developer Policy</strong>, the <strong>Information Technology (SPDI) Rules (India)</strong>, and international data protection standards.
          </p>
        </section>

        {/* Section 2: Data Safety Disclosures */}
        <section className="mb-10 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 sm:p-8 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Google Play Data Safety Section Summary</h2>
              <p className="text-xs text-slate-400">Summary table of collected data categories and declared purpose</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm text-slate-300">
              <thead className="bg-slate-800/70 text-slate-200 uppercase font-bold text-[11px] tracking-wider border-b border-slate-700">
                <tr>
                  <th className="py-3 px-4">Data Type</th>
                  <th className="py-3 px-4">Collected / Shared</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Encrypted in Transit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Name &amp; Corporate Email</td>
                  <td className="py-3 px-4 text-emerald-400">Collected</td>
                  <td className="py-3 px-4">Account registration, MFA, OTP verification, security alerts</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono">Yes (TLS 1.3)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Approximate &amp; Precise Location</td>
                  <td className="py-3 px-4 text-emerald-400">Collected (Optional)</td>
                  <td className="py-3 px-4">Port proximity identification, nearest CFS geocoding, route corridors</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono">Yes (TLS 1.3)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Photos &amp; Documents</td>
                  <td className="py-3 px-4 text-emerald-400">Collected (On-Demand)</td>
                  <td className="py-3 px-4">KYC verification (GSTIN, IEC), Bill of Lading (BL), customs documents</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono">Yes (TLS 1.3)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">App Activity &amp; Bid History</td>
                  <td className="py-3 px-4 text-emerald-400">Collected</td>
                  <td className="py-3 px-4">Reverse auction rate submissions, trade chat negotiation, audit logging</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono">Yes (TLS 1.3)</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold text-white">Device &amp; Network IDs</td>
                  <td className="py-3 px-4 text-emerald-400">Collected</td>
                  <td className="py-3 px-4">Anti-fraud protection, multi-factor lockouts, session authentication</td>
                  <td className="py-3 px-4 text-emerald-400 font-mono">Yes (TLS 1.3)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 text-xs text-slate-400 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span><strong>No Sale of Data:</strong> FR8X never sells or monetizes personal or operational freight data to advertisers or third-party brokers.</span>
          </div>
        </section>

        {/* Section 3: Android Device Permissions */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-sm font-black border border-cyan-500/20">3</span>
            Android OS Permissions Declared &amp; Justification
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm mb-4">
            Under Android 14 (API 34) and Android 13 (API 33) standards, our mobile application only requests permissions strictly required for enterprise shipping operations:
          </p>

          <div className="grid sm:grid-cols-2 gap-4 text-sm">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-white flex items-center gap-2 mb-1">
                <span className="text-cyan-400">🔔</span>
                <code>POST_NOTIFICATIONS</code>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Required on Android 13+ to alert forwarders and cargo owners about active reverse auction counter-bids, spot rate approvals, container status alerts, and security OTP notifications.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-white flex items-center gap-2 mb-1">
                <span className="text-cyan-400">📷</span>
                <code>CAMERA</code> &amp; Media Access
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Utilized exclusively when you capture or upload shipping documentation (Bill of Lading, container seal photos, damage surveys, IEC &amp; GSTIN certificates). We support Android 14 Granular Photo Picker.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-white flex items-center gap-2 mb-1">
                <span className="text-cyan-400">📍</span>
                <code>ACCESS_FINE_LOCATION</code>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Used to identify the nearest dry port, Inland Container Depot (ICD), or maritime gateway (e.g., INNSA, INMUN, INPAV) when initiating a freight spot quote. Can be disabled in OS settings.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <div className="font-bold text-white flex items-center gap-2 mb-1">
                <span className="text-cyan-400">🌐</span>
                <code>INTERNET</code> &amp; Network State
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Required for real-time TLS 1.3 synchronized trade chat, live reverse auction countdown clocks, and authenticated REST API communication with FR8X servers.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Third-Party Service Providers */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-sm font-black border border-cyan-500/20">4</span>
            Third-Party Sub-Processors &amp; Infrastructure
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm mb-4">
            We partner with enterprise cloud providers bound by strict confidentiality and data protection agreements:
          </p>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <div>
                <strong className="text-white">Zoho Corporation (ZeptoMail &amp; Zoho Mail SMTP):</strong>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Used as our central server-side transactional email dispatcher for one-time passwords (OTP), password resets, and account security notifications from <code>password@fr8x.in</code>.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80">
              <span className="text-emerald-400 font-bold shrink-0">✓</span>
              <div>
                <strong className="text-white">Google Cloud Platform &amp; Firebase:</strong>
                <span className="text-xs text-slate-400 block mt-0.5">
                  Cloud hosting, encrypted Firestore storage, and secure authentication tokens. Data centers located in compliant regional infrastructure.
                </span>
              </div>
            </li>
          </ul>
        </section>

        {/* Section 5: Account & Data Deletion (Google Play Mandated) */}
        <section className="mb-10 bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/20 border border-rose-500/20 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Account and Data Deletion Policy</h2>
              <p className="text-xs text-rose-300">Mandated by Google Play User Data &amp; Account Deletion Policies</p>
            </div>
          </div>

          <p className="text-slate-300 leading-relaxed text-sm mb-4">
            As a registered user of FR8X, you have the absolute right to request the permanent deletion of your account and all associated personal data at any time, both from within the mobile app and via our public web portal.
          </p>

          <div className="p-4 rounded-xl bg-black/40 border border-slate-800 text-xs text-slate-300 space-y-2 mb-5">
            <div className="font-semibold text-white">What data is deleted:</div>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li>Personal identity: User ID, name, email address, password hashes, and salts.</li>
              <li>Authentication records: Active session tokens, biometrics cache, and OTP history.</li>
              <li>Uploaded personal documents and profile avatars.</li>
            </ul>
            <div className="font-semibold text-white pt-2">What data may be retained for statutory compliance:</div>
            <p className="text-slate-400">
              Executed shipping contracts, invoices, and statutory tax records (GST / Customs filings) may be retained for the minimum statutory period required by maritime commercial law and Indian financial regulations (typically 5 to 7 years), after which they are purged.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="mailto:tech@fr8x.in?subject=Request%20Account%20and%20Data%20Deletion%20-%20FR8X&body=Please%20delete%20my%20FR8X%20account%20and%20associated%20personal%20data.%0A%0ARegistered%20Email%20Address:%20%0AUser%20ID%20or%20Company%20Name:%20%0AReason%20for%20deletion%20(optional):%20"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-600/20"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Submit Deletion Request via Email (tech@fr8x.in)
            </a>
            <span className="text-xs text-slate-500">
              Requests are validated and fulfilled within 7 business days.
            </span>
          </div>
        </section>

        {/* Section 6: Security & Encryption */}
        <section className="mb-10">
          <h2 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-sm font-black border border-cyan-500/20">6</span>
            Data Security &amp; Encryption Standards
          </h2>
          <p className="text-slate-300 leading-relaxed text-sm mb-3">
            FR8X utilizes bank-grade security protocols:
          </p>
          <ul className="grid sm:grid-cols-3 gap-3 text-xs">
            <li className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-cyan-400 block mb-1">In-Transit Security</strong>
              All API requests enforce Transport Layer Security (TLS 1.3 / TLS 1.2) with strict certificate pinning.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-cyan-400 block mb-1">At-Rest Encryption</strong>
              Enterprise KMS encryption (AES-256) protects stored freight bids and commercial profiles.
            </li>
            <li className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
              <strong className="text-cyan-400 block mb-1">Zero-Plaintext Auth</strong>
              Passcodes and OTPs are salted and hashed using PBKDF2/SHA-256; credentials are never stored in plain text.
            </li>
          </ul>
        </section>

        {/* Section 7: Contact Information */}
        <section className="border-t border-slate-800 pt-8 mt-12">
          <h2 className="text-xl font-bold text-white mb-2">Data Protection Officer &amp; Contact</h2>
          <p className="text-slate-400 text-xs sm:text-sm mb-4">
            If you have questions, feedback, or grievance redressal requests regarding this Privacy Policy or Google Play compliance:
          </p>
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs sm:text-sm text-slate-300 space-y-1.5 font-mono">
            <div><strong>Entity:</strong> FR8X Global Freight Workspace</div>
            <div><strong>Data Protection Officer:</strong> Technical &amp; Compliance Team</div>
            <div><strong>Security Email:</strong> <a href="mailto:tech@fr8x.in" className="text-cyan-400 hover:underline">tech@fr8x.in</a></div>
            <div><strong>Support Desk:</strong> <a href="mailto:support@fr8x.in" className="text-cyan-400 hover:underline">support@fr8x.in</a></div>
            <div><strong>Headquarters:</strong> Mumbai, Maharashtra, India</div>
          </div>
        </section>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-slate-800/60 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} FR8X Enterprise Inc. All rights reserved. &bull; Complies with Google Play Android Policy (API 34+)
        </footer>
      </main>
    </div>
  );
}
