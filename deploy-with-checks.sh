#!/bin/bash
set -euo pipefail

DOMAIN=${DOMAIN:-drivincook.pro}
WWW_DOMAIN=${WWW_DOMAIN:-www.${DOMAIN}}
EMAIL=${EMAIL:-contact@drivincook.com}
SKIP_CHECKS=${SKIP_CHECKS:-false}

echo "=== DRIV'N COOK - Enhanced Deploy with SSL (${DOMAIN}) ==="
echo ""

cd "$(dirname "$0")"

# Pre-deployment checks
if [ "${SKIP_CHECKS}" != "true" ]; then
    echo "Running pre-deployment checks..."
    echo ""
    
    # 1. Check environment
    echo "1. Checking environment..."
    ./scripts/setup-env.sh
    
    if [ ! -f .env ] || [ ! -s .env ]; then
        echo "   ✗ .env file is missing or empty"
        echo "   Run: ./scripts/setup-env.sh"
        echo "   Then edit .env with your actual values"
        exit 1
    fi
    echo "   ✓ .env file configured"
    
    # 2. Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        echo "   ✗ Docker not found"
        exit 1
    fi
    echo "   ✓ Docker available"
    
    # 3. DNS Check
    echo "2. Checking DNS resolution..."
    DOMAIN_IP=$(dig +short ${DOMAIN} A | head -n1)
    WWW_IP=$(dig +short ${WWW_DOMAIN} A | head -n1)
    EXTERNAL_IP=$(curl -s -m 10 ifconfig.me 2>/dev/null || echo "unknown")
    
    echo "   External IP: ${EXTERNAL_IP}"
    echo "   ${DOMAIN} resolves to: ${DOMAIN_IP}"
    echo "   ${WWW_DOMAIN} resolves to: ${WWW_IP}"
    
    if [ -z "${DOMAIN_IP}" ]; then
        echo "   ✗ ${DOMAIN} DNS resolution failed"
        echo "   Please configure DNS A record: ${DOMAIN} -> ${EXTERNAL_IP}"
        read -p "Continue anyway? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    elif [ "${DOMAIN_IP}" != "${EXTERNAL_IP}" ] && [ "${EXTERNAL_IP}" != "unknown" ]; then
        echo "   ⚠ DNS mismatch: ${DOMAIN} points to ${DOMAIN_IP}, server IP is ${EXTERNAL_IP}"
        read -p "Continue anyway? (y/N): " -r
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    else
        echo "   ✓ DNS configuration looks correct"
    fi
    
    # 4. Port accessibility check
    echo "3. Checking port accessibility..."
    if [ "${EXTERNAL_IP}" != "unknown" ]; then
        if timeout 10 bash -c "echo >/dev/tcp/${EXTERNAL_IP}/80" 2>/dev/null; then
            echo "   ✓ Port 80 is accessible"
        else
            echo "   ✗ Port 80 is not accessible - check firewall"
            echo "   Common solutions:"
            echo "     Ubuntu/Debian: sudo ufw allow 80 && sudo ufw allow 443"
            echo "     CentOS/RHEL: sudo firewall-cmd --permanent --add-port=80/tcp --add-port=443/tcp && sudo firewall-cmd --reload"
            read -p "Continue anyway? (y/N): " -r
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        fi
    else
        echo "   ⚠ Cannot test port accessibility (external IP unknown)"
    fi
    
    echo ""
    echo "Pre-deployment checks completed."
    echo ""
fi

# Disk space check
echo "Checking disk space..."
df -h / | grep -E "(Avail|Available|Filesystem)" | cat

# Clean up previous deployment
echo ""
echo "Stopping and cleaning previous stack..."
docker compose down --remove-orphans || true
docker container prune -f || true
docker image prune -af || true
docker builder prune -f || true
if [ "${CLEAN_VOLUMES:-false}" = "true" ]; then docker volume prune -f || true; fi

# Clean up config files
rm -f certbot/.well-known/acme-challenge/test || true
rm -f nginx.conf.bak || true

# Prepare directories
mkdir -p certbot ssl nginx
mkdir -p certbot/.well-known/acme-challenge
echo "ok" > certbot/.well-known/acme-challenge/test

# Setup nginx configuration
echo ""
echo "Setting up nginx configuration for HTTP-only (ACME challenge phase)..."
cp nginx.conf nginx-ssl.conf.bak
cp nginx-http-only.conf nginx.conf

# Update domain placeholders
sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx.conf
sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx-ssl.conf.bak
rm -f nginx.conf.tmp nginx-ssl.conf.bak.tmp

# Build and start services
echo ""
echo "Building application image..."
docker compose build web

echo "Starting services (HTTP only for certificate generation)..."
docker compose up -d web nginx

