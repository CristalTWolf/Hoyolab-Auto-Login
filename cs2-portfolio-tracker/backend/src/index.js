import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import './db/client.js'; // ensures the DB + schema are ready before routes mount

import { portfolioRouter } from './routes/portfolio.js';
import { tradesRouter } from './routes/trades.js';
import { alertsRouter } from './routes/alerts.js';
import { chatRouter } from './routes/chat.js';
import { inventoryRouter } from './routes/inventory.js';
import { startPriceSyncJob, syncPrices } from './services/priceSync.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

app.use('/api/portfolio', portfolioRouter);
app.use('/api/trades', tradesRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/inventory', inventoryRouter);

app.use((err, req, res, next) => {
  console.error('[server] unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(config.port, () => {
  console.log(`[server] CS2 portfolio backend listening on http://localhost:${config.port}`);

  startPriceSyncJob();
  // Kick off an initial sync shortly after boot so the dashboard isn't empty.
  setTimeout(() => {
    syncPrices().catch((err) => console.error('[priceSync] initial sync failed:', err));
  }, 5000);
});
