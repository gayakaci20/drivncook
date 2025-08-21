#!/bin/bash
set -e

echo "=== DEBUG BUILD - Driv'n Cook ==="

# Vérifier les fichiers critiques
echo "1. Vérification des fichiers..."
if [ ! -f package.json ]; then
    echo "package.json manquant"
    exit 1
fi

if [ ! -f prisma/schema.prisma ]; then
    echo "prisma/schema.prisma manquant"
    exit 1
fi

if [ ! -f next.config.ts ]; then
    echo "next.config.ts manquant"
    exit 1
fi

echo "Fichiers essentiels présents"

# Vérifier les dépendances dans package.json
echo ""
echo "2. Vérification des dépendances TailwindCSS..."
if grep -q "@tailwindcss/postcss" package.json; then
    echo "@tailwindcss/postcss trouvé dans package.json"
else
    echo "@tailwindcss/postcss manquant dans package.json"
    echo "   Ajout de la dépendance..."
    npm install --save-dev @tailwindcss/postcss
fi

# Vérifier postcss.config.mjs
echo ""
echo "3. Vérification de postcss.config.mjs..."
if [ ! -f postcss.config.mjs ]; then
    echo "postcss.config.mjs manquant, création..."
    cat > postcss.config.mjs << 'EOF'
/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

export default config
EOF
    echo "postcss.config.mjs créé"
else
    echo "postcss.config.mjs présent"
fi

# Test de build local
echo ""
echo "4. Test de génération Prisma..."
npx prisma generate || {
    echo "Erreur lors de la génération Prisma"
    exit 1
}
echo "Prisma généré avec succès"

echo ""
echo "5. Test de build Next.js..."
npm run build || {
    echo "Erreur lors du build Next.js"
    echo ""
    echo "Suggestions de dépannage :"
    echo "- Vérifiez que toutes les dépendances sont installées : npm install"
    echo "- Vérifiez la configuration Tailwind : cat tailwind.config.ts"
    echo "- Vérifiez la configuration PostCSS : cat postcss.config.mjs"
    exit 1
}

echo "Build Next.js réussi"

echo ""
echo "🎉 Tous les tests passent ! Le build Docker devrait maintenant fonctionner."
echo ""
echo "Pour build Docker complet :"
echo "  docker-compose build web"
echo ""
echo "Pour déploiement complet :"
echo "  ./deploy.sh"
