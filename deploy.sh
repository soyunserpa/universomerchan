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
SERVER="root@212.227.90.110"
REMOTE_ROOT="/var/www/universomerchan"
PM2_PROCESS="universo-tienda"
SSH_OPTS="-o StrictHostKeyChecking=no"

# Credenciales de deploy desde archivo NO versionado (.deploy.local.env, ignorado por git)
DEPLOY_ENV="$(cd "$(dirname "$0")" && pwd)/.deploy.local.env"
if [ -f "$DEPLOY_ENV" ]; then
  set -a; . "$DEPLOY_ENV"; set +a
else
  echo "Falta $DEPLOY_ENV (debe definir SSHPASS=...). Esta en .gitignore; crealo desde tu gestor de contrasenas."
  exit 1
fi

if [ "$#" -lt 1 ]; then
  echo "Uso: ./deploy.sh <archivo1> [archivo2] ..."
  exit 1
fi

# ============================================================
# GUARD OBLIGATORIO — actualizar el "cerebro" antes de desplegar
# ------------------------------------------------------------
# El vault de Obsidian ("Universo Merchan/Sistema y Bitacora") es un
# symlink a docs/, así que editar docs/BITACORA.md actualiza el cerebro.
# Este deploy EXIGE que la bitácora se haya tocado en las últimas 6 h.
# Bypass de emergencia:  SKIP_BRAIN_UPDATE=1 ./deploy.sh <archivos...>
# ============================================================
if [ "${SKIP_BRAIN_UPDATE:-0}" != "1" ]; then
  if [ -z "$(find docs/BITACORA.md -mmin -360 2>/dev/null)" ]; then
    echo "⛔ DEPLOY BLOQUEADO — el cerebro del sistema no está actualizado."
    echo "   docs/BITACORA.md no se ha modificado en las últimas 6 h."
    echo ""
    echo "   Antes de desplegar:"
    echo "     1) Añade una entrada en docs/BITACORA.md (qué pasaba, qué se cambió,"
    echo "        deploy + verificación, qué NO romper)."
    echo "        → Eso actualiza también el Obsidian de Universo Merchan (symlink a docs/)."
    echo "     2) Revisa si CLAUDE.md necesita reflejar este cambio."
    echo ""
    echo "   Reejecución legítima sin cambios de doc:"
    echo "     SKIP_BRAIN_UPDATE=1 ./deploy.sh <archivos...>"
    exit 1
  fi
  echo "✅ Bitácora (cerebro) actualizada recientemente."
  echo "   Recuerda: ¿CLAUDE.md también refleja este cambio, si aplica?"
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
