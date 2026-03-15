/**
 * Mina Rich Editor - Google Gemini Provider
 *
 * Adapter for Google's Gemini API using SSE streaming.
 * Uses native `fetch()` and `ReadableStream` — no external dependencies.
 *
 * @packageDocumentation
 */

import type { AIProvider, AIStreamOptions } from './types';

/**
 * Configuration for the Gemini provider.
 */
export interface GeminiProviderOptions {
  /** Your Gemini API key. */
  apiKey: string;
  /** Model to use. @default `'gemini-2.5-flash'` */
  model?: string;
  /** Default sampling temperature. @default `0.7` */
  temperature?: number;
}

/**
 * Creates an {@link AIProvider} that talks to Google's Gemini API
 * using SSE streaming.
 *
 * @param options - Provider configuration.
 * @returns An `AIProvider` ready to be passed to the editor.
 *
 * @example
 * ```typescript
 * import { createGeminiProvider } from 'mina-rich-editor';
 *
 * const provider = createGeminiProvider({
 *   apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY!,
 *   model: 'gemini-2.5-flash',
 * });
 * ```
 */
export function createGeminiProvider(options: GeminiProviderOptions): AIProvider {
  const {
    apiKey,
    model: defaultModel = 'gemini-2.5-flash',
    temperature: defaultTemperature = 0.7,
  } = options;

  return {
    async *stream(
      prompt: string,
      streamOptions?: AIStreamOptions,
    ): AsyncIterable<string> {
      const model = streamOptions?.model ?? defaultModel;
      const temperature = streamOptions?.temperature ?? defaultTemperature;
      const maxTokens = streamOptions?.maxTokens;
      const systemPrompt = streamOptions?.systemPrompt;

      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

      if (systemPrompt) {
        contents.push({
          role: 'user',
          parts: [{ text: systemPrompt }],
        });
        contents.push({
          role: 'model',
          parts: [{ text: 'Understood. I will follow these instructions.' }],
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: prompt }],
      });

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature,
          ...(maxTokens !== undefined ? { maxOutputTokens: maxTokens } : {}),
        },
      };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Gemini API error (${response.status}): ${errorText}`,
        );
      }

      if (!response.body) {
        throw new Error('Gemini API returned no response body');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          // Keep the last (potentially incomplete) line in the buffer
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6); // Remove "data: " prefix
            if (data === '[DONE]') return;

            try {
              const parsed = JSON.parse(data);
              const text =
                parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                yield text;
              }
            } catch {
              // Ignore malformed JSON lines (partial SSE data)
            }
          }
        }

        // Process any remaining data in the buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith('data: ') && trimmed.slice(6) !== '[DONE]') {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              const text =
                parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                yield text;
              }
            } catch {
              // Ignore
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    },
  };
}
