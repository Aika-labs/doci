import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
              <span className="text-sm font-bold">D</span>
            </div>
            <span className="text-xl font-semibold">Doci</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-sm font-medium text-slate-600 hover:text-slate-900"
            >
              Iniciar sesión
            </Link>
            <Link
              href="/sign-up"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Comenzar gratis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-4 py-20 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Tu consultorio,
            <br />
            <span className="text-blue-600">potenciado con IA</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Doci es el sistema de gestión clínica que usa inteligencia artificial para reducir tu
            tiempo de documentación. Dicta tus notas y deja que la IA las estructure por ti.
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link
              href="/sign-up"
              className="rounded-lg bg-blue-600 px-6 py-3 text-base font-medium text-white hover:bg-blue-700"
            >
              Prueba gratis 14 días
            </Link>
            <Link
              href="#demo"
              className="rounded-lg border border-slate-300 px-6 py-3 text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Ver demo
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t bg-slate-50 py-20">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="text-center text-3xl font-bold text-slate-900">
              Todo lo que necesitas en un solo lugar
            </h2>
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <FeatureCard
                icon="🎙️"
                title="Notas con IA"
                description="Dicta tus notas clínicas y la IA las estructura automáticamente en formato SOAP."
              />
              <FeatureCard
                icon="📋"
                title="Expediente Digital"
                description="Historias clínicas personalizables por especialidad con plantillas dinámicas."
              />
              <FeatureCard
                icon="📅"
                title="Agenda Inteligente"
                description="Recordatorios automáticos por WhatsApp y confirmación de citas."
              />
              <FeatureCard
                icon="💊"
                title="Recetas Digitales"
                description="Genera recetas con firma digital y código de verificación."
              />
              <FeatureCard
                icon="📱"
                title="PWA Móvil"
                description="Accede desde cualquier dispositivo, incluso sin conexión."
              />
              <FeatureCard
                icon="🔒"
                title="Seguridad"
                description="Datos cifrados y cumplimiento con normativas de salud."
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-slate-500">
          © {new Date().getFullYear()} Doci. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6">
      <div className="text-3xl">{icon}</div>
      <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600">{description}</p>
    </div>
  );
}
