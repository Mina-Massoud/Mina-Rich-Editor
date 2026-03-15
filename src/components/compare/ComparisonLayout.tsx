"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Github, Check, X, Minus } from "lucide-react";
import type { CompetitorData } from "@/data/competitors";
import { competitorSlugs, competitors } from "@/data/competitors";

/* ─── Shared primitives ──────────────────────────────────────────────────── */

function GridBg({ id }: { id: string }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`g-${id}`} width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(200,180,160,0.04)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#g-${id})`} />
    </svg>
  );
}

function Dots() {
  return (
    <div className="flex gap-1.5">
      <div className="w-1.5 h-1.5 bg-warm-500" />
      <div className="w-1.5 h-1.5 bg-warm-400" />
      <div className="w-1.5 h-1.5 bg-warm-300" />
    </div>
  );
}

function SectionHeader({ num, label }: { num: string; label: string }) {
  return (
    <div className="flex items-center gap-6 mb-16">
      <div className="h-px flex-1" style={{ background: "linear-gradient(to right, var(--border-strong), transparent)" }} />
      <span className="text-xs font-mono uppercase tracking-[0.3em] text-warm-200">
        {num} — {label}
      </span>
      <div className="h-px flex-1" style={{ background: "linear-gradient(to left, var(--border-strong), transparent)" }} />
    </div>
  );
}

/* ─── Main Layout ────────────────────────────────────────────────────────── */

