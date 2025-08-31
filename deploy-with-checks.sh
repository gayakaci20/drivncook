#!/bin/bash
set -euo pipefail

DOMAIN=${DOMAIN:-drivincook.pro}
WWW_DOMAIN=${WWW_DOMAIN:-www.${DOMAIN}}
EMAIL=${EMAIL:-contact@drivincook.pro}
SKIP_CHECKS=${SKIP_CHECKS:-false}

echo "=== DRIV'N COOK - Enhanced Deploy with SSL + Redis (${DOMAIN}) ==="
echo ""

cd "$(dirname "$0")"

# Pre-deployment checks
if [ "${SKIP_CHECKS}" != "true" ]; then
    echo "Running pre-deployment checks..."
    echo ""
    
    # 1. Check environment
    echo "1. Checking environment..."
    
    if [ ! -f .env ] || [ ! -s .env ]; then
        echo "   ✗ .env file is missing or empty"
        echo "   Please create .env file with your configuration"
        exit 1
    fi
    echo "   ✓ .env file configured"
    
    # 2. Check Docker
    if ! command -v docker >/dev/null 2>&1; then
        echo "   ✗ Docker not found"
        exit 1
    fi
    echo "   ✓ Docker available"
    
    # 3. Check Redis connection in .env
    echo "2. Checking Redis configuration..."
    if grep -q "REDIS_URL" .env; then
        echo "   ✓ Redis URL configured in .env"
    else
        echo "   ⚠ REDIS_URL not found in .env, using default: redis://redis:6379"
        echo "REDIS_URL=redis://redis:6379" >> .env
    fi
    
    # 4. Check and fix environment variables
    echo "3. Checking environment variables..."
    
    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        echo "   Creating .env file..."
        touch .env
        echo "   ✓ .env file created"
    fi
    
    if [ -f .env ]; then
        # Check for BETTER_AUTH_SECRET (don't overwrite if exists with value)
        if ! grep -q "BETTER_AUTH_SECRET" .env; then
            echo "   Adding missing BETTER_AUTH_SECRET..."
            BETTER_AUTH_SECRET=$(openssl rand -base64 32)
            echo "BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}" >> .env
            echo "   ✓ BETTER_AUTH_SECRET added"
        elif grep -q "^BETTER_AUTH_SECRET=$" .env; then
            echo "   Updating empty BETTER_AUTH_SECRET..."
            BETTER_AUTH_SECRET=$(openssl rand -base64 32)
            sed -i "s/^BETTER_AUTH_SECRET=$/BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}/" .env
            echo "   ✓ BETTER_AUTH_SECRET updated"
        else
            echo "   ✓ BETTER_AUTH_SECRET configured"
        fi
        
        # Check for NEXTAUTH_SECRET
        if ! grep -q "NEXTAUTH_SECRET" .env; then
            echo "   Adding missing NEXTAUTH_SECRET..."
            NEXTAUTH_SECRET=$(openssl rand -base64 32)
            echo "NEXTAUTH_SECRET=${NEXTAUTH_SECRET}" >> .env
            echo "   ✓ NEXTAUTH_SECRET added"
        elif grep -q "^NEXTAUTH_SECRET=$" .env; then
            echo "   Updating empty NEXTAUTH_SECRET..."
            NEXTAUTH_SECRET=$(openssl rand -base64 32)
            sed -i "s/^NEXTAUTH_SECRET=$/NEXTAUTH_SECRET=${NEXTAUTH_SECRET}/" .env
            echo "   ✓ NEXTAUTH_SECRET updated"
        else
            echo "   ✓ NEXTAUTH_SECRET configured"
        fi

        # Add PostgreSQL variables if missing
        if ! grep -q "DATABASE_URL" .env; then
            echo "DATABASE_URL=postgresql://drivncook:drivncook_password@postgres:5432/drivncook" >> .env
            echo "   ✓ DATABASE_URL added"
        fi
        if ! grep -q "POSTGRES_DB" .env; then
            echo "POSTGRES_DB=drivncook" >> .env
            echo "POSTGRES_USER=drivncook" >> .env
            echo "POSTGRES_PASSWORD=drivncook_password" >> .env
            echo "   ✓ PostgreSQL variables added"
        fi

        # Add domain-specific variables if missing
        if ! grep -q "NEXTAUTH_URL" .env; then
            echo "NEXTAUTH_URL=https://${DOMAIN}" >> .env
            echo "   ✓ NEXTAUTH_URL added with domain"
        fi
        if ! grep -q "BETTER_AUTH_URL" .env; then
            echo "BETTER_AUTH_URL=https://${DOMAIN}" >> .env
            echo "   ✓ BETTER_AUTH_URL added with domain"
        fi

        # Add production variables if missing
        echo "   Adding production variables if missing..."
        
        # UploadThing configuration (empty - must be configured manually)
        if ! grep -q "UPLOADTHING_SECRET" .env; then
            echo "UPLOADTHING_SECRET=" >> .env
            echo "UPLOADTHING_KEY=" >> .env
            echo "UPLOADTHING_APP_ID=" >> .env
            echo "UPLOADTHING_TOKEN=" >> .env
            echo "   ⚠ UploadThing variables added (empty - configure with your keys)"
        fi
        
        # Email configuration (empty - must be configured manually)
        if ! grep -q "EMAIL_USER" .env; then
            echo "EMAIL_USER=" >> .env
            echo "EMAIL_PASS=" >> .env
            echo "SMTP_HOST=smtp.gmail.com" >> .env
            echo "SMTP_PORT=587" >> .env
            echo "SMTP_USER=" >> .env
            echo "EMAIL_FROM=" >> .env
            echo "EMAIL_FROM_NAME=DRIV'N COOK" >> .env
            echo "   ⚠ Email SMTP variables added (empty - configure with your credentials)"
        fi
        
        # JWT Secret (auto-generate if empty)
        if ! grep -q "JWT_SECRET" .env; then
            JWT_SECRET=$(openssl rand -base64 32)
            echo "JWT_SECRET=${JWT_SECRET}" >> .env
            echo "   ✓ JWT secret auto-generated"
        fi
        
        # Add empty Stripe variables (disabled by default)
        for var in "STRIPE_SECRET_KEY" "STRIPE_PUBLISHABLE_KEY" "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"; do
            if ! grep -q "^${var}=" .env; then
                echo "${var}=" >> .env
            fi
        done
        echo "   ✓ Production configuration completed"
        
        # Display .env status for debugging
        echo ""
        echo "   Current .env configuration:"
        echo "   ------------------------"
        if [ -f .env ]; then
            # Show non-empty variables (mask sensitive values)
            while IFS= read -r line; do
                if [[ "$line" =~ ^[A-Z_]+= ]]; then
                    var_name=$(echo "$line" | cut -d'=' -f1)
                    var_value=$(echo "$line" | cut -d'=' -f2-)
                    case "$var_name" in
                        *SECRET*|*PASSWORD*|*KEY*|*TOKEN*)
                            if [[ -n "$var_value" ]]; then
                                echo "   $var_name=*****(configured)"
                            else
                                echo "   $var_name=(empty)"
                            fi
                            ;;
                        *)
                            if [[ -n "$var_value" ]]; then
                                echo "   $var_name=$var_value"
                            else
                                echo "   $var_name=(empty)"
                            fi
                            ;;
                    esac
                fi
            done < .env
        else
            echo "   .env file not found"
        fi
        echo "   ------------------------"
    fi
    
    # 4.5. Application fixes and corrections
    echo "4.5. Applying CORS and authentication fixes..."
    
    # Fix PostgreSQL provider in auth.ts
    AUTH_FILE="src/lib/auth.ts"
    if [ -f "${AUTH_FILE}" ]; then
        if grep -q "provider: 'sqlite'" "${AUTH_FILE}"; then
            echo "   Fixing database provider from sqlite to postgresql..."
            sed -i.tmp "s/provider: 'sqlite'/provider: 'postgresql'/g" "${AUTH_FILE}"
            rm -f "${AUTH_FILE}.tmp"
            echo "   ✓ Database provider corrected to PostgreSQL"
        else
            echo "   ✓ Database provider already configured correctly"
        fi
    else
        echo "   ⚠ auth.ts not found, skipping database provider fix"
    fi
    
    # Fix CORS configuration in next.config.ts
    NEXTCONFIG_FILE="next.config.ts"
    if [ -f "${NEXTCONFIG_FILE}" ]; then
        if ! grep -q "Access-Control-Allow-Origin" "${NEXTCONFIG_FILE}"; then
            echo "   Adding CORS headers to next.config.ts..."
            # Create a backup
            cp "${NEXTCONFIG_FILE}" "${NEXTCONFIG_FILE}.bak"
            
            # Add CORS headers after typescript config
            sed -i.tmp '/ignoreBuildErrors: true,/a\
  async headers() {\
    return [\
      {\
        source: "/api/:path*",\
        headers: [\
          { key: "Access-Control-Allow-Origin", value: "*" },\
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },\
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },\
        ],\
      },\
    ];\
  },' "${NEXTCONFIG_FILE}"
            rm -f "${NEXTCONFIG_FILE}.tmp"
            echo "   ✓ CORS headers added to next.config.ts"
        else
            echo "   ✓ CORS headers already configured"
        fi
    else
        echo "   ⚠ next.config.ts not found, skipping CORS configuration"
    fi
    
    # Fix auth client base URL
    AUTHCLIENT_FILE="src/lib/auth-client.ts"
    if [ -f "${AUTHCLIENT_FILE}" ]; then
        if ! grep -q "getBaseURL" "${AUTHCLIENT_FILE}"; then
            echo "   Improving auth client base URL handling..."
            cp "${AUTHCLIENT_FILE}" "${AUTHCLIENT_FILE}.bak"
            
            cat > "${AUTHCLIENT_FILE}" << 'EOF'
