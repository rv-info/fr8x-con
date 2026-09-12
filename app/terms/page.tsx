'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Scale, Globe, FileText, AlertTriangle, Building2, CreditCard, Lock } from 'lucide-react';

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', padding: '0 0 80px' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        borderBottom: '1px solid #334155',
        padding: '20px 0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(12px)',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/register" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}>
            <ArrowLeft size={16} /> Back to Registration
          </Link>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.03em' }}>
              fr<span style={{ color: '#0ea5e9' }}>8</span>x
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#22c55e', fontSize: '12px', fontWeight: 700 }}>
            <ShieldCheck size={14} /> Legally Binding
          </div>
        </div>
      </div>

      {/* Document */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 24px' }}>
        {/* Title Block */}
        <div style={{
          background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '36px 40px',
          marginBottom: '32px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
            background: 'radial-gradient(circle, rgba(14,165,233,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Scale size={24} color="#fff" />
            </div>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#0ea5e9', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FR8X Enterprise Platform</div>
              <h1 style={{ margin: 0, fontSize: '26px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
                Master Terms of Service & Commercial Agreement
              </h1>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginTop: '20px' }}>
            {[
              { label: 'Effective Date', value: 'September 2026' },
              { label: 'Jurisdiction', value: 'India (Primary) / ICC (Intl)' },
              { label: 'Version', value: 'v3.1 — Enterprise' },
            ].map((item) => (
              <div key={item.label} style={{ background: '#0f172a', borderRadius: '8px', padding: '10px 14px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '3px' }}>{item.label}</div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#e2e8f0' }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Terms Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <TermsSection icon={<FileText size={18} />} title="1. Definitions & Acceptance">
            <p>These Master Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between <strong>FR8X Technology Private Limited</strong> (&ldquo;Company,&rdquo; &ldquo;FR8X,&rdquo; &ldquo;Platform,&rdquo; &ldquo;We,&rdquo; &ldquo;Us&rdquo;) and the registering enterprise entity (&ldquo;Client,&rdquo; &ldquo;User,&rdquo; &ldquo;Member&rdquo;). By clicking &ldquo;Accept&rdquo; or by accessing or using the FR8X Enterprise Logistics Platform, you confirm that:</p>
            <ol>
              <li>You have full legal authority and authorization to bind the corporate entity you represent;</li>
              <li>You are at least 18 years of age and of sound legal capacity;</li>
              <li>Your corporate entity is duly incorporated and in good legal standing in its jurisdiction of registration;</li>
              <li>You have read, understood, and agree to be bound by these Terms in their entirety, including all referenced schedules, policies, and addenda.</li>
            </ol>
            <p>If you do not agree to these Terms, you must click &ldquo;Decline&rdquo; and you will not be permitted to access the Platform.</p>
          </TermsSection>

          <TermsSection icon={<Building2 size={18} />} title="2. Platform Services & Scope">
            <p>FR8X provides a B2B enterprise freight forwarding, reverse auction, and rate management platform. Services include:</p>
            <ul>
              <li><strong>Reverse Auction Engine:</strong> Freight procurement via competitive reverse bidding among licensed freight forwarders and logistics service providers (LSPs);</li>
              <li><strong>Rate Market Intelligence:</strong> Access to indicative market freight rates including FCL, LCL, Air Freight, and multi-modal logistics;</li>
              <li><strong>Trade Document Exchange:</strong> Digital exchange of commercial and shipping documents within the platform ecosystem;</li>
              <li><strong>Vendor Management System:</strong> Curated panel of verified carriers, freight agents, and logistics operators;</li>
              <li><strong>Analytics & Reporting:</strong> Freight spend analytics, route optimization insights, and compliance dashboards.</li>
            </ul>
            <p>FR8X is a <em>marketplace and technology facilitator</em> and does not itself provide freight, logistics, or transportation services. All contracts for the carriage of goods are entered into directly between the Client and the selected service provider.</p>
          </TermsSection>

          <TermsSection icon={<Lock size={18} />} title="3. One User, One Login Policy — Anti-Multi-Accounting">
            <p>FR8X enforces a strict <strong>One User, One Login</strong> policy. Each individual natural person is entitled to maintain only one (1) active registered account across the entire FR8X platform, irrespective of organizational affiliation.</p>
            <ul>
              <li>Registration of multiple accounts by the same individual or using shared/alias email addresses is strictly prohibited;</li>
              <li>Multi-accounting for the purpose of circumventing bid restrictions, plan tier limitations, auction access, or rate intelligence is a material breach of these Terms;</li>
              <li>FR8X reserves the right to permanently suspend and block all accounts found to be associated with multi-accounting, without refund of any fees paid;</li>
              <li>Each corporate entity is entitled to register a designated primary administrator, with additional team members invited via the Admin Panel after verification.</li>
            </ul>
          </TermsSection>

          <TermsSection icon={<CreditCard size={18} />} title="4. Bid Fee Structure & Payment Terms">
            <p>Access to the reverse auction mechanism and rate bid posting is subject to the following commercial terms:</p>
            <ul>
              <li><strong>Trial Plan:</strong> Free access for 2 calendar days. One trial per corporate entity per financial year. Bid posting: ₹300 per bid (USD $4 equivalent);</li>
              <li><strong>Professional Plan:</strong> ₹1,500/month (+GST). Full platform access. Bid posting: ₹300 per bid;</li>
              <li><strong>Premium Plan:</strong> ₹3,000/month (+GST). Golden Verified Tick. Bid posting discounted to ₹180 per bid (40% savings);</li>
              <li>All bid fees are non-refundable once a bid has been submitted and accepted into the auction system;</li>
              <li>Subscription fees are billed monthly in advance and are non-refundable except as required by applicable consumer protection law;</li>
              <li>FR8X reserves the right to revise the fee structure with 30 days&apos; written notice to registered email.</li>
            </ul>
            <p>Payment obligations are governed by the Indian Contract Act 1872, and disputes regarding payment are subject to the jurisdiction of courts in Mumbai, Maharashtra.</p>
          </TermsSection>

          <TermsSection icon={<Globe size={18} />} title="5. International Trade Compliance & Sanctions">
            <p>The FR8X Platform facilitates international freight and trade transactions. All Users are strictly required to comply with all applicable international trade laws and regulations, including but not limited to:</p>
            <ul>
              <li><strong>India:</strong> Foreign Trade Policy (FTP) administered by DGFT; Customs Act 1962; Foreign Exchange Management Act 1999 (FEMA); Prevention of Money Laundering Act 2002 (PMLA); Export Control measures administered by SCOMET;</li>
              <li><strong>International Sanctions:</strong> United Nations Security Council (UNSC) sanctions resolutions; U.S. Office of Foreign Assets Control (OFAC) regulations; EU Council Regulations on restrictive measures; UK Office of Financial Sanctions Implementation (OFSI);</li>
              <li><strong>Anti-Bribery:</strong> Prevention of Corruption Act 1988 (India); UK Bribery Act 2010; U.S. Foreign Corrupt Practices Act (FCPA);</li>
              <li><strong>Export Controls:</strong> Wassenaar Arrangement; Nuclear Suppliers Group (NSG); Australia Group;</li>
              <li><strong>Maritime Regulations:</strong> IMO SOLAS, IMDG Code (for hazardous cargo); ISPS Code;</li>
              <li><strong>Air Freight:</strong> IATA Dangerous Goods Regulations (DGR); ICAO Technical Instructions.</li>
            </ul>
            <p>Users represent and warrant that they are not subject to, nor are transacting with entities subject to, any applicable trade sanctions. FR8X reserves the right to immediately suspend access and report suspicious transactions to the relevant regulatory authorities without prior notice.</p>
          </TermsSection>

          <TermsSection icon={<AlertTriangle size={18} />} title="6. Anti-Fraud, Anti-Money Laundering & KYC">
            <p>FR8X is committed to preventing fraud, money laundering, and terrorist financing. As a condition of registration and continued use:</p>
            <ul>
              <li>All corporate entities must provide accurate KYC documentation including Certificate of Incorporation, PAN/TAN, GSTIN (where applicable), IEC Code, and authorized signatory identification;</li>
              <li>FR8X conducts ongoing due diligence and may request additional documentation at any time;</li>
              <li>False, misleading, or incomplete registration information constitutes fraud and may be reported to law enforcement authorities under applicable IPC sections including Sections 420, 467, 468, 471 (fraud and forgery);</li>
              <li>Users must immediately notify FR8X of any suspected fraudulent activity, unauthorized access, or security breach;</li>
              <li>FR8X reserves the right to freeze accounts, withhold payouts, and share information with law enforcement agencies in compliance with court orders, FEMA provisions, or PMLA obligations;</li>
              <li>Rate manipulation, shill bidding, bid rigging, and price-fixing in auctions are strictly prohibited and may attract criminal liability under the Competition Act 2002.</li>
            </ul>
          </TermsSection>

          <TermsSection icon={<ShieldCheck size={18} />} title="7. Data Privacy & Information Security">
            <p>FR8X processes personal and corporate data in accordance with:</p>
            <ul>
              <li><strong>India:</strong> The Digital Personal Data Protection Act 2023 (DPDPA); Information Technology Act 2000 and Rules 2011;</li>
              <li><strong>EU/UK:</strong> GDPR (Regulation (EU) 2016/679) for users in the European Economic Area; UK GDPR;</li>
              <li><strong>International:</strong> ISO/IEC 27001 standards for information security management.</li>
            </ul>
            <p>Registration and transactional data is stored encrypted using AES-256-GCM in secure server-side vaults. Session credentials are managed via cryptographically signed JWTs with 8-hour expiry. All platform communications are secured via TLS 1.3. FR8X does not sell, rent, or trade personal data to third parties without express consent except as required by law.</p>
          </TermsSection>

          <TermsSection icon={<Scale size={18} />} title="8. Intellectual Property">
            <p>All platform software, algorithms, rate intelligence databases, auction engines, UI/UX designs, trademarks, and trade names including &ldquo;FR8X,&rdquo; &ldquo;fr8x.in,&rdquo; and the fr8x logo are the exclusive intellectual property of FR8X Technology Private Limited, protected under the Indian Copyright Act 1957, Trade Marks Act 1999, and applicable international IP treaties.</p>
            <p>Users are granted a limited, non-exclusive, non-transferable, revocable licence to access and use the platform solely for their internal freight procurement purposes. Reverse engineering, scraping, unauthorized API access, or redistribution of platform data is strictly prohibited.</p>
          </TermsSection>

          <TermsSection icon={<AlertTriangle size={18} />} title="9. Limitation of Liability & Indemnification">
            <p>FR8X&apos;s aggregate liability to any User for any claim arising out of or related to these Terms shall not exceed the total subscription fees paid by that User in the three (3) months preceding the claim. FR8X is not liable for:</p>
            <ul>
              <li>Loss or damage to cargo in transit (governed by carrier contracts);</li>
              <li>Indirect, consequential, incidental, special, or punitive damages;</li>
              <li>Force majeure events including natural disasters, pandemics, government actions, or cyber attacks by third parties;</li>
              <li>Accuracy of market rate data which is indicative and non-binding.</li>
            </ul>
            <p>Users agree to indemnify and hold harmless FR8X and its officers, directors, employees, and agents from any claims, damages, losses, or liabilities arising from: (i) breach of these Terms; (ii) violation of applicable law; (iii) infringement of third-party rights; (iv) fraudulent misrepresentation.</p>
          </TermsSection>

          <TermsSection icon={<Globe size={18} />} title="10. Governing Law, Dispute Resolution & Jurisdiction">
            <p>These Terms are governed by a <strong>dual-jurisdiction framework</strong>:</p>
            <ul>
              <li><strong>Indian Domestic Disputes:</strong> Governed by and construed in accordance with the laws of India. Disputes shall be first referred to mediation. If unresolved within 30 days, disputes shall be submitted to binding arbitration under the Arbitration and Conciliation Act 1996 (as amended in 2021), with seat at Mumbai, Maharashtra. Language: English;</li>
              <li><strong>International Commercial Disputes:</strong> Disputes involving cross-border transactions or parties not domiciled in India shall be resolved by arbitration under the Rules of Arbitration of the International Chamber of Commerce (ICC), with seat in Singapore. Language: English;</li>
              <li>Nothing in this clause shall prevent FR8X from seeking emergency injunctive relief from courts of competent jurisdiction to protect its intellectual property or prevent irreparable harm.</li>
            </ul>
          </TermsSection>

          <TermsSection icon={<FileText size={18} />} title="11. Account Termination & Suspension">
            <p>FR8X reserves the right to suspend or terminate any account immediately and without prior notice for:</p>
            <ul>
              <li>Breach of these Terms or any referenced policy;</li>
              <li>Fraudulent registration or activity;</li>
              <li>Non-payment of subscription or bid fees;</li>
              <li>Regulatory or legal obligation;</li>
              <li>Actions that compromise platform integrity or security.</li>
            </ul>
            <p>Upon termination, the User&apos;s access will be revoked. Data retention and deletion will proceed in accordance with the Privacy Policy and applicable law. Users may request account deletion by written notice to <strong>legal@fr8x.in</strong>.</p>
          </TermsSection>

          <TermsSection icon={<FileText size={18} />} title="12. Amendments to Terms">
            <p>FR8X reserves the right to amend these Terms at any time. Material changes will be communicated via registered email with 15 days&apos; advance notice. Continued use of the Platform after the effective date of revised Terms constitutes acceptance. If you do not accept amended Terms, you must cease use and may request account closure.</p>
          </TermsSection>

          <TermsSection icon={<Building2 size={18} />} title="13. Contact & Grievance Redressal">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              {[
                { label: 'Legal & Compliance', email: 'legal@fr8x.in' },
                { label: 'Privacy Officer', email: 'privacy@fr8x.in' },
                { label: 'Platform Support', email: 'support@fr8x.in' },
                { label: 'Security Incidents', email: 'security@fr8x.in' },
              ].map((c) => (
                <div key={c.label} style={{ background: '#0f172a', borderRadius: '8px', padding: '12px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{c.label}</div>
                  <a href={`mailto:${c.email}`} style={{ color: '#0ea5e9', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>{c.email}</a>
                </div>
              ))}
            </div>
            <p style={{ marginTop: '16px' }}>
              <strong>Registered Office:</strong> FR8X Technology Private Limited, Mumbai, Maharashtra, India.<br />
              Grievance redressal officer available during business hours (IST 9:30–18:30, Mon–Fri).
            </p>
          </TermsSection>
        </div>

        {/* CTA */}
        <div style={{
          marginTop: '40px',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)',
          border: '1px solid #334155',
          borderRadius: '16px',
          padding: '28px 32px',
          textAlign: 'center',
        }}>
          <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px' }}>
            By registering on FR8X, you confirm you have read and agree to the above Terms.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              href="/register"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#fff', fontWeight: 700, fontSize: '14px',
                padding: '12px 28px', borderRadius: '10px', textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(14,165,233,0.35)',
              }}
            >
              <ShieldCheck size={16} /> Accept & Proceed to Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TermsSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: '#1e293b',
      border: '1px solid #334155',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '14px 20px',
        background: 'rgba(14,165,233,0.06)',
        borderBottom: '1px solid #334155',
      }}>
        <span style={{ color: '#0ea5e9' }}>{icon}</span>
        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#e2e8f0' }}>{title}</h2>
      </div>
      <div style={{
        padding: '20px',
        fontSize: '13.5px',
        color: '#94a3b8',
        lineHeight: 1.7,
      }}>
        {children}
      </div>
      <style jsx>{`
        div p { margin: 0 0 12px; }
        div p:last-child { margin-bottom: 0; }
        div ul, div ol { margin: 8px 0 12px 20px; padding: 0; }
        div li { margin-bottom: 6px; }
        div strong { color: #e2e8f0; }
        div a { color: #0ea5e9; }
      `}</style>
    </div>
  );
}
