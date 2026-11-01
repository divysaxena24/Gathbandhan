import Link from "next/link";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Crown } from "lucide-react";
import { PortalSelectCards } from "./portal-select-cards";
import { PortalUserHeader } from "./portal-user-header";
import { db } from "@/lib/db";
import { users, bookingRequests } from "@/lib/db/schema";
import { eq, or, desc } from "drizzle-orm";
import { isAuthorizedAdminEmail } from "@/lib/auth/admin-whitelist";

export default async function PortalSelectPage() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;

  const displayName = user?.firstName
    ? `${user.firstName}${user.lastName ? " " + user.lastName : ""}`
    : "Distinguished Guest";

  const primaryEmail = user?.emailAddresses?.[0]?.emailAddress?.toLowerCase() || "";
  const isAdminAllowed = isAuthorizedAdminEmail(primaryEmail);

  let currentRole: string | null = null;
  let activeBookingRequestId: string | null = null;
  let activeWeddingId: string | null = null;

  if (userId) {
    try {
      const [dbUser] = await db
        .select()
        .from(users)
        .where(or(eq(users.authProviderId, userId), eq(users.email, primaryEmail)))
        .limit(1);

      if (dbUser) {
        currentRole = isAdminAllowed ? dbUser.role : "CLIENT";
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
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-maroon/5 rounded-full blur-3xl" />
      </div>

      {/* Top Brand Bar with Sign Out / User Controls */}
      <header className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 sm:py-8 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-10 h-10 rounded-full bg-gold/15 flex items-center justify-center border border-gold/30 group-hover:scale-105 transition-transform">
            <Crown className="w-5 h-5 text-gold-600" />
          </div>
          <div>
            <span className="font-heading font-bold text-2xl text-maroon-deep tracking-tight block leading-none">
              Gathbandhan
            </span>
            <span className="text-[10px] text-gold uppercase tracking-widest font-semibold block pt-0.5">
              Portal Directory
            </span>
          </div>
        </Link>

        {/* User Account Controls & Logout Button */}
        <PortalUserHeader userEmail={primaryEmail} />
      </header>

      {/* Content Area */}
      <section className="relative z-10 max-w-5xl mx-auto w-full px-6 py-4 sm:py-6 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-3 mb-8 sm:mb-10">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/10 border border-gold/25 text-xs font-semibold text-gold-800">
              Welcome, {displayName}
            </div>
            {!isAdminAllowed && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-medium text-amber-900">
                <span>Account: <strong>{primaryEmail}</strong> (Client)</span>
              </div>
            )}
          </div>

          <h1 className="font-heading font-bold text-3xl sm:text-5xl text-maroon-deep tracking-tight">
            Select Your Destination
          </h1>
          <p className="text-sm sm:text-base text-charcoal-500 max-w-xl mx-auto font-sans leading-relaxed">
            Choose whether to manage planning and operational workflows as an authorized organizer, or review bespoke proposals and guest itineraries as a client.
          </p>
        </div>

        {/* Client Component with Instant Client Portal Navigation and Admin Guard */}
        <PortalSelectCards
          currentRole={currentRole}
          activeBookingRequestId={activeBookingRequestId}
          activeWeddingId={activeWeddingId}
          isAdminAllowed={isAdminAllowed}
          userEmail={primaryEmail}
        />
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-charcoal-400">
        <p>© 2026–2027 Gathbandhan — Where Every Celebration Comes Together.</p>
      </footer>
    </main>
  );
}
