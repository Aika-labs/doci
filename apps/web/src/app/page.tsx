import Link from 'next/link';
import {
  Calendar,
  Pill,
  Shield,
  ArrowRight,
  Check,
  Stethoscope,
  HeartPulse,
  Users,
  Clock,
  Smartphone,
  BarChart3,
  Lock,
} from 'lucide-react';
import HeroSection from './HeroSection';

/* ==========================================================================
   Doci Landing Page
   Design: Dark medical-blue theme inspired by modern SaaS / ESG layouts.
   Palette: navy #0A1628, light #E8F4FD, accent #3B82F6
   ========================================================================== */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0A1628] text-[#E8F4FD] selection:bg-blue-500 selection:text-white">
      {/* ── Hero with scroll-morph animation ────────────────────────── */}
      <HeroSection />

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

      {/* ── Features — Sticky Left + Cards Right ──────────────────── */}
      <section id="features" className="bg-white px-6 pb-40 text-[#0A1628] md:px-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
          {/* Sticky left */}
          <div className="flex h-fit flex-col justify-start gap-8 lg:sticky lg:top-32 lg:self-start">
            <h2 className="text-5xl leading-[0.95] font-medium tracking-tight md:text-6xl lg:text-7xl">
              Inteligencia
              <br />
              Clínica
            </h2>
            <p className="max-w-lg text-xl leading-relaxed font-medium text-[#0A1628]/60 md:text-2xl">
              Herramientas de IA que se adaptan a tu especialidad, automatizan la documentación y te
              devuelven horas de tu día.
            </p>
          </div>

          {/* Cards right */}
          <div className="flex flex-col gap-10">
            {/* AI Voice Notes */}
            <FeatureCard
              title="Notas clínicas con IA"
              description="Dicta tus notas y la IA las estructura automáticamente en formato SOAP. Ahorra hasta 2 horas diarias."
              stat="2hrs"
              statLabel="Ahorro diario promedio"
            />

            {/* Digital Records */}
            <FeatureCard
              title="Expediente Digital"
              description="Historias clínicas personalizables por especialidad con plantillas dinámicas y búsqueda inteligente."
              cta="Explorar plantillas"
            />

            {/* Digital Prescriptions */}
            <FeatureCard
              title="Recetas Digitales"
              description="Genera recetas con firma digital y código QR. Tus pacientes verifican la autenticidad en línea."
              cta="Ver ejemplo"
            />
          </div>
        </div>
      </section>

      {/* ── Capabilities Section (dark) ────────────────────────────── */}
      <section className="relative z-30 -mt-16 rounded-t-[3rem] bg-[#0A1628] pt-32 pb-32 text-[#E8F4FD] md:rounded-t-[5rem]">
        <div className="mx-auto max-w-7xl px-6 text-center md:px-12">
          <h2 className="mb-6 text-5xl font-medium tracking-tight md:text-8xl">Todo en un lugar</h2>
          <p className="mx-auto mb-24 max-w-2xl text-lg font-light text-white/60 md:text-2xl">
            Cada herramienta que necesitas para gestionar tu práctica médica, integrada en una sola
            plataforma.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <CapabilityCard
              icon={<Calendar className="h-7 w-7" />}
              title="Agenda Inteligente"
              description="Recordatorios por WhatsApp, confirmación automática y vista de calendario integrada."
            />
            <CapabilityCard
              icon={<Pill className="h-7 w-7" />}
              title="Vademécum con IA"
              description="Búsqueda semántica de medicamentos, interacciones y dosis personalizadas por paciente."
            />
            <CapabilityCard
              icon={<Smartphone className="h-7 w-7" />}
              title="PWA Móvil"
              description="Accede desde cualquier dispositivo. Funciona incluso sin conexión a internet."
            />
          </div>
        </div>
      </section>

      {/* ── Social Impact / Benefits (white) ───────────────────────── */}
      <section className="relative z-20 -mt-16 rounded-t-[3rem] bg-white px-6 pt-24 pb-24 text-[#0A1628] md:rounded-t-[5rem]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <h2 className="text-5xl font-bold tracking-tight md:text-7xl">
              Impacto
              <br />
              Real
            </h2>
            <p className="text-xl leading-relaxed text-[#0A1628]/70 md:text-2xl">
              Doci transforma la práctica médica en LATAM: menos burocracia, mejor atención, más
              tiempo para lo que importa.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <BenefitCard
              icon={<Users className="h-7 w-7" />}
              title="Pacientes"
              description="Mejor experiencia: recordatorios, historial accesible y comunicación directa con su médico."
            />
            <BenefitCard
              icon={<Clock className="h-7 w-7" />}
              title="Eficiencia"
              description="Reduce 70% del tiempo en documentación. Más consultas, menos papeleo."
            />
            <BenefitCard
              icon={<Shield className="h-7 w-7" />}
              title="Seguridad"
              description="Datos cifrados, respaldos automáticos y cumplimiento con normativas de salud mexicanas."
            />
          </div>
        </div>
      </section>

      {/* ── Impact Dashboard (dark) ────────────────────────────────── */}
      <section id="impact" className="bg-[#0A1628] px-6 py-24 text-[#E8F4FD]">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 grid grid-cols-1 gap-12 lg:grid-cols-2">
            <h2 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
              Panel de Impacto
            </h2>
            <p className="text-xl text-white/60 md:text-2xl">
              Métricas en tiempo real de cómo Doci optimiza la práctica médica de nuestros usuarios.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Chart area */}
            <div className="flex h-[400px] flex-col justify-between rounded-[2rem] border border-white/10 bg-white/5 p-8 md:col-span-2">
              <div className="flex items-start justify-between">
                <h3 className="text-2xl font-bold text-white">Consultas procesadas</h3>
                <div className="flex items-center gap-1 rounded-full bg-blue-500/20 px-3 py-1 text-sm font-semibold text-blue-400">
                  <BarChart3 className="h-3 w-3" />
                  +34% este mes
                </div>
              </div>
              <div className="mt-8 flex h-full w-full items-end justify-between gap-2 opacity-80">
                {[40, 55, 45, 70, 65, 85].map((h, i) => (
                  <div
                    key={i}
                    className={`group relative w-full cursor-pointer rounded-t-lg transition-all duration-500 hover:bg-blue-400/60 ${
                      i === 5
                        ? 'bg-gradient-to-t from-blue-500 to-blue-400/50'
                        : 'hover:h-[ bg-white/10' + (h + 5) + '%]'
                    }`}
                    style={{ height: `${h}%` }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs opacity-0 group-hover:opacity-100">
                      {2019 + i}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 text-sm text-white/40">Últimos 6 años de crecimiento</div>
            </div>

            {/* Stats column */}
            <div className="flex flex-col gap-8">
              <div className="flex flex-1 flex-col justify-center gap-2 rounded-[2rem] border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10">
                <span className="text-6xl font-bold tracking-tighter text-white">50k+</span>
                <div className="flex items-center gap-2 text-white/60">
                  <Stethoscope className="h-5 w-5" />
                  <span className="text-lg">Consultas procesadas</span>
                </div>
                <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-[85%] rounded-full bg-blue-500" />
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center gap-2 rounded-[2rem] border border-white/10 bg-white/5 p-8 transition-colors hover:bg-white/10">
                <span className="text-6xl font-bold tracking-tighter text-white">99.9%</span>
                <div className="flex items-center gap-2 text-white/60">
                  <HeartPulse className="h-5 w-5" />
                  <span className="text-lg">Uptime garantizado</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ────────────────────────────────────────── */}
      <section
        id="pricing"
        className="relative z-20 -mt-16 rounded-t-[3rem] bg-white px-6 pt-32 pb-32 text-[#0A1628] md:rounded-t-[5rem]"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-16 text-center">
            <h2 className="text-5xl font-bold tracking-tight md:text-7xl">Precios simples</h2>
            <p className="mt-4 text-xl text-[#0A1628]/60">Sin sorpresas. Cancela cuando quieras.</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            {/* Basic */}
            <div className="rounded-[2rem] border border-gray-200 bg-white p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl md:p-10">
              <h3 className="text-xl font-bold">Básico</h3>
              <p className="mt-2 text-[#0A1628]/60">Para consultorios individuales</p>
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
                href="#cta"
                className="mt-8 block w-full rounded-full border-2 border-[#0A1628] py-4 text-center font-medium transition-colors hover:bg-[#0A1628] hover:text-white"
              >
                Comenzar gratis
              </Link>
            </div>

            {/* Pro */}
            <div className="relative overflow-hidden rounded-[2rem] bg-[#0A1628] p-8 text-white transition-all duration-300 hover:-translate-y-2 hover:shadow-xl md:p-10">
              <div className="absolute top-6 right-6 rounded-full bg-blue-500 px-3 py-1 text-xs font-semibold">
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
                href="#cta"
                className="mt-8 block w-full rounded-full bg-white py-4 text-center font-semibold text-[#0A1628] transition-colors hover:bg-blue-50"
              >
                Comenzar gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA Section (dark) ─────────────────────────────────────── */}
      <section id="cta" className="bg-[#0A1628] px-6 py-32">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-5xl font-bold tracking-tight text-white md:text-7xl">
            Empieza a transformar
            <br />
            tu práctica hoy
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-xl text-white/60">
            Únete a cientos de médicos que ya usan Doci para optimizar su consultorio.
          </p>
          <div className="mt-10">
            <Link
              href="/sign-up"
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 px-10 py-5 text-lg font-semibold text-white shadow-xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:from-blue-600 hover:to-cyan-600"
            >
              Prueba gratis 14 días
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#0A1628] px-6 py-12 text-center text-sm text-white/30">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400">
              <span className="font-bold text-white">D</span>
            </div>
            <span className="text-lg font-semibold text-white/80">Doci</span>
          </div>
          <div className="flex items-center gap-8 text-white/40">
            <a href="#" className="transition-colors hover:text-white">
              Privacidad
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Términos
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Contacto
            </a>
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
    <div className="group cursor-default rounded-[2rem] bg-white/5 p-8 transition-all duration-500 hover:-translate-y-1 hover:bg-white/10 hover:text-white">
      <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-white/80 transition-colors group-hover:bg-blue-500/20 group-hover:text-blue-400">
        {icon}
      </div>
      <h3 className="mb-4 text-3xl font-bold tracking-tight">{title}</h3>
      <p className="text-lg leading-relaxed text-white/50 group-hover:text-white/70">
        {description}
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
          light ? 'bg-blue-500' : 'bg-blue-100'
        }`}
      >
        <Check className={`h-3 w-3 ${light ? 'text-white' : 'text-blue-600'}`} />
      </div>
      <span className={light ? 'text-white/90' : 'text-[#0A1628]/70'}>{children}</span>
    </li>
  );
}
