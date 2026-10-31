import React from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({
  message = "Loading operational data...",
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[300px] flex-col items-center justify-center p-8 text-center animate-in fade-in-50",
        className
      )}
    >
      <Loader2 className="h-8 w-8 animate-spin text-gold mb-3" />
      <p className="text-sm font-medium text-muted-foreground">{message}</p>
    </div>
  );
}

