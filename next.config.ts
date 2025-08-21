import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["uploadthing", "stripe"],
  eslint: {
    // Warning: This allows production builds to successfully complete even if
    // your project has ESLint errors.
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Warning: This allows production builds to successfully complete even if
    // your project has type errors.
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uploadthing.com",
      },
      {
        protocol: "https",
        hostname: "uploadthing-prod.s3.us-west-2.amazonaws.com",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
    ],
  },
  // Configuration pour Docker
  output: "standalone",
};

export default nextConfig;
