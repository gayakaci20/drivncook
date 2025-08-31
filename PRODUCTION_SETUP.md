# 🚀 Configuration de Production

## ⚠️ Sécurité des Clés

**Les vraies clés de production ne sont JAMAIS stockées dans le code source pour des raisons de sécurité.**

## 📁 Fichiers de Configuration

### Sur votre machine locale :
- `.env.production` : Contient vos vraies clés (créé automatiquement, pas dans Git)

### Sur votre VPS :
- `.env` : Sera créé automatiquement avec les bonnes valeurs lors du déploiement

## 🔧 Instructions de Déploiement

### 1. Sur votre VPS :

```bash
# Cloner le repository
git clone https://github.com/gayakaci20/drivncook.git
cd drivncook

# Copier le fichier de production (depuis votre machine locale)
# Vous devez copier .env.production vers votre VPS et le renommer en .env
scp .env.production user@your-vps:/path/to/drivncook/.env

# OU créer .env manuellement avec vos vraies valeurs :
cp .env.example .env
# Puis éditer .env avec vos clés réelles
```

### 2. Vos vraies valeurs à configurer dans .env :

```bash
# Authentication (utilisez vos vraies clés)
BETTER_AUTH_SECRET=your_real_better_auth_secret
NEXTAUTH_SECRET=your_real_nextauth_secret
JWT_SECRET="your_real_jwt_secret"

# Email (utilisez vos vrais paramètres)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS="your_app_password"
EMAIL_FROM=your_email@gmail.com

# UploadThing (utilisez vos vraies clés)
UPLOADTHING_SECRET=sk_live_your_real_key
UPLOADTHING_APP_ID=your_real_app_id
UPLOADTHING_TOKEN=your_real_token
```

### 3. Déployment :

```bash
# Déployer avec SSL et PostgreSQL
./deploy-with-checks.sh
```

## 🔒 Sécurité

- ✅ **Jamais de clés dans Git** : Le code source est propre
- ✅ **Fichiers locaux sécurisés** : `.env.production` est dans `.gitignore`
- ✅ **Configuration automatique** : Le script gère les secrets automatiquement
- ✅ **SSL automatique** : HTTPS configuré automatiquement

## 🌐 URLs de Production

- **Site principal** : https://drivincook.pro
- **WWW** : https://www.drivincook.pro
- **Admin** : https://drivincook.pro/admin
- **Franchise** : https://drivincook.pro/franchise

## 📝 Note Importante

Ce fichier de documentation ne contient que des exemples. 
Vos vraies clés sont stockées localement dans `.env.production` (non versionné).
