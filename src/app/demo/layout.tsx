import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demos — Mina Rich Editor",
  description: "Interactive demos of Mina Rich Editor features",
};

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
