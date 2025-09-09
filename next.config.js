/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features for better performance
  },
  images: {
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
  },
  // Enable SCSS support
  sassOptions: {
    includePaths: ['./styles'],
  },
}

module.exports = nextConfig