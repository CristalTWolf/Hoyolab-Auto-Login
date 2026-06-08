import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { SCHEMA } from './schema.js';
import { config } from '../config.js';

mkdirSync(dirname(config.databasePath), { recursive: true });

export const db = new DatabaseSync(config.databasePath);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec(SCHEMA);

/** Run a query and return all rows as plain objects. */
export function all(sql, params = []) {
  return db.prepare(sql).all(...params);
}

/** Run a query and return the first row (or undefined). */
export function get(sql, params = []) {
  return db.prepare(sql).get(...params);
}

/** Run an INSERT/UPDATE/DELETE and return { changes, lastInsertRowid }. */
export function run(sql, params = []) {
  const result = db.prepare(sql).run(...params);
  return { changes: result.changes, lastInsertRowid: result.lastInsertRowid };
}
