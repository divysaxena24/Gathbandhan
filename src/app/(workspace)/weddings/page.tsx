"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Heart,
  Plus,
  Search,
  Filter,
  Calendar,
  MapPin,
  Users,
  IndianRupee,
  Sparkles,
  ArrowRight,
  Radio,
  CheckCircle2,
  Clock,
  Building2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/money";
import { OverbudgetTag } from "@/components/common/overbudget-tag";
import { toast } from "sonner";

interface WeddingItem {
  id: string;
  title: string;
  city: string | null;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  estimatedGuestCount: number | null;
  budgetPaise: string;
  estimatedBudgetPaise?: string | null;
  packageType: string | null;
  lifecycleStatus: "PLANNING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  createdAt: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
}

export default function WeddingsPage() {
  const [weddings, setWeddings] = useState<WeddingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state for creating a new wedding
  const [formData, setFormData] = useState({
    title: "",
    clientName: "",
    clientEmail: "",
    clientPhone: "",
    city: "Udaipur",
    venue: "",
    startDate: "",
    endDate: "",
    guestCount: 350,
    budgetINR: 15000000,
    packageType: "FULL_SERVICE",
    notes: "",
  });

  const fetchWeddings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/weddings");
      if (res.ok) {
        const json = await res.json();
        setWeddings(json.data || []);
      }
    } catch (err) {
      console.error("Failed to fetch weddings", err);
      toast.error("Could not load weddings from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeddings();
  }, []);

  const handleCreateWedding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.clientName.trim()) {
      toast.warning("Please provide a wedding title and client name.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/weddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast.success("Wedding project successfully created in database!");
        setDialogOpen(false);
        setFormData({
          title: "",
          clientName: "",
          clientEmail: "",
          clientPhone: "",
          city: "Udaipur",
          venue: "",
          startDate: "",
          endDate: "",
          guestCount: 350,
          budgetINR: 15000000,
          packageType: "FULL_SERVICE",
          notes: "",
        });
        fetchWeddings();
      } else {
        const errJson = await res.json();
        toast.error(errJson.error || "Failed to create wedding.");
      }
    } catch (err) {
      console.error("Create wedding error", err);
      toast.error("Network error while creating wedding.");
    } finally {
      setSaving(false);
    }
  };

  // Filtered list
  const filteredWeddings = weddings.filter((w) => {
    const matchesStatus =
      statusFilter === "ALL" || w.lifecycleStatus === statusFilter;
    const matchesSearch =
      !search.trim() ||
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      (w.clientName && w.clientName.toLowerCase().includes(search.toLowerCase())) ||
      (w.city && w.city.toLowerCase().includes(search.toLowerCase())) ||
      (w.venue && w.venue.toLowerCase().includes(search.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const totalBudgetPaise = weddings.reduce(
    (acc, w) => acc + BigInt(w.budgetPaise || "0"),
    BigInt(0)
  );

  const planningCount = weddings.filter((w) => w.lifecycleStatus === "PLANNING").length;
  const activeCount = weddings.filter((w) => w.lifecycleStatus === "ACTIVE").length;

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return "TBD";
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50">
      <PageHeader
        title="Weddings & Celebrations"
        description="Active and planned destination celebrations across Jaipur, Udaipur, Jodhpur, and Goa"
      >
        <Button
          variant="outline"
          size="sm"
          onClick={fetchWeddings}
          className="gap-1.5 border-border"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-gold ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
        <Button
          size="sm"
          onClick={() => setDialogOpen(true)}
          className="bg-charcoal text-ivory hover:bg-charcoal-700 gap-2"
        >
          <Plus className="w-4 h-4 text-gold" />
          Create Wedding
        </Button>
      </PageHeader>

      {/* Top Level Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Total Celebrations
            </CardTitle>
            <Heart className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal">{weddings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Managed destination weddings</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              In Planning
            </CardTitle>
            <Clock className="h-4 w-4 text-gold" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal">{planningCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Vendor & timeline development</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Active Control Room
            </CardTitle>
            <Radio className="h-4 w-4 text-status-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal">{activeCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Day-of live execution</p>
          </CardContent>
        </Card>

        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Pipeline Value
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-status-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-display text-charcoal truncate">
              {formatINR(totalBudgetPaise)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total planned client spend</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by couple, city, or venue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 border-border"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Weddings" },
            { id: "PLANNING", label: "In Planning" },
            { id: "ACTIVE", label: "Active Live" },
            { id: "COMPLETED", label: "Completed" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                statusFilter === tab.id
                  ? "bg-maroon text-soft-white font-semibold shadow-xs"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Wedding Cards Grid */}
      {loading ? (
        <div className="p-16 text-center text-muted-foreground">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold" />
          <p className="text-sm">Loading weddings from database...</p>
        </div>
      ) : filteredWeddings.length === 0 ? (
        <Card className="border-border p-12 text-center bg-card">
          <Heart className="w-10 h-10 text-gold/40 mx-auto mb-3" />
          <h3 className="font-heading font-semibold text-lg text-charcoal">No Weddings Found</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
            {search
              ? "No weddings match your search criteria. Try a different query or reset filters."
              : "No weddings registered yet. Convert a client booking request or click Create Wedding."}
          </p>
          <Button
            size="sm"
            onClick={() => setDialogOpen(true)}
            className="bg-charcoal text-ivory hover:bg-charcoal-700"
          >
            Create First Wedding
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredWeddings.map((w) => (
            <Card
              key={w.id}
              className="border-border hover:border-gold/40 transition-all hover:shadow-md bg-card flex flex-col justify-between"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      w.lifecycleStatus === "ACTIVE"
                        ? "border-status-warning bg-status-warning-light text-status-warning"
                        : w.lifecycleStatus === "COMPLETED"
                        ? "border-status-success bg-status-success-light text-status-success"
                        : "border-gold/30 bg-gold/10 text-gold-700"
                    }`}
                  >
                    {w.lifecycleStatus}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground">
                    {formatDate(w.startDate)}
                  </span>
                </div>
                <CardTitle className="font-display text-lg font-bold text-charcoal mt-2 line-clamp-1">
                  {w.title}
                </CardTitle>
                <p className="text-xs text-muted-foreground line-clamp-1 font-medium">
                  {w.clientName || "Bespoke Couple"}
                </p>
              </CardHeader>

              <CardContent className="space-y-4 pt-0">
                <div className="space-y-2 text-xs border-t border-border/50 pt-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span className="truncate">{w.venue || "Luxury Venue"}, {w.city || "Rajasthan"}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 text-gold shrink-0" />
                    <span>
                      {formatDate(w.startDate)} - {formatDate(w.endDate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-muted-foreground pt-1">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-gold" />
                      <span>{w.estimatedGuestCount || 300} Guests</span>
                    </div>
                    <div className="flex items-center gap-1.5 font-semibold text-charcoal flex-wrap">
                      <span>{formatINR(BigInt(w.budgetPaise || "0"))}</span>
                      {w.estimatedBudgetPaise && BigInt(w.estimatedBudgetPaise) > BigInt(w.budgetPaise || "0") && (
                        <OverbudgetTag
                          isOverBudget={true}
                          overBudgetPaise={BigInt(w.estimatedBudgetPaise) - BigInt(w.budgetPaise || "0")}
                          clientBudgetPaise={BigInt(w.budgetPaise || "0")}
                          size="xs"
                        />
                      )}
                    </div>
                    <div className="hidden">
                      <span>{formatINR(BigInt(w.budgetPaise || "0"))}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-border/50">
                  <Link href={`/control-room?weddingId=${w.id}`} className="block w-full">
                    <Button
                      size="sm"
                      className="w-full text-xs font-semibold gap-2 bg-charcoal text-ivory hover:bg-charcoal-800 transition-all shadow-sm py-2"
                    >
                      <Radio className="w-3.5 h-3.5 text-gold animate-pulse shrink-0" />
                      <span>Open Wedding Control Room</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-auto text-gold shrink-0" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Wedding Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Create Wedding Celebration</DialogTitle>
            <DialogDescription className="text-xs">
              Add a new luxury wedding project directly to the PostgreSQL database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateWedding} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-charcoal block mb-1">
                Wedding Title *
              </label>
              <Input
                placeholder="e.g. Singhania Royal Wedding"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Couple / Client Name *
                </label>
                <Input
                  placeholder="e.g. Aarav & Meera"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Client Email
                </label>
                <Input
                  type="email"
                  placeholder="couple@email.com"
                  value={formData.clientEmail}
                  onChange={(e) => setFormData({ ...formData, clientEmail: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Destination City
                </label>
                <Input
                  placeholder="e.g. Udaipur"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Venue
                </label>
                <Input
                  placeholder="e.g. Taj Lake Palace"
                  value={formData.venue}
                  onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Start Date
                </label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  End Date
                </label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Guest Count
                </label>
                <Input
                  type="number"
                  min="20"
                  max="5000"
                  value={formData.guestCount}
                  onChange={(e) => setFormData({ ...formData, guestCount: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-charcoal block mb-1">
                  Budget in ₹ INR
                </label>
                <Input
                  type="number"
                  step="500000"
                  value={formData.budgetINR}
                  onChange={(e) => setFormData({ ...formData, budgetINR: Number(e.target.value) })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-maroon hover:bg-maroon-deep text-soft-white gap-1.5"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save Wedding to DB
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
