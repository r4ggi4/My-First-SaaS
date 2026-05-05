import type { NextConfig } from "next";

// Diagnostic: confirm env vars reach the build step
console.log("[next.config] NEXT_PUBLIC_FIREBASE_API_KEY set:", !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("[next.config] NEXT_PUBLIC_FIREBASE_PROJECT_ID set:", !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
};

export default nextConfig;
