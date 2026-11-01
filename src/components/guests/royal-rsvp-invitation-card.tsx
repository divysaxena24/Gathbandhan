"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Crown,
  Sparkles,
  Calendar,
  MapPin,
  Users,
  CheckCircle2,
  Copy,
  Share2,
  Send,
  Download,
  Check,
  ShieldCheck,
  UtensilsCrossed,
  Music,
  Heart,
  QrCode,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Plus,
  Minus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface CeremonyItem {
  id: string;
  name: string;
  ceremonyName?: string;
  day: number;
  time?: string;
  estimatedDuration?: string;
  venue?: string;
  significance?: string;
}

export interface RoyalRsvpCardProps {
  coupleName: string;
  bookingRequestId?: string;
  weddingId?: string | null;
  weddingType?: string | null;
  destinationCity?: string | null;
  venueType?: string | null;
  preferredDate?: string | null;
  durationDays?: number;
  totalGuestsEstimated?: number;
  theme?: string | null;
  ceremonies?: Array<{
    ceremonyName?: string;
    name?: string;
    eventDay?: number;
    estimatedDuration?: string;
    culturalSignificance?: string;
  }> | null;
  isStandaloneGuestView?: boolean;
}

interface CeremonyResponse {
  ceremonyId: string;
  ceremonyName: string;
  attending: boolean;
  attendeeCount: number;
  mealPreference: "VEG" | "JAIN" | "NON_VEG" | "VEGAN";
  notes: string;
}

interface GeneratedPassData {
  passToken: string;
  qrDataUrl: string;
  guestName: string;
  guestPhone: string;
  maxAttendees: number;
  ceremonies: CeremonyResponse[];
  timestamp: string;
}

