import { Sun, Moon, Square, Box, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'

export type Theme = 'light' | 'dark'
export type ViewMode = 'flat' | 'pitched' | 'globe'

type Props = {
  theme: Theme
  onThemeChange: (t: Theme) => void
  view: ViewMode
  onViewChange: (v: ViewMode) => void
}

const VIEWS: { value: ViewMode; label: string; icon: React.ReactNode }[] = [
  { value: 'flat', label: '2D', icon: <Square className="size-4" /> },
  { value: 'pitched', label: 'Pitch', icon: <Box className="size-4" /> },
  { value: 'globe', label: 'Globe', icon: <Globe className="size-4" /> },
]

function PillButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={label}
      title={label}
      className={cn(
        'flex size-8 items-center justify-center transition-colors',
        'first:rounded-t-md last:rounded-b-md',
        'hover:bg-accent',
        active && 'bg-accent text-foreground',
        !active && 'text-muted-foreground',
      )}
    >
      {children}
    </button>
  )
}

export function MapViewControls({ theme, onThemeChange, view, onViewChange }: Props) {
  return (
    <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
      <div className="flex flex-col overflow-hidden rounded-md border bg-background shadow-sm">
        <PillButton
          active={theme === 'light'}
          onClick={() => onThemeChange('light')}
          label="Thème clair"
        >
          <Sun className="size-4" />
        </PillButton>
        <PillButton
          active={theme === 'dark'}
          onClick={() => onThemeChange('dark')}
          label="Thème sombre"
        >
          <Moon className="size-4" />
        </PillButton>
      </div>
      <div className="flex flex-col overflow-hidden rounded-md border bg-background shadow-sm">
        {VIEWS.map((v) => (
          <PillButton
            key={v.value}
            active={view === v.value}
            onClick={() => onViewChange(v.value)}
            label={v.label}
          >
            {v.icon}
          </PillButton>
        ))}
      </div>
    </div>
  )
}
