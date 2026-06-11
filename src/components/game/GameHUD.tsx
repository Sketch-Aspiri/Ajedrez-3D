import type { CSSProperties } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getCapturedPieces } from '@/lib/chess/engine'
import type { Color, PieceSymbol } from '@/types/game'
import { CapturedPieces } from './CapturedPieces'
import { TurnIndicator } from './TurnIndicator'
import { MoveHistory } from './MoveHistory'
import { GameControls } from './GameControls'
import { GameResult } from './GameResult'

const PANEL: CSSProperties = {
  background: 'rgba(20,20,32,0.85)',
  backdropFilter: 'blur(8px)',
  border: '1px solid var(--surface-elevated)',
}

interface PlayerCardProps {
  label: string
  isWhite: boolean
  capturedPieces: PieceSymbol[]
}

function PlayerCard({ label, isWhite, capturedPieces }: PlayerCardProps) {
  return (
    <div className="pointer-events-auto rounded-xl p-3 flex flex-col gap-1.5" style={PANEL}>
      <div className="flex items-center gap-2">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{
            background: isWhite ? 'var(--piece-white)' : 'var(--piece-black)',
            border: '1px solid var(--muted)',
          }}
        />
        <span className="text-xs font-medium" style={{ color: 'var(--text)' }}>
          {label}
        </span>
      </div>
      <CapturedPieces pieces={capturedPieces} color={isWhite ? 'b' : 'w'} />
    </div>
  )
}

/** Chip compacto de jugador para móvil: resalta cuando es su turno. */
function MobilePlayerChip({
  label,
  isWhite,
  capturedPieces,
  active,
}: PlayerCardProps & { active: boolean }) {
  return (
    <div
      className="pointer-events-auto rounded-lg px-2 py-1.5 flex flex-col gap-1 max-w-[44%]"
      style={{
        ...PANEL,
        borderColor: active ? 'var(--primary)' : 'var(--surface-elevated)',
      }}
    >
      <div className="flex items-center gap-1.5">
        <div
          className="w-2.5 h-2.5 rounded-full flex-shrink-0"
          style={{
            background: isWhite ? 'var(--piece-white)' : 'var(--piece-black)',
            border: '1px solid var(--muted)',
            boxShadow: active ? '0 0 6px var(--primary)' : 'none',
          }}
        />
        <span className="text-[11px] font-medium" style={{ color: 'var(--text)' }}>
          {label}
        </span>
      </div>
      <CapturedPieces pieces={capturedPieces} color={isWhite ? 'b' : 'w'} />
    </div>
  )
}

export function GameHUD() {
  const fen = useGameStore((s) => s.fen)
  const turn = useGameStore((s) => s.status.turn)
  const phase = useGameStore((s) => s.phase)
  const captured = getCapturedPieces(fen)

  const activeColor: Color | null = phase === 'playing' ? turn : null

  return (
    <>
      <GameResult />

      {/* ===== Móvil: chips arriba + controles abajo ===== */}
      <div
        className="md:hidden absolute top-0 left-0 right-0 flex items-start justify-between gap-2 px-2 pointer-events-none"
        style={{ paddingTop: 'max(8px, env(safe-area-inset-top))', zIndex: 5 }}
      >
        <MobilePlayerChip
          label="Negras"
          isWhite={false}
          capturedPieces={captured.white}
          active={activeColor === 'b'}
        />
        <MobilePlayerChip
          label="Blancas"
          isWhite
          capturedPieces={captured.black}
          active={activeColor === 'w'}
        />
      </div>

      <div
        className="md:hidden absolute bottom-0 left-0 right-0 px-2 pointer-events-none"
        style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))', zIndex: 5 }}
      >
        <div className="pointer-events-auto rounded-xl p-2" style={PANEL}>
          <GameControls />
        </div>
      </div>

      {/* ===== Escritorio: panel lateral derecho ===== */}
      <div
        className="hidden md:flex absolute top-4 right-4 bottom-4 flex-col gap-3 pointer-events-none"
        style={{ width: 200, zIndex: 5 }}
      >
        {/* Negras arriba — capturedPieces son las blancas que las negras capturaron */}
        <PlayerCard label="Negras" isWhite={false} capturedPieces={captured.white} />

        <TurnIndicator />

        {/* Historial */}
        <div
          className="pointer-events-auto rounded-xl p-3 flex flex-col gap-2 flex-1 min-h-0"
          style={PANEL}
        >
          <h3
            className="text-xs font-semibold uppercase tracking-wider flex-shrink-0"
            style={{ color: 'var(--muted)', fontFamily: 'Cinzel, serif' }}
          >
            Movimientos
          </h3>
          <MoveHistory />
        </div>

        {/* Blancas abajo — capturedPieces son las negras que las blancas capturaron */}
        <PlayerCard label="Blancas" isWhite capturedPieces={captured.black} />

        {/* Controles */}
        <div className="pointer-events-auto rounded-xl p-3" style={PANEL}>
          <GameControls />
        </div>
      </div>
    </>
  )
}
