// ============================================================
// Gathbandhan — Budget Calculation API Route Handler
// POST /api/budget
// Deterministic budget calculation using paise arithmetic
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { calculateWeddingBudget } from '@/lib/services/budget-calculator';
import { WeddingSelections } from '@/types/wedding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const selections = (body.selections || body) as WeddingSelections;

    const budget = calculateWeddingBudget(selections);

    return NextResponse.json({
      success: true,
      budget,
    });
  } catch (error: unknown) {
    console.error('Budget calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate budget' },
      { status: 500 }
    );
  }
}
