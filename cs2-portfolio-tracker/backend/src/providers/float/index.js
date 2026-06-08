import { config } from '../../config.js';
import { CSFloatProvider } from './CSFloatProvider.js';

/** Float lookups always go through CSFloat - it's the only free, reliable inspect-link float source. */
export const floatProvider = new CSFloatProvider({ apiKey: config.csFloatApiKey });
