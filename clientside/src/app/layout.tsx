import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gathbandhan — Plan Your Dream Wedding",
  description:
    "Gathbandhan is an AI-powered wedding consultation platform. Discover traditions, explore possibilities, and create a wedding plan that reflects your unique vision.",
  keywords: [
    "wedding planner",
    "Indian wedding",
    "wedding consultation",
    "wedding planning",
    "destination wedding",
    "AI wedding planner",
    "Gathbandhan",
  ],
  openGraph: {
    title: "Gathbandhan — Plan Your Dream Wedding",
    description:
      "Discover traditions, explore possibilities, and create a wedding plan that reflects your unique vision.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-screen bg-ivory antialiased">
        {children}
      </body>
    </html>
  );
}
