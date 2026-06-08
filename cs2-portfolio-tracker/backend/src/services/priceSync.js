import cron from 'node-cron';
import { run } from '../db/client.js';
import { config } from '../config.js';
import { priceProvider } from '../providers/price/index.js';
import { heldItemNames } from './portfolioService.js';
import { checkAlertsForItem } from './alertEngine.js';

let syncing = false;

/** Fetches the current price for every held item, stores a snapshot, and runs alert checks. */
export async function syncPrices() {
  if (syncing) {
    console.log('[priceSync] previous sync still running, skipping this tick');
    return { skipped: true };
  }
  syncing = true;

  const names = heldItemNames();
  const results = { updated: 0, failed: 0, alerts: [] };

  try {
    for (const marketHashName of names) {
      try {
        const quote = await priceProvider.getPrice(marketHashName);
        if (!quote) {
          results.failed += 1;
          continue;
        }

        run(
          `INSERT INTO price_snapshots (market_hash_name, price, currency, source) VALUES (?, ?, ?, ?)`,
          [marketHashName, quote.price, quote.currency, quote.source]
        );
        results.updated += 1;

        const alert = await checkAlertsForItem(marketHashName);
        if (alert) results.alerts.push(alert);
      } catch (err) {
        results.failed += 1;
        console.warn(`[priceSync] failed to update "${marketHashName}": ${err.message}`);
      }
    }
  } finally {
    syncing = false;
  }

  console.log(
    `[priceSync] done: ${results.updated} updated, ${results.failed} failed, ${results.alerts.length} alerts`
  );
  return results;
}

/** Schedules the recurring price sync according to PRICE_SYNC_CRON. */
export function startPriceSyncJob() {
  if (!cron.validate(config.priceSyncCron)) {
    console.warn(`[priceSync] invalid PRICE_SYNC_CRON "${config.priceSyncCron}", job not scheduled`);
    return null;
  }

  console.log(`[priceSync] scheduled with cron "${config.priceSyncCron}"`);
  return cron.schedule(config.priceSyncCron, () => {
    syncPrices().catch((err) => console.error('[priceSync] unexpected error:', err));
  });
}
