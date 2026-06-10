import type { CSSProperties } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { getCapturedPieces } from '@/lib/chess/engine'
import type { PieceSymbol } from '@/types/game'
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

export function GameHUD() {
  const fen = useGameStore((s) => s.fen)
  const captured = getCapturedPieces(fen)

  return (
    <>
      <GameResult />

      <div
        className="absolute top-4 right-4 bottom-4 flex flex-col gap-3 pointer-events-none"
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
