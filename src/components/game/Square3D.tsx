import type { ThreeEvent } from '@react-three/fiber'
import { isLightSquare, squareToPosition } from '@/lib/chess/coords'
import { useGameStore } from '@/stores/gameStore'
import type { Square } from '@/types/game'

const LIGHT_COLOR = '#D4A853'
const DARK_COLOR = '#8B6914'
const SELECTED_EMISSIVE = '#4CAF82'
/** Umbral en píxeles para distinguir un click de un arrastre de cámara. */
const CLICK_DRAG_THRESHOLD = 5

interface Square3DProps {
  square: Square
}

export function Square3D({ square }: Square3DProps) {
  const selectSquare = useGameStore((state) => state.selectSquare)
  const isSelected = useGameStore((state) => state.selectedSquare === square)
  const [x, , z] = squareToPosition(square)

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > CLICK_DRAG_THRESHOLD) return
    selectSquare(square)
  }

  return (
    <mesh receiveShadow position={[x, -0.1, z]} onClick={handleClick}>
      <boxGeometry args={[1, 0.2, 1]} />
      <meshStandardMaterial
        color={isLightSquare(square) ? LIGHT_COLOR : DARK_COLOR}
        emissive={SELECTED_EMISSIVE}
        emissiveIntensity={isSelected ? 0.35 : 0}
        roughness={0.4}
        metalness={0.05}
      />
    </mesh>
  )
}
