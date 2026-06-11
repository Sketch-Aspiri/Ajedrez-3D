import { useGameStore } from '@/stores/gameStore'
import type { PieceSymbol } from '@/types/game'

interface PromotionChoice {
  type: PieceSymbol
  symbol: string
  label: string
}

const PROMOTION_CHOICES: readonly PromotionChoice[] = [
  { type: 'q', symbol: '♛', label: 'Dama' },
  { type: 'r', symbol: '♜', label: 'Torre' },
  { type: 'b', symbol: '♝', label: 'Alfil' },
  { type: 'n', symbol: '♞', label: 'Caballo' },
]

/**
 * Modal de coronación. Se muestra cuando el store tiene una promoción
 * pendiente; clickear el fondo cancela, elegir pieza completa el movimiento.
 */
export function PromotionDialog() {
  const pendingPromotion = useGameStore((state) => state.pendingPromotion)
  const makeMove = useGameStore((state) => state.makeMove)
  const cancelPromotion = useGameStore((state) => state.cancelPromotion)

  if (!pendingPromotion) return null

  return (
    <div
      className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={cancelPromotion}
    >
      <div
        className="mx-4 rounded-xl border border-[#1E1E2E] bg-[#141420]/90 p-4 backdrop-blur-md sm:p-6"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          className="mb-4 text-center text-base font-semibold text-[#E8E8F0] sm:text-lg"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          Elige tu pieza
        </h2>
        <div className="flex justify-center gap-2 sm:gap-3">
          {PROMOTION_CHOICES.map(({ type, symbol, label }) => (
            <button
              key={type}
              type="button"
              aria-label={label}
              onClick={() =>
                makeMove(pendingPromotion.from, pendingPromotion.to, type)
              }
              className="flex h-14 w-14 items-center justify-center rounded-lg border border-[#D4A853]/40 text-3xl text-[#D4A853] transition-colors duration-200 hover:bg-[#D4A853]/15 sm:h-16 sm:w-16 sm:text-4xl"
            >
              {symbol}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
