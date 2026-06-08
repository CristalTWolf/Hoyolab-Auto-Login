# CS2 Portfolio Tracker

Rastreador de tu inventario/portafolio de CS2: precios que se sincronizan
periódicamente, floats de tus skins, alertas de movimientos abruptos de precio
("¿me están manipulando los chinos?") y un chat con Claude para registrar tus
compras, ventas y trades hablando en lenguaje natural.

```
cs2-portfolio-tracker/
├── backend/   API en Express + SQLite: precios, floats, alertas, agente Claude
└── frontend/  Dashboard en React + Vite + Tailwind + Recharts
```

## ¿Por qué está hecho así?

**No existe una API de precios gratuita y confiable para CS2.** Steam tiene un
endpoint público (`priceoverview`) pero está agresivamente limitado por tasa y
no incluye floats; servicios como CSFloat/Steamwebapi/Pricempire cobran por
volumen. Por eso el backend trata las fuentes de precio como **plugins
intercambiables** (`backend/src/providers/price/`):

1. **Overrides manuales** (`data/price-overrides.json`, opcional): un JSON
   `{ "market_hash_name": precio }` que tú mantienes - por ejemplo copiando los
   valores que te muestra la extensión **CS2Trader** en su vista de inventario.
   Si existe, gana siempre.
2. **Steam Community Market** (gratis, sin cuenta, pero limitado): se usa como
   respaldo para todo lo que no esté en tus overrides.

Puedes añadir tu propio proveedor (p. ej. una API de pago) implementando la
interfaz `PriceProvider` y registrándolo en `providers/price/index.js` - el
resto de la app no necesita cambiar.

Los **floats** sí tienen una fuente gratuita confiable: el "inspect link" de
cada item (disponible en tu inventario público de Steam) consultado contra la
API de [CSFloat](https://docs.csfloat.com/), que funciona sin clave para uso
casual (igual que su extensión "CSFloat Market Checker").

## Requisitos

- Node.js 22+ (usa el módulo experimental `node:sqlite`, sin dependencias nativas)
- Una cuenta de Steam con el inventario **público** (para sincronizar floats/inventario)
- Opcional: clave de [Anthropic](https://console.anthropic.com/) para el chat con Claude
- Opcional: webhook de Discord para recibir alertas

## Backend

```bash
cd backend
cp .env.example .env   # edita con tus datos (ver abajo)
npm install
npm run dev            # http://localhost:3001
```

Variables de entorno relevantes (`backend/.env`, ver `.env.example` para la lista completa):

| Variable | Para qué sirve |
| --- | --- |
| `STEAM_ID` | Tu SteamID64, para sincronizar tu inventario y floats |
| `ANTHROPIC_API_KEY` / `ANTHROPIC_MODEL` | Habilita el chat con Claude (registrar/editar/eliminar trades por lenguaje natural) |
| `CSFLOAT_API_KEY` | Opcional - mayor límite de tasa para consultas de float |
| `PRICE_OVERRIDES_PATH` | Ruta a tu JSON de precios manuales (ver `data/price-overrides.example.json`) |
| `PRICE_SYNC_CRON` | Frecuencia de actualización de precios (cron), por defecto cada 15 min |
| `ALERT_THRESHOLD_PERCENT` / `ALERT_WINDOW_HOURS` | Cuándo se considera "movimiento abrupto" (por defecto ±15% en 24h) |
| `DISCORD_WEBHOOK_URL` | A dónde mandar las alertas de precio |

La base de datos SQLite se crea automáticamente en `backend/data/portfolio.db`.

### Usando datos de CS2Trader (o cualquier otra fuente manual)

```bash
cp backend/data/price-overrides.example.json backend/data/price-overrides.json
```

Edita ese archivo con `{ "market_hash_name exacto": precio }`. Se vuelve a leer
automáticamente cuando lo modificas - no hace falta reiniciar el servidor.

## Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 (proxyea /api hacia el backend en :3001)
```

Páginas:

- **Portafolio**: valor total, costo, ganancia/pérdida y la lista de tus objetos
  con precio actual, float y P&L individual.
- **Operaciones**: historial de compras/ventas/trades, con alta/edición/borrado manual.
- **Alertas**: configuración del umbral de "movimiento sospechoso" e historial
  de alertas disparadas.
- **Chat con Claude**: cuéntale en español lo que compraste/vendiste/intercambiaste
  y él registra la operación, actualiza tus holdings, y puede consultar tu
  resumen, historial de precios, etc.

## Cómo funciona la detección de manipulación

Cada ciclo de sincronización guarda una "foto" del precio de cada objeto que
posees. El motor de alertas (`backend/src/services/alertEngine.js`) compara el
precio más reciente contra el precio de hace `ALERT_WINDOW_HOURS` horas (24 por
defecto); si el cambio supera `ALERT_THRESHOLD_PERCENT` (15% por defecto) en
cualquier dirección, se registra una alerta y se notifica por Discord (como
máximo una vez al día por objeto, para no saturarte). Esto **no prueba**
manipulación - es una señal para que revises volumen/contexto antes de operar.

## El agente de Claude

El backend expone `POST /api/chat`, que mantiene una conversación con Claude
usando *tool use* (`backend/src/services/claudeAgent.js`). Claude tiene
herramientas para:

- Registrar/editar/eliminar **operaciones** (`add_trade`, `edit_trade`, `delete_trade`, `list_trades`)
- Mantener sincronizados tus **holdings actuales** (`add_item`, `update_item`, `remove_item`, `list_items`)
- Consultar tu **resumen** (`get_portfolio_summary`) y el **historial de precios** (`get_price_history`)

El system prompt le indica que cuando registres una compra/venta/trade, debe
registrar la operación **y** reflejar el cambio en tus holdings en el mismo
turno - así el dashboard queda al día sin que tengas que tocar nada más.

## Cómo encontrar tu STEAM_ID, inspect links, etc.

- **SteamID64**: entra a tu perfil de Steam y usa una herramienta como
  [steamid.io](https://steamid.io) (o el panel de cualquier extensión de trading).
- **Inventario público**: Steam → Editar perfil → Privacidad → Detalles del
  inventario en "Público" (necesario para sincronizar floats/inventario).
- **market_hash_name exacto**: es el nombre que ves en el Mercado de la
  Comunidad de Steam, incluyendo el desgaste entre paréntesis, p. ej.
  `AK-47 | Redline (Field-Tested)`.

## Aviso

Este proyecto consume datos públicos de Steam y de CSFloat con fines personales
de seguimiento de portafolio; no está afiliado a Valve ni reemplaza el análisis
de mercado profesional. Respeta los límites de tasa de las fuentes que uses.
