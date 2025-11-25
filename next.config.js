/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Enable experimental features for better performance
  },
  images: {
    domains: ["localhost", "imagedelivery.net", "images.unsplash.com", "your-domain.com", "hepesfbyhjydndmihvvv.supabase.co"],
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
