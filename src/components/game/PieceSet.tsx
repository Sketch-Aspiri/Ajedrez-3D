import { useMemo } from 'react'
import { fenToPieces } from '@/lib/chess/engine'
import { useGameStore } from '@/stores/gameStore'
import { Piece3D } from './Piece3D'

/** Renderiza todas las piezas activas derivadas del FEN del store. */
export function PieceSet() {
  const fen = useGameStore((state) => state.fen)
  const pieces = useMemo(() => fenToPieces(fen), [fen])

  return (
    <group>
      {pieces.map((piece) => (
        <Piece3D
          key={`${piece.color}${piece.type}-${piece.square}`}
          piece={piece}
        />
      ))}
    </group>
  )
}
