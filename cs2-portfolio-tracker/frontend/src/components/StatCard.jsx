export default function StatCard({ label, value, sub, accent }) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-gray-500">{sub}</p>}
    </div>
  )
}
