"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Radio,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  CheckSquare,
  Building2,
  AlertOctagon,
  Phone,
  HardDriveDownload,
  AlertTriangle,
  X,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineView } from "@/components/control-room/timeline-view";
import { WeddingTasksView } from "@/components/control-room/wedding-tasks-view";
import { ChosenVendorsView } from "@/components/control-room/chosen-vendors-view";
import { GuestLogisticsView } from "@/components/control-room/guest-logistics-view";
import { IncidentListView } from "@/components/control-room/incident-list-view";
import { CreateIncidentModal } from "@/components/control-room/incident-modal";
import { OfflineBanner } from "@/components/control-room/offline-banner";
import { formatINR } from "@/lib/money";
import {
  ControlRoomAlertRecord,
  IncidentRecord,
  TimelineItemWithDeps,
  VendorCheckInRecord,
} from "@/modules/control-room/types";

interface WeddingOption {
  id: string;
  title: string;
  clientName: string | null;
  city: string | null;
  venue: string | null;
  startDate: string | null;
  endDate: string | null;
  budgetPaise: string;
  lifecycleStatus: string;
}

interface EventItem {
  id: string;
  name: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  venue: string;
}

function ControlRoomContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlWeddingId = searchParams.get("weddingId") || "";

  const [weddings, setWeddings] = useState<WeddingOption[]>([]);
  const [weddingId, setWeddingId] = useState<string>(urlWeddingId);
  const [currentWedding, setCurrentWedding] = useState<WeddingOption | null>(null);

  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [timelineItems, setTimelineItems] = useState<TimelineItemWithDeps[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [alerts, setAlerts] = useState<ControlRoomAlertRecord[]>([]);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [lastCachedAt, setLastCachedAt] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("timeline");

  // 1. Load list of weddings
  useEffect(() => {
    fetch("/api/weddings")
      .then((r) => r.json())
      .then((json) => {
        if (json.success && json.data.length > 0) {
          setWeddings(json.data);
          const matched = urlWeddingId
            ? json.data.find((w: WeddingOption) => w.id === urlWeddingId)
            : json.data[0];
          const activeW = matched || json.data[0];
          setWeddingId(activeW.id);
          setCurrentWedding(activeW);
          if (!urlWeddingId) {
            router.replace(`/control-room?weddingId=${activeW.id}`);
          }
        }
      })
      .catch(console.error);
  }, [urlWeddingId, router]);

  // Handle switching weddings from dropdown inside Control Room
  const handleSwitchWedding = (newWeddingId: string) => {
    setWeddingId(newWeddingId);
    const selected = weddings.find((w) => w.id === newWeddingId);
    if (selected) setCurrentWedding(selected);
    router.push(`/control-room?weddingId=${newWeddingId}`);
  };

  // Load events for the selected wedding
  const loadEvents = useCallback(() => {
    const venueName = currentWedding?.venue || "Taj Lake Palace";
    const demoEvents: EventItem[] = [
      {
        id: "event-mehendi",
        name: "Mehendi Ceremony",
        eventType: "MEHENDI",
        startsAt: "2027-02-12T10:00:00+05:30",
        endsAt: "2027-02-12T14:00:00+05:30",
        venue: `${venueName} - Garden Pavilion`,
      },
      {
        id: "event-sangeet",
        name: "Sangeet Night",
        eventType: "SANGEET",
        startsAt: "2027-02-12T19:00:00+05:30",
        endsAt: "2027-02-13T01:00:00+05:30",
        venue: `${venueName} - Grand Ballroom`,
      },
      {
        id: "event-ceremony",
        name: "Royal Wedding Ceremony",
        eventType: "CEREMONY",
        startsAt: "2027-02-13T09:00:00+05:30",
        endsAt: "2027-02-13T14:00:00+05:30",
        venue: `${venueName} - Courtyard`,
      },
    ];
    setEvents(demoEvents);
    if (!selectedEventId && demoEvents.length > 0) {
      setSelectedEventId(demoEvents[0].id);
    }
  }, [currentWedding, selectedEventId]);

  useEffect(() => {
    if (weddingId) {
      loadEvents();
    }
  }, [weddingId, loadEvents]);

  // Load timeline items for selected event
  const loadTimeline = useCallback(async () => {
    if (!weddingId || !selectedEventId) return;
    try {
      const res = await fetch(
        `/api/control-room/timeline?weddingId=${weddingId}&eventId=${selectedEventId}`
      );
      const json = await res.json();
      if (json.success) {
        setTimelineItems(json.data);
      }
    } catch (err) {
      console.error("Failed to load timeline items:", err);
    }
  }, [weddingId, selectedEventId]);

  // Load incidents
  const loadIncidents = useCallback(async () => {
    if (!weddingId) return;
    try {
      const res = await fetch(`/api/control-room/incidents?weddingId=${weddingId}`);
      const json = await res.json();
      if (json.success) {
        setIncidents(json.data);
      }
    } catch (err) {
      console.error("Failed to load incidents:", err);
    }
  }, [weddingId]);

  // Load alerts
  const loadAlerts = useCallback(async () => {
    if (!weddingId) return;
    try {
      const res = await fetch(`/api/control-room/alerts?weddingId=${weddingId}`);
      const json = await res.json();
      if (json.success) {
        setAlerts(json.data);
      }
    } catch (err) {
      console.error("Failed to load alerts:", err);
    }
  }, [weddingId]);

  useEffect(() => {
    if (weddingId && selectedEventId) {
      loadTimeline();
      loadIncidents();
      loadAlerts();
    }
  }, [weddingId, selectedEventId, loadTimeline, loadIncidents, loadAlerts]);

  const handleDismissAlert = async (alertId: string) => {
    try {
      await fetch("/api/control-room/alerts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ alertId }),
      });
      loadAlerts();
    } catch (err) {
      console.error("Failed to dismiss alert:", err);
    }
  };

  const handleCacheOffline = () => {
    if (typeof window !== "undefined") {
      const cachePayload = {
        weddingId,
        selectedEventId,
        timelineItems,
        incidents,
        cachedAt: new Date().toISOString(),
      };
      localStorage.setItem("gathbandhan_offline_control_room", JSON.stringify(cachePayload));
      const formatted = new Date().toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
      setLastCachedAt(`${formatted} IST`);
    }
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="space-y-6 animate-in fade-in-50">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ivory-300 pb-4">
        <div className="flex items-center gap-3">
          <Link href="/weddings">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-charcoal hover:text-gold -ml-2">
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Weddings</span>
            </Button>
          </Link>
          <span className="text-ivory-400">/</span>
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-gold animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-charcoal">
              Control Room
            </span>
          </div>
        </div>

        {/* Wedding Switcher Dropdown */}
        {weddings.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-charcoal-500 whitespace-nowrap">
              Switch Wedding:
            </label>
            <select
              value={weddingId}
              onChange={(e) => handleSwitchWedding(e.target.value)}
              className="h-9 px-3 rounded-md border border-ivory-300 bg-white text-xs font-medium text-charcoal focus:ring-2 focus:ring-gold"
            >
              {weddings.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.city || "Rajasthan"})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Wedding Command Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-charcoal via-charcoal-800 to-charcoal text-ivory shadow-lg border border-gold/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-gold/20 text-gold-400 border border-gold/40 text-[11px] font-bold uppercase">
                {currentWedding?.lifecycleStatus || "PLANNING"}
              </Badge>
              <span className="text-xs text-ivory/60">
                {currentWedding?.clientName || "Bespoke Couple"}
              </span>
            </div>

            <h1 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-white">
              {currentWedding?.title || "Royal Wedding Control Room"}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-ivory/70 pt-1">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gold" />
                {currentWedding?.venue || "Palace Venue"}, {currentWedding?.city || "Rajasthan"}
              </span>
              {currentWedding?.startDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-gold" />
                  {new Date(currentWedding.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                  {currentWedding.endDate ? ` - ${new Date(currentWedding.endDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}` : ""}
                </span>
              )}
              {currentWedding?.budgetPaise && (
                <span className="font-semibold text-gold">
                  Budget: {formatINR(BigInt(currentWedding.budgetPaise))}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <Button
              size="sm"
              onClick={() => setIsIncidentModalOpen(true)}
              className="bg-status-critical text-white hover:bg-status-critical/90 gap-1.5 shadow-sm text-xs font-semibold"
            >
              <AlertOctagon className="w-4 h-4" />
              <span>Log Incident</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Offline Status & Local Cache Banner */}
      <OfflineBanner onCacheData={handleCacheOffline} lastCachedAt={lastCachedAt} />

      {/* Active Alerts Bar */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border flex items-center justify-between gap-3 text-xs ${
                alert.severity === "CRITICAL"
                  ? "bg-status-critical/15 border-status-critical/40 text-status-critical"
                  : "bg-status-warning/15 border-status-warning/40 text-charcoal"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-status-critical" />
                <div>
                  <strong className="font-semibold">{alert.title}:</strong>{" "}
                  <span>{alert.message}</span>
                </div>
              </div>

              <button
                onClick={() => handleDismissAlert(alert.id)}
                className="text-charcoal/50 hover:text-charcoal p-1"
                title="Dismiss Alert"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Control Room Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white border border-ivory-300 p-1.5 flex-wrap h-auto shadow-sm">
          <TabsTrigger value="timeline" className="text-xs font-semibold gap-1.5 py-2">
            <Radio className="w-3.5 h-3.5 text-gold" />
            Live Timeline & Execution
          </TabsTrigger>
          <TabsTrigger value="tasks" className="text-xs font-semibold gap-1.5 py-2">
            <CheckSquare className="w-3.5 h-3.5 text-gold" />
            Wedding Tasks & Milestones
          </TabsTrigger>
          <TabsTrigger value="vendors" className="text-xs font-semibold gap-1.5 py-2">
            <Building2 className="w-3.5 h-3.5 text-gold" />
            Chosen Vendors & Gate Pass
          </TabsTrigger>
          <TabsTrigger value="guests" className="text-xs font-semibold gap-1.5 py-2">
            <Users className="w-3.5 h-3.5 text-gold" />
            Guest Management & Logistics
          </TabsTrigger>
          <TabsTrigger value="incidents" className="text-xs font-semibold gap-1.5 py-2">
            <AlertOctagon className="w-3.5 h-3.5 text-status-critical" />
            Incident Log & Directory ({incidents.length})
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Live Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          {events.length > 0 && (
            <div className="flex items-center gap-2 border-b border-ivory-300 pb-3 overflow-x-auto">
              <span className="text-xs font-bold text-charcoal/70 uppercase tracking-wider shrink-0 mr-1">
                Ceremony:
              </span>
              {events.map((evt) => (
                <button
                  key={evt.id}
                  onClick={() => setSelectedEventId(evt.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                    selectedEventId === evt.id
                      ? "bg-gold text-charcoal shadow-sm font-bold"
                      : "bg-white text-charcoal/70 border border-ivory-300 hover:bg-ivory-100"
                  }`}
                >
                  {evt.name}
                </button>
              ))}
            </div>
          )}

          <TimelineView
            timelineItems={timelineItems}
            weddingId={weddingId}
            eventId={selectedEventId}
            onRefresh={loadTimeline}
          />
        </TabsContent>

        {/* Tab 2: Wedding Tasks & Milestones */}
        <TabsContent value="tasks" className="space-y-4">
          <WeddingTasksView
            weddingId={weddingId}
            weddingTitle={currentWedding?.title}
          />
        </TabsContent>

        {/* Tab 3: Chosen Vendors & Gate Pass */}
        <TabsContent value="vendors" className="space-y-4">
          <ChosenVendorsView
            weddingId={weddingId}
            weddingTitle={currentWedding?.title}
          />
        </TabsContent>

        {/* Tab 4: Guest Logistics & RSVPs */}
        <TabsContent value="guests" className="space-y-4">
          <GuestLogisticsView
            weddingId={weddingId}
            weddingTitle={currentWedding?.title}
          />
        </TabsContent>

        {/* Tab 5: Incident Log & Emergency Contacts */}
        <TabsContent value="incidents" className="space-y-6">
          <IncidentListView
            incidents={incidents}
            weddingId={weddingId}
            eventId={selectedEventId}
            onRefresh={loadIncidents}
          />

          <div className="p-5 rounded-xl bg-white border border-ivory-300 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-base text-charcoal flex items-center gap-2">
              <Phone className="w-4 h-4 text-gold" />
              <span>On-Site Emergency Directory ({currentWedding?.city || "Rajasthan"} Command)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg border border-ivory-200 bg-ivory-50/50">
                <div className="font-semibold text-charcoal">Lead Wedding Director</div>
                <div className="text-charcoal-500">Priya Rathore</div>
                <a href="tel:+919876543210" className="text-gold font-bold hover:underline block mt-1">
                  +91 98765 43210
                </a>
              </div>
              <div className="p-3 rounded-lg border border-ivory-200 bg-ivory-50/50">
                <div className="font-semibold text-charcoal">Palace Security & Gate Lead</div>
                <div className="text-charcoal-500">Vikram Patel</div>
                <a href="tel:+919876543211" className="text-gold font-bold hover:underline block mt-1">
                  +91 98765 43211
                </a>
              </div>
              <div className="p-3 rounded-lg border border-ivory-200 bg-ivory-50/50">
                <div className="font-semibold text-charcoal">Local Emergency & Medical</div>
                <div className="text-charcoal-500">Geetanjali Hospital ER</div>
                <a href="tel:108" className="text-status-critical font-bold hover:underline block mt-1">
                  108 / +91 294 2500000
                </a>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Incident Creation Modal */}
      <CreateIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        weddingId={weddingId}
        eventId={selectedEventId}
        onCreated={loadIncidents}
      />
    </div>
  );
}

export default function ControlRoomPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 text-center text-charcoal-500">
          <Loader2 className="w-8 h-8 animate-spin text-gold mx-auto mb-2" />
          <p className="text-sm">Connecting to Event Control Room...</p>
        </div>
      }
    >
      <ControlRoomContent />
    </Suspense>
  );
}
