import { Router } from 'express';
import { config } from '../config.js';
import { listAlerts } from '../services/alertEngine.js';
import { syncPrices } from '../services/priceSync.js';

export const alertsRouter = Router();

alertsRouter.get('/', (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : undefined;
  res.json(listAlerts({ limit }));
});

alertsRouter.get('/config', (req, res) => {
  res.json({
    thresholdPercent: config.alertThresholdPercent,
    windowHours: config.alertWindowHours,
    discordConfigured: Boolean(config.discordWebhookUrl),
  });
});

/** Manually trigger a price sync + alert check (handy for testing your webhook). */
alertsRouter.post('/sync-now', async (req, res) => {
  try {
    const result = await syncPrices();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
