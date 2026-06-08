export function formatMoney(value, currency = 'USD') {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(value)
}

export function formatPercent(value, { signed = true } = {}) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const sign = signed && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}

export function formatFloat(value) {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toFixed(4)
}

/**
 * Timestamps come from SQLite as "YYYY-MM-DD HH:MM:SS" (UTC, no timezone
 * marker) or already as ISO strings with an offset/Z. Normalize both into a
 * Date without ever double-appending a timezone marker.
 */
export function parseTimestamp(value) {
  if (!value) return null
  const hasOffset = /[zZ]|[+-]\d{2}:?\d{2}$/.test(value)
  const iso = value.includes('T') ? value : value.replace(' ', 'T')
  const date = new Date(hasOffset ? iso : `${iso}Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatDate(value) {
  const date = parseTimestamp(value)
  if (!date) return value ?? '—'
  return date.toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })
}

const WEAR_RANGES = [
  { max: 0.07, label: 'Factory New' },
  { max: 0.15, label: 'Minimal Wear' },
  { max: 0.38, label: 'Field-Tested' },
  { max: 0.45, label: 'Well-Worn' },
  { max: 1, label: 'Battle-Scarred' },
]

export function wearFromFloat(value) {
  if (value === null || value === undefined) return null
  return WEAR_RANGES.find((range) => value <= range.max)?.label ?? null
}

export function changeColor(value) {
  if (value === null || value === undefined) return 'text-gray-400'
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-red-400'
  return 'text-gray-400'
}
