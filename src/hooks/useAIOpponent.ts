import { useEffect, useRef } from 'react'
import AIWorker from '@/workers/ai.worker.ts?worker'
import { DIFFICULTY_DEPTH } from '@/lib/chess/ai/minimax'
import { useGameStore } from '@/stores/gameStore'
import type { AIRequest, AIResponse } from '@/lib/chess/ai/types'

/**
 * Conecta el motor de IA (Web Worker minimax) al `gameStore`.
 *
 * Cuando es el turno de la IA en modo `ai`, envía el FEN al worker y aplica la
 * jugada devuelta con `makeMove`. El cálculo nunca corre en el main thread.
 *
 * Debe montarse una sola vez (en App). Es no-op fuera del modo `ai`.
 */
export function useAIOpponent(): void {
  const workerRef = useRef<Worker | null>(null)
  /** FEN que el worker está analizando ahora mismo (evita reenvíos). */
  const thinkingFenRef = useRef<string | null>(null)

  const fen = useGameStore((s) => s.fen)
  const mode = useGameStore((s) => s.mode)
  const phase = useGameStore((s) => s.phase)
  const playerColor = useGameStore((s) => s.playerColor)
  const aiDifficulty = useGameStore((s) => s.aiDifficulty)
  const turn = useGameStore((s) => s.status.turn)

  // Crea el worker una sola vez y aplica las respuestas.
  useEffect(() => {
    const worker = new AIWorker()
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<AIResponse>) => {
      thinkingFenRef.current = null
      const { bestMove } = event.data
      if (!bestMove) return

      // La posición pudo cambiar (nueva partida, rendición) mientras pensaba.
      const store = useGameStore.getState()
      if (store.mode !== 'ai' || store.phase !== 'playing') return
      store.makeMove(bestMove.from, bestMove.to, bestMove.promotion)
    }

    return () => {
      worker.terminate()
      workerRef.current = null
      thinkingFenRef.current = null
    }
  }, [])

  // Dispara la búsqueda cuando le toca mover a la IA.
  useEffect(() => {
    if (mode !== 'ai' || phase !== 'playing') return
    if (turn === playerColor) return // turno del humano
    if (thinkingFenRef.current === fen) return // ya pensando esta posición

    const worker = workerRef.current
    if (!worker) return

    thinkingFenRef.current = fen
    const request: AIRequest = { fen, depth: DIFFICULTY_DEPTH[aiDifficulty] }
    worker.postMessage(request)
  }, [fen, mode, phase, playerColor, aiDifficulty, turn])
}
