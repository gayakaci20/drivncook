#!/bin/bash
set -e

echo "=== DRIV'N COOK - Configuration Docker ==="

# Créer les dossiers nécessaires
echo "Création des dossiers..."
mkdir -p data ssl certbot nginx uploads

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "Création du fichier .env..."
    cp .env.example .env
    echo "⚠️  Veuillez éditer le fichier .env avec vos vraies valeurs avant de déployer en production!"
fi

# Permissions
echo "Configuration des permissions..."
chmod +x deploy.sh
chmod +x scripts/docker-setup.sh

# Initialiser la base de données
echo "Initialisation de la base de données..."
if [ ! -f data/production.db ]; then
    touch data/production.db
fi

echo "✅ Configuration terminée!"
echo ""
echo "Pour le développement local:"
echo "  docker-compose -f docker-compose.dev.yml up --build"
echo ""
echo "Pour la production:"
echo "  1. Éditez le fichier .env avec vos vraies valeurs"
echo "  2. Exécutez: ./deploy.sh"
