import { useEffect } from 'react'
import { GameScene } from '@/components/game/GameScene'
import { PromotionDialog } from '@/components/game/PromotionDialog'
import { GameHUD } from '@/components/game/GameHUD'
import { useGameStore } from '@/stores/gameStore'
import { useAIOpponent } from '@/hooks/useAIOpponent'

export default function App() {
  const startGame = useGameStore((state) => state.startGame)

  // Motor de IA: mueve solo cuando la partida está en modo `ai`.
  useAIOpponent()

  useEffect(() => {
    startGame('local')
  }, [startGame])

  return (
    <div className="relative h-full w-full overflow-hidden">
      <GameScene />
      <PromotionDialog />
      <GameHUD />
      <div
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 select-none whitespace-nowrap"
        style={{
          top: 'max(8px, env(safe-area-inset-top))',
          color: 'rgba(232, 232, 240, 0.25)',
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.08em',
          zIndex: 6,
        }}
      >
        hecho por Andrés Aspiri
      </div>
    </div>
  )
}
