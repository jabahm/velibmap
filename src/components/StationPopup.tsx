import { Navigation, Loader2, Clock, Footprints, Timer, AlertTriangle } from 'lucide-react'
import { MapPopup } from '@/components/ui/map'
import type { Station } from '@/types/station'
import type { FootRoute } from '@/lib/osrm'

type Props = {
  station: Station
  hasAddress: boolean
  route: FootRoute | null
  routeLoading: boolean
  onGoTo: () => void
  onClose: () => void
}

function Stat({ label, value }: { label: string; value: number }) {
  const tone =
    value === 0
      ? 'text-muted-foreground'
      : value < 3
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-foreground'
  return (
    <div className="flex flex-col items-center rounded-md bg-muted/50 px-1 py-1.5">
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className={`text-sm font-semibold tabular-nums ${tone}`}>{value}</span>
    </div>
  )
}

function AlertPill({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:text-rose-300">
      <AlertTriangle className="size-3" />
      {label}
    </span>
  )
}

function fmtDistance(m: number) {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(2)} km`
}

function fmtDuration(s: number) {
  const min = Math.max(1, Math.round(s / 60))
  return `${min} min`
}

function fmtEta(durationS: number) {
  const eta = new Date(Date.now() + durationS * 1000)
  return `${String(eta.getHours()).padStart(2, '0')}:${String(eta.getMinutes()).padStart(2, '0')}`
}

function fmtAgo(iso: string | null): string | null {
  if (!iso) return null
  const ms = Date.now() - new Date(iso).getTime()
  if (Number.isNaN(ms) || ms < 0) return null
  const s = Math.round(ms / 1000)
  if (s < 60) return `il y a ${s} s`
  const m = Math.round(s / 60)
  if (m < 60) return `il y a ${m} min`
  return `il y a ${Math.round(m / 60)} h`
}

export function StationPopup({ station, hasAddress, route, routeLoading, onGoTo, onClose }: Props) {
  const updated = fmtAgo(station.updatedAt)
  const hasIssue = !station.renting || !station.returning
  return (
    <MapPopup
      longitude={station.lon}
      latitude={station.lat}
      onClose={onClose}
      closeButton
      className="w-72 max-w-none"
    >
      <div className="space-y-2.5">
        <div>
          <h3 className="pr-6 text-sm font-semibold leading-tight">{station.name}</h3>
          <p className="text-[11px] text-muted-foreground">
            <a
              href="https://www.velib-metropole.fr/"
              target="_blank"
              rel="noreferrer"
              className="underline-offset-2 hover:underline"
            >
              Vélib' Métropole
            </a>
            {station.city ? ` · ${station.city}` : ''} · #{station.code} · {station.capacity} places
          </p>
        </div>

        {hasIssue && (
          <div className="flex flex-wrap items-center gap-1">
            {!station.renting && <AlertPill label="Emprunt fermé" />}
            {!station.returning && <AlertPill label="Retour fermé" />}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1">
          <Stat label="Méca" value={station.mechanical} />
          <Stat label="Élec" value={station.ebike} />
          <Stat label="Libres" value={station.docks} />
        </div>

        {updated && (
          <p className="text-[10px] text-muted-foreground">
            Donnée station mise à jour {updated}
          </p>
        )}

        {hasAddress && (
          <div className="border-t pt-2">
            {route ? (
              <div className="grid grid-cols-3 gap-1.5 rounded-md bg-muted/50 p-2">
                <RouteStat icon={<Clock className="size-3.5" />} label="Temps" value={fmtDuration(route.durationS)} />
                <RouteStat icon={<Footprints className="size-3.5" />} label="Distance" value={fmtDistance(route.distanceM)} />
                <RouteStat icon={<Timer className="size-3.5" />} label="Arrivée" value={fmtEta(route.durationS)} />
              </div>
            ) : (
              <button
                type="button"
                onClick={onGoTo}
                disabled={routeLoading}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md bg-primary px-2 py-1.5 text-xs font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {routeLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Calcul de l'itinéraire…
                  </>
                ) : (
                  <>
                    <Navigation className="size-3.5" />
                    Aller à cette station
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </MapPopup>
  )
}

function RouteStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <span className="text-muted-foreground">{icon}</span>
      <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className="text-xs font-semibold tabular-nums">{value}</span>
    </div>
  )
}
