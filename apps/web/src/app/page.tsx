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
  Play,
  Zap,
  Clock,
  BarChart3,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/25">
              <span className="text-white font-bold text-lg">D</span>
            </div>
            <span className="text-xl font-semibold text-gray-900">Doci</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Características
            </a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Precios
            </a>
            <a href="#testimonials" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Testimonios
            </a>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-5 py-2.5 rounded-full transition-colors"
            >
              Comenzar gratis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 overflow-hidden">
        <div className="mx-auto max-w-7xl">
          {/* Badge */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100">
              <Sparkles className="w-4 h-4 text-teal-600" />
              <span className="text-sm font-medium text-teal-700">Potenciado con IA de última generación</span>
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-center text-5xl md:text-7xl font-bold tracking-tight text-gray-900 leading-[1.1]">
            Tu consultorio,
            <br />
            <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
              reimaginado
            </span>
          </h1>

          <p className="mt-8 text-center text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            El sistema de gestión clínica que usa inteligencia artificial para que 
            dediques más tiempo a tus pacientes y menos a la documentación.
          </p>

          {/* CTA Buttons */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="group flex items-center gap-2 px-8 py-4 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-all hover:scale-105 shadow-xl shadow-gray-900/20"
            >
              Prueba gratis 14 días
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <button className="flex items-center gap-2 px-8 py-4 text-gray-700 rounded-full font-medium hover:bg-gray-100 transition-colors">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <Play className="w-4 h-4 text-gray-700 ml-0.5" />
              </div>
              Ver demo
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-600" />
              Sin tarjeta de crédito
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-600" />
              Configuración en 5 minutos
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-teal-600" />
              Soporte en español
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section id="features" className="py-24 px-6 bg-gray-50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Todo lo que necesitas
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Herramientas diseñadas para médicos modernos
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large Card - AI Voice */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-500 to-cyan-600 p-8 md:p-10 text-white">
              <div className="relative z-10">
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center mb-6">
                  <Mic className="w-7 h-7" />
                </div>
                <h3 className="text-2xl md:text-3xl font-bold mb-3">Notas clínicas con IA</h3>
                <p className="text-white/80 text-lg max-w-md leading-relaxed">
                  Dicta tus notas y la IA las estructura automáticamente en formato SOAP. 
                  Ahorra hasta 2 horas diarias en documentación.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-sm">
                    <Zap className="w-4 h-4" />
                    Whisper + GPT-4o
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur text-sm">
                    <Clock className="w-4 h-4" />
                    Tiempo real
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-400/20 rounded-full blur-2xl transform -translate-x-1/2 translate-y-1/2" />
            </div>

            {/* Expediente */}
            <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-5 shadow-lg shadow-purple-500/25">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Expediente Digital</h3>
              <p className="text-gray-600 leading-relaxed">
                Historias clínicas personalizables por especialidad con plantillas dinámicas y búsqueda inteligente.
              </p>
            </div>

            {/* Agenda */}
            <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-5 shadow-lg shadow-orange-500/25">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Agenda Inteligente</h3>
              <p className="text-gray-600 leading-relaxed">
                Recordatorios automáticos por WhatsApp, confirmación de citas y vista de calendario integrada.
              </p>
            </div>

            {/* Recetas - Wide */}
            <div className="lg:col-span-2 group relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 md:p-10 text-white">
              <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-8">
                <div className="flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center mb-6">
                    <Pill className="w-7 h-7" />
                  </div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">Recetas Digitales</h3>
                  <p className="text-white/70 text-lg leading-relaxed">
                    Genera recetas con firma digital y código QR de verificación. 
                    Tus pacientes pueden verificar la autenticidad en línea.
                  </p>
                </div>
                <div className="flex-shrink-0 p-6 bg-white/10 backdrop-blur rounded-2xl">
                  <div className="text-center">
                    <Shield className="w-10 h-10 mx-auto mb-2 text-teal-400" />
                    <p className="text-sm text-white/60">Verificación</p>
                    <p className="text-lg font-bold">Segura</p>
                  </div>
                </div>
              </div>
            </div>

            {/* PWA */}
            <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-5 shadow-lg shadow-blue-500/25">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">PWA Móvil</h3>
              <p className="text-gray-600 leading-relaxed">
                Accede desde cualquier dispositivo. Funciona incluso sin conexión a internet.
              </p>
            </div>

            {/* Reportes */}
            <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center mb-5 shadow-lg shadow-emerald-500/25">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Reportes Avanzados</h3>
              <p className="text-gray-600 leading-relaxed">
                Estadísticas de tu práctica, tendencias y métricas de rendimiento en tiempo real.
              </p>
            </div>

            {/* Seguridad */}
            <div className="group relative overflow-hidden rounded-3xl bg-white border border-gray-200 p-8 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center mb-5 shadow-lg shadow-red-500/25">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Seguridad Total</h3>
              <p className="text-gray-600 leading-relaxed">
                Datos cifrados, autenticación segura y cumplimiento con normativas de salud.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <StatCard number="500+" label="Médicos activos" />
            <StatCard number="50k+" label="Consultas procesadas" />
            <StatCard number="2hrs" label="Ahorro diario promedio" />
            <StatCard number="99.9%" label="Uptime garantizado" />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-6 bg-gray-50">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
              Precios simples
            </h2>
            <p className="mt-4 text-xl text-gray-600">
              Sin sorpresas. Cancela cuando quieras.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Basic Plan */}
            <div className="rounded-3xl bg-white border border-gray-200 p-8 md:p-10">
              <h3 className="text-xl font-bold text-gray-900">Básico</h3>
              <p className="mt-2 text-gray-600">Para consultorios individuales</p>
              <div className="mt-6">
                <span className="text-5xl font-bold text-gray-900">$499</span>
                <span className="text-gray-600"> MXN/mes</span>
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
                className="mt-8 block w-full text-center py-4 rounded-full border-2 border-gray-900 text-gray-900 font-medium hover:bg-gray-900 hover:text-white transition-colors"
              >
                Comenzar gratis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="rounded-3xl bg-gradient-to-br from-gray-900 to-gray-800 p-8 md:p-10 text-white relative overflow-hidden">
              <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-teal-500 text-xs font-medium">
                Popular
              </div>
              <h3 className="text-xl font-bold">Profesional</h3>
              <p className="mt-2 text-white/70">Para clínicas y equipos</p>
              <div className="mt-6">
                <span className="text-5xl font-bold">$999</span>
                <span className="text-white/70"> MXN/mes</span>
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
                className="mt-8 block w-full text-center py-4 rounded-full bg-white text-gray-900 font-medium hover:bg-gray-100 transition-colors"
              >
                Comenzar gratis
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-6">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            Empieza a transformar tu práctica hoy
          </h2>
          <p className="mt-6 text-xl text-gray-600">
            Únete a cientos de médicos que ya usan Doci para optimizar su consultorio.
          </p>
          <div className="mt-10">
            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-full font-medium hover:from-teal-700 hover:to-cyan-700 transition-all shadow-xl shadow-teal-500/25 hover:scale-105"
            >
              Prueba gratis 14 días
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-200 py-12 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
                <span className="text-white font-bold">D</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Doci</span>
            </div>
            <div className="flex items-center gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-gray-900 transition-colors">Privacidad</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Términos</a>
              <a href="#" className="hover:text-gray-900 transition-colors">Contacto</a>
            </div>
            <p className="text-sm text-gray-500">
              © {new Date().getFullYear()} Doci. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="text-center">
      <p className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
        {number}
      </p>
      <p className="mt-2 text-gray-600">{label}</p>
    </div>
  );
}

function PricingFeature({ children, light }: { children: React.ReactNode; light?: boolean }) {
  return (
    <li className="flex items-center gap-3">
      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
        light ? 'bg-teal-500' : 'bg-teal-100'
      }`}>
        <Check className={`w-3 h-3 ${light ? 'text-white' : 'text-teal-600'}`} />
      </div>
      <span className={light ? 'text-white/90' : 'text-gray-700'}>{children}</span>
    </li>
  );
}
