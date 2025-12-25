/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features for better performance
  },
  // Allow dev access from local network IPs
  allowedDevOrigins: [
    'http://192.168.178.175:3000',
    'http://192.168.178.175:3001',
  ],
  images: {
    // Use remotePatterns instead of deprecated domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'imagedelivery.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        pathname: '/**',
      },
    ],
    formats: ["image/webp", "image/avif"],
  },
  // Enable SCSS support
  sassOptions: {
    includePaths: ["./styles"],
    prependData: `@import "styles/variables.scss";`,
  },
  // Proxy API requests to backend
  async rewrites() {
    return [
      {
        source: '/api/ads/:path*',
        destination: 'http://localhost:4000/api/ads/:path*',
      },
    ];
  },
};

module.exports = nextConfig;
