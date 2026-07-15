/** @type {import('next').NextConfig} */
const configuredApiBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
const backendOrigin = configuredApiBase
  ? configuredApiBase.replace(/\/api\/?$/, "")
  : "http://127.0.0.1:8000";

const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
