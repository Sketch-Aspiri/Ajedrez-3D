import { useEffect } from 'react'
import { GameScene } from '@/components/game/GameScene'
import { PromotionDialog } from '@/components/game/PromotionDialog'
import { GameHUD } from '@/components/game/GameHUD'
import { useGameStore } from '@/stores/gameStore'

export default function App() {
  const startGame = useGameStore((state) => state.startGame)

  useEffect(() => {
    startGame('local')
  }, [startGame])

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <GameScene />
      <PromotionDialog />
      <GameHUD />
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'rgba(232, 232, 240, 0.25)',
          fontSize: '11px',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '0.08em',
          userSelect: 'none',
          pointerEvents: 'none',
          whiteSpace: 'nowrap',
        }}
      >
        hecho por Andrés Aspiri
      </div>
    </div>
  )
}
