import { NextRequest } from "next/server";
import {
  getGuestByRsvpToken,
  submitGuestRsvp,
} from "@/modules/guests/services/guest-service";
import { submitGuestRsvpSchema } from "@/modules/guests/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const details = await getGuestByRsvpToken(token);
    return successResponse(details);
  } catch (error) {
    return errorResponse(error);
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await req.json();
    const validated = submitGuestRsvpSchema.parse(body);

    const result = await submitGuestRsvp(token, validated);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}

