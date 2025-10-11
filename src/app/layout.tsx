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
  title: "Mina Rich Editor",
  description: "A powerful, TypeScript-first rich text editor with nested blocks, inline formatting, and read-only mode. Built with React, TypeScript, and Tailwind CSS.",
  keywords: ["rich text editor", "react", "typescript", "nested blocks", "text editor", "wysiwyg"],
  authors: [{ name: "Mina" }],
  creator: "Mina",
  publisher: "Mina",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    title: "Mina Rich Editor",
    description: "A powerful, TypeScript-first rich text editor with nested blocks, inline formatting, and read-only mode. Built with React, TypeScript, and Tailwind CSS.",
    siteName: "Mina Rich Editor",
    images: [
      {
        url: "/opengraph.png",
        width: 1200,
        height: 630,
        alt: "Mina Rich Editor - A powerful rich text editor",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mina Rich Editor",
    description: "A powerful, TypeScript-first rich text editor with nested blocks, inline formatting, and read-only mode.",
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
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
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
