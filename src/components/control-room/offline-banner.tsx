"use client";

import React, { useEffect, useState } from "react";
import { Wifi, WifiOff, HardDriveDownload, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface OfflineBannerProps {
  onCacheData?: () => void;
  lastCachedAt?: string | null;
}

export function OfflineBanner({ onCacheData, lastCachedAt }: OfflineBannerProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedSuccess, setCachedSuccess] = useState(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleCache = () => {
    if (onCacheData) {
      onCacheData();
      setCachedSuccess(true);
      setTimeout(() => setCachedSuccess(false), 3000);
    }
  };

  return (
    <div
      className={`rounded-lg p-3 text-sm flex flex-wrap items-center justify-between gap-3 transition-colors ${
        isOnline
          ? "bg-ivory border border-sand/40 text-charcoal/80"
          : "bg-status-critical/10 border border-status-critical/30 text-status-critical"
      }`}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4 text-status-success shrink-0" />
            <span className="font-medium text-charcoal">Control Room Live</span>
            <span className="text-xs text-charcoal/50">
              {lastCachedAt
                ? `• Offline cached at ${lastCachedAt}`
                : "• Connects to real-time gate & timeline feed"}
            </span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4 text-status-critical shrink-0 animate-pulse" />
            <span className="font-semibold text-status-critical">
              Offline Mode Active (Palace Gate / Venue Cellular Drop)
            </span>
            <span className="text-xs text-charcoal/70">
              Showing cached timeline and emergency contacts. Changes will queue locally.
            </span>
          </>
        )}
      </div>

      <div className="flex items-center gap-2">
        {onCacheData && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs gap-1.5 border-sand bg-white hover:bg-cream"
            onClick={handleCache}
          >
            {cachedSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-status-success" />
                <span>Cached for Offline</span>
              </>
            ) : (
              <>
                <HardDriveDownload className="w-3.5 h-3.5 text-gold" />
                <span>Cache Schedule Offline</span>
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
