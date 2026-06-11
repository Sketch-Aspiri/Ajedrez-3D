import * as THREE from 'three'
import type { ReactNode } from 'react'
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

/** Segmentos radiales del torneado: más alto = más suave. */
const LATHE_SEGMENTS = 48

/**
 * Perfil 2D (radio, altura) de cada pieza, revolucionado alrededor del eje Y
 * para obtener un cuerpo torneado estilo Staunton. El pie va incluido en el
 * perfil; los remates no-revolucionados (almenas, corona, cruz, cabeza del
 * caballo) se añaden aparte sobre el cuerpo.
 */
const PROFILES: Record<PieceSymbol, ReadonlyArray<readonly [number, number]>> = {
  // Peón — pie acampanado, cuello fino y collar; la cabeza es una bola aparte.
  p: [
    [0, 0],
    [0.27, 0],
    [0.28, 0.04],
    [0.23, 0.085],
    [0.13, 0.115],
    [0.115, 0.155],
    [0.155, 0.2],
    [0.11, 0.27],
    [0.1, 0.33],
    [0.135, 0.36],
    [0.11, 0.39],
    [0, 0.4],
  ],
  // Torre — fuste recto que abre en una plataforma; almenas aparte.
  r: [
    [0, 0],
    [0.31, 0],
    [0.32, 0.05],
    [0.26, 0.1],
    [0.2, 0.14],
    [0.18, 0.2],
    [0.17, 0.3],
    [0.185, 0.38],
    [0.215, 0.44],
    [0.245, 0.49],
    [0.245, 0.56],
    [0.205, 0.575],
    [0, 0.575],
  ],
  // Caballo — solo el pedestal torneado; la cabeza se modela con cajas.
  n: [
    [0, 0],
    [0.3, 0],
    [0.31, 0.05],
    [0.25, 0.1],
    [0.19, 0.14],
    [0.165, 0.2],
    [0.16, 0.3],
    [0.175, 0.36],
    [0.16, 0.4],
    [0, 0.41],
  ],
  // Alfil — cuerpo esbelto que termina en mitra ojival; bolita finial aparte.
  b: [
    [0, 0],
    [0.29, 0],
    [0.3, 0.045],
    [0.25, 0.09],
    [0.17, 0.13],
    [0.13, 0.17],
    [0.155, 0.22],
    [0.115, 0.29],
    [0.105, 0.38],
    [0.15, 0.44],
    [0.12, 0.48],
    [0.185, 0.55],
    [0.195, 0.6],
    [0.16, 0.7],
    [0.1, 0.8],
    [0.04, 0.88],
    [0, 0.92],
  ],
  // Dama — cuerpo acampanado con cáliz ancho; corona de puntas aparte.
  q: [
    [0, 0],
    [0.32, 0],
    [0.33, 0.05],
    [0.27, 0.1],
    [0.19, 0.14],
    [0.155, 0.18],
    [0.18, 0.225],
    [0.135, 0.28],
    [0.12, 0.36],
    [0.112, 0.44],
    [0.15, 0.48],
    [0.12, 0.52],
    [0.135, 0.57],
    [0.195, 0.66],
    [0.235, 0.74],
    [0.255, 0.8],
    [0.235, 0.835],
    [0.205, 0.85],
    [0.205, 0.82],
    [0, 0.81],
  ],
  // Rey — el más alto, cuerpo majestuoso; banda de corona, orbe y cruz aparte.
  k: [
    [0, 0],
    [0.32, 0],
    [0.33, 0.05],
    [0.27, 0.1],
    [0.19, 0.14],
    [0.155, 0.18],
    [0.18, 0.225],
    [0.135, 0.28],
    [0.12, 0.37],
    [0.113, 0.47],
    [0.15, 0.51],
    [0.12, 0.55],
    [0.14, 0.61],
    [0.2, 0.7],
    [0.225, 0.77],
    [0.215, 0.82],
    [0.235, 0.85],
    [0.205, 0.88],
    [0.205, 0.85],
    [0, 0.84],
  ],
}

