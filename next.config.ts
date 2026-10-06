import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone مفيد للحاويات؛ Vercel يتجاهله بأمان ويستخدم مساره الخاص
  output: "standalone",
  reactStrictMode: false,
  serverExternalPackages: ["@prisma/client", "z-ai-web-dev-sdk"],
};

export default nextConfig;
