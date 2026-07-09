#!/bin/bash
# ============================================================
# Hook PreToolUse (Bash) — Universo Merchan
# Exige actualizar el "cerebro" del sistema (docs/BITACORA.md, que es un
# symlink al Obsidian "Universo Merchan/Sistema y Bitacora") ANTES de
# ejecutar deploy.sh. Si la bitácora no se ha tocado en las últimas 6 h,
# bloquea el deploy y recuerda actualizar el cerebro y CLAUDE.md.
# Bypass legítimo: incluir SKIP_BRAIN_UPDATE=1 en el comando.
# ============================================================
input=$(cat)
cmd=$(printf '%s' "$input" | jq -r '.tool_input.command // ""' 2>/dev/null)

# Solo aplica a comandos que invocan deploy.sh
case "$cmd" in
  *deploy.sh*) ;;
  *) exit 0 ;;
esac

# Bypass explícito
case "$cmd" in
  *SKIP_BRAIN_UPDATE=1*) exit 0 ;;
esac

BITACORA="${CLAUDE_PROJECT_DIR:-/Users/universomerchan/universomerchanweb/universomerchan}/docs/BITACORA.md"

# Si la bitácora se ha modificado en las últimas 6 h (360 min), permitir
if [ -n "$(find "$BITACORA" -mmin -360 2>/dev/null)" ]; then
  exit 0
fi

# Bitácora sin actualizar -> denegar el deploy
jq -n '{
  hookSpecificOutput: {
    hookEventName: "PreToolUse",
    permissionDecision: "deny",
    permissionDecisionReason: "Deploy bloqueado: actualiza el cerebro del sistema ANTES de desplegar. 1) Anade una entrada en docs/BITACORA.md (esto actualiza tambien el Obsidian de Universo Merchan, que es un symlink a docs/). 2) Revisa si CLAUDE.md necesita reflejar el cambio. docs/BITACORA.md no se ha modificado en las ultimas 6 h. Bypass legitimo sin cambios de doc: prefija el comando con SKIP_BRAIN_UPDATE=1 ."
  }
}'
exit 0
