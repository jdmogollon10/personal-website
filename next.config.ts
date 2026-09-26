import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Lets phones on the same Wi-Fi load the dev server via this Mac's network address.
  // Development only; has no effect on the deployed site.
  allowedDevOrigins: ["192.168.109.184", "100.69.35.244"],
};

export default nextConfig;
