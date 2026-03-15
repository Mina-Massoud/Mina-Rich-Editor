import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { CodeBlock } from "../_components/CodeBlock";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "installation", num: "01", label: "Installation" };

export default function S01_Installation() {
  return (
    <section className="mb-20">
      <SectionHeading num="01" label="Installation" id="installation">
        Get started in under a minute
      </SectionHeading>

      <div className="space-y-8">
        <div>
          <h3 className="mb-3 text-lg font-light text-warm-100">
            Step 1: Install the component
          </h3>
          <CodeBlock label="Terminal">{`npx shadcn@latest add https://ui-v4-livid.vercel.app/r/styles/new-york-v4/rich-editor.json`}</CodeBlock>
          <p className="mt-3 text-sm text-warm-400">
            This automatically installs all required shadcn components, npm packages, and editor files into your project.
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-light text-warm-100">
            Step 2: Configure the theme provider
          </h3>
          <p className="mb-3 text-sm text-warm-400">
            The editor includes dark mode support. Wrap your app with the{" "}
            <code className="bg-surface-code text-warm-100 px-1.5 py-0.5 text-xs font-mono">ThemeProvider</code>{" "}
            from{" "}
            <code className="bg-surface-code text-warm-100 px-1.5 py-0.5 text-xs font-mono">next-themes</code>.
          </p>
          <CodeBlock label="layout.tsx">{`import { ThemeProvider } from "next-themes"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system">
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}`}</CodeBlock>
        </div>

        <NotesList items={[
          <>Uses <strong className="text-warm-100">shadcn CLI</strong> for zero-config installation -- all dependencies are handled automatically.</>,
          <>Requires <strong className="text-warm-100">React 18+</strong>, <strong className="text-warm-100">Next.js 13+</strong>, and <strong className="text-warm-100">Tailwind CSS</strong>.</>,
          <>Peer dependencies: <strong className="text-warm-100">zustand</strong>, <strong className="text-warm-100">framer-motion</strong>, <strong className="text-warm-100">lucide-react</strong> are installed automatically.</>,
        ]} />
      </div>
    </section>
  );
}
