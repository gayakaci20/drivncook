#!/bin/bash
set -euo pipefail

DOMAIN=${DOMAIN:-drivincook.pro}
WWW_DOMAIN=${WWW_DOMAIN:-www.${DOMAIN}}

echo "=== ACME Challenge Test Script ==="
echo "Testing domains: ${DOMAIN}, ${WWW_DOMAIN}"
echo ""

cd "$(dirname "$0")/.."

# Create test challenge files
echo "1. Setting up test challenge files..."
mkdir -p certbot/.well-known/acme-challenge
TEST_TOKEN="test-token-$(date +%s)"
echo "test-response-$(date +%s)" > "certbot/.well-known/acme-challenge/${TEST_TOKEN}"
echo "ok" > certbot/.well-known/acme-challenge/test

echo "   ✓ Test files created:"
echo "     - certbot/.well-known/acme-challenge/test"
echo "     - certbot/.well-known/acme-challenge/${TEST_TOKEN}"
echo ""

# Check if nginx is running
echo "2. Checking nginx container status..."
if ! docker compose ps nginx | grep -q "Up"; then
    echo "   ✗ Nginx container is not running"
    echo "   Starting nginx with HTTP-only config..."
    
    # Backup and use HTTP-only config
    if [ -f nginx.conf ]; then
        cp nginx.conf nginx-ssl.conf.bak
    fi
    cp nginx-http-only.conf nginx.conf
    
    # Update domain placeholders
    sed -i.tmp "s/YOUR_DOMAIN/${DOMAIN}/g; s/YOUR_WWW_DOMAIN/${WWW_DOMAIN}/g" nginx.conf
    rm -f nginx.conf.tmp
    
    docker compose up -d nginx
    sleep 5
else
    echo "   ✓ Nginx container is running"
fi
echo ""

# Test local access
echo "3. Testing local file access..."
if [ -f "certbot/.well-known/acme-challenge/test" ]; then
    echo "   ✓ Test file exists locally"
else
    echo "   ✗ Test file missing locally"
    exit 1
fi
echo ""

# Test HTTP access from container
echo "4. Testing HTTP access via nginx..."
for domain in ${DOMAIN} ${WWW_DOMAIN}; do
    echo "   Testing ${domain}..."
    
    # Test with localhost first
    if docker compose exec -T nginx curl -f -s "http://localhost/.well-known/acme-challenge/test" >/dev/null 2>&1; then
        echo "     ✓ ${domain}: localhost access works"
    else
        echo "     ✗ ${domain}: localhost access failed"
        echo "     Nginx logs:"
        docker compose logs --tail=5 nginx | sed 's/^/       /'
    fi
    
    # Test with domain name
    if docker compose exec -T nginx curl -f -s -H "Host: ${domain}" "http://localhost/.well-known/acme-challenge/test" >/dev/null 2>&1; then
        echo "     ✓ ${domain}: Host header access works"
    else
        echo "     ✗ ${domain}: Host header access failed"
    fi
done
echo ""

# Test external access
echo "5. Testing external HTTP access..."
EXTERNAL_IP=$(curl -s -m 10 ifconfig.me 2>/dev/null || echo "unknown")
echo "   External IP: ${EXTERNAL_IP}"

for domain in ${DOMAIN} ${WWW_DOMAIN}; do
    echo "   Testing external access to ${domain}..."
    
    if curl -f -s --connect-timeout 10 "http://${domain}/.well-known/acme-challenge/test" >/dev/null 2>&1; then
        echo "     ✓ ${domain}: External HTTP access works"
    else
        echo "     ✗ ${domain}: External HTTP access failed"
        
        # Try with IP and Host header
        if [ "${EXTERNAL_IP}" != "unknown" ]; then
            if curl -f -s --connect-timeout 10 -H "Host: ${domain}" "http://${EXTERNAL_IP}/.well-known/acme-challenge/test" >/dev/null 2>&1; then
                echo "     ✓ ${domain}: IP+Host header access works (DNS might be the issue)"
            else
                echo "     ✗ ${domain}: IP+Host header access failed (firewall/routing issue)"
            fi
        fi
    fi
done
echo ""

# DNS checks
echo "6. DNS resolution check..."
for domain in ${DOMAIN} ${WWW_DOMAIN}; do
    echo "   ${domain}:"
    RESOLVED_IP=$(dig +short ${domain} A | head -n1)
    if [ -n "${RESOLVED_IP}" ]; then
        echo "     Resolves to: ${RESOLVED_IP}"
        if [ "${RESOLVED_IP}" = "${EXTERNAL_IP}" ]; then
            echo "     ✓ DNS matches external IP"
        else
            echo "     ✗ DNS (${RESOLVED_IP}) != External IP (${EXTERNAL_IP})"
        fi
    else
        echo "     ✗ DNS resolution failed"
    fi
done
echo ""

# Cleanup
echo "7. Cleaning up test files..."
rm -f "certbot/.well-known/acme-challenge/${TEST_TOKEN}"
rm -f certbot/.well-known/acme-challenge/test
echo "   ✓ Test files cleaned up"
echo ""

echo "=== Test Results Summary ==="
echo ""
echo "If external HTTP access failed:"
echo "1. Check DNS: dig ${DOMAIN} A"
echo "2. Check firewall: telnet ${DOMAIN} 80"
echo "3. Check nginx logs: docker compose logs nginx"
echo ""
echo "If DNS resolution failed:"
echo "1. Update your DNS records to point to: ${EXTERNAL_IP}"
echo "2. Wait for DNS propagation (up to 24-48 hours)"
echo "3. Test with: dig @8.8.8.8 ${DOMAIN} A"
echo ""
echo "If everything looks good but Let's Encrypt still fails:"
echo "1. Try running the debug script: ./scripts/debug-ssl.sh"
echo "2. Check Let's Encrypt status: https://letsencrypt.status.io/"
echo "3. Try again in a few minutes (rate limiting)"
