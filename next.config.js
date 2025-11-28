/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Don't run ESLint during production builds
    // Run it separately via 'npm run lint'
    ignoreDuringBuilds: true,
  },
  swcMinify: true,
  images: {
    domains: [],
  },
  output: 'standalone', // Enable standalone output for Docker deployment
}

module.exports = nextConfig
