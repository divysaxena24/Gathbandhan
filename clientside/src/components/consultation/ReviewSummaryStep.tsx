'use client';

// ============================================================
// Gathbandhan — Step 14: Review Plan & Budget Summary
// Comprehensive overview with live budget calculation & PDF generator
// ============================================================

import React, { useState } from 'react';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/ui/StepNavigation';
import { calculateWeddingBudget } from '@/lib/services/budget-calculator';
import { formatPaise, formatPaiseShort } from '@/lib/money';
import {
  Sparkles,
  FileText,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  CheckCircle,
  Download,
  Share2,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Send,
} from 'lucide-react';

export default function ReviewSummaryStep() {
  const { state, goToStep } = useConsultation();
  const { selections } = state;

  const budget = calculateWeddingBudget(selections);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadName, setLeadName] = useState(selections.contactName || '');
  const [leadEmail, setLeadEmail] = useState(selections.contactEmail || '');
  const [leadPhone, setLeadPhone] = useState(selections.contactPhone || '');
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalReady, setProposalReady] = useState(false);

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || (!leadEmail && !leadPhone)) return;
    setLeadCaptured(true);
  };

  const handleGenerateProposal = () => {
    setGeneratingProposal(true);
    setTimeout(() => {
      setGeneratingProposal(false);
      setProposalReady(true);
    }, 1200);
  };

  return (
    <div className="step-container">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-8 h-px bg-gradient-to-r from-transparent to-gold" />
          <Sparkles className="w-5 h-5 text-gold fill-gold/30" />
          <div className="w-8 h-px bg-gradient-to-l from-transparent to-gold" />
        </div>
        <h2 className="font-heading text-3xl md:text-5xl font-bold text-maroon-deep mb-3">
          Your Bespoke Wedding Plan
        </h2>
        <p className="text-warm-gray max-w-xl mx-auto">
          Here is your comprehensive wedding consultation summary and transparent cost estimation.
        </p>
      </div>

      {/* Hero Budget Card */}
      <div className="mb-8 p-6 md:p-8 rounded-3xl bg-gradient-to-br from-maroon-deep via-maroon to-maroon-deep text-soft-white shadow-xl border border-gold/30 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gold/20">
            <div>
              <span className="text-xs uppercase tracking-widest text-gold-light font-semibold">
                Estimated Total Investment
              </span>
              <div className="font-heading text-3xl sm:text-5xl font-bold text-soft-white mt-1">
                {formatPaise(budget.grandTotalInPaise)}
              </div>
              <p className="text-xs text-soft-white/70 mt-1">
                Inclusive of 18% GST ({formatPaise(budget.taxesInPaise)}) & 5% Contingency Buffer ({formatPaise(budget.contingencyInPaise)})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {!proposalReady ? (
                <button
                  type="button"
                  onClick={handleGenerateProposal}
                  disabled={generatingProposal}
                  className="px-6 py-3 rounded-full bg-gold hover:bg-gold-light text-maroon-deep font-bold text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  {generatingProposal ? 'Generating Proposal...' : 'Create Luxury Proposal'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-6 py-3 rounded-full bg-soft-white text-maroon font-bold text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Print / Save PDF
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
            <div>
              <span className="text-gold-light block">Tradition</span>
              <span className="font-semibold text-soft-white uppercase">{selections.weddingType || 'Custom'}</span>
            </div>
            <div>
              <span className="text-gold-light block">Ceremonies</span>
              <span className="font-semibold text-soft-white">
                {(selections.selectedCeremonies?.length || 0) + (selections.customCeremonies?.length || 0)} Selected
              </span>
            </div>
            <div>
              <span className="text-gold-light block">Location</span>
              <span className="font-semibold text-soft-white capitalize">
                {selections.destinationCity || selections.destination || 'Not Decided'}
              </span>
            </div>
            <div>
              <span className="text-gold-light block">Estimated Guests</span>
              <span className="font-semibold text-soft-white">{selections.totalGuests || '250'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Cost Breakdown */}
      <div className="mb-8 p-6 md:p-8 rounded-2xl bg-soft-white border border-gold/20 shadow-sm">
        <h3 className="font-heading font-semibold text-xl text-maroon-deep mb-5 flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-gold" />
          Itemised Cost Breakdown
        </h3>

        <div className="divide-y divide-gold/10">
          {budget.lines.map((line, idx) => (
            <div key={idx} className="py-3.5 flex items-center justify-between gap-4 text-xs sm:text-sm">
              <div>
                <span className="text-[11px] font-semibold text-gold-dark uppercase tracking-wider block">
                  {line.category}
                </span>
                <span className="font-medium text-charcoal">{line.serviceName}</span>
              </div>
              <div className="text-right flex-shrink-0">
                <span className="font-heading font-bold text-maroon-deep">
                  {formatPaise(line.totalPriceInPaise)}
                </span>
                <span className="block text-[10px] text-warm-gray uppercase tracking-wider">
                  {line.priceType}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-4 border-t-2 border-gold/30 flex justify-between items-center text-sm font-bold text-maroon-deep">
          <span>Subtotal (Direct Services)</span>
          <span>{formatPaise(budget.subtotalInPaise)}</span>
        </div>
      </div>

      {/* Selected Ceremonies Overview */}
      <div className="mb-8 p-6 md:p-8 rounded-2xl bg-soft-white border border-gold/20 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-xl text-maroon-deep flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gold" />
            Curated Ceremonies Timeline
          </h3>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="text-xs font-semibold text-gold-dark hover:text-maroon transition-colors"
          >
            Edit Ceremonies
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {selections.selectedCeremonies?.map((c, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-ivory/80 border border-gold/20 flex items-center justify-between">
              <div>
                <h5 className="font-heading font-semibold text-sm text-maroon-deep">{c.ceremonyName}</h5>
                <span className="text-[11px] text-warm-gray">Assigned to Day {c.eventDay || 1}</span>
              </div>
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
            </div>
          ))}
          {selections.customCeremonies?.map((c, i) => (
            <div key={i} className="p-3.5 rounded-xl bg-ivory/80 border border-gold/20 flex items-center justify-between">
              <div>
                <h5 className="font-heading font-semibold text-sm text-maroon-deep">{c.name} (Custom)</h5>
                <span className="text-[11px] text-warm-gray">Day {c.eventDay || 1}</span>
              </div>
              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>

      {/* Lead Capture & Royal Knot Connection */}
      <div className="p-6 md:p-8 rounded-3xl bg-cream/70 border border-gold/30 shadow-md mb-8">
        {!leadCaptured ? (
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-6 h-6 text-gold" />
              <h3 className="font-heading font-bold text-2xl text-maroon-deep">
                Connect with The Royal Knot Concierge
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-warm-gray mb-6">
              Receive your bespoke proposal PDF, lock in preferred dates, and schedule a complimentary 1-on-1 consultation with our senior wedding designers.
            </p>

            <form onSubmit={handleLeadSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                required
                placeholder="Couple / Contact Name *"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-soft-white"
              />
              <input
                type="email"
                placeholder="Email Address"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-soft-white"
              />
              <input
                type="tel"
                placeholder="Phone / WhatsApp Number *"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-soft-white"
              />
              <div className="sm:col-span-3 flex justify-end mt-2">
                <button
                  type="submit"
                  className="px-8 py-3 rounded-full bg-maroon hover:bg-maroon-deep text-soft-white font-bold text-sm transition-all shadow-md flex items-center gap-2"
                >
                  <Send className="w-4 h-4 text-gold-light" />
                  Request Full Proposal & Dates
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-4 space-y-2 animate-[fadeIn_0.3s_ease]">
            <CheckCircle className="w-12 h-12 text-gold mx-auto" />
            <h4 className="font-heading font-bold text-xl text-maroon-deep">
              Thank You! Your Consultation Is Saved.
            </h4>
            <p className="text-xs text-warm-gray max-w-md mx-auto">
              Our lead consultant at The Royal Knot has received your wedding plan. We will get in touch shortly to assist with venue bookings and vendor coordination.
            </p>
          </div>
        )}
      </div>

      {/* Final Step Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gold/20">
        <button
          type="button"
          onClick={() => goToStep(state.currentStepIndex - 1)}
          className="px-5 py-2.5 rounded-full border border-gold/30 text-xs font-semibold text-warm-gray hover:bg-cream/40 transition-colors"
        >
          Back to Adjust Selections
        </button>

        <a
          href="/"
          className="px-6 py-2.5 rounded-full bg-maroon text-soft-white text-xs font-semibold hover:bg-maroon-deep transition-all shadow"
        >
          Finish & Return Home
        </a>
      </div>
    </div>
  );
}
