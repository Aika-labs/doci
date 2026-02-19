# Arquitectura de Doci EHR

## Resumen

Doci es un sistema de Historia Clínica Electrónica (EHR) con asistente de IA para
consultorios médicos en Latinoamérica. Monorepo con pnpm workspaces, backend NestJS,
frontend Next.js, base de datos PostgreSQL (Supabase), y despliegue en Vercel (web) +
Hetzner VPS (API, pendiente).

---

## 1. Estructura del Monorepo

```
doci/
├── apps/
│   ├── api/                    # NestJS 10 — REST API, puerto 4000
│   │   ├── src/
│   │   │   ├── common/         # Guards (Clerk), decorators, filters, interceptors
│   │   │   ├── modules/        # 18 módulos de negocio (ver §2)
│   │   │   ├── prisma/         # PrismaService singleton
│   │   │   ├── app.module.ts   # Root module — importa todo
│   │   │   ├── main.ts         # Bootstrap: helmet, cors, compression, swagger
│   │   │   └── sentry.ts       # Sentry init
│   │   ├── nest-cli.json
│   │   └── package.json        # @doci/api
│   │
│   └── web/                    # Next.js 16 (App Router) — puerto 3000
│       ├── src/
│       │   ├── app/
│       │   │   ├── (auth)/     # /sign-in, /sign-up (Clerk)
│       │   │   ├── dashboard/  # Rutas protegidas (9 secciones)
│       │   │   ├── offline/    # Fallback PWA
│       │   │   ├── verify/     # Verificación de recetas
│       │   │   ├── page.tsx    # Landing / Hero
│       │   │   └── sw.ts       # Service Worker (Serwist)
│       │   ├── components/     # 9 carpetas: ui, voice, files, patients, etc.
│       │   ├── hooks/          # useAuth, useApi, useToast
│       │   └── lib/
│       │       ├── api.ts      # Cliente HTTP con fallback a mock-data
│       │       └── mock-data.ts # ~800 líneas de datos demo venezolanos
│       ├── next.config.ts
│       ├── sentry.*.config.ts  # Client, server, edge configs
│       └── vercel.json
│
├── packages/
│   ├── database/               # @doci/database — Prisma schema + client
│   │   └── prisma/
│   │       └── schema.prisma   # 20 modelos, pgvector, multi-tenant
│   │
│   └── shared/                 # @doci/shared — Tipos y validadores
│       └── src/
│           ├── types/          # Patient, Consultation, AIAnalysis, etc.
│           └── validators/     # Zod schemas (parcial)
│
├── infrastructure/             # Pulumi IaC — Hetzner Cloud
│   ├── index.ts                # VPS + firewall + network + volume
│   └── Pulumi.yaml             # Stack: doci-infrastructure
│
├── docker/
│   ├── Dockerfile.api          # Multi-stage build NestJS
│   ├── Dockerfile.web          # Multi-stage build Next.js standalone
│   ├── docker-compose.yml
│   ├── docker-compose.dev.yml
│   └── docker-compose.prod.yml # Traefik + API + Web
│
├── .github/workflows/
│   ├── ci.yml                  # PR: lint + typecheck + format
│   └── deploy.yml              # Push main: Vercel deploy (solo web)
│
├── scripts/
│   ├── setup.sh
│   └── deploy.sh
│
├── turbo.json                  # Turborepo pipeline
├── pnpm-workspace.yaml         # Workspaces: apps/*, packages/*
└── .env.example                # 20+ variables requeridas
```

---

## 2. Módulos del Backend (API)

| Módulo               | Ruta base              | Dependencias externas       | Estado    |
| -------------------- | ---------------------- | --------------------------- | --------- |
| **Auth**             | `/api/auth`            | Clerk SDK                   | Funcional |
| **Patients**         | `/api/patients`        | —                           | Funcional |
| **Consultations**    | `/api/consultations`   | —                           | Funcional |
| **Appointments**     | `/api/appointments`    | —                           | Funcional |
| **Prescriptions**    | `/api/prescriptions`   | PDFKit (generación PDF)     | Funcional |
| **AI**               | `/api/ai`              | OpenAI (GPT-4o, Whisper)    | Funcional |
| **Storage**          | `/api/storage`         | Supabase Storage            | Funcional |
| **Files**            | `/api/files`           | Supabase Storage            | Funcional |
| **Notifications**    | `/api/notifications`   | Twilio, Resend              | Funcional |
| **Billing**          | `/api/billing`         | —                           | Funcional |
| **Subscriptions**    | `/api/subscriptions`   | Stripe                      | Funcional |
| **Calendar**         | `/api/calendar`        | Google, Microsoft OAuth     | Funcional |
| **Vademecum**        | `/api/vademecum`       | OpenAI Embeddings, pgvector | Funcional |
| **Search**           | `/api/search`          | —                           | Funcional |
| **Audit**            | `/api/audit`           | —                           | Funcional |
| **Backup**           | `/api/backup`          | pg_dump, Supabase Storage   | Funcional |
| **Onboarding**       | `/api/onboarding`      | —                           | Funcional |
| **Templates**        | `/api/templates`       | —                           | Funcional |
| **Specialty Templ.** | `/api/specialty-templ.` | —                          | Funcional |
| **Health**           | `/api/health`          | —                           | Funcional |

