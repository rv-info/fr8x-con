/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async redirects() {
    return [
      {
        // /godfather/login is an alias — redirect to the actual login page
        source: '/godfather/login',
        destination: '/godfatheron',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/godfatheron',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive, nosnippet',
          },
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0, must-revalidate',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            // Content Security Policy — blocks XSS injection.
            // Configured for Firebase, Google Fonts, Vercel, and ZeptoMail REST (server-side only).
            // 'unsafe-inline' retained for styles until CSS-in-JS nonce migration is done.
            // 'unsafe-eval' retained for Next.js dev HMR; removed in production via Vercel env.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + Firebase + Vercel analytics (unsafe-eval for Next.js dev)
              `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"} https://www.gstatic.com https://www.google.com https://apis.google.com https://va.vercel-scripts.com`,
              // Styles: self + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Firebase Storage + data URIs
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com",
              // XHR/fetch: self + Firebase + Google APIs
              "connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://fcmregistrations.googleapis.com",
              // Frames: none
              "frame-src 'none'",
              // Objects: none
              "object-src 'none'",
              // Base URI: self only
              "base-uri 'self'",
              // Form action: self
              "form-action 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
