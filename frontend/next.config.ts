import type { NextConfig } from 'next'
const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: { unoptimized: true },
  experimental: { typedRoutes: true }
}
export default nextConfig
