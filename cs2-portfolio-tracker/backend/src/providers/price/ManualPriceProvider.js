import { readFileSync, watchFile } from 'node:fs';
import { PriceProvider } from './PriceProvider.js';

/**
 * Reads prices from a local JSON file you maintain yourself - the escape hatch
 * for "there's no free price API except an extension's data".
 *
 * Point PRICE_OVERRIDES_PATH at a file shaped like:
 *   { "AK-47 | Redline (Field-Tested)": 14.32, "AWP | Asiimov (Battle-Scarred)": 41.0 }
 *
 * You can populate/update that file however you like - e.g. by exporting your
 * inventory valuation from the CS2Trader browser extension (it shows per-item
 * prices from several marketplaces) and pasting the numbers in. The file is
 * re-read whenever it changes on disk, so updates apply on the next sync tick
 * without restarting the server.
 */
export class ManualPriceProvider extends PriceProvider {
  constructor(filePath) {
    super();
    this.filePath = filePath;
    this._prices = {};
    this._load();
    watchFile(this.filePath, { interval: 5000 }, () => this._load());
  }

  get name() {
    return 'manual_override';
  }

  _load() {
    try {
      const raw = readFileSync(this.filePath, 'utf-8');
      this._prices = JSON.parse(raw);
    } catch {
      this._prices = {};
    }
  }

  async getPrice(marketHashName) {
    const price = this._prices[marketHashName];
    if (typeof price !== 'number' || !Number.isFinite(price)) return null;
    return { price, currency: 'USD', source: this.name };
  }
}
