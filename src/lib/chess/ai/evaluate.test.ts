import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { evaluateBoard } from './evaluate'
import { INITIAL_FEN } from '../engine'

describe('evaluateBoard', () => {
  it('la posición inicial es simétrica (puntaje 0)', () => {
    expect(evaluateBoard(new Chess(INITIAL_FEN))).toBe(0)
  })

  it('es positivo cuando las blancas tienen ventaja material', () => {
    // Negras sin su dama.
    const fen = 'rnb1kbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1'
    expect(evaluateBoard(new Chess(fen))).toBeGreaterThan(0)
  })

  it('es negativo cuando las negras tienen ventaja material', () => {
    // Blancas sin su dama.
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNB1KBNR w KQkq - 0 1'
    expect(evaluateBoard(new Chess(fen))).toBeLessThan(0)
  })
})
