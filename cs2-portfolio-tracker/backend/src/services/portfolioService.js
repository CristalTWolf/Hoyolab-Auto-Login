import { all, get, run } from '../db/client.js';

/** Latest known price (from price_snapshots) for a market_hash_name, or null. */
export function latestPrice(marketHashName) {
  return get(
    `SELECT price, currency, source, fetched_at AS fetchedAt
       FROM price_snapshots
      WHERE market_hash_name = ?
      ORDER BY fetched_at DESC
      LIMIT 1`,
    [marketHashName]
  ) ?? null;
}

/** Most recent price snapshot at or before `beforeIso` for a market_hash_name, or null. */
export function priceAt(marketHashName, beforeIso) {
  return get(
    `SELECT price, fetched_at AS fetchedAt
       FROM price_snapshots
      WHERE market_hash_name = ? AND fetched_at <= ?
      ORDER BY fetched_at DESC
      LIMIT 1`,
    [marketHashName, beforeIso]
  ) ?? null;
}

export function priceHistory(marketHashName, sinceIso) {
  return all(
    `SELECT price, currency, source, fetched_at AS fetchedAt
       FROM price_snapshots
      WHERE market_hash_name = ? AND fetched_at >= ?
      ORDER BY fetched_at ASC`,
    [marketHashName, sinceIso]
  );
}

/** Distinct item names currently held (quantity > 0), used by the price sync job. */
export function heldItemNames() {
  return all(
    `SELECT DISTINCT market_hash_name AS marketHashName
       FROM items
      WHERE quantity > 0
      ORDER BY market_hash_name`
  ).map((r) => r.marketHashName);
}

function rowToItem(row) {
  if (!row) return null;
  const latest = latestPrice(row.market_hash_name);
  const currentPrice = latest?.price ?? null;
  const currentValue = currentPrice !== null ? currentPrice * row.quantity : null;
  const costBasis = row.acquired_price !== null ? row.acquired_price * row.quantity : null;
  const profitLoss =
    currentValue !== null && costBasis !== null ? currentValue - costBasis : null;

  return {
    id: row.id,
    marketHashName: row.market_hash_name,
    assetId: row.asset_id,
    floatValue: row.float_value,
    paintSeed: row.paint_seed,
    paintIndex: row.paint_index,
    acquiredPrice: row.acquired_price,
    acquiredAt: row.acquired_at,
    quantity: row.quantity,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    currentPrice,
    currentValue,
    costBasis,
    profitLoss,
    priceCurrency: latest?.currency ?? 'USD',
    priceSource: latest?.source ?? null,
    priceFetchedAt: latest?.fetchedAt ?? null,
  };
}

export function listItems() {
  return all(`SELECT * FROM items ORDER BY market_hash_name ASC`).map(rowToItem);
}

export function getItem(id) {
  return rowToItem(get(`SELECT * FROM items WHERE id = ?`, [id]));
}

export function createItem(input) {
  const result = run(
    `INSERT INTO items
       (market_hash_name, asset_id, float_value, paint_seed, paint_index, acquired_price, acquired_at, quantity, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      input.marketHashName,
      input.assetId ?? null,
      input.floatValue ?? null,
      input.paintSeed ?? null,
      input.paintIndex ?? null,
      input.acquiredPrice ?? null,
      input.acquiredAt ?? null,
      input.quantity ?? 1,
      input.notes ?? null,
    ]
  );
  return getItem(result.lastInsertRowid);
}

export function updateItem(id, patch) {
  const existing = get(`SELECT * FROM items WHERE id = ?`, [id]);
  if (!existing) return null;

  const next = {
    market_hash_name: patch.marketHashName ?? existing.market_hash_name,
    asset_id: patch.assetId ?? existing.asset_id,
    float_value: patch.floatValue ?? existing.float_value,
    paint_seed: patch.paintSeed ?? existing.paint_seed,
    paint_index: patch.paintIndex ?? existing.paint_index,
    acquired_price: patch.acquiredPrice ?? existing.acquired_price,
    acquired_at: patch.acquiredAt ?? existing.acquired_at,
    quantity: patch.quantity ?? existing.quantity,
    notes: patch.notes ?? existing.notes,
  };

  run(
    `UPDATE items SET
       market_hash_name = ?, asset_id = ?, float_value = ?, paint_seed = ?, paint_index = ?,
       acquired_price = ?, acquired_at = ?, quantity = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      next.market_hash_name, next.asset_id, next.float_value, next.paint_seed, next.paint_index,
      next.acquired_price, next.acquired_at, next.quantity, next.notes, id,
    ]
  );
  return getItem(id);
}

