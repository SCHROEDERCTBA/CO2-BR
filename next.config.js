require('dotenv').config(); // Use require for CommonJS

/** @type {import('next').NextConfig} */ // JSDoc for type hinting
const nextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Aceita o hostname do Supabase via variável de ambiente para maior segurança
      {
        protocol: 'https',
        hostname: process.env.SUPABASE_HOSTNAME, // Remove '!'
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Aumenta o limite do corpo da requisição para 10MB
    },
  },
};

module.exports = nextConfig; // Use module.exports for CommonJS