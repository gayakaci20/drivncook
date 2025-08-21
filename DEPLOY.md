# Guide de déploiement - Driv'n Cook

## 🚀 Déploiement rapide

### 1. Configuration initiale

```bash
# Configuration de l'environnement
make setup
# ou
./scripts/setup-env.sh
```

### 2. Configuration des variables d'environnement

Éditez le fichier `.env` créé automatiquement :

```bash
nano .env
```

**Variables obligatoires à configurer :**

- `NEXTAUTH_SECRET` : Clé secrète forte (générez avec `openssl rand -base64 32`)
- `UPLOADTHING_SECRET` et `UPLOADTHING_APP_ID` : Depuis votre compte UploadThing
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` : Clés Stripe
- `EMAIL_USER` et `EMAIL_PASS` : Paramètres SMTP
- `GOOGLE_MAPS_API_KEY` : Clé API Google Maps

### 3. Déploiement

```bash
# Déploiement automatique avec SSL
./deploy.sh
```

## 🛠️ Dépannage

### Erreur "Prisma schema not found"

Le Dockerfile a été corrigé pour éviter cette erreur. Si elle persiste :

```bash
# Nettoyer et reconstruire
docker system prune -a
./deploy.sh
```

### Variables d'environnement manquantes

Assurez-vous que le fichier `.env` existe et contient toutes les variables :

```bash
# Vérifier le fichier .env
cat .env

# Recréer si nécessaire
./scripts/setup-env.sh
```

### Problèmes de certificats SSL

```bash
# Forcer le renouvellement
docker-compose run --rm certbot certonly --webroot -w /var/www/certbot -d drivncook.pro -d www.drivncook.pro --force-renewal
```

## 📋 Commandes utiles

```bash
# Voir les logs
docker-compose logs -f

# Redémarrer un service
docker-compose restart web

# Entrer dans le conteneur
docker-compose exec web sh

# Nettoyer le système
docker system prune -a
```

## 🔧 Structure après déploiement

```
/home/adminweb/drivncook/
├── data/              # Base de données SQLite
├── uploads/           # Fichiers uploadés
├── ssl/              # Certificats SSL
├── .env              # Variables d'environnement
└── docker-compose.yml # Configuration Docker
```

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs : `docker-compose logs`
2. Vérifiez l'espace disque : `df -h`
3. Vérifiez les variables d'environnement : `cat .env`
