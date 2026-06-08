import { Router } from 'express';
import { config } from '../config.js';
import { runAgentTurn } from '../services/claudeAgent.js';

export const chatRouter = Router();

chatRouter.get('/status', (req, res) => {
  res.json({ enabled: Boolean(config.anthropicApiKey), model: config.anthropicModel });
});

chatRouter.post('/', async (req, res) => {
  const { message, history } = req.body ?? {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message (string) is required' });
  }
  if (!config.anthropicApiKey) {
    return res.status(503).json({ error: 'ANTHROPIC_API_KEY no está configurada en el servidor' });
  }

  try {
    const { reply, history: nextHistory } = await runAgentTurn(Array.isArray(history) ? history : [], message);
    res.json({ reply, history: nextHistory });
  } catch (err) {
    console.error('[chat] agent turn failed:', err);
    res.status(502).json({ error: `Error al hablar con Claude: ${err.message}` });
  }
});
