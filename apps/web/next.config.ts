import type { NextConfig } from "next";

// Proxy browser-facing /api/* calls to the NestJS API server-side. This keeps the
// auth cookie first-party (set by localhost:3000, not :3001) so browsers that block
// cross-origin/third-party cookies still persist the session. It also removes CORS.
const apiTarget = process.env.API_PROXY_TARGET ?? `http://localhost:${process.env.API_PORT ?? 3001}`;

const nextConfig: NextConfig = {
  transpilePackages: ["@diet/shared"],
  async rewrites() {
    return [{ source: "/api/:path*", destination: `${apiTarget}/:path*` }];
  },
};
export default nextConfig;
