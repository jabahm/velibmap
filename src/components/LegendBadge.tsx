type Props = {
  lastUpdated: number | null
  error: string | null
  now: number
}

function ago(ms: number): string {
  const s = Math.round(ms / 1000)
  if (s < 60) return `il y a ${s} s`
  const m = Math.round(s / 60)
  return `il y a ${m} min`
}

const SWATCHES: [string, string][] = [
  ['bg-emerald-500', '3 +'],
  ['bg-amber-500', '1-2'],
  ['bg-gray-400', '0'],
]

export function LegendBadge({ lastUpdated, error, now }: Props) {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex flex-col gap-1">
      <div className="pointer-events-auto inline-flex items-center gap-2 rounded-md border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground shadow-sm backdrop-blur">
        {SWATCHES.map(([bg, label]) => (
          <span key={label} className="inline-flex items-center gap-1">
            <span className={`inline-block size-2.5 rounded-full ${bg}`} />
            {label}
          </span>
        ))}
      </div>
      <div className="pointer-events-auto inline-flex items-center gap-1.5 rounded-md border bg-background/90 px-2 py-1 text-[10px] text-muted-foreground shadow-sm backdrop-blur">
        {error ? (
          <span className="text-destructive">Erreur : {error}</span>
        ) : lastUpdated ? (
          <span>
            MAJ {ago(now - lastUpdated)} ·{' '}
            <a
              href="https://opendata.paris.fr/explore/dataset/velib-disponibilite-en-temps-reel/"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              opendata.paris.fr
            </a>
          </span>
        ) : (
          <span>Chargement…</span>
        )}
      </div>
    </div>
  )
}
