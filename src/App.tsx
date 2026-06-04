import { useEffect, useMemo, useRef, useState } from 'react'
import { Bike } from 'lucide-react'
import {
  Map,
  MapControls,
  MapMarker,
  MapRoute,
  MarkerContent,
  type MapRef,
} from '@/components/ui/map'
import { StationsLayer, type ColorMode } from '@/components/StationsLayer'
import { StationPopup } from '@/components/StationPopup'
import { ExplorerTab, type Need } from '@/components/ExplorerTab'
import { LegendBadge } from '@/components/LegendBadge'
import { MapViewControls, type Theme, type ViewMode } from '@/components/MapViewControls'
import { BuildingsLayer } from '@/components/BuildingsLayer'
import { MobileSheet } from '@/components/MobileSheet'
import { useStations } from '@/hooks/useStations'
import { useMediaQuery } from '@/hooks/useMediaQuery'
import type { AddressHit } from '@/lib/geocode'
import { fetchFootRoute, type FootRoute } from '@/lib/osrm'
import { isOperational } from '@/lib/velib'
import type { Station } from '@/types/station'
import { cn } from '@/lib/utils'

const PARIS: [number, number] = [2.3522, 48.8566]

function needToColorMode(need: Need): ColorMode {
  if (need === 'dock') return 'docks'
  if (need === 'ebike') return 'ebike'
  return 'mechanical'
}

