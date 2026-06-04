import { useEffect } from 'react'
import type { LayerSpecification } from 'maplibre-gl'
import { useMap } from '@/components/ui/map'

type Props = {
  enabled: boolean
}

const LAYER_ID = '3d-buildings'

/**
 * Adds a 3D building extrusion layer on top of the current basemap.
 *
 * The basemap (Carto Positron / Dark Matter served by mapcn) ships a flat 2D
 * "building" source-layer. We reuse that source and add a fill-extrusion on top
 * so buildings rise vertically. Visible from zoom 14 up.
 */
export function BuildingsLayer({ enabled }: Props) {
  const { map, isLoaded } = useMap()

  useEffect(() => {
    if (!map || !isLoaded || !enabled) return

    // Find ANY existing layer that targets the "building" source-layer.
    // This way we automatically inherit whatever vector source the basemap uses
    // (carto, openmaptiles, etc.) without hard-coding a source id.
    const style = map.getStyle()
    const buildingLayer = style.layers.find(
      (l): l is LayerSpecification & { source: string; 'source-layer': string } =>
        'source-layer' in l && (l as { 'source-layer'?: string })['source-layer'] === 'building' && 'source' in l,
    )
    if (!buildingLayer) return

    if (map.getLayer(LAYER_ID)) return

    map.addLayer({
      id: LAYER_ID,
      type: 'fill-extrusion',
      source: buildingLayer.source,
      'source-layer': 'building',
      minzoom: 14,
      paint: {
        'fill-extrusion-color': '#9ca3af',
        'fill-extrusion-height': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14,
          0,
          16,
          ['coalesce', ['get', 'render_height'], ['get', 'height'], 10],
        ],
        'fill-extrusion-base': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14,
          0,
          16,
          ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
        ],
        'fill-extrusion-opacity': 0.7,
      },
    })

    return () => {
      try {
        if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID)
      } catch {
        // map is being torn down or style swapped
      }
    }
  }, [map, isLoaded, enabled])

  return null
}
