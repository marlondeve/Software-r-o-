#!/bin/bash
# Script de deployment para Bital APIs
# Uso: ./deploy.sh [apiconsultas|apinegocio|all]

set -e  # Detener en caso de error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variables de configuración
SERVER_IP="186.190.254.230"
SERVER_USER="admin"
DEPLOY_PATH="/var/www/bital"
BACKUP_PATH="/var/backups/bital"

# Función para logging
log_info() {
	echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
	echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
	echo -e "${RED}[ERROR]${NC} $1"
}

# Función para backup
backup_api() {
	local API_NAME=$1
	log_info "Creando backup de $API_NAME..."

	ssh $SERVER_USER@$SERVER_IP "
		mkdir -p $BACKUP_PATH
		if [ -d $DEPLOY_PATH/$API_NAME ]; then
			tar -czf $BACKUP_PATH/${API_NAME}_\$(date +%Y%m%d_%H%M%S).tar.gz -C $DEPLOY_PATH $API_NAME
			# Mantener solo últimos 5 backups
			cd $BACKUP_PATH && ls -t ${API_NAME}_*.tar.gz | tail -n +6 | xargs -r rm
		fi
	"

	log_info "Backup completado"
}

# Función para deploy ApiConsultas
deploy_apiconsultas() {
	log_info "=== Deployando Bital.ApiConsultas ==="

	# Backup
	backup_api "apiconsultas"

	# Build
	log_info "Compilando ApiConsultas..."
	cd backend/Bital.ApiConsultas
	dotnet publish -c Release -o ./publish

	# Stop service
	log_info "Deteniendo servicio..."
	ssh $SERVER_USER@$SERVER_IP "sudo systemctl stop bital-apiconsultas || true"

	# Upload
	log_info "Subiendo archivos..."
	ssh $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH/apiconsultas"
	rsync -avz --delete ./publish/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/apiconsultas/

	# Copiar appsettings.Production.json si existe en el servidor
	ssh $SERVER_USER@$SERVER_IP "
		if [ -f $DEPLOY_PATH/apiconsultas.config/appsettings.Production.json ]; then
			cp $DEPLOY_PATH/apiconsultas.config/appsettings.Production.json $DEPLOY_PATH/apiconsultas/
		fi
	"

	# Permissions
	log_info "Configurando permisos..."
	ssh $SERVER_USER@$SERVER_IP "
		sudo chown -R www-data:www-data $DEPLOY_PATH/apiconsultas
		sudo chmod +x $DEPLOY_PATH/apiconsultas/Bital.ApiConsultas
	"

	# Start service
	log_info "Iniciando servicio..."
	ssh $SERVER_USER@$SERVER_IP "
		sudo systemctl daemon-reload
		sudo systemctl start bital-apiconsultas
		sudo systemctl status bital-apiconsultas --no-pager
	"

	# Health check
	log_info "Verificando health check..."
	sleep 5
	ssh $SERVER_USER@$SERVER_IP "curl -f http://localhost:5000/health || exit 1"

	log_info "ApiConsultas desplegada correctamente ✓"

	cd ../..
}

# Función para deploy ApiNegocio
deploy_apinegocio() {
	log_info "=== Deployando Bital.ApiNegocio ==="

	# Backup
	backup_api "apinegocio"

	# Build
	log_info "Compilando ApiNegocio..."
	cd backend/Bital.ApiNegocio
	dotnet publish -c Release -o ./publish

	# Stop service
	log_info "Deteniendo servicio..."
	ssh $SERVER_USER@$SERVER_IP "sudo systemctl stop bital-apinegocio || true"

	# Upload
	log_info "Subiendo archivos..."
	ssh $SERVER_USER@$SERVER_IP "mkdir -p $DEPLOY_PATH/apinegocio"
	rsync -avz --delete ./publish/ $SERVER_USER@$SERVER_IP:$DEPLOY_PATH/apinegocio/

	# Copiar appsettings.Production.json si existe en el servidor
	ssh $SERVER_USER@$SERVER_IP "
		if [ -f $DEPLOY_PATH/apinegocio.config/appsettings.Production.json ]; then
			cp $DEPLOY_PATH/apinegocio.config/appsettings.Production.json $DEPLOY_PATH/apinegocio/
		fi
	"

	# Permissions
	log_info "Configurando permisos..."
	ssh $SERVER_USER@$SERVER_IP "
		sudo chown -R www-data:www-data $DEPLOY_PATH/apinegocio
		sudo chmod +x $DEPLOY_PATH/apinegocio/Bital.ApiNegocio
	"

	# Migrations
	log_info "Ejecutando migraciones..."
	ssh $SERVER_USER@$SERVER_IP "
		cd $DEPLOY_PATH/apinegocio
		sudo -u www-data dotnet ef database update || true
	"

	# Start service
	log_info "Iniciando servicio..."
	ssh $SERVER_USER@$SERVER_IP "
		sudo systemctl daemon-reload
		sudo systemctl start bital-apinegocio
		sudo systemctl status bital-apinegocio --no-pager
	"

	# Health check
	log_info "Verificando health check..."
	sleep 5
	ssh $SERVER_USER@$SERVER_IP "curl -f http://localhost:8080/health || exit 1"

	log_info "ApiNegocio desplegada correctamente ✓"

	cd ../..
}

# Main
case "$1" in
	apiconsultas)
		deploy_apiconsultas
		;;
	apinegocio)
		deploy_apinegocio
		;;
	all)
		deploy_apiconsultas
		deploy_apinegocio
		;;
	*)
		log_error "Uso: $0 [apiconsultas|apinegocio|all]"
		exit 1
		;;
esac

log_info "=== Deployment completado ==="
log_info "Logs: sudo journalctl -u bital-* -f"
