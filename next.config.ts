import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    agentUpgrade: "security",
    // Enables forbidden(), used by requireRole() to deny a wrong role
    // with a 403 page instead of revealing another area.
    authInterrupts: true,
  },
};

export default nextConfig;
