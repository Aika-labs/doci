# Checklist para Producción - Doci EHR

## Estado Actual vs Producción

### ✅ Completado (Backend)

| Módulo | Estado | Notas |
|--------|--------|-------|
| Auth (Clerk) | ✅ | Guard global, sync usuarios |
| Patients CRUD | ✅ | Completo con validaciones |
| Consultations | ✅ | SOAP notes, diagnósticos |
| Appointments | ✅ | CRUD, recordatorios |
| Prescriptions | ✅ | PDF, firma digital |
| AI Transcription | ✅ | Whisper + GPT-4 |
| Templates | ✅ | JSONB dinámico |
| Files/Storage | ✅ | Supabase Storage |
| Notifications | ✅ | WhatsApp + Email |
| Vademecum RAG | ✅ | Embeddings, interacciones |
| Audit Trail | ✅ | Logging completo |
| Backup/DR | ✅ | pg_dump automático |
| Billing | ✅ | Facturas, pagos, reportes |
| Calendar Sync | ✅ | Google + Outlook |
| Onboarding | ✅ | 6 pasos |
| Search | ✅ | Multi-entidad |
| Subscriptions | ✅ | Stripe integration |
| Rate Limiting | ✅ | ThrottlerModule (60 req/60s per IP) |
| Error Handling | ✅ | AllExceptionsFilter global con Sentry |
| Health Checks | ✅ | GET /api/health con DB latency check |
| Compression | ✅ | gzip via compression middleware |
| CORS Hardening | ✅ | Multi-origin strict config |
| Helmet Security | ✅ | Security headers via helmet |
| Profile/Tenant API | ✅ | PUT /auth/me, PUT /auth/tenant con DTOs |
| Sentry Integration | ✅ | @sentry/nestjs, error tracking en excepciones |

### ⚠️ Pendiente (Backend)

| Item | Prioridad | Esfuerzo | Descripción |
|------|-----------|----------|-------------|
| Input Validation | Alta | 4h | DTOs con class-validator en todos los endpoints |
| Logging Estructurado | Media | 2h | Winston/Pino con formato JSON |
| API Versioning | Media | 2h | Prefijo /v1/ en rutas |

### ✅ Completado (Frontend)

| Módulo | Estado | Notas |
|--------|--------|-------|
| Dashboard Principal | ✅ | Métricas, stats, acciones rápidas |
| UI Pacientes | ✅ | Lista, detalle, formularios |
| UI Consultas | ✅ | Editor SOAP, transcripción |
| UI Citas | ✅ | Calendario FullCalendar, agenda |
| UI Facturación | ✅ | Facturas, pagos, servicios, modal de cobro |
| UI Configuración | ✅ | Perfil, clínica, notificaciones, seguridad, apariencia |
| UI Reportes | ✅ | Reportes con filtros |
| UI Almacenamiento | ✅ | Gestión de archivos |
| UI Plantillas | ✅ | Plantillas de consulta |
| Dark Mode | ✅ | ThemeProvider con light/dark/system toggle, class-based CSS |
| PWA Offline | ✅ | Serwist SW, manifest, offline fallback, install prompt |
| Loading States | ✅ | Skeleton components (Dashboard, Billing, Patients, Table, Card) |
| Error Boundaries | ✅ | React ErrorBoundary + Sentry global-error page |
| Sentry Integration | ✅ | @sentry/nextjs, client/server/edge configs, instrumentation |

### ⚠️ Pendiente (Frontend)

| Item | Prioridad | Esfuerzo | Descripción |
|------|-----------|----------|-------------|
| Responsive Polish | Alta | 4h | Mobile-first refinements |
| Accessibility | Media | 3h | ARIA labels, keyboard navigation |

### ✅ Completado (Infraestructura)

| Item | Estado | Notas |
|------|--------|-------|
| CI/CD Pipeline | ✅ | GitHub Actions: lint, typecheck, build on PR; deploy workflow |
| Error Tracking | ✅ | Sentry integration (API + Web) |

### ⚠️ Pendiente (Infraestructura)

| Item | Prioridad | Esfuerzo | Descripción |
|------|-----------|----------|-------------|
| Log Aggregation | Media | 2h | Centralización de logs |
| SSL/TLS | Alta | 1h | Let's Encrypt via Traefik |
| Firewall | Alta | 1h | UFW rules |
| Backup Verification | Media | 2h | Test de restore |
| Monitoring | Alta | 2h | UptimeRobot uptime + alertas |

---

## Servicios Externos Requeridos

### Obligatorios

| Servicio | Propósito | Costo Estimado | Alternativa |
|----------|-----------|----------------|-------------|
| **Supabase** | PostgreSQL + Storage | Free tier / $25/mes | Self-hosted PostgreSQL |
| **Clerk** | Autenticación | Free tier / $25/mes | Auth0, NextAuth |
| **OpenAI** | IA (GPT-4, Whisper) | ~$50-200/mes según uso | - |
| **Hetzner VPS** | Hosting | €4-20/mes | DigitalOcean, Vultr |

### Opcionales (según features)

