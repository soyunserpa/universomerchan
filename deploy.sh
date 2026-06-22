#!/bin/bash
# ============================================================
# UNIVERSO MERCHAN — Deploy manual por SSH
# ============================================================
# Uso:
#   ./deploy.sh <archivo1> [archivo2] ...
#
# Sube los archivos indicados (rutas relativas a la raíz del
# proyecto) al servidor, rehace el build y reinicia la app.
#
# Ejemplo:
#   ./deploy.sh "src/app/[locale]/layout.tsx"
# ============================================================

set -euo pipefail

# --- Configuración real del servidor (verificada 2026-06-22) ---
export SSHPASS="***REMOVED***"
SERVER="root@212.227.90.110"
REMOTE_ROOT="/var/www/universomerchan"
PM2_PROCESS="universo-tienda"
SSH_OPTS="-o StrictHostKeyChecking=no"

if [ "$#" -lt 1 ]; then
  echo "Uso: ./deploy.sh <archivo1> [archivo2] ..."
  exit 1
fi

echo "=== Subiendo $# archivo(s) a $SERVER:$REMOTE_ROOT ==="
for f in "$@"; do
  if [ ! -f "$f" ]; then
    echo "  ✗ No existe: $f" && exit 1
  fi
  # Asegura que el directorio remoto existe (preserva subcarpetas)
  remote_dir="$REMOTE_ROOT/$(dirname "$f")"
  sshpass -e ssh $SSH_OPTS "$SERVER" "mkdir -p \"$remote_dir\""
  sshpass -e scp $SSH_OPTS "$f" "$SERVER:$REMOTE_ROOT/$f"
  echo "  ✓ $f"
done

echo "=== Sincronizando docs/ al servidor (bitácora del sistema) ==="
sshpass -e ssh $SSH_OPTS "$SERVER" "mkdir -p \"$REMOTE_ROOT/docs\""
sshpass -e scp -r $SSH_OPTS docs/. "$SERVER:$REMOTE_ROOT/docs/"

echo "=== Build + restart en el servidor ==="
sshpass -e ssh $SSH_OPTS "$SERVER" \
  "cd $REMOTE_ROOT && npm run build && pm2 restart $PM2_PROCESS"

echo "=== Deploy completado ==="
echo "RECORDATORIO: ¿actualizaste docs/BITACORA.md con este cambio? (regla de CLAUDE.md)"
