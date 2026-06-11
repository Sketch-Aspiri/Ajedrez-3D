import { useEffect, useRef, type ElementRef } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Board3D } from './Board3D'
import { PieceSet } from './PieceSet'
import { MoveHighlights } from './MoveHighlight'

/** Dirección de la cámara (normalizada): vista elevada desde el lado blanco. */
const CAMERA_DIR: [number, number, number] = [0, 0.707, 0.707]
/** Distancia base con la que el tablero llena un viewport apaisado. */
const BASE_DISTANCE = 11.3

type OrbitControlsRef = ElementRef<typeof OrbitControls>

/**
 * Ajusta la distancia de la cámara según el aspect ratio: en vertical (móvil)
 * se aleja para que el tablero entero quepa a lo ancho. Resincroniza
 * OrbitControls tras mover la cámara.
 */
function ResponsiveCamera({
  controlsRef,
}: {
  controlsRef: React.RefObject<OrbitControlsRef | null>
}) {
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)

  useEffect(() => {
    const aspect = size.width / size.height
    // En vertical el ancho del tablero manda: alejar proporcional al aspecto.
    const fit = aspect >= 1 ? 1 : Math.min(Math.max(1 / aspect, 1), 1.9)
    const distance = BASE_DISTANCE * fit

    camera.position.set(
      CAMERA_DIR[0] * distance,
      CAMERA_DIR[1] * distance,
      CAMERA_DIR[2] * distance,
    )
    camera.updateProjectionMatrix()
    controlsRef.current?.update()
  }, [camera, size, controlsRef])

  return null
}

/**
 * Escena R3F principal: cámara, luces, tablero, piezas y highlights.
 * La cámara orbita limitada para no pasar por debajo del tablero y se adapta
 * al tamaño de pantalla (responsive).
 */
export function GameScene() {
  const controlsRef = useRef<OrbitControlsRef>(null)

  return (
    <Canvas
      className="game-canvas"
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 8, 8], fov: 45 }}
    >
      <color attach="background" args={['#0A0A0F']} />
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[5, 10, 5]}
        intensity={1.6}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <Board3D />
      <PieceSet />
      <MoveHighlights />
      <OrbitControls
        ref={controlsRef}
        enablePan={false}
        minDistance={6}
        maxDistance={24}
        minPolarAngle={0.2}
        maxPolarAngle={1.35}
        target={[0, 0, 0]}
      />
      <ResponsiveCamera controlsRef={controlsRef} />
    </Canvas>
  )
}
