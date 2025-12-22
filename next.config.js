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
    domains: ["localhost", "imagedelivery.net", "images.unsplash.com", "your-domain.com", "hepesfbyhjydndmihvvv.supabase.co"],
    formats: ["image/webp", "image/avif"],
    qualities: [75, 85], // Support both default (75) and Unsplash default (85)
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
