// ============================================================
// Gathbandhan — Consultations API Route Handler
// POST /api/consultations (save session)
// GET /api/consultations (retrieve active sessions)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { consultationSaveSchema } from '@/validations/wedding';

// In-memory / session cache store (can connect to Prisma/PostgreSQL)
const activeConsultations = new Map<string, {
  id: string;
  sessionToken: string;
  currentStepIndex: number;
  selections: Record<string, unknown>;
  updatedAt: string;
}>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = consultationSaveSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid consultation payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const sessionToken = parsed.data.sessionToken || `ses_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const consultationId = `cons_${sessionToken.substring(4)}`;

    const saved = {
      id: consultationId,
      sessionToken,
      currentStepIndex: parsed.data.currentStepIndex,
      selections: parsed.data.selections,
      updatedAt: new Date().toISOString(),
    };

    activeConsultations.set(sessionToken, saved);

    return NextResponse.json({
      success: true,
      consultationId,
      sessionToken,
      message: 'Consultation saved successfully',
    });
  } catch (error: unknown) {
    console.error('Save consultation error:', error);
    return NextResponse.json(
      { error: 'Failed to save consultation session' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Session token required' }, { status: 400 });
  }

  const existing = activeConsultations.get(token);
  if (!existing) {
    return NextResponse.json({ error: 'Consultation session not found' }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    consultation: existing,
  });
}
