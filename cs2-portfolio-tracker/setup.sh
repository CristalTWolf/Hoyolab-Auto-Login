#!/usr/bin/env bash
# Instalador interactivo del CS2 Portfolio Tracker.
# Pide solo lo esencial, genera backend/.env y deja todo instalado.
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
ENV_FILE="$BACKEND_DIR/.env"
ENV_EXAMPLE="$BACKEND_DIR/.env.example"

echo "=== CS2 Portfolio Tracker - instalación ==="
echo

if ! command -v node >/dev/null 2>&1; then
  echo "No se encontró Node.js. Instala Node.js 22 o más reciente desde https://nodejs.org"
  echo "y vuelve a correr este script."
  exit 1
fi

NODE_MAJOR="$(node -v | sed 's/^v//' | cut -d. -f1)"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "Advertencia: tienes Node.js $(node -v), pero este proyecto necesita Node 22+"
  echo "(usa el módulo node:sqlite). Es probable que el backend no arranque."
  echo
fi

WRITE_ENV=1
if [ -f "$ENV_FILE" ]; then
  read -r -p "Ya existe backend/.env - ¿quieres sobrescribirlo? (s/N): " OVERWRITE
  case "$OVERWRITE" in
    [sS]*) WRITE_ENV=1 ;;
    *) WRITE_ENV=0; echo "Listo, conservo tu backend/.env actual." ;;
  esac
fi

if [ "$WRITE_ENV" = "1" ]; then
  echo
  echo "Vamos a crear backend/.env. Solo te voy a pedir dos cosas - el resto"
  echo "queda con valores por defecto que puedes ajustar luego abriendo ese archivo."
  echo
  echo "1) SteamID64: identifica tu perfil para sincronizar inventario y floats."
  echo "   ¿No lo conoces? Búscalo en https://steamid.io pegando el link de tu perfil."
  echo "   (Recuerda dejar tu inventario público: Steam > Editar perfil > Privacidad)"
  read -r -p "   SteamID64 [Enter para configurarlo después]: " STEAM_ID_VALUE
  echo
  echo "2) ANTHROPIC_API_KEY: habilita el chat con Claude para registrar tus"
  echo "   compras/ventas/trades hablándole en español, tal cual."
  echo "   Consíguela en https://console.anthropic.com (sección API Keys)."
  read -r -p "   ANTHROPIC_API_KEY [Enter para activarlo después]: " ANTHROPIC_KEY_VALUE

  : > "$ENV_FILE"
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      STEAM_ID=*)
        [ -n "$STEAM_ID_VALUE" ] && line="STEAM_ID=$STEAM_ID_VALUE"
        ;;
      ANTHROPIC_API_KEY=*)
        [ -n "$ANTHROPIC_KEY_VALUE" ] && line="ANTHROPIC_API_KEY=$ANTHROPIC_KEY_VALUE"
        ;;
    esac
    printf '%s\n' "$line" >> "$ENV_FILE"
  done < "$ENV_EXAMPLE"

  echo
  echo "Listo: backend/.env creado."
fi

echo
echo "=== Instalando dependencias ==="
echo
echo "--- Backend ---"
(cd "$BACKEND_DIR" && npm install)
echo
echo "--- Frontend ---"
(cd "$FRONTEND_DIR" && npm install)

cat <<'EOF'

=== Todo listo ===

Para arrancar la app hacen falta dos servidores corriendo a la vez:

  Terminal 1 (backend, http://localhost:3001):
    cd backend && npm run dev

  Terminal 2 (frontend, http://localhost:5173):
    cd frontend && npm run dev

Después abre http://localhost:5173 en tu navegador.

Tip: si estás en una sesión de Claude Code, basta con que le digas algo como
"arranca mi portfolio tracker" - sabe cómo instalarlo y correrlo por ti
(ver CLAUDE.md).
EOF
