"use client";

import React from "react";
import { EvidenceDetailRecord } from "@/lib/ai/comparison-types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  X,
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  Quote,
  ExternalLink,
  BookOpen,
  HelpCircle,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";

interface EvidenceInspectorDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  record: EvidenceDetailRecord | null;
  onOpenPdfPage?: (vendorId: string, pageNumber: number) => void;
}

export function EvidenceInspectorDrawer({
  isOpen,
  onClose,
  record,
  onOpenPdfPage,
}: EvidenceInspectorDrawerProps) {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen || !record) return null;

  const handleCopySnippet = () => {
    if (record.evidenceSnippet) {
      navigator.clipboard.writeText(record.evidenceSnippet);
      setCopied(true);
      toast.success("Evidence snippet copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getCategoryColor = (cat: EvidenceDetailRecord["category"]) => {
    switch (cat) {
      case "line_item":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30";
      case "inclusion":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30";
      case "exclusion":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30";
      case "payment":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/30";
      case "cancellation":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30";
      case "math_audit":
        return "bg-amber-500/10 text-amber-800 dark:text-amber-300 border-amber-500/40";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-charcoal-950/40 backdrop-blur-xs transition-opacity duration-200">
      <div
        className="relative w-full max-w-lg bg-card border-l border-border/80 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        role="dialog"
        aria-modal="true"
        aria-label="Evidence Inspector"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-muted/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gold/15 flex items-center justify-center text-gold-700 dark:text-gold-400">
              <Search className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground font-display">Source Evidence Inspector</h3>
              <p className="text-xs text-muted-foreground">{record.vendorName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={`text-xs capitalize font-semibold ${getCategoryColor(record.category)}`}>
              {record.category.replace("_", " ")}
            </Badge>

            <Badge
              variant="outline"
              className={`text-xs font-semibold ${
                record.isExplicit
                  ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                  : "border-amber-500/40 text-amber-700 dark:text-amber-300 bg-amber-500/10"
              }`}
            >
              {record.isExplicit ? "✓ Explicitly Stated" : "ℹ AI Inferred"}
            </Badge>

            {record.auditStatus && (
              <Badge
                variant="outline"
                className={`text-xs font-semibold ${
                  record.auditStatus === "VERIFIED"
                    ? "border-emerald-500/40 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                    : "border-rose-500/40 text-rose-700 dark:text-rose-300 bg-rose-500/10"
                }`}
              >
                {record.auditStatus === "VERIFIED" ? "Math Verified" : "Audit Discrepancy"}
              </Badge>
            )}
          </div>

          {/* Extracted Field & Value */}
          <div className="space-y-1.5 bg-muted/30 p-3.5 rounded-xl border border-border/60">
            <div className="text-[11px] font-bold uppercase text-muted-foreground tracking-wider">
              Extracted Attribute
            </div>
            <div className="text-sm font-semibold text-foreground">{record.field}</div>
            <div className="mt-2 text-xs text-muted-foreground">Extracted Value:</div>
            <div className="font-mono text-sm font-bold text-foreground bg-card p-2 rounded-lg border border-border/70 break-all">
              {record.extractedValue || "—"}
            </div>
          </div>

          {/* Evidence Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Quote className="w-3.5 h-3.5 text-gold-600" /> Exact Document Snippet
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopySnippet}
                className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                {copied ? "Copied" : "Copy"}
              </Button>
            </div>
            <div className="relative bg-muted/40 p-4 rounded-xl border-l-4 border-gold border-y border-r border-border/70 text-xs text-foreground font-mono leading-relaxed whitespace-pre-wrap">
              {record.evidenceSnippet || "No explicit text excerpt captured for this item."}
            </div>
          </div>

          {/* Document Citation */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-500" /> Source Citation
            </div>
            <Card className="border border-border/60 bg-card p-3 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Original Document:</span>
                <span className="font-semibold text-foreground truncate max-w-[240px]" title={record.originalFileName}>
                  {record.originalFileName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Page Number:</span>
                <span className="font-bold text-foreground">Page {record.sourcePage}</span>
              </div>
            </Card>
          </div>

          {/* Audit Advice Notice */}
          <div className="p-3 rounded-xl bg-gold/10 border border-gold/30 text-xs text-charcoal-800 dark:text-gold-200 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-gold-600 shrink-0 mt-0.5" />
            <span>
              All quotation extractions are strictly grounded in page-level OCR text. Verification status is deterministically computed to ensure total mathematical and commercial truth.
            </span>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border/60 bg-muted/30 flex items-center justify-between gap-3">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Close Inspector
          </Button>
          {onOpenPdfPage && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onOpenPdfPage(record.vendorId, record.sourcePage)}
              className="text-xs bg-gold hover:bg-gold-600 text-charcoal-950 font-semibold"
            >
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              Open PDF at Page {record.sourcePage}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
