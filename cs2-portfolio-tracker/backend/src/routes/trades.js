import { Router } from 'express';
import * as portfolio from '../services/portfolioService.js';

export const tradesRouter = Router();

tradesRouter.get('/', (req, res) => {
  const { marketHashName, limit } = req.query;
  res.json(portfolio.listTrades({ marketHashName, limit: limit ? Number(limit) : undefined }));
});

tradesRouter.get('/:id', (req, res) => {
  const trade = portfolio.getTrade(Number(req.params.id));
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  res.json(trade);
});

tradesRouter.post('/', (req, res) => {
  const { type, marketHashName, occurredAt } = req.body ?? {};
  if (!type || !marketHashName || !occurredAt) {
    return res.status(400).json({ error: 'type, marketHashName and occurredAt are required' });
  }
  res.status(201).json(portfolio.createTrade(req.body));
});

tradesRouter.put('/:id', (req, res) => {
  const trade = portfolio.updateTrade(Number(req.params.id), req.body ?? {});
  if (!trade) return res.status(404).json({ error: 'Trade not found' });
  res.json(trade);
});

tradesRouter.delete('/:id', (req, res) => {
  const ok = portfolio.deleteTrade(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Trade not found' });
  res.status(204).end();
});
