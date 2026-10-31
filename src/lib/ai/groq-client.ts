import Groq from "groq-sdk";

export interface GroqCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  mockResponse?: string;
}

let mockGroqResponse: string | null = null;

export function setMockGroqResponse(mockJson: string | null) {
  mockGroqResponse = mockJson;
}

/**
 * Creates an authorized Groq SDK client.
 * Strictly uses server-side environment variables.
 */
export function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey === "gsk_your_groq_api_key_here") {
    throw new Error(
      "GROQ_API_KEY is not configured on the server. Please add your valid GROQ_API_KEY in .env."
    );
  }

  return new Groq({ apiKey });
}

/**
 * Executes a structured Groq completion expecting JSON output.
 */
export async function executeGroqJsonChat(
  systemPrompt: string,
  userPrompt: string,
  options: GroqCompletionOptions = {}
): Promise<{ rawJson: string; model: string }> {
  // If mock mode is active for unit testing
  if (mockGroqResponse !== null || options.mockResponse) {
    return {
      rawJson: options.mockResponse || mockGroqResponse!,
      model: options.model || "mock-groq-model",
    };
  }

  const client = getGroqClient();
  const primaryModel = options.model || process.env.GROQ_MODEL || "openai/gpt-oss-120b";
  const candidateModels = [primaryModel, "openai/gpt-oss-120b", "openai/gpt-oss-20b"].filter(
    (m, idx, arr) => arr.indexOf(m) === idx
  );

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const response = await client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: options.temperature ?? 0.1, // Low temperature for deterministic financial extraction
        max_completion_tokens: options.maxTokens ?? 4096,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("Received empty response from Groq API.");
      }

      return {
        rawJson: content,
        model,
      };
    } catch (error: any) {
      lastError = error;
      // If model not found or unavailable, try next fallback
      if (
        error.status === 404 ||
        error.error?.code === "model_not_found" ||
        error.message?.includes("does not exist") ||
        error.message?.includes("model_not_found")
      ) {
        continue;
      }
      break;
    }
  }

  if (lastError?.status === 429) {
    throw new Error("Groq API rate limit reached. Please wait a moment and retry.");
  }
  if (lastError?.code === "ETIMEDOUT" || lastError?.message?.includes("timeout")) {
    throw new Error("Groq API request timed out. The document may be too large.");
  }
  throw new Error(`Groq AI request failed: ${lastError?.message || "Unknown error"}`);
}
