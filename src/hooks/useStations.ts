import { useEffect, useRef, useState } from 'react'
import type { Station } from '@/types/station'
import { fetchAllStations } from '@/lib/velib'

const REFRESH_MS = 60_000

export type UseStationsResult = {
  stations: Station[]
  loading: boolean
  error: string | null
  lastUpdated: number | null
  refetch: () => void
}

export function useStations(): UseStationsResult {
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)
  const tickRef = useRef(0)

  useEffect(() => {
    const ac = new AbortController()
    let alive = true

    const load = async () => {
      try {
        const data = await fetchAllStations(ac.signal)
        if (!alive) return
        setStations(data)
        setError(null)
        setLastUpdated(performance.timeOrigin + performance.now())
      } catch (e) {
        if (!alive) return
        if ((e as Error).name === 'AbortError') return
        setError((e as Error).message)
      } finally {
        if (alive) setLoading(false)
      }
    }

    load()
    const interval = setInterval(load, REFRESH_MS)

    return () => {
      alive = false
      ac.abort()
      clearInterval(interval)
    }
  }, [])

  return {
    stations,
    loading,
    error,
    lastUpdated,
    refetch: () => tickRef.current++,
  }
}