export default function App() {
  const { stations, loading, error, lastUpdated } = useStations()
  const mapRef = useRef<MapRef>(null)
  const isMobile = useMediaQuery('(max-width: 767px)')

  const [address, setAddress] = useState<AddressHit | null>(null)
  const [need, setNeed] = useState<Need>('mechanical')

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light'
    const saved = localStorage.getItem('velibmap.theme')
    if (saved === 'light' || saved === 'dark') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('velibmap.theme', theme)
  }, [theme])

  const [view, setView] = useState<ViewMode>('flat')
  const projection = view === 'globe' ? ({ type: 'globe' } as const) : undefined
  useEffect(() => {
    if (!mapRef.current) return
    const pitch = view === 'pitched' ? 55 : 0
    // Zoom in slightly when entering pitch so 3D buildings (min zoom 14) become visible.
    const targetZoom =
      view === 'pitched' ? Math.max(mapRef.current.getZoom(), 15) : mapRef.current.getZoom()
    mapRef.current.easeTo({ pitch, zoom: targetZoom, duration: 700 })
  }, [view])

  // Show every operational station — markers convey availability via color.
  const visibleStations = useMemo(
    () => stations.filter(isOperational),
    [stations],
  )

  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const selected = useMemo(
    () => stations.find((s) => s.code === selectedCode) ?? null,
    [stations, selectedCode],
  )

  const [route, setRoute] = useState<FootRoute | null>(null)
  const [routeLoading, setRouteLoading] = useState(false)
  const routeAcRef = useRef<AbortController | null>(null)

  // Reset route whenever selection or origin changes.
  useEffect(() => {
    routeAcRef.current?.abort()
    setRoute(null)
    setRouteLoading(false)
  }, [selectedCode, address?.id])

  const handleGoTo = async () => {
    if (!address || !selected) return
    routeAcRef.current?.abort()
    const ac = new AbortController()
    routeAcRef.current = ac
    setRouteLoading(true)
    try {
      const r = await fetchFootRoute(address, selected, ac.signal)
      if (ac.signal.aborted) return
      setRoute(r)
    } catch (e) {
      if ((e as Error).name !== 'AbortError') console.error(e)
    } finally {
      if (!ac.signal.aborted) setRouteLoading(false)
    }
  }

  useEffect(() => {
    if (!address) return
    mapRef.current?.flyTo({ center: [address.lon, address.lat], zoom: 15, duration: 800 })
  }, [address])

  useEffect(() => {
    if (!route || route.coordinates.length === 0 || !mapRef.current) return
    let minLon = Infinity,
      minLat = Infinity,
      maxLon = -Infinity,
      maxLat = -Infinity
    for (const [lon, lat] of route.coordinates) {
      if (lon < minLon) minLon = lon
      if (lon > maxLon) maxLon = lon
      if (lat < minLat) minLat = lat
      if (lat > maxLat) maxLat = lat
    }
    // On desktop the left sidebar eats 320px; on mobile the sheet is at the
    // bottom so we pad below instead of left.
    const padding = isMobile
      ? { top: 60, right: 40, bottom: 240, left: 40 }
      : { top: 80, right: 80, bottom: 80, left: 320 }
    mapRef.current.fitBounds(
      [
        [minLon, minLat],
        [maxLon, maxLat],
      ],
      { padding, duration: 700, maxZoom: 17 },
    )
  }, [route, isMobile])

  const [now, setNow] = useState(() => performance.timeOrigin + performance.now())
  useEffect(() => {
    const id = setInterval(() => setNow(performance.timeOrigin + performance.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const handleStationPick = (s: Station) => {
    setSelectedCode(s.code)
    mapRef.current?.flyTo({
      center: [s.lon, s.lat],
      zoom: 16,
      duration: 600,
      offset: isMobile ? [0, -120] : [0, 0],
    })
  }

  const panelContent = (
    <PanelContent
      isMobile={isMobile}
      stationCount={stations.length}
      stations={stations}
      address={address}
      need={need}
      onAddressChange={setAddress}
      onNeedChange={setNeed}
      onStationPick={handleStationPick}
    />
  )

  return (
    <div className="relative h-full w-full">
      <Map
        ref={mapRef}
        className="h-full w-full"
        center={PARIS}
        zoom={12}
        theme={theme}
        projection={projection}
        loading={loading && stations.length === 0}
      >
        <MapControls
          position="bottom-right"
          showLocate
          showFullscreen
          showCompass
          className={isMobile ? 'bottom-48! right-2!' : undefined}
        />
        <BuildingsLayer enabled={view !== 'flat'} />
        <StationsLayer
          stations={visibleStations}
          colorMode={needToColorMode(need)}
          onStationClick={(code) => setSelectedCode(code)}
        />

        {address && (
          <MapMarker longitude={address.lon} latitude={address.lat}>
            <MarkerContent>
              <PulsePin />
            </MarkerContent>
          </MapMarker>
        )}

        {route && (
          <MapRoute
            id="active-foot"
            coordinates={route.coordinates}
            color="#3b82f6"
            width={5}
            opacity={0.9}
            interactive={false}
          />
        )}

        {selected && (
          <StationPopup
            station={selected}
            hasAddress={!!address}
            route={route}
            routeLoading={routeLoading}
            onGoTo={handleGoTo}
            onClose={() => setSelectedCode(null)}
          />
        )}
      </Map>

      {isMobile ? (
        <MobileSheet>{panelContent}</MobileSheet>
      ) : (
        <aside className="absolute left-3 top-3 z-10 flex max-h-[calc(100%-1.5rem)] w-72 max-w-[calc(100vw-1.5rem)] flex-col rounded-xl border bg-background/95 shadow-xl backdrop-blur">
          {panelContent}
        </aside>
      )}

      <MapViewControls
        theme={theme}
        onThemeChange={setTheme}
        view={view}
        onViewChange={setView}
      />

      {!isMobile && <LegendBadge lastUpdated={lastUpdated} error={error} now={now} />}
    </div>
  )
}

function PanelContent({
  isMobile,
  stationCount,
  stations,
  address,
  need,
  onAddressChange,
  onNeedChange,
  onStationPick,
}: {
  isMobile: boolean
  stationCount: number
  stations: Station[]
  address: AddressHit | null
  need: Need
  onAddressChange: (h: AddressHit | null) => void
  onNeedChange: (n: Need) => void
  onStationPick: (s: Station) => void
}) {
  return (
    <>
      <header className={cn('flex items-center justify-between', isMobile ? 'pb-2' : 'border-b px-3 py-2')}>
        <div className="flex items-center gap-1.5">
          <Bike className="size-4 text-primary" />
          <h1 className="text-sm font-semibold">VélibMap</h1>
        </div>
        <span className="text-[10px] text-muted-foreground">
          {stationCount.toLocaleString('fr-FR')} stations
        </span>
      </header>

      <div className={cn(isMobile ? 'pb-2' : 'flex-1 overflow-auto px-3 py-3')}>
        <ExplorerTab
          stations={stations}
          address={address}
          need={need}
          onAddressChange={onAddressChange}
          onNeedChange={onNeedChange}
          onStationPick={onStationPick}
        />
      </div>
    </>
  )
}

function PulsePin() {
  return (
    <div className="relative">
      <span className={cn('absolute inset-0 -m-1 animate-ping rounded-full bg-blue-500 opacity-40')} />
      <span className="relative inline-flex size-4 rounded-full bg-blue-500 shadow-lg ring-2 ring-white" />
    </div>
  )
}
