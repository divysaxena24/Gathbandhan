/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import {
  getGuestsForWedding,
  createGuest,
} from "@/modules/guests/services/guest-service";
import { createGuestSchema } from "@/modules/guests/validation";
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

    const search = searchParams.get("search") || undefined;
    const household = searchParams.get("household") || undefined;
    const side = searchParams.get("side") || undefined;

    const guestList = await getGuestsForWedding(weddingId, {
      search,
      household,
      side,
    });

    return successResponse(guestList);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAuth();
    const body = await req.json();
    const validated = createGuestSchema.parse(body);

    const created = await createGuest(validated as any);
    return successResponse(created);
  } catch (error) {
    return errorResponse(error);
  }
}
