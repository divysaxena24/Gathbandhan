"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  Clock,
  QrCode,
  Plus,
  Star,
  Sparkles,
  IndianRupee,
  Loader2,
  X,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/money";
import { toast } from "sonner";

interface ChosenVendor {
  id: string;
  weddingId: string;
  vendorId: string;
  name: string;
  category: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  city: string | null;
  averageRating: string | null;
  contractAmountPaise: string;
  currency: string;
  scope: string | null;
  status: string;
  checkInStatus: "EXPECTED" | "ARRIVED" | "SETTING_UP" | "COMPLETED" | null;
  arrivedAt: string | null;
  expectedArrivalAt: string | null;
}

interface MasterVendorOption {
  id: string;
  name: string;
  category: string;
  city: string | null;
  averageRating: string | null;
}

export function ChosenVendorsView({
  weddingId,
  weddingTitle,
}: {
  weddingId: string;
  weddingTitle?: string;
}) {
  const [vendors, setVendors] = useState<ChosenVendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [masterVendors, setMasterVendors] = useState<MasterVendorOption[]>([]);
  const [selectedVendorId, setSelectedVendorId] = useState("");
  const [contractAmountINR, setContractAmountINR] = useState("1500000");
  const [scope, setScope] = useState("");
  const [saving, setSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState("ALL");

  const fetchVendors = useCallback(async () => {
    if (!weddingId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/wedding-vendors?weddingId=${weddingId}`);
      if (res.ok) {
        const json = await res.json();
        setVendors(json.data || []);
      }
    } catch (err) {
      console.error("Failed to load chosen vendors:", err);
    } finally {
      setLoading(false);
    }
  }, [weddingId]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  // Load master vendor directory for assign dialog
  useEffect(() => {
    if (dialogOpen && masterVendors.length === 0) {
      fetch("/api/vendors")
        .then((r) => r.json())
        .then((json) => {
          if (json.data) {
            setMasterVendors(json.data);
            if (json.data[0]) setSelectedVendorId(json.data[0].id);
          }
        })
        .catch(console.error);
    }
  }, [dialogOpen, masterVendors.length]);

  const handleAssignVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorId || !weddingId) return;
    setSaving(true);
    try {
      const paise = BigInt(Math.round(parseFloat(contractAmountINR || "0") * 100)).toString();
      const res = await fetch("/api/wedding-vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          vendorId: selectedVendorId,
          contractAmountPaise: paise,
          scope: scope.trim() || "Event service agreement",
        }),
      });

      if (res.ok) {
        toast.success("Vendor assigned to wedding successfully!");
        setDialogOpen(false);
        setScope("");
        fetchVendors();
      } else {
        const errJson = await res.json();
        toast.error(errJson.error?.message || "Could not assign vendor.");
      }
    } catch (err) {
      toast.error("Failed to assign vendor.");
    } finally {
      setSaving(false);
    }
  };

  const totalContractPaise = vendors.reduce(
    (acc, v) => acc + BigInt(v.contractAmountPaise || "0"),
    BigInt(0)
  );

  const arrivedCount = vendors.filter(
    (v) => v.checkInStatus === "ARRIVED" || v.checkInStatus === "SETTING_UP" || v.checkInStatus === "COMPLETED"
  ).length;

  const categories = Array.from(new Set(vendors.map((v) => v.category)));

  const filtered = filterCategory === "ALL" ? vendors : vendors.filter((v) => v.category === filterCategory);

  return (
    <div className="space-y-6">
      {/* Header with KPI cards & Assign Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-serif font-bold text-lg text-charcoal">
            Chosen Vendors for {weddingTitle || "Wedding"}
          </h3>
          <p className="text-xs text-charcoal-500 mt-0.5">
            Confirmed palace partners, catering contracts, production teams, and live gate status
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="bg-charcoal text-ivory hover:bg-charcoal-800 gap-1.5 text-xs self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-gold" />
          Assign Vendor to Wedding
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-charcoal-500 block">
              Contracted Vendors
            </span>
            <span className="text-xl font-bold font-serif text-charcoal">
              {vendors.length}
            </span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-gold-700 block">
              Total Contract Value
            </span>
            <span className="text-xl font-bold font-serif text-gold-800">
              {formatINR(totalContractPaise)}
            </span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">
              On-Site / Checked In
            </span>
            <span className="text-xl font-bold font-serif text-emerald-800">
              {arrivedCount} / {vendors.length}
            </span>
          </CardContent>
        </Card>

        <Card className="border-ivory-300 shadow-sm bg-white">
          <CardContent className="p-3">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">
              Categories Covered
            </span>
            <span className="text-xl font-bold font-serif text-amber-800">
              {categories.length}
            </span>
          </CardContent>
        </Card>
      </div>

      {/* Filter Category Pills */}
      {categories.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setFilterCategory("ALL")}
            className={`px-3 py-1 rounded-full text-xs font-semibold shrink-0 transition-all ${
              filterCategory === "ALL"
                ? "bg-charcoal text-ivory"
                : "bg-white text-charcoal-600 border border-ivory-300 hover:bg-ivory-100"
            }`}
          >
            All Categories ({vendors.length})
          </button>
          {categories.map((cat) => {
            const count = vendors.filter((v) => v.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${
                  filterCategory === cat
                    ? "bg-gold text-charcoal font-semibold shadow-sm"
                    : "bg-white text-charcoal-600 border border-ivory-300 hover:bg-ivory-100"
                }`}
              >
                {cat.replace(/_/g, " ")} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Vendor Cards List */}
      {loading ? (
        <div className="p-12 text-center text-charcoal-500">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm">Loading chosen wedding vendors...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center bg-white rounded-xl border border-ivory-200">
          <Building2 className="w-8 h-8 text-gold mx-auto mb-2" />
          <h4 className="font-serif font-bold text-base text-charcoal">No Vendors Assigned Yet</h4>
          <p className="text-xs text-charcoal-500 mt-1 max-w-sm mx-auto">
            Assign vetted palace caterers, decorators, and photographers to this wedding from the directory.
          </p>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="mt-4 bg-charcoal text-ivory text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Assign First Vendor
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((v) => {
            const checkInStatus = v.checkInStatus || "EXPECTED";
            return (
              <Card key={v.id} className="border-ivory-300 bg-white shadow-sm hover:border-gold/50 transition-all">
                <CardHeader className="pb-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gold/15 text-gold-800 border border-gold/30">
                          {v.category.replace(/_/g, " ")}
                        </span>
                        {v.averageRating && (
                          <span className="flex items-center gap-0.5 text-xs text-amber-600 font-semibold">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            {v.averageRating}
                          </span>
                        )}
                      </div>
                      <CardTitle className="font-serif text-base font-bold text-charcoal mt-1.5">
                        {v.name}
                      </CardTitle>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-bold text-charcoal font-display">
                        {formatINR(BigInt(v.contractAmountPaise || "0"))}
                      </div>
                      <span className="text-[10px] text-charcoal-400 uppercase tracking-wider">
                        Contract Value
                      </span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-0 text-xs">
                  {v.scope && (
                    <p className="text-charcoal-600 bg-ivory-50 p-2 rounded border border-ivory-200 text-[11px] leading-relaxed">
                      <strong className="text-charcoal">Scope:</strong> {v.scope}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-charcoal-500 pt-1 border-t border-ivory-200">
                    {v.contactName && (
                      <div className="truncate">
                        <span className="text-charcoal-400 block text-[10px] uppercase">Lead Contact</span>
                        <span className="font-medium text-charcoal">{v.contactName}</span>
                      </div>
                    )}
                    {v.city && (
                      <div className="flex items-center gap-1 truncate self-center">
                        <MapPin className="w-3 h-3 text-gold shrink-0" />
                        <span>{v.city}</span>
                      </div>
                    )}
                  </div>

                  {/* Gate Status & Contact Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-ivory-200">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-charcoal-400 uppercase">Gate:</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                          checkInStatus === "ARRIVED" || checkInStatus === "SETTING_UP" || checkInStatus === "COMPLETED"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {checkInStatus}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {v.phone && (
                        <a
                          href={`tel:${v.phone}`}
                          className="p-1.5 rounded-md hover:bg-ivory-100 text-charcoal-600 hover:text-gold"
                          title={`Call ${v.phone}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {v.email && (
                        <a
                          href={`mailto:${v.email}`}
                          className="p-1.5 rounded-md hover:bg-ivory-100 text-charcoal-600 hover:text-gold"
                          title={`Email ${v.email}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Assign Vendor Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg">Assign Vendor to {weddingTitle || "Wedding"}</DialogTitle>
            <DialogDescription className="text-xs">
              Select an approved palace partner or contractor from your master directory.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAssignVendor} className="space-y-4 pt-2 text-xs">
            <div>
              <label className="font-semibold text-charcoal block mb-1">
                Select Master Vendor *
              </label>
              <select
                value={selectedVendorId}
                onChange={(e) => setSelectedVendorId(e.target.value)}
                className="w-full h-10 px-3 rounded-md border border-ivory-300 bg-white text-xs focus:ring-2 focus:ring-gold"
                required
              >
                {masterVendors.map((mv) => (
                  <option key={mv.id} value={mv.id}>
                    {mv.name} — {mv.category.replace(/_/g, " ")} ({mv.city || "Rajasthan"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">
                Agreed Contract Amount (INR) *
              </label>
              <Input
                type="number"
                placeholder="e.g. 1500000"
                value={contractAmountINR}
                onChange={(e) => setContractAmountINR(e.target.value)}
                required
                className="text-xs"
              />
              <span className="text-[10px] text-charcoal-400 mt-1 block">
                Formatted: {formatINR(BigInt(Math.round(parseFloat(contractAmountINR || "0") * 100)))}
              </span>
            </div>

            <div>
              <label className="font-semibold text-charcoal block mb-1">
                Scope of Work / Service Deliverables
              </label>
              <Input
                placeholder="e.g. Waterfront mandap production, 400 guests buffet catering"
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className="bg-charcoal text-ivory hover:bg-charcoal-800 text-xs"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                    Assigning...
                  </>
                ) : (
                  "Confirm Assignment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
