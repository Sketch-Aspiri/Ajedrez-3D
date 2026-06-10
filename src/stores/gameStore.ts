import { create } from 'zustand'
import {
  INITIAL_FEN,
  applyMove,
  getGameStatus,
  getValidMoves,
  requiresPromotion,
} from '@/lib/chess/engine'
import type {
  AIDifficulty,
  Color,
  GameMode,
  GameOptions,
  GameStatus,
  GameStatusType,
  Move,
  PieceSymbol,
  Square,
  Winner,
} from '@/types/game'

/** Fase del ciclo de vida de la partida en la UI. */
export type GamePhase = 'idle' | 'playing' | 'ended'

/** Coronación pendiente de confirmación por el jugador. */
export interface PendingPromotion {
  from: Square
  to: Square
}

/** Resultado final mostrado en el modal de fin de partida. */
export interface GameResultInfo {
  winner: Winner
  reason: string
}

interface GameStore {
  /** FEN de la posición actual — fuente de verdad serializable del estado. */
  fen: string
  mode: GameMode
  aiDifficulty: AIDifficulty
  /** Color que controla el jugador humano (modo IA / online). */
  playerColor: Color
  phase: GamePhase
  status: GameStatus
  selectedSquare: Square | null
  validMoves: Move[]
  pendingPromotion: PendingPromotion | null
  lastMove: { from: Square; to: Square } | null
  /** Historial de la partida en notación SAN. */
  history: string[]
  result: GameResultInfo | null

  startGame: (mode: GameMode, options?: GameOptions) => void
  selectSquare: (square: Square) => void
  makeMove: (from: Square, to: Square, promotion?: PieceSymbol) => void
  cancelPromotion: () => void
  resign: (color: Color) => void
  resetGame: () => void
}

const RESULT_REASONS: Record<GameStatusType, string> = {
  playing: '',
  check: '',
  checkmate: 'jaque mate',
  stalemate: 'tablas por ahogado',
  draw_repetition: 'tablas por triple repetición',
  draw_fifty_moves: 'tablas por regla de 50 movimientos',
  draw_insufficient_material: 'tablas por material insuficiente',
}

/** Estado de partida limpio, compartido por start/reset. */
function freshGameState() {
  return {
    fen: INITIAL_FEN,
    status: getGameStatus(INITIAL_FEN),
    selectedSquare: null,
    validMoves: [] as Move[],
    pendingPromotion: null,
    lastMove: null,
    history: [] as string[],
    result: null,
  }
}

export const useGameStore = create<GameStore>()((set, get) => ({
  ...freshGameState(),
  mode: 'local',
  aiDifficulty: 'medium',
  playerColor: 'w',
  phase: 'idle',

  startGame: (mode, options = {}) => {
    set({
      ...freshGameState(),
      mode,
      aiDifficulty: options.aiDifficulty ?? 'medium',
      playerColor: options.playerColor ?? 'w',
      phase: 'playing',
    })
  },

  selectSquare: (square) => {
    const { phase, pendingPromotion, selectedSquare, validMoves, fen } = get()
    if (phase !== 'playing' || pendingPromotion) return

    // Con selección activa y destino legal: ejecutar (o pedir coronación).
    if (selectedSquare && validMoves.some((move) => move.to === square)) {
      if (requiresPromotion(fen, selectedSquare, square)) {
        set({ pendingPromotion: { from: selectedSquare, to: square } })
        return
      }
      get().makeMove(selectedSquare, square)
      return
    }

    // Seleccionar pieza propia (getValidMoves devuelve [] si no es del turno).
    const moves = getValidMoves(fen, square)
    if (moves.length > 0) {
      set({ selectedSquare: square, validMoves: moves })
    } else {
      set({ selectedSquare: null, validMoves: [] })
    }
  },

  makeMove: (from, to, promotion) => {
    const { phase, fen, history } = get()
    if (phase !== 'playing') return

    const result = applyMove(fen, from, to, promotion)
    if (!result.success || !result.move) return

    const isOver = result.status.isGameOver
    set({
      fen: result.fen,
      status: result.status,
      selectedSquare: null,
      validMoves: [],
      pendingPromotion: null,
      lastMove: { from, to },
      history: [...history, result.move.san],
      phase: isOver ? 'ended' : 'playing',
      result: isOver
        ? {
            winner: result.status.winner,
            reason: RESULT_REASONS[result.status.type],
          }
        : null,
    })
  },

  cancelPromotion: () => {
    set({ pendingPromotion: null, selectedSquare: null, validMoves: [] })
  },

  resign: (color) => {
    if (get().phase !== 'playing') return
    set({
      phase: 'ended',
      selectedSquare: null,
      validMoves: [],
      pendingPromotion: null,
      result: { winner: color === 'w' ? 'b' : 'w', reason: 'rendición' },
    })
  },

  resetGame: () => {
    set({ ...freshGameState(), phase: 'idle' })
  },
}))
