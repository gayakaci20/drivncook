#!/bin/bash
set -e

echo "=== Configuration de l'environnement pour Driv'n Cook ==="

# Créer le fichier .env s'il n'existe pas
if [ ! -f .env ]; then
    echo "Création du fichier .env..."
    cat > .env << 'EOF'
# Database
DATABASE_URL="file:/app/data/production.db"

# Authentication
NEXTAUTH_SECRET="change-this-secret-in-production-2024"
NEXTAUTH_URL="https://drivncook.pro"

# File uploads (UploadThing) - À configurer
UPLOADTHING_SECRET=""
UPLOADTHING_APP_ID=""

# Stripe (Payments) - À configurer
STRIPE_SECRET_KEY=""
STRIPE_PUBLISHABLE_KEY=""
STRIPE_WEBHOOK_SECRET=""

# Email (SMTP) - À configurer
EMAIL_USER=""
EMAIL_PASS=""

# Google Maps - À configurer
GOOGLE_MAPS_API_KEY=""

# Deployment
DOMAIN="drivncook.pro"
WWW_DOMAIN="www.drivncook.pro"
EMAIL="contact@drivncook.pro"
WAIT_FOR_NGINX="true"
CLEAN_VOLUMES="false"
EOF
    echo "✅ Fichier .env créé avec des valeurs par défaut"
else
    echo "✅ Fichier .env existe déjà"
fi

# Créer les dossiers nécessaires
echo "Création des dossiers nécessaires..."
mkdir -p data ssl certbot nginx uploads

# Permissions
chmod +x deploy.sh 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

echo ""
echo "🔧 Configuration terminée !"
echo ""
echo "⚠️  IMPORTANT : Éditez le fichier .env avec vos vraies valeurs avant le déploiement :"
echo "   - NEXTAUTH_SECRET : Générez une clé secrète forte"
echo "   - UPLOADTHING_SECRET et UPLOADTHING_APP_ID : Depuis votre compte UploadThing"
echo "   - STRIPE_* : Clés de votre compte Stripe"
echo "   - EMAIL_* : Paramètres SMTP pour l'envoi d'emails"
echo "   - GOOGLE_MAPS_API_KEY : Clé API Google Maps"
echo ""
echo "Puis exécutez : ./deploy.sh"
