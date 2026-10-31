import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getAccommodationBookings,
  createAccommodationBooking,
} from "@/modules/guests/services/logistics-service";
import { createAccommodationSchema } from "@/modules/guests/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";
import { ValidationError } from "@/lib/errors";

export async function GET(req: NextRequest) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const weddingId = searchParams.get("weddingId");

    if (!weddingId) {
      throw new ValidationError("weddingId query parameter is required");
    }

    const bookings = await getAccommodationBookings(weddingId);
    return successResponse(bookings);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = createAccommodationSchema.parse(body);

    const created = await createAccommodationBooking(validated);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
