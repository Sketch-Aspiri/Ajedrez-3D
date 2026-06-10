import * as THREE from 'three'
import type { ThreeEvent } from '@react-three/fiber'
import { squareToPosition } from '@/lib/chess/coords'
import { useGameStore } from '@/stores/gameStore'
import type { BoardPiece, Color, PieceSymbol } from '@/types/game'

/** Umbral en píxeles para distinguir un click de un arrastre de cámara. */
const CLICK_DRAG_THRESHOLD = 5

// Materiales compartidos por todas las piezas (dos instancias en total).
const PIECE_MATERIALS: Record<Color, THREE.MeshStandardMaterial> = {
  w: new THREE.MeshStandardMaterial({
    color: '#F0E6D3',
    roughness: 0.3,
    metalness: 0.1,
  }),
  b: new THREE.MeshStandardMaterial({
    color: '#2A2035',
    roughness: 0.3,
    metalness: 0.1,
  }),
}

interface Piece3DProps {
  piece: BoardPiece
}

/**
 * Pieza de ajedrez con geometría procedural (estilo Staunton simplificado).
 * Clickeable: delega la selección al gameStore.
 */
export function Piece3D({ piece }: Piece3DProps) {
  const selectSquare = useGameStore((state) => state.selectSquare)
  const material = PIECE_MATERIALS[piece.color]

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    if (event.delta > CLICK_DRAG_THRESHOLD) return
    selectSquare(piece.square)
  }

  return (
    <group position={squareToPosition(piece.square)} onClick={handleClick}>
      <PieceBody type={piece.type} color={piece.color} material={material} />
    </group>
  )
}

interface BodyProps {
  material: THREE.Material
}

interface PieceBodyProps extends BodyProps {
  type: PieceSymbol
  color: Color
}

function PieceBody({ type, color, material }: PieceBodyProps) {
  switch (type) {
    case 'p':
      return <PawnBody material={material} />
    case 'r':
      return <RookBody material={material} />
    case 'n':
      return <KnightBody material={material} color={color} />
    case 'b':
      return <BishopBody material={material} />
    case 'q':
      return <QueenBody material={material} />
    case 'k':
      return <KingBody material={material} />
  }
}

/** Base circular común a todas las piezas. */
function PieceBase({ material }: BodyProps) {
  return (
    <mesh castShadow material={material} position={[0, 0.06, 0]}>
      <cylinderGeometry args={[0.3, 0.34, 0.12, 24]} />
    </mesh>
  )
}

function PawnBody({ material }: BodyProps) {
  return (
    <>
      <PieceBase material={material} />
      <mesh castShadow material={material} position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.12, 0.22, 0.28, 24]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 0.48, 0]}>
        <sphereGeometry args={[0.16, 24, 24]} />
      </mesh>
    </>
  )
}

function RookBody({ material }: BodyProps) {
  return (
    <>
      <PieceBase material={material} />
      <mesh castShadow material={material} position={[0, 0.29, 0]}>
        <cylinderGeometry args={[0.18, 0.24, 0.34, 24]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 0.52, 0]}>
        <cylinderGeometry args={[0.24, 0.22, 0.12, 24]} />
      </mesh>
    </>
  )
}

function KnightBody({ material, color }: BodyProps & { color: Color }) {
  // El caballo mira hacia el bando contrario.
  return (
    <group rotation={[0, color === 'w' ? Math.PI : 0, 0]}>
      <PieceBase material={material} />
      <mesh castShadow material={material} position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.14, 0.22, 0.32, 24]} />
      </mesh>
      <mesh
        castShadow
        material={material}
        position={[0, 0.52, 0.06]}
        rotation={[-0.45, 0, 0]}
      >
        <boxGeometry args={[0.16, 0.2, 0.38]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 0.66, -0.08]}>
        <coneGeometry args={[0.05, 0.12, 12]} />
      </mesh>
    </group>
  )
}

function BishopBody({ material }: BodyProps) {
  return (
    <>
      <PieceBase material={material} />
      <mesh castShadow material={material} position={[0, 0.34, 0]}>
        <coneGeometry args={[0.2, 0.45, 24]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 0.6, 0]}>
        <sphereGeometry args={[0.1, 24, 24]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 0.71, 0]}>
        <sphereGeometry args={[0.04, 16, 16]} />
      </mesh>
    </>
  )
}

function QueenBody({ material }: BodyProps) {
  return (
    <>
      <PieceBase material={material} />
      <mesh castShadow material={material} position={[0, 0.39, 0]}>
        <coneGeometry args={[0.22, 0.55, 24]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 0.72, 0]}>
        <sphereGeometry args={[0.12, 24, 24]} />
      </mesh>
      <mesh
        castShadow
        material={material}
        position={[0, 0.8, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.1, 0.03, 12, 24]} />
      </mesh>
    </>
  )
}

function KingBody({ material }: BodyProps) {
  return (
    <>
      <PieceBase material={material} />
      <mesh castShadow material={material} position={[0, 0.42, 0]}>
        <coneGeometry args={[0.22, 0.6, 24]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 0.83, 0]}>
        <boxGeometry args={[0.05, 0.22, 0.05]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 0.86, 0]}>
        <boxGeometry args={[0.16, 0.05, 0.05]} />
      </mesh>
    </>
  )
}
