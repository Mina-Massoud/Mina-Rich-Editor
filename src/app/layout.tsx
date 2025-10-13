import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://mina-rich-editor.vercel.app"), // Update with your actual domain
  title: {
    default: "Mina Rich Editor - Block-based Rich Text Editor for React",
    template: "%s | Mina Rich Editor",
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
    url: "https://mina-rich-editor.vercel.app",
    title: "Mina Rich Editor - Block-based Rich Text Editor for React",
    description:
      "A powerful, block-based rich text editor with tables, images, formatting, and mobile-optimized UX. Built with React, TypeScript, shadcn/ui, and Tailwind CSS.",
    siteName: "Mina Rich Editor",
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
    canonical: "https://mina-rich-editor.vercel.app",
  },
  verification: {
    google: "your-google-site-verification-code", // Add your Google verification code
    // yandex: "your-yandex-verification-code",
    // bing: "your-bing-verification-code",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "Mina Rich Editor",
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
              ],
              screenshot: "/opengraph.png",
              softwareVersion: "1.0.0",
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5",
                ratingCount: "1",
              },
            }),
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col w-full overflow-x-clip`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          {/* <ModeToggle /> */}
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
