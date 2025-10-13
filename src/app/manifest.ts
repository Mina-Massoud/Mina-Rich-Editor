import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mina Rich Editor - Block-based Rich Text Editor",
    short_name: "Rich Editor",
    description:
      "A powerful, block-based rich text editor with tables, images, formatting, and mobile-optimized UX. Built with React, TypeScript, shadcn/ui, and Tailwind CSS.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/favicon.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}

