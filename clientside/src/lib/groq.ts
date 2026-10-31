// ============================================================
// Gathbandhan — Groq AI Client (Server-Only)
// This file MUST only be imported in server-side code (API routes).
// ============================================================

import Groq from 'groq-sdk';

// Ensure this module is never bundled into client code
if (typeof window !== 'undefined') {
  throw new Error(
    'groq.ts must only be imported on the server side. ' +
    'Never import this file in client components.'
  );
}

const apiKey = process.env.GROQ_API_KEY;

if (!apiKey) {
  console.warn(
    '[Gathbandhan] GROQ_API_KEY is not set. AI features will not work. ' +
    'Add your Groq API key to .env.local'
  );
}

/**
 * Singleton Groq client instance.
 * Only created once per server lifecycle.
 */
let groqClient: Groq | null = null;

export function getGroqClient(): Groq {
  if (!apiKey) {
    throw new Error(
      'GROQ_API_KEY is not configured. Please add it to your .env.local file.'
    );
  }

  if (!groqClient) {
    groqClient = new Groq({ apiKey });
  }

  return groqClient;
}

/**
 * Get the configured model name.
 * Falls back to llama-3.3-70b-versatile if not set.
 */
export function getGroqModel(): string {
  return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
}

/**
 * Send a chat completion request to Groq.
 * Handles errors gracefully and returns null on failure.
 */
export async function groqChatCompletion(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
    topP?: number;
  }
): Promise<string | null> {
  try {
    const client = getGroqClient();
    const model = getGroqModel();

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: options?.temperature ?? 0.7,
      max_tokens: options?.maxTokens ?? 1024,
      top_p: options?.topP ?? 0.9,
    });

    return completion.choices[0]?.message?.content ?? null;
  } catch (error: unknown) {
    if (error instanceof Error) {
      // Rate limit handling
      if (error.message.includes('rate_limit')) {
        console.error('[Gathbandhan] Groq rate limit reached. Please wait and retry.');
        throw new Error('AI service is temporarily busy. Please try again in a moment.');
      }
      // API key errors
      if (error.message.includes('401') || error.message.includes('authentication')) {
        console.error('[Gathbandhan] Invalid Groq API key.');
        throw new Error('AI service configuration error. Please contact support.');
      }
      console.error('[Gathbandhan] Groq API error:', error.message);
    }
    return null;
  }
}

/**
 * Send a chat completion request expecting JSON response.
 * Parses the response as JSON and returns it.
 */
export async function groqJsonCompletion<T>(
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>,
  options?: {
    temperature?: number;
    maxTokens?: number;
  }
): Promise<T | null> {
  try {
    const client = getGroqClient();
    const model = getGroqModel();

    const completion = await client.chat.completions.create({
      model,
      messages,
      temperature: options?.temperature ?? 0.3,
      max_tokens: options?.maxTokens ?? 2048,
      response_format: { type: 'json_object' },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as T;
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('[Gathbandhan] Groq JSON completion error:', error.message);
    }
    return null;
  }
}
