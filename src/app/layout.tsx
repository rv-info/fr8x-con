// FR8X-CON Root Layout

import type { Metadata, Viewport } from "next";
import { AuthProvider } from "@/providers/AuthProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { CurrencyProvider } from "@/providers/CurrencyProvider";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fr8xcon.com"),
  title: {
    default: "FR8X-CON | Enterprise Freight Platform",
    template: "%s | FR8X-CON",
  },
  description:
    "Secure, enterprise-grade freight reverse-auction and logistics collaboration platform for freight forwarders, shipping lines, importers, exporters, and logistics managers.",
  keywords: [
    "freight",
    "reverse auction",
    "logistics",
    "shipping",
    "NVOCC",
    "freight forwarder",
    "FCL",
    "LCL",
    "ocean freight",
    "rates",
    "freight platform",
    "logistics collaboration",
  ],
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "FR8X-CON",
    title: "FR8X-CON | Enterprise Freight Platform",
    description:
      "Reverse auctions, live bidding, rate management & professional collaboration — all in one secure platform.",
  },
  twitter: {
    card: "summary_large_image",
    title: "FR8X-CON | Enterprise Freight Platform",
    description:
      "Reverse auctions, live bidding, rate management & professional collaboration — all in one secure platform.",
  },
  icons: {
    icon: "/fr8x.png",
    shortcut: "/fr8x.png",
    apple: "/fr8x.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#56C5F0",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="h-full bg-background antialiased">
        <QueryProvider>
          <AuthProvider>
            <CurrencyProvider>
              {children}
            </CurrencyProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
