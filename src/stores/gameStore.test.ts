import { beforeEach, describe, expect, it } from 'vitest'
import { useGameStore } from './gameStore'
import { INITIAL_FEN, getGameStatus } from '@/lib/chess/engine'
import type { Square } from '@/types/game'

/** Posición de coronación: peón blanco en a7 listo para coronar. */
const PROMOTION_FEN = '4k3/P7/8/8/8/8/8/4K3 w - - 0 1'

/** Ejecuta una secuencia de movimientos directos sobre el store. */
function play(moves: ReadonlyArray<[Square, Square]>) {
  for (const [from, to] of moves) {
    useGameStore.getState().makeMove(from, to)
  }
}

beforeEach(() => {
  useGameStore.getState().startGame('local')
})

describe('startGame', () => {
  it('inicializa una partida local lista para jugar', () => {
    const state = useGameStore.getState()
    expect(state.fen).toBe(INITIAL_FEN)
    expect(state.phase).toBe('playing')
    expect(state.history).toEqual([])
    expect(state.result).toBeNull()
  })
})

describe('selectSquare', () => {
  it('selecciona una pieza propia y calcula sus movimientos', () => {
    useGameStore.getState().selectSquare('e2')
    const state = useGameStore.getState()
    expect(state.selectedSquare).toBe('e2')
    expect(state.validMoves.map((m) => m.to).sort()).toEqual(['e3', 'e4'])
  })

  it('ignora piezas del rival (turno blanco, click en e7)', () => {
    useGameStore.getState().selectSquare('e7')
    expect(useGameStore.getState().selectedSquare).toBeNull()
  })

  it('limpia la selección al clickear una casilla vacía', () => {
    useGameStore.getState().selectSquare('e2')
    useGameStore.getState().selectSquare('e5')
    expect(useGameStore.getState().selectedSquare).toBeNull()
    expect(useGameStore.getState().validMoves).toEqual([])
  })

  it('ejecuta un movimiento al clickear un destino válido', () => {
    useGameStore.getState().selectSquare('e2')
    useGameStore.getState().selectSquare('e4')
    const state = useGameStore.getState()
    expect(state.fen).not.toBe(INITIAL_FEN)
    expect(state.status.turn).toBe('b')
    expect(state.history).toEqual(['e4'])
    expect(state.selectedSquare).toBeNull()
  })

  it('captura al clickear una pieza enemiga que es destino válido', () => {
    play([
      ['e2', 'e4'],
      ['d7', 'd5'],
    ])
    useGameStore.getState().selectSquare('e4')
    useGameStore.getState().selectSquare('d5')
    expect(useGameStore.getState().history.at(-1)).toBe('exd5')
  })
})

describe('makeMove', () => {
  it('rechaza movimientos ilegales sin alterar el estado', () => {
    useGameStore.getState().makeMove('e2', 'e5')
    expect(useGameStore.getState().fen).toBe(INITIAL_FEN)
    expect(useGameStore.getState().history).toEqual([])
  })

  it('registra lastMove tras un movimiento legal', () => {
    useGameStore.getState().makeMove('g1', 'f3')
    expect(useGameStore.getState().lastMove).toEqual({ from: 'g1', to: 'f3' })
  })

  it('detecta jaque mate y termina la partida (mate del loco)', () => {
    play([
      ['f2', 'f3'],
      ['e7', 'e5'],
      ['g2', 'g4'],
      ['d8', 'h4'],
    ])
    const state = useGameStore.getState()
    expect(state.phase).toBe('ended')
    expect(state.result).toEqual({ winner: 'b', reason: 'jaque mate' })
  })

  it('ignora movimientos después de terminar la partida', () => {
    play([
      ['f2', 'f3'],
      ['e7', 'e5'],
      ['g2', 'g4'],
      ['d8', 'h4'],
    ])
    const endedFen = useGameStore.getState().fen
    useGameStore.getState().makeMove('a2', 'a3')
    expect(useGameStore.getState().fen).toBe(endedFen)
  })
})

describe('coronación', () => {
  beforeEach(() => {
    useGameStore.setState({
      fen: PROMOTION_FEN,
      status: getGameStatus(PROMOTION_FEN),
    })
  })

  it('clickear el destino de coronación deja la promoción pendiente', () => {
    useGameStore.getState().selectSquare('a7')
    useGameStore.getState().selectSquare('a8')
    const state = useGameStore.getState()
    expect(state.pendingPromotion).toEqual({ from: 'a7', to: 'a8' })
    expect(state.fen).toBe(PROMOTION_FEN)
  })

  it('completa la coronación al elegir pieza', () => {
    useGameStore.getState().selectSquare('a7')
    useGameStore.getState().selectSquare('a8')
    useGameStore.getState().makeMove('a7', 'a8', 'q')
    const state = useGameStore.getState()
    expect(state.pendingPromotion).toBeNull()
    expect(state.history.at(-1)).toContain('=Q')
  })

  it('cancelPromotion limpia promoción y selección', () => {
    useGameStore.getState().selectSquare('a7')
    useGameStore.getState().selectSquare('a8')
    useGameStore.getState().cancelPromotion()
    const state = useGameStore.getState()
    expect(state.pendingPromotion).toBeNull()
    expect(state.selectedSquare).toBeNull()
    expect(state.fen).toBe(PROMOTION_FEN)
  })
})

describe('resign', () => {
  it('el rival gana cuando un jugador se rinde', () => {
    useGameStore.getState().resign('w')
    const state = useGameStore.getState()
    expect(state.phase).toBe('ended')
    expect(state.result).toEqual({ winner: 'b', reason: 'rendición' })
  })
})

describe('resetGame', () => {
  it('vuelve al estado idle con tablero inicial', () => {
    play([['e2', 'e4']])
    useGameStore.getState().resetGame()
    const state = useGameStore.getState()
    expect(state.phase).toBe('idle')
    expect(state.fen).toBe(INITIAL_FEN)
    expect(state.history).toEqual([])
  })
})