> **Nota**: "Funcional" = código existe y compila. NO significa probado en producción.
> Hay dos módulos de archivos (`storage` y `files`) con buckets distintos
> (`medical-files` vs `patient-files`) — posible duplicación a consolidar.

---

## 3. Modelos de Datos (Prisma)

20 modelos, multi-tenant por `tenantId`:

```
Tenant ──┬── User (médico/staff)
         ├── Patient ──┬── Consultation ── Prescription
         │             ├── Appointment
         │             ├── PatientFile (aiAnalysis: JSONB)
         │             └── Invoice ── InvoiceItem, Payment
         ├── ClinicalTemplate
         ├── SpecialtyTemplate
         ├── Service
         ├── AuditLog
         ├── Vademecum (embeddings pgvector)
         ├── CalendarIntegration
         ├── OnboardingProgress
         ├── PricingPlan ── Subscription
         └── TreatmentProtocol
```

---

## 4. Servicios Externos

| Servicio         | Uso                          | Configurado | Probado en prod |
| ---------------- | ---------------------------- | ----------- | --------------- |
| **Supabase**     | PostgreSQL + Storage         | Si          | No              |
| **Clerk**        | Autenticación, webhooks      | Si          | No              |
| **OpenAI**       | GPT-4o, Whisper, Embeddings  | Si          | No              |
| **Vercel**       | Hosting frontend             | Si          | Si (preview)    |
| **Hetzner**      | VPS para API (Pulumi)        | Parcial     | No              |
| **Stripe**       | Suscripciones, pagos         | Código listo | No             |
| **Twilio**       | WhatsApp                     | Código listo | No             |
| **Resend**       | Email transaccional          | Código listo | No             |
| **Google**       | Calendar OAuth               | Código listo | No             |
| **Microsoft**    | Outlook OAuth                | Código listo | No             |
| **Sentry**       | Error tracking               | Integrado   | No              |

---

## 5. Flujo de Datos

```
                    ┌──────────────────────────────────────────────┐
                    │              USUARIO (Navegador)              │
                    └──────────────┬───────────────────────────────┘
                                   │
                    ┌──────────────▼───────────────────────────────┐
                    │         Next.js (Vercel)                      │
                    │  • App Router, SSR/CSR                        │
                    │  • Clerk auth (client-side)                   │
                    │  • Si API no responde → mock-data fallback    │
                    └──────────────┬───────────────────────────────┘
                                   │ Bearer token (Clerk JWT)
                    ┌──────────────▼───────────────────────────────┐
                    │         NestJS API (Hetzner VPS)              │
                    │  • ClerkAuthGuard global                      │
                    │  • ThrottlerGuard (60 req/min)                │
                    │  • Helmet + CORS + Compression                │
                    │  • Sentry error tracking                      │
                    │  • Prefijo: /api/*                            │
                    └───┬──────────┬──────────┬────────────────────┘
                        │          │          │
              ┌─────────▼──┐ ┌────▼────┐ ┌───▼──────────┐
              │ PostgreSQL  │ │ OpenAI  │ │   Supabase   │
              │ (Supabase)  │ │ GPT-4o  │ │   Storage    │
              │ + pgvector  │ │ Whisper │ │  (archivos)  │
              └─────────────┘ └─────────┘ └──────────────┘
```

---

## 6. Brechas Criticas (lo que NO funciona hoy)

### 6.1 Backend API no desplegado

El API NestJS no tiene hosting en producción. El frontend en Vercel
(`doci-inky.vercel.app`) funciona solo con **mock data** porque no hay
un `NEXT_PUBLIC_API_URL` apuntando a un backend real.

