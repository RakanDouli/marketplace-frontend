const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use webpack for PWA compatibility (next-pwa doesn't support Turbopack yet)
  turbopack: {},
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
        // Staging Supabase
        protocol: 'https',
        hostname: 'zokgmrriwhllyapgtuiu.supabase.co',
        pathname: '/**',
      },
      {
        // Production Supabase
        protocol: 'https',
        hostname: 'vmnpvmsbmmjeiseowpju.supabase.co',
        pathname: '/**',
      },
      {
        // Development Supabase
        protocol: 'https',
        hostname: 'hepesfbyhjydndmihvvv.supabase.co',
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
      // Production domain
      {
        protocol: 'https',
        hostname: 'api.akarkar.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'akarkar.com',
        pathname: '/**',
      },
      // Staging server (Hetzner)
      {
        protocol: 'http',
        hostname: '46.224.146.155',
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

module.exports = withPWA(nextConfig);
