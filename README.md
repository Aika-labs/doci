# Doci - EHR SaaS con IA para LATAM

Sistema de Historia Clínica Electrónica (EHR) con transcripción de voz por IA, diseñado específicamente para el mercado latinoamericano.

## Características Principales

### Core EHR
- **Gestión de Pacientes**: CRUD completo con historial médico, alergias, medicamentos
- **Consultas con IA**: Transcripción de voz en tiempo real, notas SOAP automáticas
- **Citas y Agenda**: Calendario con recordatorios automáticos
- **Recetas Digitales**: Generación de PDF con firma digital y código de verificación
- **Plantillas Clínicas**: Personalizables por especialidad médica

### Módulos Avanzados
- **Vademécum RAG**: Base de datos de medicamentos con búsqueda semántica y verificación de interacciones
- **Facturación**: Catálogo de servicios, facturas con soporte CFDI (México), reportes financieros
- **Calendar Sync**: Integración con Google Calendar y Microsoft Outlook
- **Audit Trail**: Registro completo de actividad para cumplimiento normativo
- **Backup/DR**: Respaldos automáticos diarios con retención de 30 días

### UX & Business
- **Onboarding Wizard**: Guía de configuración inicial en 6 pasos
- **Búsqueda Global**: Búsqueda unificada de pacientes, consultas, citas, servicios
- **Plantillas por Especialidad**: 6 especialidades médicas preconfiguradas
- **Planes y Suscripciones**: 3 tiers con integración Stripe

## Tech Stack

| Capa | Tecnología |
|------|------------|
| **Frontend** | Next.js 15, React 19, TailwindCSS, Clerk Auth |
| **Backend** | NestJS 11, Prisma ORM, PostgreSQL (Supabase) |
| **IA** | OpenAI GPT-4, Whisper, text-embedding-ada-002 |
| **Infraestructura** | Pulumi, Hetzner Cloud, Docker |
| **Monorepo** | Turborepo, pnpm workspaces |

## Estructura del Proyecto

```
doci/
├── apps/
│   ├── api/                 # NestJS Backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── ai/              # Transcripción y análisis IA
│   │       │   ├── appointments/    # Gestión de citas
│   │       │   ├── audit/           # Audit trail
│   │       │   ├── auth/            # Autenticación Clerk
│   │       │   ├── backup/          # Respaldos automáticos
│   │       │   ├── billing/         # Facturación
│   │       │   ├── calendar/        # Sync Google/Outlook
│   │       │   ├── consultations/   # Consultas médicas
│   │       │   ├── files/           # Archivos de pacientes
│   │       │   ├── notifications/   # WhatsApp/Email
│   │       │   ├── onboarding/      # Wizard inicial
│   │       │   ├── patients/        # Gestión de pacientes
│   │       │   ├── prescriptions/   # Recetas digitales
│   │       │   ├── search/          # Búsqueda global
│   │       │   ├── specialty-templates/  # Plantillas médicas
│   │       │   ├── storage/         # Supabase Storage
│   │       │   ├── subscriptions/   # Planes y Stripe
│   │       │   ├── templates/       # Plantillas clínicas
│   │       │   └── vademecum/       # Base de medicamentos
│   │       └── prisma/
│   └── web/                 # Next.js Frontend
│       └── src/
│           ├── app/         # App Router
│           └── components/  # UI Components
├── packages/
│   ├── database/            # Prisma schema y cliente
│   └── shared/              # Tipos y validadores compartidos
├── infrastructure/          # Pulumi IaC
└── docker/                  # Dockerfiles
```

## Requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ (o cuenta Supabase)
- Cuenta OpenAI con acceso a GPT-4 y Whisper
- Cuenta Clerk para autenticación

## Instalación

### 1. Clonar el repositorio

```bash
git clone https://github.com/Aika-labs/doci.git
cd doci
```

### 2. Instalar dependencias

```bash
pnpm install
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus credenciales
```

### 4. Configurar base de datos

```bash
# Generar cliente Prisma
pnpm --filter @doci/database prisma generate

# Ejecutar migraciones
pnpm --filter @doci/database prisma migrate dev
```

### 5. Iniciar en desarrollo

```bash
# Todos los servicios
pnpm dev

# Solo API
pnpm --filter @doci/api dev

# Solo Web
pnpm --filter @doci/web dev
```

## Variables de Entorno

Ver `.env.example` para la lista completa. Variables principales:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL de conexión PostgreSQL (pooler) |
| `DIRECT_URL` | URL directa PostgreSQL (migraciones) |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_KEY` | Service role key de Supabase |
| `CLERK_SECRET_KEY` | Secret key de Clerk |
| `OPENAI_API_KEY` | API key de OpenAI |
| `STRIPE_SECRET_KEY` | Secret key de Stripe |
| `GOOGLE_CLIENT_ID` | OAuth client ID de Google |
| `MICROSOFT_CLIENT_ID` | OAuth client ID de Microsoft |

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar todos los servicios
pnpm build            # Build de producción
pnpm lint             # Linting
pnpm typecheck        # Type checking

# Base de datos
pnpm db:generate      # Generar cliente Prisma
pnpm db:migrate       # Ejecutar migraciones
pnpm db:studio        # Abrir Prisma Studio

# Por workspace
pnpm --filter @doci/api <script>
pnpm --filter @doci/web <script>
pnpm --filter @doci/database <script>
```

## API Endpoints

### Autenticación
Todos los endpoints requieren autenticación via Clerk JWT excepto los marcados como públicos.

### Módulos Principales

| Módulo | Base Path | Descripción |
|--------|-----------|-------------|
| Patients | `/patients` | CRUD de pacientes |
| Consultations | `/consultations` | Consultas médicas |
| Appointments | `/appointments` | Gestión de citas |
| Prescriptions | `/prescriptions` | Recetas digitales |
| AI | `/ai` | Transcripción y análisis |
| Vademecum | `/vademecum` | Base de medicamentos |
| Billing | `/billing` | Facturación |
| Calendar | `/calendar` | Sync de calendarios |
| Search | `/search` | Búsqueda global |
| Subscriptions | `/subscriptions` | Planes y pagos |

## Planes de Suscripción

| Plan | Precio/mes | Usuarios | Pacientes | Storage |
|------|------------|----------|-----------|---------|
| **Básico** | $499 MXN | 2 | 500 | 5 GB |
| **Profesional** | $999 MXN | 5 | 2,000 | 20 GB |
| **Empresarial** | $2,499 MXN | Ilimitado | Ilimitado | 100 GB |

## Especialidades Médicas Soportadas

- Medicina General
- Pediatría
- Ginecología y Obstetricia
- Cardiología
- Dermatología
- Psiquiatría

Cada especialidad incluye plantillas SOAP personalizadas y prompts de IA optimizados.

## Despliegue

### Docker

```bash
# Build
docker-compose -f docker/docker-compose.yml build

# Run
docker-compose -f docker/docker-compose.yml up -d
```

### Pulumi (Hetzner Cloud)

```bash
cd infrastructure
pulumi up
```

## Contribuir

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.

## Soporte

- **Email**: soporte@doci.health
- **Documentación**: https://docs.doci.health
- **Issues**: https://github.com/Aika-labs/doci/issues
