# Makefile pour Driv'n Cook

.PHONY: help setup dev build start stop clean logs deploy debug

# Afficher l'aide
help:
	@echo "Commandes disponibles:"
	@echo "  setup     - Configurer l'environnement Docker"
	@echo "  dev       - Démarrer en mode développement"
	@echo "  build     - Construire les images Docker"
	@echo "  start     - Démarrer en mode production"
	@echo "  stop      - Arrêter tous les services"
	@echo "  clean     - Nettoyer les conteneurs et images"
	@echo "  logs      - Afficher les logs"
	@echo "  deploy    - Déployer avec SSL"
	@echo "  debug     - Déboguer les problèmes de build"

# Configuration initiale
setup:
	@./scripts/setup-env.sh

# Mode développement
dev:
	@echo "Démarrage en mode développement..."
	@docker-compose -f docker-compose.dev.yml up --build

# Construire les images
build:
	@echo "Construction des images..."
	@docker-compose build

# Démarrer en production
start:
	@echo "Démarrage en mode production..."
	@docker-compose up -d

# Arrêter les services
stop:
	@echo "Arrêt des services..."
	@docker-compose down

# Nettoyer
clean:
	@echo "Nettoyage..."
	@docker-compose down --remove-orphans
	@docker system prune -f

# Afficher les logs
logs:
	@docker-compose logs -f

# Déployer avec SSL
deploy:
	@echo "Déploiement avec SSL..."
	@./deploy.sh

# Déboguer les problèmes
debug:
	@echo "Debug des problèmes de build..."
	@./scripts/debug-build.sh
