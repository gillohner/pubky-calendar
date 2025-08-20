#!/bin/bash

# Script de backup pour le projet Roadky
# Usage: ./backup.sh "Description du backup"

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="roadky"
BACKUP_BASE_DIR="/Users/vincentdelbeau/Documents/DEV/windsurf-next/tagky-bot-JS/backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage avec couleurs
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Vérification des arguments
if [ $# -eq 0 ]; then
    print_error "Usage: $0 \"Description du backup\""
    print_info "Exemple: $0 \"Backup après suppression des données mock\""
    exit 1
fi

DESCRIPTION="$1"
# Normalisation de la description pour le nom de fichier (remplacer espaces par tirets, supprimer caractères spéciaux)
DESC_NORMALIZED=$(echo "$DESCRIPTION" | sed 's/[^a-zA-Z0-9 ]//g' | sed 's/ /-/g' | tr '[:upper:]' '[:lower:]')
BACKUP_ZIP="${BACKUP_BASE_DIR}/${PROJECT_NAME}_${TIMESTAMP}_${DESC_NORMALIZED}.zip"
TEMP_DIR="/tmp/${PROJECT_NAME}_backup_${TIMESTAMP}"

print_info "=== BACKUP DU PROJET ROADKY ==="
print_info "Projet: ${PROJECT_NAME}"
print_info "Source: ${PROJECT_DIR}"
print_info "Destination: ${BACKUP_ZIP}"
print_info "Description: ${DESCRIPTION}"
print_info "Timestamp: ${TIMESTAMP}"
echo

# Création du dossier de backup temporaire
print_info "Création du dossier temporaire..."
mkdir -p "${BACKUP_BASE_DIR}"
mkdir -p "${TEMP_DIR}"

if [ ! -d "${TEMP_DIR}" ]; then
    print_error "Impossible de créer le dossier temporaire: ${TEMP_DIR}"
    exit 1
fi

print_success "Dossier temporaire créé: ${TEMP_DIR}"

# Copie des fichiers (en excluant certains dossiers)
print_info "Copie des fichiers du projet..."

# Utilisation de rsync pour une copie efficace avec exclusions
rsync -av \
    --exclude='node_modules' \
    --exclude='.next' \
    --exclude='dist' \
    --exclude='build' \
    --exclude='.git' \
    --exclude='*.log' \
    --exclude='.DS_Store' \
    --exclude='coverage' \
    --exclude='.nyc_output' \
    --exclude='backup.sh' \
    "${PROJECT_DIR}/" "${TEMP_DIR}/"

if [ $? -eq 0 ]; then
    print_success "Fichiers copiés avec succès"
else
    print_error "Erreur lors de la copie des fichiers"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Création du fichier de métadonnées
print_info "Création du fichier de métadonnées..."
METADATA_FILE="${TEMP_DIR}/BACKUP_INFO.md"

cat > "${METADATA_FILE}" << EOF
# Backup du projet Roadky

## Informations générales
- **Projet**: ${PROJECT_NAME}
- **Date de backup**: $(date +"%Y-%m-%d %H:%M:%S")
- **Timestamp**: ${TIMESTAMP}
- **Source**: ${PROJECT_DIR}
- **Archive ZIP**: ${BACKUP_ZIP}

## Description
${DESCRIPTION}

## Structure du projet
\`\`\`
$(tree -I 'node_modules|.next|dist|build|.git' "${TEMP_DIR}" 2>/dev/null || find "${TEMP_DIR}" -type f -name "*.tsx" -o -name "*.ts" -o -name "*.js" -o -name "*.json" | head -20)
\`\`\`

## Fichiers principaux
- **package.json**: Configuration des dépendances
- **src/app/page.tsx**: Page principale de l'application
- **src/app/profile/page.tsx**: Page de profil utilisateur
- **src/app/admin/page.tsx**: Interface d'administration
- **src/contexts/AuthContext.tsx**: Contexte d'authentification
- **src/components/LoginModal.tsx**: Modal de connexion Pubky Ring

## État du projet au moment du backup
- ✅ Authentification Pubky Ring fonctionnelle
- ✅ Page de profil avec affichage de la clé publique
- ✅ Bouton "My Profile" dans le header
- ✅ Suppression des données mock/fictives
- ✅ Interface propre prête pour l'intégration backend

## Commandes pour restaurer
\`\`\`bash
# Décompresser l'archive
unzip "${BACKUP_ZIP}" -d /path/to/restore/location

# Installer les dépendances
cd /path/to/restore/location
pnpm install

# Lancer le projet
pnpm dev
\`\`\`

## Notes
Ce backup a été créé automatiquement par le script backup.sh du projet Roadky.
EOF

print_success "Fichier de métadonnées créé: ${METADATA_FILE}"

# Création de l'archive ZIP
print_info "Création de l'archive ZIP..."
cd "$(dirname "${TEMP_DIR}")"
zip -r "${BACKUP_ZIP}" "$(basename "${TEMP_DIR}")" > /dev/null

if [ $? -eq 0 ]; then
    print_success "Archive ZIP créée avec succès"
else
    print_error "Erreur lors de la création de l'archive ZIP"
    rm -rf "${TEMP_DIR}"
    exit 1
fi

# Nettoyage du dossier temporaire
print_info "Nettoyage du dossier temporaire..."
rm -rf "${TEMP_DIR}"

# Calcul de la taille du backup
BACKUP_SIZE=$(du -sh "${BACKUP_ZIP}" | cut -f1)
print_info "Taille de l'archive: ${BACKUP_SIZE}"

# Affichage du résumé final
echo
print_success "=== BACKUP TERMINÉ AVEC SUCCÈS ==="
print_info "Archive ZIP: ${BACKUP_ZIP}"
print_info "Taille: ${BACKUP_SIZE}"
print_info "Description: ${DESCRIPTION}"
echo

# Affichage de la liste des backups existants
print_info "Backups existants dans ${BACKUP_BASE_DIR}:"
if [ -d "${BACKUP_BASE_DIR}" ]; then
    ls -la "${BACKUP_BASE_DIR}" | grep "${PROJECT_NAME}_.*\.zip" | tail -5
else
    print_warning "Aucun backup précédent trouvé"
fi

print_success "Backup terminé !"
