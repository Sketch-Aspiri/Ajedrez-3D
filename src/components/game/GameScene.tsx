import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Board3D } from './Board3D'
import { PieceSet } from './PieceSet'
import { MoveHighlights } from './MoveHighlight'

/**
 * Escena R3F principal: cámara, luces, tablero, piezas y highlights.
 * La cámara orbita limitada para no pasar por debajo del tablero.
 */
export function GameScene() {
  return (
    <Canvas shadows camera={{ position: [0, 8, 8], fov: 45 }}>
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
        enablePan={false}
        minDistance={6}
        maxDistance={16}
        minPolarAngle={0.2}
        maxPolarAngle={1.35}
        target={[0, 0, 0]}
      />
    </Canvas>
  )
}