| Servicio | Propósito | Costo Estimado | Cuándo Necesario |
|----------|-----------|----------------|------------------|
| **Stripe** | Pagos/Suscripciones | 2.9% + $0.30/tx | Si cobras a usuarios |
| **Twilio** | WhatsApp | ~$0.005/msg | Si usas notificaciones WhatsApp |
| **Resend** | Email | Free tier / $20/mes | Si envías emails |
| **Google Cloud** | Calendar API | Gratis | Si sincronizas Google Calendar |
| **Microsoft Azure** | Outlook API | Gratis | Si sincronizas Outlook |

### Monitoreo y Operaciones

| Servicio | Propósito | Costo | Recomendación |
|----------|-----------|-------|---------------|
| **UptimeRobot** | Monitoreo uptime | Gratis | ✅ Obligatorio |
| **Sentry** | Error tracking | Free tier | ✅ Integrado |
| **Logtail/Papertrail** | Log aggregation | Free tier | Recomendado |
| **Grafana Cloud** | Métricas | Free tier | Opcional |

---

## Configuración de Servicios

### 1. Supabase

```bash
# 1. Crear proyecto en supabase.com
# 2. Habilitar extensiones necesarias:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

# 3. Crear buckets de storage:
# - patient-files (privado)
# - backups (privado)
# - public-assets (público)

# 4. Configurar políticas RLS según necesidad
```

### 2. Clerk

```bash
# 1. Crear aplicación en clerk.com
# 2. Configurar:
#    - Sign-in methods: Email, Google
#    - Redirect URLs: 
#      - http://localhost:3000 (dev)
#      - https://doci.tudominio.com (prod)
# 3. Crear webhook para sync:
#    - URL: https://api.doci.tudominio.com/auth/webhook
#    - Events: user.created, user.updated, user.deleted
```

### 3. OpenAI

```bash
# 1. Crear cuenta en platform.openai.com
# 2. Generar API key
# 3. Configurar límites de uso (billing)
# 4. Modelos requeridos:
#    - gpt-4-turbo (análisis)
#    - whisper-1 (transcripción)
#    - text-embedding-ada-002 (vademecum)
```

### 4. Stripe (si aplica)

```bash
# 1. Crear cuenta en stripe.com
# 2. Configurar productos/precios:
#    - Básico: $499 MXN/mes
#    - Profesional: $999 MXN/mes
#    - Empresarial: $2,499 MXN/mes
# 3. Configurar webhook:
#    - URL: https://api.doci.tudominio.com/subscriptions/webhook
#    - Events: checkout.session.completed, invoice.paid, etc.
```

### 5. UptimeRobot

```bash
# 1. Crear cuenta gratuita en uptimerobot.com
# 2. Agregar monitores:
#    - https://doci.tudominio.com (HTTP)
#    - https://api.doci.tudominio.com/api/health (HTTP)
# 3. Configurar alertas por email/Telegram
```

### 6. Sentry

```bash
# Already integrated! Configure these environment variables:

# Backend (@doci/api):
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Frontend (@doci/web):
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Build-time (for source map uploads):
SENTRY_ORG=your-org
SENTRY_PROJECT=doci-web
SENTRY_AUTH_TOKEN=your-auth-token
```

---

## Estimación de Costos Mensuales

### Escenario: Startup (1-10 usuarios)

| Servicio | Costo |
|----------|-------|
| Hetzner VPS (CX21) | €6 |
| Supabase (Free) | $0 |
| Clerk (Free) | $0 |
| OpenAI | ~$20 |
| Dominio | ~$1 |
| **Total** | **~$30/mes** |

### Escenario: Crecimiento (10-100 usuarios)

| Servicio | Costo |
|----------|-------|
| Hetzner VPS (CX31) | €15 |
| Supabase (Pro) | $25 |
| Clerk (Pro) | $25 |
| OpenAI | ~$100 |
| Stripe (fees) | Variable |
| Twilio | ~$20 |
| **Total** | **~$200/mes** |

### Escenario: Escala (100+ usuarios)

| Servicio | Costo |
|----------|-------|
| Hetzner VPS (CX41+) | €30+ |
| Supabase (Team) | $599 |
| Clerk (Pro) | $99 |
| OpenAI | ~$500 |
| Stripe (fees) | Variable |
| Twilio | ~$100 |
| Sentry (Team) | $26 |
| **Total** | **~$1,500/mes** |

---

## Roadmap Sugerido para Producción

### Fase 1: MVP ✅ COMPLETADO
- [x] Rate limiting y seguridad básica (Helmet, CORS, ThrottlerModule)
- [x] UI Dashboard principal
- [x] UI Pacientes (CRUD)
- [x] UI Consultas básico
- [x] CI/CD básico (GitHub Actions)
- [ ] Despliegue en VPS

### Fase 2: Core Features ✅ COMPLETADO
- [x] UI Citas con calendario
- [x] UI Transcripción de voz
- [x] UI Recetas digitales
- [x] Notificaciones WhatsApp
- [x] Monitoreo (Sentry integrado, UptimeRobot pendiente)

### Fase 3: Monetización (parcial)
- [x] UI Facturación
- [x] Integración Stripe completa
- [x] UI Planes y suscripciones
- [ ] Landing page

### Fase 4: Polish ✅ COMPLETADO
- [x] Dark mode (ThemeProvider con light/dark/system)
- [x] PWA offline (Serwist service worker)
- [x] Loading skeletons
- [x] Error boundaries + Sentry error tracking
- [ ] Documentación usuario
