import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { config } from '../../config.js';
import { ChainedPriceProvider } from './ChainedPriceProvider.js';
import { ManualPriceProvider } from './ManualPriceProvider.js';
import { SteamMarketPriceProvider } from './SteamMarketPriceProvider.js';

const overridesPath = resolve(process.cwd(), config.priceOverridesPath);
const providers = [];

if (existsSync(overridesPath)) {
  providers.push(new ManualPriceProvider(overridesPath));
  console.log(`[prices] manual overrides active from ${overridesPath} (checked first)`);
}

providers.push(new SteamMarketPriceProvider({ currency: config.steamCurrency }));

/**
 * The price provider used by the rest of the app. Manual overrides (if the
 * file exists) win, falling back to the free Steam Community Market endpoint.
 */
export const priceProvider = new ChainedPriceProvider(providers);
