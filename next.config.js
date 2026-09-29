/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/godfatheron',
        destination: '/godfather/login',
      },
      {
        source: '/GODFATHERON',
        destination: '/godfather/login',
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
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(logo.png|icon.png|favicon.ico|favicon.png|apple-icon.png)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
          {
            key: 'Service-Worker-Allowed',
            value: '/',
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
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            // Content Security Policy — blocks XSS injection.
            // Configured for Firebase, Google Fonts, Vercel, and ZeptoMail REST (server-side only).
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + Firebase + Vercel analytics + Razorpay checkout
              `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"} https://www.gstatic.com https://www.google.com https://apis.google.com https://va.vercel-scripts.com https://checkout.razorpay.com`,
              // Styles: self + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Firebase Storage + data URIs
              "img-src 'self' data: blob: https://firebasestorage.googleapis.com https://lh3.googleusercontent.com",
              // XHR/fetch: self + Firebase + Google APIs + Razorpay
              "connect-src 'self' https://*.firebaseio.com wss://*.firebaseio.com https://*.googleapis.com https://securetoken.googleapis.com https://identitytoolkit.googleapis.com https://fcmregistrations.googleapis.com https://api.razorpay.com https://lumberjack.razorpay.com",
              // Frames: Razorpay checkout modal
              "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
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
