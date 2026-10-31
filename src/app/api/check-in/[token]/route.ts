import { NextRequest } from "next/server";
import {
  getPublicCheckInPass,
  submitPublicCheckIn,
} from "@/modules/control-room/services/check-in-service";
import { publicCheckInSubmitSchema } from "@/modules/control-room/validation";
import { successResponse, errorResponse } from "@/lib/errors/api-response";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const pass = await getPublicCheckInPass(token);
    return successResponse(pass);
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
    const validated = publicCheckInSubmitSchema.parse(body);

    const updated = await submitPublicCheckIn(
      token,
      validated.status,
      validated.notes,
      validated.checkedInBy
    );

    return successResponse(updated);
  } catch (error) {
    return errorResponse(error);
  }
}
