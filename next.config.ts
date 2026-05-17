import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

const isDev = process.argv.some(arg => arg === "dev" || arg.endsWith("next-dev") || arg.includes("dev"));
if (isDev) {
  import('@opennextjs/cloudflare').then(m => m.initOpenNextCloudflareForDev());
}
