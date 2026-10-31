"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  AlertOctagon,
  Phone,
  HardDriveDownload,
  AlertTriangle,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TimelineView } from "@/components/control-room/timeline-view";
import { VendorGateView } from "@/components/control-room/vendor-gate-view";
import { IncidentListView } from "@/components/control-room/incident-list-view";
import { CreateIncidentModal } from "@/components/control-room/incident-modal";
import { OfflineBanner } from "@/components/control-room/offline-banner";
import {
  ControlRoomAlertRecord,
  IncidentRecord,
  TimelineItemWithDeps,
  VendorCheckInRecord,
} from "@/modules/control-room/types";

interface EventItem {
  id: string;
  name: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  venue: string;
}

export default function ControlRoomPage() {
  const [weddingId, setWeddingId] = useState<string>("");
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [timelineItems, setTimelineItems] = useState<TimelineItemWithDeps[]>([]);
  const [checkIns, setCheckIns] = useState<VendorCheckInRecord[]>([]);
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [alerts, setAlerts] = useState<ControlRoomAlertRecord[]>([]);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [lastCachedAt, setLastCachedAt] = useState<string | null>(null);

  // 1. Initial Load: Fetch weddings and events
  const loadInitialData = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks"); // tasks API has active weddings
      const json = await res.json();
      if (json.success && json.data.length > 0) {
        const primaryWeddingId = json.data[0].weddingId;
        setWeddingId(primaryWeddingId);
      }
    } catch (err) {
      console.error("Failed to load initial wedding context:", err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Load wedding events
  const loadEvents = useCallback(() => {
    // Default events for demo
    const demoEvents: EventItem[] = [
      {
        id: "event-mehendi",
        name: "Mehendi Ceremony",
        eventType: "MEHENDI",
        startsAt: "2027-02-12T10:00:00+05:30",
        endsAt: "2027-02-12T14:00:00+05:30",
        venue: "Taj Lake Palace - Garden Pavilion",
      },
      {
        id: "event-sangeet",
        name: "Sangeet Night",
        eventType: "SANGEET",
        startsAt: "2027-02-12T19:00:00+05:30",
        endsAt: "2027-02-13T01:00:00+05:30",
        venue: "Taj Lake Palace - Grand Ballroom",
      },
      {
        id: "event-ceremony",
        name: "Royal Wedding Ceremony",
        eventType: "CEREMONY",
        startsAt: "2027-02-13T09:00:00+05:30",
        endsAt: "2027-02-13T14:00:00+05:30",
        venue: "City Palace - Manek Chowk",
      },
    ];
    setEvents(demoEvents);
    if (!selectedEventId && demoEvents.length > 0) {
      setSelectedEventId(demoEvents[0].id);
    }
  }, [selectedEventId]);

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

  // Load vendor check-ins
  const loadCheckIns = useCallback(async () => {
    if (!weddingId) return;
    try {
      // First ensure tokens are generated
      await fetch("/api/control-room/check-ins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weddingId }),
      });

      const res = await fetch(`/api/control-room/check-ins?weddingId=${weddingId}`);
      const json = await res.json();
      if (json.success) {
        setCheckIns(json.data);
      }
    } catch (err) {
      console.error("Failed to load check-ins:", err);
    }
  }, [weddingId]);

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

  const refreshAll = useCallback(async () => {
    await Promise.all([
      loadTimeline(),
      loadCheckIns(),
      loadIncidents(),
      loadAlerts(),
    ]);
  }, [loadTimeline, loadCheckIns, loadIncidents, loadAlerts]);

  useEffect(() => {
    if (weddingId && selectedEventId) {
      refreshAll();
    }
  }, [weddingId, selectedEventId, refreshAll]);

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
        checkIns,
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
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Event Day Control Room"
        description={`Real-time command center for Rajasthan destination weddings: minute-by-minute timeline, QR gate clearance, idempotent late detection, and incident logs.${
          selectedEvent ? ` Active Venue: ${selectedEvent.venue}` : ""
        }`}
      >
        <Button
          size="sm"
          className="bg-status-critical text-white hover:bg-status-critical/90 gap-1.5 shadow-sm text-xs"
          onClick={() => setIsIncidentModalOpen(true)}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Log Incident</span>
        </Button>
      </PageHeader>

      {/* Offline Status & Local Cache Banner */}
      <OfflineBanner onCacheData={handleCacheOffline} lastCachedAt={lastCachedAt} />

      {/* Active Alerts Bar (Idempotent late arrival / critical warnings) */}
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

      {/* Event Switcher Tabs */}
      {events.length > 0 && (
        <div className="flex items-center gap-2 border-b border-sand/40 pb-2 overflow-x-auto">
          <span className="text-xs font-semibold text-charcoal/60 uppercase tracking-wider shrink-0 mr-1">
            Active Event:
          </span>
          {events.map((evt) => (
            <button
              key={evt.id}
              onClick={() => setSelectedEventId(evt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedEventId === evt.id
                  ? "bg-gold text-white shadow-sm font-semibold"
                  : "bg-white text-charcoal/70 border border-sand/40 hover:bg-cream hover:text-charcoal"
              }`}
            >
              {evt.name}
            </button>
          ))}
        </div>
      )}

      {/* View Tabs */}
      <Tabs defaultValue="timeline" className="space-y-4">
        <TabsList className="bg-ivory border border-sand/40 p-1">
          <TabsTrigger value="timeline" className="text-xs">
            Live Timeline ({timelineItems.length})
          </TabsTrigger>
          <TabsTrigger value="vendor-gate" className="text-xs">
            Vendor Gate & Check-in ({checkIns.length})
          </TabsTrigger>
          <TabsTrigger value="incidents" className="text-xs">
            Incident Log ({incidents.length})
          </TabsTrigger>
          <TabsTrigger value="contacts" className="text-xs">
            Emergency Contacts & Cache
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Live Timeline */}
        <TabsContent value="timeline" className="space-y-4">
          <TimelineView
            timelineItems={timelineItems}
            weddingId={weddingId}
            eventId={selectedEventId}
            onRefresh={loadTimeline}
          />
        </TabsContent>

        {/* Tab 2: Vendor Gate & QR Check-in */}
        <TabsContent value="vendor-gate" className="space-y-4">
          <VendorGateView
            checkIns={checkIns}
            weddingId={weddingId}
            onRefresh={loadCheckIns}
          />
        </TabsContent>

        {/* Tab 3: Incident Log */}
        <TabsContent value="incidents" className="space-y-4">
          <IncidentListView
            incidents={incidents}
            weddingId={weddingId}
            eventId={selectedEventId}
            onRefresh={loadIncidents}
          />
        </TabsContent>

        {/* Tab 4: Emergency Contacts */}
        <TabsContent value="contacts" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-xl bg-white border border-sand/40 space-y-4">
              <h3 className="font-serif font-bold text-lg text-charcoal flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                <span>On-Site Emergency Directory (Udaipur Command)</span>
              </h3>

              <div className="divide-y divide-sand/20 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-charcoal">Ananya Roy</div>
                    <div className="text-[11px] text-charcoal/50">Lead Wedding Planner</div>
                  </div>
                  <a
                    href="tel:+919876543211"
                    className="font-mono text-gold hover:underline font-semibold"
                  >
                    +91 98765 43211
                  </a>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-charcoal">Vikram Patel</div>
                    <div className="text-[11px] text-charcoal/50">On-Site Venue Coordinator</div>
                  </div>
                  <a
                    href="tel:+919876543214"
                    className="font-mono text-gold hover:underline font-semibold"
                  >
                    +91 98765 43214
                  </a>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-charcoal">Taj Lake Palace Command Desk</div>
                    <div className="text-[11px] text-charcoal/50">Duty Manager & Banquet Captain</div>
                  </div>
                  <a
                    href="tel:+912942460101"
                    className="font-mono text-charcoal hover:underline"
                  >
                    +91 294 246 0101
                  </a>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-charcoal">Geetanjali Hospital & Ambulance</div>
                    <div className="text-[11px] text-charcoal/50">Emergency Medical Service</div>
                  </div>
                  <a
                    href="tel:108"
                    className="font-mono text-status-critical font-bold hover:underline"
                  >
                    108 / +91 294 250 0000
                  </a>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-charcoal">City Palace Security Command</div>
                    <div className="text-[11px] text-charcoal/50">Major Chauhan (ShieldGuard)</div>
                  </div>
                  <a
                    href="tel:+919812345117"
                    className="font-mono text-charcoal hover:underline"
                  >
                    +91 98123 45117
                  </a>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-charcoal">Silent Generator Backup Service</div>
                    <div className="text-[11px] text-charcoal/50">Royal Glow Lighting & Power</div>
                  </div>
                  <a
                    href="tel:+919812345110"
                    className="font-mono text-charcoal hover:underline"
                  >
                    +91 98123 45110
                  </a>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-ivory border border-sand/40 space-y-4">
              <h3 className="font-serif font-bold text-lg text-charcoal flex items-center gap-2">
                <HardDriveDownload className="w-4 h-4 text-gold" />
                <span>Offline Storage & Device Sync</span>
              </h3>

              <p className="text-xs text-charcoal/70 leading-relaxed">
                Destination palace venues in Udaipur often experience spotty cellular reception near inner courtyards and stone gates. Gathbandhan caches all timeline milestones, vendor assignments, and emergency contact details locally on your device.
              </p>

              <div className="p-3 bg-white rounded-lg border border-sand/40 text-xs space-y-1">
                <div className="font-semibold text-charcoal">Cache Status:</div>
                <div className="text-charcoal/60">
                  {lastCachedAt
                    ? `✓ Active local snapshot created at ${lastCachedAt}`
                    : "No local cache saved yet in this session."}
                </div>
              </div>

              <Button
                className="w-full bg-gold text-white hover:bg-gold-dark text-xs gap-2"
                onClick={handleCacheOffline}
              >
                <HardDriveDownload className="w-4 h-4" />
                <span>Save Offline Snapshot Now</span>
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Log Incident Modal */}
      <CreateIncidentModal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        weddingId={weddingId}
        eventId={selectedEventId}
        onCreated={() => {
          loadIncidents();
          loadAlerts();
        }}
      />
    </div>
  );
}
