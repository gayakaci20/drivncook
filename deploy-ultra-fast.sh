#!/bin/bash
set -euo pipefail

DOMAIN=${DOMAIN:-drivincook.pro}
WWW_DOMAIN=${WWW_DOMAIN:-www.${DOMAIN}}
EMAIL=${EMAIL:-contact@drivincook.com}

echo "⚡ ULTRA FAST DEPLOY - DRIV'N COOK"
echo "=================================="
START_TIME=$SECONDS

cd "$(dirname "$0")"

# 1. Setup ultra-rapide
echo "⚙️  Setup (3s)..."
[ ! -f .env ] && ./scripts/setup-env.sh >/dev/null 2>&1 || true

# 2. Cleanup parallèle
echo "🧹 Cleanup..."
{
    docker compose down --remove-orphans 2>/dev/null || true
    docker container prune -f 2>/dev/null || true
} &
CLEANUP_PID=$!

# 3. Préparation répertoires pendant cleanup
mkdir -p {certbot/.well-known/acme-challenge,ssl,nginx,data,uploads}
echo "ok" > certbot/.well-known/acme-challenge/test

# 4. Config nginx pendant cleanup
cp nginx.conf nginx-ssl.conf.bak 2>/dev/null || true
cp nginx-http-only.conf nginx.conf
sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx.conf
rm -f nginx.conf.tmp

# Attendre cleanup
wait $CLEANUP_PID 2>/dev/null || true

# 5. Docker fix rapide si nécessaire
echo "🐳 Docker check..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon pas démarré"
    exit 1
fi

# Test rapide Docker Hub
if ! timeout 10 docker pull hello-world >/dev/null 2>&1; then
    echo "⚠️  Docker Hub lent/inaccessible - Fix rapide..."
    
    # Fix DNS rapide
    echo '{"dns":["8.8.8.8","1.1.1.1"]}' | sudo tee /etc/docker/daemon.json >/dev/null
    sudo systemctl restart docker 2>/dev/null || sudo service docker restart 2>/dev/null || true
    sleep 5
    
    # Si ça marche pas, on continue avec les images locales
    if ! timeout 5 docker pull hello-world >/dev/null 2>&1; then
        echo "⚠️  Mode offline - utilisation images locales uniquement"
        OFFLINE_MODE=true
    else
        OFFLINE_MODE=false
    fi
    docker rmi hello-world 2>/dev/null || true
else
    OFFLINE_MODE=false
    docker rmi hello-world 2>/dev/null || true
fi

# 6. Build optimisé
echo "🔨 Build ultra-rapide..."

if [ "$OFFLINE_MODE" = "true" ]; then
    echo "  → Mode offline: réutilisation images existantes"
    # Vérifier si on a déjà une image locale
    if ! docker images | grep -q "drivncook-web"; then
        echo "❌ Aucune image locale trouvée et Docker Hub inaccessible"
        echo "Solutions:"
        echo "1. Réparez Docker: ./scripts/fix-docker.sh"
        echo "2. Ou utilisez une image alternative dans Dockerfile"
        exit 1
    fi
    # Build avec cache local uniquement
    docker compose build --no-cache web
else
    # Build normal avec pull
    docker compose build web
fi

# 7. Start services en parallèle
echo "🚀 Démarrage services..."
docker compose up -d --no-recreate web database-init &
SERVICES_PID=$!

# Attendre que les services se lancent
wait $SERVICES_PID

# Start nginx
docker compose up -d nginx

# 8. Wait nginx ultra-rapide (max 15s)
echo "⏳ Nginx ready check..."
for i in {1..15}; do
    if curl -fsS http://127.0.0.1/.well-known/acme-challenge/test >/dev/null 2>&1; then
        echo "✅ Nginx ready (${i}s)"
        break
    fi
    [ $i -eq 15 ] && {
        echo "❌ Nginx timeout"
        echo "Logs:"
        docker compose logs nginx | tail -10
        echo "Continuons quand même..."
    }
    sleep 1
done

# 9. Test externe rapide (5s max)
echo "🌍 Test externe rapide..."
EXTERNAL_OK=false

{
    if timeout 5 curl -f "http://${DOMAIN}/.well-known/acme-challenge/test" >/dev/null 2>&1; then
        EXTERNAL_OK=true
        echo "✅ Domaine accessible"
    fi
} &

{
    if timeout 5 curl -f "http://${WWW_DOMAIN}/.well-known/acme-challenge/test" >/dev/null 2>&1; then
        EXTERNAL_OK=true
        echo "✅ WWW accessible"
    fi
} &

wait

# 10. SSL ou skip selon accessibilité
if [ "$EXTERNAL_OK" = "true" ]; then
    echo "🔐 SSL rapide..."
    
    timeout 60 docker compose run --rm certbot certonly \
        --webroot -w /var/www/certbot \
        -d ${DOMAIN} -d ${WWW_DOMAIN} \
        --email ${EMAIL} --agree-tos --no-eff-email --non-interactive \
        >/dev/null 2>&1 && {
        
        echo "✅ SSL OK!"
        cp nginx-ssl.conf.bak nginx.conf
        docker compose restart nginx >/dev/null 2>&1
        
        DEPLOY_URL="https://${DOMAIN}"
        
    } || {
        echo "⚠️  SSL échoué - HTTP mode"
        DEPLOY_URL="http://${DOMAIN}"
    }
else
    echo "⚠️  Domaine non accessible - Mode local"
    DEPLOY_URL="http://localhost:3000"
fi

# 11. Cleanup final parallèle
{
    rm -f certbot/.well-known/acme-challenge/test nginx-ssl.conf.bak 2>/dev/null || true
    docker image prune -f >/dev/null 2>&1 || true
} &

# 12. Status final
DEPLOY_TIME=$((SECONDS - START_TIME))

echo ""
echo "🎉 DÉPLOIEMENT TERMINÉ!"
echo "=================================="
echo "⏱️  Temps total: ${DEPLOY_TIME}s"
echo "🌐 URL: ${DEPLOY_URL}"
echo ""

# Status rapide
echo "📊 Services:"
docker compose ps --format "table {{.Service}}\t{{.Status}}"

echo ""
echo "🎯 Actions rapides:"
echo "  📊 Status:  docker compose ps"
echo "  📝 Logs:    docker compose logs -f"
echo "  🔄 Restart: docker compose restart"
echo "  🛑 Stop:    docker compose down"

if [ "$EXTERNAL_OK" != "true" ]; then
    echo ""
    echo "🔧 Pour activer le domaine externe:"
    echo "  ./scripts/debug-ssl.sh       # Diagnostic complet"
    echo "  ./scripts/check-firewall.sh  # Vérif firewall"
fi

wait # Attendre cleanup final
