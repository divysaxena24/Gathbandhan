import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gathbandhan OS — Luxury Wedding Platform",
    short_name: "Gathbandhan",
    description: "Operating system for luxury destination wedding planning agencies in Rajasthan",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#1A1A1A",
    theme_color: "#D4AF37",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
