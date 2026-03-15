"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";

export const heroColors = {
  50: "#f8f7f5",
  100: "#e6e1d7",
  200: "#c8b4a0",
  300: "#a89080",
  400: "#8a7060",
  500: "#6b5545",
  600: "#544237",
  700: "#3c4237",
  800: "#2a2e26",
  900: "#1a1d18",
};


export function HeroSection() {
  const gradientRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate words
    const words = document.querySelectorAll<HTMLElement>(".hero-word");
    words.forEach((word) => {
      const delay = parseInt(word.getAttribute("data-delay") || "0", 10);
      setTimeout(() => {
        word.style.animation = "word-appear 0.8s ease-out forwards";
      }, delay);
    });

    // Mouse gradient
    const gradient = gradientRef.current;
    function onMouseMove(e: MouseEvent) {
      if (gradient) {
        gradient.style.left = e.clientX - 192 + "px";
        gradient.style.top = e.clientY - 192 + "px";
        gradient.style.opacity = "1";
      }
    }
    function onMouseLeave() {
      if (gradient) gradient.style.opacity = "0";
    }
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseleave", onMouseLeave);

    // Word hover effects
    words.forEach((word) => {
      word.addEventListener("mouseenter", () => {
        word.style.textShadow = "0 0 20px rgba(200, 180, 160, 0.5)";
      });
      word.addEventListener("mouseleave", () => {
        word.style.textShadow = "none";
      });
    });

    // Click ripple effect
    function onClick(e: MouseEvent) {
      const ripple = document.createElement("div");
      ripple.style.position = "fixed";
      ripple.style.left = e.clientX + "px";
      ripple.style.top = e.clientY + "px";
      ripple.style.width = "4px";
      ripple.style.height = "4px";
      ripple.style.background = "rgba(200, 180, 160, 0.6)";
      ripple.style.borderRadius = "50%";
      ripple.style.transform = "translate(-50%, -50%)";
      ripple.style.pointerEvents = "none";
      ripple.style.animation = "pulse-glow 1s ease-out forwards";
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 1000);
    }
    document.addEventListener("click", onClick);

    // Floating elements on scroll
    let scrolled = false;
    function onScroll() {
      if (!scrolled) {
        scrolled = true;
        document.querySelectorAll<HTMLElement>(".floating-element").forEach((el, index) => {
          setTimeout(() => {
            el.style.animationPlayState = "running";
          }, index * 200);
        });
      }
    }
    window.addEventListener("scroll", onScroll);

    return () => {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseleave", onMouseLeave);
      document.removeEventListener("click", onClick);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-warm-900 via-black to-warm-800 text-warm-100 font-primary overflow-hidden relative w-full"
    >
   

      <div className="relative z-10 min-h-screen flex flex-col justify-between items-center px-8 py-12 md:px-16 md:py-20">
        {/* Top tagline */}
        <div className="text-center">
          <h2
            className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 text-warm-200"
          >
            <span className="hero-word" data-delay="0">
              Welcome
            </span>{" "}
            <span className="hero-word" data-delay="200">
              to
            </span>{" "}
            <span className="hero-word" data-delay="400">
              <b>Mina Rich Editor</b>
            </span>{" "}
            <span className="hero-word" data-delay="600">
              —
            </span>{" "}
            <span className="hero-word" data-delay="800">
              Block-based
            </span>{" "}
            <span className="hero-word" data-delay="1000">
              editing
            </span>{" "}
            <span className="hero-word" data-delay="1200">
              for
            </span>{" "}
            <span className="hero-word" data-delay="1400">
              React.
            </span>
          </h2>
          <div
            className="mt-4 w-16 h-px opacity-30 mx-auto"
            style={{
              background: `linear-gradient(to right, transparent, var(--warm-200), transparent)`,
            }}
          ></div>
        </div>

        {/* Main headline */}
        <div className="text-center max-w-5xl mx-auto">
          <h1
            className="text-3xl md:text-5xl lg:text-6xl font-extralight leading-tight tracking-tight text-warm-50"
          >
            <div className="mb-4 md:mb-6">
              <span className="hero-word" data-delay="1600">
                AI-Powered,
              </span>{" "}
              <span className="hero-word" data-delay="1750">
                Collaborative,
              </span>{" "}
              <span className="hero-word" data-delay="1900">
                Free
              </span>
            </div>
            <div
              className="text-2xl md:text-3xl lg:text-4xl font-thin leading-relaxed text-warm-200"
            >
              <span className="hero-word" data-delay="2050">
                Rich
              </span>{" "}
              <span className="hero-word" data-delay="2200">
                Text
              </span>{" "}
              <span className="hero-word" data-delay="2350">
                Editor
              </span>{" "}
              <span className="hero-word" data-delay="2500">
                for React
              </span>
            </div>
          </h1>

          {/* Subtitle */}
          <p
            className="mt-6 text-sm md:text-base font-light leading-relaxed max-w-2xl mx-auto text-warm-100"
            style={{
              opacity: 0,
              animation: "word-appear 0.8s ease-out forwards",
              animationDelay: "2.8s",
            }}
          >
            Built-in AI generation, real-time collaboration, and Notion-style blocks — completely free. No ProseMirror. No license fees.
          </p>

          {/* CTA Buttons */}
          <div
            className="flex flex-col sm:flex-row gap-4 mt-8 justify-center items-stretch"
            
          >
            <Link
              href="/demo"
              className="px-10 py-4 text-lg font-semibold transition-all hover:scale-[1.03] hover:brightness-110 active:scale-[0.98] shadow-md bg-warm-200 text-warm-900 inline-block"
            >
              Try Mina Rich Editor →
            </Link>
            <div
              className="px-6 py-4 border font-mono text-sm flex items-center gap-2 select-all border-warm-700 text-warm-200"
            >
              npm i @mina-editor/core
            </div>
          </div>
        </div>

        {/* Bottom tagline */}
        <div className="text-center">
          <div
            className="mb-4 w-16 h-px opacity-30 mx-auto"
            style={{
              background: `linear-gradient(to right, transparent, var(--warm-200), transparent)`,
            }}
          ></div>
          <h2
            className="text-xs md:text-sm font-mono font-light uppercase tracking-[0.2em] opacity-80 text-warm-200"
          >
            <span className="hero-word" data-delay="3600">
              AI-Powered,
            </span>{" "}
            <span className="hero-word" data-delay="3750">
              Collaborative,
            </span>{" "}
            <span className="hero-word" data-delay="3900">
              Zero
            </span>{" "}
            <span className="hero-word" data-delay="4050">
              ProseMirror
            </span>{" "}
            <span className="hero-word" data-delay="4200">
              dependency,
            </span>{" "}
            <span className="hero-word" data-delay="4350">
              semantic
            </span>{" "}
            <span className="hero-word" data-delay="4500">
              HTML
            </span>{" "}
            <span className="hero-word" data-delay="4650">
              export.
            </span>
          </h2>
          <div
            className="mt-6 flex justify-center space-x-4"
            style={{
              opacity: 0,
              animation: "word-appear 1s ease-out forwards",
              animationDelay: "4.5s",
            }}
          >
            <div
              className="w-1 h-1 rounded-full opacity-40 bg-warm-200"
            ></div>
            <div
              className="w-1 h-1 rounded-full opacity-60 bg-warm-200"
            ></div>
            <div
              className="w-1 h-1 rounded-full opacity-40 bg-warm-200"
            ></div>
          </div>
        </div>
      </div>

      <img src={'/backgrounds/hero-img.webp'} className="absolute inset-0 w-full h-full opacity-[0.05]" />
      <img src={'/backgrounds/pharoh.png'} className="absolute invert top-0 right-0 opacity-[0.06]" />


      <div
        id="mouse-gradient"
        ref={gradientRef}
        className="fixed pointer-events-none w-96 h-96 rounded-full blur-3xl transition-all duration-500 ease-out opacity-0"
        style={{
          background: `radial-gradient(circle, #6b55450D 0%, transparent 100%)`,
        }}
      ></div>
    </div>
  );
}