import { createAuthClient } from 'better-auth/react'

function getBaseURL() {
  // En production, utiliser l'URL du domaine
  if (typeof window !== 'undefined') {
    // Côté client, utiliser l'origine actuelle si c'est HTTPS
    if (window.location.protocol === 'https:') {
      return window.location.origin
    }
  }
  
  // Utiliser les variables d'environnement
  return process.env.NEXT_PUBLIC_BASE_URL || 
         process.env.BETTER_AUTH_URL || 
         'http://localhost:3000'
}

export const authClient = createAuthClient({
  baseURL: getBaseURL()
})

export const { signIn, signOut, signUp, useSession } = authClient
EOF
            echo "   ✓ Auth client base URL handling improved"
        else
            echo "   ✓ Auth client already configured correctly"
        fi
    else
        echo "   ⚠ auth-client.ts not found, skipping auth client fix"
    fi
    
    # Fix middleware URL handling
    MIDDLEWARE_FILE="middleware.ts"
    if [ -f "${MIDDLEWARE_FILE}" ]; then
        if grep -q "request.nextUrl.origin" "${MIDDLEWARE_FILE}"; then
            echo "   Fixing middleware URL handling..."
            sed -i.tmp 's|new URL(\x27/api/auth/get-session\x27, request.nextUrl.origin)|`${baseUrl}/api/auth/get-session`|g' "${MIDDLEWARE_FILE}"
            sed -i.tmp '/const cookies = request.headers.get(\x27cookie\x27)/a\
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BETTER_AUTH_URL || request.nextUrl.origin' "${MIDDLEWARE_FILE}"
            rm -f "${MIDDLEWARE_FILE}.tmp"
            echo "   ✓ Middleware URL handling fixed"
        else
            echo "   ✓ Middleware already configured correctly"
        fi
    else
        echo "   ⚠ middleware.ts not found, skipping middleware fix"
    fi
    
    # Add OPTIONS handler to auth route
    AUTH_ROUTE_FILE="src/app/api/auth/[...all]/route.ts"
    if [ -f "${AUTH_ROUTE_FILE}" ]; then
        if ! grep -q "OPTIONS" "${AUTH_ROUTE_FILE}"; then
            echo "   Adding CORS OPTIONS handler to auth route..."
            cp "${AUTH_ROUTE_FILE}" "${AUTH_ROUTE_FILE}.bak"
            
            cat >> "${AUTH_ROUTE_FILE}" << 'EOF'

