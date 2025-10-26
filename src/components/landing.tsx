"use client";

import Hero from "@/components/ui/neural-network-hero";

interface HeroSectionProps {
  onTryEditor: () => void;
}

export default function HeroSection({ onTryEditor }: HeroSectionProps) {
  return (
    <div className="min-w-[100vw] h-screen flex flex-col relative">
      <Hero 
        title="Mina Rich Editor · The Modern Web Editor"
        description="A powerful, elegant rich text editor built with Shadcn UI. Experience unparalleled customization, beautiful design, and seamless integration. Built with React, TypeScript, and meticulous attention to detail."
        badgeText="Mina Massoud"
        badgeLabel="New Version"
        ctaButtons={[
          { text: "Try the editor", href: "#editor", primary: true, onClick: onTryEditor },
          { text: "Documentation", href: "/docs" }
        ]}
        microDetails={["Block‑based editing", "Infinite customization", "Type‑safe API", "Shadcn UI powered"]}
      />
    </div>
  );
}
