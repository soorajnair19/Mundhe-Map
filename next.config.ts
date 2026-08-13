import type { NextConfig } from "next";

process.env.NEXT_PUBLIC_BUILD_TIME = new Date().toISOString();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
