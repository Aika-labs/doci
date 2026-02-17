'use client';

import { useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';

/* ==========================================================================
   HeroSection — Scroll-morph animation (ESG-now reference)
   ─────────────────────────────────────────────────────────
   Morphing card: starts full-viewport, shrinks to a centered rounded card
   via width / height / marginTop. Text overlay fades out fast,
   "La Visión" heading fades in above the card.
   Scroll is fully reversible — scrolling back up restores the full card.
   ========================================================================== */

const HERO_IMAGE_URL =
  'https://hoirqrkdgbmvpwutwuwj.supabase.co/storage/v1/object/public/assets/assets/e92d24ed-c56e-42fe-ae8a-5317467d8eaa_3840w.webp';

export default function HeroSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

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
      /* Use the full scroll range so the morph reverses smoothly on scroll-up */
      const progress = Math.max(0, Math.min(scrolled / endScroll, 1));

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

      if (content) {
        /* Fade out text in the first 30% of scroll */
        const textOpacity = Math.max(0, 1 - progress * 3.3);
        content.style.opacity = String(textOpacity);
        content.style.pointerEvents = progress > 0.3 ? 'none' : 'auto';
      }

      if (header) {
        /* "La Visión" fades in during the last 50% of scroll */
        const headerOpacity = progress > 0.5 ? Math.min((progress - 0.5) * 2, 1) : 0;
        header.style.opacity = String(headerOpacity);
      }
    }

    function handleResize() {
      configRef.current = getConfig();
      handleScroll();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [getConfig]);

  return (
    <header ref={trackRef} className="relative w-full bg-[#0A1628]" style={{ height: '300vh' }}>
      <div className="sticky top-0 flex h-screen w-full flex-col items-center justify-start overflow-hidden">
        {/* Floating glass nav */}
        <nav className="pointer-events-none absolute top-0 left-0 z-50 w-full">
          <div className="absolute top-6 left-6 z-10 md:top-8 md:left-8">
            <Link href="/" className="pointer-events-auto flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25 md:h-10 md:w-10">
                <span className="text-base font-bold text-white md:text-lg">D</span>
              </div>
              <span className="text-lg font-semibold text-white md:text-xl">Doci</span>
            </Link>
          </div>
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
                href="/dashboard"
                className="text-sm font-semibold text-white transition-colors hover:text-blue-400"
              >
                Dashboard
              </Link>
            </div>
          </div>
          <div className="pointer-events-auto fixed top-6 right-6 z-50 md:hidden">
            <Link
              href="/dashboard"
              className="flex items-center rounded-full border border-white/10 bg-black/20 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur-sm"
            >
              Dashboard
            </Link>
          </div>
        </nav>

        {/* "La Visión" — fades in above card at ~50% scroll */}
        <div
          ref={headerRef}
          className="absolute top-[15%] z-10 flex w-full flex-col items-center px-6 text-center"
          style={{ opacity: 0, transition: 'opacity 0.3s ease-out' }}
        >
          <h2 className="mb-3 text-3xl font-medium tracking-tight text-slate-50 sm:text-4xl md:mb-4 md:text-7xl">
            La Visión
          </h2>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-slate-50/70 sm:text-base md:text-xl">
            Transformar la atención médica en Venezuela con tecnología que empodera al médico,
            protege al paciente y elimina la burocracia del consultorio.
          </p>
        </div>

        {/* Morphing card */}
        <div
          ref={cardRef}
          className="relative z-20 overflow-hidden bg-black shadow-2xl"
          style={{ width: '100vw', height: '100vh', borderRadius: 0, marginTop: 0 }}
        >
          <Image
            src={HERO_IMAGE_URL}
            alt="Doci — inteligencia clínica"
            fill
            priority
            className="object-cover opacity-80"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-black/20" />

          {/* Bottom-left hero content */}
          <div
            ref={contentRef}
            className="absolute inset-0 flex flex-col justify-end pb-16 sm:pb-20 md:pb-[120px]"
            style={{ opacity: 1, transition: 'opacity 0.15s ease-out' }}
          >
            <div className="mx-auto w-full max-w-[1600px] px-6 md:px-12 lg:px-20">
              <div className="mb-6 inline-flex items-center gap-3 opacity-90">
                <span className="text-xs font-semibold tracking-[0.2em] text-white/90 uppercase md:text-sm">
                  INTELIGENCIA CLÍNICA
                </span>
              </div>
              <h1 className="mb-8 max-w-3xl text-4xl leading-[1.05] font-medium tracking-tight text-blue-400 sm:text-5xl md:text-7xl lg:text-8xl">
                Tu consultorio,
                <br />
                reimaginado.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-white/80 md:text-xl">
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
