/** @type {import('next').NextConfig} */
const path = require('path')

const nextConfig = {
  reactStrictMode: true,
  // Image optimization settings
  images: {
    // Only allow known external image hosts. Hostinger CDN removed to ensure
    // all site assets are served locally from /public to avoid external deps.
    domains: ['images.unsplash.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Explicitly set the outputFileTracingRoot to avoid Next inferring C:\ as workspace root
  outputFileTracingRoot: path.resolve(__dirname),
  // Disable ESLint during build to avoid blocking builds in environments
  // where lint rules are strict; prefer fixing lint issues in CI/dev.
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/public/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
  webpack: (config, { isServer, dev }) => {
    if (dev && config.watchOptions) {
      config.watchOptions.ignored = [
        "**/node_modules",
        "**/.next/**",
        "C:/pagefile.sys",
        "C:/swapfile.sys",
        "C:/DumpStack.log.tmp",
      ]
    }
    return config
  },
}

module.exports = nextConfig
