import { useState } from 'react'
import { api } from '../api/client.js'
import { useApi } from '../lib/useApi.js'
import AsyncSection from '../components/AsyncSection.jsx'
import TradeForm from '../components/TradeForm.jsx'
import { formatMoney } from '../lib/format.js'

const TYPE_LABELS = {
  buy: 'Compra',
  sell: 'Venta',
  trade_in: 'Trade ↓',
  trade_out: 'Trade ↑',
}

export default function Trades() {
  const { data: trades, loading, error, reload } = useApi(() => api.getTrades({ limit: '200' }))
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  async function handleCreate(values) {
    await api.createTrade(values)
    setShowForm(false)
    reload()
  }

  async function handleUpdate(id, values) {
    await api.updateTrade(id, values)
    setEditingId(null)
    reload()
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar esta operación?')) return
    await api.deleteTrade(id)
    reload()
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Operaciones</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="text-sm px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500"
        >
          {showForm ? 'Cerrar' : '+ Nueva operación'}
        </button>
      </div>

      {showForm && (
        <TradeForm onSubmit={handleCreate} onCancel={() => setShowForm(false)} submitLabel="Registrar" />
      )}

      <AsyncSection
        loading={loading}
        error={error}
        empty={trades && trades.length === 0}
        emptyMessage="No has registrado ninguna operación. Agrega una arriba o pídeselo a Claude en el chat."
      >
        {trades && (
          <ul className="space-y-2">
            {trades.map((trade) =>
              editingId === trade.id ? (
                <li key={trade.id}>
                  <TradeForm
                    initial={trade}
                    onSubmit={(values) => handleUpdate(trade.id, values)}
                    onCancel={() => setEditingId(null)}
                    submitLabel="Actualizar"
                  />
                </li>
              ) : (
                <li
                  key={trade.id}
                  className="rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3 flex items-center justify-between gap-4 text-sm"
                >
                  <div>
                    <span className="inline-block w-20 text-xs uppercase font-medium text-purple-400">
                      {TYPE_LABELS[trade.type] ?? trade.type}
                    </span>
                    <span className="text-gray-200">{trade.marketHashName}</span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {trade.occurredAt} · cantidad {trade.quantity}
                      {trade.counterparty ? ` · con ${trade.counterparty}` : ''}
                      {trade.notes ? ` · ${trade.notes}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-gray-400">{trade.price !== null ? formatMoney(trade.price) : '—'}</span>
                    <button onClick={() => setEditingId(trade.id)} className="text-gray-400 hover:text-white text-xs">
                      Editar
                    </button>
                    <button onClick={() => handleDelete(trade.id)} className="text-red-400 hover:text-red-300 text-xs">
                      Eliminar
                    </button>
                  </div>
                </li>
              )
            )}
          </ul>
        )}
      </AsyncSection>
    </div>
  )
}
