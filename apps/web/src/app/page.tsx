import Link from 'next/link';
import {
  Mic,
  FileText,
  Calendar,
  Pill,
  Smartphone,
  Shield,
  Sparkles,
  ArrowRight,
  Check,
  Stethoscope,
  Brain,
  HeartPulse,
  Users,
  Clock,
  Smartphone,
  BarChart3,
  Lock,
} from 'lucide-react';

/* ==========================================================================
   Doci Landing Page
   Design: Dark medical-blue theme inspired by modern SaaS / ESG layouts.
   Palette: navy #0A1628, light #E8F4FD, accent #3B82F6
   ========================================================================== */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 right-0 left-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg shadow-teal-500/25">
              <span className="text-lg font-bold text-white">D</span>
            </div>
            <span className="text-xl font-semibold text-white">Doci</span>
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Características
            </a>
            <a
              href="#pricing"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Precios
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Testimonios
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900"
            >
              Impacto
            </a>
            <div className="h-4 w-px bg-white/20" />
            <Link
              href="/sign-up"
              className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
            >
              Comenzar
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="overflow-hidden px-6 pt-32 pb-20">
        <div className="mx-auto max-w-7xl">
          {/* Badge */}
          <div className="mb-8 flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-100 bg-gradient-to-r from-teal-50 to-cyan-50 px-4 py-2">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">
                Potenciado con IA de última generación
              </span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl leading-[1.1] font-bold tracking-tight text-gray-900 md:text-7xl">
            Tu consultorio,
            <br />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-300 bg-clip-text text-transparent">
              reimaginado
            </span>
          </h1>

          <p className="mx-auto mt-8 max-w-2xl text-center text-xl leading-relaxed text-gray-600">
            El sistema de gestión clínica que usa inteligencia artificial para que dediques más
            tiempo a tus pacientes y menos a la documentación.
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 rounded-full bg-gray-900 px-8 py-4 font-medium text-white shadow-xl shadow-gray-900/20 transition-all hover:scale-105 hover:bg-gray-800"
            >
              Prueba gratis 14 días
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <button className="flex items-center gap-2 rounded-full px-8 py-4 font-medium text-gray-700 transition-colors hover:bg-gray-100">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                <Play className="ml-0.5 h-4 w-4 text-gray-700" />
              </div>
              Ver demo
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-600" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-600" />
              Configuración en 5 minutos
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-teal-600" />
              Soporte en español
            </span>
          </div>
        </div>
      </header>

      {/* ── Partners / Trust ───────────────────────────────────────── */}
      <section className="relative z-30 -mt-16 rounded-t-[3rem] bg-white pt-20 pb-20 text-[#0A1628] md:rounded-t-[5rem]">
        <div className="mx-auto max-w-7xl px-6 md:px-12">
          <div className="flex flex-col items-center justify-center gap-12 pt-8">
            <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">
              Diseñado para médicos modernos
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-70 grayscale transition-all duration-500 hover:opacity-100 hover:grayscale-0 md:gap-16">
              <div className="flex h-12 items-center gap-2">
                <Shield className="h-8 w-8 text-[#0A1628]" />
                <span className="text-lg font-bold tracking-tight">HIPAA</span>
              </div>
              <div className="flex h-12 items-center gap-2">
                <Lock className="h-8 w-8 text-[#0A1628]" />
                <span className="text-lg font-bold tracking-tight">NOM-024</span>
              </div>
              <div className="flex h-12 items-center gap-2">
                <Stethoscope className="h-8 w-8 text-[#0A1628]" />
                <span className="text-lg font-bold tracking-tight">HL7 FHIR</span>
              </div>
              <div className="flex h-12 items-center gap-2">
                <HeartPulse className="h-8 w-8 text-[#0A1628]" />
                <span className="text-lg font-bold tracking-tight">COFEPRIS</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">Todo lo que necesitas</h2>
            <p className="mt-4 text-xl text-gray-600">
              Herramientas diseñadas para médicos modernos
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Large Card - AI Voice */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 p-8 text-white md:p-10 lg:col-span-2">
              <div className="relative z-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur">
                  <Mic className="h-7 w-7" />
                </div>
                <h3 className="mb-3 text-2xl font-bold md:text-3xl">Notas clínicas con IA</h3>
                <p className="max-w-md text-lg leading-relaxed text-white/80">
                  Dicta tus notas y la IA las estructura automáticamente en formato SOAP. Ahorra
                  hasta 2 horas diarias en documentación.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur">
                    <Zap className="h-4 w-4" />
                    Whisper + GPT-4o
                  </div>
                  <div className="flex items-center gap-2 rounded-full bg-white/20 px-4 py-2 text-sm backdrop-blur">
                    <Clock className="h-4 w-4" />
                    Tiempo real
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 h-64 w-64 translate-x-1/2 -translate-y-1/2 transform rounded-full bg-white/10 blur-3xl" />
              <div className="absolute bottom-0 left-0 h-48 w-48 -translate-x-1/2 translate-y-1/2 transform rounded-full bg-cyan-400/20 blur-2xl" />
            </div>

            {/* Expediente */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg shadow-purple-500/25">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Expediente Digital</h3>
              <p className="leading-relaxed text-gray-600">
                Historias clínicas personalizables por especialidad con plantillas dinámicas y
                búsqueda inteligente.
              </p>
            </div>

            {/* Agenda */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 shadow-lg shadow-orange-500/25">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Agenda Inteligente</h3>
              <p className="leading-relaxed text-gray-600">
                Recordatorios automáticos por WhatsApp, confirmación de citas y vista de calendario
                integrada.
              </p>
            </div>

            {/* Recetas - Wide */}
            <div className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white md:p-10 lg:col-span-2">
              <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 backdrop-blur">
                    <Pill className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold md:text-3xl">Recetas Digitales</h3>
                  <p className="text-lg leading-relaxed text-white/70">
                    Genera recetas con firma digital y código QR de verificación. Tus pacientes
                    pueden verificar la autenticidad en línea.
                  </p>
                </div>
                <div className="flex-shrink-0 rounded-2xl bg-white/10 p-6 backdrop-blur">
                  <div className="text-center">
                    <Shield className="mx-auto mb-2 h-10 w-10 text-teal-400" />
                    <p className="text-sm text-white/60">Verificación</p>
                    <p className="text-lg font-bold">Segura</p>
                  </div>
                </div>
              </div>
            </div>

            {/* PWA */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-lg shadow-blue-500/25">
                <Smartphone className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">PWA Móvil</h3>
              <p className="leading-relaxed text-gray-600">
                Accede desde cualquier dispositivo. Funciona incluso sin conexión a internet.
              </p>
            </div>

            {/* Reportes */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 shadow-lg shadow-emerald-500/25">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Reportes Avanzados</h3>
              <p className="leading-relaxed text-gray-600">
                Estadísticas de tu práctica, tendencias y métricas de rendimiento en tiempo real.
              </p>
            </div>

            {/* Seguridad */}
            <div className="group relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:shadow-xl hover:shadow-gray-200/50">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500 to-rose-500 shadow-lg shadow-red-500/25">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <h3 className="mb-2 text-xl font-bold text-gray-900">Seguridad Total</h3>
              <p className="leading-relaxed text-gray-600">
                Datos cifrados, autenticación segura y cumplimiento con normativas de salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12">
            <StatCard number="500+" label="Médicos activos" />
            <StatCard number="50k+" label="Consultas procesadas" />
            <StatCard number="2hrs" label="Ahorro diario promedio" />
            <StatCard number="99.9%" label="Uptime garantizado" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="bg-gray-50 px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">Precios simples</h2>
            <p className="mt-4 text-xl text-gray-600">Sin sorpresas. Cancela cuando quieras.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Basic Plan */}
            <div className="rounded-3xl border border-gray-200 bg-white p-8 md:p-10">
              <h3 className="text-xl font-bold text-gray-900">Básico</h3>
              <p className="mt-2 text-gray-600">Para consultorios individuales</p>
              <div className="mt-6">
                <span className="text-5xl font-bold">$499</span>
                <span className="text-[#0A1628]/60"> MXN/mes</span>
              </div>
              <ul className="mt-8 space-y-4">
                <PricingFeature>Hasta 100 pacientes</PricingFeature>
                <PricingFeature>Notas con IA (50/mes)</PricingFeature>
                <PricingFeature>Agenda y citas</PricingFeature>
                <PricingFeature>Recetas digitales</PricingFeature>
                <PricingFeature>Soporte por email</PricingFeature>
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-full border-2 border-gray-900 py-4 text-center font-medium text-gray-900 transition-colors hover:bg-gray-900 hover:text-white"
              >
                Comenzar gratis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-white md:p-10">
              <div className="absolute top-6 right-6 rounded-full bg-teal-500 px-3 py-1 text-xs font-medium">
                Popular
              </div>
              <h3 className="text-xl font-bold">Profesional</h3>
              <p className="mt-2 text-white/60">Para clínicas y equipos</p>
              <div className="mt-6">
                <span className="text-5xl font-bold">$999</span>
                <span className="text-white/60"> MXN/mes</span>
              </div>
              <ul className="mt-8 space-y-4">
                <PricingFeature light>Pacientes ilimitados</PricingFeature>
                <PricingFeature light>Notas con IA ilimitadas</PricingFeature>
                <PricingFeature light>Múltiples usuarios</PricingFeature>
                <PricingFeature light>Reportes avanzados</PricingFeature>
                <PricingFeature light>API y webhooks</PricingFeature>
                <PricingFeature light>Soporte prioritario 24/7</PricingFeature>
              </ul>
              <Link
                href="/sign-up"
                className="mt-8 block w-full rounded-full bg-white py-4 text-center font-medium text-gray-900 transition-colors hover:bg-gray-100"
              >
                Comenzar gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl font-bold text-gray-900 md:text-5xl">
            Empieza a transformar tu práctica hoy
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-xl text-white/60">
            Únete a cientos de médicos que ya usan Doci para optimizar su consultorio.
          </p>
          <div className="mt-10">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 px-8 py-4 font-medium text-white shadow-xl shadow-teal-500/25 transition-all hover:scale-105 hover:from-teal-700 hover:to-cyan-700"
            >
              Prueba gratis 14 días
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600">
                <span className="font-bold text-white">D</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Doci</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-600">
              <a href="#" className="transition-colors hover:text-gray-900">
                Privacidad
              </a>
              <a href="#" className="transition-colors hover:text-gray-900">
                Términos
              </a>
              <a href="#" className="transition-colors hover:text-gray-900">
                Contacto
              </a>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Doci. Todos los derechos reservados.
            </p>
          </div>
          <p>© {new Date().getFullYear()} Doci. Todos los derechos reservados.</p>
        </div>
      </footer>
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────── */

function FeatureCard({
  title,
  description,
  stat,
  statLabel,
  cta,
}: {
  title: string;
  description: string;
  stat?: string;
  statLabel?: string;
  cta?: string;
}) {
  return (
    <div className="group relative flex cursor-default flex-col gap-12 overflow-hidden rounded-[2.5rem] border border-transparent bg-slate-50 p-10 shadow-sm transition-all duration-500 ease-out hover:-translate-y-2 hover:border-blue-100 hover:bg-blue-50 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)]">
      <div className="relative z-10 space-y-4">
        <h3 className="text-4xl font-medium tracking-tight text-[#0A1628] md:text-5xl">{title}</h3>
        <p className="max-w-md text-lg leading-relaxed font-medium text-[#0A1628]/60">
          {description}
        </p>
      </div>
      {stat && (
        <div className="mt-auto border-t border-[#0A1628]/10 pt-8">
          <span className="text-5xl font-medium tracking-tight text-[#0A1628] md:text-6xl">
            {stat}
          </span>
          {statLabel && (
            <span className="mt-1 block text-sm font-semibold tracking-wider text-[#0A1628]/50 uppercase">
              {statLabel}
            </span>
          )}
        </div>
      )}
      {cta && (
        <div className="group/btn mt-auto flex items-center justify-between border-t border-[#0A1628]/10 pt-6">
          <span className="text-sm font-semibold tracking-wider text-[#0A1628] uppercase">
            {cta}
          </span>
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#0A1628]/10 bg-white transition-all duration-300 group-hover/btn:bg-[#0A1628] group-hover/btn:text-white">
            <ArrowRight className="h-5 w-5" />
          </div>
        </div>
      )}
      <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-white/40 opacity-0 blur-3xl transition-all duration-700 group-hover:bg-white/60 group-hover:opacity-100" />
    </div>
  );
}

function CapabilityCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="text-center">
      <p className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
        {number}
      </p>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group cursor-default rounded-[2rem] bg-slate-50 p-8 transition-all duration-500 hover:bg-[#0A1628] hover:text-[#E8F4FD]">
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0A1628] transition-colors group-hover:bg-white/10 group-hover:text-[#E8F4FD]">
        {icon}
      </div>
      <h3 className="mb-4 text-3xl font-bold tracking-tight">{title}</h3>
      <p className="text-lg leading-relaxed opacity-60">{description}</p>
    </div>
  );
}

function PricingFeature({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div
        className={`flex h-5 w-5 items-center justify-center rounded-full ${
          light ? 'bg-teal-500' : 'bg-teal-100'
        }`}
      >
        <Check className={`h-3 w-3 ${light ? 'text-white' : 'text-teal-600'}`} />
      </div>
      <span className={light ? 'text-white/90' : 'text-[#0A1628]/70'}>{children}</span>
    </li>
  );
}
