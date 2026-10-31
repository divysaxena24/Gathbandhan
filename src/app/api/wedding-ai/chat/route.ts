// ============================================================
// Gathbandhan — AI Consultation API Route Handler
// POST /api/wedding-ai/chat
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { groqChatCompletion } from '@/lib/wedding-ai/groq';
import { GATHBANDHAN_SYSTEM_PROMPT, buildUserPrompt } from '@/lib/wedding-ai/system-prompt';
import { aiChatRequestSchema } from '@/validations/wedding';
import { getCeremoniesForWeddingType, getCeremonyByKey } from '@/data/wedding-knowledge';
import { WeddingSelections, WizardStepId } from '@/types/wedding';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = aiChatRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request payload', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { currentStep, selections, userMessage, requestType } = parsed.data;
    const weddingSelections = selections as unknown as WeddingSelections;

    // Check if key ceremony inquiry is asked
    let ceremonyDetails = undefined;
    if (requestType === 'ceremony_explanation' && weddingSelections.weddingType) {
      ceremonyDetails = getCeremoniesForWeddingType(weddingSelections.weddingType);
    }

    // Attempt Groq inference
    let aiResponseText: string | null = null;
    try {
      const prompt = buildUserPrompt(
        currentStep as WizardStepId,
        weddingSelections,
        userMessage,
        requestType
      );

      aiResponseText = await groqChatCompletion([
        { role: 'system', content: GATHBANDHAN_SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ]);
    } catch (aiErr: unknown) {
      console.warn('[AI Route] Groq call skipped or failed, using knowledge fallback:', aiErr);
    }

    // If Groq is not configured or fails, provide rich fallback from knowledge base
    if (!aiResponseText) {
      const type = weddingSelections.weddingType || 'hindu';
      const ceremonies = getCeremoniesForWeddingType(type);
      const topCeremonies = ceremonies.slice(0, 3).map((c) => `**${c.name}**: ${c.description}`).join('\n\n');

      aiResponseText = `Welcome to Gathbandhan wedding planning! For a traditional ${type.toUpperCase()} wedding, celebrations are centered around joy, deep spiritual blessings, and bonding of both families.\n\nKey traditional ceremonies include:\n\n${topCeremonies}\n\nOur planning team recommends sequencing these rituals over 2 to 3 days to allow guests to fully enjoy each moment.`;
    }

    return NextResponse.json({
      message: aiResponseText,
      ceremonyDetails,
      suggestions: [
        'How many days should we budget for these ceremonies?',
        'What decor themes best match our rituals?',
        'Can we combine the Mehendi and Sangeet celebrations?',
      ],
    });
  } catch (error: unknown) {
    console.error('AI chat endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI consultation request' },
      { status: 500 }
    );
  }
}
