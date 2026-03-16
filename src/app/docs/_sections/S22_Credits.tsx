import React from "react";
import { SectionHeading } from "../_components/SectionHeading";
import { Github, ExternalLink } from "lucide-react";

export const sectionMeta = { id: "credits", num: "22", label: "Credits" };

export default function S22_Credits() {
  return (
    <section className="mb-12">
      <SectionHeading num="22" label="Credits" id="credits">
        Built by Mina
      </SectionHeading>

      <div className="border border-border bg-muted p-8">
        <div className="space-y-4">
          <h3 className="text-2xl font-extralight tracking-tight text-foreground">
            Mina Massoud
          </h3>
          <p className="text-sm font-light leading-relaxed text-muted-foreground max-w-xl">
            A young developer proving that with AI, one person can build what used to take entire teams. The kind of developer who doesn{"'"}t just write code, but builds cities.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a
              href="https://mina-massoud.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-light text-foreground/80 hover:text-foreground border border-border px-4 py-2 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Portfolio
            </a>
            <a
              href="https://github.com/Mina-Massoud/Mina-Rich-Editor"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-light text-foreground/80 hover:text-foreground border border-border px-4 py-2 transition-colors"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
