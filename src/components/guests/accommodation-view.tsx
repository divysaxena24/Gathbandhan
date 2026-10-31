"use client";

import React, { useState } from "react";
import {
  Building2,
  Plus,
  Bed,
  Calendar,
  Key,
  CheckCircle2,
  AlertTriangle,
  Hotel,
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
import { AccommodationBookingRecord } from "@/modules/guests/types";

interface AccommodationViewProps {
  bookings: AccommodationBookingRecord[];
  weddingId: string;
  onRefresh: () => void;
}

export function AccommodationView({
  bookings,
  weddingId,
  onRefresh,
}: AccommodationViewProps) {
  const [selectedHotel, setSelectedHotel] = useState<string>("ALL");
  const [isAddOpen, setIsAddOpen] = useState(false);

  // Form states
  const [hotelName, setHotelName] = useState("Taj Lake Palace, Udaipur");
  const [roomType, setRoomType] = useState("Palace Lake View Suite");
  const [roomNumber, setRoomNumber] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [checkInDate, setCheckInDate] = useState("2027-02-11");
  const [checkOutDate, setCheckOutDate] = useState("2027-02-14");
  const [confirmationCode, setConfirmationCode] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const hotels = Array.from(new Set(bookings.map((b) => b.hotelName)));

  const filtered = bookings.filter((b) => {
    return selectedHotel === "ALL" || b.hotelName === selectedHotel;
  });

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/guests/accommodation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          hotelName,
          roomType,
          roomNumber: roomNumber.trim() || null,
          householdName: householdName.trim() || null,
          checkInDate,
          checkOutDate,
          confirmationCode: confirmationCode.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to assign room");
      }

      setIsAddOpen(false);
      setRoomNumber("");
      setHouseholdName("");
      setConfirmationCode("");
      setNotes("");
      onRefresh();
    } catch (err: unknown) {
      setErrorNotice((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Filter and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-sand-200 shadow-sm">
        <div className="flex items-center gap-2">
          <Hotel className="w-4 h-4 text-charcoal-400" />
          <button
            onClick={() => setSelectedHotel("ALL")}
            className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
              selectedHotel === "ALL"
                ? "bg-charcoal text-ivory"
                : "text-charcoal-600 hover:bg-sand-100"
            }`}
          >
            All Hotels ({bookings.length})
          </button>
          {hotels.map((h) => (
            <button
              key={h}
              onClick={() => setSelectedHotel(h)}
              className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                selectedHotel === h
                  ? "bg-charcoal text-ivory"
                  : "text-charcoal-600 hover:bg-sand-100"
              }`}
            >
              {h.split(",")[0]} ({bookings.filter((b) => b.hotelName === h).length})
            </button>
          ))}
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          size="sm"
          className="bg-charcoal text-ivory hover:bg-charcoal-800 gap-1.5 text-xs shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Assign Room Block
        </Button>
      </div>

      {/* Bookings Table */}
      <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Building2 className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
            <p className="font-serif text-base text-charcoal-800">
              No accommodation bookings recorded
            </p>
            <p className="text-xs text-charcoal-500 mt-1">
              Assign rooms across palace blocks for family and out-of-town guests.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-sand-200 bg-sand-50/50 text-[11px] text-charcoal-500 font-serif uppercase tracking-wider">
                  <th className="py-3 px-4">Guest / Household</th>
                  <th className="py-3 px-4">Hotel & Room Number</th>
                  <th className="py-3 px-4">Room Type</th>
                  <th className="py-3 px-4">Stay Duration</th>
                  <th className="py-3 px-4 text-center">Confirmation</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-sand-50/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal-900 text-sm">
                        {b.guestName || b.householdName || "Guest"}
                      </div>
                      {b.notes && (
                        <div className="text-[11px] text-charcoal-500 mt-0.5">
                          {b.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-charcoal-800">{b.hotelName}</div>
                      <div className="flex items-center gap-1 text-[11px] text-gold-800 font-mono mt-0.5">
                        <Key className="w-3 h-3" />
                        <span>{b.roomNumber || "Room Pending Allocation"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-charcoal-700">
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-3.5 h-3.5 text-charcoal-400" />
                        <span>{b.roomType}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 text-charcoal-700">
                        <Calendar className="w-3 h-3 text-charcoal-400" />
                        <span>
                          {new Date(b.checkInDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}{" "}
                          –{" "}
                          {new Date(b.checkOutDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-charcoal-700">
                      {b.confirmationCode ? (
                        <span className="bg-sand-100 px-2 py-0.5 rounded text-[11px]">
                          {b.confirmationCode}
                        </span>
                      ) : (
                        <span className="text-charcoal-400">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 mr-1 inline-block" />
                        {b.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Accommodation Dialog */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-charcoal-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-gold-600" />
              Assign Room Block
            </DialogTitle>
            <DialogDescription className="text-xs text-charcoal-500">
              Allocate luxury room inventory to guests or family delegations.
            </DialogDescription>
          </DialogHeader>

          {errorNotice && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          <form onSubmit={handleCreateBooking} className="space-y-3 pt-2">
            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Hotel Property *
              </label>
              <select
                value={hotelName}
                onChange={(e) => setHotelName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
              >
                <option value="Taj Lake Palace, Udaipur">Taj Lake Palace, Udaipur</option>
                <option value="The Oberoi Udaivilas, Udaipur">The Oberoi Udaivilas, Udaipur</option>
                <option value="The Leela Palace, Udaipur">The Leela Palace, Udaipur</option>
                <option value="Rambagh Palace, Jaipur">Rambagh Palace, Jaipur</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Room Type *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Luxury Lake View Suite"
                  value={roomType}
                  onChange={(e) => setRoomType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Room Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. Suite 204"
                  value={roomNumber}
                  onChange={(e) => setRoomNumber(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Household / Guest Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g., The Kapoor Family or Aarav Sharma"
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  required
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  required
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Hotel Confirmation Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. TAJ-77182"
                  value={confirmationCode}
                  onChange={(e) => setConfirmationCode(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g., Lake view preferred"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
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
                {isSubmitting ? "Assigning..." : "Confirm Room"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

