import type { NextConfig } from "next";

const API_URL =
  process.env.SERVER_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  experimental: {
    proxyClientMaxBodySize: "20mb",
  },
  async rewrites() {
    return {
      // afterFiles: Next.js가 자체 파일(API 라우트, 페이지)을 먼저 확인한 뒤
      // 매칭이 없을 때만 Django로 넘긴다.
      // beforeFiles였을 때는 /api/admin/autocomplete-book 같은 Next.js 라우트도
      // Django로 가로채여 404가 발생했음.
      afterFiles: [
        {
          source: "/api/:path*",
          destination: `${API_URL}/api/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;
