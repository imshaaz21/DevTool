/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [],
  },
  output: 'standalone', // Enable standalone output for Docker deployment
}

module.exports = nextConfig