**Impacto**: Nada es real. Pacientes, consultas, recetas, archivos — todo es demo.

### 6.2 Base de datos sin migrar

No se ha ejecutado `prisma migrate deploy` contra ninguna base de datos de producción.
El schema existe pero no hay tablas reales.

**Impacto**: Aunque el API se despliegue, no hay tablas para operar.

### 6.3 Infraestructura Pulumi nunca desplegada

El stack `doci-infrastructure/dev` existe en Pulumi Cloud pero tiene 0 recursos.
Falta el `HCLOUD_TOKEN` y nunca se ejecutó `pulumi up`.

**Impacto**: No hay VPS, no hay red, no hay firewall, no hay volumen.

### 6.4 Frontend 100% dependiente de mock data

`apps/web/src/lib/api.ts` tiene un `catch` que retorna datos mock cuando el backend
no responde. Esto significa que el sitio "funciona" visualmente pero nada persiste.

**Impacto**: El usuario ve datos falsos sin saberlo. No hay indicador visible.

### 6.5 Dos módulos de archivos duplicados

`StorageModule` (bucket `medical-files`) y `FilesModule` (bucket `patient-files`)
hacen cosas similares. El nuevo endpoint `analyze-document` usa `StorageService`
pero los archivos de pacientes se suben via `FilesService`.

**Impacto**: Confusión sobre qué bucket tiene qué. Posible pérdida de archivos.

### 6.6 Sin tests

No hay tests unitarios ni de integración. La carpeta `apps/api/test/` existe pero
está vacía o con boilerplate de NestJS.

**Impacto**: Cualquier cambio puede romper funcionalidad sin que nadie lo note.

### 6.7 Sin migraciones de Prisma

No hay carpeta `prisma/migrations/`. Se usa `prisma db push` (schema sync directo)
en vez de migraciones versionadas.

**Impacto**: No hay historial de cambios de schema. Imposible hacer rollback.

### 6.8 Secrets hardcodeados en .env.example

El `.env.example` tiene placeholders pero el deploy workflow de GitHub Actions
depende de secrets que probablemente no están configurados.

**Impacto**: CI/CD de deploy no funciona sin configurar secrets en GitHub.

### 6.9 API prefix inconsistente

`main.ts` configura `app.setGlobalPrefix('api')`, pero el frontend llama a
`${API_URL}/ai/analyze-document` sin el prefijo `/api/`. Los controllers
tampoco usan `/api/` en sus decoradores.

**Impacto**: 404 en todas las llamadas al backend real. El mock data oculta esto.

### 6.10 Sin HTTPS para el API

El docker-compose.prod.yml tiene Traefik con Let's Encrypt, pero nunca se desplegó.
Sin HTTPS, Clerk JWTs no se pueden validar de forma segura.

---

## 7. Brechas Secundarias

| Brecha                          | Severidad | Descripción                                                    |
| ------------------------------- | --------- | -------------------------------------------------------------- |
| Sin rate limiting por usuario   | Media     | ThrottlerGuard es por IP, no por tenant/usuario                |
| Sin validación DTO completa     | Media     | Algunos endpoints aceptan cualquier body                       |
| Sin logging estructurado        | Media     | Solo `console.log`, no JSON logs para agregación               |
| Sin health check de dependencias| Media     | `/api/health` no verifica DB, Supabase, OpenAI                 |
| PWA offline limitada            | Baja      | Service worker registrado pero sin cache de datos              |
| Sin i18n formal                 | Baja      | Textos hardcodeados en español, sin framework de traducción    |
| Sin paginación en listas        | Media     | Algunas queries cargan todos los registros                     |
| Clerk webhook sin verificar     | Alta      | El endpoint `/auth/webhook` debería verificar firma de Clerk   |
| Sin backup automático real      | Media     | BackupModule existe pero el cron no está configurado           |
| pdf-parse v2 API inestable      | Baja      | La API de clase de pdf-parse v2 puede cambiar                  |

---

## 8. Roadmap a Producción

### Fase 0: Fundamentos (1-2 días)

> Sin esto, nada más importa.

