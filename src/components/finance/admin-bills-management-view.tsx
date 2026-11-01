"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  Edit,
  Download,
  IndianRupee,
  RefreshCw,
  Percent,
  Calendar,
  Building2,
  Users,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { formatINR } from "@/lib/money";

interface BillItem {
  id?: string;
  description: string;
  quantity: number;
  unitRatePaise: string;
  totalPaise: string;
}

interface BillInstallment {
  id: string;
  title: string;
  percentage: string;
  amountPaise: string;
  paidPaise: string;
  remainingPaise: string;
  dueAt: string;
  status: string;
  orderIndex: number;
}

interface ClientBillRecord {
  id: string;
  weddingId: string;
  weddingTitle?: string;
  clientId: string;
  clientName?: string;
  billNumber: string;
  title: string;
  issueDate: string;
  dueDate: string;
  subtotalPaise: string;
  taxPaise: string;
  totalPaise: string;
  paidPaise: string;
  outstandingPaise: string;
  advancePercentage: string;
  advanceAmountPaise: string;
  remainingBalancePaise: string;
  balanceDueAt: string | null;
  status: "DRAFT" | "AWAITING_ACCEPTANCE" | "ACCEPTED" | "DECLINED" | "DUE" | "PARTIALLY_PAID" | "PAID" | "CANCELLED";
  acceptedAt: string | null;
  declinedAt: string | null;
  declineReason: string | null;
  publishedAt: string | null;
  items?: BillItem[];
  installments?: BillInstallment[];
}

interface ClientOption {
  id: string;
  aliasIds?: string[];
  coupleName: string;
  partnerOneName: string;
  partnerOneEmail?: string | null;
  partnerOnePhone?: string | null;
}

function cleanClientName(name: string): string {
  return (name || "")
    .replace(/\s*\([^)]*project[^)]*\)/gi, "")
    .replace(/\s*\([^)]*wedding[^)]*\)/gi, "")
    .trim();
}

