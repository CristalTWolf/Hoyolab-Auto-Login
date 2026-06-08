import { config } from '../config.js';

/** Sends a message to the configured Discord webhook. No-op if none is set. */
export async function notifyDiscord(content, { fetchImpl = fetch } = {}) {
  if (!config.discordWebhookUrl) return;

  try {
    const response = await fetchImpl(config.discordWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) {
      console.warn(`[notifier] Discord webhook returned HTTP ${response.status}`);
    }
  } catch (err) {
    console.warn(`[notifier] failed to send Discord webhook: ${err.message}`);
  }
}

export function formatAlertMessage({ marketHashName, priceFrom, priceTo, changePercent, windowHours }) {
  const direction = changePercent >= 0 ? '📈 subió' : '📉 bajó';
  const arrow = changePercent >= 0 ? '🟢' : '🔴';
  const pct = Math.abs(changePercent).toFixed(1);

  return (
    `${arrow} **Movimiento de precio sospechoso**\n` +
    `**${marketHashName}** ${direction} **${pct}%** en las últimas ${windowHours}h\n` +
    `$${priceFrom.toFixed(2)} → $${priceTo.toFixed(2)}\n` +
    `_Podría tratarse de manipulación de mercado - revisa el volumen antes de operar._`
  );
}
