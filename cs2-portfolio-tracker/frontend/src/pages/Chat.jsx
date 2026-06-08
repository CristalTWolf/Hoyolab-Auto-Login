import { useEffect, useRef, useState } from 'react'
import { api } from '../api/client.js'
import { useApi } from '../lib/useApi.js'

const SUGGESTIONS = [
  'Compré un AK-47 | Redline (Field-Tested) por $14.50 hoy',
  'Vendí mi AWP | Asiimov (Battle-Scarred) en $39',
  'Hice un trade: di mi M4A4 | Howl por una Karambit | Fade con "usuario123"',
  '¿Cuál es el resumen de mi portafolio?',
]

export default function Chat() {
  const { data: status } = useApi(api.getChatStatus)
  const [messages, setMessages] = useState([]) // [{ role: 'user'|'assistant', text }]
  const [history, setHistory] = useState([]) // Anthropic-format history, opaque to the UI
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const message = text.trim()
    if (!message || sending) return

    setMessages((prev) => [...prev, { role: 'user', text: message }])
    setInput('')
    setSending(true)
    setError(null)

    try {
      const result = await api.sendChatMessage(message, history)
      setMessages((prev) => [...prev, { role: 'assistant', text: result.reply }])
      setHistory(result.history)
    } catch (err) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  function handleSubmit(event) {
    event.preventDefault()
    send(input)
  }

  if (status && !status.enabled) {
    return (
      <div className="rounded-xl border border-yellow-700/50 bg-yellow-950/30 p-4 text-sm text-yellow-200">
        El chat con Claude está deshabilitado: configura <code className="bg-black/30 px-1 rounded">ANTHROPIC_API_KEY</code>{' '}
        en el <code className="bg-black/30 px-1 rounded">.env</code> del backend para activarlo.
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <h1 className="text-xl font-semibold mb-1">Chat con Claude</h1>
      <div className="text-xs text-gray-500 mb-4 space-y-1.5">
        <p>
          No es un formulario - escríbele como le contarías a un amigo qué hiciste con tu
          inventario. Aquí Claude puede:
        </p>
        <ul className="space-y-1 pl-4 list-disc marker:text-purple-500">
          <li>
            <span className="text-gray-300">Registrar tus operaciones</span> y dejar tus
            holdings al día en el mismo mensaje (compras, ventas, trades).
          </li>
          <li>
            <span className="text-gray-300">Corregir o borrar</span> algo que registraste mal -
            solo dile qué cambiar.
          </li>
          <li>
            <span className="text-gray-300">Responder preguntas</span> sobre tu resumen, tus
            ganancias o el historial de precios de un objeto.
          </li>
        </ul>
      </div>

      <div className="flex-1 overflow-y-auto rounded-xl border border-gray-800 bg-gray-900/40 p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-300">👉 Prueba alguno de estos ejemplos para empezar:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="block w-full text-left text-sm px-3 py-2 rounded-md bg-gray-800/60 hover:bg-gray-800 text-gray-300"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-100'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}

        {sending && <p className="text-xs text-gray-500">Claude está pensando…</p>}
        {error && <p className="text-xs text-red-400">Error: {error}</p>}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ej: Compré una Karambit | Doppler Phase 2 (FN) por $850 hoy"
          className="flex-1 rounded-md bg-gray-800 border border-gray-700 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="px-4 py-2 rounded-md text-sm bg-purple-600 hover:bg-purple-500 disabled:opacity-50"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
