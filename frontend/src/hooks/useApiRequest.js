import { useState, useCallback } from 'react'

/**
 * useApiRequest – centralised loading/error + request helper.
 *
 * Usage:
 *   const { loading, error, request } = useApiRequest()
 *   const data = await request(() => ApiService.get('/api/foo'))
 */
const useApiRequest = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const request = useCallback(async (fn) => {
    setLoading(true)
    setError(null)
    try {
      return await fn()
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  return { loading, error, request }
}

export default useApiRequest
