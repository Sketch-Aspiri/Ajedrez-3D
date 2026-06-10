import { useGameStore } from '@/stores/gameStore'

export function GameControls() {
  const phase = useGameStore((s) => s.phase)
  const playerColor = useGameStore((s) => s.playerColor)
  const mode = useGameStore((s) => s.mode)
  const aiDifficulty = useGameStore((s) => s.aiDifficulty)
  const resign = useGameStore((s) => s.resign)
  const startGame = useGameStore((s) => s.startGame)

  const handleResign = () => resign(playerColor)
  const handleNewGame = () => startGame(mode, { aiDifficulty, playerColor })

  return (
    <div className="flex gap-2">
      {phase === 'playing' && (
        <button onClick={handleResign} className="btn-hud btn-danger-hud flex-1">
          Rendirse
        </button>
      )}
      <button onClick={handleNewGame} className="btn-hud btn-primary-hud flex-1">
        Nueva partida
      </button>
    </div>
  )
}
