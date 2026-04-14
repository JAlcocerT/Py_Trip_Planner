import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Proxy all /api/* calls to the FastAPI backend.
  // API_URL is a server-side env var (not NEXT_PUBLIC_) so it never leaks to
  // the browser bundle and works regardless of the hostname the user uses to
  // reach the frontend.
  async rewrites() {
    const apiUrl = process.env.API_URL ?? "http://localhost:8000";
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
