// Open Source Routing Machine — free demo server hosted by the OSRM project.
// Heads-up: the demo endpoint is rate-limited and not meant for production.
// For a deploy with real traffic, host your own (https://github.com/Project-OSRM/osrm-backend)
// or self-host Valhalla/GraphHopper and set OSRM_BASE_URL accordingly.
const BASE =
  import.meta.env.VITE_OSRM_URL?.replace(/\/$/, '') ??
  'https://router.project-osrm.org'

export type FootRoute = {
  /** Lon/lat coordinates of the walking path */
  coordinates: [number, number][]
  /** Total route length in meters */
  distanceM: number
  /** Total walking duration in seconds */
  durationS: number
}

type OSRMResponse = {
  code: string
  routes?: {
    geometry: { coordinates: [number, number][] }
    distance: number
    duration: number
  }[]
}

export async function fetchFootRoute(
  from: { lon: number; lat: number },
  to: { lon: number; lat: number },
  signal?: AbortSignal,
): Promise<FootRoute | null> {
  const url = `${BASE}/route/v1/foot/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=false`
  const res = await fetch(url, { signal })
  if (!res.ok) return null
  const json = (await res.json()) as OSRMResponse
  const r = json.routes?.[0]
  if (!r) return null
  return {
    coordinates: r.geometry.coordinates,
    distanceM: r.distance,
    durationS: r.duration,
  }
}
