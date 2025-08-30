#!/bin/bash
set -euo pipefail

DOMAIN=${DOMAIN:-drivincook.pro}
EXTERNAL_IP=${EXTERNAL_IP:-$(curl -s -m 10 ifconfig.me 2>/dev/null || echo "unknown")}

echo "=== FIREWALL & PORT CHECK UTILITY ==="
echo "Domain: ${DOMAIN}"
echo "External IP: ${EXTERNAL_IP}"
echo ""

# 1. Check local firewall status
echo "1. Local firewall status:"
if command -v ufw >/dev/null 2>&1; then
    echo "   UFW status:"
    sudo ufw status || echo "   UFW status check failed"
elif command -v firewall-cmd >/dev/null 2>&1; then
    echo "   FirewallD status:"
    sudo firewall-cmd --state || echo "   FirewallD status check failed"
    echo "   Open ports:"
    sudo firewall-cmd --list-ports || echo "   Port list failed"
elif command -v iptables >/dev/null 2>&1; then
    echo "   iptables rules (INPUT chain):"
    sudo iptables -L INPUT -n --line-numbers | head -20 || echo "   iptables check failed"
else
    echo "   No recognized firewall tool found (ufw/firewall-cmd/iptables)"
fi
echo ""

# 2. Check if ports are listening locally
echo "2. Local port status:"
echo "   Port 80 (HTTP):"
if netstat -tlnp 2>/dev/null | grep -q ":80 "; then
    echo "     ✓ Port 80 is listening"
    netstat -tlnp 2>/dev/null | grep ":80 " | head -3
elif ss -tlnp 2>/dev/null | grep -q ":80 "; then
    echo "     ✓ Port 80 is listening"
    ss -tlnp 2>/dev/null | grep ":80 " | head -3
else
    echo "     ✗ Port 80 is NOT listening"
fi

echo "   Port 443 (HTTPS):"
if netstat -tlnp 2>/dev/null | grep -q ":443 "; then
    echo "     ✓ Port 443 is listening"
    netstat -tlnp 2>/dev/null | grep ":443 " | head -3
elif ss -tlnp 2>/dev/null | grep -q ":443 "; then
    echo "     ✓ Port 443 is listening"
    ss -tlnp 2>/dev/null | grep ":443 " | head -3
else
    echo "     ✗ Port 443 is NOT listening"
fi
echo ""

# 3. Test external connectivity
echo "3. External connectivity test:"
if [ "${EXTERNAL_IP}" != "unknown" ]; then
    echo "   Testing port 80 from external..."
    if timeout 10 bash -c "echo >/dev/tcp/${EXTERNAL_IP}/80" 2>/dev/null; then
        echo "     ✓ Port 80 is externally accessible"
    else
        echo "     ✗ Port 80 is NOT externally accessible"
    fi
    
    echo "   Testing port 443 from external..."
    if timeout 10 bash -c "echo >/dev/tcp/${EXTERNAL_IP}/443" 2>/dev/null; then
        echo "     ✓ Port 443 is externally accessible"
    else
        echo "     ✗ Port 443 is NOT externally accessible"
    fi
else
    echo "   ⚠ Cannot determine external IP, skipping external tests"
fi
echo ""

# 4. Test HTTP/HTTPS access to domain
echo "4. HTTP/HTTPS access test:"
echo "   Testing HTTP access to ${DOMAIN}..."
HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" --connect-timeout 10 "http://${DOMAIN}/" || echo "000")
if [ "${HTTP_STATUS}" = "200" ] || [ "${HTTP_STATUS}" = "301" ] || [ "${HTTP_STATUS}" = "302" ]; then
    echo "     ✓ HTTP accessible (status: ${HTTP_STATUS})"
else
    echo "     ✗ HTTP not accessible (status: ${HTTP_STATUS})"
fi

echo "   Testing HTTPS access to ${DOMAIN}..."
HTTPS_STATUS=$(curl -o /dev/null -s -w "%{http_code}" --connect-timeout 10 "https://${DOMAIN}/" || echo "000")
if [ "${HTTPS_STATUS}" = "200" ] || [ "${HTTPS_STATUS}" = "301" ] || [ "${HTTPS_STATUS}" = "302" ]; then
    echo "     ✓ HTTPS accessible (status: ${HTTPS_STATUS})"
else
    echo "     ✗ HTTPS not accessible (status: ${HTTPS_STATUS})"
fi
echo ""

