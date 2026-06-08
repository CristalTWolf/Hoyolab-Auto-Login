import { PriceProvider } from './PriceProvider.js';

/**
 * Tries each provider in order and returns the first usable price. Useful for
 * e.g. preferring manual overrides (pasted from CS2Trader) and falling back to
 * the Steam Community Market for everything else.
 */
export class ChainedPriceProvider extends PriceProvider {
  constructor(providers) {
    super();
    this.providers = providers;
  }

  get name() {
    return 'chained';
  }

  async getPrice(marketHashName) {
    for (const provider of this.providers) {
      try {
        const result = await provider.getPrice(marketHashName);
        if (result) return result;
      } catch (err) {
        console.warn(`[prices] ${provider.name} failed for "${marketHashName}": ${err.message}`);
      }
    }
    return null;
  }
}
