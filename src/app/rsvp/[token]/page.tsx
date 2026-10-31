"use client";

import React, { useState, useEffect, use } from "react";
import {
  Crown,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicRsvpDetails, MealPreference, RsvpStatus } from "@/modules/guests/types";

interface RsvpEventFormState {
  eventId: string;
  status: RsvpStatus;
  plusOnes: number;
  mealPreference: MealPreference;
  dietaryNotes: string;
}

export default function PublicRsvpPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [isLoading, setIsLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [data, setData] = useState<PublicRsvpDetails | null>(null);

  // Form submission state
  const [eventResponses, setEventResponses] = useState<Record<string, RsvpEventFormState>>({});
  const [allergies, setAllergies] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    async function loadRsvp() {
      try {
        const res = await fetch(`/api/rsvp/${token}`);
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error?.message || "Invalid or expired RSVP invitation link");
        }

        const details: PublicRsvpDetails = json.data;
        setData(details);
        setAllergies(details.guest.allergies || "");
        setAccessibilityNeeds(details.guest.accessibilityNeeds || "");

        // Pre-fill response states from current RSVP status
        const initialStates: Record<string, RsvpEventFormState> = {};
        details.events.forEach((ev) => {
          initialStates[ev.id] = {
            eventId: ev.id,
            status: ev.currentStatus === "INVITED" ? "ATTENDING" : ev.currentStatus,
            plusOnes: ev.currentPlusOnes || 0,
            mealPreference: ev.currentMealPreference || details.guest.dietaryPreference || "VEG",
            dietaryNotes: ev.currentDietaryNotes || "",
          };
        });
        setEventResponses(initialStates);
      } catch (err: unknown) {
        setErrorNotice((err as Error).message || "Could not load invitation");
      } finally {
        setIsLoading(false);
      }
    }

    loadRsvp();
  }, [token]);

  const handleStatusChange = (eventId: string, newStatus: RsvpStatus) => {
    setEventResponses((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        status: newStatus,
      },
    }));
  };

  const handleMealChange = (eventId: string, meal: MealPreference) => {
    setEventResponses((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        mealPreference: meal,
      },
    }));
  };

  const handlePlusOnesChange = (eventId: string, count: number) => {
    setEventResponses((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        plusOnes: Math.max(0, count),
      },
    }));
  };

  const handleDietaryNotesChange = (eventId: string, notes: string) => {
    setEventResponses((prev) => ({
      ...prev,
      [eventId]: {
        ...prev[eventId],
        dietaryNotes: notes,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorNotice(null);

    try {
      const payload = {
        rsvps: Object.values(eventResponses).map((r) => ({
          eventId: r.eventId,
          status: r.status,
          plusOnes: r.plusOnes,
          mealPreference: r.mealPreference,
          dietaryNotes: r.dietaryNotes.trim() || null,
        })),
        allergies: allergies.trim() || null,
        accessibilityNeeds: accessibilityNeeds.trim() || null,
      };

      const res = await fetch(`/api/rsvp/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || "Failed to submit RSVP");
      }

      setIsSubmitted(true);
    } catch (err: unknown) {
      setErrorNotice((err as Error).message || "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-sand-50/50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto animate-pulse">
            <Crown className="w-6 h-6 text-gold-700" />
          </div>
          <p className="font-serif text-charcoal-700">Loading your royal invitation...</p>
        </div>
      </div>
    );
  }

  if (errorNotice && !data) {
    return (
      <div className="min-h-screen bg-sand-50/50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-sand-200 shadow-lg text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-50 flex items-center justify-center mx-auto text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-serif text-xl text-charcoal-900">Invitation Not Found</h2>
          <p className="text-xs text-charcoal-600 leading-relaxed">{errorNotice}</p>
          <div className="text-[11px] text-charcoal-400 pt-2 border-t border-sand-100">
            Please check your invitation SMS or WhatsApp link, or contact the wedding planning concierge.
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-sand-50/40 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-white p-8 rounded-2xl border border-sand-200 shadow-xl text-center space-y-5 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto text-emerald-600 shadow-sm">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] uppercase font-serif tracking-widest text-gold-700 font-bold">
              Response Confirmed
            </span>
            <h2 className="font-serif text-2xl text-charcoal-900 mt-1">
              Shubh Aagman!
            </h2>
            <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
              Thank you, <strong className="text-charcoal-900">{data.guest.firstName}</strong>. Your attendance and dietary selections for{" "}
              <strong>{data.wedding.title}</strong> have been recorded in the royal registry.
            </p>
          </div>

          <div className="bg-sand-50/70 p-4 rounded-xl border border-sand-200 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-charcoal-700">
              <MapPin className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
              <span>{data.wedding.venue}, {data.wedding.city}</span>
            </div>
            {data.wedding.startDate && (
              <div className="flex items-center gap-2 text-charcoal-700">
                <Calendar className="w-3.5 h-3.5 text-gold-600 flex-shrink-0" />
                <span>
                  {new Date(data.wedding.startDate).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-charcoal-500 italic">
            You can revisit this link anytime before the celebrations to adjust your schedule or meal preferences.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sand-50/40 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Royal Header */}
        <div className="bg-white rounded-2xl border border-sand-200 shadow-sm p-6 sm:p-8 text-center space-y-3 relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-gold-400 via-gold-600 to-gold-400" />
          
          <div className="w-12 h-12 rounded-full bg-gold/15 flex items-center justify-center mx-auto border border-gold/30">
            <Crown className="w-6 h-6 text-gold-700" />
          </div>

          <div>
            <span className="text-[11px] font-serif uppercase tracking-widest text-gold-800 font-semibold">
              The Royal Wedding of
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-charcoal-900 mt-1">
              {data.wedding.title}
            </h1>
            <div className="flex items-center justify-center gap-3 text-xs text-charcoal-600 mt-2">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gold-600" />
                {data.wedding.venue}, {data.wedding.city}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-sand-100">
            <span className="text-xs text-charcoal-500">Welcome,</span>
            <div className="font-serif text-lg text-charcoal-900 font-medium">
              {data.guest.firstName} {data.guest.lastName}
              {data.guest.householdName && (
                <span className="text-xs font-sans text-charcoal-500 font-normal ml-2">
                  ({data.guest.householdName})
                </span>
              )}
            </div>
          </div>
        </div>

        {errorNotice && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorNotice}</span>
          </div>
        )}

        {/* Ceremony RSVP Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="font-serif text-base text-charcoal-900">
                Ceremonies & Celebrations
              </h2>
              <span className="text-xs text-charcoal-500">
                Please respond for each event
              </span>
            </div>

            {data.events.map((event) => {
              const currentResp = eventResponses[event.id] || {
                status: "ATTENDING",
                plusOnes: 0,
                mealPreference: "VEG",
                dietaryNotes: "",
              };
              const isAttending = currentResp.status === "ATTENDING";

              return (
                <div
                  key={event.id}
                  className={`bg-white rounded-xl border transition-all p-5 space-y-4 ${
                    isAttending
                      ? "border-gold-300 shadow-sm ring-1 ring-gold-200/50"
                      : "border-sand-200 opacity-90"
                  }`}
                >
                  {/* Event Details */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-sand-100 pb-3">
                    <div>
                      <h3 className="font-serif text-base font-semibold text-charcoal-900">
                        {event.name}
                      </h3>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-charcoal-500 mt-1">
                        {event.startsAt && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-charcoal-400" />
                            {new Date(event.startsAt).toLocaleDateString("en-IN", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        {event.venue && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-charcoal-400" />
                            {event.venue}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Attendance Buttons */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleStatusChange(event.id, "ATTENDING")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          currentResp.status === "ATTENDING"
                            ? "bg-emerald-600 text-white shadow-sm font-semibold"
                            : "bg-sand-100 text-charcoal-600 hover:bg-sand-200"
                        }`}
                      >
                        Joyfully Accept
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStatusChange(event.id, "DECLINED")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          currentResp.status === "DECLINED"
                            ? "bg-rose-600 text-white shadow-sm font-semibold"
                            : "bg-sand-100 text-charcoal-600 hover:bg-sand-200"
                        }`}
                      >
                        Regretfully Decline
                      </button>
                    </div>
                  </div>

                  {/* Attending Sub-form */}
                  {isAttending && (
                    <div className="space-y-3 pt-1 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-charcoal-700 mb-1">
                            Additional Family / Plus-Ones
                          </label>
                          <select
                            value={currentResp.plusOnes}
                            onChange={(e) =>
                              handlePlusOnesChange(event.id, parseInt(e.target.value, 10))
                            }
                            className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                          >
                            <option value={0}>Just me (1 attendee)</option>
                            <option value={1}>+1 accompanying guest (2 total)</option>
                            <option value={2}>+2 family members (3 total)</option>
                            <option value={3}>+3 family members (4 total)</option>
                            <option value={4}>+4 family delegation (5 total)</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-charcoal-700 mb-1">
                            Meal Preparation
                          </label>
                          <select
                            value={currentResp.mealPreference}
                            onChange={(e) =>
                              handleMealChange(event.id, e.target.value as MealPreference)
                            }
                            className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500 bg-white"
                          >
                            <option value="VEG">Pure Vegetarian (Standard Royal Buffet)</option>
                            <option value="JAIN">Jain (No Root Veg / Onion / Garlic)</option>
                            <option value="NON_VEG">Non-Vegetarian</option>
                            <option value="VEGAN">Vegan (Dairy-Free)</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <input
                          type="text"
                          placeholder="Special requests for this ceremony (optional)..."
                          value={currentResp.dietaryNotes}
                          onChange={(e) => handleDietaryNotesChange(event.id, e.target.value)}
                          className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Confidential Allergies & Logistics Card */}
          <div className="bg-white rounded-xl border border-sand-200 shadow-sm p-5 space-y-3">
            <h3 className="font-serif text-sm font-semibold text-charcoal-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gold-600" />
              Dietary & Accessibility Care
            </h3>
            <p className="text-xs text-charcoal-500">
              To ensure our hospitality team takes the utmost care of your family in Udaipur.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Food Allergies (Medical)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Peanuts, Gluten, Dairy, Shellfish"
                  value={allergies}
                  onChange={(e) => setAllergies(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-charcoal-700 mb-1">
                  Mobility / Accessibility Needs
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wheelchair access for palace boat pier"
                  value={accessibilityNeeds}
                  onChange={(e) => setAccessibilityNeeds(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-sand-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gold-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-charcoal text-ivory hover:bg-charcoal-800 py-3 text-sm font-serif shadow-md"
          >
            {isSubmitting ? "Submitting Your Response..." : "Confirm Royal RSVP"}
          </Button>
        </form>
      </div>
    </div>
  );
}
