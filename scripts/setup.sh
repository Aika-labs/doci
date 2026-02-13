#!/bin/bash

# ===========================================
# Doci EHR - Script de Configuración Inicial
# ===========================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║           DOCI EHR - Setup                ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar requisitos
echo -e "${YELLOW}Verificando requisitos...${NC}"

# Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js no está instalado${NC}"
    echo "   Instalar: https://nodejs.org/"
    exit 1
fi
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}❌ Node.js debe ser v20 o superior (actual: $(node -v))${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${YELLOW}⚠ pnpm no está instalado. Instalando...${NC}"
    npm install -g pnpm
fi
echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"

# Git
if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Git $(git --version | cut -d' ' -f3)${NC}"

echo ""

# Instalar dependencias
echo -e "${YELLOW}Instalando dependencias...${NC}"
pnpm install
echo -e "${GREEN}✓ Dependencias instaladas${NC}"

echo ""

# Configurar .env
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creando archivo .env...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ Archivo .env creado${NC}"
    echo -e "${YELLOW}⚠ IMPORTANTE: Edita .env con tus credenciales antes de continuar${NC}"
else
    echo -e "${GREEN}✓ Archivo .env ya existe${NC}"
fi

echo ""

# Verificar variables críticas
echo -e "${YELLOW}Verificando variables de entorno...${NC}"

check_env() {
    if grep -q "^$1=.*\[" .env 2>/dev/null || grep -q "^$1=\"\"" .env 2>/dev/null; then
        echo -e "${RED}❌ $1 no configurado${NC}"
        return 1
    elif grep -q "^$1=" .env 2>/dev/null; then
        echo -e "${GREEN}✓ $1${NC}"
        return 0
    else
        echo -e "${RED}❌ $1 no encontrado${NC}"
        return 1
    fi
}

MISSING_VARS=0
check_env "DATABASE_URL" || MISSING_VARS=1
check_env "SUPABASE_URL" || MISSING_VARS=1
check_env "CLERK_SECRET_KEY" || MISSING_VARS=1
check_env "OPENAI_API_KEY" || MISSING_VARS=1

if [ $MISSING_VARS -eq 1 ]; then
    echo ""
    echo -e "${YELLOW}⚠ Algunas variables no están configuradas.${NC}"
    echo -e "${YELLOW}  Edita .env y vuelve a ejecutar este script.${NC}"
    echo ""
    read -p "¿Continuar de todos modos? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""

# Generar cliente Prisma
echo -e "${YELLOW}Generando cliente Prisma...${NC}"
pnpm --filter @doci/database prisma generate
echo -e "${GREEN}✓ Cliente Prisma generado${NC}"

echo ""

# Preguntar si ejecutar migraciones
read -p "¿Ejecutar migraciones de base de datos? (y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${YELLOW}Ejecutando migraciones...${NC}"
    pnpm --filter @doci/database prisma migrate dev
    echo -e "${GREEN}✓ Migraciones ejecutadas${NC}"
fi

echo ""

# Build
echo -e "${YELLOW}Compilando paquetes...${NC}"
pnpm build
echo -e "${GREEN}✓ Build completado${NC}"

echo ""
echo -e "${GREEN}"
echo "╔═══════════════════════════════════════════╗"
echo "║         ✓ Setup completado!               ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo "Comandos disponibles:"
echo ""
echo -e "  ${BLUE}pnpm dev${NC}              - Iniciar en modo desarrollo"
echo -e "  ${BLUE}pnpm build${NC}            - Build de producción"
echo -e "  ${BLUE}pnpm lint${NC}             - Ejecutar linter"
echo -e "  ${BLUE}pnpm typecheck${NC}        - Verificar tipos"
echo ""
echo "Para iniciar el desarrollo:"
echo ""
echo -e "  ${GREEN}pnpm dev${NC}"
echo ""
echo "URLs:"
echo -e "  Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "  API:      ${BLUE}http://localhost:3001${NC}"
echo -e "  API Docs: ${BLUE}http://localhost:3001/api${NC}"
echo ""
