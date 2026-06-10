import { useMemo } from 'react'
import { squareToPosition } from '@/lib/chess/coords'
import { useGameStore } from '@/stores/gameStore'
import type { Square } from '@/types/game'

const HIGHLIGHT_COLOR = '#4CAF82'

/** Raycast no-op: los marcadores no deben interceptar clicks a las casillas. */
function noRaycast() {}

/** Marcadores 3D de los destinos legales de la pieza seleccionada. */
export function MoveHighlights() {
  const validMoves = useGameStore((state) => state.validMoves)

  // Las 4 coronaciones posibles apuntan a la misma casilla: deduplicar
  // destinos y marcar si alguno de los movimientos es captura.
  const targets = useMemo(() => {
    const bySquare = new Map<Square, boolean>()
    for (const move of validMoves) {
      bySquare.set(move.to, (bySquare.get(move.to) ?? false) || move.isCapture())
    }
    return [...bySquare.entries()]
  }, [validMoves])

  return (
    <group>
      {targets.map(([square, isCapture]) => (
        <HighlightMarker key={square} square={square} isCapture={isCapture} />
      ))}
    </group>
  )
}

interface HighlightMarkerProps {
  square: Square
  isCapture: boolean
}

/**
 * Esfera para movimientos normales, anillo para capturas.
 * `raycast={noRaycast}` evita que intercepten los clicks destinados a la casilla.
 */
function HighlightMarker({ square, isCapture }: HighlightMarkerProps) {
  const [x, , z] = squareToPosition(square)

  if (isCapture) {
    return (
      <mesh
        raycast={noRaycast}
        position={[x, 0.03, z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.4, 0.045, 12, 32]} />
        <meshStandardMaterial color={HIGHLIGHT_COLOR} transparent opacity={0.85} />
      </mesh>
    )
  }

  return (
    <mesh raycast={noRaycast} position={[x, 0.12, z]}>
      <sphereGeometry args={[0.12, 16, 16]} />
      <meshStandardMaterial color={HIGHLIGHT_COLOR} transparent opacity={0.7} />
    </mesh>
  )
}
