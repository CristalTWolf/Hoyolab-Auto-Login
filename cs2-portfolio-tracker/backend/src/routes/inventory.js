import { Router } from 'express';
import { config } from '../config.js';
import { fetchSteamInventory } from '../services/steamInventory.js';
import { floatProvider } from '../providers/float/index.js';

export const inventoryRouter = Router();

/**
 * Pulls the configured Steam inventory and returns it as-is (asset id, name,
 * icon, inspect link). This is a read-only preview - it does NOT touch your
 * portfolio. Use it to find market_hash_names/asset_ids to feed into
 * add_item, or as a quick "what do I actually own right now" check.
 */
inventoryRouter.get('/', async (req, res) => {
  if (!config.steamId) {
    return res.status(400).json({ error: 'STEAM_ID no está configurado' });
  }
  try {
    const items = await fetchSteamInventory(config.steamId);
    res.json(items);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

/** Looks up the float/paint-seed for a single item via its Steam inspect link. */
inventoryRouter.get('/float', async (req, res) => {
  const inspectLink = req.query.inspectLink;
  if (!inspectLink || typeof inspectLink !== 'string') {
    return res.status(400).json({ error: 'inspectLink query param is required' });
  }
  try {
    const result = await floatProvider.getFloat(inspectLink);
    if (!result) return res.status(404).json({ error: 'No se pudo obtener el float para ese item' });
    res.json(result);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});
