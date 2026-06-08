const BASE = '/api';

async function request(path, options = {}) {
  const response = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (response.status === 204) return null;

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new Error(data?.error || `Request failed: HTTP ${response.status}`);
  }
  return data;
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) });
const put = (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) });
const del = (path) => request(path, { method: 'DELETE' });

export const api = {
  // Portfolio
  getSummary: () => get('/portfolio/summary'),
  getItems: () => get('/portfolio/items'),
  getItem: (id) => get(`/portfolio/items/${id}`),
  getItemHistory: (id, days = 30) => get(`/portfolio/items/${id}/history?days=${days}`),
  createItem: (item) => post('/portfolio/items', item),
  updateItem: (id, patch) => put(`/portfolio/items/${id}`, patch),
  deleteItem: (id) => del(`/portfolio/items/${id}`),

  // Trades
  getTrades: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return get(`/trades${qs ? `?${qs}` : ''}`);
  },
  createTrade: (trade) => post('/trades', trade),
  updateTrade: (id, patch) => put(`/trades/${id}`, patch),
  deleteTrade: (id) => del(`/trades/${id}`),

  // Alerts
  getAlerts: () => get('/alerts'),
  getAlertConfig: () => get('/alerts/config'),
  syncNow: () => post('/alerts/sync-now', {}),

  // Chat
  getChatStatus: () => get('/chat/status'),
  sendChatMessage: (message, history) => post('/chat', { message, history }),

  // Inventory
  getSteamInventory: () => get('/inventory'),
};
