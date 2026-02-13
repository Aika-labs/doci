# Guía de Despliegue - Doci EHR

## Desarrollo Local

### Requisitos Previos

```bash
# Node.js 20+
node --version  # v20.x.x

# pnpm 9+
npm install -g pnpm
pnpm --version  # 9.x.x

# Docker (opcional, para PostgreSQL local)
docker --version
```

### 1. Clonar y Configurar

```bash
# Clonar repositorio
git clone https://github.com/Aika-labs/doci.git
cd doci

# Instalar dependencias
pnpm install

# Copiar variables de entorno
cp .env.example .env
```

### 2. Configurar Variables de Entorno

Editar `.env` con tus credenciales:

```bash
# MÍNIMO REQUERIDO PARA DESARROLLO LOCAL

# Base de datos (opción A: Supabase)
DATABASE_URL="postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# Base de datos (opción B: Docker local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/doci"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/doci"

# Supabase (para storage)
SUPABASE_URL="https://[PROJECT].supabase.co"
SUPABASE_SERVICE_KEY="eyJ..."

# Clerk (autenticación)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# OpenAI (IA)
OPENAI_API_KEY="sk-..."

# App
NODE_ENV="development"
APP_URL="http://localhost:3000"
API_URL="http://localhost:3001"
CORS_ORIGIN="http://localhost:3000"
```

### 3. Base de Datos

#### Opción A: Usar Supabase (Recomendado)

