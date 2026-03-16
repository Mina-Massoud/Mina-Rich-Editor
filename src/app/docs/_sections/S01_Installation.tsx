import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { NotesList } from "../_components/NotesList";

export const sectionMeta = { id: "installation", num: "01", label: "Installation" };

export default function S01_Installation() {
  return (
    <section className="mb-20">
      <SectionHeading num="01" label="Installation" id="installation">
        Get started in under a minute
      </SectionHeading>

      <div className="space-y-10">

        <div>
          <p className="text-sm text-muted-foreground">
            Installation packages are being prepared for npm and the shadcn CLI. Check back soon.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            In the meantime, you can <a href="/demo" className="text-foreground underline underline-offset-4">try the live demo</a> to explore all features.
          </p>
        </div>

        <NotesList items={[
          <>Requires <strong className="text-foreground">React 18+</strong>, <strong className="text-foreground">Next.js 13+</strong>, and <strong className="text-foreground">Tailwind CSS</strong>.</>,
          <>Peer dependencies: <strong className="text-foreground">zustand</strong>, <strong className="text-foreground">framer-motion</strong>, <strong className="text-foreground">lucide-react</strong>.</>,
        ]} />
      </div>
    </section>
  );
}
