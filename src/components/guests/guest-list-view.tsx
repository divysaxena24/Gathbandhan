"use client";

import React, { useState } from "react";
import {
  Users,
  Plus,
  Search,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Mail,
  Phone,
  Sparkles,
  ShieldAlert,
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
import { GuestRecord, GuestSide, MealPreference } from "@/modules/guests/types";

interface GuestListViewProps {
  guests: GuestRecord[];
  weddingId: string;
  onRefresh: () => void;
}

export function GuestListView({
  guests,
  weddingId,
  onRefresh,
}: GuestListViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSide, setSelectedSide] = useState<string>("ALL");
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  // Add Guest Modal state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [side, setSide] = useState<GuestSide>("MUTUAL");
  const [isPrimaryContact, setIsPrimaryContact] = useState(false);
  const [dietaryPreference, setDietaryPreference] = useState<MealPreference>("VEG");
  const [allergies, setAllergies] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  // Filtered guest list
  const filteredGuests = guests.filter((g) => {
    const matchesSide =
      selectedSide === "ALL" || g.side === selectedSide;
    const matchesSearch =
      !searchTerm ||
      `${g.firstName} ${g.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.householdName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.phone?.includes(searchTerm);
    return matchesSide && matchesSearch;
  });

  const handleCopyLink = (token: string) => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${origin}/rsvp/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2500);
  };

  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/guests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weddingId,
          firstName,
          lastName,
          householdName: householdName.trim() || null,
          email: email.trim() || null,
          phone: phone.trim() || null,
          side,
          isPrimaryContact,
          dietaryPreference,
          allergies: allergies.trim() || null,
          accessibilityNeeds: accessibilityNeeds.trim() || null,
          notes: notes.trim() || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error?.message || "Failed to create guest");
      }

      setIsAddOpen(false);
      setFirstName("");
      setLastName("");
      setHouseholdName("");
      setEmail("");
      setPhone("");
      setAllergies("");
      setAccessibilityNeeds("");
      setNotes("");
      onRefresh();
    } catch (err: unknown) {
      setErrorNotice((err as Error).message || "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGuest = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to remove ${name} from this wedding?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/guests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        throw new Error("Failed to delete guest");
      }
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message || "Delete failed");
    }
  };

  const getSideBadge = (s: GuestSide) => {
    switch (s) {
      case "BRIDE":
        return <Badge className="bg-rose-100 text-rose-800 border-rose-200">Bride&apos;s Family</Badge>;
      case "GROOM":
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Groom&apos;s Family</Badge>;
      case "VIP":
        return <Badge className="bg-amber-100 text-amber-800 border-amber-200">VIP Dignitary</Badge>;
      default:
        return <Badge variant="secondary">Mutual Friends</Badge>;
    }
  };

  const getDietaryBadge = (m: MealPreference) => {
    switch (m) {
      case "JAIN":
        return <Badge className="bg-purple-100 text-purple-800 text-[10px]">Jain (No Root Veg)</Badge>;
      case "NON_VEG":
        return <Badge className="bg-orange-100 text-orange-800 text-[10px]">Non-Veg</Badge>;
      case "VEGAN":
        return <Badge className="bg-teal-100 text-teal-800 text-[10px]">Vegan</Badge>;
      default:
        return <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">Pure Veg</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-white p-3.5 rounded-xl border border-sand-200 shadow-sm">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-charcoal-400" />
            <input
              type="text"
              placeholder="Search by name, household, email or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
            />
          </div>

          <div className="flex items-center gap-1">
            {(["ALL", "BRIDE", "GROOM", "VIP", "MUTUAL"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSelectedSide(s)}
                className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors ${
                  selectedSide === s
                    ? "bg-charcoal text-ivory"
                    : "text-charcoal-600 hover:bg-sand-100"
                }`}
              >
                {s === "ALL" ? "All Sides" : s}
              </button>
            ))}
          </div>
        </div>

        <Button
          onClick={() => setIsAddOpen(true)}
          size="sm"
          className="bg-charcoal text-ivory hover:bg-charcoal-800 gap-1.5 text-xs shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Guest
        </Button>
      </div>

      {/* Guest Table */}
      <div className="bg-white rounded-xl border border-sand-200 shadow-sm overflow-hidden">
        {filteredGuests.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 text-charcoal-300 mx-auto mb-3" />
            <p className="font-serif text-base text-charcoal-800">No guests found</p>
            <p className="text-xs text-charcoal-500 mt-1">
              Add your first guest or adjust your search filter.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-sand-200 bg-sand-50/50 text-[11px] text-charcoal-500 font-serif uppercase tracking-wider">
                  <th className="py-3 px-4">Guest Name & Household</th>
                  <th className="py-3 px-4">Side</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Dietary & Allergies</th>
                  <th className="py-3 px-4">Event RSVPs</th>
                  <th className="py-3 px-4 text-right">RSVP Link & Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {filteredGuests.map((g) => {
                  const fullName = `${g.firstName} ${g.lastName}`;
                  return (
                    <tr key={g.id} className="hover:bg-sand-50/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-charcoal-900 text-sm">
                          {fullName}
                          {g.isPrimaryContact && (
                            <span className="ml-1.5 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-sans">
                              Primary
                            </span>
                          )}
                        </div>
                        {g.householdName && (
                          <div className="text-xs text-charcoal-500 mt-0.5">
                            {g.householdName}
                          </div>
                        )}
                        {g.accessibilityNeeds && (
                          <div className="flex items-center gap-1 text-[11px] text-amber-700 mt-0.5">
                            <Sparkles className="w-3 h-3 flex-shrink-0" />
                            <span>{g.accessibilityNeeds}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">{getSideBadge(g.side)}</td>
                      <td className="py-3 px-4">
                        <div className="space-y-0.5 text-charcoal-700">
                          {g.email && (
                            <div className="flex items-center gap-1 text-charcoal-600">
                              <Mail className="w-3 h-3 text-charcoal-400" />
                              <span>{g.email}</span>
                            </div>
                          )}
                          {g.phone && (
                            <div className="flex items-center gap-1 text-charcoal-600">
                              <Phone className="w-3 h-3 text-charcoal-400" />
                              <span>{g.phone}</span>
                            </div>
                          )}
                          {!g.email && !g.phone && (
                            <span className="text-charcoal-400 italic">No contact recorded</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <div>{getDietaryBadge(g.dietaryPreference)}</div>
                          {g.allergies && (
                            <div className="flex items-center gap-1 text-[11px] text-rose-700 font-medium">
                              <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                              <span>Allergy: {g.allergies}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {g.rsvps && g.rsvps.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {g.rsvps.map((r) => (
                              <span
                                key={r.id}
                                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                  r.status === "ATTENDING"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : r.status === "DECLINED"
                                    ? "bg-rose-50 text-rose-800 border border-rose-200"
                                    : "bg-sand-100 text-charcoal-600"
                                }`}
                                title={`${r.eventName || "Event"}: ${r.status}${
                                  r.plusOnes > 0 ? ` (+${r.plusOnes})` : ""
                                }`}
                              >
                                {r.eventName?.split(" ")[0] || "Ceremony"}: {r.status}
                                {r.plusOnes > 0 ? `+${r.plusOnes}` : ""}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-charcoal-400 italic">Pending invitation</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCopyLink(g.rsvpToken)}
                            className="h-7 text-xs border-sand-300 hover:bg-sand-100 gap-1"
                          >
                            {copiedToken === g.rsvpToken ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-700">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-charcoal-500" />
                                <span>Copy RSVP Link</span>
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGuest(g.id, fullName)}
                            className="h-7 w-7 p-0 text-charcoal-400 hover:text-rose-600 hover:bg-rose-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Guest Modal */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="font-serif text-lg text-charcoal-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gold-600" />
              Add Guest / Family Invitation
            </DialogTitle>
            <DialogDescription className="text-xs text-charcoal-500">
              Each guest gets a secure, private RSVP token for all ceremony invitations.
            </DialogDescription>
          </DialogHeader>

          {errorNotice && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-2.5 rounded-lg text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          <form onSubmit={handleCreateGuest} className="space-y-3 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Rajesh"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Kapoor"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Household / Group
                </label>
                <input
                  type="text"
                  placeholder="e.g., Kapoor Family"
                  value={householdName}
                  onChange={(e) => setHouseholdName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Wedding Side
                </label>
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value as GuestSide)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                >
                  <option value="BRIDE">Bride&apos;s Family</option>
                  <option value="GROOM">Groom&apos;s Family</option>
                  <option value="VIP">VIP Dignitary</option>
                  <option value="MUTUAL">Mutual Friend</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Phone (for WhatsApp RSVP)
                </label>
                <input
                  type="tel"
                  placeholder="+91 98200 12345"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  placeholder="rajesh@kapoor.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Dietary Preference
                </label>
                <select
                  value={dietaryPreference}
                  onChange={(e) => setDietaryPreference(e.target.value as MealPreference)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                >
                  <option value="VEG">Pure Vegetarian</option>
                  <option value="JAIN">Jain (No Root Vegetables)</option>
                  <option value="NON_VEG">Non-Vegetarian</option>
                  <option value="VEGAN">Vegan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Known Allergies
                </label>
                <input
                  type="text"
                  placeholder="e.g., Peanuts, Shellfish, Gluten"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-charcoal-700 mb-1">
                Accessibility or Special Logistics
              </label>
              <input
                type="text"
                placeholder="e.g., Wheelchair access needed for jetty boarding"
                value={accessibilityNeeds}
                onChange={(e) => setAccessibilityNeeds(e.target.value)}
                className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
              />
            </div>

            <div className="flex items-center space-x-2 pt-1">
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimaryContact}
                onChange={(e) => setIsPrimaryContact(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-sand-300 text-gold-600 focus:ring-gold-500"
              />
              <label htmlFor="isPrimary" className="text-xs text-charcoal-700">
                Primary household contact (receives family transport & room updates)
              </label>
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
                {isSubmitting ? "Creating..." : "Save Guest"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
