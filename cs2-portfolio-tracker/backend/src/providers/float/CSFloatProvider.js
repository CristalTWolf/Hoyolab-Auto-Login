import { FloatProvider } from './FloatProvider.js';

/**
 * Looks up wear float / paint seed / paint index from a Steam "inspect in game"
 * link via CSFloat's lookup endpoint (https://docs.csfloat.com/). It works
 * without an API key for casual use (same as their browser extension), but
 * gets a much higher rate limit with one - set CSFLOAT_API_KEY if you have it.
 *
 * Inspect links look like:
 *   steam://rungame/730/.../+csgo_econ_action_preview%20S<steamid>A<assetid>D<d>
 * They're available on each item via the Steam inventory `actions` array.
 */
export class CSFloatProvider extends FloatProvider {
  /** @param {{ apiKey?: string, minDelayMs?: number, fetchImpl?: typeof fetch }} [opts] */
  constructor({ apiKey = '', minDelayMs = 2000, fetchImpl = fetch } = {}) {
    super();
    this.apiKey = apiKey;
    this.minDelayMs = minDelayMs;
    this.fetchImpl = fetchImpl;
    this._queue = Promise.resolve();
    this._lastRequestAt = 0;
  }

  get name() {
    return 'csfloat';
  }

  async getFloat(inspectLink) {
    if (!inspectLink) return null;
    return this._enqueue(() => this._fetch(inspectLink));
  }

  _enqueue(task) {
    const run = this._queue.then(async () => {
      const wait = this.minDelayMs - (Date.now() - this._lastRequestAt);
      if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
      this._lastRequestAt = Date.now();
      return task();
    });
    this._queue = run.catch(() => {});
    return run;
  }

  async _fetch(inspectLink) {
    const url = new URL('https://api.csfloat.com/');
    url.searchParams.set('url', inspectLink);

    const headers = { Accept: 'application/json' };
    if (this.apiKey) headers.Authorization = this.apiKey;

    const response = await this.fetchImpl(url, { headers });
    if (response.status === 429) {
      throw new Error('CSFloat rate limit hit (HTTP 429) - back off, or set CSFLOAT_API_KEY');
    }
    if (!response.ok) {
      throw new Error(`CSFloat lookup failed: HTTP ${response.status}`);
    }

    const data = await response.json();
    const item = data?.iteminfo;
    if (!item || typeof item.floatvalue !== 'number') return null;

    return {
      float: item.floatvalue,
      paintSeed: item.paintseed ?? null,
      paintIndex: item.paintindex ?? null,
    };
  }
}
