/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/_design',
        destination: '/design',
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/_design',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
      {
        source: '/design',
        headers: [
          { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  serverExternalPackages: ['pg-cloudflare'],
  outputFileTracingIncludes: {
    '**/*': [
      './node_modules/pg-cloudflare/**/*',
      './node_modules/pg-cloudflare/dist/**/*',
      './node_modules/pg-cloudflare/esm/**/*',
    ],
  },
};

export default nextConfig;