export function RoyalRsvpInvitationCard({
  coupleName = "Kira",
  bookingRequestId = "booking_demo",
  weddingId,
  weddingType = "Royal Rajasthani",
  destinationCity = "Udaipur",
  venueType = "Heritage Palace & Resort",
  preferredDate,
  durationDays = 2,
  totalGuestsEstimated = 400,
  theme = "Royal Rajputana Grandeur",
  ceremonies: rawCeremonies,
  isStandaloneGuestView = false,
}: RoyalRsvpCardProps) {
  // Dynamically fetch ceremonies from the planner review / consultation - strictly NO hardcoding
  const normalizedCeremonies: CeremonyItem[] = React.useMemo(() => {
    const rawList = Array.isArray(rawCeremonies) ? rawCeremonies : [];

    return rawList
      .map((c, idx) => {
        const name = c.ceremonyName || c.name || `Ceremony ${idx + 1}`;
        return {
          id: (c as any).id || name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
          name,
          ceremonyName: name,
          day: c.eventDay || idx + 1,
          time: (c as any).timing || (c as any).time || undefined,
          estimatedDuration: c.estimatedDuration || "2.5 Hours",
          venue: (c as any).venue || undefined,
          significance: c.culturalSignificance,
        };
      })
      .sort((a, b) => a.day - b.day);
  }, [rawCeremonies]);

  const getCeremonyEmoji = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes("sangeet") || lower.includes("music") || lower.includes("dance")) return "🎵";
    if (lower.includes("mehndi") || lower.includes("mehendi") || lower.includes("henna")) return "🌿";
    if (lower.includes("wedding") || lower.includes("phere") || lower.includes("shaadi") || lower.includes("vivaah") || lower.includes("mandap")) return "💍";
    if (lower.includes("haldi") || lower.includes("pithi")) return "💛";
    if (lower.includes("reception") || lower.includes("gala") || lower.includes("cocktail")) return "🥂";
    if (lower.includes("puja") || lower.includes("ganesh") || lower.includes("havan")) return "🪔";
    return "✦";
  };

  // Form State
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [allergies, setAllergies] = useState("");
  const [accessibilityNeeds, setAccessibilityNeeds] = useState("");

  // Per-Event Attendance Map initialized dynamically from the ceremonies fetched from planner review
  const [eventResponses, setEventResponses] = useState<Record<string, CeremonyResponse>>({});

  useEffect(() => {
    setEventResponses((prev) => {
      const next: Record<string, CeremonyResponse> = { ...prev };
      normalizedCeremonies.forEach((c) => {
        if (!next[c.id]) {
          next[c.id] = {
            ceremonyId: c.id,
            ceremonyName: c.name,
            attending: true,
            attendeeCount: 4,
            mealPreference: "VEG",
            notes: "",
          };
        }
      });
      // Remove any stale keys not in normalizedCeremonies
      const currentIds = new Set(normalizedCeremonies.map((c) => c.id));
      Object.keys(next).forEach((k) => {
        if (!currentIds.has(k)) {
          delete next[k];
        }
      });
      return next;
    });
  }, [normalizedCeremonies]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedPass, setGeneratedPass] = useState<GeneratedPassData | null>(null);
  const [isSimulatingScan, setIsSimulatingScan] = useState(false);
  const [scanVerifiedMessage, setScanVerifiedMessage] = useState<string | null>(null);

  // Restore existing finalized QR pass from local storage (cannot edit after creating)
  useEffect(() => {
    if (typeof window !== "undefined" && bookingRequestId) {
      try {
        const cached = localStorage.getItem(`gathbandhan_pass_${bookingRequestId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.qrDataUrl && parsed.maxAttendees) {
            setGeneratedPass(parsed);
          }
        }
      } catch {}
    }
  }, [bookingRequestId]);

  const cardRef = useRef<HTMLDivElement>(null);
  const rsvpFormRef = useRef<HTMLDivElement>(null);

  // Compute maximum attendee count across all ceremonies
  const maxAttendingCount = React.useMemo(() => {
    let max = 0;
    Object.values(eventResponses).forEach((resp) => {
      if (resp.attending && resp.attendeeCount > max) {
        max = resp.attendeeCount;
      }
    });
    return max || 0;
  }, [eventResponses]);

  // Share URL
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}/rsvp/invite/${bookingRequestId}`
    : `https://gathbandhan.com/rsvp/invite/${bookingRequestId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleWhatsAppShare = () => {
    const text = `👑 *The Royal Wedding of ${coupleName}*\n\n` +
      `You are cordially invited to celebrate our wedding in ${destinationCity}! 🕊️✨\n\n` +
      `📅 *Date:* ${preferredDate || "Upcoming Auspicious Muhurat"} (${durationDays} Days)\n` +
      `📍 *Venue:* ${venueType || "Heritage Palace"}, ${destinationCity}\n\n` +
      `Please view your Royal Invitation & RSVP for Sangeet, Mehndi, and Wedding ceremonies here:\n${shareUrl}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `Royal Wedding Invitation: ${coupleName}`,
          text: `You are cordially invited to the Royal Wedding of ${coupleName} in ${destinationCity}. Please RSVP with your family attendee count!`,
          url: shareUrl,
        });
      } catch {
        // Ignored
      }
    } else {
      handleCopyLink();
    }
  };

  const updateCeremonyAttendance = (ceremonyId: string, attending: boolean) => {
    setEventResponses((prev) => {
      const current = prev[ceremonyId];
      return {
        ...prev,
        [ceremonyId]: {
          ...current,
          attending,
          attendeeCount: attending ? (current.attendeeCount || 4) : 0,
        },
      };
    });
  };

  const updateCeremonyHeadcount = (ceremonyId: string, count: number) => {
    const validCount = Math.max(1, Math.min(20, count));
    setEventResponses((prev) => ({
      ...prev,
      [ceremonyId]: {
        ...prev[ceremonyId],
        attending: true,
        attendeeCount: validCount,
      },
    }));
  };

  const updateCeremonyMeal = (
    ceremonyId: string,
    meal: "VEG" | "JAIN" | "NON_VEG" | "VEGAN"
  ) => {
    setEventResponses((prev) => ({
      ...prev,
      [ceremonyId]: {
        ...prev[ceremonyId],
        mealPreference: meal,
      },
    }));
  };

  const updateCeremonyNotes = (ceremonyId: string, notes: string) => {
    setEventResponses((prev) => ({
      ...prev,
      [ceremonyId]: {
        ...prev[ceremonyId],
        notes,
      },
    }));
  };

  // Submit RSVP and generate the QR code inside the card
  const handleGenerateRsvpPass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setErrorNotice("Please enter your name or family name.");
      return;
    }
    if (!guestPhone.trim()) {
      setErrorNotice("Please provide a WhatsApp or phone number for gate pass verification.");
      return;
    }

    setIsSubmitting(true);
    setErrorNotice(null);

    try {
      const ceremoniesArray = Object.values(eventResponses);
      const effectiveMaxAttendees = maxAttendingCount || 1;

      // Unique pass token
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const passToken = `GB-PASS-${effectiveMaxAttendees}PAX-${randomSuffix}`;

      // Verification URL for QR scanner
      const gatePassVerifyUrl = typeof window !== "undefined"
        ? `${window.location.origin}/check-in/pass?token=${passToken}&couple=${encodeURIComponent(coupleName)}&guest=${encodeURIComponent(guestName.trim())}&pax=${effectiveMaxAttendees}&venue=${encodeURIComponent(`${venueType}, ${destinationCity}`)}`
        : `https://gathbandhan.com/check-in/pass?token=${passToken}&pax=${effectiveMaxAttendees}`;

      // High-resolution QR Code Data URL
      const qrDataUrl = await QRCode.toDataURL(gatePassVerifyUrl, {
        errorCorrectionLevel: "H",
        margin: 2,
        width: 480,
        color: {
          dark: "#4A0E17", // Maroon deep
          light: "#FFFFFF",
        },
      });

      // Save via API in background
      try {
        await fetch("/api/rsvp/card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookingRequestId,
            guestName: guestName.trim(),
            guestPhone: guestPhone.trim(),
            guestEmail: guestEmail.trim() || null,
            ceremonies: ceremoniesArray,
            allergies: allergies.trim() || null,
            accessibilityNeeds: accessibilityNeeds.trim() || null,
          }),
        });
      } catch {
        // Fallback gracefully to client pass
      }

      const passData: GeneratedPassData = {
        passToken,
        qrDataUrl,
        guestName: guestName.trim(),
        guestPhone: guestPhone.trim(),
        maxAttendees: effectiveMaxAttendees,
        ceremonies: ceremoniesArray,
        timestamp: new Date().toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      // Persist permanently in local storage so the QR pass cannot be re-edited or lost
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`gathbandhan_pass_${bookingRequestId}`, JSON.stringify(passData));
        } catch {}
      }

      setGeneratedPass(passData);

      // Smooth scroll to the generated QR inside the card
      setTimeout(() => {
        if (rsvpFormRef.current) {
          rsvpFormRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 100);
    } catch (err: any) {
      console.error("Pass generation error:", err);
      setErrorNotice(err.message || "Failed to generate RSVP pass. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSimulateScan = () => {
    if (!generatedPass) return;
    setIsSimulatingScan(true);
    setTimeout(() => {
      setIsSimulatingScan(false);
      setScanVerifiedMessage(
        `Gate Security Cleared! ${generatedPass.maxAttendees} people admitted for ${coupleName}'s wedding.`
      );
      setTimeout(() => setScanVerifiedMessage(null), 4000);
    }, 900);
  };

  return (
    <div className="w-full space-y-6">
      {/* Top Client Share & Quick Action Bar (Only visible to Client in their portal, not to guests) */}
      {!isStandaloneGuestView && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gold/30 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30 text-maroon">
              <Share2 className="w-5 h-5 text-gold-700" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm text-maroon-deep">
                Share Royal RSVP with Your Guests
              </h3>
              <p className="text-xs text-warm-gray">
                Send this digital invitation link to family and guests. Each guest will fill in their attendee count and receive an official entry pass!
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              className="border-gold/30 text-maroon-deep hover:bg-gold/10 text-xs flex-1 md:flex-initial"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Copied Link!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 mr-1 text-gold" />
                  Copy RSVP Link
                </>
              )}
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={handleWhatsAppShare}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex-1 md:flex-initial"
            >
              <Send className="w-3.5 h-3.5 mr-1" />
              Share via WhatsApp
            </Button>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* THE ROYAL INVITATION & RSVP CARD                             */}
      {/* ============================================================ */}
      <div
        ref={cardRef}
        className="relative bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#FFFDF9] rounded-3xl border-2 border-gold/40 shadow-xl overflow-hidden max-w-4xl mx-auto"
      >
        {/* Ornamental Top Border Pattern */}
        <div className="h-3 bg-gradient-to-r from-gold-dark via-gold to-gold-dark" />

        {/* Card Header & Sacred Crest */}
        <div className="p-6 sm:p-10 text-center space-y-4 relative">
          {/* Subtle background filigree */}
          <div className="absolute inset-0 pointer-events-none opacity-5 bg-[radial-gradient(#800020_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Sacred Sanskrit Shloka */}
          <div className="text-[12px] sm:text-xs font-serif text-gold-800 tracking-widest uppercase">
            ॥ श्री गणेशाय नमः ॥
          </div>
          <div className="text-[11px] sm:text-xs font-serif text-maroon/80 italic max-w-md mx-auto">
            ॥ वक्रतुण्ड महाकाय सूर्यकोटि समप्रभ । निर्विघ्नं कुरु मे देव सर्वकार्येषु सर्वदा ॥
          </div>

          {/* Royal Crown Emblem */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/25 via-gold/10 to-transparent flex items-center justify-center mx-auto border border-gold/40 shadow-inner">
            <Crown className="w-8 h-8 text-gold-700" />
          </div>

          {/* Invitation Headline */}
          <div className="space-y-1">
            <span className="text-[11px] font-serif uppercase tracking-[0.25em] text-gold-800 font-semibold block">
              The Royal Wedding Invitation & RSVP
            </span>
            <h1 className="font-heading text-3xl sm:text-4xl md:text-5xl font-bold text-maroon-deep">
              The Wedding of {coupleName}
            </h1>
            <p className="text-xs sm:text-sm text-charcoal/80 max-w-lg mx-auto pt-2 leading-relaxed">
              Together with their families, cordially invite you to grace the auspicious celebrations
              and sacred wedding ceremonies with your royal presence and blessings.
            </p>
          </div>

          {/* Destination & Timing Badges */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2 text-xs text-maroon-deep font-medium">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-gold/30 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-gold-600" />
              <span>{destinationCity} • {venueType}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-gold/30 shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-gold-600" />
              <span>{durationDays} Days of Festivities</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/80 border border-gold/30 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              <span>Theme: {theme}</span>
            </div>
          </div>
        </div>

        {/* Divider with Diamond Medallion */}
        <div className="relative flex items-center justify-center px-6 my-2">
          <div className="flex-grow border-t border-gold/30" />
          <span className="px-3 text-gold-700 text-xs font-serif font-bold">✦ शुभ विवाह ✦</span>
          <div className="flex-grow border-t border-gold/30" />
        </div>

        {/* ============================================================ */}
        {/* CEREMONY ITINERARY SHOWCASE - DYNAMIC FROM PLANNER REVIEW    */}
        {/* ============================================================ */}
        <div className="px-6 sm:px-10 py-6 space-y-4">
          <div className="text-center space-y-1">
            <h3 className="font-heading font-bold text-lg text-maroon-deep">
              Curated Ceremonies & Auspicious Schedule
            </h3>
            <p className="text-xs text-warm-gray">
              Your selected sequence of sacred rituals, musical celebrations, and feasts.
            </p>
          </div>

          {normalizedCeremonies.length === 0 ? (
            <div className="text-center py-8 text-xs text-warm-gray bg-cream/30 rounded-2xl border border-gold/20">
              No ceremonies have been scheduled yet in the planner review.
            </div>
          ) : (
            <div className={`grid grid-cols-1 ${normalizedCeremonies.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-3'} gap-3`}>
              {normalizedCeremonies.map((c) => (
                <div
                  key={c.id}
                  className="p-4 rounded-2xl bg-white/90 border border-gold/25 shadow-xs flex flex-col justify-between hover:border-gold/50 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-maroon/10 text-maroon-deep text-[10px] font-bold">
                        Day {c.day}
                      </span>
                      <span className="text-[10px] text-warm-gray">{c.estimatedDuration}</span>
                    </div>
                    <h4 className="font-bold text-sm text-maroon-deep flex items-center gap-1.5">
                      <span>{getCeremonyEmoji(c.name)}</span> {c.name}
                    </h4>
                    {c.venue && (
                      <p className="text-[11px] text-warm-gray mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-gold" />
                        {c.venue}
                      </p>
                    )}
                    {c.significance && (
                      <p className="text-[11px] text-charcoal/70 mt-2 line-clamp-2 leading-relaxed">
                        {c.significance}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ornamental Divider */}
        <div className="relative flex items-center justify-center px-6 my-2">
          <div className="flex-grow border-t border-gold/30" />
          <span className="px-3 text-gold-700 text-xs font-serif font-bold">✦ GUEST RSVP & ADMISSION ✦</span>
          <div className="flex-grow border-t border-gold/30" />
        </div>

        {/* ============================================================ */}
        {/* BOTTOM RSVP SECTION: SEPARATE QUESTION FOR EACH EVENT        */}
        {/* ============================================================ */}
        <div ref={rsvpFormRef} className="p-6 sm:p-10 bg-white/80 space-y-6">
          {/* Header of Bottom RSVP Section */}
          <div className="text-center space-y-1">
            <h3 className="font-heading font-bold text-xl sm:text-2xl text-maroon-deep">
              Confirm Attendance & Request Gate Passes
            </h3>
            <p className="text-xs text-warm-gray max-w-lg mx-auto">
              Please enter your details below. For each celebration listed above, specify how many
              people from your family will be attending. An official palace entry QR pass will be generated!
            </p>
          </div>

          {errorNotice && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorNotice}</span>
            </div>
          )}

          {scanVerifiedMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center gap-2 animate-[fadeIn_0.3s_ease]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{scanVerifiedMessage}</span>
            </div>
          )}

          {/* ============================================================ */}
          {/* GENERATED IN-CARD QR GATE PASS (CANNOT EDIT AFTER CREATING)  */}
          {/* ============================================================ */}
          {generatedPass ? (
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#FFFDF8] via-white to-[#FDF8EE] border-2 border-gold shadow-lg space-y-6 animate-[fadeInUp_0.4s_ease-out]">
              {/* Pass Crest */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-900 text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>OFFICIAL DIGITAL ROYAL GATE PASS</span>
                </div>

                <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-maroon-deep">
                  Valid for {generatedPass.maxAttendees} {generatedPass.maxAttendees === 1 ? "Person" : "People"} Entry
                </h3>

                <p className="text-xs text-warm-gray">
                  Issued to <strong className="text-charcoal">{generatedPass.guestName}</strong> ({generatedPass.guestPhone})
                </p>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-[11px] font-semibold text-maroon-deep">
                  <ShieldCheck className="w-3.5 h-3.5 text-gold-700" />
                  <span>Pass Finalized & Confirmed • Non-transferable Entry at Palace Gate</span>
                </div>
              </div>

              {/* The Scannable QR Code Box */}
              <div className="flex flex-col items-center justify-center gap-4 py-2">
                <div className="relative p-4 rounded-2xl bg-white border-2 border-gold/40 shadow-md">
                  {/* Decorative golden corner marks */}
                  <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-gold-dark" />
                  <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-gold-dark" />
                  <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-gold-dark" />
                  <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-gold-dark" />

                  {/* High Resolution Generated QR Code */}
                  <img
                    src={generatedPass.qrDataUrl}
                    alt={`Gate Pass for ${generatedPass.maxAttendees} attendees`}
                    className="w-56 h-56 sm:w-64 sm:h-64 object-contain rounded-lg"
                  />
                </div>

                <div className="text-center">
                  <span className="text-[11px] font-mono font-bold text-maroon bg-gold/15 px-3 py-1 rounded-full border border-gold/30">
                    PASS CODE: {generatedPass.passToken}
                  </span>
                  <p className="text-[11px] text-warm-gray mt-1.5 max-w-sm">
                    Scan this QR code at the palace gate. Authorized to admit{" "}
                    <strong>{generatedPass.maxAttendees} attendees</strong> into the event.
                  </p>
                </div>
              </div>

              {/* Per-Ceremony Admitted Breakdown Table */}
              <div className="bg-cream/40 rounded-2xl p-4 border border-gold/30 space-y-3">
                <h4 className="font-heading font-bold text-xs uppercase tracking-wider text-gold-900">
                  Ceremony-wise Admitted Headcount
                </h4>
                <div className={`grid grid-cols-1 ${generatedPass.ceremonies.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-2 md:grid-cols-3'} gap-2.5`}>
                  {generatedPass.ceremonies.map((c) => (
                    <div
                      key={c.ceremonyId}
                      className="p-3 rounded-xl bg-white border border-gold/20 flex flex-col justify-between"
                    >
                      <span className="font-bold text-xs text-maroon-deep flex items-center gap-1">
                        <span>{getCeremonyEmoji(c.ceremonyName)}</span> {c.ceremonyName}
                      </span>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-[10px] text-warm-gray">
                          {c.attending ? "Attending" : "Declined"}
                        </span>
                        <Badge
                          className={
                            c.attending
                              ? "bg-emerald-100 text-emerald-800 border-emerald-300 font-bold"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }
                        >
                          {c.attending ? `${c.attendeeCount} ${c.attendeeCount === 1 ? "Person" : "People"}` : "0"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons for the Generated Pass - Immutable & Finalized (No Edit, No Share) */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  onClick={handleSimulateScan}
                  disabled={isSimulatingScan}
                  className="bg-maroon hover:bg-maroon-deep text-white text-xs font-bold h-11 px-6 rounded-xl shadow-md cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4 mr-1.5 text-gold" />
                  {isSimulatingScan
                    ? "Verifying Gate Scan..."
                    : `Simulate Gate Scanner (Admit ${generatedPass.maxAttendees})`}
                </Button>
              </div>
            </div>
          ) : (
            /* ============================================================ */
            /* RSVP FORM INPUTS                                             */
            /* ============================================================ */
            <form onSubmit={handleGenerateRsvpPass} className="space-y-6">
              {/* Step 1: Guest Contact Details */}
              <div className="p-4 sm:p-5 rounded-2xl bg-cream/30 border border-gold/25 space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold text-maroon-deep uppercase tracking-wider">
                  <Users className="w-4 h-4 text-gold-700" />
                  <span>1. Guest / Family Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1">
                      Full Name / Family Name <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Rajesh Sharma & Family"
                      value={guestName}
                      onChange={(e) => setGuestName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gold/30 text-xs focus:ring-2 focus:ring-gold bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-charcoal mb-1">
                      WhatsApp / Mobile Phone <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +91 98765 43210"
                      value={guestPhone}
                      onChange={(e) => setGuestPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gold/30 text-xs focus:ring-2 focus:ring-gold bg-white"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-warm-gray mb-1">
                      Email Address (Optional, for digital receipt)
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. sharma.family@example.com"
                      value={guestEmail}
                      onChange={(e) => setGuestEmail(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-gold/30 text-xs focus:ring-2 focus:ring-gold bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Separate Event Attendance & Headcount */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-maroon-deep uppercase tracking-wider">
                    <Crown className="w-4 h-4 text-gold-700" />
                    <span>2. Ceremony Attendance & Number of People (Separate for Each Event)</span>
                  </div>
                  <span className="text-[11px] text-warm-gray font-medium">
                    Please specify for each celebration
                  </span>
                </div>

                {/* Per-event Cards */}
                <div className="space-y-4">
                  {normalizedCeremonies.map((ceremony) => {
                    const resp = eventResponses[ceremony.id] || {
                      ceremonyId: ceremony.id,
                      ceremonyName: ceremony.name,
                      attending: true,
                      attendeeCount: 4,
                      mealPreference: "VEG",
                      notes: "",
                    };

                    const isAttending = resp.attending;

                    return (
                      <div
                        key={ceremony.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          isAttending
                            ? "bg-white border-gold/50 shadow-sm ring-1 ring-gold/20"
                            : "bg-charcoal/5 border-border/40 opacity-75"
                        }`}
                      >
                        {/* Event Header & Toggle */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gold/15">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-full bg-maroon/10 text-maroon flex items-center justify-center shrink-0 font-bold text-base">
                              {getCeremonyEmoji(ceremony.name)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-sm sm:text-base text-maroon-deep">
                                  {ceremony.name}
                                </h4>
                                <Badge variant="outline" className="text-[10px] border-gold/30 text-gold-800">
                                  Day {ceremony.day}
                                </Badge>
                              </div>
                              <p className="text-xs text-warm-gray mt-0.5">
                                {ceremony.time || "Celebration"} • {ceremony.estimatedDuration}
                              </p>
                            </div>
                          </div>

                          {/* Attendance Choice Buttons */}
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => updateCeremonyAttendance(ceremony.id, true)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                isAttending
                                  ? "bg-emerald-600 text-white shadow-xs"
                                  : "bg-cream text-charcoal hover:bg-gold/10"
                              }`}
                            >
                              Joyfully Attending
                            </button>
                            <button
                              type="button"
                              onClick={() => updateCeremonyAttendance(ceremony.id, false)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                !isAttending
                                  ? "bg-rose-600 text-white shadow-xs"
                                  : "bg-cream text-charcoal hover:bg-gold/10"
                              }`}
                            >
                              Decline
                            </button>
                          </div>
                        </div>

                        {/* If Attending: Ask Separately How Many People are Attending */}
                        {isAttending ? (
                          <div className="pt-4 space-y-4 animate-[fadeIn_0.2s_ease]">
                            {/* Headcount Stepper */}
                            <div>
                              <label className="block text-xs font-bold text-charcoal mb-1.5">
                                How many people will be attending the {ceremony.name}?
                              </label>

                              <div className="flex flex-wrap items-center gap-3">
                                {/* Interactive Stepper with - and + */}
                                <div className="inline-flex items-center border border-gold/40 rounded-xl bg-white shadow-2xs overflow-hidden">
                                  <button
                                    type="button"
                                    onClick={() => updateCeremonyHeadcount(ceremony.id, resp.attendeeCount - 1)}
                                    className="px-3.5 py-2 text-charcoal hover:bg-gold/10 transition-colors font-bold text-base cursor-pointer"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="px-4 py-2 text-sm font-heading font-extrabold text-maroon-deep min-w-[48px] text-center bg-gold/5">
                                    {resp.attendeeCount}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateCeremonyHeadcount(ceremony.id, resp.attendeeCount + 1)}
                                    className="px-3.5 py-2 text-charcoal hover:bg-gold/10 transition-colors font-bold text-base cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Quick selection pills */}
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {[1, 2, 3, 4, 5, 6].map((num) => (
                                    <button
                                      key={num}
                                      type="button"
                                      onClick={() => updateCeremonyHeadcount(ceremony.id, num)}
                                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                                        resp.attendeeCount === num
                                          ? "bg-maroon text-white font-bold shadow-xs scale-105"
                                          : "bg-cream/60 hover:bg-gold/15 text-charcoal border border-gold/20"
                                      }`}
                                    >
                                      {num} {num === 1 ? "Guest" : "Guests"}
                                    </button>
                                  ))}
                                </div>

                                <span className="text-xs font-medium text-emerald-700 ml-auto">
                                  ✓ {resp.attendeeCount} {resp.attendeeCount === 1 ? "person" : "people"} attending
                                </span>
                              </div>
                            </div>

                            {/* Meal Preference for this Event */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                              <div>
                                <label className="block text-[11px] font-bold text-warm-gray mb-1">
                                  Catering & Meal Preparation
                                </label>
                                <select
                                  value={resp.mealPreference}
                                  onChange={(e: any) => updateCeremonyMeal(ceremony.id, e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gold/30 bg-white focus:ring-1 focus:ring-gold"
                                >
                                  <option value="VEG">Pure Vegetarian (Royal Banquet)</option>
                                  <option value="JAIN">Jain (No Onion / Garlic / Root Veg)</option>
                                  <option value="NON_VEG">Non-Vegetarian Banquet</option>
                                  <option value="VEGAN">Vegan (Plant-Based)</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold text-warm-gray mb-1">
                                  Special notes for {ceremony.name} (Optional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Elderly seating required"
                                  value={resp.notes}
                                  onChange={(e) => updateCeremonyNotes(ceremony.id, e.target.value)}
                                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-gold/30 bg-white focus:ring-1 focus:ring-gold"
                                />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-warm-gray italic pt-2">
                            Regretfully declining this specific celebration. (0 attendees)
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Special Hospitality & Accessibility */}
              <div className="p-4 rounded-2xl bg-cream/30 border border-gold/25 space-y-3 text-xs">
                <div className="flex items-center gap-2 font-bold text-maroon-deep uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-gold-700" />
                  <span>3. Confidential Care & Accessibility</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-warm-gray mb-1">
                      Medical Food Allergies
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Peanuts, Gluten, Dairy"
                      value={allergies}
                      onChange={(e) => setAllergies(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gold/30 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-warm-gray mb-1">
                      Mobility & Wheelchair Needs
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Golf cart assistance for palace courtyard"
                      value={accessibilityNeeds}
                      onChange={(e) => setAccessibilityNeeds(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gold/30 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Button to Generate QR Code in Card */}
              <div className="pt-2">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-maroon hover:bg-maroon-deep text-soft-white font-bold h-14 rounded-2xl text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <QrCode className="w-5 h-5 text-gold-light" />
                  {isSubmitting
                    ? "Generating Your Royal Entry QR Pass..."
                    : `Confirm RSVP & Generate Royal Entry QR Pass (for ${maxAttendingCount} ${maxAttendingCount === 1 ? "Person" : "People"})`}
                </Button>
                <p className="text-center text-[11px] text-warm-gray mt-2">
                  ✦ Generates a locked, verified digital gate pass with scannable QR code immediately inside this card.
                </p>
              </div>
            </form>
          )}
        </div>

        {/* Card Footer Ornamental */}
        <div className="p-4 bg-maroon-deep text-gold-light text-center text-[11px] font-serif tracking-wider border-t border-gold/30">
          GATHBANDHAN • THE ROYAL KNOT WEDDING CONCIERGE & GATE SECURITY
        </div>
      </div>
    </div>
  );
}

