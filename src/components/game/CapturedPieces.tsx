import type { Color, PieceSymbol } from '@/types/game'

const PIECE_SYMBOLS: Record<Color, Record<PieceSymbol, string>> = {
  w: { q: '♕', r: '♖', b: '♗', n: '♘', p: '♙', k: '♔' },
  b: { q: '♛', r: '♜', b: '♝', n: '♞', p: '♟', k: '♚' },
}

interface Props {
  pieces: PieceSymbol[]
  color: Color
}

export function CapturedPieces({ pieces, color }: Props) {
  if (pieces.length === 0) {
    return <span className="text-xs italic" style={{ color: 'var(--muted)' }}>—</span>
  }

  return (
    <div className="flex flex-wrap gap-0.5">
      {pieces.map((piece, i) => (
        <span
          key={i}
          className="text-sm leading-none select-none"
          style={{
            color: color === 'w' ? 'var(--piece-white)' : 'var(--piece-black)',
            textShadow: color === 'w' ? '0 0 3px rgba(0,0,0,0.8)' : 'none',
            filter: color === 'w' ? 'drop-shadow(0 0 1px rgba(0,0,0,0.6))' : 'none',
          }}
        >
          {PIECE_SYMBOLS[color][piece]}
        </span>
      ))}
    </div>
  )
}
