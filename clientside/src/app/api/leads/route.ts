// ============================================================
// Gathbandhan — Lead Capture API Route Handler
// POST /api/leads
// Captures couple contact details and consultation state
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { leadSchema } from '@/validations/wedding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid lead information', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // In production, persists to database / sends webhook to The Royal Knot CRM
    console.log('[Gathbandhan] New Lead Captured:', { id: leadId, ...parsed.data });

    return NextResponse.json({
      success: true,
      leadId,
      message: 'Consultation lead successfully captured. The Royal Knot concierge will reach out soon.',
    });
  } catch (error: unknown) {
    console.error('Lead capture error:', error);
    return NextResponse.json(
      { error: 'Failed to capture consultation lead' },
      { status: 500 }
    );
  }
}
