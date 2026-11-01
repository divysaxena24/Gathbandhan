"use client";

import React from "react";
import { UserButton, useClerk, useUser } from "@clerk/nextjs";
import { LogOut, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortalUserHeaderProps {
  userEmail?: string;
}

export function PortalUserHeader({ userEmail }: PortalUserHeaderProps) {
  const { signOut } = useClerk();
  const { user } = useUser();

  const email = userEmail || user?.primaryEmailAddress?.emailAddress || "";

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Authenticated Status Badge */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/70 border border-gold/25 text-xs font-medium text-charcoal shadow-2xs">
        <Sparkles className="w-3.5 h-3.5 text-gold-600" />
        <span className="truncate max-w-[200px]" title={email}>
          {email || "Authenticated"}
        </span>
      </div>

      {/* Clerk User Button Profile */}
      <div className="flex items-center">
        <UserButton
          afterSignOutUrl="/sign-in"
          appearance={{
            elements: {
              avatarBox: "w-9 h-9 rounded-full border border-gold/40 shadow-xs",
            },
          }}
        />
      </div>

      {/* Explicit Sign Out / Logout Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => signOut({ redirectUrl: "/sign-in" })}
        className="flex items-center gap-1.5 border-gold/40 hover:border-maroon/50 hover:bg-maroon/5 text-charcoal hover:text-maroon text-xs font-semibold rounded-full px-3.5 h-9 shadow-xs transition-all"
        title="Sign out of Gathbandhan"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Sign Out</span>
      </Button>
    </div>
  );
}