# Wait for nginx to be ready
echo "Waiting for nginx to be ready..."
NGINX_READY=false
for i in {1..30}; do
    if curl -fsS -H "Host: ${DOMAIN}" http://127.0.0.1/.well-known/acme-challenge/test >/dev/null 2>&1; then
        NGINX_READY=true
        echo "✓ Nginx is ready (attempt $i)"
        break
    fi
    echo "  Waiting for nginx... (attempt $i/30)"
    sleep 3
done

if [ "$NGINX_READY" != "true" ]; then
    echo "✗ Nginx not ready after timeout"
    echo ""
    echo "Container status:"
    docker compose ps | cat
    echo ""
    echo "Nginx logs:"
    docker compose logs --no-color nginx | tail -n 50
    echo ""
    echo "Testing ACME challenge..."
    ./scripts/test-acme-challenge.sh || true
    exit 1
fi

# Test ACME challenge accessibility
echo ""
echo "Testing ACME challenge accessibility..."
ACME_ACCESSIBLE=true

for domain in ${DOMAIN} ${WWW_DOMAIN}; do
    echo "Testing ${domain}..."
    if curl -f --connect-timeout 10 "http://${domain}/.well-known/acme-challenge/test" >/dev/null 2>&1; then
        echo "  ✓ ${domain} ACME challenge accessible"
    else
        echo "  ✗ ${domain} ACME challenge NOT accessible"
        ACME_ACCESSIBLE=false
    fi
done

if [ "$ACME_ACCESSIBLE" != "true" ]; then
    echo ""
    echo "⚠ ACME challenge not accessible from external network"
    echo "This will likely cause certificate generation to fail."
    echo ""
    echo "Common issues:"
    echo "1. DNS not propagated yet - wait and try again"
    echo "2. Firewall blocking port 80"
    echo "3. Domain not pointing to this server"
    echo ""
    echo "Run diagnostic script: ./scripts/debug-ssl.sh"
    echo "Or test manually: ./scripts/test-acme-challenge.sh"
    echo ""
    read -p "Continue with certificate generation anyway? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Stopping here. Fix the issues above and try again."
        exit 1
    fi
fi

# Request SSL certificates
echo ""
echo "Requesting SSL certificates from Let's Encrypt..."
echo "Domains: ${DOMAIN}, ${WWW_DOMAIN}"
echo "Email: ${EMAIL}"
echo ""

if ! docker compose run --rm certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d ${DOMAIN} \
    -d ${WWW_DOMAIN} \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    --non-interactive; then
    
    echo ""
    echo "✗ Certificate generation failed!"
    echo ""
    echo "Common solutions:"
    echo "1. Check DNS: dig ${DOMAIN} A"
    echo "2. Check firewall: ensure ports 80 and 443 are open"
    echo "3. Verify domain ownership"
    echo "4. Check rate limits: https://letsencrypt.org/docs/rate-limits/"
    echo ""
    echo "Diagnostic commands:"
    echo "  ./scripts/debug-ssl.sh"
    echo "  ./scripts/test-acme-challenge.sh"
    echo ""
    echo "Let's Encrypt logs:"
    docker compose logs certbot | tail -n 50
    
    echo ""
    read -p "Continue with HTTP-only deployment? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
    
    echo ""
    echo "Continuing with HTTP-only deployment..."
    echo "Your site will be available at: http://${DOMAIN}"
    echo "Fix the SSL issues and run the script again later."
else
    echo ""
    echo "✓ SSL certificates generated successfully!"
    
    # Switch to SSL configuration
    echo "Switching nginx to SSL configuration..."
    cp nginx-ssl.conf.bak nginx.conf
    
    echo "Restarting nginx with SSL..."
    docker compose restart nginx
    
    # Test HTTPS
    echo "Testing HTTPS access..."
    sleep 5
    if curl -f --connect-timeout 10 "https://${DOMAIN}" >/dev/null 2>&1; then
        echo "✓ HTTPS is working!"
        echo ""
        echo "🎉 Deployment successful!"
        echo "Your site is available at: https://${DOMAIN}"
    else
        echo "⚠ HTTPS test failed, but certificates were generated"
        echo "Check nginx logs: docker compose logs nginx"
        echo "Your site should still be available at: https://${DOMAIN}"
    fi
fi

# Cleanup
echo ""
echo "Post-deployment cleanup..."
rm -f certbot/.well-known/acme-challenge/test || true
rm -f nginx-ssl.conf.bak || true
docker image prune -f || true
docker builder prune -f || true

echo ""
echo "Final status:"
docker compose ps | cat
echo ""
echo "Disk usage:"
docker system df | cat
echo ""
df -h / | grep -E "(Used|Avail|Available|Filesystem)" | cat

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