# 5. Cloud provider specific checks
echo "5. Cloud provider detection:"
# Check for common cloud providers
CLOUD_PROVIDER="Unknown"

# AWS
if curl -s -m 5 http://169.254.169.254/latest/meta-data/instance-id >/dev/null 2>&1; then
    CLOUD_PROVIDER="AWS"
    echo "   Detected: Amazon Web Services (AWS)"
    echo "   ⚠ Check AWS Security Groups for ports 80, 443"
    echo "   Console: https://console.aws.amazon.com/ec2/v2/home#SecurityGroups"
# Digital Ocean
elif curl -s -m 5 http://169.254.169.254/metadata/v1/id >/dev/null 2>&1; then
    CLOUD_PROVIDER="DigitalOcean"
    echo "   Detected: DigitalOcean"
    echo "   ⚠ Check DigitalOcean Firewall rules"
    echo "   Console: https://cloud.digitalocean.com/networking/firewalls"
# Google Cloud
elif curl -s -m 5 -H "Metadata-Flavor: Google" http://169.254.169.254/computeMetadata/v1/instance/id >/dev/null 2>&1; then
    CLOUD_PROVIDER="GCP"
    echo "   Detected: Google Cloud Platform (GCP)"
    echo "   ⚠ Check GCP Firewall rules"
    echo "   Console: https://console.cloud.google.com/networking/firewalls"
# Azure
elif curl -s -m 5 -H "Metadata:true" http://169.254.169.254/metadata/instance?api-version=2021-02-01 >/dev/null 2>&1; then
    CLOUD_PROVIDER="Azure"
    echo "   Detected: Microsoft Azure"
    echo "   ⚠ Check Azure Network Security Groups"
    echo "   Console: https://portal.azure.com/#blade/HubsExtension/BrowseResource/resourceType/Microsoft.Network%2FNetworkSecurityGroups"
else
    echo "   Cloud provider: Unknown or on-premise"
fi
echo ""

# 6. Recommendations
echo "=== RECOMMENDATIONS ==="
echo ""

if [ "${HTTP_STATUS}" = "000" ] && [ "${HTTPS_STATUS}" = "000" ]; then
    echo "🔴 CRITICAL: Both HTTP and HTTPS are inaccessible"
    echo ""
    echo "Immediate actions:"
    echo "1. Check if nginx/web server is running:"
    echo "   docker compose ps"
    echo ""
    echo "2. Check firewall configuration:"
    
    if command -v ufw >/dev/null 2>&1; then
        echo "   sudo ufw allow 80"
        echo "   sudo ufw allow 443"
    elif command -v firewall-cmd >/dev/null 2>&1; then
        echo "   sudo firewall-cmd --permanent --add-port=80/tcp"
        echo "   sudo firewall-cmd --permanent --add-port=443/tcp"
        echo "   sudo firewall-cmd --reload"
    else
        echo "   Configure your firewall to allow ports 80 and 443"
    fi
    
    if [ "${CLOUD_PROVIDER}" != "Unknown" ]; then
        echo ""
        echo "3. Check cloud firewall/security groups (see links above)"
    fi
    
elif [ "${HTTP_STATUS}" = "000" ]; then
    echo "🟡 WARNING: HTTP is not accessible (needed for Let's Encrypt)"
    echo ""
    echo "For Let's Encrypt to work, port 80 must be accessible."
    echo "Even if you only want HTTPS, HTTP is required for certificate generation."
    
elif [ "${HTTPS_STATUS}" = "000" ] && [ "${HTTP_STATUS}" != "000" ]; then
    echo "🟡 INFO: HTTP works but HTTPS doesn't (normal before SSL setup)"
    echo ""
    echo "This is expected if you haven't run SSL certificate generation yet."
    echo "Run: ./deploy-with-checks.sh"
    
else
    echo "✅ GOOD: Website is accessible"
    echo ""
    echo "HTTP Status: ${HTTP_STATUS}"
    echo "HTTPS Status: ${HTTPS_STATUS}"
fi

echo ""
echo "Additional tools to test connectivity:"
echo "- Test HTTP: curl -v http://${DOMAIN}/"
echo "- Test HTTPS: curl -v https://${DOMAIN}/"
echo "- Test port: telnet ${DOMAIN} 80"
echo "- Test with IP: curl -v -H 'Host: ${DOMAIN}' http://${EXTERNAL_IP}/"
echo ""
echo "=== END FIREWALL CHECK ==="