export default function ComparisonLayout({ data }: { data: CompetitorData }) {
  const otherCompetitors = competitorSlugs.filter((s) => s !== data.slug);

  return (
    <div className="w-full overflow-x-hidden bg-surface-base text-warm-100">
      {/* ═══ NAV ═══ */}
      <nav className="px-8 md:px-16 py-6 flex items-center gap-4 border-b" style={{ borderColor: "rgba(200,180,160,0.06)" }}>
        <Link href="/" className="flex items-center gap-2 text-sm transition-opacity hover:opacity-70 text-warm-200">
          <ArrowLeft className="w-4 h-4" />
          Home
        </Link>
        <span className="text-warm-500">/</span>
        <span className="text-sm text-warm-400">Compare</span>
        <span className="text-warm-500">/</span>
        <span className="text-sm text-warm-200">{data.name}</span>
      </nav>

      {/* ═══ HERO ═══ */}
      <section className="relative px-8 md:px-16 py-24 md:py-32 text-center">
        <GridBg id="hero" />
        <div className="relative z-10 max-w-3xl mx-auto">
          <p className="text-xs font-mono uppercase tracking-[0.3em] mb-6 text-warm-400">
            Honest Comparison
          </p>
          <h1 className="text-4xl md:text-6xl font-extralight tracking-tight mb-4 text-warm-50">
            Mina vs {data.name}
          </h1>
          <p className="font-light text-lg text-warm-100">
            {data.tagline}
          </p>
          <div className="flex items-center justify-center gap-6 mt-8">
            <a href={data.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70 text-warm-200">
              <ExternalLink className="w-3.5 h-3.5" />
              Website
            </a>
            <a href={data.github} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm transition-opacity hover:opacity-70 text-warm-200">
              <Github className="w-3.5 h-3.5" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ═══ QUICK STATS ═══ */}
      <section className="px-8 md:px-16 py-20 bg-surface-raised">
        <div className="max-w-4xl mx-auto">
          <SectionHeader num="01" label="Quick Stats" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <StatsCard
              name="Mina"
              highlight
              stats={{
                stars: "New",
                bundleSize: "~45KB",
                license: "MIT",
                lastUpdate: "Active",
                framework: "React",
              }}
            />
            <StatsCard name={data.name} stats={data.stats} />
          </div>
        </div>
      </section>

      {/* ═══ FEATURE TABLE ═══ */}
      <section className="relative px-8 md:px-16 py-24">
        <GridBg id="features" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <SectionHeader num="02" label="Feature Comparison" />
          <div className="grid grid-cols-[1fr_1fr_1fr] pb-4 mb-2 border-b" style={{ borderColor: "var(--border-default)" }}>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-warm-400">Feature</div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-warm-200">Mina</div>
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-warm-400">{data.name}</div>
          </div>
          {data.features.map((f) => (
            <FeatureRow key={f.category} category={f.category} mina={f.mina} competitor={f.competitor} minaWins={f.minaWins} />
          ))}
        </div>
      </section>

      {/* ═══ STRENGTHS ═══ */}
      <section className="px-8 md:px-16 py-24 bg-surface-raised">
        <div className="max-w-5xl mx-auto">
          <SectionHeader num="03" label="Strengths" />
          <h2 className="text-3xl md:text-4xl font-extralight tracking-tight text-center mb-4 text-warm-50">
            Where each editor shines
          </h2>
          <p className="text-center font-light mb-16 max-w-lg mx-auto text-warm-200">
            An honest look at what each editor does best.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mina column */}
            <div className="border p-8 md:p-10" style={{ borderColor: "rgba(74, 222, 128, 0.2)", background: "rgba(74, 222, 128, 0.03)" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#4ade80" }} />
                <h3 className="text-xl font-medium tracking-tight text-warm-50">Mina wins</h3>
              </div>
              <div className="space-y-5">
                {data.minaWins.map((point) => (
                  <div key={point} className="flex items-start gap-4">
                    <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(74, 222, 128, 0.15)" }}>
                      <Check className="w-3 h-3" style={{ color: "#4ade80" }} />
                    </div>
                    <p className="text-sm leading-relaxed text-warm-50">{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitor column */}
            <div className="border p-8 md:p-10" style={{ borderColor: "rgba(96, 165, 250, 0.2)", background: "rgba(96, 165, 250, 0.03)" }}>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#60a5fa" }} />
                <h3 className="text-xl font-medium tracking-tight text-warm-50">{data.name} wins</h3>
              </div>
              <div className="space-y-5">
                {data.competitorWins.map((point) => (
                  <div key={point} className="flex items-start gap-4">
                    <div className="mt-1 w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(96, 165, 250, 0.15)" }}>
                      <Check className="w-3 h-3" style={{ color: "#60a5fa" }} />
                    </div>
                    <p className="text-sm leading-relaxed text-warm-50">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ CODE COMPARISON ═══ */}
      <section className="relative px-8 md:px-16 py-24">
        <GridBg id="code" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <SectionHeader num="04" label="Code Comparison" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <CodeBlock
              title={`Mina — ${data.codeComparison.minaLines} lines`}
              code={data.codeComparison.minaCode}
              highlight
            />
            <CodeBlock
              title={`${data.name} — ${data.codeComparison.competitorLines} lines`}
              code={data.codeComparison.competitorCode}
            />
          </div>
        </div>
      </section>

      {/* ═══ VERDICT ═══ */}
      <section className="relative px-8 md:px-16 py-24">
        <GridBg id="verdict" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <SectionHeader num="05" label="The Verdict" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <VerdictCard title="Choose Mina if..." items={data.verdict.chooseMina} accent="#4ade80" />
            <VerdictCard title={`Choose ${data.name} if...`} items={data.verdict.chooseCompetitor} accent="#60a5fa" />
          </div>
        </div>
      </section>

      {/* ═══ CTA ═══ */}
      <section className="relative px-8 md:px-16 py-32 text-center bg-surface-raised">
        <div className="relative z-10 max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extralight tracking-tight mb-6 text-warm-50">
            Ready to build?
          </h2>
          <p className="font-light mb-12 text-warm-100">
            Try Mina Rich Editor — 3 lines of code, zero ProseMirror.
          </p>
          <div className="inline-block border px-8 py-4 mb-12 font-mono text-sm select-all text-warm-200" style={{ borderColor: "rgba(200,180,160,0.145)" }}>
            npm install @mina-editor/core
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/" className="px-10 py-4 font-medium tracking-wide transition-opacity hover:opacity-80 active:scale-[0.98] bg-warm-200 text-warm-900">
              Try the Editor &rarr;
            </Link>
            <a href="https://github.com/mina-massoud/mina-rich-editor" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 px-10 py-4 border font-medium tracking-wide transition-colors hover:bg-white/5 border-warm-700 text-warm-200">
              <Github className="w-4 h-4" />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ═══ OTHER COMPARISONS ═══ */}
      <section className="relative px-8 md:px-16 py-24">
        <GridBg id="others" />
        <div className="relative z-10 max-w-4xl mx-auto">
          <SectionHeader num="06" label="Other Comparisons" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {otherCompetitors.map((slug) => {
              const comp = competitors[slug];
              return (
                <Link
                  key={slug}
                  href={`/compare/${slug}`}
                  className="border p-6 transition-colors hover:bg-white/[0.02]"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <p className="text-sm font-medium mb-1 text-warm-50">
                    Mina vs {comp.name}
                  </p>
                  <p className="text-xs text-warm-400">
                    {comp.stats.stars} stars &middot; {comp.stats.bundleSize}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <div className="px-8 md:px-16 py-8 text-center">
        <p className="text-xs font-mono tracking-wider text-warm-400/50">
          MIT License &middot; 2025&ndash;2026 Mina Massoud
        </p>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────────────────────── */

function StatsCard({ name, stats, highlight }: { name: string; stats: CompetitorData["stats"]; highlight?: boolean }) {
  return (
    <div
      className="border p-8 space-y-4"
      style={{
        borderColor: highlight ? "var(--border-strong)" : "var(--border-subtle)",
        background: highlight ? "rgba(200,180,160,0.03)" : "rgba(255,255,255,0.02)",
      }}
    >
      <h3 className="text-lg font-medium tracking-tight text-warm-50">{name}</h3>
      <div className="space-y-3">
        <StatRow label="Stars" value={stats.stars} />
        <StatRow label="Bundle" value={stats.bundleSize} />
        <StatRow label="License" value={stats.license} />
        <StatRow label="Activity" value={stats.lastUpdate} />
        <StatRow label="Framework" value={stats.framework} />
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1 border-b" style={{ borderColor: "rgba(200,180,160,0.03)" }}>
      <span className="text-xs font-mono uppercase tracking-wider text-warm-400">{label}</span>
      <span className="text-sm font-medium text-warm-50">{value}</span>
    </div>
  );
}

function FeatureRow({ category, mina, competitor, minaWins }: { category: string; mina: string; competitor: string; minaWins: boolean | null }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_1fr] py-4 border-b items-center" style={{ borderColor: "rgba(200,180,160,0.06)" }}>
      <div className="text-sm text-warm-100">{category}</div>
      <div className={`text-sm font-medium flex items-center gap-2 ${minaWins === true ? "" : "text-warm-50"}`} style={minaWins === true ? { color: "#4ade80" } : undefined}>
        {minaWins === true && <Check className="w-3.5 h-3.5 shrink-0" />}
        {minaWins === false && <Minus className="w-3.5 h-3.5 shrink-0 text-warm-400" />}
        {minaWins === null && <Minus className="w-3.5 h-3.5 shrink-0 text-warm-500" />}
        {mina}
      </div>
      <div className={`text-sm font-medium flex items-center gap-2 ${minaWins === false ? "" : "text-warm-200"}`} style={minaWins === false ? { color: "#60a5fa" } : undefined}>
        {minaWins === false && <Check className="w-3.5 h-3.5 shrink-0" />}
        {minaWins === true && <Minus className="w-3.5 h-3.5 shrink-0 text-warm-500" />}
        {minaWins === null && <Minus className="w-3.5 h-3.5 shrink-0 text-warm-500" />}
        {competitor}
      </div>
    </div>
  );
}

function CodeBlock({ title, code, highlight }: { title: string; code: string; highlight?: boolean }) {
  return (
    <div className="border overflow-hidden bg-surface-code" style={{ borderColor: highlight ? "rgba(200,180,160,0.145)" : "var(--border-subtle)" }}>
      <div className="px-6 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(200,180,160,0.06)" }}>
        <span className={`text-xs font-mono uppercase tracking-widest ${highlight ? "text-warm-200" : "text-warm-400"}`}>{title}</span>
        <Dots />
      </div>
      <pre className="px-6 py-6 overflow-x-auto text-xs leading-6 font-mono text-warm-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}

function VerdictCard({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="border p-8" style={{ borderColor: "var(--border-subtle)", background: "rgba(255,255,255,0.02)" }}>
      <h3 className="text-lg font-medium tracking-tight mb-6 text-warm-50">{title}</h3>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-3">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: accent }} />
            <span className="text-sm leading-relaxed text-warm-100">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
