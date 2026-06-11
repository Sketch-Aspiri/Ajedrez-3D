import type { PieceSymbol, Square } from '@/types/game'

/** Movimiento que la IA decide jugar. `promotion` solo en coronaciones. */
export interface BestMove {
  from: Square
  to: Square
  promotion?: PieceSymbol
}

/** Mensaje enviado al Web Worker de la IA. */
export interface AIRequest {
  /** Posición a analizar. */
  fen: string
  /** Profundidad de búsqueda (plies). */
  depth: number
}

/** Respuesta del Web Worker de la IA. `bestMove` es `null` si no hay jugadas. */
export interface AIResponse {
  bestMove: BestMove | null
}
