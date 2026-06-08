import { PriceProvider } from './PriceProvider.js';

const CS2_APP_ID = 730;
const CURRENCY_CODES = { 1: 'USD', 2: 'GBP', 3: 'EUR', 5: 'EUR', 18: 'EUR', 24: 'EUR' };

/**
 * Free, key-less price source: Steam's own Community Market "price overview"
 * endpoint. This is the only universally-free option (no account, no API key),
 * which is why it's the default - but it is aggressively rate limited by Steam,
 * so requests are serialized with a minimum delay between them.
 *
 * Swap this out (see providers/price/index.js) for a paid aggregator, or for
 * data exported from the CS2Trader extension, without touching the rest of
 * the app - they all speak the same PriceProvider contract.
 */
export class SteamMarketPriceProvider extends PriceProvider {
  /**
   * @param {{ currency?: number, minDelayMs?: number, fetchImpl?: typeof fetch }} [opts]
   */
  constructor({ currency = 1, minDelayMs = 1500, fetchImpl = fetch } = {}) {
    super();
    this.currency = currency;
    this.minDelayMs = minDelayMs;
    this.fetchImpl = fetchImpl;
    this._queue = Promise.resolve();
    this._lastRequestAt = 0;
  }

  get name() {
    return 'steam_market';
  }

  async getPrice(marketHashName) {
    return this._enqueue(() => this._fetchPrice(marketHashName));
  }

  /** Serializes requests and enforces a minimum delay so we don't get rate limited / IP banned. */
  _enqueue(task) {
    const run = this._queue.then(async () => {
      const wait = this.minDelayMs - (Date.now() - this._lastRequestAt);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      this._lastRequestAt = Date.now();
      return task();
    });
    // Keep the queue alive even if this particular task rejects.
    this._queue = run.catch(() => {});
    return run;
  }

  async _fetchPrice(marketHashName) {
    const url = new URL('https://steamcommunity.com/market/priceoverview/');
    url.searchParams.set('appid', String(CS2_APP_ID));
    url.searchParams.set('currency', String(this.currency));
    url.searchParams.set('market_hash_name', marketHashName);

    const response = await this.fetchImpl(url, {
      headers: { Accept: 'application/json' },
    });

    if (response.status === 429) {
      throw new Error('Steam Market rate limit hit (HTTP 429) - back off and retry later');
    }
    if (!response.ok) {
      throw new Error(`Steam Market request failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data || data.success !== true) return null;

    const raw = data.lowest_price || data.median_price;
    if (!raw) return null;

    const price = parsePriceString(raw);
    if (price === null) return null;

    return {
      price,
      currency: CURRENCY_CODES[this.currency] || 'USD',
      source: this.name,
    };
  }
}

/**
 * Steam returns localized strings like "$12.34", "12,34€" or "1.234,56 pуб." -
 * find the *last* separator (that's the decimal point) and strip the rest as
 * thousands separators before parsing.
 */
function parsePriceString(raw) {
  const numeric = raw.match(/[\d.,]+/)?.[0];
  if (!numeric) return null;

  const lastDot = numeric.lastIndexOf('.');
  const lastComma = numeric.lastIndexOf(',');
  const decimalIndex = Math.max(lastDot, lastComma);

  let normalized;
  if (decimalIndex === -1) {
    normalized = numeric;
  } else {
    const integerPart = numeric.slice(0, decimalIndex).replace(/[.,]/g, '');
    const fractionPart = numeric.slice(decimalIndex + 1).replace(/[.,]/g, '');
    normalized = `${integerPart}.${fractionPart}`;
  }

  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : null;
}
