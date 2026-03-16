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

      <div className="space-y-10">

        {/* Method 1: npm */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground border border-border px-2 py-0.5">Method 1</span>
            <span className="text-sm font-light text-foreground">npm — standalone projects</span>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Use this if you are setting up the editor as an npm package dependency in any React or Next.js project.
          </p>
          <CodeBlock label="Terminal">{`npm install @mina-editor/core`}</CodeBlock>
          <p className="mt-3 text-sm text-muted-foreground">
            Then import styles and components directly from the package.
          </p>
        </div>

        {/* Method 2: shadcn registry */}
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground border border-border px-2 py-0.5">Method 2</span>
            <span className="text-sm font-light text-foreground">shadcn registry — shadcn/ui projects</span>
          </div>
          <p className="mb-3 text-sm text-muted-foreground">
            Use this if your project already uses <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">shadcn/ui</code>. The CLI will automatically install all required shadcn components, npm packages, and editor files.
          </p>
          <CodeBlock label="Terminal">{`npx shadcn@latest add https://ui-v4-livid.vercel.app/r/styles/new-york-v4/rich-editor.json`}</CodeBlock>
          <p className="mt-3 text-sm text-muted-foreground">
            All dependencies are resolved automatically — no manual configuration needed.
          </p>
        </div>

        {/* Step 2: Theme Provider */}
        <div>
          <h3 className="mb-3 text-lg font-light text-foreground">
            Configure the theme provider
          </h3>
          <p className="mb-3 text-sm text-muted-foreground">
            The editor includes dark mode support. Wrap your app with the{" "}
            <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">ThemeProvider</code>{" "}
            from{" "}
            <code className="bg-muted text-foreground px-1.5 py-0.5 text-xs font-mono">next-themes</code>.
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
          <>Use <strong className="text-foreground">npm install</strong> for standalone projects; use the <strong className="text-foreground">shadcn CLI</strong> when your project already uses shadcn/ui.</>,
          <>Requires <strong className="text-foreground">React 18+</strong>, <strong className="text-foreground">Next.js 13+</strong>, and <strong className="text-foreground">Tailwind CSS</strong>.</>,
          <>Peer dependencies: <strong className="text-foreground">zustand</strong>, <strong className="text-foreground">framer-motion</strong>, <strong className="text-foreground">lucide-react</strong> are installed automatically.</>,
        ]} />
      </div>
    </section>
  );
}
