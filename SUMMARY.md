# Résumé des corrections Docker - Driv'n Cook

## 🐛 **Problèmes identifiés et corrigés**

### 1. **Erreur "Cannot find module '@tailwindcss/postcss'"**

**Cause :** Les dépendances de développement (`@tailwindcss/postcss`) étaient exclues du build avec `--omit=dev`, mais elles sont nécessaires pour compiler l'application Next.js.

**Solution :** Dockerfile multi-stage optimisé :
- Stage `deps` : Installation complète des dépendances (`npm ci` sans `--omit=dev`)
- Stage `builder` : Build de l'application avec toutes les dépendances
- Stage `runtime-deps` : Installation des dépendances de production uniquement
- Stage `runner` : Image finale avec uniquement les dépendances de production

### 2. **Warning "Invalid next.config.ts options"**

**Cause :** L'option `outputFileTracingRoot` dans `experimental` est obsolète.

**Solution :** Suppression de cette option du `next.config.ts`.

### 3. **Variables d'environnement manquantes**

**Cause :** Absence du fichier `.env` causant des warnings Docker Compose.

**Solution :** 
- Script `setup-env.sh` qui crée automatiquement un fichier `.env` avec des valeurs par défaut
- Intégration dans `deploy.sh` pour une configuration automatique

## 📁 **Fichiers créés/modifiés**

### Nouveaux fichiers :
- `scripts/setup-env.sh` - Configuration automatique de l'environnement
- `scripts/debug-build.sh` - Script de débogage pour les problèmes de build
- `DEPLOY.md` - Guide de déploiement rapide
- `SUMMARY.md` - Ce résumé

### Fichiers modifiés :
- `Dockerfile` - Architecture multi-stage optimisée
- `docker-compose.yml` - Suppression de l'attribut `version` obsolète
- `docker-compose.dev.yml` - Suppression de l'attribut `version` obsolète
- `next.config.ts` - Suppression des options obsolètes
- `deploy.sh` - Ajout de la configuration automatique
- `Makefile` - Ajout de la commande `debug`

## 🚀 **Instructions de déploiement corrigées**

### Sur le serveur :

```bash
# 1. Configuration automatique (fichier .env + dossiers)
./scripts/setup-env.sh

# 2. Édition des variables d'environnement (OBLIGATOIRE)
nano .env

# 3. Déploiement avec SSL
./deploy.sh
```

### Variables importantes à configurer dans `.env` :

```bash
# Sécurité
NEXTAUTH_SECRET="générer-avec-openssl-rand-base64-32"

# Services externes
UPLOADTHING_SECRET="your-uploadthing-secret"
UPLOADTHING_APP_ID="your-uploadthing-app-id"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
EMAIL_USER="your-smtp-user"
EMAIL_PASS="your-smtp-password"
GOOGLE_MAPS_API_KEY="your-maps-api-key"
```

## 🔧 **Nouvelles commandes Make disponibles**

```bash
make setup     # Configuration initiale
make debug     # Débogage des problèmes de build
make dev       # Développement local
make deploy    # Déploiement production
make logs      # Voir les logs
make clean     # Nettoyer Docker
```

## 🐳 **Architecture Docker optimisée**

### Build multi-stage :
1. **deps** : Installation complète des dépendances
2. **builder** : Build de l'application Next.js
3. **runtime-deps** : Dépendances de production seulement
4. **runner** : Image finale légère pour l'exécution

### Avantages :
- ✅ Build réussi avec toutes les dépendances nécessaires
- ✅ Image finale optimisée (seulement les dépendances de production)
- ✅ Client Prisma correctement généré
- ✅ Configuration SSL automatique
- ✅ Gestion des variables d'environnement

## 🛠️ **Dépannage**

### Si le build échoue encore :
```bash
# Debug complet
make debug

# Build local pour tester
npm install
npm run build

# Nettoyer Docker et recommencer
make clean
make deploy
```

### Si des variables d'environnement sont manquantes :
```bash
# Recréer le fichier .env
./scripts/setup-env.sh

# Vérifier le contenu
cat .env

# Éditer avec vos vraies valeurs
nano .env
```

Le déploiement devrait maintenant fonctionner parfaitement ! 🎉
