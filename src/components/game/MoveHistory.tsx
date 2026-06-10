import { useEffect, useRef } from 'react'
import { useGameStore } from '@/stores/gameStore'

export function MoveHistory() {
  const history = useGameStore((s) => s.history)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [history.length])

  if (history.length === 0) {
    return (
      <p className="text-xs italic px-1" style={{ color: 'var(--muted)' }}>
        Sin movimientos
      </p>
    )
  }

  const lastIdx = history.length - 1
  const lastPairIdx = Math.floor(lastIdx / 2)
  const lastSide = lastIdx % 2

  const pairs: [string, string | undefined][] = []
  for (let i = 0; i < history.length; i += 2) {
    pairs.push([history[i], history[i + 1]])
  }

  return (
    <div ref={scrollRef} className="overflow-y-auto flex-1 min-h-0 space-y-0.5">
      {pairs.map(([white, black], pairIdx) => (
        <div key={pairIdx} className="flex gap-1 items-baseline font-mono text-xs">
          <span className="w-5 text-right flex-shrink-0" style={{ color: 'var(--muted)' }}>
            {pairIdx + 1}.
          </span>
          <span
            className="w-10 px-0.5 rounded"
            style={{
              color: 'var(--text)',
              background:
                pairIdx === lastPairIdx && lastSide === 0
                  ? 'var(--surface-elevated)'
                  : 'transparent',
            }}
          >
            {white}
          </span>
          {black !== undefined && (
            <span
              className="w-10 px-0.5 rounded"
              style={{
                color: 'var(--text)',
                background:
                  pairIdx === lastPairIdx && lastSide === 1
                    ? 'var(--surface-elevated)'
                    : 'transparent',
              }}
            >
              {black}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
