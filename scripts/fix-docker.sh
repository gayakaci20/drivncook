#!/bin/bash
set -euo pipefail

echo "🔧 DOCKER CONNECTIVITY FIX"
echo "=========================="

# 1. Test Docker daemon
echo "1. Vérification Docker daemon..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon non démarré"
    echo "Solutions:"
    echo "  sudo systemctl start docker"
    echo "  sudo service docker start"
    exit 1
fi
echo "✅ Docker daemon OK"

# 2. Test connectivité basique
echo ""
echo "2. Test connectivité internet..."
if ! curl -s --connect-timeout 5 google.com >/dev/null; then
    echo "❌ Pas de connexion internet"
    exit 1
fi
echo "✅ Internet OK"

# 3. Test Docker Hub
echo ""
echo "3. Test Docker Hub..."
if docker pull hello-world >/dev/null 2>&1; then
    echo "✅ Docker Hub accessible"
    docker rmi hello-world >/dev/null 2>&1 || true
    exit 0
fi

echo "❌ Docker Hub inaccessible, application des fixes..."

# 4. Redémarrage Docker
echo ""
echo "4. Redémarrage Docker daemon..."
sudo systemctl restart docker 2>/dev/null || \
sudo service docker restart 2>/dev/null || \
echo "⚠️  Impossible de redémarrer Docker automatiquement"

sleep 5

# 5. Configuration DNS et miroirs
echo ""
echo "5. Configuration DNS et miroirs Docker..."
sudo mkdir -p /etc/docker

# Backup existant
sudo cp /etc/docker/daemon.json /etc/docker/daemon.json.bak 2>/dev/null || true

# Nouvelle configuration
cat <<EOF | sudo tee /etc/docker/daemon.json >/dev/null
{
    "dns": ["8.8.8.8", "8.8.4.4", "1.1.1.1", "9.9.9.9"],
    "registry-mirrors": [
        "https://mirror.gcr.io",
        "https://daocloud.io",
        "https://c.163.com",
        "https://registry.docker-cn.com"
    ],
    "max-concurrent-downloads": 3,
    "max-concurrent-uploads": 3
}
EOF

echo "✅ Configuration Docker mise à jour"

# 6. Redémarrage final
echo ""
echo "6. Redémarrage final..."
sudo systemctl restart docker 2>/dev/null || \
sudo service docker restart 2>/dev/null || \
echo "⚠️  Redémarrage manuel requis: sudo systemctl restart docker"

sleep 10

# 7. Test final
echo ""
echo "7. Test final connectivité..."
if docker pull hello-world >/dev/null 2>&1; then
    echo "🎉 Docker Hub maintenant accessible!"
    docker rmi hello-world >/dev/null 2>&1 || true
    
    echo ""
    echo "✅ RÉPARATION RÉUSSIE"
    echo "Vous pouvez maintenant lancer: ./deploy-fast.sh"
else
    echo "❌ RÉPARATION ÉCHOUÉE"
    echo ""
    echo "Solutions manuelles:"
    echo "1. Vérifiez votre proxy/firewall d'entreprise"
    echo "2. Utilisez un VPN si nécessaire"
    echo "3. Configurez manuellement les proxies Docker:"
    echo "   https://docs.docker.com/config/daemon/systemd/"
    echo ""
    echo "Configuration actuelle sauvée dans:"
    echo "  /etc/docker/daemon.json.bak"
    echo ""
    echo "Pour restaurer:"
    echo "  sudo cp /etc/docker/daemon.json.bak /etc/docker/daemon.json"
    echo "  sudo systemctl restart docker"
    
    exit 1
fi
