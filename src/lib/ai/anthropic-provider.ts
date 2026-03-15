/**
 * Mina Rich Editor - Anthropic Provider
 *
 * Adapter for Anthropic's Messages API with streaming.
 * Parses `content_block_delta` SSE events to yield text chunks.
 *
 * Uses native `fetch()` and `ReadableStream` — no external dependencies.
 *
 * @packageDocumentation
 */

import type { AIProvider, AIStreamOptions } from './types';

/**
 * Configuration for the Anthropic provider.
 */
export interface AnthropicProviderOptions {
  /** Your Anthropic API key. Sent as `x-api-key` header. */
  apiKey: string;
  /** Model to use. @default `'claude-sonnet-4-20250514'` */
  model?: string;
  /** Base URL of the API. @default `'https://api.anthropic.com/v1'` */
  baseUrl?: string;
  /** Default sampling temperature. @default `0.7` */
  temperature?: number;
}

/**
 * Creates an {@link AIProvider} that talks to the Anthropic Messages API
 * using SSE streaming.
 *
 * @param options - Provider configuration.
 * @returns An `AIProvider` ready to be passed to the editor.
 *
 * @example
 * ```typescript
 * import { createAnthropicProvider } from 'mina-rich-editor';
 *
 * const provider = createAnthropicProvider({
 *   apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY!,
 *   model: 'claude-sonnet-4-20250514',
 * });
 * ```
 */
export function createAnthropicProvider(
  options: AnthropicProviderOptions,
): AIProvider {
  const {
    apiKey,
    model: defaultModel = 'claude-sonnet-4-20250514',
    baseUrl = 'https://api.anthropic.com/v1',
    temperature: defaultTemperature = 0.7,
  } = options;

  return {
    async *stream(
      prompt: string,
      streamOptions?: AIStreamOptions,
    ): AsyncIterable<string> {
      const model = streamOptions?.model ?? defaultModel;
      const temperature = streamOptions?.temperature ?? defaultTemperature;
      const maxTokens = streamOptions?.maxTokens ?? 4096;
      const systemPrompt = streamOptions?.systemPrompt;

      const body: Record<string, unknown> = {
        model,
        max_tokens: maxTokens,
        temperature,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      };
      if (systemPrompt) {
        body.system = systemPrompt;
      }

      const response = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        throw new Error(
          `Anthropic API error (${response.status}): ${errorText}`,
        );
      }

      if (!response.body) {
        throw new Error('Anthropic API returned no response body');
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
          buffer = lines.pop() ?? '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith('data: ')) continue;

            const data = trimmed.slice(6);

            try {
              const parsed = JSON.parse(data);

              // Anthropic streams `content_block_delta` events with text deltas
              if (
                parsed.type === 'content_block_delta' &&
                parsed.delta?.type === 'text_delta'
              ) {
                const text = parsed.delta.text;
                if (text) {
                  yield text;
                }
              }

              // Stop on message_stop
              if (parsed.type === 'message_stop') {
                return;
              }
            } catch {
              // Ignore malformed JSON lines
            }
          }
        }

        // Process remaining buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (
                parsed.type === 'content_block_delta' &&
                parsed.delta?.type === 'text_delta' &&
                parsed.delta.text
              ) {
                yield parsed.delta.text;
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
