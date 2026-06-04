import { useMemo, useState } from 'react'
import { Crosshair, Loader2, Navigation } from 'lucide-react'
import type { Station } from '@/types/station'
import type { AddressHit } from '@/lib/geocode'
import { reverseGeocode } from '@/lib/geocode'
import {
  isOperational,
  nearestStations,
  type StationWithDist,
} from '@/lib/velib'
import { AddressInput } from '@/components/AddressInput'
import { useSheet } from '@/components/MobileSheet'
import { cn } from '@/lib/utils'

export type Need = 'mechanical' | 'ebike' | 'dock'

const NEAREST_N = 4

type Props = {
  stations: Station[]
  address: AddressHit | null
  need: Need
  onAddressChange: (hit: AddressHit | null) => void
  onNeedChange: (n: Need) => void
  onStationPick: (s: Station) => void
}

function predicateFor(n: Need): (s: Station) => boolean {
  if (n === 'mechanical') return (s) => isOperational(s) && s.mechanical > 0
  if (n === 'ebike') return (s) => isOperational(s) && s.ebike > 0
  return (s) => isOperational(s) && s.docks > 0
}

const NEEDS: { value: Need; label: string }[] = [
  { value: 'mechanical', label: 'Méca' },
  { value: 'ebike', label: 'Élec' },
  { value: 'dock', label: 'Bornette' },
]

function countFor(s: Station, n: Need): number {
  if (n === 'mechanical') return s.mechanical
  if (n === 'ebike') return s.ebike
  return s.docks
}

function fmtDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(2)} km`
}

function dotForCount(c: number): string {
  if (c === 0) return 'bg-gray-400'
  if (c < 3) return 'bg-amber-500'
  return 'bg-emerald-500'
}

export function ExplorerTab({
  stations,
  address,
  need,
  onAddressChange,
  onNeedChange,
  onStationPick,
}: Props) {
  const [locating, setLocating] = useState(false)
  const [locateError, setLocateError] = useState<string | null>(null)

  const sheet = useSheet()
  const nearest: StationWithDist[] = useMemo(() => {
    if (!address) return []
    return nearestStations(stations, address, predicateFor(need), NEAREST_N)
  }, [stations, address, need])

  // On mobile: tapping a station in the list should collapse the sheet so the
  // map + popup are visible. No-op on desktop.
  const handlePick = (s: Station) => {
    sheet.collapse()
    onStationPick(s)
  }

  const handleLocate = () => {
    setLocateError(null)
    if (!('geolocation' in navigator)) {
      setLocateError('Géolocalisation indisponible')
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { longitude: lon, latitude: lat } = pos.coords
        try {
          const hit = await reverseGeocode(lon, lat)
          onAddressChange(
            hit ?? {
              id: `geoloc-${lon},${lat}`,
              label: 'Votre position',
              context: '',
              lon,
              lat,
              score: 1,
            },
          )
        } finally {
          setLocating(false)
        }
      },
      (err) => {
        setLocating(false)
        setLocateError(err.message || 'Position refusée')
      },
      { enableHighAccuracy: true, timeout: 8_000, maximumAge: 60_000 },
    )
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="mb-1 block text-[11px] font-medium text-muted-foreground">
          Je suis à
        </label>
        <div className="space-y-1">
          <AddressInput
            value={address}
            onChange={onAddressChange}
            placeholder="Adresse, place, monument…"
          />
          <button
            type="button"
            onClick={handleLocate}
            disabled={locating}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border bg-background py-1.5 text-[11px] font-medium hover:bg-accent disabled:opacity-60"
          >
            {locating ? <Loader2 className="size-3 animate-spin" /> : <Crosshair className="size-3" />}
            {locating ? 'Localisation…' : 'Près de moi'}
          </button>
          {locateError && (
            <p className="text-[10px] text-destructive">{locateError}</p>
          )}
        </div>
      </div>

      <div>
        <div className="mb-1 text-[11px] font-medium text-muted-foreground">
          Je cherche
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-md bg-muted p-0.5">
          {NEEDS.map((n) => (
            <button
              key={n.value}
              type="button"
              onClick={() => onNeedChange(n.value)}
              className={cn(
                'rounded px-2 py-1.5 text-xs font-medium transition-colors',
                need === n.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground',
              )}
              aria-pressed={need === n.value}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      {address && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-medium text-muted-foreground">
            À proximité
          </div>
          {nearest.length === 0 ? (
            <p className="rounded-md border bg-muted/40 px-2 py-1.5 text-xs text-muted-foreground">
              Aucune station disponible à proximité.
            </p>
          ) : (
            <ul className="space-y-1">
              {nearest.map((s) => {
                const count = countFor(s, need)
                return (
                  <li key={s.code}>
                    <button
                      type="button"
                      onClick={() => handlePick(s)}
                      className="group flex w-full items-center gap-2 rounded-md border bg-background px-2 py-1.5 text-left text-xs hover:bg-accent"
                    >
                      <span className={cn('size-2 shrink-0 rounded-full ring-2 ring-white', dotForCount(count))} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium leading-tight">
                          {s.name}
                        </span>
                        <span className="block text-[10px] text-muted-foreground tabular-nums">
                          {fmtDistance(s.distanceM)}
                        </span>
                      </span>
                      <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-foreground">
                        {count}
                      </span>
                      <Navigation className="size-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      <div className="border-t pt-2 text-[10px] text-muted-foreground">
        <a
          href="https://www.velib-metropole.fr/tarifs"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          Tarifs Vélib'
        </a>
        {' · '}
        <a
          href="https://www.velib-metropole.fr/"
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-foreground"
        >
          Vélib' Métropole
        </a>
      </div>
    </div>
  )
}