/** Construye una geometría de torno a partir de un perfil (radio, altura). */
function makeLathe(profile: ReadonlyArray<readonly [number, number]>): THREE.LatheGeometry {
  const points = profile.map(([x, y]) => new THREE.Vector2(x, y))
  return new THREE.LatheGeometry(points, LATHE_SEGMENTS)
}

/** Geometrías de cuerpo precomputadas y compartidas por todas las instancias. */
const BODY_GEOMETRIES: Record<PieceSymbol, THREE.LatheGeometry> = {
  p: makeLathe(PROFILES.p),
  r: makeLathe(PROFILES.r),
  n: makeLathe(PROFILES.n),
  b: makeLathe(PROFILES.b),
  q: makeLathe(PROFILES.q),
  k: makeLathe(PROFILES.k),
}

/**
 * Silueta lateral de la cabeza del caballo (x = adelante/atrás, y = altura),
 * suavizada con spline y extruida con bisel para un acabado orgánico — como
 * un caballo Staunton tallado, en vez de cajas apiladas. El hocico apunta a +x.
 */
const KNIGHT_HEAD_PROFILE: ReadonlyArray<readonly [number, number]> = [
  [-0.18, 0.3], // base trasera del cuello
  [-0.19, 0.46],
  [-0.16, 0.6],
  [-0.1, 0.74], // arranque de la crin
  [-0.02, 0.84],
  [0.06, 0.88], // nuca (entre las orejas)
  [0.12, 0.84],
  [0.15, 0.74], // frente
  [0.2, 0.66],
  [0.27, 0.58], // caña de la nariz
  [0.33, 0.52],
  [0.345, 0.46], // punta del hocico
  [0.31, 0.42],
  [0.22, 0.4], // boca
  [0.14, 0.41],
  [0.07, 0.45], // mandíbula
  [0.0, 0.46],
  [-0.05, 0.42],
  [-0.1, 0.36], // frente del cuello
  [-0.14, 0.3], // base delantera del cuello
]

const KNIGHT_HEAD_DEPTH = 0.22

/** Extruye la silueta del caballo, centra el grosor y suaviza las normales. */
function makeKnightHead(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape()
  const points = KNIGHT_HEAD_PROFILE.map(([x, y]) => new THREE.Vector2(x, y))
  shape.moveTo(points[0].x, points[0].y)
  shape.splineThru(points.slice(1))
  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: KNIGHT_HEAD_DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 3,
    steps: 1,
    curveSegments: 24,
  })
  geometry.translate(0, 0, -KNIGHT_HEAD_DEPTH / 2) // centrar el grosor en el eje
  geometry.computeVertexNormals()
  return geometry
}

const KNIGHT_HEAD_GEOMETRY = makeKnightHead()

interface Piece3DProps {
  piece: BoardPiece
}

/**
 * Pieza de ajedrez torneada (estilo Staunton). Cada tipo tiene una silueta
 * inconfundible: peón (bola), torre (almenas), caballo (cabeza), alfil
 * (mitra ojival), dama (corona de puntas) y rey (cruz + orbe).
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

/** Cuerpo torneado compartido + el remate específico de cada pieza. */
function PieceBody({ type, color, material }: PieceBodyProps) {
  return (
    <>
      <mesh castShadow material={material} geometry={BODY_GEOMETRIES[type]} />
      <PieceTopper type={type} color={color} material={material} />
    </>
  )
}

function PieceTopper({ type, color, material }: PieceBodyProps) {
  switch (type) {
    case 'p':
      return <PawnHead material={material} />
    case 'r':
      return <RookCrenels material={material} />
    case 'n':
      return <KnightHead material={material} color={color} />
    case 'b':
      return <BishopFinial material={material} />
    case 'q':
      return <QueenCrown material={material} />
    case 'k':
      return <KingCrown material={material} />
  }
}

/**
 * Anillo de elementos repetidos alrededor del eje (almenas, puntas de corona).
 * `render` recibe el ángulo de cada elemento.
 */
function Ring({
  count,
  render,
}: {
  count: number
  render: (angle: number, index: number) => ReactNode
}) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => render((i / count) * Math.PI * 2, i))}
    </>
  )
}