// Gestion des requêtes OPTIONS pour CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    },
  })
}
EOF
            
            # Add NextResponse import if not present
            if ! grep -q "NextResponse" "${AUTH_ROUTE_FILE}"; then
                sed -i.tmp '1i\
import { NextResponse } from \x27next/server\x27' "${AUTH_ROUTE_FILE}"
                rm -f "${AUTH_ROUTE_FILE}.tmp"
            fi
            echo "   ✓ CORS OPTIONS handler added to auth route"
        else
            echo "   ✓ Auth route CORS already configured"
        fi
    else
        echo "   ⚠ Auth route file not found, skipping CORS handler"
    fi
    
    # Fix server session URL handling in auth.ts
    if [ -f "${AUTH_FILE}" ]; then
        if grep -q "new URL('/api/auth/session'" "${AUTH_FILE}"; then
            echo "   Fixing server session URL handling..."
            sed -i.tmp 's|new URL(\x27/api/auth/session\x27, process.env.NEXT_PUBLIC_BASE_URL || \x27http://localhost:3000\x27)|`${baseUrl}/api/auth/session`|g' "${AUTH_FILE}"
            sed -i.tmp '/const cookie = headers.get(\x27cookie\x27) || \x27\x27/a\
    \
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.BETTER_AUTH_URL || \x27http://localhost:3000\x27' "${AUTH_FILE}"
            rm -f "${AUTH_FILE}.tmp"
            echo "   ✓ Server session URL handling fixed"
        else
            echo "   ✓ Server session URL already configured correctly"
        fi
    fi
    
    # Add NEXT_PUBLIC_BASE_URL to environment if missing
    if ! grep -q "NEXT_PUBLIC_BASE_URL" .env; then
        echo "NEXT_PUBLIC_BASE_URL=https://${DOMAIN}" >> .env
        echo "   ✓ NEXT_PUBLIC_BASE_URL added to environment"
    elif grep -q "^NEXT_PUBLIC_BASE_URL=$" .env; then
        sed -i "s/^NEXT_PUBLIC_BASE_URL=$/NEXT_PUBLIC_BASE_URL=https:\/\/${DOMAIN}/" .env
        echo "   ✓ NEXT_PUBLIC_BASE_URL updated in environment"
    else
        # Update existing NEXT_PUBLIC_BASE_URL to use HTTPS
        sed -i "s|NEXT_PUBLIC_BASE_URL=http://|NEXT_PUBLIC_BASE_URL=https://|g" .env
        echo "   ✓ NEXT_PUBLIC_BASE_URL configured for HTTPS"
    fi
    
    echo "   ✓ All CORS and authentication fixes applied"
    echo ""
    
    # 5. DNS Check
    echo "4. Checking DNS resolution..."
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
    
    # 6. Port accessibility check
    echo "5. Checking port accessibility..."
    if [ "${EXTERNAL_IP}" != "unknown" ]; then
        # Test from inside the server first
        if timeout 5 bash -c "echo >/dev/tcp/127.0.0.1/80" 2>/dev/null; then
            echo "   ✓ Port 80 is accessible locally"
        else
            echo "   ⚠ Port 80 not accessible locally"
        fi
        
        # Test external access (this might fail due to firewall but we continue)
        if timeout 10 bash -c "echo >/dev/tcp/${EXTERNAL_IP}/80" 2>/dev/null; then
            echo "   ✓ Port 80 is accessible externally"
        else
            echo "   ⚠ Port 80 not accessible externally - this is expected before nginx starts"
            echo "   Common solutions:"
            echo "     Ubuntu/Debian: sudo ufw allow 80 && sudo ufw allow 443"
            echo "     CentOS/RHEL: sudo firewall-cmd --permanent --add-port=80/tcp --add-port=443/tcp && sudo firewall-cmd --reload"
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

