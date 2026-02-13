#!/bin/bash

# ===========================================
# Doci EHR - Script de Despliegue Producción
# ===========================================

set -e

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════╗"
echo "║        DOCI EHR - Deploy Production       ║"
echo "╚═══════════════════════════════════════════╝"
echo -e "${NC}"

# Verificar que estamos en el directorio correcto
if [ ! -f "docker/docker-compose.prod.yml" ]; then
    echo -e "${RED}❌ Ejecutar desde el directorio raíz del proyecto${NC}"
    exit 1
fi

# Verificar .env.production
if [ ! -f ".env.production" ]; then
    echo -e "${RED}❌ Archivo .env.production no encontrado${NC}"
    echo "   Crear: cp .env.example .env.production"
    exit 1
fi

# Verificar variable DOMAIN
if ! grep -q "^DOMAIN=" .env.production 2>/dev/null; then
    echo -e "${RED}❌ Variable DOMAIN no configurada en .env.production${NC}"
    exit 1
fi

DOMAIN=$(grep "^DOMAIN=" .env.production | cut -d'=' -f2 | tr -d '"')
echo -e "${YELLOW}Dominio: ${DOMAIN}${NC}"

# Verificar Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker $(docker --version | cut -d' ' -f3 | tr -d ',')${NC}"

# Verificar Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}❌ Docker Compose no está instalado${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose $(docker compose version --short)${NC}"

echo ""

# Opciones de despliegue
echo "Opciones de despliegue:"
echo "  1) Build y deploy completo"
echo "  2) Solo rebuild API"
echo "  3) Solo rebuild Web"
echo "  4) Restart servicios"
echo "  5) Ver logs"
echo "  6) Ejecutar migraciones"
echo "  7) Detener servicios"
echo ""
read -p "Selecciona una opción (1-7): " -n 1 -r
echo ""

case $REPLY in
    1)
        echo -e "${YELLOW}Ejecutando build y deploy completo...${NC}"
        
        # Pull últimos cambios
        echo -e "${YELLOW}Pulling últimos cambios...${NC}"
        git pull origin main || true
        
        # Build y deploy
        echo -e "${YELLOW}Building containers...${NC}"
        docker compose -f docker/docker-compose.prod.yml build
        
        echo -e "${YELLOW}Starting services...${NC}"
        docker compose -f docker/docker-compose.prod.yml up -d
        
        echo -e "${GREEN}✓ Deploy completado${NC}"
        ;;
    2)
        echo -e "${YELLOW}Rebuilding API...${NC}"
        docker compose -f docker/docker-compose.prod.yml up -d --build --no-deps api
        echo -e "${GREEN}✓ API actualizada${NC}"
        ;;
    3)
        echo -e "${YELLOW}Rebuilding Web...${NC}"
        docker compose -f docker/docker-compose.prod.yml up -d --build --no-deps web
        echo -e "${GREEN}✓ Web actualizada${NC}"
        ;;
    4)
        echo -e "${YELLOW}Restarting services...${NC}"
        docker compose -f docker/docker-compose.prod.yml restart
        echo -e "${GREEN}✓ Servicios reiniciados${NC}"
        ;;
    5)
        echo -e "${YELLOW}Mostrando logs (Ctrl+C para salir)...${NC}"
        docker compose -f docker/docker-compose.prod.yml logs -f
        ;;
    6)
        echo -e "${YELLOW}Ejecutando migraciones...${NC}"
        docker compose -f docker/docker-compose.prod.yml exec api npx prisma migrate deploy
        echo -e "${GREEN}✓ Migraciones ejecutadas${NC}"
        ;;
    7)
        echo -e "${YELLOW}Deteniendo servicios...${NC}"
        docker compose -f docker/docker-compose.prod.yml down
        echo -e "${GREEN}✓ Servicios detenidos${NC}"
        ;;
    *)
        echo -e "${RED}Opción no válida${NC}"
        exit 1
        ;;
esac

echo ""

# Mostrar estado
echo -e "${YELLOW}Estado de los servicios:${NC}"
docker compose -f docker/docker-compose.prod.yml ps

echo ""
echo -e "${GREEN}URLs:${NC}"
echo -e "  Web:     ${BLUE}https://${DOMAIN}${NC}"
echo -e "  API:     ${BLUE}https://api.${DOMAIN}${NC}"
echo -e "  Traefik: ${BLUE}https://traefik.${DOMAIN}${NC}"
echo ""
