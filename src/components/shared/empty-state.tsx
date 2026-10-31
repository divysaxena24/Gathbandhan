import React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center animate-in fade-in-50 bg-card/50",
        className
      )}
    >
      {icon && (
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-muted/60 text-muted-foreground mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-display text-lg font-semibold text-foreground">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

