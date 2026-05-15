import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    reactCompiler: false,
  },
  async rewrites() {
    const agentUrl = process.env.NEXT_PUBLIC_AGENT_URL || "http://localhost:2024";
    return [
      {
        source: "/api/sparring/:path*",
        destination: `${agentUrl}/api/sparring/:path*`,
      },
      {
        source: "/api/extract-text",
        destination: `${agentUrl}/api/extract-text`,
      },
      {
        source: "/api/analyze",
        destination: `${agentUrl}/api/analyze`,
      },
      {
        source: "/copilotkit",
        destination: `${agentUrl}/copilotkit/`,
      },
      {
        source: "/copilotkit/",
        destination: `${agentUrl}/copilotkit/`,
      },
      {
        source: "/copilotkit/:path*",
        destination: `${agentUrl}/copilotkit/:path*`,
      },
    ];
  },
};

export default nextConfig;
