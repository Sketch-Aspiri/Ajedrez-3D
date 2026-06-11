import { useState } from 'react'
import type { ReactNode } from 'react'
import { useGameStore } from '@/stores/gameStore'
import type { AIDifficulty, GameMode } from '@/types/game'

const DIFFICULTY_LABELS: Record<AIDifficulty, string> = {
  easy: 'Fácil',
  medium: 'Media',
  hard: 'Difícil',
}

const DIFFICULTIES: AIDifficulty[] = ['easy', 'medium', 'hard']

export function GameControls() {
  const phase = useGameStore((s) => s.phase)
  const playerColor = useGameStore((s) => s.playerColor)
  const resign = useGameStore((s) => s.resign)
  const startGame = useGameStore((s) => s.startGame)

  // Configuración de la próxima partida (se aplica con "Nueva partida").
  const [mode, setMode] = useState<GameMode>('local')
  const [difficulty, setDifficulty] = useState<AIDifficulty>('medium')

  const handleResign = () => resign(playerColor)
  const handleNewGame = () =>
    startGame(mode, { aiDifficulty: difficulty, playerColor: 'w' })

  return (
    <div className="flex flex-col gap-2">
      {/* Selección de modo */}
      <div className="flex gap-1">
        <ModeButton active={mode === 'local'} onClick={() => setMode('local')}>
          Local
        </ModeButton>
        <ModeButton active={mode === 'ai'} onClick={() => setMode('ai')}>
          vs IA
        </ModeButton>
      </div>

      {/* Dificultad (solo en modo IA) */}
      {mode === 'ai' && (
        <div className="flex gap-1">
          {DIFFICULTIES.map((level) => (
            <ModeButton
              key={level}
              active={difficulty === level}
              onClick={() => setDifficulty(level)}
            >
              {DIFFICULTY_LABELS[level]}
            </ModeButton>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {phase === 'playing' && (
          <button onClick={handleResign} className="btn-hud btn-danger-hud flex-1">
            Rendirse
          </button>
        )}
        <button onClick={handleNewGame} className="btn-hud btn-primary-hud flex-1">
          Nueva partida
        </button>
      </div>
    </div>
  )
}

interface ModeButtonProps {
  active: boolean
  onClick: () => void
  children: ReactNode
}

function ModeButton({ active, onClick, children }: ModeButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex-1 text-xs px-2 py-1 rounded-lg transition-colors"
      style={{
        background: active ? 'var(--primary)' : 'transparent',
        color: active ? 'var(--background)' : 'var(--muted)',
        border: '1px solid var(--surface-elevated)',
        fontWeight: active ? 600 : 400,
      }}
    >
      {children}
    </button>
  )
}
