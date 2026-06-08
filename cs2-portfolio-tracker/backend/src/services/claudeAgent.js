import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config.js';
import * as portfolio from './portfolioService.js';

const SYSTEM_PROMPT = `Eres el asistente del portafolio de inventario de CS2 del usuario.
Hablas español por defecto (sigue el idioma del usuario si escribe en otro).

Puedes:
- Registrar operaciones (compras, ventas, trades) con la herramienta add_trade, y editarlas/eliminarlas.
- Mantener sincronizada la lista de objetos que el usuario posee actualmente (holdings) con
  add_item / update_item / remove_item: cuando el usuario COMPRA o recibe algo en un trade, debe
  quedar reflejado como holding; cuando VENDE o entrega algo en un trade, hay que reducir o quitar
  ese holding.
- Consultar el historial de operaciones, el resumen del portafolio (valor total, costo, P&L) y el
  historial de precios de un objeto.

Reglas importantes:
- Usa siempre el "market_hash_name" exacto de Steam (ej. "AK-47 | Redline (Field-Tested)",
  incluyendo el desgaste entre paréntesis). Si el usuario no lo da exacto, infiere el nombre más
  probable y dilo explícitamente para que pueda corregirte.
- Cuando el usuario diga que compró/vendió/intercambió algo, registra la operación (add_trade) Y
  actualiza los holdings correspondientes (add_item/update_item/remove_item) en la misma respuesta.
- Las fechas van en formato ISO 8601 (YYYY-MM-DD o con hora). Si el usuario no da fecha, usa "ahora".
- Antes de eliminar algo (delete_trade/remove_item), confirma que entendiste bien cuál es - si hay
  ambigüedad (varias operaciones similares), pregunta antes de borrar.
- Sé breve y concreto en tus respuestas; confirma qué hiciste con números concretos (precios, P&L).`;

const TOOLS = [
  {
    name: 'add_trade',
    description: 'Registra una operación (compra, venta o trade) en el historial.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['buy', 'sell', 'trade_in', 'trade_out'], description: 'buy=compra, sell=venta, trade_in=recibido en trade, trade_out=entregado en trade' },
        market_hash_name: { type: 'string', description: 'Nombre exacto de Steam, ej. "AK-47 | Redline (Field-Tested)"' },
        price: { type: 'number', description: 'Precio en USD involucrado (omitir si fue un trade sin dinero de por medio)' },
        quantity: { type: 'integer', description: 'Cantidad (por defecto 1)' },
        occurred_at: { type: 'string', description: 'Fecha/hora ISO 8601 en que ocurrió, ej. "2026-06-08"' },
        counterparty: { type: 'string', description: 'Con quién se hizo el trade/operación (opcional)' },
        notes: { type: 'string', description: 'Notas adicionales (opcional)' },
      },
      required: ['type', 'market_hash_name', 'occurred_at'],
    },
  },
  {
    name: 'edit_trade',
    description: 'Edita una operación existente por su ID.',
    input_schema: {
      type: 'object',
      properties: {
        trade_id: { type: 'integer' },
        type: { type: 'string', enum: ['buy', 'sell', 'trade_in', 'trade_out'] },
        market_hash_name: { type: 'string' },
        price: { type: 'number' },
        quantity: { type: 'integer' },
        occurred_at: { type: 'string' },
        counterparty: { type: 'string' },
        notes: { type: 'string' },
      },
      required: ['trade_id'],
    },
  },
  {
    name: 'delete_trade',
    description: 'Elimina una operación del historial por su ID.',
    input_schema: {
      type: 'object',
      properties: { trade_id: { type: 'integer' } },
      required: ['trade_id'],
    },
  },
  {
    name: 'list_trades',
    description: 'Lista operaciones recientes, opcionalmente filtradas por nombre de objeto.',
    input_schema: {
      type: 'object',
      properties: {
        market_hash_name: { type: 'string' },
        limit: { type: 'integer', description: 'Máximo de resultados (por defecto 20)' },
      },
    },
  },
  {
    name: 'add_item',
    description: 'Agrega un objeto a los holdings actuales del portafolio (lo que el usuario posee ahora mismo).',
    input_schema: {
      type: 'object',
      properties: {
        market_hash_name: { type: 'string' },
        quantity: { type: 'integer', description: 'Por defecto 1' },
        acquired_price: { type: 'number', description: 'Precio pagado por unidad (para calcular P&L)' },
        acquired_at: { type: 'string', description: 'Fecha ISO en que se adquirió' },
        float_value: { type: 'number', description: 'Valor de desgaste (float) entre 0 y 1, si se conoce' },
        notes: { type: 'string' },
      },
      required: ['market_hash_name'],
    },
  },
  {
    name: 'update_item',
    description: 'Actualiza un holding existente por su ID (ej. cambiar cantidad, precio de adquisición, float, notas).',
    input_schema: {
      type: 'object',
      properties: {
        item_id: { type: 'integer' },
        market_hash_name: { type: 'string' },
        quantity: { type: 'integer' },
        acquired_price: { type: 'number' },
        acquired_at: { type: 'string' },
        float_value: { type: 'number' },
        notes: { type: 'string' },
      },
      required: ['item_id'],
    },
  },
  {
    name: 'remove_item',
    description: 'Elimina un holding del portafolio por su ID (ej. porque el usuario lo vendió o lo entregó por completo en un trade).',
    input_schema: {
      type: 'object',
      properties: { item_id: { type: 'integer' } },
      required: ['item_id'],
    },
  },
  {
    name: 'list_items',
    description: 'Lista los holdings actuales del portafolio con su precio actual, valor y P&L.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_portfolio_summary',
    description: 'Obtiene el resumen del portafolio: valor total, costo total, ganancia/pérdida y cantidad de objetos.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_price_history',
    description: 'Obtiene el historial reciente de precios de un objeto.',
    input_schema: {
      type: 'object',
      properties: {
        market_hash_name: { type: 'string' },
        days: { type: 'integer', description: 'Cuántos días hacia atrás (por defecto 7)' },
      },
      required: ['market_hash_name'],
    },
  },
];

