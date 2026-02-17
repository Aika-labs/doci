'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ==========================================================================
   HeroSection — Scroll-morph animation
   ─────────────────────────────────────
   • Full-viewport image card that shrinks on scroll (gains padding + border-radius)
   • Dark overlay with headline + subtitle bottom-left (fades out on scroll)
   • Floating glass nav header
   • After morph: "LA VISIÓN" heading + description revealed above the card
   • 400vh track for deeper morph → more rectangular final card
   • Fully responsive (mobile / tablet / desktop)
   ========================================================================== */

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1668890115686-55c8625735e8?fm=jpg&q=80&w=2560&auto=format&fit=crop';

export default function HeroSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // Responsive config
  const getConfig = useCallback(() => {
    const w = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const isMobile = w < 768;
    return {
      finalWidth: isMobile ? w * 0.92 : Math.min(w * 0.95, 1600),
      finalHeight: isMobile ? 400 : 600,
      finalRadius: isMobile ? 24 : 40,
      finalTopMargin: isMobile ? 180 : 350,
    };
  }, []);

  // Store config in ref to avoid re-renders
  const configRef = useRef(getConfig());

  useEffect(() => {
    function handleScroll() {
      const track = trackRef.current;
      const card = cardRef.current;
      const content = contentRef.current;
      const header = headerRef.current;
      if (!track || !card) return;

      const config = configRef.current;
      const rect = track.getBoundingClientRect();
      const endScroll = track.offsetHeight - window.innerHeight;
      const scrolled = -rect.top;

      // Progress 0→1 over first 60% of scroll track
      const progress = Math.max(0, Math.min(scrolled / (endScroll * 0.6), 1));

      // Card dimensions morph
      const ww = window.innerWidth;
      const wh = window.innerHeight;
      const currentWidth = ww - progress * (ww - config.finalWidth);
      const currentHeight = wh - progress * (wh - config.finalHeight);
      const currentMargin = progress * config.finalTopMargin;
      const currentRadius = progress * config.finalRadius;

      card.style.width = `${currentWidth}px`;
      card.style.height = `${currentHeight}px`;
      card.style.borderRadius = `${currentRadius}px`;
      card.style.marginTop = `${currentMargin}px`;

      // Hero text fades out fast (first 30% of progress)
      if (content) {
        const textOpacity = Math.max(0, 1 - progress * 3);
        content.style.opacity = String(textOpacity);
        content.style.pointerEvents = progress > 0.3 ? 'none' : 'auto';
      }

      // "LA VISIÓN" header fades in after 50%
      if (header) {
        const headerOpacity = progress > 0.5 ? Math.min((progress - 0.5) * 2, 1) : 0;
        header.style.opacity = String(headerOpacity);
      }
    }

    function handleResize() {
      configRef.current = getConfig();
      handleScroll();
    }

  // ── Derived animation values ──────────────────────────────────────
  // First 40% of scroll = morph (card shrinks)
  const morphProgress = Math.min(1, progress / 0.4);
  // Last 60% = reveal text above card
  const revealProgress = Math.max(0, (progress - 0.4) / 0.6);

  // Card morph: padding grows, border-radius grows
  // Mobile: max 16px padding, Desktop: max 40px side / 120px top
  const sidePadding = morphProgress * 40;
  const topPadding = morphProgress * 120;
  const borderRadius = morphProgress * 32;

  // After first scroll handler runs, card dimensions are set by JS.
  // No extra mounted state needed — initial inline style is overwritten immediately.

  return (
    <div ref={trackRef} className="relative" style={{ height: '400vh' }}>
      {/* Sticky container — stays in viewport while we scroll through the track */}
      <div className="sticky top-0 h-screen w-full overflow-hidden">
        {/* ── Floating glass nav ──────────────────────────────────── */}
        <nav className="pointer-events-none absolute top-0 left-0 z-50 w-full">
          {/* Logo */}
          <div className="absolute top-6 left-6 z-10 md:top-8 md:left-8">
            <Link href="/" className="pointer-events-auto flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25 md:h-10 md:w-10">
                <span className="text-base font-bold text-white md:text-lg">D</span>
              </div>
              <span className="text-lg font-semibold text-white md:text-xl">Doci</span>
            </Link>
          </div>

          {/* Desktop nav pill — hidden on mobile */}
          <div className="pointer-events-auto fixed top-6 right-6 z-50 hidden md:block">
            <div className="flex items-center gap-6 rounded-full border border-white/10 bg-black/20 px-6 py-3 backdrop-blur-sm transition-all duration-300 hover:border-white/20 hover:bg-black/50">
              <a
                href="#features"
                className="text-sm font-medium text-white/90 transition-colors hover:text-blue-400"
              >
                Características
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-white/90 transition-colors hover:text-blue-400"
              >
                Precios
              </a>
              <a
                href="#impact"
                className="text-sm font-medium text-white/90 transition-colors hover:text-blue-400"
              >
                Impacto
              </a>
              <div className="h-4 w-px bg-white/20" />
              <Link
                href="#cta"
                className="text-sm font-semibold text-white transition-colors hover:text-blue-400"
              >
                Comenzar
              </Link>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="pointer-events-auto fixed top-6 right-6 z-50 md:hidden">
            <Link
              href="#cta"
              className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm"
            >
              Comenzar
            </Link>
          </div>
        </nav>

        {/* ── Reveal section (fades in above card after morph) ─────── */}
        <div
          className="absolute inset-x-0 top-0 z-10 flex flex-col items-center justify-center px-6"
          style={{
            height: `${topPadding}px`,
            opacity: revealProgress,
            transition: 'opacity 0.15s ease-out',
          }}
        >
          <h2
            className="text-center text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-5xl"
            style={{
              transform: `translateY(${(1 - revealProgress) * 15}px)`,
            }}
          >
            LA VISIÓN
          </h2>
          <p
            className="mt-2 max-w-2xl text-center text-xs leading-relaxed text-white/50 sm:text-sm md:mt-3 md:text-base"
            style={{
              transform: `translateY(${(1 - revealProgress) * 10}px)`,
            }}
          >
            Transformar la atención médica en Latinoamérica con tecnología que empodera al médico,
            protege al paciente y elimina la burocracia del consultorio.
          </p>
        </div>

        {/* ── Morphing card ───────────────────────────────────────── */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            paddingLeft: `${Math.max(sidePadding * 0.4, sidePadding * 0.4)}px`,
            paddingRight: `${Math.max(sidePadding * 0.4, sidePadding * 0.4)}px`,
            paddingTop: `${topPadding}px`,
            paddingBottom: `${sidePadding}px`,
            transition: 'padding 0.05s ease-out',
          }}
        >
          <Image
            src={HERO_IMAGE_URL}
            alt="Valle con montañas — Doci hero"
            fill
            priority
            className="object-cover opacity-80"
            sizes="100vw"
          />

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/20" />

          {/* ── Bottom-left hero content ───────────────────────────── */}
          <div
            ref={contentRef}
            className="absolute inset-0 flex flex-col justify-end pb-16 sm:pb-20 md:pb-[120px]"
            style={{ opacity: 1, transition: 'opacity 0.15s ease-out' }}
          >
            {/* Background image */}
            <Image
              src={HERO_IMAGE_URL}
              alt="Valle con montañas — Doci hero"
              fill
              priority
              className="object-cover"
              sizes="100vw"
            />

            {/* Dark overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />

            {/* ── Bottom-left text overlay ─────────────────────────── */}
            <div
              className="absolute bottom-0 left-0 z-20 p-6 sm:p-10 md:p-16 lg:p-20"
              style={{
                opacity: textOpacity,
                transform: `translateY(${morphProgress * 30}px)`,
                transition: 'opacity 0.1s ease-out, transform 0.1s ease-out',
              }}
            >
              <h1 className="max-w-3xl text-4xl leading-[1.05] font-medium tracking-tight text-white sm:text-5xl md:text-7xl lg:text-8xl">
                Tu consultorio,
                <br />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
                  reimaginado
                </span>
              </div>
              <h1 className="mb-8 max-w-4xl text-3xl leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-5xl">
                Tu consultorio, reimaginado. El sistema de gestión clínica que usa inteligencia
                artificial para que dediques más tiempo a tus pacientes y menos a la documentación.
              </h1>
              <p className="mt-4 max-w-md text-base leading-relaxed text-white/70 sm:mt-6 sm:max-w-xl sm:text-lg md:text-xl">
                El sistema de gestión clínica que usa inteligencia artificial para que dediques más
                tiempo a tus pacientes y menos a la documentación.
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
