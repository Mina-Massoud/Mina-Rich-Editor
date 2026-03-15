"use client";

import type { AIProvider } from "./types";

/**
 * Demo AI provider that simulates streaming responses.
 * Used as fallback when no real API key is configured.
 */
export const demoAIProvider: AIProvider = {
  async *stream(prompt: string) {
    const response = `Here's a response to: "${prompt}"

This is a demo of the AI integration in Mina Rich Editor. In production, connect your own OpenAI, Anthropic, or Gemini API key.

## Key Features

- **Streaming support** — content appears token by token
- **Markdown parsing** — headings, lists, and code blocks are auto-detected
- **Provider agnostic** — implement the \`AIProvider\` interface for any LLM

> Tip: Try asking for lists, headings, or code examples!`;

    for (const char of response) {
      await new Promise((r) => setTimeout(r, 20));
      yield char;
    }
  },
};
