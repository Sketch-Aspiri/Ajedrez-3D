import { describe, it, expect } from 'vitest'
import { ALL_SQUARES, isLightSquare, squareToPosition } from './coords'

describe('squareToPosition', () => {
  it('a1 está en la esquina del lado blanco', () => {
    expect(squareToPosition('a1')).toEqual([-3.5, 0, 3.5])
  })

  it('h8 está en la esquina opuesta', () => {
    expect(squareToPosition('h8')).toEqual([3.5, 0, -3.5])
  })

  it('e4 queda cerca del centro', () => {
    expect(squareToPosition('e4')).toEqual([0.5, 0, 0.5])
  })
})

describe('isLightSquare', () => {
  it('a1 es oscura y h1 es clara (convención del ajedrez)', () => {
    expect(isLightSquare('a1')).toBe(false)
    expect(isLightSquare('h1')).toBe(true)
  })

  it('casillas adyacentes alternan color', () => {
    expect(isLightSquare('e4')).not.toBe(isLightSquare('e5'))
  })
})

describe('ALL_SQUARES', () => {
  it('contiene las 64 casillas sin duplicados', () => {
    expect(ALL_SQUARES).toHaveLength(64)
    expect(new Set(ALL_SQUARES).size).toBe(64)
  })
})