function executeTool(name, input) {
  switch (name) {
    case 'add_trade':
      return portfolio.createTrade({
        type: input.type,
        marketHashName: input.market_hash_name,
        price: input.price,
        quantity: input.quantity,
        occurredAt: input.occurred_at,
        counterparty: input.counterparty,
        notes: input.notes,
      });

    case 'edit_trade': {
      const updated = portfolio.updateTrade(input.trade_id, {
        type: input.type,
        marketHashName: input.market_hash_name,
        price: input.price,
        quantity: input.quantity,
        occurredAt: input.occurred_at,
        counterparty: input.counterparty,
        notes: input.notes,
      });
      return updated ?? { error: `No existe ninguna operación con id ${input.trade_id}` };
    }

    case 'delete_trade': {
      const deleted = portfolio.deleteTrade(input.trade_id);
      return deleted ? { deleted: true } : { error: `No existe ninguna operación con id ${input.trade_id}` };
    }

    case 'list_trades':
      return portfolio.listTrades({ marketHashName: input.market_hash_name, limit: input.limit ?? 20 });

    case 'add_item':
      return portfolio.createItem({
        marketHashName: input.market_hash_name,
        quantity: input.quantity,
        acquiredPrice: input.acquired_price,
        acquiredAt: input.acquired_at,
        floatValue: input.float_value,
        notes: input.notes,
      });

    case 'update_item': {
      const updated = portfolio.updateItem(input.item_id, {
        marketHashName: input.market_hash_name,
        quantity: input.quantity,
        acquiredPrice: input.acquired_price,
        acquiredAt: input.acquired_at,
        floatValue: input.float_value,
        notes: input.notes,
      });
      return updated ?? { error: `No existe ningún holding con id ${input.item_id}` };
    }

    case 'remove_item': {
      const deleted = portfolio.deleteItem(input.item_id);
      return deleted ? { deleted: true } : { error: `No existe ningún holding con id ${input.item_id}` };
    }

    case 'list_items':
      return portfolio.listItems();

    case 'get_portfolio_summary': {
      const summary = portfolio.portfolioSummary();
      // Don't ship the full item list twice - list_items covers that.
      const { items, ...rest } = summary;
      return rest;
    }

    case 'get_price_history': {
      const days = input.days ?? 7;
      const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
      return portfolio.priceHistory(input.market_hash_name, since);
    }

    default:
      return { error: `Herramienta desconocida: ${name}` };
  }
}

let _client = null;
function client() {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY no está configurada - el chat con Claude está deshabilitado');
  }
  if (!_client) _client = new Anthropic({ apiKey: config.anthropicApiKey });
  return _client;
}

const MAX_TOOL_ROUNDS = 8;

/**
 * Runs one turn of the agent loop. `history` is an array of
 * { role: 'user' | 'assistant', content: string | Array } Anthropic-format
 * messages (excluding the new user message, which is appended here).
 *
 * Returns { reply, history } where `history` includes the new turn and can be
 * persisted/passed back in for the next message.
 */
export async function runAgentTurn(history, userMessage) {
  const messages = [...history, { role: 'user', content: userMessage }];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const response = await client().messages.create({
      model: config.anthropicModel,
      max_tokens: 1536,
      system: SYSTEM_PROMPT,
      tools: TOOLS,
      messages,
    });

    messages.push({ role: 'assistant', content: response.content });

    if (response.stop_reason !== 'tool_use') {
      const reply = response.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n')
        .trim();
      return { reply, history: messages };
    }

    const toolResults = [];
    for (const block of response.content) {
      if (block.type !== 'tool_use') continue;
      let output;
      try {
        output = executeTool(block.name, block.input ?? {});
      } catch (err) {
        output = { error: err.message };
      }
      toolResults.push({
        type: 'tool_result',
        tool_use_id: block.id,
        content: JSON.stringify(output ?? null),
      });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  return {
    reply: 'Hice varios cambios pero alcancé el límite de pasos por turno - revisa el portafolio y dime si falta algo.',
    history: messages,
  };
}
