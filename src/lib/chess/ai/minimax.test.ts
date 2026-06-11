import { describe, it, expect } from 'vitest'
import { Chess } from 'chess.js'
import { findBestMove } from './minimax'

describe('findBestMove', () => {
  it('devuelve null cuando no hay jugadas legales (jaque mate)', () => {
    // Mate del loco: 1.f3 e5 2.g4 Qh4# — blancas mateadas, sin jugadas.
    const chess = new Chess()
    chess.move('f3')
    chess.move('e5')
    chess.move('g4')
    chess.move('Qh4')
    expect(chess.isCheckmate()).toBe(true)
    expect(findBestMove(chess.fen(), 2)).toBeNull()
  })

  it('encuentra el mate en uno', () => {
    // Torre a la octava: Ra1-a8 es mate (rey negro ahogado por sus peones).
    const move = findBestMove('6k1/5ppp/8/8/8/8/8/R6K w - - 0 1', 2)
    expect(move).toEqual({ from: 'a1', to: 'a8' })
  })

  it('captura una dama colgada', () => {
    const move = findBestMove('7k/8/8/8/8/8/q7/R6K w - - 0 1', 2)
    expect(move?.to).toBe('a2')
  })

  it('corona un peón a dama', () => {
    const move = findBestMove('8/P6k/8/8/8/8/8/7K w - - 0 1', 2)
    expect(move).toMatchObject({ from: 'a7', to: 'a8', promotion: 'q' })
  })
})
