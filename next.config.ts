import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Suppress server-only module warnings for libsql
  serverExternalPackages: ["@libsql/client"],
};

export default nextConfig;
