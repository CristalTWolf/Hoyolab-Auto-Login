# CS2 Portfolio Tracker - guía para Claude Code

App de dos partes en este directorio:

- `backend/` - API Express + SQLite (puerto 3001)
- `frontend/` - Dashboard React + Vite (puerto 5173, hace proxy de `/api` hacia el backend)

## Cuando el usuario pida arrancarlo ("arranca mi portfolio tracker", "muéstrame mi tracker", etc.)

1. Si no existe `backend/.env`, ejecuta `./setup.sh` (interactivo: pide
   `STEAM_ID` y `ANTHROPIC_API_KEY`, genera el `.env` e instala dependencias).
   Si el usuario ya tiene `.env` y `node_modules`, puedes saltarte este paso.
2. Si falta `node_modules` en `backend/` o `frontend/`, corre `npm install` ahí.
3. Arranca ambos servidores en segundo plano (`run_in_background`):
   - `cd backend && npm run dev`
   - `cd frontend && npm run dev`
4. Confirma que el backend respondió (log "escuchando"/"listening" o
   `curl -s localhost:3001/api/portfolio/summary`) y que el frontend sirvió en
   el puerto 5173. Comparte con el usuario el link al dashboard
   (`http://localhost:5173`, o el preview/forward del entorno si aplica).

## Diagnóstico rápido

- Sin `ANTHROPIC_API_KEY`: el resto de la app funciona, pero la pestaña "Chat
  con Claude" muestra un aviso de que está deshabilitado.
- Sin `STEAM_ID`: la sincronización automática de inventario/floats no corre,
  pero el usuario puede seguir agregando objetos a mano (chat o API).
- La base SQLite se crea sola en `backend/data/portfolio.db` al primer arranque
  - no hace falta ninguna migración manual.
