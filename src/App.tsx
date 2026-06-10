import { useEffect } from 'react'
import { GameScene } from '@/components/game/GameScene'
import { PromotionDialog } from '@/components/game/PromotionDialog'
import { useGameStore } from '@/stores/gameStore'

/**
 * Harness mínimo: arranca una partida local y monta la escena 3D.
 * El routing (Home/Lobby/Profile) y el HUD llegan en los steps 7+.
 */
export default function App() {
  const startGame = useGameStore((state) => state.startGame)

  useEffect(() => {
    startGame('local')
  }, [startGame])

  return (
    <div className="relative h-screen w-screen">
      <GameScene />
      <PromotionDialog />
    </div>
  )
}
