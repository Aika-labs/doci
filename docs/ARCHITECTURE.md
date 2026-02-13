# Arquitectura de Doci EHR

## Estructura Completa del Código

```
doci/
├── apps/
│   ├── api/                          # Backend NestJS
│   │   ├── src/
│   │   │   ├── common/               # Utilidades compartidas
│   │   │   │   ├── decorators/
│   │   │   │   │   ├── current-user.decorator.ts    # @CurrentUser() - datos del usuario
│   │   │   │   │   ├── public.decorator.ts          # @Public() - endpoints sin auth
│   │   │   │   │   ├── tenant.decorator.ts          # @TenantId() - ID del tenant
│   │   │   │   │   └── index.ts
│   │   │   │   ├── filters/          # Exception filters (pendiente)
│   │   │   │   ├── guards/
│   │   │   │   │   ├── clerk-auth.guard.ts          # Guard de autenticación Clerk
│   │   │   │   │   └── index.ts
│   │   │   │   └── interceptors/
│   │   │   │       ├── audit.interceptor.ts         # Interceptor de auditoría
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── modules/              # Módulos de funcionalidad
│   │   │   │   ├── ai/               # Transcripción y análisis IA
│   │   │   │   │   ├── ai.controller.ts             # POST /ai/transcribe, /ai/analyze
│   │   │   │   │   ├── ai.service.ts                # OpenAI Whisper + GPT-4
│   │   │   │   │   └── ai.module.ts
│   │   │   │   │
│   │   │   │   ├── appointments/     # Gestión de citas
│   │   │   │   │   ├── appointments.controller.ts   # CRUD /appointments
│   │   │   │   │   ├── appointments.service.ts      # Lógica de citas
│   │   │   │   │   └── appointments.module.ts
│   │   │   │   │
│   │   │   │   ├── audit/            # Audit trail
│   │   │   │   │   ├── audit.controller.ts          # GET /audit, /audit/stats
│   │   │   │   │   ├── audit.service.ts             # Logging de actividad
│   │   │   │   │   ├── audit.interceptor.ts         # @Audit() decorator
│   │   │   │   │   ├── audit.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── auth/             # Autenticación
│   │   │   │   │   ├── auth.controller.ts           # POST /auth/webhook (Clerk)
│   │   │   │   │   ├── auth.service.ts              # Sync usuarios Clerk -> DB
│   │   │   │   │   └── auth.module.ts               # Global guard
│   │   │   │   │
│   │   │   │   ├── backup/           # Respaldos automáticos
│   │   │   │   │   ├── backup.controller.ts         # GET/POST /backup
│   │   │   │   │   ├── backup.service.ts            # pg_dump, Supabase Storage
│   │   │   │   │   ├── backup.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── billing/          # Facturación
│   │   │   │   │   ├── billing.controller.ts        # /billing/services, /invoices
│   │   │   │   │   ├── billing.service.ts           # Facturas, pagos, reportes
│   │   │   │   │   ├── billing.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── calendar/         # Sync calendarios externos
│   │   │   │   │   ├── calendar.controller.ts       # OAuth callbacks, CRUD eventos
│   │   │   │   │   ├── calendar.service.ts          # Google Calendar, Outlook
│   │   │   │   │   ├── calendar.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── consultations/    # Consultas médicas
│   │   │   │   │   ├── consultations.controller.ts  # CRUD /consultations
│   │   │   │   │   ├── consultations.service.ts     # Notas SOAP, diagnósticos
│   │   │   │   │   └── consultations.module.ts
│   │   │   │   │
│   │   │   │   ├── files/            # Archivos de pacientes
│   │   │   │   │   ├── files.controller.ts          # Upload/download archivos
│   │   │   │   │   ├── files.service.ts             # Supabase Storage
│   │   │   │   │   ├── files.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── notifications/    # WhatsApp/Email
│   │   │   │   │   ├── notifications.controller.ts  # POST /notifications/send
│   │   │   │   │   ├── notifications.service.ts     # Twilio, Resend
│   │   │   │   │   ├── notifications.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── onboarding/       # Wizard inicial
│   │   │   │   │   ├── onboarding.controller.ts     # GET/POST /onboarding
│   │   │   │   │   ├── onboarding.service.ts        # 6 pasos, auto-detección
│   │   │   │   │   ├── onboarding.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── patients/         # Gestión de pacientes
│   │   │   │   │   ├── dto/
│   │   │   │   │   │   ├── create-patient.dto.ts
│   │   │   │   │   │   └── update-patient.dto.ts
│   │   │   │   │   ├── patients.controller.ts       # CRUD /patients
│   │   │   │   │   ├── patients.service.ts          # Lógica de pacientes
│   │   │   │   │   └── patients.module.ts
│   │   │   │   │
│   │   │   │   ├── prescriptions/    # Recetas digitales
│   │   │   │   │   ├── prescriptions.controller.ts  # CRUD, PDF generation
│   │   │   │   │   ├── prescriptions.service.ts     # Firma digital, QR
│   │   │   │   │   └── prescriptions.module.ts
│   │   │   │   │
│   │   │   │   ├── search/           # Búsqueda global
│   │   │   │   │   ├── search.controller.ts         # GET /search?q=
│   │   │   │   │   ├── search.service.ts            # Multi-entidad, scoring
│   │   │   │   │   ├── search.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── specialty-templates/  # Plantillas por especialidad
│   │   │   │   │   ├── specialty-templates.controller.ts
│   │   │   │   │   ├── specialty-templates.service.ts  # 6 especialidades
│   │   │   │   │   ├── specialty-templates.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── storage/          # Supabase Storage wrapper
│   │   │   │   │   ├── storage.controller.ts
│   │   │   │   │   ├── storage.service.ts
│   │   │   │   │   ├── storage.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── subscriptions/    # Planes y Stripe
│   │   │   │   │   ├── subscriptions.controller.ts  # Checkout, webhooks
│   │   │   │   │   ├── subscriptions.service.ts     # Stripe integration
│   │   │   │   │   ├── subscriptions.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   ├── templates/        # Plantillas clínicas custom
│   │   │   │   │   ├── templates.controller.ts
│   │   │   │   │   ├── templates.service.ts
│   │   │   │   │   ├── templates.module.ts
│   │   │   │   │   └── index.ts
│   │   │   │   │
│   │   │   │   └── vademecum/        # Base de medicamentos RAG
│   │   │   │       ├── vademecum.controller.ts      # Search, interactions
│   │   │   │       ├── vademecum.service.ts         # OpenAI embeddings
│   │   │   │       ├── vademecum.module.ts
│   │   │   │       └── index.ts
│   │   │   │
│   │   │   ├── prisma/               # Prisma service
│   │   │   │   ├── prisma.service.ts
│   │   │   │   └── prisma.module.ts
│   │   │   │
│   │   │   ├── app.module.ts         # Root module
│   │   │   └── main.ts               # Bootstrap
│   │   │
│   │   ├── test/                     # Tests E2E
│   │   ├── nest-cli.json
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── eslint.config.mjs
│   │
│   └── web/                          # Frontend Next.js
│       ├── src/
│       │   ├── app/                  # App Router
│       │   │   ├── (auth)/           # Rutas de autenticación
│       │   │   │   ├── sign-in/
│       │   │   │   └── sign-up/
│       │   │   ├── (dashboard)/      # Rutas protegidas
│       │   │   │   ├── patients/
│       │   │   │   ├── consultations/
│       │   │   │   ├── appointments/
│       │   │   │   ├── billing/
│       │   │   │   └── settings/
│       │   │   ├── api/              # API routes (webhooks)
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   └── globals.css
│       │   │
│       │   ├── components/           # Componentes React
│       │   │   ├── ui/               # Componentes base (shadcn)
│       │   │   ├── forms/            # Formularios
│       │   │   ├── tables/           # Tablas de datos
│       │   │   ├── charts/           # Gráficos
│       │   │   └── layout/           # Header, Sidebar, etc.
│       │   │
│       │   ├── hooks/                # Custom hooks
│       │   │   ├── use-api.ts
│       │   │   ├── use-auth.ts
│       │   │   └── use-toast.ts
│       │   │
│       │   └── lib/                  # Utilidades
│       │       ├── api.ts            # Cliente API
│       │       ├── utils.ts
│       │       └── constants.ts
│       │
│       ├── public/
│       │   ├── icons/
│       │   └── manifest.json         # PWA manifest
│       │
│       ├── next.config.ts
│       ├── package.json
│       ├── tsconfig.json
│       ├── tailwind.config.ts
│       └── postcss.config.mjs
│
├── packages/
│   ├── database/                     # Prisma schema y cliente
│   │   ├── prisma/
│   │   │   └── schema.prisma         # ~800 líneas, 25+ modelos
│   │   ├── src/
│   │   │   └── index.ts              # Re-export Prisma client
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── shared/                       # Tipos y validadores
│       ├── src/
│       │   ├── types/
│       │   │   ├── patient.ts
│       │   │   ├── consultation.ts
│       │   │   └── index.ts
│       │   └── validators/
│       │       ├── patient.validator.ts
│       │       └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── infrastructure/                   # Pulumi IaC
│   ├── index.ts                      # Stack principal
│   ├── Pulumi.yaml
│   ├── Pulumi.dev.yaml
│   ├── package.json
│   └── tsconfig.json
│
├── docker/
│   ├── Dockerfile.api
│   ├── Dockerfile.web
│   ├── docker-compose.yml            # Producción
│   └── docker-compose.dev.yml        # Desarrollo
│
├── docs/                             # Documentación
│   ├── ARCHITECTURE.md               # Este archivo
│   ├── DEPLOYMENT.md                 # Guía de despliegue
│   └── API.md                        # Documentación API
│
├── scripts/                          # Scripts de utilidad
│   ├── seed.ts                       # Seed de datos
│   └── backup.sh                     # Backup manual
│
├── .env.example
├── .gitignore
├── .npmrc
├── .prettierrc
├── package.json                      # Root package
├── pnpm-workspace.yaml
├── turbo.json
├── LICENSE
└── README.md
```

