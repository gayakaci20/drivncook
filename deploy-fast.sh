#!/bin/bash
set -euo pipefail

DOMAIN=${DOMAIN:-drivincook.pro}
WWW_DOMAIN=${WWW_DOMAIN:-www.${DOMAIN}}
EMAIL=${EMAIL:-contact@drivincook.com}

echo "🚀 FAST DEPLOY - DRIV'N COOK (${DOMAIN})"
echo "================================================"

cd "$(dirname "$0")"

# Configuration rapide de l'environnement
echo "⚙️  Configuration rapide..."
if [ ! -f .env ]; then
    ./scripts/setup-env.sh >/dev/null 2>&1 || echo "Warning: setup-env failed"
fi

# Nettoyage rapide
echo "🧹 Nettoyage rapide..."
docker compose down --remove-orphans >/dev/null 2>&1 || true
docker container prune -f >/dev/null 2>&1 || true

# Préparation des répertoires
mkdir -p certbot/.well-known/acme-challenge ssl nginx data uploads
echo "test-$(date +%s)" > certbot/.well-known/acme-challenge/test

# Configuration nginx HTTP-only
echo "🔧 Configuration nginx..."
cp nginx.conf nginx-ssl.conf.bak 2>/dev/null || true
cp nginx-http-only.conf nginx.conf

sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx.conf
rm -f nginx.conf.tmp

# Fix Docker connectivity issues
echo "🐳 Vérification Docker..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon not running"
    exit 1
fi

# Test Docker registry connectivity
echo "🌐 Test connectivité Docker Hub..."
if ! docker pull hello-world >/dev/null 2>&1; then
    echo "⚠️  Docker Hub inaccessible, tentative de solutions..."
    
    # Solution 1: Restart Docker daemon
    echo "  → Redémarrage Docker..."
    sudo systemctl restart docker 2>/dev/null || sudo service docker restart 2>/dev/null || true
    sleep 5
    
    # Solution 2: DNS fix
    echo "  → Configuration DNS Docker..."
    sudo mkdir -p /etc/docker
    cat <<EOF | sudo tee /etc/docker/daemon.json >/dev/null
{
    "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1"],
    "registry-mirrors": [
        "https://mirror.gcr.io",
        "https://daocloud.io",
        "https://c.163.com"
    ]
}
EOF
    sudo systemctl restart docker 2>/dev/null || sudo service docker restart 2>/dev/null || true
    sleep 10
    
    # Test à nouveau
    if ! docker pull hello-world >/dev/null 2>&1; then
        echo "❌ Impossible de connecter à Docker Hub"
        echo "Solutions manuelles:"
        echo "1. Vérifiez votre connexion internet"
        echo "2. Vérifiez les paramètres proxy/firewall"
        echo "3. Redémarrez Docker: sudo systemctl restart docker"
        exit 1
    fi
    
    echo "✅ Connectivité Docker rétablie"
fi

# Build optimisé avec cache
echo "🔨 Build application (optimisé)..."

# Vérifier si l'image existe déjà
if docker images | grep -q "drivncook-web"; then
    echo "  → Image existante trouvée, build incrémental..."
    docker compose build --parallel web || {
        echo "  → Build incrémental échoué, build complet..."
        docker compose build --no-cache web
    }
else
    echo "  → Premier build..."
    docker compose build web
fi

# Démarrage des services
echo "🚀 Démarrage des services..."
docker compose up -d web nginx database-init

# Attente nginx (optimisée)
echo "⏳ Attente nginx..."
for i in {1..20}; do
    if curl -fsS http://127.0.0.1/.well-known/acme-challenge/test >/dev/null 2>&1; then
        echo "✅ Nginx opérationnel (${i}s)"
        break
    fi
    [ $i -eq 20 ] && { echo "❌ Nginx timeout"; docker compose logs nginx; exit 1; }
    sleep 1
done

# Test rapide accessibilité externe
echo "🌍 Test accessibilité externe..."
EXTERNAL_OK=false
for domain in ${DOMAIN} ${WWW_DOMAIN}; do
    if curl -f --connect-timeout 5 "http://${domain}/.well-known/acme-challenge/test" >/dev/null 2>&1; then
        echo "✅ ${domain} accessible"
        EXTERNAL_OK=true
    else
        echo "⚠️  ${domain} non accessible (DNS/firewall?)"
    fi
done

# SSL ou HTTP-only selon accessibilité
if [ "$EXTERNAL_OK" = "true" ]; then
    echo "🔐 Génération certificats SSL..."
    
    if docker compose run --rm certbot certonly \
        --webroot -w /var/www/certbot \
        -d ${DOMAIN} -d ${WWW_DOMAIN} \
        --email ${EMAIL} --agree-tos --no-eff-email --non-interactive \
        --quiet; then
        
        echo "✅ Certificats SSL générés!"
        
        # Switch vers SSL
        cp nginx-ssl.conf.bak nginx.conf
        docker compose restart nginx
        
        # Test HTTPS
        sleep 3
        if curl -f --connect-timeout 5 "https://${DOMAIN}" >/dev/null 2>&1; then
            echo "🎉 DÉPLOIEMENT SSL RÉUSSI!"
            echo "🌐 Site disponible: https://${DOMAIN}"
        else
            echo "⚠️  SSL configuré mais test HTTPS échoué"
            echo "🌐 Site disponible: https://${DOMAIN}"
        fi
    else
        echo "❌ Échec génération SSL - Déploiement HTTP"
        echo "🌐 Site disponible: http://${DOMAIN}"
        echo ""
        echo "Pour déboguer SSL plus tard:"
        echo "  ./scripts/debug-ssl.sh"
    fi
else
    echo "⚠️  Domaine non accessible - Déploiement local uniquement"
    echo "🌐 Site local: http://localhost:3000"
    echo ""
    echo "Pour configurer DNS/firewall:"
    echo "  ./scripts/debug-ssl.sh"
    echo "  ./scripts/check-firewall.sh"
fi

# Nettoyage final
echo "🧹 Nettoyage final..."
rm -f certbot/.well-known/acme-challenge/test nginx-ssl.conf.bak >/dev/null 2>&1 || true
docker image prune -f >/dev/null 2>&1 || true

# Status final
echo ""
echo "📊 STATUS FINAL:"
echo "================================================"
docker compose ps
echo ""
echo "💾 Espace disque:"
df -h / | grep -E "(Used|Available)" | head -1

echo ""
echo "🎯 DÉPLOIEMENT TERMINÉ!"
echo "⏱️  Durée: $((SECONDS/60))m $((SECONDS%60))s"

if [ "$EXTERNAL_OK" = "true" ]; then
    if [ -f "ssl/live/${DOMAIN}/fullchain.pem" ]; then
        echo "🔐 HTTPS: https://${DOMAIN}"
    else
        echo "🌐 HTTP: http://${DOMAIN}"
    fi
else
    echo "💻 LOCAL: http://localhost:3000"
fi

echo ""
echo "📝 Logs en temps réel:"
echo "  docker compose logs -f"
echo "📊 Monitoring:"
echo "  docker compose ps"
