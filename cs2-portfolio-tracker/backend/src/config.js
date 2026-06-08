import 'dotenv/config';

function num(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const config = {
  port: num(process.env.PORT, 3001),
  databasePath: process.env.DATABASE_PATH || './data/portfolio.db',
  // Optional JSON file of { "market_hash_name": price } you maintain by hand
  // (e.g. pasted from the CS2Trader extension) - checked before live sources.
  priceOverridesPath: process.env.PRICE_OVERRIDES_PATH || './data/price-overrides.json',

  steamId: process.env.STEAM_ID || '',
  steamApiKey: process.env.STEAM_API_KEY || '',
  steamCurrency: num(process.env.STEAM_CURRENCY, 1),

  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  anthropicModel: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-6',

  csFloatApiKey: process.env.CSFLOAT_API_KEY || '',

  priceSyncCron: process.env.PRICE_SYNC_CRON || '*/15 * * * *',

  alertThresholdPercent: num(process.env.ALERT_THRESHOLD_PERCENT, 15),
  alertWindowHours: num(process.env.ALERT_WINDOW_HOURS, 24),

  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
};
