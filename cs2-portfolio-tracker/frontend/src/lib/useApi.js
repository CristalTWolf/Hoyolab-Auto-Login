import { useEffect, useState } from 'react'

const INITIAL = { key: undefined, requestIndex: -1, status: 'pending', data: null, error: null }

/**
 * Runs `fetcher` on mount and whenever `key` changes, tracking
 * loading/error/data state. `key` identifies *what* is being fetched (an id,
 * a name, or omit it for fetchers with no parameters) - pass a primitive, not
 * an object, so equality checks are stable across renders.
 *
 * Returns a `reload` function for manual refreshes (e.g. after a mutation).
 *
 * Implementation note: state is only ever written from the async callbacks
 * (never synchronously in the effect body), and "is this the latest request"
 * is derived by comparing {key, requestIndex} - this avoids the
 * cascading-render footgun of calling setState directly inside an effect.
 */
export function useApi(fetcher, key) {
  const [requestIndex, setRequestIndex] = useState(0)
  const [result, setResult] = useState(INITIAL)

  useEffect(() => {
    let cancelled = false

    fetcher()
      .then((data) => {
        if (!cancelled) setResult({ key, requestIndex, status: 'success', data, error: null })
      })
      .catch((err) => {
        if (!cancelled) setResult({ key, requestIndex, status: 'error', data: null, error: err.message })
      })

    return () => {
      cancelled = true
    }
    // `fetcher` is intentionally excluded: callers pass inline arrow functions,
    // and `key`/`requestIndex` are the explicit signals for "fetch again".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, requestIndex])

  const isCurrent = result.key === key && result.requestIndex === requestIndex
  const loading = !isCurrent

  return {
    data: isCurrent ? result.data : null,
    error: isCurrent ? result.error : null,
    loading,
    reload: () => setRequestIndex((i) => i + 1),
  }
}