1. Crear proyecto en [supabase.com](https://supabase.com)
2. Copiar credenciales a `.env`
3. Habilitar extensión pgvector:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

#### Opción B: PostgreSQL Local con Docker

```bash
# Iniciar PostgreSQL
docker run -d \
  --name doci-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=doci \
  -p 5432:5432 \
  pgvector/pgvector:pg16

# Verificar conexión
docker exec -it doci-postgres psql -U postgres -d doci -c "SELECT 1"
```

### 4. Migraciones

```bash
# Generar cliente Prisma
pnpm --filter @doci/database prisma generate

# Ejecutar migraciones
pnpm --filter @doci/database prisma migrate dev

# (Opcional) Abrir Prisma Studio
pnpm --filter @doci/database prisma studio
```

### 5. Iniciar Servicios

```bash
# Todos los servicios (recomendado)
pnpm dev

# O individualmente:
# Terminal 1 - API
pnpm --filter @doci/api dev

# Terminal 2 - Web
pnpm --filter @doci/web dev
```

### 6. Verificar

- **Frontend**: http://localhost:3000
- **API**: http://localhost:3001
- **API Docs**: http://localhost:3001/api (Swagger)
- **Prisma Studio**: http://localhost:5555

---

## Despliegue en VPS (Producción)

### Arquitectura Recomendada

```
┌─────────────────────────────────────────────────────────┐
│                      VPS (Hetzner)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Traefik   │  │   NestJS    │  │   Next.js   │     │
│  │   (Proxy)   │──│    API      │  │    Web      │     │
│  │   :80/:443  │  │   :3001     │  │   :3000     │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
│         │                │                │             │
│         └────────────────┴────────────────┘             │
│                          │                              │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Docker Network                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
              ┌─────────────────────────┐
              │   Supabase (Externo)    │
              │  - PostgreSQL           │
              │  - Storage              │
              │  - Realtime             │
              └─────────────────────────┘
```

### 1. Preparar VPS

```bash
# Conectar al VPS
ssh root@tu-vps-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh

# Instalar Docker Compose
apt install docker-compose-plugin -y

# Crear usuario para la app
useradd -m -s /bin/bash doci
usermod -aG docker doci

# Crear directorio
mkdir -p /opt/doci
chown doci:doci /opt/doci
```

### 2. Configurar DNS

Apuntar tu dominio al VPS:
```
A     @       -> IP_DEL_VPS
A     api     -> IP_DEL_VPS
CNAME www     -> @
```

### 3. Clonar y Configurar

```bash
su - doci
cd /opt/doci

# Clonar repo
git clone https://github.com/Aika-labs/doci.git .

# Crear archivo de producción
cp .env.example .env.production
nano .env.production
```

### 4. Variables de Producción

```bash
# .env.production

# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
SUPABASE_URL="https://..."
SUPABASE_SERVICE_KEY="eyJ..."

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_live_..."
CLERK_SECRET_KEY="sk_live_..."

# OpenAI
OPENAI_API_KEY="sk-..."

# Stripe
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# App
NODE_ENV="production"
APP_URL="https://doci.tudominio.com"
API_URL="https://api.doci.tudominio.com"
CORS_ORIGIN="https://doci.tudominio.com"
```

### 5. Docker Compose Producción

```yaml
# docker/docker-compose.prod.yml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    command:
      - "--api.dashboard=true"
      - "--providers.docker=true"
      - "--providers.docker.exposedbydefault=false"
      - "--entrypoints.web.address=:80"
      - "--entrypoints.websecure.address=:443"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge=true"
      - "--certificatesresolvers.letsencrypt.acme.httpchallenge.entrypoint=web"
      - "--certificatesresolvers.letsencrypt.acme.email=admin@tudominio.com"
      - "--certificatesresolvers.letsencrypt.acme.storage=/letsencrypt/acme.json"
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - traefik-certificates:/letsencrypt
    networks:
      - doci-network
    restart: unless-stopped

  api:
    build:
      context: ..
      dockerfile: docker/Dockerfile.api
    env_file:
      - ../.env.production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.api.rule=Host(`api.doci.tudominio.com`)"
      - "traefik.http.routers.api.entrypoints=websecure"
      - "traefik.http.routers.api.tls.certresolver=letsencrypt"
      - "traefik.http.services.api.loadbalancer.server.port=3001"
    networks:
      - doci-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build:
      context: ..
      dockerfile: docker/Dockerfile.web
    env_file:
      - ../.env.production
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.web.rule=Host(`doci.tudominio.com`)"
      - "traefik.http.routers.web.entrypoints=websecure"
      - "traefik.http.routers.web.tls.certresolver=letsencrypt"
      - "traefik.http.services.web.loadbalancer.server.port=3000"
    networks:
      - doci-network
    restart: unless-stopped

networks:
  doci-network:
    driver: bridge

volumes:
  traefik-certificates:
```

### 6. Desplegar

```bash
cd /opt/doci

# Build y deploy
docker compose -f docker/docker-compose.prod.yml up -d --build

# Ver logs
docker compose -f docker/docker-compose.prod.yml logs -f

# Verificar estado
docker compose -f docker/docker-compose.prod.yml ps
```

### 7. Comandos Útiles

```bash
# Reiniciar servicios
docker compose -f docker/docker-compose.prod.yml restart

# Actualizar código
git pull origin main
docker compose -f docker/docker-compose.prod.yml up -d --build

# Ver logs de un servicio
docker compose -f docker/docker-compose.prod.yml logs -f api

# Ejecutar migraciones en producción
docker compose -f docker/docker-compose.prod.yml exec api npx prisma migrate deploy

# Backup manual
docker compose -f docker/docker-compose.prod.yml exec api npm run backup

# Shell en contenedor
docker compose -f docker/docker-compose.prod.yml exec api sh
```

---

## Monitoreo y Mantenimiento

### Health Checks

```bash
# API health
curl https://api.doci.tudominio.com/health

# Web health
curl https://doci.tudominio.com
```

### Logs

```bash
# Todos los logs
docker compose -f docker/docker-compose.prod.yml logs -f

# Solo errores
docker compose -f docker/docker-compose.prod.yml logs -f 2>&1 | grep -i error

# Logs de las últimas 100 líneas
docker compose -f docker/docker-compose.prod.yml logs --tail=100
```

### Backups

Los backups automáticos se ejecutan diariamente a las 3 AM. Para backup manual:

```bash
# Desde el contenedor
docker compose -f docker/docker-compose.prod.yml exec api npm run backup:manual

# Listar backups
docker compose -f docker/docker-compose.prod.yml exec api npm run backup:list
```

### Actualizaciones

```bash
# 1. Pull cambios
git pull origin main

# 2. Rebuild y deploy (zero-downtime)
docker compose -f docker/docker-compose.prod.yml up -d --build --no-deps api
docker compose -f docker/docker-compose.prod.yml up -d --build --no-deps web

# 3. Ejecutar migraciones si hay
docker compose -f docker/docker-compose.prod.yml exec api npx prisma migrate deploy

# 4. Verificar
docker compose -f docker/docker-compose.prod.yml ps
```