// Peón — bola superior.
function PawnHead({ material }: BodyProps) {
  return (
    <mesh castShadow material={material} position={[0, 0.47, 0]}>
      <sphereGeometry args={[0.145, 24, 24]} />
    </mesh>
  )
}

// Torre — almenas (merlones) sobre la plataforma.
function RookCrenels({ material }: BodyProps) {
  return (
    <Ring
      count={6}
      render={(angle, i) => (
        <mesh
          key={i}
          castShadow
          material={material}
          position={[Math.cos(angle) * 0.165, 0.63, Math.sin(angle) * 0.165]}
        >
          <boxGeometry args={[0.1, 0.14, 0.1]} />
        </mesh>
      )}
    />
  )
}

// Alfil — bolita finial sobre la punta de la mitra.
function BishopFinial({ material }: BodyProps) {
  return (
    <mesh castShadow material={material} position={[0, 0.91, 0]}>
      <sphereGeometry args={[0.055, 16, 16]} />
    </mesh>
  )
}

// Dama — corona de 8 puntas con bolas + finial central.
function QueenCrown({ material }: BodyProps) {
  return (
    <>
      <Ring
        count={8}
        render={(angle, i) => (
          <group
            key={i}
            position={[Math.cos(angle) * 0.2, 0, Math.sin(angle) * 0.2]}
          >
            <mesh castShadow material={material} position={[0, 0.88, 0]}>
              <coneGeometry args={[0.04, 0.14, 12]} />
            </mesh>
            <mesh castShadow material={material} position={[0, 0.97, 0]}>
              <sphereGeometry args={[0.05, 12, 12]} />
            </mesh>
          </group>
        )}
      />
      {/* Finial central */}
      <mesh castShadow material={material} position={[0, 0.9, 0]}>
        <coneGeometry args={[0.05, 0.16, 16]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 1.0, 0]}>
        <sphereGeometry args={[0.06, 16, 16]} />
      </mesh>
    </>
  )
}

// Rey — banda de corona, orbe y cruz inconfundible.
function KingCrown({ material }: BodyProps) {
  return (
    <>
      {/* Banda de la corona */}
      <mesh
        castShadow
        material={material}
        position={[0, 0.87, 0]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.17, 0.04, 12, 24]} />
      </mesh>
      {/* Orbe bajo la cruz */}
      <mesh castShadow material={material} position={[0, 0.96, 0]}>
        <sphereGeometry args={[0.095, 20, 20]} />
      </mesh>
      {/* Cruz */}
      <mesh castShadow material={material} position={[0, 1.12, 0]}>
        <boxGeometry args={[0.05, 0.24, 0.05]} />
      </mesh>
      <mesh castShadow material={material} position={[0, 1.11, 0]}>
        <boxGeometry args={[0.16, 0.05, 0.05]} />
      </mesh>
    </>
  )
}

// Caballo — silueta de equino extruida sobre el pedestal. El perfil tallado
// (caras planas) queda de frente al jugador; el hocico apunta a un costado.
// Blancas y negras quedan en espejo (cada bando mira hacia un lado).
function KnightHead({ material, color }: BodyProps & { color: Color }) {
  return (
    <group rotation={[0, color === 'w' ? Math.PI : 0, 0]}>
      {/* Cabeza tallada: el perfil (plano XY) encara la cámara en ±z. */}
      <mesh castShadow material={material} geometry={KNIGHT_HEAD_GEOMETRY} />
      {/* Orejas, separadas a lo ancho de la cabeza */}
      <mesh
        castShadow
        material={material}
        position={[0.03, 0.92, 0.05]}
        rotation={[0.25, 0, 0]}
      >
        <coneGeometry args={[0.033, 0.12, 12]} />
      </mesh>
      <mesh
        castShadow
        material={material}
        position={[0.03, 0.92, -0.05]}
        rotation={[-0.25, 0, 0]}
      >
        <coneGeometry args={[0.033, 0.12, 12]} />
      </mesh>
    </group>
  )
}
