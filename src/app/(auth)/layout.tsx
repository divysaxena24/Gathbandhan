import React from "react";
import Link from "next/link";
import { Crown } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-ivory flex flex-col justify-between p-6">
      <header className="max-w-7xl mx-auto w-full flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30">
            <Crown className="w-4 h-4 text-gold" />
          </div>
          <span className="font-display font-bold text-base text-charcoal">
            The Royal Knot
          </span>
        </Link>
      </header>
      <main className="flex items-center justify-center py-12">
        {children}
      </main>
      <footer className="text-center text-xs text-charcoal-400">
        Operational security & role-based access control enabled
      </footer>
    </div>
  );
}

