"use client";

import React, { useState } from "react";
import {
  QrCode,
  Clock,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CheckInStatus, VendorCheckInRecord } from "@/modules/control-room/types";

interface VendorGateViewProps {
  checkIns: VendorCheckInRecord[];
  weddingId: string;
  onRefresh: () => void;
}

export function VendorGateView({
  checkIns,
  weddingId,
  onRefresh,
}: VendorGateViewProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedCheckIn, setSelectedCheckIn] = useState<VendorCheckInRecord | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isVerifyingLate, setIsVerifyingLate] = useState(false);
  const [lateNotice, setLateNotice] = useState<string | null>(null);

  const categories = [
    "ALL",
    ...Array.from(new Set(checkIns.map((c) => c.category))),
  ];

  const filteredCheckIns = checkIns.filter((c) => {
    const matchesCategory =
      selectedCategory === "ALL" || c.category === selectedCategory;
    const matchesSearch =
      c.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      c.category.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactName && c.contactName.toLowerCase().includes(search.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const arrivedCount = checkIns.filter((c) =>
    ["ARRIVED", "SETUP_COMPLETE", "WORKING", "COMPLETED"].includes(c.status)
  ).length;
  const lateCount = checkIns.filter((c) => c.status === "LATE").length;
  const expectedCount = checkIns.filter((c) => c.status === "EXPECTED").length;

  const handleRunLateCheck = async () => {
    setIsVerifyingLate(true);
    setLateNotice(null);
    try {
      const res = await fetch("/api/control-room/check-ins/verify-late", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId }),
      });
      const json = await res.json();
      if (json.success) {
        setLateNotice(
          `Evaluated ${json.data.evaluatedCount} vendors: ${json.data.newlyLateCount} newly flagged late, ${json.data.alertsGenerated} idempotent alerts generated.`
        );
        onRefresh();
      }
    } catch (err) {
      console.error("Failed to run late check:", err);
    } finally {
      setIsVerifyingLate(false);
    }
  };

  const handleManualStatusChange = async (
    checkInId: string,
    newStatus: CheckInStatus
  ) => {
    try {
      await fetch(`/api/control-room/check-ins/${checkInId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          source: "COORDINATOR_MANUAL",
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const getStatusBadge = (status: CheckInStatus) => {
    switch (status) {
      case "ARRIVED":
        return <Badge className="bg-blue-600/15 text-blue-800 border-blue-300">Arrived</Badge>;
      case "SETUP_COMPLETE":
        return <Badge className="bg-purple-600/15 text-purple-800 border-purple-300">Setup Done</Badge>;
      case "WORKING":
        return <Badge className="bg-status-success/15 text-status-success border-status-success/30">Active / Working</Badge>;
      case "COMPLETED":
        return <Badge className="bg-charcoal/15 text-charcoal border-charcoal/30">Completed</Badge>;
      case "LATE":
        return <Badge className="bg-status-critical/15 text-status-critical border-status-critical/30 animate-pulse">Late Alert</Badge>;
      case "NO_SHOW":
        return <Badge className="bg-status-critical text-white">No Show</Badge>;
      case "EXPECTED":
      default:
        return <Badge className="bg-sand/30 text-charcoal/70 border-sand">Expected</Badge>;
    }
  };

  const getPassUrl = (rawToken: string) => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/check-in/${rawToken}`;
    }
    return `/check-in/${rawToken}`;
  };

  const handleCopyPassUrl = (rawToken: string) => {
    const url = getPassUrl(rawToken);
    navigator.clipboard.writeText(url);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Counters & Action Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-lg bg-white border border-sand/40">
          <div className="text-xs font-medium text-charcoal/60">Total Assigned Vendors</div>
          <div className="text-2xl font-serif font-bold text-charcoal mt-1">
            {checkIns.length}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-sand/40">
          <div className="text-xs font-medium text-charcoal/60">Arrived & On-Site</div>
          <div className="text-2xl font-serif font-bold text-status-success mt-1">
            {arrivedCount}{" "}
            <span className="text-xs font-sans font-normal text-charcoal/50">
              ({checkIns.length > 0 ? Math.round((arrivedCount / checkIns.length) * 100) : 0}%)
            </span>
          </div>
        </div>

        <div
          className={`p-4 rounded-lg border ${
            lateCount > 0
              ? "bg-status-critical/10 border-status-critical/30"
              : "bg-white border-sand/40"
          }`}
        >
          <div className="text-xs font-medium text-charcoal/60 flex items-center gap-1">
            {lateCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-status-critical" />}
            <span>Late Arrivals</span>
          </div>
          <div
            className={`text-2xl font-serif font-bold mt-1 ${
              lateCount > 0 ? "text-status-critical" : "text-charcoal"
            }`}
          >
            {lateCount}
          </div>
        </div>

        <div className="p-4 rounded-lg bg-white border border-sand/40">
          <div className="text-xs font-medium text-charcoal/60">Pending Arrival</div>
          <div className="text-2xl font-serif font-bold text-gold mt-1">
            {expectedCount}
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-ivory rounded-lg border border-sand/40">
        <div className="flex items-center gap-2 flex-1 min-w-[260px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-charcoal/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor or contact person..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs border border-sand rounded-md pl-8 pr-3 py-1.5 bg-white text-charcoal focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-charcoal/50" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs border border-sand rounded-md p-1.5 bg-white text-charcoal"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-xs border-sand bg-white gap-1.5 hover:bg-cream"
            onClick={handleRunLateCheck}
            disabled={isVerifyingLate}
          >
            <Clock className={`w-3.5 h-3.5 text-status-warning ${isVerifyingLate ? "animate-spin" : ""}`} />
            <span>{isVerifyingLate ? "Checking Arrivals..." : "Run Late Detection"}</span>
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="text-xs border-sand bg-white gap-1.5 hover:bg-cream"
            onClick={onRefresh}
          >
            <RefreshCw className="w-3.5 h-3.5 text-charcoal/60" />
            <span>Refresh Roster</span>
          </Button>
        </div>
      </div>

      {lateNotice && (
        <div className="p-3 text-xs bg-status-warning/10 border border-status-warning/30 rounded-md text-charcoal flex items-center justify-between">
          <span>{lateNotice}</span>
          <button
            onClick={() => setLateNotice(null)}
            className="text-charcoal/50 hover:text-charcoal font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Vendor Table */}
      <div className="border border-sand/40 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-ivory border-b border-sand/40 text-charcoal/70 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Vendor & Scope</th>
                <th className="py-3 px-3">Expected Arrival (IST)</th>
                <th className="py-3 px-3">Grace</th>
                <th className="py-3 px-3">Gate Status</th>
                <th className="py-3 px-3">Arrival Timestamp</th>
                <th className="py-3 px-3">Source</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand/20">
              {filteredCheckIns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-charcoal/50">
                    No vendors match your search filters.
                  </td>
                </tr>
              ) : (
                filteredCheckIns.map((c) => (
                  <tr key={c.id} className="hover:bg-ivory/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal">{c.vendorName}</div>
                      <div className="text-[11px] text-charcoal/50 flex items-center gap-1.5 mt-0.5">
                        <span className="font-semibold text-gold">{c.category}</span>
                        {c.contactName && <span>• {c.contactName} ({c.contactPhone})</span>}
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono text-charcoal/80">
                      {new Date(c.expectedArrivalAt).toLocaleTimeString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        hour: "2-digit",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </td>

                    <td className="py-3 px-3 text-charcoal/60">
                      +{c.graceMinutes}m
                    </td>

                    <td className="py-3 px-3">
                      {getStatusBadge(c.status)}
                    </td>

                    <td className="py-3 px-3 font-mono text-charcoal/70">
                      {c.arrivedAt ? (
                        new Date(c.arrivedAt).toLocaleTimeString("en-IN", {
                          timeZone: "Asia/Kolkata",
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: true,
                        })
                      ) : (
                        <span className="text-charcoal/30">—</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-[11px] text-charcoal/60">
                      {c.checkInSource || "—"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 text-[11px] border-sand bg-white hover:bg-cream gap-1 px-2"
                          onClick={() => setSelectedCheckIn(c)}
                        >
                          <QrCode className="w-3 h-3 text-gold" />
                          <span>Pass / QR</span>
                        </Button>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-[11px] px-2 text-charcoal/70 hover:text-charcoal"
                            >
                              Update Status ▾
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem
                              onClick={() => handleManualStatusChange(c.id, "ARRIVED")}
                            >
                              Mark Arrived at Gate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleManualStatusChange(c.id, "SETUP_COMPLETE")}
                            >
                              Mark Setup Complete
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleManualStatusChange(c.id, "WORKING")}
                            >
                              Mark Active / Working
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleManualStatusChange(c.id, "COMPLETED")}
                            >
                              Mark Completed / Left Venue
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleManualStatusChange(c.id, "LATE")}
                              className="text-status-critical"
                            >
                              Flag as Late Arrival
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* QR Pass Dialog */}
      {selectedCheckIn && (
        <Dialog
          open={!!selectedCheckIn}
          onOpenChange={(open) => {
            if (!open) setSelectedCheckIn(null);
          }}
        >
          <DialogContent className="max-w-md bg-warm-white">
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-charcoal flex items-center gap-2">
                <QrCode className="w-5 h-5 text-gold" />
                <span>Vendor Gate Pass</span>
              </DialogTitle>
              <DialogDescription className="text-xs text-charcoal/60">
                Share this secure mobile link or QR code with the vendor crew. No app installation required.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-4 rounded-xl bg-ivory border border-sand/40 text-center space-y-3">
                {/* Decorative High-Contrast Simulated QR Code */}
                <div className="w-44 h-44 mx-auto p-3 bg-white rounded-lg shadow-sm border border-sand flex items-center justify-center">
                  <div className="w-full h-full border-2 border-charcoal p-1 grid grid-cols-6 grid-rows-6 gap-0.5">
                    {Array.from({ length: 36 }).map((_, i) => (
                      <div
                        key={i}
                        className={`rounded-[1px] ${
                          [0, 1, 2, 4, 5, 6, 7, 8, 12, 13, 14, 18, 19, 20, 24, 25, 29, 30, 31, 33, 35].includes(
                            i
                          )
                            ? "bg-charcoal"
                            : "bg-white"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <div className="font-serif font-bold text-charcoal text-base">
                    {selectedCheckIn.vendorName}
                  </div>
                  <div className="text-xs font-medium text-gold">
                    {selectedCheckIn.category}
                  </div>
                  <div className="text-[11px] text-charcoal/60 mt-1">
                    Expected:{" "}
                    {new Date(selectedCheckIn.expectedArrivalAt).toLocaleTimeString("en-IN", {
                      timeZone: "Asia/Kolkata",
                      hour: "2-digit",
                      minute: "2-digit",
                      hour12: true,
                    })}{" "}
                    IST (+{selectedCheckIn.graceMinutes}m grace)
                  </div>
                </div>

                <div className="text-[11px] text-charcoal/50 bg-white p-2 rounded border border-sand/30 font-mono break-all select-all">
                  {getPassUrl(selectedCheckIn.rawToken)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full border-sand bg-white hover:bg-cream text-xs gap-1.5"
                  onClick={() => handleCopyPassUrl(selectedCheckIn.rawToken)}
                >
                  {copiedToken ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-status-success" />
                      <span>Copied URL!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-charcoal/60" />
                      <span>Copy Mobile Link</span>
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  className="w-full bg-gold text-white hover:bg-gold-dark text-xs gap-1.5"
                  onClick={() =>
                    window.open(getPassUrl(selectedCheckIn.rawToken), "_blank")
                  }
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Gate Pass</span>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
