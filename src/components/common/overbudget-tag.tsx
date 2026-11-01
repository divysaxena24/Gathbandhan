"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import { formatPaiseToINR } from "@/lib/services/budget-comparison";

export interface OverbudgetTagProps {
  isOverBudget: boolean;
  overBudgetPaise?: bigint | string | number | null;
  clientBudgetPaise?: bigint | string | number | null;
  percentageOver?: number;
  size?: "xs" | "sm" | "md" | "lg";
  showAmount?: boolean;
  className?: string;
}

export function OverbudgetTag({
  isOverBudget,
  overBudgetPaise,
  clientBudgetPaise,
  percentageOver,
  size = "sm",
  showAmount = false,
  className = "",
}: OverbudgetTagProps) {
  if (!isOverBudget) {
    return null;
  }

  const sizeClasses = {
    xs: "px-1.5 py-0.2 text-[9px] gap-1",
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  }[size];

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }[size];

  const formattedOver = overBudgetPaise ? formatPaiseToINR(overBudgetPaise) : null;
  const formattedClient = clientBudgetPaise ? formatPaiseToINR(clientBudgetPaise) : null;

  return (
    <span
      data-testid="overbudget-tag"
      className={`inline-flex items-center font-bold rounded-md uppercase tracking-wider bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-300 dark:border-rose-700/60 shadow-xs transition-all ${sizeClasses} ${className}`}
      title={
        formattedClient
          ? `Estimated budget exceeds client target budget of ${formattedClient}${
              formattedOver ? ` by ${formattedOver}` : ""
            }`
          : "Estimated budget exceeds client budget"
      }
    >
      <AlertTriangle className={`${iconSizes} shrink-0 text-rose-600 dark:text-rose-400`} />
      <span>Overbudget</span>
      {showAmount && formattedOver && (
        <span className="font-normal opacity-90 normal-case">
          (+{formattedOver})
        </span>
      )}
    </span>
  );
}

export default OverbudgetTag;
