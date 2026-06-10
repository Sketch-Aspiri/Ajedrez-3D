import { useGameStore } from '@/stores/gameStore'
import type { Winner } from '@/types/game'

function resolveWinnerText(winner: Winner): string {
  if (winner === 'w') return '¡Ganan las Blancas!'
  if (winner === 'b') return '¡Ganan las Negras!'
  return 'Tablas'
}

function resolveWinnerIcon(winner: Winner): string {
  if (winner === 'w') return '♔'
  if (winner === 'b') return '♚'
  return '½'
}

export function GameResult() {
  const phase = useGameStore((s) => s.phase)
  const result = useGameStore((s) => s.result)
  const mode = useGameStore((s) => s.mode)
  const aiDifficulty = useGameStore((s) => s.aiDifficulty)
  const playerColor = useGameStore((s) => s.playerColor)
  const startGame = useGameStore((s) => s.startGame)

  if (phase !== 'ended' || !result) return null

  const handleNewGame = () => startGame(mode, { aiDifficulty, playerColor })

  return (
    <div className="absolute inset-0 flex items-center justify-center" style={{ zIndex: 20 }}>
      <div className="absolute inset-0 bg-black/60" style={{ backdropFilter: 'blur(4px)' }} />
      <div
        className="relative flex flex-col items-center gap-4 p-8 rounded-2xl"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--surface-elevated)',
          minWidth: 260,
          zIndex: 21,
        }}
      >
        <span
          className="text-5xl select-none"
          style={{
            color:
              result.winner === 'w'
                ? 'var(--piece-white)'
                : result.winner === 'b'
                  ? 'var(--piece-black)'
                  : 'var(--primary)',
            textShadow: result.winner === 'w' ? '0 0 4px rgba(0,0,0,0.8)' : 'none',
          }}
        >
          {resolveWinnerIcon(result.winner)}
        </span>

        <h2
          className="text-xl font-bold text-center"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--primary)' }}
        >
          {resolveWinnerText(result.winner)}
        </h2>

        {result.reason && (
          <p className="text-sm capitalize text-center" style={{ color: 'var(--muted)' }}>
            por {result.reason}
          </p>
        )}

        <button onClick={handleNewGame} className="btn-hud btn-primary-hud w-full mt-1">
          Nueva Partida
        </button>
      </div>
    </div>
  )
}
