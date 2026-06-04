import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { Drawer } from 'vaul'

type Props = {
  children: ReactNode
}

// Snap points expressed as fractions of viewport height.
// 0.22 = peek (~190px on a 844px screen): handle + header + address + chips.
// 0.55 = half-open: + nearby stations list.
// 0.92 = nearly fullscreen.
const SNAP_POINTS = [0.22, 0.55, 0.92] as const

type SheetCtx = {
  expand: (level?: 'half' | 'full') => void
  collapse: () => void
}

const SheetContext = createContext<SheetCtx | null>(null)

/**
 * Read on a child component to drive the sheet from elsewhere
 * (e.g. expand it when the address input is focused).
 * Returns no-op functions when not inside MobileSheet.
 */
export function useSheet(): SheetCtx {
  return (
    useContext(SheetContext) ?? {
      expand: () => {},
      collapse: () => {},
    }
  )
}

/**
 * Persistent bottom sheet for mobile, à la Google Maps / Citymapper.
 *
 * - `modal={false}` keeps the map underneath fully interactive: no scrim,
 *   no body lock. Touch events on the canvas pass through.
 * - `dismissible={false}` + `open` always true: the sheet never closes, the
 *   user just swipes between snap points.
 * - Inner content scrolls only once the sheet is at the topmost snap; on
 *   intermediate snaps the drag moves the sheet itself.
 * - Children can call `useSheet().expand()` to programmatically jump up
 *   (e.g. when the address input takes focus and needs room for the
 *   autocomplete dropdown).
 */
export function MobileSheet({ children }: Props) {
  const [snap, setSnap] = useState<number | string | null>(SNAP_POINTS[0])

  const ctx = useMemo<SheetCtx>(
    () => ({
      expand: (level: 'half' | 'full' = 'half') => {
        const target = level === 'full' ? SNAP_POINTS[2] : SNAP_POINTS[1]
        setSnap((current) => {
          const cur = typeof current === 'number' ? current : 0
          // Only move up — never collapse on focus.
          return cur < target ? target : current
        })
      },
      // Vaul drops snap-down requests that happen inside the same React tick
      // as the click. Pushing it to the next tick (via setTimeout 0) lets the
      // drawer state settle first, then the collapse takes effect.
      collapse: () => {
        setTimeout(() => setSnap(SNAP_POINTS[0]), 0)
      },
    }),
    [],
  )

  const setSnapWrapped = useCallback((s: number | string | null) => setSnap(s), [])
  // Vaul does identity checks on snapPoints; stable reference avoids reinit
  // and lost programmatic snap changes when the parent rerenders.
  const snapPointsStable = useMemo(() => [...SNAP_POINTS], [])

  return (
    <SheetContext.Provider value={ctx}>
      <Drawer.Root
        open
        modal={false}
        dismissible={false}
        snapPoints={snapPointsStable}
        activeSnapPoint={snap}
        setActiveSnapPoint={setSnapWrapped}
      >
        <Drawer.Portal>
          <Drawer.Content
            aria-describedby={undefined}
            className="fixed inset-x-0 bottom-0 z-30 mx-auto flex h-full max-h-[97%] flex-col rounded-t-2xl border border-b-0 bg-background shadow-xl outline-none"
          >
            <div className="mx-auto my-2 h-1 w-10 shrink-0 rounded-full bg-muted-foreground/40" />
            <Drawer.Title className="sr-only">VélibMap</Drawer.Title>
            <Drawer.Description className="sr-only">
              Recherche et stations Vélib' à proximité
            </Drawer.Description>
            <div className="flex-1 overflow-auto px-3 pb-4">{children}</div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </SheetContext.Provider>
  )
}