function getCanonicalClientKey(id?: string | null, name?: string | null, email?: string | null): string {
  const clean = cleanClientName(name || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  if (clean) return `name_${clean}`;
  if (id && id.trim()) return `id_${id.trim()}`;
  if (email && email.trim() && email.includes("@")) return `email_${email.trim().toLowerCase()}`;
  return "unknown_client";
}

interface WeddingOption {
  id: string;
  title: string;
  clientId?: string | null;
  clientName?: string | null;
}

const INITIAL_ACCEPTED_CLIENTS: ClientOption[] = [
  {
    id: "client-demo-1",
    aliasIds: ["client-demo-1", "b908759d-f633-47a3-b5f7-66a7b744d2e1", "user_offline_client"],
    coupleName: "Divya & Knox",
    partnerOneName: "Divya Saxena",
    partnerOneEmail: "divya_saxena@srmap.edu.in",
    partnerOnePhone: "+91 98765 43210",
  },
  {
    id: "173f48fd-48c6-41d3-8af5-e22ba8f3db6c",
    aliasIds: ["173f48fd-48c6-41d3-8af5-e22ba8f3db6c", "client-ap24110011570"],
    coupleName: "Divya Saxena | AP24110011570",
    partnerOneName: "Divya Saxena",
    partnerOneEmail: "divya_saxena@srmap.edu.in",
    partnerOnePhone: "+91 98765 43210",
  },
];

const INITIAL_ACCEPTED_WEDDINGS: WeddingOption[] = [
  {
    id: "wedding-demo-1",
    title: "The Royal Udaipur Heritage Wedding",
    clientId: "client-demo-1",
    clientName: "Divya & Knox",
  },
  {
    id: "b908759d-f633-47a3-b5f7-66a7b744d2e1",
    title: "Bespoke Royal Rajputana Palace Wedding (Udaipur)",
    clientId: "b908759d-f633-47a3-b5f7-66a7b744d2e1",
    clientName: "Divya & Knox",
  },
  {
    id: "wedding-ap24110011570",
    title: "The Heritage Palace Wedding (Divya Saxena)",
    clientId: "173f48fd-48c6-41d3-8af5-e22ba8f3db6c",
    clientName: "Divya Saxena | AP24110011570",
  },
];

export function AdminBillsManagementView({ weddingId }: { weddingId?: string }) {
  const [bills, setBills] = useState<ClientBillRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Clients & Weddings from all accepted projects
  const [clientsList, setClientsList] = useState<ClientOption[]>(INITIAL_ACCEPTED_CLIENTS);
  const [weddingsList, setWeddingsList] = useState<WeddingOption[]>(INITIAL_ACCEPTED_WEDDINGS);
  const [selectedFilterClientId, setSelectedFilterClientId] = useState<string>("ALL");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBillId, setEditingBillId] = useState<string | null>(null);

  // Form Fields
  const [modalClientId, setModalClientId] = useState<string>("client-demo-1");
  const [modalWeddingId, setModalWeddingId] = useState<string>("wedding-demo-1");
  const [title, setTitle] = useState("Full Wedding Planning & Execution Package");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [balanceDueAt, setBalanceDueAt] = useState(
    new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [totalAmountINR, setTotalAmountINR] = useState("500000");
  const [advancePercentage, setAdvancePercentage] = useState("20");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Expanded bill details
  const [expandedBillId, setExpandedBillId] = useState<string | null>(null);

  // 1. Live Calculations Preview
  const liveCalculations = useMemo(() => {
    const totalINR = parseFloat(totalAmountINR) || 0;
    const pct = parseFloat(advancePercentage) || 0;

    const totalPaise = BigInt(Math.max(0, Math.round(totalINR * 100)));
    const validPct = Math.min(100, Math.max(0, pct));

    const advanceAmountPaise = BigInt(
      Math.round((Number(totalPaise) * validPct) / 100)
    );
    const remainingBalancePaise =
      totalPaise > advanceAmountPaise ? totalPaise - advanceAmountPaise : 0n;

    return {
      totalPaise,
      validPct,
      advanceAmountPaise,
      remainingBalancePaise,
      isValid: totalINR > 0 && pct >= 0 && pct <= 100,
    };
  }, [totalAmountINR, advancePercentage]);

  // Load clients and weddings with deduplication
  const loadClientsAndWeddings = useCallback(async () => {
    try {
      const [clientsRes, weddingsRes, bookingsRes] = await Promise.allSettled([
        fetch("/api/clients"),
        fetch("/api/weddings"),
        fetch("/api/booking-requests"),
      ]);

      const clientMap = new Map<string, ClientOption>();
      const weddingMap = new Map<string, WeddingOption>();

      const addOrMergeClient = (
        id: string,
        rawName: string,
        email?: string | null,
        phone?: string | null
      ) => {
        if (!id && !rawName && !email) return;
        const cleanedName = cleanClientName(rawName || "Client") || "Client";
        const key = getCanonicalClientKey(id, cleanedName, email);
        if (clientMap.has(key)) {
          const existing = clientMap.get(key)!;
          if (id && existing.aliasIds && !existing.aliasIds.includes(id)) {
            existing.aliasIds.push(id);
          }
          if (!existing.partnerOneEmail && email) existing.partnerOneEmail = email;
          if (!existing.partnerOnePhone && phone) existing.partnerOnePhone = phone;
        } else {
          clientMap.set(key, {
            id: id || `client-${key}`,
            aliasIds: id ? [id] : [],
            coupleName: cleanedName,
            partnerOneName: cleanedName,
            partnerOneEmail: email || null,
            partnerOnePhone: phone || null,
          });
        }
      };

      // Seed initial defaults
      for (const c of INITIAL_ACCEPTED_CLIENTS) {
        addOrMergeClient(c.id, c.coupleName, c.partnerOneEmail, c.partnerOnePhone);
        if (c.aliasIds) {
          const key = getCanonicalClientKey(c.id, c.coupleName, c.partnerOneEmail);
          const item = clientMap.get(key);
          if (item) {
            item.aliasIds = Array.from(new Set([...(item.aliasIds || []), ...c.aliasIds]));
          }
        }
      }
      for (const w of INITIAL_ACCEPTED_WEDDINGS) weddingMap.set(w.id, w);

      // 1. Ingest direct clients
      if (clientsRes.status === "fulfilled" && clientsRes.value.ok) {
        try {
          const cJson = await clientsRes.value.json();
          if (Array.isArray(cJson.data)) {
            for (const c of cJson.data) {
              if (c && c.id) {
                addOrMergeClient(
                  c.id,
                  c.coupleName || c.partnerOneName || "Client",
                  c.partnerOneEmail || null,
                  c.partnerOnePhone || null
                );
              }
            }
          }
        } catch (e) {
          console.warn("Parsing /api/clients failed:", e);
        }
      }

      // 2. Ingest wedding projects
      if (weddingsRes.status === "fulfilled" && weddingsRes.value.ok) {
        try {
          const wJson = await weddingsRes.value.json();
          if (Array.isArray(wJson.data)) {
            for (const w of wJson.data) {
              if (w && w.id) {
                weddingMap.set(w.id, {
                  id: w.id,
                  title: w.title || "Wedding Project",
                  clientId: w.clientId || null,
                  clientName: w.clientName || null,
                });

                if (w.clientId || w.clientName) {
                  addOrMergeClient(
                    w.clientId || `client-${w.id}`,
                    w.clientName || w.title,
                    w.clientEmail || null,
                    w.clientPhone || null
                  );
                }
              }
            }
          }
        } catch (e) {
          console.warn("Parsing /api/weddings failed:", e);
        }
      }

      // 3. Ingest booking requests
      if (bookingsRes.status === "fulfilled" && bookingsRes.value.ok) {
        try {
          const bJson = await bookingsRes.value.json();
          const reqList = Array.isArray(bJson)
            ? bJson
            : Array.isArray(bJson.data)
            ? bJson.data
            : [];

          for (const b of reqList) {
            if (b && b.id) {
              const cId = b.userId || b.id;
              const coupleTitle = b.coupleName || b.contactName || "Client";
              addOrMergeClient(cId, coupleTitle, b.contactEmail || null, b.contactPhone || null);

              const wId = b.weddingId || b.id;
              weddingMap.set(wId, {
                id: wId,
                title: `The Wedding of ${cleanClientName(coupleTitle)} (${b.destinationCity || "Udaipur"})`,
                clientId: cId,
                clientName: cleanClientName(coupleTitle),
              });
            }
          }
        } catch (e) {
          console.warn("Parsing /api/booking-requests failed:", e);
        }
      }

      const finalClients = Array.from(clientMap.values());
      const finalWeddings = Array.from(weddingMap.values());

      setClientsList(finalClients);
      setWeddingsList(finalWeddings);

      if (!modalClientId && finalClients.length > 0) {
        setModalClientId(finalClients[0].id);
      }
      if (!modalWeddingId && finalWeddings.length > 0) {
        setModalWeddingId(finalWeddings[0].id);
      }
    } catch (err) {
      console.warn("Could not load clients and weddings for tagging:", err);
    }
  }, [modalClientId, modalWeddingId]);

  // Load Bills
  const loadBills = useCallback(async () => {
    try {
      setRefreshing(true);
      const url = weddingId
        ? `/api/finance/bills?weddingId=${encodeURIComponent(weddingId)}`
        : "/api/finance/bills";
      const res = await fetch(url);
      const json = await res.json();
      if (json.data) {
        setBills(json.data);
      }
    } catch (err: any) {
      console.error("Failed to load bills:", err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [weddingId]);

  useEffect(() => {
    loadBills();
    loadClientsAndWeddings();
  }, [loadBills, loadClientsAndWeddings]);

  // Handle Publish Bill
  const handlePublish = async (billId: string) => {
    try {
      setErrorMessage(null);
      const res = await fetch(`/api/finance/bills/${billId}/publish`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error?.message || "Failed to publish bill");
      }
      await loadBills();
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  // Open Edit Modal
  const openEditModal = (bill: ClientBillRecord) => {
    if (BigInt(bill.paidPaise) > 0n) {
      setErrorMessage("Cannot modify bill: Payments have already been recorded on this bill.");
      return;
    }
    setEditingBillId(bill.id);
    setModalClientId(bill.clientId);
    setModalWeddingId(bill.weddingId);
    setTitle(bill.title);
    setIssueDate(bill.issueDate);
    setDueDate(bill.dueDate);
    setBalanceDueAt(bill.balanceDueAt || bill.dueDate);
    setTotalAmountINR((Number(bill.totalPaise) / 100).toString());
    setAdvancePercentage(Number(bill.advancePercentage).toString());
    setIsModalOpen(true);
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingBillId(null);
    setTitle("Full Wedding Planning & Execution Package");
    setIssueDate(new Date().toISOString().split("T")[0]);
    setDueDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setBalanceDueAt(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
    setTotalAmountINR("500000");
    setAdvancePercentage("20");
    setNotes("");

    // Determine initial client and wedding to tag from available accepted projects
    let initialClientId = "";
    let initialWeddingId = weddingId || "";

    if (weddingId) {
      const currentWedding = weddingsList.find((w) => w.id === weddingId);
      if (currentWedding?.clientId) {
        initialClientId = currentWedding.clientId;
      }
    }

    if (!initialClientId && selectedFilterClientId !== "ALL") {
      initialClientId = selectedFilterClientId;
      const matched = weddingsList.find((w) => w.clientId === selectedFilterClientId);
      if (matched) initialWeddingId = matched.id;
    }

    if (!initialClientId && clientsList.length > 0) {
      initialClientId = clientsList[0].id;
      const matched = weddingsList.find((w) => w.clientId === initialClientId);
      if (matched) initialWeddingId = matched.id;
    }

    if (!initialWeddingId && weddingsList.length > 0) {
      initialWeddingId = weddingsList[0].id;
    }

    setModalClientId(initialClientId || "client-demo-1");
    setModalWeddingId(initialWeddingId || "wedding-demo-1");
    setIsModalOpen(true);
  };

  // Handle client selection change in modal
  const handleClientSelectChange = (newClientId: string) => {
    setModalClientId(newClientId);
    const selected = clientsList.find((c) => c.id === newClientId);
    const matchingIds = selected ? [selected.id, ...(selected.aliasIds || [])] : [newClientId];

    const matchedWedding = weddingsList.find(
      (w) =>
        (w.clientId && matchingIds.includes(w.clientId)) ||
        matchingIds.includes(w.id) ||
        (selected?.coupleName &&
          w.clientName &&
          cleanClientName(selected.coupleName).toLowerCase() === cleanClientName(w.clientName).toLowerCase())
    );
    if (matchedWedding) {
      setModalWeddingId(matchedWedding.id);
    } else if (weddingsList.length > 0) {
      setModalWeddingId(weddingsList[0].id);
    }
  };

  // Submit Create or Edit
  const handleSubmitBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveCalculations.isValid) {
      setErrorMessage("Please enter a valid total amount and percentage between 0 and 100%");
      return;
    }

    const clientToTag = modalClientId || clientsList[0]?.id;
    if (!clientToTag) {
      setErrorMessage("Please select a client from the dropdown to tag this bill to.");
      return;
    }

    const weddingIdToUse = modalWeddingId || weddingId || weddingsList[0]?.id;
    if (!weddingIdToUse) {
      setErrorMessage("Please select an associated wedding project.");
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      if (editingBillId) {
        // Edit Bill
        const res = await fetch(`/api/finance/bills/${editingBillId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            issueDate,
            dueDate,
            balanceDueAt,
            totalPaise: liveCalculations.totalPaise.toString(),
            advancePercentage: liveCalculations.validPct,
            notes: notes.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error?.message || "Failed to update bill");
        }
      } else {
        // Create Bill tagged to specific selected client
        const res = await fetch("/api/finance/bills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            weddingId: weddingIdToUse,
            weddingTitle: weddingsList.find((w) => w.id === weddingIdToUse)?.title,
            clientId: clientToTag,
            clientName: selectedClientDetails?.coupleName || selectedClientDetails?.partnerOneName,
            title: title.trim(),
            issueDate,
            dueDate,
            balanceDueAt,
            totalPaise: liveCalculations.totalPaise.toString(),
            advancePercentage: liveCalculations.validPct,
            notes: notes.trim() || undefined,
          }),
        });
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error?.message || "Failed to create bill");
        }
      }

      setIsModalOpen(false);
      await loadBills();
    } catch (err: any) {
      setErrorMessage(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Selected client for filtering
  const selectedClient = useMemo(() => {
    if (selectedFilterClientId === "ALL") return null;
    return clientsList.find((c) => c.id === selectedFilterClientId) || null;
  }, [clientsList, selectedFilterClientId]);

  // Filter bills by tagged client with alias resolution
  const displayedBills = useMemo(() => {
    if (selectedFilterClientId === "ALL" || !selectedClient) return bills;
    const matchingIds = [selectedClient.id, ...(selectedClient.aliasIds || [])];

    return bills.filter((b) => {
      if (matchingIds.includes(b.clientId)) return true;
      if (
        selectedClient.partnerOneEmail &&
        b.clientName &&
        cleanClientName(selectedClient.coupleName).toLowerCase() === cleanClientName(b.clientName).toLowerCase()
      ) {
        return true;
      }
      return false;
    });
  }, [bills, selectedFilterClientId, selectedClient]);

  // Financial KPI totals for displayed bills
  const totalBilledPaise = displayedBills.reduce(
    (acc, b) => acc + BigInt(b.totalPaise || 0),
    0n
  );
  const totalCollectedPaise = displayedBills.reduce(
    (acc, b) => acc + BigInt(b.paidPaise || 0),
    0n
  );
  const totalOutstandingPaise = displayedBills.reduce(
    (acc, b) => acc + BigInt(b.outstandingPaise || 0),
    0n
  );

  const selectedClientDetails =
    clientsList.find((c) => c.id === modalClientId) || clientsList[0];

  return (
    <div className="space-y-6">
      {/* Top Banner Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 text-xs flex items-center gap-2 text-amber-300">
        <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
        <span>
          <strong>SIMULATED PAYMENT ENVIRONMENT:</strong> All client invoices and Virtual UPI QR sessions generated here operate on Gathbandhan&apos;s virtual ledger.
        </span>
      </div>

      {/* Top Section: Bill Generation Header, Client Filter, and Actions */}
      <div className="bg-stone-900/70 border border-stone-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" />
              <span>Bill Generation & Collections</span>
            </h2>
            <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/40 text-[10px]">
              Virtual Billing
            </Badge>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            Generate client invoices, tag specific clients from accepted projects, and check paid vs due amounts.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Filter by Specific Client Dropdown */}
          <div className="flex items-center gap-1.5 bg-stone-950 border border-stone-800 rounded-lg px-3 py-1.5 text-xs shadow-inner">
            <Filter className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="text-stone-400 text-[11px] font-medium">Client:</span>
            <select
              value={selectedFilterClientId}
              onChange={(e) => setSelectedFilterClientId(e.target.value)}
              className="bg-transparent text-amber-200 text-xs font-semibold focus:outline-none cursor-pointer pr-1"
            >
              <option value="ALL" className="bg-stone-950 text-white">
                All Clients ({bills.length})
              </option>
              {clientsList.map((client) => {
                const clientIds = [client.id, ...(client.aliasIds || [])];
                const count = bills.filter((b) => {
                  if (clientIds.includes(b.clientId)) return true;
                  if (
                    client.coupleName &&
                    b.clientName &&
                    cleanClientName(client.coupleName).toLowerCase() === cleanClientName(b.clientName).toLowerCase()
                  ) {
                    return true;
                  }
                  return false;
                }).length;
                return (
                  <option key={client.id} value={client.id} className="bg-stone-950 text-white">
                    {client.coupleName} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadBills}
            disabled={refreshing}
            className="border-stone-800 text-stone-300 hover:bg-stone-900 text-xs h-9"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={openCreateModal}
            className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs h-9 shadow-sm"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Create Client Bill
          </Button>
        </div>
      </div>

      {/* KPI Cards: ONLY Paid Amount Section and Due Amount Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Paid Amount Section */}
        <div className="bg-emerald-950/25 border border-emerald-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Paid Amount Section
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
              Virtually Collected
            </span>
          </div>
          <div className="text-3xl font-black text-emerald-400 mt-2 font-mono">
            {formatINR(totalCollectedPaise)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
            <span>
              {selectedClient ? `For ${selectedClient.coupleName}` : `Across ${displayedBills.length} client invoice(s)`}
            </span>
            <span className="text-emerald-400/90 font-mono">
              {totalBilledPaise > 0n
                ? `${((Number(totalCollectedPaise) / Number(totalBilledPaise)) * 100).toFixed(1)}% recovery`
                : "0% recovery"}
            </span>
          </div>
        </div>

        {/* Due Amount Section */}
        <div className="bg-amber-950/25 border border-amber-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              Due Amount Section
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium">
              Pending Collection
            </span>
          </div>
          <div className="text-3xl font-black text-amber-400 mt-2 font-mono">
            {formatINR(totalOutstandingPaise)}
          </div>
          <div className="text-[11px] text-stone-400 mt-1 flex items-center justify-between">
            <span>
              {selectedClient ? `For ${selectedClient.coupleName}` : `Across ${displayedBills.length} client invoice(s)`}
            </span>
            <span className="text-amber-400/90 font-medium">
              Due for collection
            </span>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 text-rose-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Bills Table */}
      {loading ? (
        <div className="py-16 text-center text-stone-400 space-y-2">
          <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-xs">Loading bills...</p>
        </div>
      ) : displayedBills.length === 0 ? (
        <div className="border border-stone-800 rounded-xl p-12 text-center bg-stone-950/40">
          <FileText className="h-10 w-10 text-stone-600 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-stone-300">
            {selectedFilterClientId !== "ALL"
              ? "No Bills Tagged to this Client"
              : "No Bills Created Yet"}
          </h4>
          <p className="text-xs text-stone-500 max-w-sm mx-auto mt-1">
            {selectedFilterClientId !== "ALL"
              ? "Click 'Create Client Bill' to generate and send an invoice exclusively to this client."
              : "Tag a client from the dropdown and configure advance percentages to initiate the virtual payment workflow."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedBills.map((bill) => {
            const isDraft = bill.status === "DRAFT";
            const isAwaiting = bill.status === "AWAITING_ACCEPTANCE";
            const isDue = bill.status === "DUE" || bill.status === "ACCEPTED";
            const isPartiallyPaid = bill.status === "PARTIALLY_PAID";
            const isPaid = bill.status === "PAID";
            const isDeclined = bill.status === "DECLINED";

            const canEdit = BigInt(bill.paidPaise) === 0n;
            const isExpanded = expandedBillId === bill.id;

            return (
              <div
                key={bill.id}
                className="bg-stone-950 border border-stone-800 rounded-xl overflow-hidden hover:border-stone-700 transition-colors"
              >
                <div className="p-4 flex flex-wrap items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs text-amber-400 font-bold">
                        {bill.billNumber}
                      </span>
                      {/* Tagged Client Badge */}
                      <span className="px-2 py-0.5 rounded-md bg-stone-900 border border-amber-500/40 text-amber-300 font-semibold text-[11px] flex items-center gap-1.5 shadow-sm">
                        <Users className="w-3 h-3 text-amber-400" />
                        <span>Tagged: {bill.clientName || "Client"}</span>
                      </span>

                      {/* Status Badges */}
                      {isDraft && (
                        <Badge variant="outline" className="text-[10px] border-stone-700 text-stone-400">
                          Draft (Not Published)
                        </Badge>
                      )}
                      {isAwaiting && (
                        <Badge className="bg-amber-500/15 text-amber-300 border-amber-500/30 text-[10px]">
                          Sent to Client • Awaiting Acceptance
                        </Badge>
                      )}
                      {isDue && (
                        <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 text-[10px]">
                          Accepted by Client • Payment Due
                        </Badge>
                      )}
                      {isPartiallyPaid && (
                        <Badge className="bg-purple-500/15 text-purple-300 border-purple-500/30 text-[10px]">
                          Partially Paid
                        </Badge>
                      )}
                      {isPaid && (
                        <Badge className="bg-emerald-500/15 text-emerald-300 border-emerald-500/30 text-[10px]">
                          Paid in Full
                        </Badge>
                      )}
                      {isDeclined && (
                        <Badge className="bg-rose-500/15 text-rose-300 border-rose-500/30 text-[10px]">
                          Declined by Client
                        </Badge>
                      )}
                    </div>

                    <h4 className="text-sm font-bold text-white">{bill.title}</h4>

                    <div className="text-xs text-stone-400 flex flex-wrap items-center gap-3">
                      <span>Wedding: {bill.weddingTitle || "Wedding Project"}</span>
                      <span>•</span>
                      <span>Due: {new Date(bill.dueDate).toLocaleDateString("en-IN")}</span>
                      {bill.balanceDueAt && (
                        <>
                          <span>•</span>
                          <span>Balance Due: {new Date(bill.balanceDueAt).toLocaleDateString("en-IN")}</span>
                        </>
                      )}
                      <span>•</span>
                      <span className="text-amber-400/90 font-medium">
                        Advance: {Number(bill.advancePercentage)}% ({formatINR(BigInt(bill.advanceAmountPaise))})
                      </span>
                    </div>
                  </div>

                  {/* Amounts & Action Buttons */}
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-right">
                      <div className="text-[11px] text-stone-500">Total Billed</div>
                      <div className="text-base font-bold text-white">
                        {formatINR(BigInt(bill.totalPaise))}
                      </div>
                      <div className="text-[11px] text-stone-400">
                        Paid:{" "}
                        <span className="text-emerald-400 font-semibold">
                          {formatINR(BigInt(bill.paidPaise))}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isDraft && (
                        <Button
                          size="sm"
                          onClick={() => handlePublish(bill.id)}
                          className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs h-8 gap-1.5"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Send to Client
                        </Button>
                      )}

                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditModal(bill)}
                          className="border-stone-800 text-stone-300 hover:bg-stone-900 text-xs h-8 gap-1"
                        >
                          <Edit className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setExpandedBillId(isExpanded ? null : bill.id)
                        }
                        className="text-stone-400 hover:text-white text-xs h-8 px-2"
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-4 bg-stone-900/40 border-t border-stone-800 space-y-4">
                    {/* Private Client Visibility Notice */}
                    <div className="text-xs p-3 rounded-lg bg-stone-900 border border-stone-800 text-stone-300 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>
                          Exclusive Recipient: <strong>{bill.clientName || "Client"}</strong>
                          {bill.publishedAt ? (
                            <span className="text-emerald-400 ml-1.5">
                              (Sent on {new Date(bill.publishedAt).toLocaleDateString("en-IN")})
                            </span>
                          ) : (
                            <span className="text-stone-400 ml-1.5">
                              (Private Draft — click &apos;Send to Client&apos; to publish)
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-mono text-stone-500">
                        Client ID: {bill.clientId.slice(0, 8)}...
                      </span>
                    </div>

                    {/* Breakdown Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                        <div className="text-[10px] text-stone-400 uppercase font-medium">
                          Required Advance Deposit
                        </div>
                        <div className="text-sm font-bold text-amber-400 mt-0.5">
                          {formatINR(BigInt(bill.advanceAmountPaise))}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          {Number(bill.advancePercentage)}% of total bill
                        </div>
                      </div>

                      <div className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                        <div className="text-[10px] text-stone-400 uppercase font-medium">
                          Remaining Post-Advance Balance
                        </div>
                        <div className="text-sm font-bold text-stone-200 mt-0.5">
                          {formatINR(BigInt(bill.remainingBalancePaise))}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          Due by {bill.balanceDueAt ? new Date(bill.balanceDueAt).toLocaleDateString("en-IN") : "TBD"}
                        </div>
                      </div>

                      <div className="bg-stone-950 p-3 rounded-lg border border-stone-800">
                        <div className="text-[10px] text-stone-400 uppercase font-medium">
                          Current Outstanding
                        </div>
                        <div className="text-sm font-bold text-rose-400 mt-0.5">
                          {formatINR(BigInt(bill.outstandingPaise))}
                        </div>
                        <div className="text-[10px] text-stone-500 mt-0.5">
                          Unsettled balance
                        </div>
                      </div>
                    </div>

                    {/* Installments Table */}
                    {bill.installments && bill.installments.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-stone-300">
                          Payment Milestones & Virtual UPI Sessions
                        </div>
                        <table className="w-full text-xs text-left text-stone-300 border-collapse">
                          <thead>
                            <tr className="border-b border-stone-800 text-[10px] uppercase text-stone-500">
                              <th className="p-2">Milestone</th>
                              <th className="p-2 text-right">Share</th>
                              <th className="p-2 text-right">Amount</th>
                              <th className="p-2 text-right">Paid</th>
                              <th className="p-2 text-center">Due Date</th>
                              <th className="p-2 text-center">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {bill.installments.map((inst) => (
                              <tr key={inst.id} className="border-b border-stone-800/60">
                                <td className="p-2 font-medium text-white">{inst.title}</td>
                                <td className="p-2 text-right font-mono text-stone-400">
                                  {Number(inst.percentage)}%
                                </td>
                                <td className="p-2 text-right font-bold text-white">
                                  {formatINR(BigInt(inst.amountPaise))}
                                </td>
                                <td className="p-2 text-right font-mono text-emerald-400">
                                  {formatINR(BigInt(inst.paidPaise))}
                                </td>
                                <td className="p-2 text-center text-stone-400">
                                  {new Date(inst.dueAt).toLocaleDateString("en-IN")}
                                </td>
                                <td className="p-2 text-center">
                                  <Badge
                                    variant="outline"
                                    className={`text-[9px] ${
                                      inst.status === "PAID"
                                        ? "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                                        : "border-stone-700 text-stone-400"
                                    }`}
                                  >
                                    {inst.status}
                                  </Badge>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Bill Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-xl bg-stone-950 border-stone-800 text-stone-100 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">
              {editingBillId ? "Edit Client Bill" : "Create & Tag Client Bill"}
            </DialogTitle>
            <DialogDescription className="text-xs text-stone-400">
              Select any client from accepted wedding projects, configure the advance percentage, and verify the calculated amounts.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitBill} className="space-y-4 py-2">
            {/* Tag Particular Client Selection Section */}
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" />
                  Tag Target Client (Bill Sent Only To Them) *
                </span>
                <span className="text-[10px] text-stone-400">Private & Protected</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-stone-300 mb-1">
                    Select Client from Accepted Projects *
                  </label>
                  <select
                    value={modalClientId}
                    disabled={!!editingBillId}
                    onChange={(e) => handleClientSelectChange(e.target.value)}
                    className="w-full rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
                    required
                  >
                    <option value="">-- Choose Client --</option>
                    {clientsList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.coupleName || c.partnerOneName} {c.partnerOneEmail ? `(${c.partnerOneEmail})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-300 mb-1">
                    Wedding Project *
                  </label>
                  <select
                    value={modalWeddingId}
                    disabled={!!editingBillId}
                    onChange={(e) => setModalWeddingId(e.target.value)}
                    className="w-full rounded-lg bg-stone-900 border border-stone-700 px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500 disabled:opacity-60"
                    required
                  >
                    <option value="">-- Choose Wedding Project --</option>
                    {weddingsList.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.title} {w.clientName ? `• ${w.clientName}` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {selectedClientDetails && (
                <div className="text-[11px] text-amber-200/90 bg-stone-950/70 p-2.5 rounded-lg border border-amber-500/20 flex items-start gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span>
                      Tagged to <strong>{selectedClientDetails.coupleName}</strong>{" "}
                      ({selectedClientDetails.partnerOneEmail || "Email pending"}).
                    </span>
                    <p className="text-[10px] text-stone-400 mt-0.5">
                      Only this specific client will receive this invoice and will be able to review, accept, and make virtual UPI payments in their portal.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Bill Title *
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Full Wedding Planning & Execution Package"
                className="bg-stone-900 border-stone-800 text-stone-200 text-xs"
                required
              />
            </div>

            {/* Total Amount & Advance Percentage Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Total Bill Amount (₹ INR) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-500 text-xs font-bold">₹</span>
                  <Input
                    type="number"
                    value={totalAmountINR}
                    onChange={(e) => setTotalAmountINR(e.target.value)}
                    placeholder="500000"
                    min="1"
                    className="bg-stone-900 border-stone-800 text-stone-200 text-xs pl-7"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Advance Payment Percentage (0–100%) *
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={advancePercentage}
                    onChange={(e) => setAdvancePercentage(e.target.value)}
                    placeholder="20"
                    min="0"
                    max="100"
                    step="0.01"
                    className="bg-stone-900 border-stone-800 text-stone-200 text-xs pr-7"
                    required
                  />
                  <span className="absolute right-3 top-2 text-stone-500 text-xs font-bold">%</span>
                </div>
              </div>
            </div>

            {/* Slider for Advance Percentage */}
            <div>
              <input
                type="range"
                min="0"
                max="100"
                value={liveCalculations.validPct}
                onChange={(e) => setAdvancePercentage(e.target.value)}
                className="w-full accent-amber-500 cursor-pointer h-1.5 bg-stone-800 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-stone-500 mt-1">
                <span>0% (No Advance)</span>
                <span>20% (Standard)</span>
                <span>50%</span>
                <span>100% (Full Advance)</span>
              </div>
            </div>

            {/* AUTOMATIC LIVE CALCULATION PREVIEW BOX */}
            <div className="bg-gradient-to-br from-stone-900 via-stone-900 to-amber-950/20 border border-amber-500/30 rounded-xl p-4 space-y-2.5">
              <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider flex items-center justify-between">
                <span>Automatic Calculation Preview</span>
                <span className="text-[9px] font-normal text-stone-400">Server validated</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center pt-1">
                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-stone-400">Total Bill</div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {formatINR(liveCalculations.totalPaise)}
                  </div>
                </div>

                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-amber-500/30">
                  <div className="text-[10px] text-amber-400">
                    Advance ({liveCalculations.validPct}%)
                  </div>
                  <div className="text-sm font-bold text-amber-400 mt-0.5">
                    {formatINR(liveCalculations.advanceAmountPaise)}
                  </div>
                </div>

                <div className="bg-stone-950/80 p-2.5 rounded-lg border border-stone-800">
                  <div className="text-[10px] text-stone-400">
                    Remaining Balance ({Number((100 - liveCalculations.validPct).toFixed(2))}%)
                  </div>
                  <div className="text-sm font-bold text-stone-200 mt-0.5">
                    {formatINR(liveCalculations.remainingBalancePaise)}
                  </div>
                </div>
              </div>
            </div>

            {/* Due Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Issue Date *
                </label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                  className="bg-stone-900 border-stone-800 text-stone-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Advance Due Date *
                </label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-stone-900 border-stone-800 text-stone-200 text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-300 mb-1">
                  Balance Due Date *
                </label>
                <Input
                  type="date"
                  value={balanceDueAt}
                  onChange={(e) => setBalanceDueAt(e.target.value)}
                  className="bg-stone-900 border-stone-800 text-stone-200 text-xs"
                  required
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-stone-300 mb-1">
                Notes / Terms Summary
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Include custom terms or scope notes for this client..."
                rows={2}
                className="w-full rounded-lg bg-stone-900 border border-stone-800 p-2.5 text-xs text-stone-200 placeholder:text-stone-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-stone-800">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
                className="border-stone-800 text-stone-300 text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !liveCalculations.isValid || !modalClientId}
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs"
              >
                {isSubmitting ? "Saving..." : editingBillId ? "Update Bill" : "Save as Draft"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
