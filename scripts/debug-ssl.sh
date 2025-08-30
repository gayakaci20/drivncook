#!/bin/bash
set -euo pipefail

DOMAIN=${DOMAIN:-drivincook.pro}
WWW_DOMAIN=${WWW_DOMAIN:-www.${DOMAIN}}
SERVER_IP=${SERVER_IP:-149.202.90.212}

echo "=== SSL DEBUG SCRIPT FOR ${DOMAIN} ==="
echo "Expected server IP: ${SERVER_IP}"
echo ""

# 1. DNS Resolution Check
echo "1. Checking DNS resolution..."
echo "   ${DOMAIN}:"
dig +short ${DOMAIN} A || echo "   DNS resolution failed for ${DOMAIN}"
echo "   ${WWW_DOMAIN}:"
dig +short ${WWW_DOMAIN} A || echo "   DNS resolution failed for ${WWW_DOMAIN}"
echo ""

# 2. Check if domains point to correct IP
echo "2. Verifying IP matches..."
DOMAIN_IP=$(dig +short ${DOMAIN} A | head -n1)
WWW_IP=$(dig +short ${WWW_DOMAIN} A | head -n1)

if [ "${DOMAIN_IP}" = "${SERVER_IP}" ]; then
    echo "   ✓ ${DOMAIN} correctly points to ${SERVER_IP}"
else
    echo "   ✗ ${DOMAIN} points to ${DOMAIN_IP}, expected ${SERVER_IP}"
fi

if [ "${WWW_IP}" = "${SERVER_IP}" ]; then
    echo "   ✓ ${WWW_DOMAIN} correctly points to ${SERVER_IP}"
else
    echo "   ✗ ${WWW_DOMAIN} points to ${WWW_IP}, expected ${SERVER_IP}"
fi
echo ""

# 3. Port accessibility check
echo "3. Checking port accessibility..."
echo "   Testing port 80 on ${SERVER_IP}..."
if timeout 10 bash -c "echo >/dev/tcp/${SERVER_IP}/80" 2>/dev/null; then
    echo "   ✓ Port 80 is accessible"
else
    echo "   ✗ Port 80 is not accessible (firewall issue?)"
fi

echo "   Testing port 443 on ${SERVER_IP}..."
if timeout 10 bash -c "echo >/dev/tcp/${SERVER_IP}/443" 2>/dev/null; then
    echo "   ✓ Port 443 is accessible"
else
    echo "   ✗ Port 443 is not accessible"
fi
echo ""

# 4. Docker containers status
echo "4. Checking Docker containers..."
if command -v docker >/dev/null 2>&1; then
    echo "   Container status:"
    docker compose ps || echo "   Failed to get container status"
    echo ""
    
    echo "   Nginx container logs (last 10 lines):"
    docker compose logs --tail=10 nginx 2>/dev/null || echo "   No nginx logs available"
    echo ""
fi

# 5. Test ACME challenge path
echo "5. Testing ACME challenge setup..."
if [ -d "certbot/.well-known/acme-challenge" ]; then
    echo "   ✓ ACME challenge directory exists"
    echo "   Creating test file..."
    mkdir -p certbot/.well-known/acme-challenge
    echo "test-$(date +%s)" > certbot/.well-known/acme-challenge/test-file
    
    echo "   Testing HTTP access to challenge file..."
    for domain in ${DOMAIN} ${WWW_DOMAIN}; do
        echo "     Testing http://${domain}/.well-known/acme-challenge/test-file"
        if curl -f --connect-timeout 10 -H "Host: ${domain}" "http://${SERVER_IP}/.well-known/acme-challenge/test-file" 2>/dev/null; then
            echo "     ✓ ${domain} ACME challenge path accessible"
        else
            echo "     ✗ ${domain} ACME challenge path not accessible"
        fi
    done
    
    echo "   Cleaning up test file..."
    rm -f certbot/.well-known/acme-challenge/test-file
else
    echo "   ✗ ACME challenge directory not found"
fi
echo ""

# 6. Firewall recommendations
echo "6. Troubleshooting recommendations:"
echo ""
echo "   DNS Issues:"
echo "   - Verify ${DOMAIN} A record points to ${SERVER_IP}"
echo "   - Verify ${WWW_DOMAIN} A record points to ${SERVER_IP}"
echo "   - DNS propagation can take up to 24-48 hours"
echo "   - Use: dig @8.8.8.8 ${DOMAIN} A"
echo ""
echo "   Firewall Issues:"
echo "   - Ensure port 80 and 443 are open on your server"
echo "   - Common commands:"
echo "     Ubuntu/Debian: sudo ufw allow 80 && sudo ufw allow 443"
echo "     CentOS/RHEL: sudo firewall-cmd --permanent --add-port=80/tcp --add-port=443/tcp && sudo firewall-cmd --reload"
echo ""
echo "   Docker Issues:"
echo "   - Ensure nginx container is running: docker compose ps"
echo "   - Check nginx logs: docker compose logs nginx"
echo "   - Restart containers: docker compose restart nginx"
echo ""
echo "   Test manually:"
echo "   - curl -v http://${DOMAIN}/.well-known/acme-challenge/test"
echo "   - curl -v -H 'Host: ${DOMAIN}' http://${SERVER_IP}/.well-known/acme-challenge/test"

echo ""
echo "=== END DEBUG ==="