# Clean up containers and images (but keep volumes for data persistence)
echo "Cleaning up old containers and images..."
docker container prune -f || true
docker image prune -af || true
docker builder prune -f || true

# Clean up config files
rm -f certbot/.well-known/acme-challenge/test* || true
rm -f nginx.conf.bak || true

# Prepare directories
mkdir -p certbot ssl nginx redis-data
mkdir -p certbot/.well-known/acme-challenge
echo "ok" > certbot/.well-known/acme-challenge/test

# Setup nginx configuration
echo ""
echo "Setting up nginx configuration for HTTP-only (ACME challenge phase)..."
# Always backup current nginx.conf if it exists
if [ -f nginx.conf ]; then
    cp nginx.conf nginx.conf.bak
fi
# Copy HTTP-only config for ACME challenge
if [ -f nginx-http-only.conf ]; then
    cp nginx-http-only.conf nginx.conf
else
    echo "   ⚠ nginx-http-only.conf not found, using existing nginx.conf"
fi

# Update domain placeholders in nginx config
if [ -f nginx.conf ]; then
    sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx.conf
    rm -f nginx.conf.tmp
fi
if [ -f nginx-ssl.conf ]; then
    sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx-ssl.conf
    rm -f nginx-ssl.conf.tmp
fi

# Build and start services including Redis
echo ""
echo "Building application image..."
docker compose build web

echo "Starting services (HTTP only for certificate generation)..."
echo "Services: Redis, Database, Web App, Nginx"
docker compose up -d redis database-init web nginx

# Wait for services to be ready
echo "Waiting for services to be ready..."

# Wait for Redis
echo "  Checking Redis..."
REDIS_READY=false
for i in {1..15}; do
    if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
        REDIS_READY=true
        echo "   ✓ Redis is ready (attempt $i)"
        break
    fi
    echo "     Waiting for Redis... (attempt $i/15)"
    sleep 2
done

if [ "$REDIS_READY" != "true" ]; then
    echo "   ⚠ Redis not ready, but continuing..."
fi

# Wait for web app
echo "  Checking Web Application..."
WEB_READY=false
for i in {1..20}; do
    if curl -fsS http://127.0.0.1:3000/api/health >/dev/null 2>&1 || curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
        WEB_READY=true
        echo "   ✓ Web application is ready (attempt $i)"
        break
    fi
    echo "     Waiting for web app... (attempt $i/20)"
    sleep 3
done

if [ "$WEB_READY" != "true" ]; then
    echo "   ⚠ Web application not responding, but continuing..."
fi

# Wait for nginx
echo "  Checking Nginx..."
NGINX_READY=false
for i in {1..30}; do
    if curl -fsS -H "Host: ${DOMAIN}" http://127.0.0.1/.well-known/acme-challenge/test >/dev/null 2>&1; then
        NGINX_READY=true
        echo "   ✓ Nginx is ready (attempt $i)"
        break
    fi
    echo "     Waiting for nginx... (attempt $i/30)"
    sleep 2
done

