import { api } from '../api/client.js'
import { useApi } from '../lib/useApi.js'
import AsyncSection from '../components/AsyncSection.jsx'
import StatCard from '../components/StatCard.jsx'
import { formatMoney, formatPercent, formatDate, changeColor } from '../lib/format.js'

export default function Alerts() {
  const { data: config } = useApi(api.getAlertConfig)
  const { data: alerts, loading, error } = useApi(api.getAlerts)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Alertas de movimientos abruptos de precio</h1>

      {config && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Umbral de alerta" value={`±${config.thresholdPercent}%`} sub={`en ${config.windowHours}h`} />
          <StatCard
            label="Notificaciones Discord"
            value={config.discordConfigured ? 'Activas' : 'No configuradas'}
            accent={config.discordConfigured ? 'text-emerald-400' : 'text-gray-500'}
            sub={config.discordConfigured ? undefined : 'Configura DISCORD_WEBHOOK_URL en .env'}
          />
          <StatCard label="Total de alertas" value={alerts?.length ?? '—'} />
        </div>
      )}

      <p className="text-xs text-gray-500">
        Cuando el precio de un objeto que posees cambia más de lo configurado dentro de la ventana de
        tiempo definida, se registra una alerta aquí y (si configuraste un webhook) se te avisa por Discord.
        Esto no detecta manipulación per se - es una señal para que investigues volumen y contexto antes de operar.
      </p>

      <AsyncSection
        loading={loading}
        error={error}
        empty={alerts && alerts.length === 0}
        emptyMessage="No se ha disparado ninguna alerta todavía."
      >
        {alerts && (
          <ul className="space-y-2">
            {alerts.map((alert) => (
              <li key={alert.id} className="rounded-xl border border-gray-800 bg-gray-900/40 px-4 py-3 text-sm flex items-center justify-between">
                <div>
                  <span className="text-gray-200">{alert.marketHashName}</span>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatMoney(alert.priceFrom)} → {formatMoney(alert.priceTo)} en {alert.windowHours}h ·{' '}
                    {formatDate(alert.triggeredAt)}
                  </p>
                </div>
                <span className={`font-semibold ${changeColor(alert.changePercent)}`}>
                  {formatPercent(alert.changePercent)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AsyncSection>
    </div>
  )
}
