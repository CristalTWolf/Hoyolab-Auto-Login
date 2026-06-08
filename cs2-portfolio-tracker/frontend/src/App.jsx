import { NavLink, Route, Routes } from 'react-router-dom'
import Dashboard from './pages/Dashboard.jsx'
import ItemDetail from './pages/ItemDetail.jsx'
import Trades from './pages/Trades.jsx'
import Alerts from './pages/Alerts.jsx'
import Chat from './pages/Chat.jsx'

const NAV_ITEMS = [
  { to: '/', label: 'Portafolio', end: true },
  { to: '/trades', label: 'Operaciones' },
  { to: '/alerts', label: 'Alertas' },
  { to: '/chat', label: 'Chat con Claude' },
]

function navLinkClass({ isActive }) {
  return [
    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
    isActive ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white hover:bg-gray-800',
  ].join(' ')
}

export default function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="font-semibold text-lg tracking-tight">
            🔫 CS2 Portfolio
          </span>
          <nav className="flex gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink key={item.to} to={item.to} end={item.end} className={navLinkClass}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/trades" element={<Trades />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </main>

      <footer className="border-t border-gray-800 text-center text-xs text-gray-500 py-4">
        Precios obtenidos de fuentes públicas (Steam Community Market / overrides manuales) - no afiliado a Valve.
      </footer>
    </div>
  )
}
