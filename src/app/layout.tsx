import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gathbandhan",
  description: "Gathbandhan — Where Every Celebration Comes Together",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className="font-sans antialiased" suppressHydrationWarning>
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
