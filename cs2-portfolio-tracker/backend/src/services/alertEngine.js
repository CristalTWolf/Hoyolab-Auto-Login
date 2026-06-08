import { all, get, run } from '../db/client.js';
import { config } from '../config.js';
import { priceAt, latestPrice } from './portfolioService.js';
import { notifyDiscord, formatAlertMessage } from './notifier.js';

/**
 * Detects abrupt price moves ("manipulation"-style spikes/dumps) by comparing
 * the latest price snapshot against the price ~ALERT_WINDOW_HOURS ago, for
 * every item the user holds. Triggers (and notifies) at most once per item per
 * day so a sustained move doesn't spam you every sync cycle.
 */
export async function checkAlertsForItem(marketHashName) {
  const latest = latestPrice(marketHashName);
  if (!latest) return null;

  const windowStart = new Date(Date.now() - config.alertWindowHours * 60 * 60 * 1000).toISOString();
  const baseline = priceAt(marketHashName, windowStart);
  if (!baseline || baseline.price <= 0) return null;

  const changePercent = ((latest.price - baseline.price) / baseline.price) * 100;
  if (Math.abs(changePercent) < config.alertThresholdPercent) return null;

  if (alreadyAlertedToday(marketHashName)) return null;

  const alert = {
    marketHashName,
    changePercent,
    priceFrom: baseline.price,
    priceTo: latest.price,
    windowHours: config.alertWindowHours,
  };

  const result = run(
    `INSERT INTO alerts (market_hash_name, change_percent, price_from, price_to, window_hours, notified)
     VALUES (?, ?, ?, ?, ?, 0)`,
    [alert.marketHashName, alert.changePercent, alert.priceFrom, alert.priceTo, alert.windowHours]
  );

  await notifyDiscord(formatAlertMessage(alert));
  run(`UPDATE alerts SET notified = 1 WHERE id = ?`, [result.lastInsertRowid]);

  return { id: result.lastInsertRowid, ...alert };
}

function alreadyAlertedToday(marketHashName) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const row = get(
    `SELECT id FROM alerts WHERE market_hash_name = ? AND triggered_at >= ? LIMIT 1`,
    [marketHashName, since]
  );
  return Boolean(row);
}

export function listAlerts({ limit = 50 } = {}) {
  return all(
    `SELECT id, market_hash_name AS marketHashName, change_percent AS changePercent,
            price_from AS priceFrom, price_to AS priceTo, window_hours AS windowHours,
            triggered_at AS triggeredAt, notified
       FROM alerts
      ORDER BY triggered_at DESC
      LIMIT ?`,
    [limit]
  );
}