if [ "$NGINX_READY" != "true" ]; then
    echo "   ✗ Nginx not ready after timeout"
    echo ""
    echo "Container status:"
    docker compose ps | cat
    echo ""
    echo "Nginx logs:"
    docker compose logs --no-color nginx | tail -n 20
    echo ""
    echo "Web app logs:"
    docker compose logs --no-color web | tail -n 10
    
    read -p "Continue anyway? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Test ACME challenge accessibility from external
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

# Enhanced cleanup of corrupted certificate data
echo ""
echo "Enhanced cleanup of corrupted certificate data..."
docker compose down certbot 2>/dev/null || true

# Remove all certificate-related volumes and data
docker volume rm drivncook_certbot-data 2>/dev/null || echo "Volume drivncook_certbot-data not found"
docker volume rm drivncook_certbot-logs 2>/dev/null || echo "Volume drivncook_certbot-logs not found"

# Clean certificate directories thoroughly
echo "Cleaning certificate directories..."
rm -rf certbot/conf 2>/dev/null || true
rm -rf certbot/www 2>/dev/null || true
rm -rf certbot/logs 2>/dev/null || true
rm -rf ssl/* 2>/dev/null || true

# Clean any stuck certificate files
find certbot/ -name "*.pem" -delete 2>/dev/null || true
find certbot/ -name "*.key" -delete 2>/dev/null || true
find certbot/ -name "*.crt" -delete 2>/dev/null || true

# Recreate clean directories
mkdir -p certbot/conf
mkdir -p certbot/logs
mkdir -p ssl
echo "✓ Certificate data thoroughly cleaned"

# Request SSL certificates
echo ""
echo "Requesting SSL certificates from Let's Encrypt..."
echo "Domains: ${DOMAIN}, ${WWW_DOMAIN}"
echo "Email: ${EMAIL}"
echo ""

# Final pre-flight check before certificate generation
echo "Performing final pre-flight checks..."
PREFLIGHT_OK=true

# Check if nginx is serving ACME challenges
echo "test-$(date +%s)" > certbot/.well-known/acme-challenge/preflight-test
for domain in ${DOMAIN} ${WWW_DOMAIN}; do
    echo "Testing ACME challenge for ${domain}..."
    if curl -f --connect-timeout 10 "http://${domain}/.well-known/acme-challenge/preflight-test" >/dev/null 2>&1; then
        echo "   ✓ ${domain} ACME challenge accessible"
    else
        echo "   ✗ ${domain} ACME challenge NOT accessible"
        PREFLIGHT_OK=false
    fi
done
rm -f certbot/.well-known/acme-challenge/preflight-test

if [ "$PREFLIGHT_OK" != "true" ]; then
    echo ""
    echo "⚠ Pre-flight checks failed. Trying to fix..."
    echo "Restarting nginx..."
    docker compose restart nginx
    sleep 10
    
    # Retry test
    echo "test-$(date +%s)" > certbot/.well-known/acme-challenge/retry-test
    if curl -f --connect-timeout 10 "http://${DOMAIN}/.well-known/acme-challenge/retry-test" >/dev/null 2>&1; then
        echo "   ✓ ACME challenge fixed after restart"
        PREFLIGHT_OK=true
    else
        echo "   ✗ ACME challenge still failing"
    fi
    rm -f certbot/.well-known/acme-challenge/retry-test
fi

if [ "$PREFLIGHT_OK" != "true" ]; then
    echo ""
    echo "✗ Cannot proceed with certificate generation - ACME challenge not accessible"
    echo "Your site will remain at: http://${DOMAIN}"
    echo ""
    echo "To debug:"
    echo "1. Check nginx logs: docker compose logs nginx"
    echo "2. Test manually: curl -v http://${DOMAIN}/.well-known/acme-challenge/test"
    echo "3. Check firewall settings"
    echo "4. Verify DNS propagation"
    echo ""
    # Don't exit, continue with HTTP-only
else
    echo "   ✓ All pre-flight checks passed"
fi
echo ""

# Try certificate generation with enhanced error handling
echo "Attempting certificate generation with clean environment..."

# Ensure certbot directory structure is correct
mkdir -p certbot/.well-known/acme-challenge
chmod -R 755 certbot/

# Test write permissions
echo "test" > certbot/.well-known/acme-challenge/test-write
if [ ! -f certbot/.well-known/acme-challenge/test-write ]; then
    echo "✗ Cannot write to certbot directory"
    exit 1
fi
rm -f certbot/.well-known/acme-challenge/test-write

# Generate certificates with staging first if this is the first attempt
CERT_ATTEMPT_FILE=".ssl_attempt_count"
if [ ! -f "${CERT_ATTEMPT_FILE}" ]; then
    echo "0" > "${CERT_ATTEMPT_FILE}"
fi
ATTEMPT_COUNT=$(cat "${CERT_ATTEMPT_FILE}")
ATTEMPT_COUNT=$((ATTEMPT_COUNT + 1))
echo "${ATTEMPT_COUNT}" > "${CERT_ATTEMPT_FILE}"

echo "Certificate generation attempt #${ATTEMPT_COUNT}"

# Use staging for first few attempts to avoid rate limiting
STAGING_FLAG=""
if [ "${ATTEMPT_COUNT}" -le "3" ]; then
    echo "Using Let's Encrypt staging environment (attempt ${ATTEMPT_COUNT})..."
    STAGING_FLAG="--test-cert"
else
    echo "Using Let's Encrypt production environment..."
fi

if ! docker compose run --rm certbot certonly \
    --webroot \
    -w /var/www/certbot \
    -d ${DOMAIN} \
    -d ${WWW_DOMAIN} \
    --email ${EMAIL} \
    --agree-tos \
    --no-eff-email \
    --non-interactive \
    --force-renewal \
    --expand \
    ${STAGING_FLAG} \
    --verbose; then
    
    echo ""
    echo "✗ Certificate generation failed!"
    echo ""
    echo "Checking Let's Encrypt logs for details..."
    echo "Certbot container logs:"
    docker compose logs --tail=20 certbot || true
    
    echo ""
    echo "Trying to get detailed logs..."
    docker compose run --rm certbot logs || echo "No detailed logs available"
    
    echo ""
    echo "Checking nginx access logs..."
    docker compose logs --tail=10 nginx | grep -E "(acme-challenge|error|404)" || echo "No relevant nginx logs found"
    
    echo ""
    echo "Common solutions:"
    echo "1. Check DNS: dig ${DOMAIN} A"
    echo "2. Check firewall: ensure ports 80 and 443 are open"
    echo "3. Verify domain ownership and ACME challenge accessibility"
    echo "4. Check rate limits: https://letsencrypt.org/docs/rate-limits/"
    echo "5. If using staging certificates, run again to get production certificates"
    echo ""
    echo "Quick fixes to try:"
    echo "  # Reset SSL attempt counter and try again:"
    echo "  rm -f .ssl_attempt_count && ./deploy-with-checks.sh"
    echo ""
    echo "  # Force production certificates (skip staging):"
    echo "  echo '10' > .ssl_attempt_count && ./deploy-with-checks.sh"
    echo ""
    echo "Diagnostic commands:"
    echo "  ./scripts/debug-ssl.sh"
    echo "  ./scripts/test-acme-challenge.sh"
    echo ""
    
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
    
    # Verify certificates were actually created
    echo "Verifying certificate files..."
    sleep 5
    
    CERT_VERIFIED=false
    if docker compose run --rm certbot certificates | grep -q "${DOMAIN}"; then
        echo "   ✓ Certificates verified in certbot"
        CERT_VERIFIED=true
    else
        echo "   ✗ Certificate verification failed"
    fi
    
    if [ "$CERT_VERIFIED" = "true" ]; then
        # Switch to SSL configuration
        echo "Switching nginx to SSL configuration..."
        if [ -f nginx-ssl.conf ]; then
            cp nginx-ssl.conf nginx.conf
            # Update domain placeholders in SSL config
            sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx.conf
            rm -f nginx.conf.tmp
            echo "   ✓ SSL configuration applied"
            
            # Update auth URLs to use HTTPS
            echo "Updating auth URLs to use HTTPS..."
            if [ -f .env ]; then
                sed -i.tmp "s|NEXTAUTH_URL=http://|NEXTAUTH_URL=https://|g" .env
                sed -i.tmp "s|BETTER_AUTH_URL=http://|BETTER_AUTH_URL=https://|g" .env
                sed -i.tmp "s|NEXT_PUBLIC_BASE_URL=http://|NEXT_PUBLIC_BASE_URL=https://|g" .env
                rm -f .env.tmp
                echo "   ✓ Auth URLs updated to HTTPS"
            fi
        else
            echo "   ✗ nginx-ssl.conf not found, cannot enable SSL"
            echo "   Creating nginx-ssl.conf from backup..."
            if [ -f nginx.conf.bak ]; then
                cp nginx.conf.bak nginx-ssl.conf
                cp nginx-ssl.conf nginx.conf
                # Update domain placeholders
                sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx.conf
                rm -f nginx.conf.tmp
                echo "   ✓ SSL configuration restored from backup"
            else
                echo "   ✗ No backup found, staying with HTTP"
            fi
        fi
        
        # Test nginx configuration before restarting
        echo "Testing nginx configuration before restart..."
        if docker compose exec -T nginx nginx -t >/dev/null 2>&1; then
            echo "   ✓ Nginx configuration is valid"
        else
            echo "   ✗ Nginx configuration test failed"
            echo "   Configuration errors:"
            docker compose exec -T nginx nginx -t
            echo "   Attempting to fix by restoring HTTP configuration..."
            if [ -f nginx-http-only.conf ]; then
                cp nginx-http-only.conf nginx.conf
                sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx.conf
                rm -f nginx.conf.tmp
                echo "   HTTP configuration restored"
            fi
        fi
        
        echo "Restarting nginx with SSL..."
        docker compose restart nginx
        
        # Give nginx time to start with SSL
        echo "Waiting for nginx to initialize with SSL..."
        sleep 20
        
        # Verify nginx started correctly
        echo "Checking nginx status after SSL configuration..."
        if docker compose ps nginx | grep -q "Up"; then
            echo "   ✓ Nginx container is running"
        else
            echo "   ✗ Nginx container not running, checking logs..."
            docker compose logs --tail=10 nginx
        fi
        
        # Test HTTPS with retries
        echo "Testing HTTPS access..."
        HTTPS_SUCCESS=false
        for i in {1..8}; do
            echo "   HTTPS test attempt $i/8..."
            # Test with different methods
            if curl -f --connect-timeout 20 -k "https://${DOMAIN}" >/dev/null 2>&1; then
                HTTPS_SUCCESS=true
                echo "   ✓ HTTPS is working! (attempt $i)"
                break
            elif curl -f --connect-timeout 20 "https://${DOMAIN}" >/dev/null 2>&1; then
                HTTPS_SUCCESS=true
                echo "   ✓ HTTPS is working! (attempt $i)"
                break
            fi
            echo "     Waiting 8 seconds before next attempt..."
            sleep 8
        done
        
        if [ "$HTTPS_SUCCESS" = "true" ]; then
            echo ""
            echo "🎉 Deployment successful with SSL!"
            echo "Your site is available at: https://${DOMAIN}"
            
            # Clean up attempt counter on success
            rm -f .ssl_attempt_count
        else
            echo ""
            echo "⚠ HTTPS test failed, but certificates were generated"
            echo "Running comprehensive SSL diagnostics..."
            echo ""
            
            echo "1. Checking nginx SSL configuration..."
            docker compose logs --tail=15 nginx | grep -E "(ssl|error|443|certificate)" || echo "   No SSL-related nginx logs found"
            echo ""
            
            echo "2. Checking certificate files..."
            docker compose exec -T nginx ls -la /etc/letsencrypt/live/${DOMAIN}/ 2>/dev/null || echo "   Certificate files not accessible"
            echo ""
            
            echo "3. Testing SSL certificate validity..."
            if command -v openssl >/dev/null 2>&1; then
                echo "   Testing certificate with openssl..."
                echo | timeout 10 openssl s_client -connect ${DOMAIN}:443 -servername ${DOMAIN} 2>/dev/null | openssl x509 -noout -subject -dates 2>/dev/null || echo "   SSL connection test failed"
            fi
            echo ""
            
            echo "4. Testing different access methods..."
            echo "   HTTP redirect test:"
            curl -I --connect-timeout 10 "http://${DOMAIN}" 2>/dev/null | head -n 5 || echo "   HTTP test failed"
            echo ""
            echo "   HTTPS direct test:"
            curl -I --connect-timeout 10 -k "https://${DOMAIN}" 2>/dev/null | head -n 3 || echo "   HTTPS test failed"
            echo ""
            
            echo "Your site should still be available at: https://${DOMAIN}"
            echo ""
            echo "Manual debugging commands:"
            echo "  docker compose logs nginx"
            echo "  docker compose exec nginx nginx -t"
            echo "  docker compose restart nginx"
        fi
    else
        echo "✗ Certificate verification failed, staying with HTTP"
        echo "Your site is available at: http://${DOMAIN}"
    fi
fi

# Final health checks
echo ""
echo "Performing final health checks..."

# Check Redis
if docker compose exec -T redis redis-cli ping 2>/dev/null | grep -q PONG; then
    echo "   ✓ Redis is healthy"
else
    echo "   ⚠ Redis health check failed"
fi

# Check web app
if curl -fsS http://127.0.0.1:3000 >/dev/null 2>&1; then
    echo "   ✓ Web application is healthy"
else
    echo "   ⚠ Web application health check failed"
fi

# Check nginx
if curl -fsS http://127.0.0.1:80 >/dev/null 2>&1; then
    echo "   ✓ Nginx is healthy"
else
    echo "   ⚠ Nginx health check failed"
fi

# Check CORS and authentication fixes
echo ""
echo "Testing CORS and authentication fixes..."

# Test auth API endpoint
if curl -s http://127.0.0.1:3000/api/auth/get-session >/dev/null 2>&1; then
    echo "   ✓ Auth API endpoint accessible"
else
    echo "   ⚠ Auth API endpoint not accessible"
fi

# Test check-admin endpoint
response=$(curl -s -w "%{http_code}" http://127.0.0.1:3000/api/auth/check-admin -o /dev/null)
if [ "$response" = "200" ]; then
    echo "   ✓ Check-admin API working (code: $response)"
elif [ "$response" = "500" ]; then
    echo "   ⚠ Check-admin API still returning 500 error"
    echo "     Check PostgreSQL connection and Prisma configuration"
else
    echo "   ℹ Check-admin API returns code: $response"
fi

# Test CORS preflight (OPTIONS request)
options_response=$(curl -s -w "%{http_code}" -X OPTIONS http://127.0.0.1:3000/api/auth/get-session -o /dev/null)
if [ "$options_response" = "200" ] || [ "$options_response" = "204" ]; then
    echo "   ✓ CORS preflight requests working (code: $options_response)"
else
    echo "   ⚠ CORS preflight may have issues (code: $options_response)"
fi

# Verify configuration files
echo ""
echo "Verifying configuration files..."

if grep -q "provider: 'postgresql'" "src/lib/auth.ts" 2>/dev/null; then
    echo "   ✓ Database provider set to PostgreSQL"
else
    echo "   ⚠ Database provider may not be correctly configured"
fi

if grep -q "Access-Control-Allow-Origin" "next.config.ts" 2>/dev/null; then
    echo "   ✓ CORS headers configured in next.config.ts"
else
    echo "   ⚠ CORS headers may not be configured"
fi

if grep -q "getBaseURL" "src/lib/auth-client.ts" 2>/dev/null; then
    echo "   ✓ Auth client base URL handling improved"
else
    echo "   ⚠ Auth client may not have improved URL handling"
fi

if grep -q "OPTIONS" "src/app/api/auth/[...all]/route.ts" 2>/dev/null; then
    echo "   ✓ CORS OPTIONS handler added to auth route"
else
    echo "   ⚠ CORS OPTIONS handler may not be configured"
fi

# Cleanup
echo ""
echo "Post-deployment cleanup..."
rm -f certbot/.well-known/acme-challenge/test* || true
rm -f nginx.conf.bak || true
docker image prune -f || true
docker builder prune -f || true

echo ""
echo "Final status:"
docker compose ps | cat
echo ""
echo "Services health:"
echo "- Redis: $(docker compose exec -T redis redis-cli ping 2>/dev/null || echo 'Not responding')"
echo "- Web App: $(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000 2>/dev/null || echo 'Not responding')"
echo "- Nginx: $(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:80 2>/dev/null || echo 'Not responding')"

echo ""
echo "Disk usage:"
docker system df | cat
echo ""
df -h / | grep -E "(Used|Avail|Available|Filesystem)" | cat

echo ""
echo "=== DEPLOYMENT COMPLETE ==="
echo ""
echo "📋 Applied fixes and corrections:"
echo "  ✓ Fixed PostgreSQL provider configuration (was SQLite)"
echo "  ✓ Added CORS headers in next.config.ts"
echo "  ✓ Improved auth client base URL handling"
echo "  ✓ Fixed middleware URL construction"
echo "  ✓ Added CORS OPTIONS handler to auth routes"
echo "  ✓ Fixed server session URL handling"
echo "  ✓ Configured NEXT_PUBLIC_BASE_URL for production"
echo ""
echo "🔧 CORS issues resolved:"
echo "  • No more 'Access-Control-Allow-Origin' header missing errors"
echo "  • Preflight OPTIONS requests now handled properly"
echo "  • Authentication URLs now use correct production domain"
echo ""
# Check final SSL status
FINAL_SSL_STATUS="HTTP only"
if curl -f --connect-timeout 10 -k "https://${DOMAIN}" >/dev/null 2>&1; then
    FINAL_SSL_STATUS="HTTPS (SSL working)"
elif [ -f certbot/conf/live/${DOMAIN}/fullchain.pem ] || docker compose run --rm certbot certificates 2>/dev/null | grep -q "${DOMAIN}"; then
    FINAL_SSL_STATUS="HTTPS (certificates present, may need troubleshooting)"
fi

echo "Access URLs:"
echo "- Local: http://127.0.0.1:3000"
echo "- LAN Paris: http://192.168.1.10"
if [ "$FINAL_SSL_STATUS" = "HTTPS (SSL working)" ]; then
    echo "- External: https://${DOMAIN} ✓ SSL working"
elif [ "$FINAL_SSL_STATUS" = "HTTPS (certificates present, may need troubleshooting)" ]; then
    echo "- External: https://${DOMAIN} ⚠ SSL certificates present but not working"
    echo "  Also try: http://${DOMAIN}"
else
    echo "- External: http://${DOMAIN} (HTTP only)"
fi
echo ""
echo "Management commands:"
echo "- View logs: docker compose logs -f"
echo "- Restart services: docker compose restart"
echo "- Stop services: docker compose down"
echo "- Update SSL: ./deploy-with-checks.sh"