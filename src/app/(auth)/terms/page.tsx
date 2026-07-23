// FR8X-CON Terms & Conditions — Spec Page 12
// Full legal documentation: T&C, IP Rights, Privacy, Disclaimer

"use client";

import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";
import { ChevronLeft } from "lucide-react";

const sections = [
  {
    title: "1. TERMS & CONDITIONS",
    items: [
      "Users must register using accurate, complete, and up-to-date information.",
      "Every registered business is solely responsible for the authenticity of the information submitted.",
      "Blueprints acts only as a technology platform connecting buyers, sellers, logistics providers, freight forwarders, customs brokers, shipping lines, warehousing operators, and transporters.",
      "Blueprints does not participate in negotiations, contracts, quotations, pricing, transportation, payments, customs clearance, cargo handling, or shipment execution.",
      "All commercial decisions remain solely between participating businesses.",
      "Users shall not submit misleading, fraudulent, defamatory, illegal, or copyrighted material without authorization.",
      "Fake companies, duplicate registrations, or misleading profiles may be suspended or permanently removed without notice.",
      "Subscription fees, listing fees, job posting charges, advertising fees, and promotional charges are non-refundable unless required by applicable law.",
      "Users are responsible for maintaining confidentiality of their login credentials.",
      "Blueprints reserves the right to verify company information before approving listings.",
      "Any misuse of the platform, including spam, phishing, harassment, impersonation, malware distribution, or illegal activities, will result in immediate account termination.",
      "Users must comply with all applicable local, national, and international laws.",
      "Blueprints reserves the right to modify platform features, pricing, subscription plans, and services without prior notice.",
      "Continued use of the platform constitutes acceptance of updated policies.",
      "Blueprints may suspend or terminate accounts that violate these Terms.",
      "Platform availability is provided on a best-effort basis without guaranteed uptime.",
      "Blueprints shall not be liable for business losses, shipment delays, payment defaults, or contractual disputes between users.",
      "All disputes shall be governed by the applicable laws and jurisdiction specified by Blueprints.",
    ],
  },
  {
    title: "2. INTELLECTUAL PROPERTY RIGHTS",
    items: [
      "Blueprints owns all rights, title, and interest in the platform, including software, source code, APIs, algorithms, databases, user interface, design, graphics, and documentation.",
      'The "Blueprints" name, logo, trademarks, icons, and branding are protected intellectual property.',
      "Users receive only a limited, non-exclusive, non-transferable license to use the platform.",
      "No user may copy, reproduce, modify, distribute, reverse engineer, decompile, scrape, mirror, or commercially exploit any portion of the platform.",
      "Automated scraping, crawling, data mining, bots, and AI harvesting are strictly prohibited without written authorization.",
      "Company logos, trademarks, documents, and content uploaded by users remain the property of their respective owners.",
      "By uploading content, users grant Blueprints a worldwide, royalty-free license to display, index, promote, and distribute such content solely for operational purposes.",
      "Users warrant that uploaded materials do not infringe third-party copyrights, patents, trademarks, or other intellectual property rights.",
      "Any unauthorized use of Blueprints intellectual property may result in legal proceedings.",
      "Blueprints reserves the right to remove infringing content immediately.",
      "Platform screenshots, branding, workflows, pricing structures, and proprietary systems may not be replicated for competing services.",
      "API access, integrations, and proprietary datasets remain exclusive property unless licensed separately.",
    ],
  },
  {
    title: "3. PRIVACY, DATA PROTECTION & CONFIDENTIALITY",
    items: [
      "Blueprints collects only information necessary to provide platform services.",
      "Business profiles, company details, contact information, and uploaded documents are stored securely.",
      "Personal information is processed in accordance with applicable privacy laws.",
      "Blueprints does not sell personal data to third parties.",
      "Information may be shared only where legally required or necessary to provide requested services.",
      "Payment information is processed by authorized payment gateways and is not stored on Blueprints servers unless required for lawful purposes.",
      "Users remain responsible for maintaining confidentiality of RFQs, quotations, contracts, and commercial information shared with other users.",
      "Blueprints employs commercially reasonable security measures to protect stored information.",
      "No internet-based system can guarantee absolute security.",
      "Users acknowledge that electronic communications may carry inherent risks.",
      "Cookies and analytics technologies may be used to improve platform functionality.",
      "Users may request correction or deletion of eligible personal information, subject to legal obligations.",
      "Blueprints may retain records where required by taxation, legal, or regulatory requirements.",
      "Users should avoid uploading confidential documents unless necessary.",
      "Blueprints shall not be responsible for disclosures made voluntarily by users to other businesses.",
    ],
  },
  {
    title: "4. DISCLAIMER, LIMITATION OF LIABILITY & ACCEPTABLE USE",
    items: [
      "Blueprints provides an online marketplace and networking platform only.",
      "Blueprints does not guarantee successful business transactions.",
      "Blueprints does not guarantee shipment completion, customs clearance, delivery schedules, or payment recovery.",
      "Company verification does not constitute endorsement or guarantee of business reliability.",
      "Users should conduct their own due diligence before entering into commercial agreements.",
      "Blueprints shall not be liable for direct, indirect, incidental, consequential, punitive, or special damages arising from platform use.",
      "Users assume full responsibility for commercial negotiations and contractual obligations.",
      "Blueprints shall not be liable for data loss resulting from force majeure events, cyberattacks, telecommunications failures, or third-party service interruptions.",
      "Users agree not to upload malicious software, viruses, ransomware, or harmful code.",
      "Users shall not misuse messaging systems for spam, unsolicited advertising, or fraudulent activities.",
      "Multiple fake accounts, automated registrations, identity theft, and impersonation are prohibited.",
      "Blueprints reserves the right to remove any listing, RFQ, job posting, company profile, or advertisement that violates platform policies.",
      "Any attempt to interfere with platform security, servers, databases, APIs, or network infrastructure may result in immediate termination and legal action.",
      "Blueprints may investigate suspected violations and cooperate with law enforcement authorities where required.",
      "By using the platform, users acknowledge that they have read, understood, and agreed to these Terms, Privacy Policy, Intellectual Property Rights, and Acceptable Use policies.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen w-full bg-[var(--fr8x-bg)] py-8">
      <div className="w-full max-w-full px-4 lg:px-8">
        {/* Back link */}
        <Link
          href={ROUTES.LOGIN}
          className="inline-flex items-center gap-1 text-body-sm text-foreground-secondary hover:text-[var(--fr8x-jet)] transition-colors mb-8"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Login
        </Link>

        <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)] mb-8">
          Legal Documentation
        </h1>

        <div className="space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-heading-lg font-semibold text-[var(--fr8x-jet)] mb-4 border-b border-border pb-2">
                {section.title}
              </h2>
              <ol className="space-y-2.5 list-decimal list-inside">
                {section.items.map((item, idx) => (
                  <li
                    key={idx}
                    className="text-body-sm text-[var(--fr8x-jet)] leading-relaxed pl-1"
                  >
                    {item}
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-border text-center">
          <p className="text-caption text-foreground-muted">
            © {new Date().getFullYear()} FR8X-CON. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
