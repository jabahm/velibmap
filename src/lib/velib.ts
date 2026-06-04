import type { RawStationRecord, Station } from '@/types/station'

const BASE = 'https://opendata.paris.fr/api/explore/v2.1/catalog/datasets/velib-disponibilite-en-temps-reel'

function normalize(raw: RawStationRecord): Station | null {
  if (!raw.coordonnees_geo) return null
  return {
    code: raw.stationcode,
    name: raw.name,
    city: raw.nom_arrondissement_communes ?? '',
    capacity: raw.capacity,
    mechanical: raw.mechanical,
    ebike: raw.ebike,
    bikes: raw.numbikesavailable,
    docks: raw.numdocksavailable,
    installed: raw.is_installed === 'OUI',
    renting: raw.is_renting === 'OUI',
    returning: raw.is_returning === 'OUI',
    lon: raw.coordonnees_geo.lon,
    lat: raw.coordonnees_geo.lat,
    updatedAt: raw.duedate,
  }
}

export async function fetchAllStations(signal?: AbortSignal): Promise<Station[]> {
  // Single-shot bulk export — ~1 MB JSON, way faster than paginating records.
  const res = await fetch(`${BASE}/exports/json?limit=-1`, { signal })
  if (!res.ok) throw new Error(`Vélib API ${res.status}`)
  const raw = (await res.json()) as RawStationRecord[]
  return raw.map(normalize).filter((s): s is Station => s !== null)
}

export type StationFilterKind = 'mechanical' | 'ebike' | 'docks'

export function hasBike(s: Station, kind?: 'mechanical' | 'ebike'): boolean {
  if (kind === 'mechanical') return s.mechanical > 0
  if (kind === 'ebike') return s.ebike > 0
  return s.bikes > 0
}

export function hasDock(s: Station): boolean {
  return s.docks > 0
}

export function isOperational(s: Station): boolean {
  return s.installed && s.renting && s.returning
}

// Great-circle distance in meters between two WGS84 points.
export function haversineMeters(
  a: { lon: number; lat: number },
  b: { lon: number; lat: number },
): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

export type StationWithDist = Station & { distanceM: number }

/** Top-N stations near a point matching `predicate`, sorted by distance. */
export function nearestStations(
  stations: Station[],
  point: { lon: number; lat: number },
  predicate: (s: Station) => boolean,
  n = 3,
): StationWithDist[] {
  const ranked: StationWithDist[] = []
  for (const s of stations) {
    if (!predicate(s)) continue
    ranked.push({ ...s, distanceM: haversineMeters(point, s) })
  }
  ranked.sort((a, b) => a.distanceM - b.distanceM)
  return ranked.slice(0, n)
}
