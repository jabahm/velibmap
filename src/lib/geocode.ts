// Base Adresse Nationale — free, no API key, optimized for FR addresses.
// Docs: https://adresse.data.gouv.fr/api-doc/adresse
const BASE = 'https://api-adresse.data.gouv.fr/search/'

const PARIS = { lat: 48.8566, lon: 2.3522 }

export type AddressHit = {
  id: string
  label: string
  context: string
  lon: number
  lat: number
  score: number
}

type RawFeature = {
  geometry: { coordinates: [number, number] }
  properties: {
    id?: string
    label: string
    context?: string
    score?: number
  }
}

export async function reverseGeocode(
  lon: number,
  lat: number,
  signal?: AbortSignal,
): Promise<AddressHit | null> {
  const params = new URLSearchParams({ lon: String(lon), lat: String(lat) })
  const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?${params}`, { signal })
  if (!res.ok) return null
  const json = (await res.json()) as { features: RawFeature[] }
  const f = json.features?.[0]
  if (!f) return null
  return {
    id: f.properties.id ?? `geo-${lon},${lat}`,
    label: f.properties.label,
    context: f.properties.context ?? '',
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    score: f.properties.score ?? 0,
  }
}

export async function searchAddress(
  query: string,
  signal?: AbortSignal,
): Promise<AddressHit[]> {
  const q = query.trim()
  if (q.length < 3) return []
  const params = new URLSearchParams({
    q,
    autocomplete: '1',
    limit: '5',
    lat: String(PARIS.lat),
    lon: String(PARIS.lon),
  })
  const res = await fetch(`${BASE}?${params}`, { signal })
  if (!res.ok) throw new Error(`Geocode ${res.status}`)
  const json = (await res.json()) as { features: RawFeature[] }
  return json.features.map((f, i) => ({
    id: f.properties.id ?? `${i}-${f.properties.label}`,
    label: f.properties.label,
    context: f.properties.context ?? '',
    lon: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
    score: f.properties.score ?? 0,
  }))
}
