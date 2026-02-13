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

### ⚠️ Pendiente (Backend)

| Item | Prioridad | Esfuerzo | Descripción |
|------|-----------|----------|-------------|
| Rate Limiting | Alta | 2h | Throttler para prevenir abuso |
| Input Validation | Alta | 4h | DTOs con class-validator en todos los endpoints |
| Error Handling | Alta | 3h | Exception filters globales |
| Logging Estructurado | Media | 2h | Winston/Pino con formato JSON |
| Health Checks | Media | 1h | Endpoint /health con checks de DB |
| API Versioning | Media | 2h | Prefijo /v1/ en rutas |
| Compression | Baja | 30m | gzip para responses |
| CORS Hardening | Alta | 1h | Configuración estricta |
| Helmet Security | Alta | 30m | Headers de seguridad |

### ⚠️ Pendiente (Frontend)

| Item | Prioridad | Esfuerzo | Descripción |
|------|-----------|----------|-------------|
| Dashboard Principal | Alta | 8h | Métricas, gráficos, resumen |
| UI Pacientes | Alta | 6h | Lista, detalle, formularios |
| UI Consultas | Alta | 8h | Editor SOAP, transcripción |
| UI Citas | Alta | 6h | Calendario, agenda |
| UI Facturación | Media | 6h | Facturas, pagos |
| UI Configuración | Media | 4h | Perfil, clínica, integraciones |
| Dark Mode | Baja | 2h | Toggle tema |
| PWA Offline | Baja | 4h | Service worker, cache |
| Responsive | Alta | 4h | Mobile-first |
| Loading States | Media | 2h | Skeletons, spinners |
| Error Boundaries | Alta | 2h | Manejo de errores React |

### ⚠️ Pendiente (Infraestructura)

| Item | Prioridad | Esfuerzo | Descripción |
|------|-----------|----------|-------------|
| CI/CD Pipeline | Alta | 4h | GitHub Actions |
| Monitoring | Alta | 2h | Uptime, alertas |
| Log Aggregation | Media | 2h | Centralización de logs |
| SSL/TLS | Alta | 1h | Let's Encrypt via Traefik |
| Firewall | Alta | 1h | UFW rules |
| Backup Verification | Media | 2h | Test de restore |

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
| **Sentry** | Error tracking | Free tier | ✅ Muy recomendado |
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
#    - https://api.doci.tudominio.com/health (HTTP)
# 3. Configurar alertas por email/Telegram
```

### 6. Sentry

```bash
# 1. Crear cuenta en sentry.io
# 2. Crear proyectos:
#    - doci-api (Node.js)
#    - doci-web (Next.js)
# 3. Instalar SDKs:
pnpm --filter @doci/api add @sentry/node
pnpm --filter @doci/web add @sentry/nextjs
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

### Fase 1: MVP (2-3 semanas)
- [ ] Rate limiting y seguridad básica
- [ ] UI Dashboard principal
- [ ] UI Pacientes (CRUD)
- [ ] UI Consultas básico
- [ ] CI/CD básico
- [ ] Despliegue en VPS

### Fase 2: Core Features (2-3 semanas)
- [ ] UI Citas con calendario
- [ ] UI Transcripción de voz
- [ ] UI Recetas digitales
- [ ] Notificaciones WhatsApp
- [ ] Monitoreo (UptimeRobot + Sentry)

### Fase 3: Monetización (2 semanas)
- [ ] UI Facturación
- [ ] Integración Stripe completa
- [ ] UI Planes y suscripciones
- [ ] Landing page

### Fase 4: Polish (1-2 semanas)
- [ ] Dark mode
- [ ] PWA offline
- [ ] Optimización performance
- [ ] Documentación usuario
