import { Chess } from 'chess.js'
import type { AIDifficulty, Move } from '@/types/game'
import { PIECE_VALUES, evaluateBoard } from './evaluate'
import type { BestMove } from './types'

/**
 * Profundidad de búsqueda por dificultad (plies).
 * Easy ~<100ms, Medium ~<500ms, Hard ~<2s en posiciones típicas.
 */
export const DIFFICULTY_DEPTH: Record<AIDifficulty, number> = {
  easy: 2,
  medium: 3,
  hard: 5,
}

/**
 * Puntaje base de un jaque mate. Se le suma la profundidad restante para
 * preferir los mates más cortos (mayor `depth` = mate más cercano = mejor).
 */
const MATE_SCORE = 1_000_000

/**
 * Devuelve la mejor jugada para el bando en turno mediante negamax con poda
 * alpha-beta. Función pura: opera sobre una instancia privada de `Chess`
 * (move/undo internos), sin tocar el estado de la app.
 *
 * @param fen   Posición a analizar.
 * @param depth Profundidad de búsqueda en plies (>= 1).
 * @returns La jugada elegida, o `null` si no hay movimientos legales.
 */
export function findBestMove(fen: string, depth: number): BestMove | null {
  const chess = new Chess(fen)
  const moves = orderMoves(chess.moves({ verbose: true }))
  if (moves.length === 0) return null

  let bestMove = moves[0]
  let bestScore = -Infinity
  let alpha = -Infinity
  const beta = Infinity

  for (const move of moves) {
    chess.move(move)
    const score = -negamax(chess, depth - 1, -beta, -alpha)
    chess.undo()

    if (score > bestScore) {
      bestScore = score
      bestMove = move
    }
    if (score > alpha) alpha = score
  }

  return {
    from: bestMove.from,
    to: bestMove.to,
    ...(bestMove.promotion ? { promotion: bestMove.promotion } : {}),
  }
}

/**
 * Negamax con poda alpha-beta. Devuelve el puntaje de la posición desde la
 * perspectiva del bando en turno (positivo = bueno para quien mueve).
 */
function negamax(
  chess: Chess,
  depth: number,
  alpha: number,
  beta: number,
): number {
  if (chess.isGameOver()) {
    // El bando en turno está mateado → pésimo para él. Mates más cercanos
    // (mayor `depth` restante) se penalizan menos para elegir el más corto.
    if (chess.isCheckmate()) return -(MATE_SCORE + depth)
    return 0 // tablas
  }

  if (depth === 0) {
    return sideToMoveScore(chess)
  }

  let best = -Infinity
  for (const move of orderMoves(chess.moves({ verbose: true }))) {
    chess.move(move)
    const score = -negamax(chess, depth - 1, -beta, -alpha)
    chess.undo()

    if (score > best) best = score
    if (best > alpha) alpha = best
    if (alpha >= beta) break // poda beta
  }

  return best
}

/** Evaluación estática orientada al bando en turno (negamax la requiere así). */
function sideToMoveScore(chess: Chess): number {
  const score = evaluateBoard(chess)
  return chess.turn() === 'w' ? score : -score
}

/**
 * Ordena las jugadas para mejorar la poda alpha-beta: primero capturas
 * (heurística MVV — víctima de mayor valor) y coronaciones.
 */
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => moveScore(b) - moveScore(a))
}

/** Heurística de ordenación: valor de la captura + valor de la coronación. */
function moveScore(move: Move): number {
  let score = 0
  if (move.captured) score += PIECE_VALUES[move.captured]
  if (move.promotion) score += PIECE_VALUES[move.promotion]
  return score
}