- [ ] **Crear proyecto Supabase de producción**
  - Habilitar extensiones: `uuid-ossp`, `pgcrypto`, `vector`
  - Crear buckets: `patient-files`, `medical-files`, `backups`
  - Obtener `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

- [ ] **Generar migraciones Prisma**
  - `npx prisma migrate dev --name init` para crear la primera migración
  - Commitear carpeta `prisma/migrations/` al repo
  - `npx prisma migrate deploy` contra la DB de producción

- [ ] **Configurar Clerk producción**
  - Crear app en Clerk con dominio de producción
  - Configurar webhook: `https://api.doci.tudominio.com/api/auth/webhook`
  - Obtener `CLERK_SECRET_KEY` y `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` de prod

- [ ] **Configurar OpenAI**
  - API key con billing activo
  - Configurar límites de gasto mensual

### Fase 1: Desplegar API (2-3 días)

> El frontend ya está en Vercel. Falta el backend.

- [ ] **Desplegar infraestructura Hetzner con Pulumi**
  - Configurar `HCLOUD_TOKEN` en Pulumi ESC o config
  - `pulumi up` para crear VPS, firewall, network, volume
  - Verificar acceso SSH

- [ ] **Desplegar API en el VPS**
  - Clonar repo en `/opt/doci`
  - Configurar `.env.production` con todas las variables
  - `docker compose -f docker/docker-compose.prod.yml up -d`
  - Verificar `https://api.doci.tudominio.com/api/health`

- [ ] **Configurar DNS**
  - `A api.doci.tudominio.com → IP_VPS`
  - Traefik genera certificado Let's Encrypt automáticamente

- [ ] **Conectar frontend al backend real**
  - En Vercel: `NEXT_PUBLIC_API_URL=https://api.doci.tudominio.com`
  - Verificar que las llamadas ya no caen a mock data

- [ ] **Corregir prefijo de API**
  - Verificar que el frontend usa `/api/` en todas las llamadas
  - O quitar `setGlobalPrefix('api')` del main.ts si no se quiere prefijo

### Fase 2: Estabilizar (1 semana)

- [ ] **Consolidar módulos de archivos**
  - Unificar `StorageModule` y `FilesModule` en uno solo
  - Un solo bucket `patient-files` para todo

- [ ] **Agregar tests críticos**
  - Tests E2E para: auth, patients CRUD, consultations, prescriptions
  - Tests unitarios para: AIService, StorageService
  - Configurar Jest en CI pipeline

- [ ] **Verificar firma de webhook Clerk**
  - Usar `svix` para verificar headers de webhook
  - Rechazar requests sin firma válida

- [ ] **Logging estructurado**
  - Reemplazar `console.log` con Winston o Pino
  - Formato JSON para facilitar agregación

- [ ] **Health check completo**
  - Verificar conexión a DB, Supabase Storage, OpenAI
  - Endpoint: `GET /api/health` con detalle por servicio

- [ ] **Eliminar mock data del build de producción**
  - Agregar indicador visual cuando se usan datos mock
  - O deshabilitar fallback en `NODE_ENV=production`

### Fase 3: Seguridad y Compliance (1 semana)

- [ ] **Validación de DTOs en todos los endpoints**
  - class-validator decorators en todos los Body()
  - Rechazar campos no esperados (ya configurado `forbidNonWhitelisted`)

- [ ] **Rate limiting por tenant**
  - Limitar requests por `tenantId`, no solo por IP
  - Prevenir abuso de API de IA (costosa)

- [ ] **Encriptar datos sensibles en DB**
  - Campos como `allergies`, `medicalHistory` deberían estar encriptados
  - Considerar Prisma middleware o column-level encryption

- [ ] **Audit trail completo**
  - Verificar que AuditInterceptor cubre todos los endpoints de escritura
  - Logs inmutables (append-only)

- [ ] **Backup automático verificado**
  - Configurar cron en BackupModule (diario 3 AM)
  - Test de restore mensual

- [ ] **Política de retención de datos**
  - Definir cuánto tiempo se guardan consultas, archivos, logs
  - Implementar soft-delete donde aplique

### Fase 4: Optimización (2 semanas)

- [ ] **Paginación en todas las listas**
  - Cursor-based pagination para pacientes, consultas, archivos
  - Límite por defecto: 20 items

- [ ] **Cache de respuestas frecuentes**
  - Redis o in-memory cache para: vademecum, templates, specialty-templates
  - Cache de patient context para IA

- [ ] **Optimizar costos de OpenAI**
  - Cache de transcripciones idénticas
  - Usar GPT-4o-mini para tareas simples (resúmenes cortos)
  - Batch processing para análisis de documentos

