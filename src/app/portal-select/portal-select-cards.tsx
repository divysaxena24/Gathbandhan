"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useClerk } from "@clerk/nextjs";
import {
  Building2,
  Heart,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldAlert,
  AlertTriangle,
  LogOut,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { PRIMARY_ADMIN_EMAIL } from "@/lib/auth/admin-whitelist";

interface PortalSelectCardsProps {
  currentRole?: string | null;
  activeBookingRequestId?: string | null;
  activeWeddingId?: string | null;
  isAdminAllowed?: boolean;
  userEmail?: string;
}

export function PortalSelectCards({
  currentRole,
  activeBookingRequestId,
  activeWeddingId,
  isAdminAllowed = false,
  userEmail = "",
}: PortalSelectCardsProps) {
  const router = useRouter();
  const { signOut } = useClerk();
  const [loadingRole, setLoadingRole] = useState<string | null>(null);
  const [warningOpen, setWarningOpen] = useState(false);

  const clientDestination = activeBookingRequestId || activeWeddingId
    ? "/client/portal"
    : "/plan-your-wedding";

  const handleSelectRole = async (targetRole: "CLIENT" | "PLANNER", destination: string) => {
    // If attempting to enter admin workspace without admin authorization, intercept and warn
    if (targetRole === "PLANNER" && !isAdminAllowed) {
      setWarningOpen(true);
      return;
    }

    setLoadingRole(targetRole);
    try {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("gathbandhan_role", targetRole);
        localStorage.setItem("gathbandhan_role", targetRole);
        document.cookie = `gathbandhan_role=${targetRole}; path=/; max-age=2592000; SameSite=Lax`;
      }
      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });
      router.push(destination);
    } catch {
      router.push(destination);
    } finally {
      setLoadingRole(null);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-4xl">
        {/* OPTION 1: Admin / Event Organizer */}
        <div
          className={`group relative rounded-3xl p-8 bg-white border-2 transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between ${
            isAdminAllowed
              ? "border-border/70 hover:border-gold/60"
              : "border-amber-200/80 bg-gradient-to-b from-white via-white to-amber-50/20"
          }`}
        >
          <div className="absolute top-5 right-5">
            {isAdminAllowed ? (
              <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-charcoal text-white">
                Admin / Organizer
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
                <Lock className="w-3 h-3 text-amber-700" />
                Restricted Access
              </span>
            )}
          </div>

          <div>
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 border transition-colors ${
                isAdminAllowed
                  ? "bg-charcoal/5 text-charcoal border-charcoal/10 group-hover:bg-gold/10 group-hover:text-gold"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isAdminAllowed ? <Building2 className="w-7 h-7" /> : <Lock className="w-7 h-7" />}
            </div>

            <h2 className="font-heading text-2xl font-bold text-charcoal mb-2">
              Event Organizer Portal
            </h2>
            <p className="text-xs text-charcoal-500 mb-6 leading-relaxed">
              For authorized wedding planners, operational directors, and agency managers.
            </p>

            {!isAdminAllowed && (
              <div className="mb-6 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    Admin access restricted. Only <strong>{PRIMARY_ADMIN_EMAIL}</strong> is authorized to enter.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => signOut({ redirectUrl: "/sign-in" })}
                  className="inline-flex items-center gap-1 text-[11px] text-amber-900 hover:text-maroon font-semibold underline pl-6 transition-colors"
                >
                  <LogOut className="w-3 h-3" />
                  Sign out to switch account
                </button>
              </div>
            )}

            <ul className="space-y-3 mb-8 text-xs text-charcoal-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Booking Requests:</strong> Live review of client consultation forms</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Live Control Room:</strong> Minute-by-minute timeline & QR check-ins</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Leads CRM:</strong> Inbound client proposals & pipeline tracking</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>AI Quotation Analyzer:</strong> PDF extraction & vendor comparisons</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span><strong>Finance & Ledger:</strong> Invoices, milestones, exact paise arithmetic</span>
              </li>
            </ul>
          </div>

          <Button
            size="lg"
            disabled={loadingRole !== null}
            onClick={() => handleSelectRole("PLANNER", "/dashboard")}
            className={`w-full h-12 font-semibold transition-all ${
              isAdminAllowed
                ? "bg-charcoal text-ivory hover:bg-charcoal-700 group-hover:bg-gold group-hover:text-maroon-deep"
                : "bg-amber-600/90 text-white hover:bg-amber-700"
            }`}
          >
            {loadingRole === "PLANNER" ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : isAdminAllowed ? (
              <>
                Enter Organizer Workspace
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Enter Organizer Workspace
              </>
            )}
          </Button>
        </div>

        {/* OPTION 2: Client / Event Host */}
        <div className="group relative rounded-3xl p-8 bg-gradient-to-b from-white via-soft-white to-ivory border-2 border-gold/40 hover:border-gold transition-all duration-300 shadow-sm hover:shadow-xl flex flex-col justify-between">
          <div className="absolute top-5 right-5">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gold text-maroon-deep">
              Client / Host
            </span>
          </div>

          <div>
            <div className="w-14 h-14 rounded-2xl bg-gold/15 flex items-center justify-center text-gold-600 mb-6 border border-gold/30 group-hover:scale-105 transition-transform">
              <Heart className="w-7 h-7 text-maroon fill-rose/20" />
            </div>

            <h2 className="font-heading text-2xl font-bold text-maroon-deep mb-2">
              Client Wedding Portal
            </h2>
            <p className="text-xs text-warm-gray mb-6 leading-relaxed">
              For couples, brides, grooms, and host families planning their celebration.
            </p>

            <ul className="space-y-3 mb-8 text-xs text-charcoal-600">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span><strong>14-Step Planning Wizard:</strong> Sacred ceremonies & traditions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span><strong>Dedicated Client Portal:</strong> Track review status & updates</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span><strong>Live Cost Estimator:</strong> Itemised budget & transparent pricing</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span><strong>Two-Way Communication:</strong> Message your assigned designer</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-gold shrink-0" />
                <span><strong>Agreements & RSVPs:</strong> Digital signing & guest tracker</span>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button
              size="lg"
              disabled={loadingRole !== null}
              onClick={() => handleSelectRole("CLIENT", clientDestination)}
              className="w-full bg-maroon hover:bg-maroon-deep text-soft-white h-12 font-semibold shadow-md"
            >
              {loadingRole === "CLIENT" ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 text-gold-light" />
                  {activeBookingRequestId || activeWeddingId
                    ? "Open My Wedding Portal"
                    : "Start Wedding Consultation"}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => handleSelectRole("CLIENT", "/client")}
              className="w-full text-center text-xs text-warm-gray hover:text-maroon font-medium py-1"
            >
              Explore Client Landing Page →
            </button>
          </div>
        </div>
      </div>

      {/* Warning Dialog when unauthorized user attempts to enter admin portal */}
      <Dialog open={warningOpen} onOpenChange={setWarningOpen}>
        <DialogContent className="sm:max-w-lg w-[calc(100%-2rem)] max-w-lg bg-white rounded-3xl p-6 sm:p-7 border-2 border-amber-300 shadow-2xl overflow-hidden">
          <DialogHeader className="space-y-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 mx-auto sm:mx-0 border border-amber-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <DialogTitle className="font-heading text-xl font-bold text-charcoal">
              Administrator Access Denied
            </DialogTitle>
            <DialogDescription className="text-xs text-charcoal-600 leading-relaxed">
              You are signed in as <strong className="text-charcoal font-semibold">{userEmail || "your account"}</strong>.
              <br />
              You do not have administrator access. Only authorized agency organizers (
              <span className="font-mono text-charcoal-800 font-semibold">{PRIMARY_ADMIN_EMAIL}</span>) can access the Admin Workspace.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed">
            Please proceed to the Client Portal to review your wedding consultations and proposals, or sign in with an authorized admin account.
          </div>

          <div className="flex flex-col gap-2.5 pt-3 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
              <Button
                variant="outline"
                onClick={() => setWarningOpen(false)}
                className="w-full text-xs h-9 rounded-xl border-gold/30 hover:bg-gold/10 text-charcoal font-medium"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  setWarningOpen(false);
                  handleSelectRole("CLIENT", clientDestination);
                }}
                className="w-full bg-maroon hover:bg-maroon-deep text-white text-xs font-semibold h-9 rounded-xl shadow-xs"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1.5 text-gold-light" />
                Go to Client Portal
              </Button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => signOut({ redirectUrl: "/sign-in" })}
              className="w-full text-xs text-warm-gray hover:text-maroon hover:bg-amber-50/80 border border-amber-200/80 rounded-xl h-9 flex items-center justify-center gap-1.5 mt-1"
            >
              <LogOut className="w-3.5 h-3.5 text-amber-700" />
              <span>Sign in with an authorized admin account</span>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
