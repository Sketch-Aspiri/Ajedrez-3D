import { describe, it, expect } from 'vitest'
import {
  INITIAL_FEN,
  applyMove,
  fenToPieces,
  getAllValidMoves,
  getCapturedPieces,
  getGameStatus,
  getValidMoves,
  isValidFen,
  requiresPromotion,
} from './engine'
import type { MoveResult, Square } from '@/types/game'

/** Encadena una secuencia de movimientos desde una posición inicial. */
function playMoves(
  startFen: string,
  moves: ReadonlyArray<[Square, Square]>,
): MoveResult {
  let result: MoveResult = applyMove(startFen, moves[0][0], moves[0][1])
  for (const [from, to] of moves.slice(1)) {
    expect(result.success).toBe(true)
    result = applyMove(result.fen, from, to)
  }
  return result
}

describe('isValidFen', () => {
  it('acepta la posición inicial', () => {
    expect(isValidFen(INITIAL_FEN)).toBe(true)
  })

  it('rechaza un FEN malformado', () => {
    expect(isValidFen('not-a-fen')).toBe(false)
  })
})

describe('getValidMoves', () => {
  it('devuelve los 2 avances del peón e2 en la apertura', () => {
    const moves = getValidMoves(INITIAL_FEN, 'e2')
    expect(moves.map((m) => m.to).sort()).toEqual(['e3', 'e4'])
  })

  it('devuelve lista vacía para una casilla vacía', () => {
    expect(getValidMoves(INITIAL_FEN, 'e4')).toHaveLength(0)
  })

  it('devuelve lista vacía para un FEN inválido', () => {
    expect(getValidMoves('garbage', 'e2')).toHaveLength(0)
  })
})

describe('getAllValidMoves', () => {
  it('hay 20 movimientos legales en la posición inicial', () => {
    expect(getAllValidMoves(INITIAL_FEN)).toHaveLength(20)
  })
})

describe('applyMove', () => {
  it('aplica un movimiento legal y avanza el FEN', () => {
    const result = applyMove(INITIAL_FEN, 'e2', 'e4')
    expect(result.success).toBe(true)
    expect(result.fen).not.toBe(INITIAL_FEN)
    expect(result.move?.san).toBe('e4')
    expect(result.status.turn).toBe('b')
  })

  it('rechaza un movimiento ilegal y deja el FEN intacto', () => {
    const result = applyMove(INITIAL_FEN, 'e2', 'e5')
    expect(result.success).toBe(false)
    expect(result.fen).toBe(INITIAL_FEN)
    expect(result.move).toBeNull()
  })

  it('ejecuta el enroque corto', () => {
    const setup = playMoves(INITIAL_FEN, [
      ['e2', 'e4'],
      ['e7', 'e5'],
      ['g1', 'f3'],
      ['b8', 'c6'],
      ['f1', 'c4'],
      ['f8', 'c5'],
    ])
    const castle = applyMove(setup.fen, 'e1', 'g1')
    expect(castle.success).toBe(true)
    expect(castle.move?.isKingsideCastle()).toBe(true)
  })

  it('ejecuta una captura al paso (en passant)', () => {
    const setup = playMoves(INITIAL_FEN, [
      ['e2', 'e4'],
      ['a7', 'a6'],
      ['e4', 'e5'],
      ['f7', 'f5'],
    ])
    const enPassant = applyMove(setup.fen, 'e5', 'f6')
    expect(enPassant.success).toBe(true)
    expect(enPassant.move?.isEnPassant()).toBe(true)
  })

  it('corona un peón a dama', () => {
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    const promo = applyMove(fen, 'a7', 'a8', 'q')
    expect(promo.success).toBe(true)
    expect(promo.move?.promotion).toBe('q')
  })
})

describe('requiresPromotion', () => {
  it('detecta una coronación pendiente', () => {
    const fen = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'
    expect(requiresPromotion(fen, 'a7', 'a8')).toBe(true)
  })

  it('un avance normal no requiere coronación', () => {
    expect(requiresPromotion(INITIAL_FEN, 'e2', 'e4')).toBe(false)
  })
})

describe('getGameStatus', () => {
  it('la posición inicial está en juego con turno blanco', () => {
    const status = getGameStatus(INITIAL_FEN)
    expect(status.type).toBe('playing')
    expect(status.isGameOver).toBe(false)
    expect(status.turn).toBe('w')
  })

  it('detecta jaque mate y asigna el ganador (mate del loco)', () => {
    const mate = playMoves(INITIAL_FEN, [
      ['f2', 'f3'],
      ['e7', 'e5'],
      ['g2', 'g4'],
      ['d8', 'h4'],
    ])
    expect(mate.status.type).toBe('checkmate')
    expect(mate.status.isGameOver).toBe(true)
    expect(mate.status.winner).toBe('b')
  })

  it('detecta tablas por ahogado (stalemate)', () => {
    const status = getGameStatus('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')
    expect(status.type).toBe('stalemate')
    expect(status.winner).toBe('draw')
  })

  it('detecta tablas por material insuficiente (rey vs rey)', () => {
    const status = getGameStatus('4k3/8/8/8/8/8/8/4K3 w - - 0 1')
    expect(status.type).toBe('draw_insufficient_material')
    expect(status.winner).toBe('draw')
  })

  it('marca jaque sin terminar la partida (el rey puede escapar)', () => {
    const status = getGameStatus('4k3/4q3/8/8/8/8/8/4K3 w - - 0 1')
    expect(status.type).toBe('check')
    expect(status.isGameOver).toBe(false)
    expect(status.inCheck).toBe(true)
  })
})

describe('fenToPieces', () => {
  it('hay 32 piezas en la posición inicial', () => {
    expect(fenToPieces(INITIAL_FEN)).toHaveLength(32)
  })

  it('cada pieza tiene casilla, tipo y color', () => {
    const piece = fenToPieces(INITIAL_FEN)[0]
    expect(piece).toHaveProperty('square')
    expect(piece).toHaveProperty('type')
    expect(piece).toHaveProperty('color')
  })
})

describe('getCapturedPieces', () => {
  it('no hay capturas en la posición inicial', () => {
    const captured = getCapturedPieces(INITIAL_FEN)
    expect(captured.white).toHaveLength(0)
    expect(captured.black).toHaveLength(0)
  })

  it('registra un peón negro capturado', () => {
    // Falta el peón negro de h7 respecto a la dotación inicial.
    const captured = getCapturedPieces(
      'rnbqkbnr/ppppppp1/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    )
    expect(captured.black).toEqual(['p'])
    expect(captured.white).toHaveLength(0)
  })
})
