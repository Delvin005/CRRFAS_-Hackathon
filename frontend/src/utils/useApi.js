import { useState, useEffect, useCallback } from 'react'
import apiClient from '../api/apiClient'

/**
 * Generic data-fetching hook.
 * Usage: const { data, loading, error, refetch } = useApi('/academics/departments/')
 */
export function useApi(url, options = {}) {
  const [data, setData] = useState(options.initialData ?? null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(() => {
    if (!url) return
    setLoading(true)
    apiClient.get(url)
      .then(res => setData(res.data))
      .catch(err => setError(err.response?.data || 'Error loading data'))
      .finally(() => setLoading(false))
  }, [url])

  useEffect(() => { fetch() }, [fetch])

  return { data, loading, error, refetch: fetch }
}

/**
 * Returns items from paginated or plain list response.
 */
export function useList(url) {
  const { data, loading, error, refetch } = useApi(url)
  const items = data?.results ?? (Array.isArray(data) ? data : [])
  return { items, loading, error, refetch }
}