export function deleteItem(id) {
  const result = run(`DELETE FROM items WHERE id = ?`, [id]);
  return result.changes > 0;
}

function rowToTrade(row) {
  if (!row) return null;
  return {
    id: row.id,
    type: row.type,
    marketHashName: row.market_hash_name,
    price: row.price,
    quantity: row.quantity,
    counterparty: row.counterparty,
    itemId: row.item_id,
    occurredAt: row.occurred_at,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function listTrades({ marketHashName, limit = 100 } = {}) {
  if (marketHashName) {
    return all(
      `SELECT * FROM trades WHERE market_hash_name = ? ORDER BY occurred_at DESC, id DESC LIMIT ?`,
      [marketHashName, limit]
    ).map(rowToTrade);
  }
  return all(`SELECT * FROM trades ORDER BY occurred_at DESC, id DESC LIMIT ?`, [limit]).map(rowToTrade);
}

export function getTrade(id) {
  return rowToTrade(get(`SELECT * FROM trades WHERE id = ?`, [id]));
}

export function createTrade(input) {
  const result = run(
    `INSERT INTO trades
       (type, market_hash_name, price, quantity, counterparty, item_id, occurred_at, notes, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
    [
      input.type,
      input.marketHashName,
      input.price ?? null,
      input.quantity ?? 1,
      input.counterparty ?? null,
      input.itemId ?? null,
      input.occurredAt,
      input.notes ?? null,
    ]
  );
  return getTrade(result.lastInsertRowid);
}

export function updateTrade(id, patch) {
  const existing = get(`SELECT * FROM trades WHERE id = ?`, [id]);
  if (!existing) return null;

  const next = {
    type: patch.type ?? existing.type,
    market_hash_name: patch.marketHashName ?? existing.market_hash_name,
    price: patch.price ?? existing.price,
    quantity: patch.quantity ?? existing.quantity,
    counterparty: patch.counterparty ?? existing.counterparty,
    item_id: patch.itemId ?? existing.item_id,
    occurred_at: patch.occurredAt ?? existing.occurred_at,
    notes: patch.notes ?? existing.notes,
  };

  run(
    `UPDATE trades SET
       type = ?, market_hash_name = ?, price = ?, quantity = ?, counterparty = ?,
       item_id = ?, occurred_at = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [
      next.type, next.market_hash_name, next.price, next.quantity, next.counterparty,
      next.item_id, next.occurred_at, next.notes, id,
    ]
  );
  return getTrade(id);
}

export function deleteTrade(id) {
  const result = run(`DELETE FROM trades WHERE id = ?`, [id]);
  return result.changes > 0;
}

/** Aggregate snapshot of the whole portfolio: total value, cost basis, P&L, item count. */
export function portfolioSummary() {
  const items = listItems();
  let totalValue = 0;
  let totalCost = 0;
  let pricedCount = 0;

  for (const item of items) {
    if (item.currentValue !== null) {
      totalValue += item.currentValue;
      pricedCount += 1;
    }
    if (item.costBasis !== null) totalCost += item.costBasis;
  }

  return {
    itemCount: items.length,
    pricedItemCount: pricedCount,
    totalValue,
    totalCostBasis: totalCost,
    profitLoss: totalValue - totalCost,
    profitLossPercent: totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : null,
    items,
  };
}
