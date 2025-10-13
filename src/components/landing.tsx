"use client";

import Hero from "@/components/ui/neural-network-hero";

interface HeroSectionProps {
  onTryEditor: () => void;
}

export default function HeroSection({ onTryEditor }: HeroSectionProps) {
  return (
    <div className="min-w-[100vw] h-screen flex flex-col relative">
      <Hero 
        title="Rich text, beautifully crafted with shadcn/ui and Tailwind."
        description="A powerful rich text editor built for modern web applications — elegant, performant, and infinitely customizable. Built with React, TypeScript, and thoughtful design."
        badgeText="Rich Text Editor"
        badgeLabel="New"
        ctaButtons={[
          { text: "Try the editor", href: "#editor", primary: true, onClick: onTryEditor },
          { text: "Docs", href: "/docs" }
        ]}
        microDetails={["Block‑based editing", "Custom formatting", "Type‑safe API"]}
      />
    </div>
  );
}
