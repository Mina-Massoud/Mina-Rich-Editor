/**
 * Mina Rich Editor - OpenAI-Compatible Provider
 *
 * Default adapter for any OpenAI-compatible chat completions endpoint.
 * Works with OpenAI, Azure OpenAI, Ollama, LM Studio, Together AI,
 * and any other service that implements the OpenAI SSE streaming format.
 *
 * Uses native `fetch()` and `ReadableStream` — no external dependencies.
 *
 * @packageDocumentation
 */

import type { AIProvider, AIStreamOptions } from './types';

/**
 * Configuration for the OpenAI-compatible provider.
 */
export interface OpenAIProviderOptions {
  /** Your API key. Sent as `Authorization: Bearer <key>`. */
  apiKey: string;
  /** Model to use. @default `'gpt-4'` */
  model?: string;
  /** Base URL of the API. @default `'https://api.openai.com/v1'` */
  baseUrl?: string;
  /** Default sampling temperature. @default `0.7` */
  temperature?: number;
}

/**
 * Creates an {@link AIProvider} that talks to any OpenAI-compatible
 * chat completions endpoint using SSE streaming.
 *
 * @param options - Provider configuration.
 * @returns An `AIProvider` ready to be passed to the editor.
 *
 * @example
 * ```typescript
 * import { createOpenAIProvider } from 'mina-rich-editor';
 *
 * const provider = createOpenAIProvider({
 *   apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY!,
 *   model: 'gpt-4',
 * });
 * ```
 */
export function createOpenAIProvider(options: OpenAIProviderOptions): AIProvider {
  const {
    apiKey,
    model: defaultModel = 'gpt-4',
    baseUrl = 'https://api.openai.com/v1',
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

      const messages: Array<{ role: string; content: string }> = [];
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      messages.push({ role: 'user', content: prompt });

      const body: Record<string, unknown> = {
        model,
        messages,
        temperature,
        stream: true,
      };
      if (maxTokens !== undefined) {
        body.max_tokens = maxTokens;
      }

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `OpenAI API error (${response.status}): ${errorText}`,
        );
      }

      if (!response.body) {
        throw new Error('OpenAI API returned no response body');
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
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
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
              const content = parsed.choices?.[0]?.delta?.content;
              if (content) {
                yield content;
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
