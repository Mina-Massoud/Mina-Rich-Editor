import type { Metadata } from "next";
import { SITE_URL } from "@/lib/constants/site";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Complete documentation for Mina Rich Editor. Learn how to install, configure, and use the block-based rich text editor with React, TypeScript, and Tailwind CSS. Includes API reference, examples, and customization guides.",
  keywords: [
    "rich text editor documentation",
    "react editor docs",
    "editor api reference",
    "rich text editor tutorial",
    "react wysiwyg documentation",
    "shadcn editor guide",
    "editor installation",
    "editor customization",
    "typescript editor docs",
    "next.js editor documentation",
  ],
  openGraph: {
    title: "Documentation - Mina Rich Editor",
    description:
      "Complete documentation for Mina Rich Editor. Installation, usage, API reference, and customization guides.",
    type: "article",
    url: `${SITE_URL}/docs`,
  },
  twitter: {
    card: "summary_large_image",
    title: "Documentation - Mina Rich Editor",
    description:
      "Complete documentation for Mina Rich Editor. Installation, usage, API reference, and customization guides.",
  },
  alternates: {
    canonical: `${SITE_URL}/docs`,
  },
};

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
