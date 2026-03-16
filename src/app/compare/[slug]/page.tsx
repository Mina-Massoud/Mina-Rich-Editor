import { Metadata } from "next";
import { notFound } from "next/navigation";
import { competitors, competitorSlugs } from "@/data/competitors";
import ComparisonLayout from "@/components/compare/ComparisonLayout";
import { SITE_URL, SITE_NAME } from "@/lib/constants/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return competitorSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = competitors[slug];
  if (!data) return {};

  return {
    title: data.seo.title,
    description: data.seo.description,
    keywords: data.seo.keywords,
    alternates: {
      canonical: `${SITE_URL}/compare/${slug}`,
    },
    openGraph: {
      title: data.seo.title,
      description: data.seo.description,
      url: `${SITE_URL}/compare/${slug}`,
      siteName: SITE_NAME,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: data.seo.title,
      description: data.seo.description,
    },
  };
}

export default async function ComparePage({ params }: PageProps) {
  const { slug } = await params;
  const data = competitors[slug];
  if (!data) notFound();

  return <ComparisonLayout data={data} />;
}
