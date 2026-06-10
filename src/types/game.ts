import type { Color, PieceSymbol, Square, Move } from 'chess.js'

// Re-export de los tipos base de chess.js para que el resto de la app
// importe todo el vocabulario del dominio desde un solo lugar.
export type { Color, PieceSymbol, Square, Move }

/** Modos de juego soportados. */
export type GameMode = 'local' | 'ai' | 'online'

/** Niveles de dificultad de la IA. El depth de búsqueda se mapea en el módulo de IA. */
export type AIDifficulty = 'easy' | 'medium' | 'hard'

/**
 * Estado posible de una partida derivado de una posición.
 * `check` no termina la partida; los `draw_*` y `checkmate`/`stalemate` sí.
 */
export type GameStatusType =
  | 'playing'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw_repetition'
  | 'draw_fifty_moves'
  | 'draw_insufficient_material'

/** Resultado final de una partida. `null` mientras sigue en curso. */
export type Winner = Color | 'draw' | null

/** Snapshot completo del estado de reglas de una posición. */
export interface GameStatus {
  type: GameStatusType
  isGameOver: boolean
  /** Color al que le toca mover. */
  turn: Color
  /** Si el jugador en turno está en jaque. */
  inCheck: boolean
  winner: Winner
}

/** Pieza activa en el tablero con su casilla. */
export interface BoardPiece {
  square: Square
  type: PieceSymbol
  color: Color
}

/** Resultado de intentar aplicar un movimiento sobre una posición. */
export interface MoveResult {
  /** `true` si el movimiento era legal y se aplicó. */
  success: boolean
  /** FEN resultante si `success`; el FEN original sin cambios si falló. */
  fen: string
  /** El movimiento aplicado, o `null` si fue ilegal. */
  move: Move | null
  /** Estado de reglas tras el intento. */
  status: GameStatus
}

/** Piezas capturadas de cada bando (por tipo). */
export interface CapturedPieces {
  /** Piezas blancas capturadas (por las negras). */
  white: PieceSymbol[]
  /** Piezas negras capturadas (por las blancas). */
  black: PieceSymbol[]
}

/** Opciones al iniciar una partida. */
export interface GameOptions {
  aiDifficulty?: AIDifficulty
  /** Color que controla el jugador humano (modo IA / online). */
  playerColor?: Color
  /** Código de sala (modo online). */
  roomCode?: string
}
