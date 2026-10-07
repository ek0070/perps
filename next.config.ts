import type { NextConfig } from "next";

// X renders the player in an iframe; 'self' lets our own About page frame it too.
const FRAME_ANCESTORS = "frame-ancestors 'self' https://x.com https://twitter.com https://*.twitter.com https://*.x.com";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      {
        // Only the player routes may be framed. No X-Frame-Options is set anywhere,
        // because it cannot express an allow-list and would block X.
        source: "/embed/:path*",
        headers: [
          { key: "Content-Security-Policy", value: FRAME_ANCESTORS },
          { key: "X-Robots-Tag", value: "noindex" },
        ],
      },
    ];
  },
};

export default nextConfig;
