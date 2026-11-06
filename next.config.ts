import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Local tooling and CDP verification reach the dev server over the loopback
  // IP as well as "localhost", so both origins must be trusted.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [70, 75, 82, 85],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1600, 1920],
    imageSizes: [96, 128, 160, 200, 256, 300, 384, 450],
  },
};

export default nextConfig;
