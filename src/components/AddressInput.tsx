import { useEffect, useRef, useState } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'
import { searchAddress, type AddressHit } from '@/lib/geocode'
import { useSheet } from '@/components/MobileSheet'

type Props = {
  value: AddressHit | null
  onChange: (hit: AddressHit | null) => void
  placeholder?: string
}

export function AddressInput({ value, onChange, placeholder }: Props) {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [hits, setHits] = useState<AddressHit[]>([])
  const [loading, setLoading] = useState(false)
  const acRef = useRef<AbortController | null>(null)
  const sheet = useSheet()

  useEffect(() => {
    if (acRef.current) acRef.current.abort()
    const needle = q.trim()
    if (needle.length < 2) {
      setHits([])
      setLoading(false)
      return
    }
    setLoading(true)
    const t = setTimeout(() => {
      const ac = new AbortController()
      acRef.current = ac
      searchAddress(needle, ac.signal)
        .then((res) => {
          setHits(res.slice(0, 4))
          setLoading(false)
        })
        .catch((e) => {
          if ((e as Error).name !== 'AbortError') setLoading(false)
        })
    }, 150)
    return () => clearTimeout(t)
  }, [q])

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={value ? value.label : q}
          placeholder={placeholder ?? 'Adresse, place, monument…'}
          onFocus={() => {
            setOpen(true)
            sheet.expand('half')
          }}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            if (value) onChange(null)
            setQ(e.target.value)
            setOpen(true)
          }}
          className="w-full rounded-md border bg-background py-1.5 pl-7 pr-7 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <span className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center">
          {loading && !value && (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          )}
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(null)
                setQ('')
              }}
              className="rounded p-0.5 text-muted-foreground hover:bg-accent"
              aria-label="Effacer"
            >
              <X className="size-3" />
            </button>
          )}
        </span>
      </div>
      {open && !value && hits.length > 0 && (
        <ul className="absolute z-30 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          {hits.map((h) => (
            <li key={h.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  onChange(h)
                  setQ('')
                  setOpen(false)
                }}
                className="block w-full truncate px-2 py-1.5 text-left text-xs hover:bg-accent"
              >
                {h.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
