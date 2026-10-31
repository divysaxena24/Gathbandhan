import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Crown, Sparkles } from "lucide-react";
import { PortalSelectCards } from "./portal-select-cards";
import { db } from "@/lib/db";
import { users, bookingRequests } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";

export default async function PortalSelectPage() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : "Distinguished Guest";

  let currentRole: string | null = null;
  let activeBookingRequestId: string | null = null;
  let activeWeddingId: string | null = null;

  if (userId) {
    try {
      const primaryEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
      const [dbUser] = await db
        .select()
        .from(users)
        .where(or(eq(users.authProviderId, userId), eq(users.email, primaryEmail)))
        .limit(1);

      if (dbUser) {
        currentRole = dbUser.role;
        const [latestReq] = await db
          .select({ id: bookingRequests.id, weddingId: bookingRequests.weddingId })
          .from(bookingRequests)
          .where(
            or(
              eq(bookingRequests.userId, dbUser.id),
              eq(bookingRequests.contactEmail, dbUser.email)
            )
          )
          .orderBy(desc(bookingRequests.createdAt))
          .limit(1);

        if (latestReq) {
          activeBookingRequestId = latestReq.id;
          activeWeddingId = latestReq.weddingId || null;
        }
      }
    } catch (dbError) {
      console.warn("[PortalSelect] Database offline or uninitialized:", dbError);
    }
  }

  return (
    <main className="min-h-screen bg-ivory flex flex-col justify-between selection:bg-gold/20">
      {/* Header */}
      <header className="border-b border-gold/15 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30 shadow-xs">
              <Crown className="w-5 h-5 text-gold-600" />
            </div>
            <div>
              <span className="font-heading font-bold text-lg text-maroon-deep tracking-wide">
                Gathbandhan
              </span>
              <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-gold/10 text-gold-600 border border-gold/20 uppercase">
                Unified Portals
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-4 text-xs">
            <span className="text-charcoal-500 hidden sm:inline">
              Signed in as <strong className="text-charcoal-800">{displayName}</strong>
            </span>
            <Link href="/" className="text-gold-600 hover:text-maroon font-medium transition-colors">
              Return Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Role Selection Content */}
      <section className="max-w-5xl mx-auto px-6 py-12 flex-1 flex flex-col items-center justify-center">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/10 border border-gold/20 text-xs font-semibold text-gold-700 mb-4">
            <Sparkles className="w-3.5 h-3.5 text-gold" />
            Two-Way Wedding Operating Platform
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-bold text-maroon-deep tracking-tight mb-4">
            Select Your Portal
          </h1>
          <p className="text-warm-gray text-sm sm:text-base leading-relaxed">
            Welcome to Gathbandhan. Connect seamlessly between operational agency management and client wedding consultation. Choose how you want to proceed:
          </p>
        </div>

        <PortalSelectCards
          currentRole={currentRole}
          activeBookingRequestId={activeBookingRequestId}
          activeWeddingId={activeWeddingId}
        />
      </section>

      {/* Footer */}
      <footer className="border-t border-gold/15 py-6 text-center text-xs text-warm-gray">
        <p>© 2026 Gathbandhan — The Operating System & Client Platform for Luxury Weddings.</p>
      </footer>
    </main>
  );
}
