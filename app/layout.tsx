import './globals.css';
import type { Metadata, Viewport } from 'next';
import { AppShell } from '@/components/layout/AppShell';
import { masterblastFont } from '@/lib/fonts';

import { siteMetadata } from '@/config/site-metadata';
import { buildRouteMetadata } from '@/config/seo';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: siteMetadata.themeColor,
};

export const metadata: Metadata = buildRouteMetadata('home', {
  metadataBase: new URL(siteMetadata.siteUrl),
  title: {
    default: siteMetadata.defaultTitle,
    template: siteMetadata.titleTemplate,
  },
  applicationName: siteMetadata.siteName,
  authors: [{ name: 'FR8X Engineering', url: siteMetadata.siteUrl }],
  creator: siteMetadata.publisher,
  publisher: siteMetadata.publisher,
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.png', type: 'image/png', sizes: '64x64' },
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
      { url: '/logo.png', type: 'image/png', sizes: '512x512' },
      { url: '/logo.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: siteMetadata.siteName,
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={masterblastFont.variable}>
      <head>
        <meta charSet="utf-8" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/logo.svg" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon.png" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon.png" />
      </head>
      <body className={masterblastFont.className}>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

