/** Small helper to keep pages free of repetitive loading/error/empty boilerplate. */
export default function AsyncSection({ loading, error, empty, emptyMessage, children }) {
  if (loading) return <p className="text-gray-500 text-sm">Cargando…</p>
  if (error) return <p className="text-red-400 text-sm">Error: {error}</p>
  if (empty) return <p className="text-gray-500 text-sm">{emptyMessage ?? 'Sin datos todavía.'}</p>
  return children
}
