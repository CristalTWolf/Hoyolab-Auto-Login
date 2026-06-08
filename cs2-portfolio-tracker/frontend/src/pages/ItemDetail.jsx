import { useParams, Link } from 'react-router-dom'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { api } from '../api/client.js'
import { useApi } from '../lib/useApi.js'
import AsyncSection from '../components/AsyncSection.jsx'
import StatCard from '../components/StatCard.jsx'
import { formatMoney, formatFloat, formatDate, parseTimestamp, wearFromFloat, changeColor } from '../lib/format.js'

export default function ItemDetail() {
  const { id } = useParams()
  const { data: item, loading, error } = useApi(() => api.getItem(id), id)
  const { data: history, loading: historyLoading } = useApi(() => api.getItemHistory(id, 30), id)
  const { data: trades, loading: tradesLoading } = useApi(
    () => api.getTrades({ marketHashName: item?.marketHashName, limit: '20' }),
    item?.marketHashName
  )

  const chartData = (history ?? [])
    .map((point) => ({ date: parseTimestamp(point.fetchedAt), price: point.price }))
    .filter((point) => point.date)
    .map((point) => ({
      date: point.date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' }),
      price: point.price,
    }))

  return (
    <div className="space-y-6">
      <Link to="/" className="text-sm text-gray-400 hover:text-purple-400">&larr; Volver al portafolio</Link>

      <AsyncSection loading={loading} error={error}>
        {item && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h1 className="text-xl font-semibold">{item.marketHashName}</h1>
              {item.floatValue !== null && (
                <span className="text-sm text-gray-400">
                  Float {formatFloat(item.floatValue)} · {wearFromFloat(item.floatValue)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <StatCard label="Cantidad" value={item.quantity} />
              <StatCard label="Precio actual" value={formatMoney(item.currentPrice, item.priceCurrency)} sub={item.priceFetchedAt ? `Actualizado ${formatDate(item.priceFetchedAt)}` : 'Sin datos aún'} />
              <StatCard label="Costo de adquisición" value={formatMoney(item.costBasis, item.priceCurrency)} sub={item.acquiredAt ? `Adquirido ${item.acquiredAt}` : null} />
              <StatCard label="Ganancia / pérdida" value={formatMoney(item.profitLoss, item.priceCurrency)} accent={changeColor(item.profitLoss)} />
            </div>
          </>
        )}
      </AsyncSection>

      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-2">Historial de precio (30 días)</h2>
        <AsyncSection
          loading={historyLoading}
          empty={chartData.length < 2}
          emptyMessage="Aún no hay suficiente historial - vuelve después de algunas sincronizaciones de precio."
        >
          <div className="h-64 rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2430" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                  formatter={(value) => [formatMoney(value), 'Precio']}
                />
                <Line type="monotone" dataKey="price" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </AsyncSection>
      </div>

      <div>
        <h2 className="text-sm uppercase tracking-wide text-gray-500 mb-2">Operaciones de este objeto</h2>
        <AsyncSection
          loading={tradesLoading}
          empty={trades && trades.length === 0}
          emptyMessage="No hay operaciones registradas para este objeto."
        >
          {trades && (
            <ul className="divide-y divide-gray-800 rounded-xl border border-gray-800 overflow-hidden">
              {trades.map((trade) => (
                <li key={trade.id} className="px-4 py-2.5 flex items-center justify-between text-sm bg-gray-900/40">
                  <span>
                    <span className="uppercase text-xs font-medium text-purple-400 mr-2">{trade.type}</span>
                    {trade.occurredAt} {trade.counterparty ? `· con ${trade.counterparty}` : ''}
                  </span>
                  <span className="text-gray-400">
                    {trade.price !== null ? formatMoney(trade.price) : 'sin precio'} × {trade.quantity}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </AsyncSection>
      </div>
    </div>
  )
}
