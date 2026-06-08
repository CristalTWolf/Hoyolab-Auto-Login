import { useState } from 'react'

const TYPES = [
  { value: 'buy', label: 'Compra' },
  { value: 'sell', label: 'Venta' },
  { value: 'trade_in', label: 'Trade (recibido)' },
  { value: 'trade_out', label: 'Trade (entregado)' },
]

const EMPTY = {
  type: 'buy',
  marketHashName: '',
  price: '',
  quantity: 1,
  occurredAt: new Date().toISOString().slice(0, 10),
  counterparty: '',
  notes: '',
}

export default function TradeForm({ initial, onSubmit, onCancel, submitLabel = 'Guardar' }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await onSubmit({
        ...form,
        price: form.price === '' ? null : Number(form.price),
        quantity: Number(form.quantity) || 1,
      })
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="block text-gray-400 mb-1">Tipo</span>
          <select
            value={form.type}
            onChange={(e) => update('type', e.target.value)}
            className="w-full rounded-md bg-gray-800 border border-gray-700 px-2 py-1.5"
          >
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="block text-gray-400 mb-1">Fecha</span>
          <input
            type="date"
            value={form.occurredAt?.slice(0, 10) ?? ''}
            onChange={(e) => update('occurredAt', e.target.value)}
            required
            className="w-full rounded-md bg-gray-800 border border-gray-700 px-2 py-1.5"
          />
        </label>
      </div>

      <label className="text-sm block">
        <span className="block text-gray-400 mb-1">Nombre exacto en Steam (market_hash_name)</span>
        <input
          type="text"
          value={form.marketHashName}
          onChange={(e) => update('marketHashName', e.target.value)}
          placeholder="AK-47 | Redline (Field-Tested)"
          required
          className="w-full rounded-md bg-gray-800 border border-gray-700 px-2 py-1.5"
        />
      </label>

      <div className="grid grid-cols-3 gap-3">
        <label className="text-sm">
          <span className="block text-gray-400 mb-1">Precio (USD)</span>
          <input
            type="number" step="0.01" min="0"
            value={form.price}
            onChange={(e) => update('price', e.target.value)}
            placeholder="opcional"
            className="w-full rounded-md bg-gray-800 border border-gray-700 px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-400 mb-1">Cantidad</span>
          <input
            type="number" min="1"
            value={form.quantity}
            onChange={(e) => update('quantity', e.target.value)}
            className="w-full rounded-md bg-gray-800 border border-gray-700 px-2 py-1.5"
          />
        </label>
        <label className="text-sm">
          <span className="block text-gray-400 mb-1">Contraparte</span>
          <input
            type="text"
            value={form.counterparty ?? ''}
            onChange={(e) => update('counterparty', e.target.value)}
            placeholder="opcional"
            className="w-full rounded-md bg-gray-800 border border-gray-700 px-2 py-1.5"
          />
        </label>
      </div>

      <label className="text-sm block">
        <span className="block text-gray-400 mb-1">Notas</span>
        <input
          type="text"
          value={form.notes ?? ''}
          onChange={(e) => update('notes', e.target.value)}
          className="w-full rounded-md bg-gray-800 border border-gray-700 px-2 py-1.5"
        />
      </label>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-3 py-1.5 rounded-md text-sm text-gray-400 hover:text-white">
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="px-3 py-1.5 rounded-md text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
        >
          {submitting ? 'Guardando…' : submitLabel}
        </button>
      </div>
    </form>
  )
}
