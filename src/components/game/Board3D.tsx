import { ALL_SQUARES } from '@/lib/chess/coords'
import { Square3D } from './Square3D'

const FRAME_COLOR = '#1E1E2E'

/** Tablero completo: marco elevado + 64 casillas clickeables. */
export function Board3D() {
  return (
    <group>
      <mesh receiveShadow position={[0, -0.26, 0]}>
        <boxGeometry args={[9, 0.3, 9]} />
        <meshStandardMaterial color={FRAME_COLOR} roughness={0.5} metalness={0.1} />
      </mesh>
      {ALL_SQUARES.map((square) => (
        <Square3D key={square} square={square} />
      ))}
    </group>
  )
}
