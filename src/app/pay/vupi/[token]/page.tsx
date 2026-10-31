"use client";

import React, { useState, useEffect, use } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Copy,
  Check,
  Building2,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatINR } from "@/lib/money";

interface SessionDetails {
  id: string;
  sessionToken: string;
  billId: string;
  billTitle: string;
  billNumber: string;
  coupleName: string;
  paymentType: "INSTALLMENT" | "FULL_BALANCE";
  installmentId: string | null;
  installmentTitle: string | null;
  amountPaise: string;
  status: "PENDING" | "COMPLETED" | "EXPIRED" | "FAILED";
  qrPayload: string;
  expiresAt: string;
}

interface PaymentSuccessData {
  id: string;
  virtualUtr: string;
  amountPaise: string;
  payerVpa: string;
  createdAt: string;
}

export default function VirtualUpiCheckoutPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const resolvedParams = use(params);
  const token = resolvedParams.token;

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionDetails | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Payment Form States
  const [payerVpa, setPayerVpa] = useState("client@oksbi");
  const [payerName, setPayerName] = useState("Divya Saxena");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [successData, setSuccessData] = useState<PaymentSuccessData | null>(null);
  const [copiedUtr, setCopiedUtr] = useState(false);

  useEffect(() => {
    async function loadSession() {
      try {
        setLoading(true);
        const res = await fetch(`/api/payments/vupi/session?token=${encodeURIComponent(token)}`);
        const json = await res.json();
        if (json.data) {
          setSession(json.data);
          if (json.data.coupleName) {
            setPayerName(json.data.coupleName);
          }
        } else {
          setErrorMessage(json.error?.message || "Failed to load payment session");
        }
      } catch (err: any) {
        setErrorMessage(err.message || "Failed to connect to payment server");
      } finally {
        setLoading(false);
      }
    }
    loadSession();
  }, [token]);

  const handleSimulatePayment = async () => {
    if (!session) return;
    setIsProcessing(true);
    setProcessingStep("Verifying simulated UPI session...");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProcessingStep("Executing virtual ledger settlement...");

      const res = await fetch("/api/payments/vupi/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken: session.sessionToken,
          payerVpa: payerVpa.trim(),
          payerName: payerName.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok || json.error) {
        throw new Error(json.error?.message || "Payment processing failed");
      }

      await new Promise((r) => setTimeout(r, 500));
      setProcessingStep("Finalizing transaction & generating virtual UTR...");
      await new Promise((r) => setTimeout(r, 400));

      setSuccessData(json.data);
    } catch (err: any) {
      setErrorMessage(err.message || "An error occurred during simulated payment");
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  };

  const copyUtr = (utr: string) => {
    navigator.clipboard.writeText(utr);
    setCopiedUtr(true);
    setTimeout(() => setCopiedUtr(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-900 text-stone-100 flex flex-col justify-between py-6 px-4 sm:px-6">
      {/* Top Banner: SIMULATED PAYMENT DISCLAIMER */}
      <div className="max-w-md w-full mx-auto mb-4 bg-amber-500/15 border border-amber-500/40 rounded-xl p-3 text-center">
        <div className="flex items-center justify-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
          <ShieldAlert className="h-4 w-4" />
          SIMULATED PAYMENT — NO REAL MONEY TRANSFERRED
        </div>
        <p className="text-[11px] text-amber-200/80 mt-0.5">
          Virtual simulation sandbox only. No real UPI rails, NPCI or bank accounts are accessed.
        </p>
      </div>

      {/* Main Card */}
      <div className="max-w-md w-full mx-auto bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Brand Header */}
        <div className="bg-gradient-to-r from-stone-900 to-stone-950 p-6 border-b border-stone-800 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-widest text-amber-500 font-medium">
              Gathbandhan
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Virtual UPI Pay
              <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                Demo Sandbox
              </Badge>
            </h1>
          </div>
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Smartphone className="h-5 w-5" />
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6">
          {loading ? (
            <div className="py-16 text-center space-y-3">
              <div className="animate-spin h-8 w-8 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
              <p className="text-xs text-stone-400">Loading secure virtual checkout...</p>
            </div>
          ) : errorMessage && !session ? (
            <div className="py-12 text-center space-y-4">
              <div className="h-12 w-12 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-semibold text-rose-400">Payment Session Invalid</h3>
                <p className="text-xs text-stone-400 mt-1 max-w-xs mx-auto">{errorMessage}</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-stone-700 text-stone-300 hover:bg-stone-800"
                onClick={() => window.close()}
              >
                Close Window
              </Button>
            </div>
          ) : successData ? (
            /* SUCCESS CONFIRMATION STATE */
            <div className="py-6 text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
              <div className="h-16 w-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                <CheckCircle2 className="h-9 w-9 text-emerald-400" />
              </div>

              <div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-widest">
                  Transaction Approved
                </span>
                <h2 className="text-2xl font-bold text-white mt-1">
                  {formatINR(BigInt(successData.amountPaise))}
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Virtual settlement completed for {session?.coupleName}
                </p>
              </div>

              {/* Virtual UTR Box */}
              <div className="bg-stone-900/90 border border-stone-800 rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-400">
                  <span>Virtual UTR Reference:</span>
                  <button
                    onClick={() => copyUtr(successData.virtualUtr)}
                    className="flex items-center gap-1 text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    {copiedUtr ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedUtr ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <div className="font-mono text-sm font-bold text-amber-400 tracking-wider">
                  {successData.virtualUtr}
                </div>
                <div className="text-[11px] text-stone-500 border-t border-stone-800 pt-2 flex justify-between">
                  <span>Payer UPI: {successData.payerVpa}</span>
                  <span>{new Date(successData.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2.5 pt-2">
                <a
                  href={`/api/payments/vupi/receipt/${successData.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-100 font-medium text-xs border border-stone-700 transition-all shadow"
                >
                  <Download className="h-4 w-4 text-amber-400" />
                  Download PDF Receipt
                </a>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-stone-800 text-stone-400 hover:bg-stone-900 text-xs"
                  onClick={() => {
                    if (window.opener) {
                      window.close();
                    } else {
                      window.location.href = "/client/portal";
                    }
                  }}
                >
                  Return to Client Portal
                </Button>
              </div>
            </div>
          ) : session ? (
            /* PAYMENT CHECKOUT FORM */
            <div className="space-y-5">
              {/* Bill Details */}
              <div className="bg-stone-900/70 border border-stone-800/80 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-amber-400/90">{session.billNumber}</span>
                  <Badge variant="outline" className="text-[10px] border-stone-700 text-stone-300">
                    {session.paymentType === "FULL_BALANCE"
                      ? "Full Balance"
                      : session.installmentTitle || "Advance Payment"}
                  </Badge>
                </div>
                <h3 className="font-semibold text-stone-200 text-sm line-clamp-1">
                  {session.billTitle}
                </h3>
                <div className="text-xs text-stone-400 flex items-center justify-between pt-1 border-t border-stone-800">
                  <span>Client / Couple:</span>
                  <span className="font-medium text-stone-300">{session.coupleName}</span>
                </div>
              </div>

              {/* Non-Editable Locked Amount */}
              <div className="bg-gradient-to-br from-amber-500/10 via-stone-900/80 to-stone-900 border border-amber-500/30 rounded-xl p-4 text-center">
                <div className="text-[11px] uppercase tracking-wider text-amber-400/90 font-medium">
                  Total Payable (Simulated)
                </div>
                <div className="text-3xl font-extrabold text-white mt-1 tracking-tight">
                  {formatINR(BigInt(session.amountPaise))}
                </div>
                <div className="text-[10px] text-stone-400 mt-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="h-3 w-3 text-emerald-400" />
                  Amount verified & locked by Gathbandhan server
                </div>
              </div>

              {/* UPI ID Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Virtual Payer UPI ID
                  </label>
                  <Input
                    value={payerVpa}
                    onChange={(e) => setPayerVpa(e.target.value)}
                    placeholder="name@oksbi"
                    className="bg-stone-900 border-stone-800 text-stone-200 text-xs focus:ring-amber-500"
                    disabled={isProcessing}
                  />
                  {/* Quick Preset Handles */}
                  <div className="flex gap-1.5 mt-1.5 overflow-x-auto pb-1 text-[11px]">
                    {["@oksbi", "@okhdfcbank", "@paytm", "@vupi"].map((handle) => (
                      <button
                        key={handle}
                        type="button"
                        onClick={() => {
                          const prefix = payerVpa.includes("@") ? payerVpa.split("@")[0] : payerVpa || "client";
                          setPayerVpa(`${prefix}${handle}`);
                        }}
                        className="px-2 py-0.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 text-stone-400 text-[10px] transition-colors"
                      >
                        {handle}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-stone-300 mb-1">
                    Payer Name
                  </label>
                  <Input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    placeholder="Payer Name"
                    className="bg-stone-900 border-stone-800 text-stone-200 text-xs focus:ring-amber-500"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Error feedback if any */}
              {errorMessage && (
                <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Pay Action Button */}
              <Button
                onClick={handleSimulatePayment}
                disabled={isProcessing || !payerVpa.trim()}
                className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-stone-950 font-bold py-3 text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-stone-950 border-t-transparent rounded-full" />
                    <span>{processingStep || "Processing..."}</span>
                  </>
                ) : (
                  <>
                    <span>Pay {formatINR(BigInt(session.amountPaise))} (Simulated)</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="text-center text-[11px] text-stone-500 mt-4">
        © {new Date().getFullYear()} Gathbandhan Technologies. All payments are strictly virtual simulations.
      </div>
    </div>
  );
}
