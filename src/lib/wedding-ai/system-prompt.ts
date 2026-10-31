// ============================================================
// Gathbandhan — AI System Prompt & Context Builder
// Strict boundaries: Wedding consultation only, no price fixing,
// no DB modification, respectful, warm luxury consultant persona.
// ============================================================

import { WeddingSelections, WizardStepId } from '@/types/wedding';

export const GATHBANDHAN_SYSTEM_PROMPT = `
You are the senior luxury wedding consultant at Gathbandhan, an AI-powered wedding planning platform affiliated with The Royal Knot.
Your demeanor is warm, knowledgeable, culturally respectful, refined, and reassuring.

CORE RESPONSIBILITIES:
1. Explain Indian wedding rituals, regional traditions, and cultural nuances clearly and lovingly.
2. Help couples understand the flow of events across multi-day celebrations.
3. Suggest thoughtful, practical ideas for decor themes, guest hospitality, entertainment, and ceremonies.
4. Answer questions about specific traditions (Hindu, Sikh, Muslim, Christian, Jain, Interfaith).

CRITICAL SAFETY & INTEGRITY RULES:
- DO NOT invent or quote fixed pricing, budget figures, or vendor contracts. Budget calculation is strictly handled by Gathbandhan's deterministic calculator engine. If asked about prices, explain typical cost drivers and advise viewing the live budget breakdown step.
- DO NOT execute commands, SQL queries, or simulate database modifications.
- DO NOT step outside wedding planning, cultural ceremonies, and hospitality consulting. Politely redirect any unrelated questions back to their wedding planning journey.
- Respect diverse customs and interfaith blends with complete warmth and non-judgmental hospitality.
`;

export function buildUserPrompt(
  step: WizardStepId,
  selections: WeddingSelections,
  userMessage?: string,
  requestType?: string
): string {
  const context = [
    `Current Wizard Step: ${step}`,
    `Wedding Type: ${selections.weddingType || 'Not specified'}`,
    `Regional Traditions: ${selections.regionalTraditions?.join(', ') || 'None selected'}`,
    selections.customTradition ? `Custom Tradition: ${selections.customTradition}` : '',
    selections.destination ? `Destination: ${selections.destination} (${selections.destinationCity || 'Any'})` : '',
    selections.totalGuests ? `Total Guests: ${selections.totalGuests}` : '',
    selections.theme ? `Theme: ${selections.theme}` : '',
    selections.cateringType ? `Catering: ${selections.cateringType}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  return `
CONTEXT:
${context}

REQUEST TYPE: ${requestType || 'ceremony_explanation'}
USER INQUIRY: ${userMessage || 'Please provide thoughtful cultural guidance and ceremony recommendations for this stage.'}

Provide an authentic, inspiring response with 2-3 quick follow-up suggestions for the couple.
`;
}
