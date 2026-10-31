"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Sparkles, Check, Copy, ChevronUp, ChevronDown, Bot, Crown, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiAdviceDisplayProps {
  content: string;
  onClose?: () => void;
}

export function AiAdviceDisplay({ content, onClose }: AiAdviceDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  // Pre-process markdown to normalize line breaks inside table cells
  const formattedContent = content
    .replace(/<br\s*\/?>/gi, "\n\n")
    .replace(/&nbsp;/gi, " ");

  return (
    <div className="mt-6 rounded-3xl bg-gradient-to-b from-white via-soft-white to-ivory/50 border-2 border-gold/40 shadow-xl overflow-hidden transition-all duration-300">
      {/* Top Luxury Banner */}
      <div className="px-6 py-4 bg-gradient-to-r from-maroon-deep via-maroon to-maroon-deep text-soft-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gold/40">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gold/20 flex items-center justify-center border border-gold/50 shadow-inner">
            <Sparkles className="w-4 h-4 text-gold-light" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading font-bold text-sm tracking-wide text-ivory">
                Gathbandhan AI Wedding Blueprint
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-gold/25 text-gold-light border border-gold/40">
                Curated
              </span>
            </div>
            <p className="text-[11px] text-warm-gray-light">
              Personalized cultural sequencing, Vedic significance & luxury execution notes
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className="h-8 px-3 text-xs font-medium text-ivory hover:text-white hover:bg-white/10 gap-1.5 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Advice</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="h-8 w-8 p-0 text-ivory hover:text-white hover:bg-white/10"
            title={isCollapsed ? "Expand advice" : "Collapse advice"}
          >
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Main Content Body */}
      {!isCollapsed && (
        <div className="p-6 sm:p-8 space-y-6 text-charcoal">
          <div className="ai-markdown-prose text-xs sm:text-sm leading-relaxed text-charcoal/90">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                // Custom Table Styling
                table: ({ node, ...props }) => (
                  <div className="my-6 overflow-hidden rounded-2xl border border-gold/30 shadow-md bg-white">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[620px] text-left border-collapse" {...props} />
                    </div>
                  </div>
                ),
                thead: ({ node, ...props }) => (
                  <thead className="bg-gradient-to-r from-maroon/10 via-gold/15 to-maroon/10 border-b border-gold/30" {...props} />
                ),
                tbody: ({ node, ...props }) => (
                  <tbody className="divide-y divide-gold/15" {...props} />
                ),
                tr: ({ node, ...props }) => (
                  <tr className="hover:bg-gold/5 transition-colors even:bg-ivory/30" {...props} />
                ),
                th: ({ node, ...props }) => (
                  <th className="px-4 py-3.5 font-heading font-bold text-[11px] uppercase tracking-wider text-maroon-deep border-r border-gold/20 last:border-r-0" {...props} />
                ),
                td: ({ node, ...props }) => (
                  <td className="px-4 py-3 text-xs leading-relaxed text-charcoal/85 border-r border-gold/10 last:border-r-0 align-top" {...props} />
                ),

                // Custom Headings
                h1: ({ node, ...props }) => (
                  <h1 className="font-heading text-2xl font-bold text-maroon-deep mt-6 mb-3 flex items-center gap-2" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <div className="mt-8 mb-4 border-b border-gold/30 pb-2">
                    <h2 className="font-heading text-xl font-bold text-maroon-deep flex items-center gap-2" {...props} />
                  </div>
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="font-heading text-base font-bold text-maroon mt-5 mb-2.5 flex items-center gap-1.5" {...props} />
                ),

                // Paragraphs & Text
                p: ({ node, ...props }) => (
                  <p className="my-3 text-xs sm:text-sm text-charcoal-700 leading-relaxed" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-maroon-deep" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-warm-gray" {...props} />
                ),

                // Lists
                ul: ({ node, ...props }) => (
                  <ul className="space-y-2 my-3 pl-1 list-none" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="space-y-2 my-3 pl-4 list-decimal marker:text-gold marker:font-bold text-xs sm:text-sm" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="flex items-start gap-2.5 text-xs sm:text-sm text-charcoal-700 leading-relaxed">
                    <span className="text-gold font-bold text-xs mt-0.5 shrink-0">✦</span>
                    <span className="flex-1" {...props} />
                  </li>
                ),

                // Horizontal Rule
                hr: ({ node, ...props }) => (
                  <div className="my-8 relative flex items-center justify-center">
                    <div className="w-full border-t border-gold/25" />
                    <div className="absolute px-3 bg-soft-white text-gold text-xs font-serif">
                      ✦ ✦ ✦
                    </div>
                  </div>
                ),

                // Blockquotes
                blockquote: ({ node, ...props }) => (
                  <blockquote className="my-4 p-4 rounded-xl bg-gold/10 border-l-4 border-gold text-xs italic text-charcoal/90" {...props} />
                ),
              }}
            >
              {formattedContent}
            </ReactMarkdown>
          </div>

          {/* Footer Callout Banner */}
          <div className="mt-8 pt-6 border-t border-gold/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gold/10 -mx-6 -mb-6 sm:-mx-8 sm:-mb-8 p-6 rounded-b-3xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-maroon/15 flex items-center justify-center text-maroon shrink-0">
                <BookOpen className="w-4 h-4 text-maroon" />
              </div>
              <p className="text-xs text-charcoal-600 leading-snug">
                These rituals reflect authentic traditions. Explore and customize each ceremony in the catalog below.
              </p>
            </div>
            {onClose && (
              <Button
                size="sm"
                variant="outline"
                onClick={onClose}
                className="shrink-0 text-xs border-charcoal/20 hover:bg-maroon hover:text-white"
              >
                Done Reading
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

