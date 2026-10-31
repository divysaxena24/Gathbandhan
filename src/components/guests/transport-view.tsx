"use client";

import React, { useState } from "react";
import {
  Car,
  Plus,
  Plane,
  Clock,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Send,
  MapPin,
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
import { TransportAssignmentRecord, TransportStatus } from "@/modules/guests/types";

interface TransportViewProps {
  transfers: TransportAssignmentRecord[];
  weddingId: string;
  onRefresh: () => void;
}

export function TransportView({
  transfers,
  weddingId,
  onRefresh,
}: TransportViewProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [guestName, setGuestName] = useState("");
  const [transferType, setTransferType] = useState("AIRPORT_PICKUP");
  const [pickupDate, setPickupDate] = useState("2027-02-11");
  const [pickupTime, setPickupTime] = useState("14:30");
  const [pickupLocation, setPickupLocation] = useState(
    "Maharana Pratap Airport (UDR), Arrival Gate"
  );
  const [dropoffLocation, setDropoffLocation] = useState(
    "Taj Lake Palace, Udaipur (Jetty Pier)"
  );
  const [vehicleType, setVehicleType] = useState("Toyota Innova Crysta");
  const [vehicleNumber, setVehicleNumber] = useState("RJ-27-PA-4421");
  const [driverName, setDriverName] = useState("Suresh Singh");
  const [driverPhone, setDriverPhone] = useState("+91 98290 88771");
  const [passengerCount, setPassengerCount] = useState(3);
  const [flightTrainNumber, setFlightTrainNumber] = useState("6E-2094 from DEL");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const filtered = transfers.filter((t) => {
    return selectedStatus === "ALL" || t.status === selectedStatus;
  });

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setIsSubmitting(true);

    try {
      const pickupDateTime = new Date(`${pickupDate}T${pickupTime}:00+05:30`);

      const res = await fetch("/api/guests/transport", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          guestName: guestName.trim() || "Guest Delegation",
          transferType,
          pickupTime: pickupDateTime.toISOString(),
          pickupLocation,
          dropoffLocation,
          vehicleType,
          vehicleNumber: vehicleNumber.trim() || null,
          driverName: driverName.trim() || null,
          driverPhone: driverPhone.trim() || null,
          passengerCount,
          flightTrainNumber: flightTrainNumber.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to schedule transfer");
      }

      setIsAddOpen(false);
      setGuestName("");
      setFlightTrainNumber("");
      setNotes("");
      onRefresh();
    } catch (err: unknown) {
      setErrorNotice((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: TransportStatus) => {
    setUpdatingId(id);
    try {
      const res = await fetch(`/api/guests/transport/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        throw new Error("Failed to update status");
      }
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message || "Status update failed");
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (s: TransportStatus) => {
    switch (s) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
            <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />
            Completed
          </Badge>
        );
      case "DISPATCHED":
        return (
          <Badge className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] animate-pulse">
            <Car className="w-3 h-3 mr-1 inline-block" />
            En Route
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 text-[10px]">
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px]">
            <Clock className="w-3 h-3 mr-1 inline-block" />
            Scheduled
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-sand-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Car className="w-4 h-4 text-charcoal-400" />
          {(["ALL", "SCHEDULED", "DISPATCHED", "COMPLETED"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStatus(s)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                selectedStatus === s
                  ? "bg-charcoal text-ivory"
                  : "text-charcoal-600 hover:bg-sand-100"
              }`}
            >
              {s === "ALL" ? "All Transfers" : s} ({
                s === "ALL"
                  ? transfers.length
                  : transfers.filter((t) => t.status === s).length
              })
            </button>
          ))}
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          size="sm"
          className="bg-charcoal text-ivory hover:bg-charcoal-800 gap-1.5 text-xs shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Schedule Transfer
        </Button>
      </div>

      {/* Transfers Roster Table */}
      <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Car className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
            <p className="font-serif text-base text-charcoal-800">No transfers scheduled</p>
            <p className="text-xs text-charcoal-500 mt-1">
              Coordinate airport pickups, departures, and palace shuttle convoys.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-sand-200 bg-sand-50/50 text-[11px] text-charcoal-500 font-serif uppercase tracking-wider">
                  <th className="py-3 px-4">Passenger / Delegation</th>
                  <th className="py-3 px-4">Pickup Time & Flight</th>
                  <th className="py-3 px-4">Route (From → To)</th>
                  <th className="py-3 px-4">Vehicle & Driver</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Dispatch Control</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-sand-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal-900 text-sm">
                        {t.guestName || "Guest"}
                      </div>
                      <div className="text-[11px] text-charcoal-500">
                        {t.passengerCount} Passengers • {t.transferType.replace("_", " ")}
                      </div>
                      {t.notes && (
                        <div className="text-[11px] text-charcoal-400 italic mt-0.5">
                          {t.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-charcoal-400" />
                        {new Date(t.pickupTime).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                          day: "numeric",
                          month: "short",
                        })}
                      </div>
                      {t.flightTrainNumber && (
                        <div className="flex items-center gap-1 text-[11px] text-gold-800 font-mono mt-0.5">
                          <Plane className="w-3 h-3 text-gold-600" />
                          <span>{t.flightTrainNumber}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-charcoal-900 flex items-center gap-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                        <span>{t.pickupLocation}</span>
                      </div>
                      <div className="text-charcoal-500 text-[11px] pl-4 mt-0.5">
                        ↳ {t.dropoffLocation}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal-800">
                        {t.vehicleType}
                        {t.vehicleNumber && (
                          <span className="ml-1.5 font-mono text-[10px] bg-sand-100 px-1.5 py-0.2 rounded text-charcoal-600">
                            {t.vehicleNumber}
                          </span>
                        )}
                      </div>
                      {t.driverName && (
                        <div className="flex items-center gap-1 text-[11px] text-charcoal-500 mt-0.5">
                          <span>{t.driverName}</span>
                          {t.driverPhone && (
                            <a
                              href={`tel:${t.driverPhone}`}
                              className="text-gold-700 hover:underline flex items-center gap-0.5 ml-1"
                            >
                              <Phone className="w-2.5 h-2.5" />
                              {t.driverPhone}
                            </a>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">{getStatusBadge(t.status)}</td>
                    <td className="py-3 px-4 text-right">
                      {t.status === "SCHEDULED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === t.id}
                          onClick={() => handleUpdateStatus(t.id, "DISPATCHED")}
                          className="h-7 text-xs border-sand-300 hover:bg-blue-50 hover:text-blue-800"
                        >
                          <Send className="w-3 h-3 mr-1" />
                          Dispatch
                        </Button>
                      )}
                      {t.status === "DISPATCHED" && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === t.id}
                          onClick={() => handleUpdateStatus(t.id, "COMPLETED")}
                          className="h-7 text-xs border-sand-300 hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                          Arrived
                        </Button>
                      )}
                      {t.status === "COMPLETED" && (
                        <span className="text-xs text-charcoal-400 italic">Complete</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Transfer Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-charcoal-900 flex items-center gap-2">
              <Car className="w-5 h-5 text-gold-600" />
              Schedule Transfer / Airport Pickup
            </DialogTitle>
            <DialogDescription className="text-xs text-charcoal-500">
              Assign chauffeur and luxury vehicle for guest airport or venue logistics.
            </DialogDescription>
          </DialogHeader>

          {errorNotice && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          <form onSubmit={handleCreateTransfer} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Passenger / Family Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Mrs. Meera Joshi"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Transfer Type
                </label>
                <select
                  value={transferType}
                  onChange={(e) => setTransferType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                >
                  <option value="AIRPORT_PICKUP">Airport Pickup (Arrival)</option>
                  <option value="AIRPORT_DROPOFF">Airport Drop-off (Departure)</option>
                  <option value="INTER_VENUE_SHUTTLE">Inter-Venue Shuttle</option>
                  <option value="STATION_PICKUP">Railway Station Pickup</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Pickup Date *
                </label>
                <input
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Pickup Time *
                </label>
                <input
                  type="time"
                  required
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Flight No.
                </label>
                <input
                  type="text"
                  placeholder="6E-2094"
                  value={flightTrainNumber}
                  onChange={(e) => setFlightTrainNumber(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Pickup Location *
              </label>
              <input
                type="text"
                required
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Dropoff Destination *
              </label>
              <input
                type="text"
                required
                value={dropoffLocation}
                onChange={(e) => setDropoffLocation(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Vehicle Type *
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                >
                  <option value="Toyota Innova Crysta">Toyota Innova Crysta</option>
                  <option value="Mercedes S-Class">Mercedes S-Class</option>
                  <option value="Force Urbania 17-Seater">Force Urbania 17-Seater</option>
                  <option value="Vintage 1948 Rolls Royce">Vintage 1948 Rolls Royce</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Vehicle Plate No.
                </label>
                <input
                  type="text"
                  placeholder="RJ-27-PA-4421"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Passengers
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={passengerCount}
                  onChange={(e) => setPassengerCount(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Driver Name
                </label>
                <input
                  type="text"
                  placeholder="Suresh Singh"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Driver Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 98290 88771"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-sand-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsAddOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmitting}
                className="bg-charcoal text-ivory hover:bg-charcoal-800"
              >
                {isSubmitting ? "Scheduling..." : "Schedule Transfer"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

