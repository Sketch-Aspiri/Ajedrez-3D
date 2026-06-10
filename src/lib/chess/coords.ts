import type { Square } from '@/types/game'

const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const
const RANKS = ['1', '2', '3', '4', '5', '6', '7', '8'] as const

/** Las 64 casillas del tablero (a1..a8, b1..b8, ...). */
export const ALL_SQUARES: readonly Square[] = FILES.flatMap((file) =>
  RANKS.map((rank) => `${file}${rank}` as Square),
)

/**
 * Convierte una casilla a coordenadas de mundo 3D.
 * El tablero está centrado en el origen: a1 = [-3.5, 0, 3.5] (esquina
 * del lado blanco, cercana a la cámara) y h8 = [3.5, 0, -3.5].
 */
export function squareToPosition(square: Square): [number, number, number] {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  return [file - 3.5, 0, 3.5 - rank]
}

/** `true` si la casilla es clara (a1 es oscura por convención del ajedrez). */
export function isLightSquare(square: Square): boolean {
  const file = square.charCodeAt(0) - 97
  const rank = Number(square[1]) - 1
  return (file + rank) % 2 === 1
}
