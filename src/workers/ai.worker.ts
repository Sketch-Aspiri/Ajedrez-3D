import { findBestMove } from '@/lib/chess/ai/minimax'
import type { AIRequest, AIResponse } from '@/lib/chess/ai/types'

/**
 * Web Worker de la IA. Mantiene el cálculo de minimax fuera del main thread
 * para no bloquear el render de React Three Fiber.
 *
 * Recibe `{ fen, depth }` y responde `{ bestMove }`.
 */

// En un módulo worker el global real es DedicatedWorkerGlobalScope; con la lib
// DOM lo tratamos como `Worker` para tener las firmas correctas de mensajería.
const ctx = self as unknown as Worker

ctx.onmessage = (event: MessageEvent<AIRequest>) => {
  const { fen, depth } = event.data
  const response: AIResponse = { bestMove: findBestMove(fen, depth) }
  ctx.postMessage(response)
}
