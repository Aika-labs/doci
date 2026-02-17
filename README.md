# Doci - EHR SaaS con IA para LATAM

Sistema de Historia Clínica Electrónica (EHR) con transcripción de voz por IA, diseñado específicamente para el mercado latinoamericano.

## Quick Start

```bash
# Clonar
git clone https://github.com/Aika-labs/doci.git
cd doci

# Setup automático
chmod +x scripts/setup.sh
./scripts/setup.sh

# O manual:
pnpm install
cp .env.example .env
# Editar .env con credenciales
pnpm --filter @doci/database prisma generate
pnpm --filter @doci/database prisma migrate dev
pnpm dev
```

**URLs de desarrollo:**

- Frontend: http://localhost:3000
- API: http://localhost:3001
- API Docs (Swagger): http://localhost:3001/api

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

| Capa                | Tecnología                                    |
| ------------------- | --------------------------------------------- |
| **Frontend**        | Next.js 15, React 19, TailwindCSS, Clerk Auth |
| **Backend**         | NestJS 11, Prisma ORM, PostgreSQL (Supabase)  |
| **IA**              | OpenAI GPT-4, Whisper, text-embedding-ada-002 |
| **Infraestructura** | Pulumi, Hetzner Cloud, Docker                 |
| **Monorepo**        | Turborepo, pnpm workspaces                    |

## Estructura del Proyecto

```
doci/
├── apps/
│   ├── api/                 # NestJS Backend (20 módulos)
│   └── web/                 # Next.js Frontend
├── packages/
│   ├── database/            # Prisma schema (~25 modelos)
│   └── shared/              # Tipos y validadores
├── infrastructure/          # Pulumi IaC
├── docker/                  # Dockerfiles
├── docs/                    # Documentación
│   ├── ARCHITECTURE.md      # Estructura detallada del código
│   ├── DEPLOYMENT.md        # Guía de despliegue
│   └── PRODUCTION_CHECKLIST.md  # Estado y pendientes
└── scripts/
    ├── setup.sh             # Setup inicial
    └── deploy.sh            # Deploy producción
```

Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) para la estructura completa.

## Requisitos

- Node.js 20+
- pnpm 9+
- PostgreSQL 15+ con pgvector (o cuenta Supabase)
- Cuenta OpenAI con acceso a GPT-4 y Whisper
- Cuenta Clerk para autenticación

## Variables de Entorno

Copiar `.env.example` a `.env` y configurar:

| Variable               | Descripción                    | Requerido |
| ---------------------- | ------------------------------ | --------- |
| `DATABASE_URL`         | PostgreSQL connection (pooler) | ✅        |
| `DIRECT_URL`           | PostgreSQL direct (migrations) | ✅        |
| `SUPABASE_URL`         | URL del proyecto Supabase      | ✅        |
| `SUPABASE_SERVICE_KEY` | Service role key               | ✅        |
| `CLERK_SECRET_KEY`     | Clerk authentication           | ✅        |
| `OPENAI_API_KEY`       | OpenAI API                     | ✅        |
| `STRIPE_SECRET_KEY`    | Stripe payments                | Opcional  |
| `GOOGLE_CLIENT_ID`     | Google Calendar OAuth          | Opcional  |
| `MICROSOFT_CLIENT_ID`  | Outlook OAuth                  | Opcional  |
| `TWILIO_ACCOUNT_SID`   | WhatsApp notifications         | Opcional  |
| `RESEND_API_KEY`       | Email notifications            | Opcional  |

## Scripts Disponibles

```bash
# Desarrollo
pnpm dev              # Iniciar todos los servicios
pnpm build            # Build de producción
pnpm lint             # Linting
pnpm typecheck        # Type checking

# Base de datos
pnpm --filter @doci/database prisma generate   # Generar cliente
pnpm --filter @doci/database prisma migrate dev # Migraciones
pnpm --filter @doci/database prisma studio     # GUI de BD

# Por workspace
pnpm --filter @doci/api dev      # Solo API
pnpm --filter @doci/web dev      # Solo Web
```

## API Endpoints

| Módulo        | Path             | Descripción              |
| ------------- | ---------------- | ------------------------ |
| Patients      | `/patients`      | CRUD pacientes           |
| Consultations | `/consultations` | Consultas médicas        |
| Appointments  | `/appointments`  | Gestión de citas         |
| Prescriptions | `/prescriptions` | Recetas digitales        |
| AI            | `/ai`            | Transcripción y análisis |
| Vademecum     | `/vademecum`     | Base de medicamentos     |
| Billing       | `/billing`       | Facturación              |
| Calendar      | `/calendar`      | Sync calendarios         |
| Search        | `/search`        | Búsqueda global          |
| Subscriptions | `/subscriptions` | Planes y pagos           |
| Audit         | `/audit`         | Logs de actividad        |
| Onboarding    | `/onboarding`    | Wizard inicial           |

## Despliegue

### Desarrollo Local

```bash
./scripts/setup.sh
pnpm dev
```

### Producción (VPS con Docker)

```bash
# Configurar
cp .env.example .env.production
nano .env.production  # Agregar DOMAIN=tudominio.com

# Deploy
./scripts/deploy.sh
```

Ver [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) para guía completa.

## Planes de Suscripción

| Plan            | Precio/mes | Usuarios | Pacientes | Storage |
| --------------- | ---------- | -------- | --------- | ------- |
| **Básico**      | $499 MXN   | 2        | 500       | 5 GB    |
| **Profesional** | $999 MXN   | 5        | 2,000     | 20 GB   |
| **Empresarial** | $2,499 MXN | ∞        | ∞         | 100 GB  |

## Servicios Externos

### Obligatorios

- **Supabase**: PostgreSQL + Storage (Free tier disponible)
- **Clerk**: Autenticación (Free tier disponible)
- **OpenAI**: IA (~$50-200/mes según uso)

### Opcionales

- **Stripe**: Pagos (2.9% + $0.30/tx)
- **Twilio**: WhatsApp (~$0.005/msg)
- **Resend**: Email (Free tier disponible)
- **Google/Microsoft**: Calendar sync (Gratis)

### Monitoreo Recomendado

- **UptimeRobot**: Monitoreo uptime (Gratis)
- **Sentry**: Error tracking (Free tier)

Ver [docs/PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) para costos detallados.

## Documentación

- [ARCHITECTURE.md](docs/ARCHITECTURE.md) - Estructura completa del código
- [DEPLOYMENT.md](docs/DEPLOYMENT.md) - Guía de despliegue local y producción
- [PRODUCTION_CHECKLIST.md](docs/PRODUCTION_CHECKLIST.md) - Estado actual y pendientes

## Contribuir

1. Fork el repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

## Licencia

MIT License - ver [LICENSE](LICENSE) para detalles.
