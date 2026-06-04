import { useState, type ReactNode } from 'react'
import { Drawer } from 'vaul'

type Props = {
  children: ReactNode
}

// Snap points expressed as fractions of viewport height.
// 0.22 = peek (~190px on a 844px screen): handle + header + address + chips.
// 0.55 = half-open: + nearby stations list.
// 0.92 = nearly fullscreen.
const SNAP_POINTS = [0.22, 0.55, 0.92] as const

/**
 * Persistent bottom sheet for mobile, à la Google Maps / Citymapper.
 *
 * - `modal={false}` keeps the map underneath fully interactive: no scrim,
 *   no body lock. Touch events on the canvas pass through.
 * - `dismissible={false}` + `open` always true: the sheet never closes, the
 *   user just swipes between snap points.
 * - Inner content scrolls only once the sheet is at the topmost snap; on
 *   intermediate snaps the drag moves the sheet itself.
 */
export function MobileSheet({ children }: Props) {
  const [snap, setSnap] = useState<number | string | null>(SNAP_POINTS[0])

  return (
    <Drawer.Root
      open
      modal={false}
      dismissible={false}
      snapPoints={[...SNAP_POINTS]}
      activeSnapPoint={snap}
      setActiveSnapPoint={setSnap}
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
  )
}
