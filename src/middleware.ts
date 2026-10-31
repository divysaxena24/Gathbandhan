import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/check-in(.*)",
  "/api/check-in(.*)",
  "/rsvp(.*)",
  "/api/rsvp(.*)",
  "/plan-your-wedding(.*)",
  "/client(.*)",
  "/portal-select(.*)",
  "/api/wedding-ai(.*)",
  "/api/consultations(.*)",
  "/api/services(.*)",
  "/api/budget(.*)",
  "/api/leads/client-consultation(.*)",
  "/api/booking-requests(.*)",
  "/api/auth(.*)",
  "/manifest.webmanifest",
  "/manifest.json",
  "/",
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
