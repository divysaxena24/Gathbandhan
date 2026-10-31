"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  ShieldCheck,
  Clock,
  Building,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CheckInStatus, PublicVendorPass } from "@/modules/control-room/types";

export default function PublicVendorCheckInPage() {
  const params = useParams();
  const token = params?.token as string;

  const [pass, setPass] = useState<PublicVendorPass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [crewName, setCrewName] = useState("");

  const fetchPass = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch(`/api/check-in/${token}`);
      const json = await res.json();
      if (json.success) {
        setPass(json.data);
      } else {
        setError(json.error?.message || "Invalid or expired check-in token");
      }
    } catch {
      setError("Unable to connect to gate control server. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPass();
  }, [fetchPass]);

  const handleTransition = async (newStatus: CheckInStatus) => {
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/check-in/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          notes: notes || undefined,
          checkedInBy: crewName || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setPass(json.data);
      } else {
        setError(json.error?.message || "Failed to update status");
      }
    } catch {
      setError("Network error while submitting gate check-in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatIST = (isoString?: string | null) => {
    if (!isoString) return "";
    return new Date(isoString).toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand/15 flex items-center justify-center p-4">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-serif text-charcoal/70">
            Verifying Gathbandhan Gate Clearance...
          </p>
        </div>
      </div>
    );
  }

  if (error || !pass) {
    return (
      <div className="min-h-screen bg-sand/15 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-6 rounded-2xl border border-sand/40 shadow-md text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-status-critical/15 text-status-critical flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl font-bold text-charcoal">
            Gate Pass Not Found
          </h2>
          <p className="text-xs text-charcoal/70">
            {error || "This check-in link is invalid or has expired. Please contact the wedding control room coordinator."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand/15 py-8 px-4 flex justify-center">
      <div className="max-w-md w-full space-y-4">
        {/* Header Branding */}
        <div className="text-center space-y-1">
          <div className="font-serif text-xl font-bold text-charcoal tracking-wide flex items-center justify-center gap-1.5">
            <span className="text-gold">✦</span>
            <span>GATHBANDHAN</span>
            <span className="text-gold">✦</span>
          </div>
          <p className="text-[11px] uppercase tracking-wider text-charcoal/60 font-semibold">
            Palace Gate Clearance & Vendor Check-in
          </p>
        </div>

        {/* Gate Clearance Pass Card */}
        <div className="bg-white rounded-2xl border border-sand/60 shadow-lg overflow-hidden">
          {/* Top Banner */}
          <div className="bg-charcoal text-white p-5 text-center relative">
            <div className="text-xs uppercase tracking-wider text-gold font-semibold">
              Official Vendor Pass
            </div>
            <h1 className="font-serif text-2xl font-bold mt-1">
              {pass.vendorName}
            </h1>
            <div className="inline-block mt-2 px-3 py-0.5 rounded-full bg-gold/20 text-gold text-xs font-semibold">
              {pass.category}
            </div>
          </div>

          {/* Details Body */}
          <div className="p-5 space-y-4 text-xs">
            <div className="p-3 bg-ivory rounded-xl border border-sand/40 space-y-2">
              <div className="flex items-start gap-2">
                <Building className="w-4 h-4 text-gold shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-charcoal">{pass.weddingTitle}</div>
                  <div className="text-charcoal/60">
                    {pass.eventName || "Wedding Celebration"} • {pass.weddingVenue || pass.eventVenue}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1 border-t border-sand/30">
                <Clock className="w-4 h-4 text-gold shrink-0" />
                <div className="text-charcoal/80">
                  Expected Arrival:{" "}
                  <strong className="text-charcoal font-mono">
                    {formatIST(pass.expectedArrivalAt)} IST
                  </strong>{" "}
                  <span className="text-charcoal/50">(+{pass.graceMinutes}m grace)</span>
                </div>
              </div>
            </div>

            {/* Current Gate Status Badge */}
            <div className="text-center py-2">
              <div className="text-[11px] text-charcoal/50 uppercase tracking-wider font-semibold mb-1">
                Current Status
              </div>
              <div className="inline-flex items-center gap-2 text-sm font-bold px-4 py-1.5 rounded-full bg-sand/30 text-charcoal border border-sand">
                <span
                  className={`w-2.5 h-2.5 rounded-full ${
                    ["ARRIVED", "SETUP_COMPLETE", "WORKING"].includes(pass.status)
                      ? "bg-status-success animate-pulse"
                      : pass.status === "COMPLETED"
                      ? "bg-charcoal"
                      : "bg-status-warning"
                  }`}
                />
                <span>{pass.status.replace("_", " ")}</span>
              </div>
              {pass.arrivedAt && (
                <div className="text-[11px] text-status-success mt-1 font-medium">
                  ✓ Gate checked in at {formatIST(pass.arrivedAt)} IST
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              {pass.allowedActions.includes("ARRIVED") && (
                <Button
                  size="lg"
                  className="w-full h-12 bg-status-success hover:bg-status-success/90 text-white font-semibold text-sm gap-2 shadow-md"
                  onClick={() => handleTransition("ARRIVED")}
                  disabled={isSubmitting}
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>I Have Arrived at Gate</span>
                </Button>
              )}

              {pass.allowedActions.includes("SETUP_COMPLETE") && (
                <Button
                  size="lg"
                  className="w-full h-12 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-sm gap-2 shadow-md"
                  onClick={() => handleTransition("SETUP_COMPLETE")}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Equipment Setup Complete & Ready</span>
                </Button>
              )}

              {pass.allowedActions.includes("WORKING") && (
                <Button
                  size="lg"
                  className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm gap-2 shadow-md"
                  onClick={() => handleTransition("WORKING")}
                  disabled={isSubmitting}
                >
                  <ArrowRight className="w-5 h-5" />
                  <span>Commenced Active Shift / Work</span>
                </Button>
              )}

              {pass.allowedActions.includes("COMPLETED") && (
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full h-12 border-charcoal/30 text-charcoal font-semibold text-sm gap-2"
                  onClick={() => handleTransition("COMPLETED")}
                  disabled={isSubmitting}
                >
                  <CheckCircle2 className="w-5 h-5 text-status-success" />
                  <span>Pack-down / Shift Finished</span>
                </Button>
              )}

              {pass.status === "COMPLETED" && (
                <div className="p-4 bg-status-success/10 border border-status-success/30 rounded-xl text-center text-status-success">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1" />
                  <div className="font-semibold text-sm">Service Completed</div>
                  <div className="text-[11px] text-charcoal/60 mt-0.5">
                    Thank you for your service at the Sharma Royal Wedding.
                  </div>
                </div>
              )}
            </div>

            {/* Crew check-in input */}
            {pass.status === "EXPECTED" || pass.status === "LATE" ? (
              <div className="space-y-2 pt-2 border-t border-sand/30">
                <div>
                  <label className="text-[11px] font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                    On-Site Team Lead Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar (Lead Florist)"
                    value={crewName}
                    onChange={(e) => setCrewName(e.target.value)}
                    className="w-full text-xs border border-sand rounded-lg p-2 bg-white text-charcoal"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-charcoal/70 uppercase tracking-wider block mb-1">
                    Gate Check-in Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 2 transport trucks cleared through South Gate"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-xs border border-sand rounded-lg p-2 bg-white text-charcoal"
                  />
                </div>
              </div>
            ) : null}
          </div>

          {/* Footer Security Seal */}
          <div className="bg-ivory p-3 text-center border-t border-sand/30 text-[10px] text-charcoal/50 flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-gold" />
            <span>Cryptographically Verified Pass • Hash Token Authentication</span>
          </div>
        </div>
      </div>
    </div>
  );
}
