import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: [
      "lucide-react",
      "date-fns",
      "recharts",
      "@radix-ui/react-dialog",
      "@radix-ui/react-tabs",
      "@radix-ui/react-select",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-popover",
      "@radix-ui/react-tooltip",
      "@radix-ui/react-scroll-area",
    ],
  },
  async redirects() {
    return [
      {
        source: "/quotations",
        destination: "/quotation-analyzer",
        permanent: false,
      },
      {
        source: "/quotations/:path*",
        destination: "/quotation-analyzer",
        permanent: false,
      },
      {
        source: "/leads",
        destination: "/booking-requests",
        permanent: false,
      },
      {
        source: "/leads/:path*",
        destination: "/booking-requests",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