- [ ] **Monitoreo y alertas**
  - UptimeRobot para health checks
  - Sentry alertas por email/Slack
  - Métricas de uso de IA (tokens consumidos)

- [ ] **CI/CD completo**
  - Deploy automático del API al VPS en push a main
  - Ejecutar migraciones automáticamente post-deploy
  - Rollback automático si health check falla

### Fase 5: Escala (cuando haya usuarios reales)

- [ ] **Separar API en microservicios** (si necesario)
  - AI service independiente (el más costoso en recursos)
  - Notification service independiente (async)

- [ ] **CDN para archivos médicos**
  - Supabase CDN o Cloudflare R2
  - Signed URLs con expiración

- [ ] **Multi-región**
  - Réplica de lectura de DB
  - API en múltiples regiones

---

## 9. Decisiones de Arquitectura

| Decisión                        | Razón                                                    | Riesgo                                    |
| ------------------------------- | -------------------------------------------------------- | ----------------------------------------- |
| Monorepo pnpm                   | Compartir tipos, un solo CI, coherencia                  | Build lento si crece mucho                |
| Supabase como DB + Storage      | Managed PostgreSQL, Storage API, free tier generoso      | Vendor lock-in, latencia si región lejana |
| Clerk para auth                 | Multi-tenant, webhooks, UI pre-construida                | Costo escala con usuarios                 |
| OpenAI para todo IA             | GPT-4o es el mejor modelo generalista                    | Costo variable, dependencia de un vendor  |
| Hetzner para VPS                | Más barato que AWS/GCP para un solo servidor             | Sin auto-scaling, manual ops              |
| Vercel para frontend            | Deploy automático, edge network, preview deploys         | Costo si hay mucho SSR                    |
| Mock data como fallback         | Permite demo sin backend                                 | Oculta errores reales de conectividad     |
| Multi-tenant por tenantId       | Un solo deploy sirve múltiples clínicas                  | Complejidad en queries, riesgo de data leak |
| pgvector para vademecum         | Búsqueda semántica de medicamentos sin servicio externo  | Requiere extensión, más carga en DB       |

---

## 10. Variables de Entorno Requeridas

### Obligatorias para que el sistema funcione:

```bash
DATABASE_URL          # PostgreSQL connection (pooled)
DIRECT_URL            # PostgreSQL connection (direct, for migrations)
SUPABASE_URL          # Supabase project URL
SUPABASE_SERVICE_KEY  # Supabase service role key
CLERK_SECRET_KEY      # Clerk backend secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  # Clerk frontend key
OPENAI_API_KEY        # OpenAI API key
NEXT_PUBLIC_API_URL   # URL del backend (ej: https://api.doci.com)
CORS_ORIGIN           # Orígenes permitidos (ej: https://doci.com)
NODE_ENV              # development | production
```

### Opcionales (features específicos):

```bash
STRIPE_SECRET_KEY          # Suscripciones
STRIPE_WEBHOOK_SECRET      # Webhook de Stripe
TWILIO_ACCOUNT_SID         # WhatsApp
TWILIO_AUTH_TOKEN           # WhatsApp
RESEND_API_KEY             # Email
GOOGLE_CLIENT_ID           # Calendar sync
MICROSOFT_CLIENT_ID        # Outlook sync
SENTRY_DSN                 # Error tracking (backend)
NEXT_PUBLIC_SENTRY_DSN     # Error tracking (frontend)
HCLOUD_TOKEN               # Pulumi / Hetzner
```

---

## 11. Comandos de Referencia

```bash
# Desarrollo
npx pnpm install              # Instalar dependencias
npx pnpm dev                  # Iniciar todo (turbo)
npx pnpm db:generate          # Generar Prisma client
npx pnpm db:push              # Push schema a DB (dev only)
npx pnpm lint                 # ESLint
npx pnpm typecheck            # TypeScript check
npx pnpm format:check         # Prettier check

# Base de datos
cd packages/database
npx prisma migrate dev        # Crear migración (dev)
npx prisma migrate deploy     # Aplicar migraciones (prod)
npx prisma studio             # GUI de datos

# Docker (producción)
docker compose -f docker/docker-compose.prod.yml up -d --build
docker compose -f docker/docker-compose.prod.yml logs -f
docker compose -f docker/docker-compose.prod.yml exec api npx prisma migrate deploy

# Infraestructura
cd infrastructure
pulumi stack select dev
pulumi up                     # Crear/actualizar recursos
pulumi destroy                # Eliminar recursos
```
