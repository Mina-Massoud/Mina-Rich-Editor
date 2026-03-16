"use client";

import type { AIProvider } from "./types";

/**
 * Demo AI provider that simulates streaming responses.
 * Used as fallback when no real API key is configured.
 */
export const demoAIProvider: AIProvider = {
  async *stream(prompt: string) {
    // Detect styled/formatting prompts
    const lowerPrompt = prompt.toLowerCase();
    const isStylePrompt =
      lowerPrompt.includes('bold') ||
      lowerPrompt.includes('emphasize') ||
      lowerPrompt.includes('key words') ||
      lowerPrompt.includes('key concepts') ||
      lowerPrompt.includes('backtick') ||
      lowerPrompt.includes('code');

    // If prompt contains "Text:\n" it's a selection replacement request
    const textMatch = prompt.match(/Text:\n([\s\S]+)$/);
    if (textMatch) {
      const selectedText = textMatch[1].trim();

      if (isStylePrompt) {
        // Return a styled version of the text with markdown formatting
        const styledResponse = addDemoFormatting(selectedText, lowerPrompt);
        for (const char of styledResponse) {
          await new Promise((r) => setTimeout(r, 15));
          yield char;
        }
        return;
      }

      // Plain text replacement — rephrase
      const rephrased = `Here is the rephrased version of the selected text, maintaining the original meaning while using different phrasing`;
      for (const char of rephrased) {
        await new Promise((r) => setTimeout(r, 15));
        yield char;
      }
      return;
    }

    // Default: block generation response (no preamble — clean markdown only)
    const response = `## AI Integration Demo

This is a demo of the AI streaming in Mina Rich Editor. In production, connect your own OpenAI, Anthropic, or Gemini API key.

### Key Features

- **Streaming support** — content appears token by token
- **Markdown parsing** — headings, lists, and code blocks are auto-detected
- **Provider agnostic** — implement the \`AIProvider\` interface for any LLM

\`\`\`typescript
import { createOpenAIProvider } from 'mina-rich-editor';

const provider = createOpenAIProvider({
  apiKey: process.env.OPENAI_API_KEY!,
  model: 'gpt-4',
});
\`\`\`

> Tip: Try asking for lists, headings, or code examples!`;

    for (const char of response) {
      await new Promise((r) => setTimeout(r, 20));
      yield char;
    }
  },
};

/** Add demo markdown formatting to text based on the prompt type. */
function addDemoFormatting(text: string, lowerPrompt: string): string {
  const words = text.split(' ');

  if (lowerPrompt.includes('backtick') || lowerPrompt.includes('code')) {
    // Wrap technical-looking words in backticks
    return words
      .map((w) =>
        /^[a-z][a-zA-Z]*[A-Z]/.test(w) || // camelCase
        w.includes('(') ||
        w.includes('.') ||
        w.includes('_')
          ? `\`${w}\``
          : w,
      )
      .join(' ');
  }

  if (lowerPrompt.includes('italic') || lowerPrompt.includes('emphasis')) {
    // Bold important words, italicize others
    return words
      .map((w, i) => {
        if (w.length > 6 && i % 3 === 0) return `**${w}**`;
        if (w.length > 4 && i % 4 === 1) return `*${w}*`;
        return w;
      })
      .join(' ');
  }

  // Default: bold key words
  return words
    .map((w, i) => (w.length > 5 && i % 3 === 0 ? `**${w}**` : w))
    .join(' ');
}
