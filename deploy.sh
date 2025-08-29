#!/bin/bash
set -euo pipefail

DOMAIN=${DOMAIN:-drivincook.com}
WWW_DOMAIN=${WWW_DOMAIN:-www.${DOMAIN}}
EMAIL=${EMAIL:-contact@drivincook.com}

echo "=== DRIV'N COOK - Deploy with SSL (${DOMAIN}) ==="

cd "$(dirname "$0")"

# Configuration automatique de l'environnement
echo "Configuration de l'environnement..."
./scripts/setup-env.sh

# Vérifier que le fichier .env existe et n'est pas vide
if [ ! -f .env ] || [ ! -s .env ]; then
    echo "Erreur : Le fichier .env est manquant ou vide"
    echo "   Exécutez : ./scripts/setup-env.sh"
    echo "   Puis éditez le fichier .env avec vos vraies valeurs"
    exit 1
fi

echo "Fichier .env configuré"

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker not found"
  exit 1
fi

echo "Checking disk space before"
df -h / | grep -E "(Avail|Available|Filesystem)" | cat

echo "Stopping and cleaning previous stack"
docker compose down --remove-orphans || true
docker container prune -f || true
docker image prune -af || true
docker builder prune -f || true
if [ "${CLEAN_VOLUMES:-false}" = "true" ]; then docker volume prune -f || true; fi
rm -f certbot/.well-known/acme-challenge/test || true
rm -f nginx.conf.bak || true

mkdir -p certbot ssl nginx

echo "Placing webroot test file (pre-create before nginx starts)..."
mkdir -p certbot/.well-known/acme-challenge
echo "ok" > certbot/.well-known/acme-challenge/test

# Backup original nginx.conf and use HTTP-only version for initial challenge
echo "Setting up nginx for HTTP-only (ACME challenge phase)..."
cp nginx.conf nginx-ssl.conf.bak
cp nginx-http-only.conf nginx.conf

# Update domain placeholders in both configurations
sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx.conf
sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx-ssl.conf.bak
rm -f nginx.conf.tmp nginx-ssl.conf.bak.tmp

echo "Building images..."
docker compose build web

echo "Starting web and nginx (HTTP only for challenge)..."
docker compose up -d web nginx

if [ "${WAIT_FOR_NGINX:-false}" = "true" ]; then
  echo "Waiting for nginx port 80 to be ready..."
  READY=false
  for i in {1..40}; do
    if curl -fsS -H "Host: ${DOMAIN}" http://127.0.0.1/.well-known/acme-challenge/test >/dev/null 2>&1; then
      READY=true
      break
    fi
    sleep 2
  done
  if [ "$READY" != "true" ]; then
    echo "Nginx not ready after timeout. Showing status and logs..."
    docker compose ps | cat
    docker compose logs --no-color nginx | tail -n 200
    exit 1
  fi
else
  echo "Skipping wait for nginx readiness (set WAIT_FOR_NGINX=true to enable)."
fi

echo "Requesting certificates via webroot for ${DOMAIN}, ${WWW_DOMAIN}..."
docker compose run --rm certbot certonly --webroot -w /var/www/certbot -d ${DOMAIN} -d ${WWW_DOMAIN} --email ${EMAIL} --agree-tos --no-eff-email --non-interactive

echo "Switching nginx to SSL configuration..."
cp nginx-ssl.conf.bak nginx.conf

echo "Reloading nginx with SSL..."
docker compose restart nginx

echo "Done. Visit: https://${DOMAIN}"

echo "Post-deploy cleanup"
rm -f certbot/.well-known/acme-challenge/test || true
rm -f nginx-ssl.conf.bak || true
docker image prune -f || true
docker builder prune -f || true
echo "Docker system usage"
docker system df | cat
echo "Disk space after"
df -h / | grep -E "(Used|Avail|Available|Filesystem)" | cat