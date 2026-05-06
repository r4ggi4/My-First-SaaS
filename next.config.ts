import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "firebasestorage.googleapis.com",
      },
    ],
  },
  // Pass Firebase client config through next.config.ts env to work around
  // a Turbopack 15.x bug where NEXT_PUBLIC_* vars aren't inlined at compile time.
  env: {
    _FB_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
    _FB_AUTH_DOMAIN: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
    _FB_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
    _FB_STORAGE_BUCKET: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
    _FB_MESSAGING_SENDER_ID: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
    _FB_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  },
};

export default nextConfig;
