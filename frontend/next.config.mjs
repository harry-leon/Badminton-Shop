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
};

export default nextConfig;
