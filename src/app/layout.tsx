import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter, Caveat } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { SITE_URL, SITE_NAME, GITHUB_URL, NPM_URL } from "@/lib/constants/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Mina Rich Editor - Block-based Rich Text Editor for React",
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "A powerful, block-based rich text editor with tables, images, formatting, and mobile-optimized UX. Built with React, TypeScript, shadcn/ui, and Tailwind CSS. Free and open-source.",
  keywords: [
    "rich text editor",
    "react rich text editor",
    "block editor",
    "wysiwyg editor",
    "text editor react",
    "shadcn editor",
    "tailwind editor",
    "typescript editor",
    "react wysiwyg",
    "contenteditable",
    "markdown editor",
    "drag and drop editor",
    "table editor",
    "image editor",
    "formatting editor",
    "inline formatting",
    "nested blocks",
    "react components",
    "next.js editor",
    "open source editor",
  ],
  authors: [{ name: "Mina Massoud", url: "https://mina-massoud.com" }],
  creator: "Mina Massoud",
  publisher: "Mina Massoud",
  category: "Web Development",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    title: "Mina Rich Editor - Block-based Rich Text Editor for React",
    description:
      "A powerful, block-based rich text editor with tables, images, formatting, and mobile-optimized UX. Built with React, TypeScript, shadcn/ui, and Tailwind CSS.",
    siteName: SITE_NAME,
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "Mina Rich Editor - A powerful block-based rich text editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mina Rich Editor - Block-based Rich Text Editor for React",
    description:
      "A powerful, block-based rich text editor with tables, images, formatting, and mobile-optimized UX. Built with React, TypeScript, shadcn/ui, and Tailwind CSS.",
    images: ["/opengraph.png"],
    creator: "@mina",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: SITE_NAME,
              url: SITE_URL,
              description:
                "A powerful, block-based rich text editor with tables, images, formatting, and mobile-optimized UX.",
              applicationCategory: "DeveloperApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "Mina Massoud",
                url: "https://mina-massoud.com",
              },
              featureList: [
                "Block-based architecture",
                "Rich text formatting",
                "Advanced tables",
                "Image management",
                "Custom Tailwind classes",
                "Keyboard shortcuts",
                "Mobile optimized",
                "Dark mode",
                "Undo/Redo",
                "HTML export",
                "AI content generation",
                "Real-time collaboration",
                "Drag and drop",
                "Markdown shortcuts",
              ],
              screenshot: `${SITE_URL}/opengraph.png`,
              downloadUrl: NPM_URL,
              codeRepository: GITHUB_URL,
              license: "https://opensource.org/licenses/MIT",
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${caveat.variable} antialiased min-h-screen flex flex-col w-full overflow-x-clip`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
