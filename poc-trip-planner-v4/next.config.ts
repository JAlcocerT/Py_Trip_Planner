import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  experimental: {
    optimizePackageImports: ["lucide-react", "react-icons", "@nivo/boxplot"],
  },
};

export default nextConfig;
