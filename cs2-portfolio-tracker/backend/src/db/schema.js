export const SCHEMA = `
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_hash_name TEXT NOT NULL,
  asset_id TEXT,
  float_value REAL,
  paint_seed INTEGER,
  paint_index INTEGER,
  acquired_price REAL,
  acquired_at TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS trades (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL CHECK (type IN ('buy', 'sell', 'trade_in', 'trade_out')),
  market_hash_name TEXT NOT NULL,
  price REAL,
  quantity INTEGER NOT NULL DEFAULT 1,
  counterparty TEXT,
  item_id INTEGER REFERENCES items(id) ON DELETE SET NULL,
  occurred_at TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS price_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_hash_name TEXT NOT NULL,
  price REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  source TEXT NOT NULL,
  fetched_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_price_snapshots_name_time
  ON price_snapshots (market_hash_name, fetched_at);

CREATE TABLE IF NOT EXISTS alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  market_hash_name TEXT NOT NULL,
  change_percent REAL NOT NULL,
  price_from REAL NOT NULL,
  price_to REAL NOT NULL,
  window_hours INTEGER NOT NULL,
  triggered_at TEXT NOT NULL DEFAULT (datetime('now')),
  notified INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_alerts_name_time
  ON alerts (market_hash_name, triggered_at);
`;
