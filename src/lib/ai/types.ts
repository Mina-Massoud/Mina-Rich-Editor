/**
 * Mina Rich Editor - AI Provider Types
 *
 * Defines the provider-agnostic interface for AI text generation.
 * Consumers implement {@link AIProvider} to plug in any LLM backend
 * (OpenAI, Anthropic, Ollama, custom proxy, etc.).
 *
 * @packageDocumentation
 */

/**
 * Options that can be passed per-request to control generation behaviour.
 */
export interface AIStreamOptions {
  /** Model identifier (e.g. `'gpt-4'`, `'claude-sonnet-4-20250514'`). */
  model?: string;
  /** Sampling temperature (0-2). Higher = more creative. */
  temperature?: number;
  /** Maximum tokens to generate. */
  maxTokens?: number;
  /** System-level prompt prepended to every request. */
  systemPrompt?: string;
}

/**
 * A provider that can stream text from an LLM.
 *
 * Implementations must return an `AsyncIterable<string>` that yields
 * text chunks as they arrive from the model.
 *
 * @example Custom provider
 * ```typescript
 * const myProvider: AIProvider = {
 *   async *stream(prompt) {
 *     const res = await fetch('/api/llm', {
 *       method: 'POST',
 *       body: JSON.stringify({ prompt }),
 *     });
 *     const reader = res.body!.getReader();
 *     const decoder = new TextDecoder();
 *     while (true) {
 *       const { done, value } = await reader.read();
 *       if (done) break;
 *       yield decoder.decode(value);
 *     }
 *   },
 * };
 * ```
 */
export interface AIProvider {
  /**
   * Stream text from the model for the given prompt.
   *
   * @param prompt - The user prompt to send to the model.
   * @param options - Optional per-request overrides.
   * @returns An async iterable of string chunks.
   */
  stream(prompt: string, options?: AIStreamOptions): AsyncIterable<string>;
}

/**
 * Configuration object passed to editor components to enable AI features.
 *
 * @example
 * ```tsx
 * <CompactEditor ai={{ provider: myProvider }} />
 * ```
 */
export interface AIConfig {
  /** The AI provider to use for generation. */
  provider: AIProvider;
  /** Default system prompt used when none is provided per-request. */
  defaultSystemPrompt?: string;
}
