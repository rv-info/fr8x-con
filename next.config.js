require('./scripts/patch-fs-fat32.js');

class Fat32ReadlinkPlugin {
  apply(compiler) {
    const patchFs = (fsObj) => {
      if (!fsObj || !fsObj.readlink || fsObj.__fat32_patched) return;
      fsObj.__fat32_patched = true;
      const orig = fsObj.readlink.bind(fsObj);
      fsObj.readlink = function (path, ...args) {
        const callback = args[args.length - 1];
        if (typeof callback === 'function') {
          args[args.length - 1] = function (err, result) {
            if (err && (err.code === 'EISDIR' || err.code === 'EINVAL')) {
              const einval = new Error(`EINVAL: invalid argument, readlink '${path}'`);
              einval.code = 'EINVAL';
              return callback(einval);
            }
            return callback(err, result);
          };
        }
        return orig(path, ...args);
      };
      if (fsObj._fs && fsObj._fs.readlink) {
        patchFs(fsObj._fs);
      }
    };

    compiler.hooks.environment.tap('Fat32ReadlinkPlugin', () => {
      patchFs(compiler.inputFileSystem);
    });
    compiler.hooks.compilation.tap('Fat32ReadlinkPlugin', (compilation) => {
      patchFs(compilation.inputFileSystem);
    });
  }
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  // Container deployment standalone build optimization
  ...(process.env.DOCKER_BUILD === 'true' ? { output: 'standalone' } : {}),
  experimental: {
    webpackBuildWorker: false,
  },
  webpack: (config) => {
    config.resolve.symlinks = false;
    config.cache = false;
    config.plugins.push(new Fat32ReadlinkPlugin());
    return config;
  },
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
            // Configured for Supabase, Google Fonts, Vercel, and Razorpay.
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Scripts: self + Vercel analytics + Razorpay checkout
              `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"} https://va.vercel-scripts.com https://checkout.razorpay.com`,
              // Styles: self + Google Fonts
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fonts
              "font-src 'self' https://fonts.gstatic.com",
              // Images: self + Supabase Storage + data URIs
              "img-src 'self' data: blob: https://*.supabase.co https://haarbaqeuuirwkhmefev.supabase.co",
              // XHR/fetch: self + Supabase + Razorpay
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://haarbaqeuuirwkhmefev.supabase.co wss://haarbaqeuuirwkhmefev.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com",
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
