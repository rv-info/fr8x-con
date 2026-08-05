// FR8X-CON Root Layout

import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { CurrencyProvider } from "@/providers/CurrencyProvider";
import { LanguageProvider } from "@/components/ui/LanguageSelector";
import BackupScheduler from "@/components/layout/BackupScheduler";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fr8x.in"),
  title: {
    default: "FR8X-CON | Enterprise Global Freight & Logistics Platform",
    template: "%s | FR8X-CON",
  },
  description:
    "FR8X-CON is a secure, enterprise-grade B2B logistics platform for freight forwarders, shipping lines, NVOCCs, importers and exporters. Features: reverse auctions, live bidding, rate management, and professional collaboration.",
  keywords: [
    "freight platform",
    "reverse auction logistics",
    "freight forwarder network",
    "NVOCC platform",
    "ocean freight rates",
    "FCL LCL bidding",
    "shipping line rate",
    "import export logistics",
    "B2B freight marketplace",
    "cargo rate management",
    "logistics collaboration platform",
    "freight rate intelligence",
    "global supply chain",
    "container shipping platform",
    "enterprise freight management",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FR8X-CON",
    url: process.env.NEXT_PUBLIC_APP_URL || "https://fr8x.in",
    title: "FR8X-CON | Enterprise Global Freight & Logistics Platform",
    description:
      "B2B reverse auctions, live freight bidding, rate management & logistics professional networking — all in one secure enterprise platform.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "FR8X-CON Enterprise Logistics Platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    site: "@fr8xcon",
    creator: "@fr8xcon",
    title: "FR8X-CON | Enterprise Global Freight & Logistics Platform",
    description:
      "B2B reverse auctions, live freight bidding, rate management & logistics professional networking.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/fr8x.png",
    shortcut: "/fr8x.png",
    apple: "/fr8x.png",
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL || "https://fr8x.in",
  },
  category: "logistics",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#F7F7FF",
};

const jsonLdOrganization = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "FR8X-CON",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://fr8x.in",
  description:
    "Enterprise B2B freight reverse auction and logistics collaboration platform for shipping lines, NVOCCs, freight forwarders, importers and exporters.",
  contactPoint: {
    "@type": "ContactPoint",
    email: "support@fr8x.in",
    contactType: "customer support",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrganization) }}
        />
      </head>
      <body className="h-full bg-background antialiased">
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              <CurrencyProvider>
                <BackupScheduler />
                {children}
              </CurrencyProvider>
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
