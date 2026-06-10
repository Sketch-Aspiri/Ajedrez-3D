import { Chess, validateFen } from 'chess.js'
import type {
  BoardPiece,
  CapturedPieces,
  GameStatus,
  Move,
  MoveResult,
  PieceSymbol,
  Square,
} from '@/types/game'

/** Posición inicial estándar en notación FEN. */
export const INITIAL_FEN =
  'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'

/** Cantidad inicial de cada tipo de pieza por bando. */
const INITIAL_PIECE_COUNTS: Record<PieceSymbol, number> = {
  p: 8,
  n: 2,
  b: 2,
  r: 2,
  q: 1,
  k: 1,
}

/** Orden de display de piezas capturadas (mayor valor primero). */
const CAPTURE_DISPLAY_ORDER: PieceSymbol[] = ['q', 'r', 'b', 'n', 'p']

/** Valida que un string sea un FEN bien formado. */
export function isValidFen(fen: string): boolean {
  return validateFen(fen).ok
}

/**
 * Devuelve los movimientos legales (verbose) desde una casilla.
 * Lista vacía si no hay pieza propia en turno o el FEN es inválido.
 */
export function getValidMoves(fen: string, square: Square): Move[] {
  try {
    const chess = new Chess(fen)
    return chess.moves({ square, verbose: true })
  } catch {
    return []
  }
}

/** Devuelve todos los movimientos legales para el bando en turno. */
export function getAllValidMoves(fen: string): Move[] {
  try {
    const chess = new Chess(fen)
    return chess.moves({ verbose: true })
  } catch {
    return []
  }
}

/**
 * Indica si mover from→to corona un peón (la UI debe pedir la pieza
 * antes de confirmar el movimiento).
 */
export function requiresPromotion(
  fen: string,
  from: Square,
  to: Square,
): boolean {
  return getValidMoves(fen, from).some(
    (move) => move.to === to && move.isPromotion(),
  )
}

/**
 * Aplica un movimiento sobre una posición y devuelve el resultado.
 * Función pura: no muta nada; construye una instancia nueva de Chess.
 * Si el movimiento es ilegal, `success` es `false` y `fen` queda intacto.
 */
export function applyMove(
  fen: string,
  from: Square,
  to: Square,
  promotion?: PieceSymbol,
): MoveResult {
  const chess = new Chess(fen)
  try {
    const move = chess.move({ from, to, promotion })
    return {
      success: true,
      fen: chess.fen(),
      move,
      status: deriveStatus(chess),
    }
  } catch {
    return {
      success: false,
      fen,
      move: null,
      status: getGameStatus(fen),
    }
  }
}

/** Deriva el estado de reglas de una posición FEN. */
export function getGameStatus(fen: string): GameStatus {
  return deriveStatus(new Chess(fen))
}

/** Lógica compartida de derivación de estado a partir de una instancia Chess. */
function deriveStatus(chess: Chess): GameStatus {
  const turn = chess.turn()
  const inCheck = chess.inCheck()

  if (chess.isCheckmate()) {
    return {
      type: 'checkmate',
      isGameOver: true,
      turn,
      inCheck: true,
      // El bando en turno está en jaque mate, así que gana el contrario.
      winner: turn === 'w' ? 'b' : 'w',
    }
  }
  if (chess.isStalemate()) {
    return buildDraw('stalemate', turn, false)
  }
  if (chess.isInsufficientMaterial()) {
    return buildDraw('draw_insufficient_material', turn, inCheck)
  }
  if (chess.isThreefoldRepetition()) {
    return buildDraw('draw_repetition', turn, inCheck)
  }
  if (chess.isDrawByFiftyMoves()) {
    return buildDraw('draw_fifty_moves', turn, inCheck)
  }
  if (inCheck) {
    return { type: 'check', isGameOver: false, turn, inCheck: true, winner: null }
  }
  return { type: 'playing', isGameOver: false, turn, inCheck: false, winner: null }
}

/** Helper para construir estados de tablas. */
function buildDraw(
  type: GameStatus['type'],
  turn: GameStatus['turn'],
  inCheck: boolean,
): GameStatus {
  return { type, isGameOver: true, turn, inCheck, winner: 'draw' }
}

/**
 * Devuelve la lista plana de piezas activas en el tablero.
 * Es lo que consume PieceSet para renderizar la escena 3D.
 */
export function fenToPieces(fen: string): BoardPiece[] {
  const chess = new Chess(fen)
  const pieces: BoardPiece[] = []
  for (const row of chess.board()) {
    for (const cell of row) {
      if (cell) {
        pieces.push({ square: cell.square, type: cell.type, color: cell.color })
      }
    }
  }
  return pieces
}

/**
 * Calcula las piezas capturadas comparando el material en tablero contra
 * la dotación inicial. Aproximación basada en FEN: con coronaciones el conteo
 * puede subestimar (un peón promovido oculta una captura); para el HUD es
 * suficiente. El conteo nunca devuelve negativos.
 */
export function getCapturedPieces(fen: string): CapturedPieces {
  const onBoard = { w: emptyCounts(), b: emptyCounts() }
  for (const piece of fenToPieces(fen)) {
    onBoard[piece.color][piece.type] += 1
  }

  const captured: CapturedPieces = { white: [], black: [] }
  for (const type of CAPTURE_DISPLAY_ORDER) {
    pushMissing(captured.white, type, onBoard.w[type])
    pushMissing(captured.black, type, onBoard.b[type])
  }
  return captured
}

/** Mapa de conteo inicializado en cero por tipo. */
function emptyCounts(): Record<PieceSymbol, number> {
  return { p: 0, n: 0, b: 0, r: 0, q: 0, k: 0 }
}

/** Agrega al array las piezas faltantes de un tipo respecto a la dotación inicial. */
function pushMissing(
  target: PieceSymbol[],
  type: PieceSymbol,
  countOnBoard: number,
): void {
  const missing = Math.max(0, INITIAL_PIECE_COUNTS[type] - countOnBoard)
  for (let i = 0; i < missing; i += 1) {
    target.push(type)
  }
}
