'use client';

// ============================================================
// Gathbandhan — Step 14: Review Plan & Budget Summary
// Comprehensive overview with live budget calculation & PDF generator
// ============================================================

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useConsultation } from '@/hooks/useConsultation';
import StepNavigation from '@/components/consultation-ui/StepNavigation';
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
  AlertCircle,
} from 'lucide-react';

export default function ReviewSummaryStep() {
  const router = useRouter();
  const { user } = useUser();
  const [createdRequestId, setCreatedRequestId] = useState<string | null>(null);
  const { state, goToStep } = useConsultation();
  const { selections } = state;

  const budget = calculateWeddingBudget(selections);
  const [leadCaptured, setLeadCaptured] = useState(false);
  const [leadName, setLeadName] = useState(selections.contactName || '');
  const [leadEmail, setLeadEmail] = useState(selections.contactEmail || '');
  const [leadPhone, setLeadPhone] = useState(selections.contactPhone || '');
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [proposalReady, setProposalReady] = useState(false);

  const [submittingLead, setSubmittingLead] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Pre-fill contact details from Clerk if user is logged in
  useEffect(() => {
    if (user) {
      if (!leadName && user.fullName) {
        setLeadName(user.fullName);
      }
      if (!leadEmail && user.primaryEmailAddress?.emailAddress) {
        setLeadEmail(user.primaryEmailAddress.emailAddress);
      }
      if (!leadPhone && user.primaryPhoneNumber?.phoneNumber) {
        setLeadPhone(user.primaryPhoneNumber.phoneNumber);
      }
    }
  }, [user, leadName, leadEmail, leadPhone]);

  const handleLeadSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalName = (leadName || user?.fullName || selections.contactName || '').trim();
    const finalEmail = (leadEmail || user?.primaryEmailAddress?.emailAddress || selections.contactEmail || '').trim();
    const finalPhone = (leadPhone || user?.primaryPhoneNumber?.phoneNumber || selections.contactPhone || '').trim();

    if (!finalName) {
      setSubmitError("Please provide your name or couple's name.");
      const input = document.getElementById("leadNameInput");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!finalEmail && !finalPhone) {
      setSubmitError("Please provide an email address or WhatsApp phone number so the organizers can reach you.");
      const input = document.getElementById("leadEmailInput");
      if (input) {
        input.focus();
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setSubmittingLead(true);
    setSubmitError(null);
    try {
      const res = await fetch("/api/booking-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadName: finalName,
          leadEmail: finalEmail,
          leadPhone: finalPhone,
          preferredContactMethod: selections.preferredContactMethod || "whatsapp",
          selections,
          budget,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.bookingRequestId) {
        setCreatedRequestId(data.bookingRequestId);
        setLeadCaptured(true);
        if (typeof window !== "undefined") {
          sessionStorage.setItem("activeBookingRequestId", data.bookingRequestId);
          localStorage.setItem("activeBookingRequestId", data.bookingRequestId);
        }
        setTimeout(() => {
          router.push(`/client/portal?requestId=${data.bookingRequestId}`);
        }, 1200);
      } else {
        setSubmitError(data.error || "Failed to submit consultation. Please try again.");
      }
    } catch {
      setSubmitError("Connection error. Please try again.");
    } finally {
      setSubmittingLead(false);
    }
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
            <p className="text-xs sm:text-sm text-warm-gray mb-4">
              Submit your bespoke plan directly to the Gathbandhan planning team. We lock in preferred dates, check luxury venue availability, and schedule your private consultation.
            </p>

            {submitError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            <form onSubmit={handleLeadSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                id="leadNameInput"
                type="text"
                required
                placeholder="Couple / Contact Name *"
                value={leadName}
                onChange={(e) => setLeadName(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-soft-white"
              />
              <input
                id="leadEmailInput"
                type="email"
                placeholder="Email Address"
                value={leadEmail}
                onChange={(e) => setLeadEmail(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-soft-white"
              />
              <input
                id="leadPhoneInput"
                type="tel"
                placeholder="Phone / WhatsApp Number *"
                value={leadPhone}
                onChange={(e) => setLeadPhone(e.target.value)}
                className="px-4 py-3 rounded-xl border border-gold/30 text-sm focus:outline-none focus:ring-2 focus:ring-gold bg-soft-white"
              />
              <div className="sm:col-span-3 flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={submittingLead}
                  className="px-8 py-3 rounded-full bg-maroon hover:bg-maroon-deep disabled:opacity-60 text-soft-white font-bold text-sm transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-gold-light" />
                  {submittingLead ? "Submitting to Organizers..." : "Submit 14-Step Wedding Plan"}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3 animate-[fadeIn_0.3s_ease]">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto border border-emerald-300">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h4 className="font-heading font-bold text-2xl text-maroon-deep">
              Thank You! Your Wedding Consultation Is Saved & Awaiting Review.
            </h4>
            <p className="text-sm text-warm-gray max-w-md mx-auto">
              Our wedding designer is reviewing your 14-step plan. We are redirecting you to your dedicated Client Wedding Portal...
            </p>
            <div className="pt-2">
              <Link
                href={createdRequestId ? `/client/portal?requestId=${createdRequestId}` : "/client/portal"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-maroon hover:bg-maroon-deep text-soft-white font-bold text-sm shadow-md transition-all"
              >
                <span>Enter Your Wedding Portal Now</span>
                <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
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

        {!leadCaptured ? (
          <button
            type="button"
            onClick={() => handleLeadSubmit()}
            disabled={submittingLead}
            className="px-8 py-3 rounded-full bg-maroon hover:bg-maroon-deep disabled:opacity-60 text-soft-white text-sm font-bold transition-all shadow-md hover:shadow-lg flex items-center gap-2 cursor-pointer"
          >
            {submittingLead ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Sending to Organizer...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4 text-gold-light" />
                <span>Submit Wedding Plan to Organizer</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        ) : (
          <Link
            href={createdRequestId ? `/client/portal?requestId=${createdRequestId}` : "/client/portal"}
            className="px-8 py-3 rounded-full bg-emerald-700 text-soft-white text-sm font-bold hover:bg-emerald-800 transition-all shadow-md flex items-center gap-2"
          >
            <span>Enter Your Wedding Portal</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
