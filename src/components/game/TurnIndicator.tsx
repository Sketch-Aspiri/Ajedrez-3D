import { useGameStore } from '@/stores/gameStore'

export function TurnIndicator() {
  const status = useGameStore((s) => s.status)
  const phase = useGameStore((s) => s.phase)

  if (phase !== 'playing') return null

  const isWhite = status.turn === 'w'

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{ background: 'rgba(20,20,32,0.85)', backdropFilter: 'blur(8px)', border: '1px solid var(--surface-elevated)' }}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{
          background: isWhite ? 'var(--piece-white)' : 'var(--piece-black)',
          border: '1px solid var(--muted)',
        }}
      />
      <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
        Turno: {isWhite ? 'Blancas' : 'Negras'}
      </span>
      {status.inCheck && (
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded"
          style={{ background: 'var(--destructive)', color: '#fff' }}
        >
          ¡JAQUE!
        </span>
      )}
    </div>
  )
}
