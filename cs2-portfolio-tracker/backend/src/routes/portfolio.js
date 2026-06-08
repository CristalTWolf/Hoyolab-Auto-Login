import { Router } from 'express';
import * as portfolio from '../services/portfolioService.js';

export const portfolioRouter = Router();

portfolioRouter.get('/summary', (req, res) => {
  res.json(portfolio.portfolioSummary());
});

portfolioRouter.get('/items', (req, res) => {
  res.json(portfolio.listItems());
});

portfolioRouter.get('/items/:id', (req, res) => {
  const item = portfolio.getItem(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

portfolioRouter.post('/items', (req, res) => {
  const { marketHashName } = req.body ?? {};
  if (!marketHashName) return res.status(400).json({ error: 'marketHashName is required' });
  res.status(201).json(portfolio.createItem(req.body));
});

portfolioRouter.put('/items/:id', (req, res) => {
  const item = portfolio.updateItem(Number(req.params.id), req.body ?? {});
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

portfolioRouter.delete('/items/:id', (req, res) => {
  const ok = portfolio.deleteItem(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Item not found' });
  res.status(204).end();
});

portfolioRouter.get('/items/:id/history', (req, res) => {
  const item = portfolio.getItem(Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Item not found' });

  const days = Number(req.query.days) || 30;
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  res.json(portfolio.priceHistory(item.marketHashName, since));
});
