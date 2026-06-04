import { useEffect, useMemo, useRef } from 'react'
import type { FeatureCollection, Point } from 'geojson'
import type {
  ExpressionSpecification,
  GeoJSONSource,
  MapGeoJSONFeature,
  MapMouseEvent,
} from 'maplibre-gl'
import { useMap } from '@/components/ui/map'
import type { Station } from '@/types/station'

export type ColorMode = 'mechanical' | 'ebike' | 'docks'

export type StationFeatureProps = {
  code: string
  name: string
  bikes: number
  mechanical: number
  ebike: number
  docks: number
  capacity: number
}

type StationsGeoJSON = FeatureCollection<Point, StationFeatureProps>

type Props = {
  stations: Station[]
  /** Which station count drives the marker color. */
  colorMode: ColorMode
  /** Called when a single (unclustered) station is clicked. */
  onStationClick?: (code: string, lngLat: [number, number]) => void
}

function toGeoJSON(stations: Station[]): StationsGeoJSON {
  return {
    type: 'FeatureCollection',
    features: stations.map((s) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [s.lon, s.lat] },
      properties: {
        code: s.code,
        name: s.name,
        bikes: s.bikes,
        mechanical: s.mechanical,
        ebike: s.ebike,
        docks: s.docks,
        capacity: s.capacity,
      },
    })),
  }
}

const SOURCE_ID = 'stations'
const CLUSTER_LAYER = 'stations-clusters'
const CLUSTER_COUNT_LAYER = 'stations-cluster-count'
const POINT_LAYER = 'stations-point'

// Availability tiers: empty / low (1-2) / good (3+)
const COLOR_OUT = '#9ca3af' // gray-400
const COLOR_LOW = '#f59e0b' // amber-500
const COLOR_OK = '#10b981' // emerald-500

const CLUSTER_COLOR = '#1f2937' // gray-800 — neutral, count carries the message

function paintForColorMode(mode: ColorMode): ExpressionSpecification {
  return [
    'step',
    ['get', mode],
    COLOR_OUT,
    1,
    COLOR_LOW,
    3,
    COLOR_OK,
  ]
}

export function StationsLayer({ stations, colorMode, onStationClick }: Props) {
  const { map, isLoaded } = useMap()
  const data = useMemo(() => toGeoJSON(stations), [stations])
  const onClickRef = useRef(onStationClick)
  onClickRef.current = onStationClick

  useEffect(() => {
    if (!map || !isLoaded) return

    if (!map.getSource(SOURCE_ID)) {
      map.addSource(SOURCE_ID, {
        type: 'geojson',
        data,
        cluster: true,
        clusterMaxZoom: 14,
        clusterRadius: 50,
      })
    }

    if (!map.getLayer(CLUSTER_LAYER)) {
      map.addLayer({
        id: CLUSTER_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': CLUSTER_COLOR,
          'circle-radius': [
            'step',
            ['get', 'point_count'],
            16,
            25,
            22,
            100,
            30,
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-opacity': 0.9,
        },
      })
    }

    if (!map.getLayer(CLUSTER_COUNT_LAYER)) {
      map.addLayer({
        id: CLUSTER_COUNT_LAYER,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': ['get', 'point_count_abbreviated'],
          'text-size': 12,
          'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        },
        paint: { 'text-color': '#fff' },
      })
    }

    if (!map.getLayer(POINT_LAYER)) {
      map.addLayer({
        id: POINT_LAYER,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': paintForColorMode(colorMode),
          'circle-radius': 7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      })
    }

    const onClusterClick = async (
      e: MapMouseEvent & { features?: MapGeoJSONFeature[] },
    ) => {
      const f = map.queryRenderedFeatures(e.point, {
        layers: [CLUSTER_LAYER],
      })[0]
      if (!f) return
      const clusterId = f.properties?.cluster_id as number
      const src = map.getSource(SOURCE_ID) as GeoJSONSource
      const zoom = await src.getClusterExpansionZoom(clusterId)
      map.easeTo({
        center: (f.geometry as Point).coordinates as [number, number],
        zoom,
      })
    }
    const onPointClick = (
      e: MapMouseEvent & { features?: MapGeoJSONFeature[] },
    ) => {
      const f = e.features?.[0]
      if (!f) return
      const coords = (f.geometry as Point).coordinates as [number, number]
      const code = f.properties?.code as string
      onClickRef.current?.(code, coords)
    }
    const cursorEnter = () => {
      map.getCanvas().style.cursor = 'pointer'
    }
    const cursorLeave = () => {
      map.getCanvas().style.cursor = ''
    }

    map.on('click', CLUSTER_LAYER, onClusterClick)
    map.on('click', POINT_LAYER, onPointClick)
    map.on('mouseenter', CLUSTER_LAYER, cursorEnter)
    map.on('mouseleave', CLUSTER_LAYER, cursorLeave)
    map.on('mouseenter', POINT_LAYER, cursorEnter)
    map.on('mouseleave', POINT_LAYER, cursorLeave)

    return () => {
      map.off('click', CLUSTER_LAYER, onClusterClick)
      map.off('click', POINT_LAYER, onPointClick)
      map.off('mouseenter', CLUSTER_LAYER, cursorEnter)
      map.off('mouseleave', CLUSTER_LAYER, cursorLeave)
      map.off('mouseenter', POINT_LAYER, cursorEnter)
      map.off('mouseleave', POINT_LAYER, cursorLeave)
      try {
        if (map.getLayer(CLUSTER_COUNT_LAYER)) map.removeLayer(CLUSTER_COUNT_LAYER)
        if (map.getLayer(CLUSTER_LAYER)) map.removeLayer(CLUSTER_LAYER)
        if (map.getLayer(POINT_LAYER)) map.removeLayer(POINT_LAYER)
        if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID)
      } catch {
        // map is being torn down
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, isLoaded])

  useEffect(() => {
    if (!map || !isLoaded) return
    const src = map.getSource(SOURCE_ID) as GeoJSONSource | undefined
    src?.setData(data)
  }, [map, isLoaded, data])

  useEffect(() => {
    if (!map || !isLoaded || !map.getLayer(POINT_LAYER)) return
    map.setPaintProperty(POINT_LAYER, 'circle-color', paintForColorMode(colorMode))
  }, [map, isLoaded, colorMode])

  return null
}