## Modelos de Base de Datos (Prisma Schema)

### Core Models
| Modelo | Descripción | Relaciones |
|--------|-------------|------------|
| `Tenant` | Clínica/consultorio | Users, Patients, Templates |
| `User` | Médico/staff | Tenant, Consultations, Appointments |
| `Patient` | Paciente | Tenant, Consultations, Files |
| `Consultation` | Consulta médica | Patient, User, Prescriptions |
| `Appointment` | Cita | Patient, User, Consultation |
| `Prescription` | Receta | Consultation |
| `PatientFile` | Archivo adjunto | Patient |
| `ClinicalTemplate` | Plantilla SOAP | Tenant |

### Extended Models
| Modelo | Descripción |
|--------|-------------|
| `AuditLog` | Registro de actividad |
| `Vademecum` | Medicamentos con embeddings |
| `Service` | Catálogo de servicios |
| `Invoice` | Factura |
| `InvoiceItem` | Línea de factura |
| `Payment` | Pago |
| `PricingPlan` | Plan de suscripción |
| `Subscription` | Suscripción activa |
| `CalendarIntegration` | OAuth tokens |
| `OnboardingProgress` | Progreso onboarding |
| `SpecialtyTemplate` | Plantilla por especialidad |

## Flujo de Datos

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Next.js   │────▶│   NestJS    │────▶│  PostgreSQL │
│  Frontend   │◀────│   Backend   │◀────│  (Supabase) │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │                    │
       │                   │                    │
       ▼                   ▼                    ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    Clerk    │     │   OpenAI    │     │  Supabase   │
│    Auth     │     │  GPT/Whisper│     │   Storage   │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │   Stripe    │
                    │  Payments   │
                    └─────────────┘
```
