import { Link } from 'react-router-dom'
import { useState } from 'react'
import { api } from '../api/client.js'
import { useApi } from '../lib/useApi.js'
import StatCard from '../components/StatCard.jsx'
import AsyncSection from '../components/AsyncSection.jsx'
import { formatMoney, formatPercent, formatFloat, wearFromFloat, changeColor } from '../lib/format.js'

export default function Dashboard() {
  const { data: summary, loading, error, reload } = useApi(api.getSummary)
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState(null)

  async function handleSyncNow() {
    setSyncing(true)
    setSyncMessage(null)
    try {
      const result = await api.syncNow()
      setSyncMessage(
        `Sincronizado: ${result.updated} actualizados, ${result.failed} fallidos, ${result.alerts.length} alertas nuevas`
      )
      reload()
    } catch (err) {
      setSyncMessage(`Error al sincronizar: ${err.message}`)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Resumen del portafolio</h1>
        <div className="flex items-center gap-3">
          {syncMessage && <span className="text-xs text-gray-400">{syncMessage}</span>}
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="text-sm px-3 py-1.5 rounded-md bg-purple-600 hover:bg-purple-500 disabled:opacity-50 transition-colors"
          >
            {syncing ? 'Sincronizando…' : 'Sincronizar precios ahora'}
          </button>
        </div>
      </div>

      <AsyncSection loading={loading} error={error}>
        {summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Valor total" value={formatMoney(summary.totalValue)} />
            <StatCard label="Costo total" value={formatMoney(summary.totalCostBasis)} />
            <StatCard
              label="Ganancia / pérdida"
              value={formatMoney(summary.profitLoss)}
              sub={formatPercent(summary.profitLossPercent)}
              accent={changeColor(summary.profitLoss)}
            />
            <StatCard
              label="Objetos"
              value={summary.itemCount}
              sub={`${summary.pricedItemCount} con precio actual`}
            />
          </div>
        )}
      </AsyncSection>

      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-2">Tus objetos</h2>
        <AsyncSection
          loading={loading}
          error={error}
          empty={summary && summary.items.length === 0}
          emptyMessage="Aún no tienes objetos en tu portafolio. Agrégalos desde el chat con Claude o la API."
        >
          {summary && (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead className="bg-gray-900/80 text-gray-400 text-xs uppercase">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium">Objeto</th>
                    <th className="text-right px-4 py-2 font-medium">Cantidad</th>
                    <th className="text-right px-4 py-2 font-medium">Float</th>
                    <th className="text-right px-4 py-2 font-medium">Precio actual</th>
                    <th className="text-right px-4 py-2 font-medium">Valor</th>
                    <th className="text-right px-4 py-2 font-medium">P&amp;L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {summary.items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-900/40">
                      <td className="px-4 py-2.5">
                        <Link to={`/items/${item.id}`} className="text-gray-200 hover:text-purple-400">
                          {item.marketHashName}
                        </Link>
                      </td>
                      <td className="px-4 py-2.5 text-right text-gray-400">{item.quantity}</td>
                      <td className="px-4 py-2.5 text-right text-gray-400">
                        {item.floatValue !== null ? (
                          <span title={wearFromFloat(item.floatValue) ?? ''}>
                            {formatFloat(item.floatValue)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {formatMoney(item.currentPrice, item.priceCurrency)}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {formatMoney(item.currentValue, item.priceCurrency)}
                      </td>
                      <td className={`px-4 py-2.5 text-right font-medium ${changeColor(item.profitLoss)}`}>
                        {formatMoney(item.profitLoss, item.priceCurrency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </AsyncSection>
      </div>
    </div>
  )
}
