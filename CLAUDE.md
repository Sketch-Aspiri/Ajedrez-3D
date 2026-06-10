# chess-3d

Juego de ajedrez 3D en el browser: React + React Three Fiber + chess.js + Supabase. Tres modos: local (mismo dispositivo), vs IA (minimax en Web Worker), online (Supabase Realtime con salas por código).

## Commands

- `npm run dev` — Dev server en localhost:5173
- `npm run build` — Build de producción (TypeScript strict, sin errores = ready)
- `npm run test` — Unit tests con Vitest
- `npm run lint` — ESLint

## Tech Stack

React 19 + Vite 8 + TypeScript strict + React Three Fiber 9 + @react-three/drei + chess.js 1.x + Zustand 5 + Tailwind CSS 4 + Supabase (Auth + Postgres + Realtime) + @react-spring/three + React Router v7 + Vercel

## Architecture

### Directory Structure

```
src/
  components/
    game/         # Componentes R3F: escena, tablero, piezas, highlights, HUD overlay
    ui/           # UI HTML: menus, lobby, auth modal, perfil, navbar
  lib/
    chess/        # Wrapper chess.js + motor IA minimax + cálculo ELO
      ai/         # minimax.ts, evaluate.ts, worker.ts
    supabase/     # Auth helpers, DB queries, Realtime channels
  stores/         # Zustand: gameStore, authStore, uiStore
  workers/        # Web Worker entry point para IA
  pages/          # Home, Game, Profile, Lobby
  types/          # game.ts, user.ts, supabase.ts
  assets/
    models/       # GLB piezas (pawn/rook/knight/bishop/queen/king.glb)
    textures/     # Texturas tablero (opcional)
supabase/
  migrations/     # SQL schema con RLS
```

### Data Flow

1. Click pieza → `gameStore.selectSquare()` → `chess.moves()` → guarda `validMoves` en store
2. Click destino → `gameStore.makeMove()` → `chess.move()` → nuevo FEN → PieceSet re-renderiza
3. Modo IA: `makeMove()` dispara Web Worker con FEN → worker devuelve bestMove → `makeMove()` de nuevo
4. Modo online: `makeMove()` → Supabase Realtime broadcast → oponente recibe y aplica `makeMove()`
5. Fin de partida: `chess.isGameOver()` → `status = 'ended'` → `GameResult` modal

### Key Patterns

- chess.js es la ÚNICA fuente de verdad de reglas. Nunca validar movimientos manualmente.
- El store `gameStore` es el ÚNICO estado global del juego. R3F lee del store, no tiene estado propio.
- La IA SIEMPRE corre en un Web Worker. Nunca en el main thread.
- Supabase Realtime usa broadcast (efímero). Los moves se persisten en DB por separado.
- FEN es el formato de intercambio. Todas las funciones del engine trabajan con FEN strings.

## Entities & Database Schema

### profiles
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK, FK → auth.users.id |
| username | text | unique, 3-20 chars |
| avatar_url | text | nullable |
| elo_rating | int | default 1200 |
| games_played | int | default 0 |
| wins / losses / draws | int | default 0 |
| created_at | timestamptz | auto now() |

### games
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| white_player_id / black_player_id | uuid | FK → profiles.id, nullable (IA) |
| mode | text | 'local' \| 'ai' \| 'online' |
| ai_difficulty | int | 1=Easy, 3=Medium, 5=Hard |
| status | text | 'in_progress' \| 'completed' \| 'abandoned' |
| result | text | 'white' \| 'black' \| 'draw' \| null |
| pgn | text | Notación PGN completa |
| room_code | text | nullable, 6 chars uppercase |
| created_at / ended_at | timestamptz | |

### moves
| Campo | Tipo | Notas |
|-------|------|-------|
| id | uuid | PK |
| game_id | uuid | FK → games.id CASCADE |
| move_number | int | 1-indexed |
| san | text | e.g. "Nf3", "O-O" |
| from_square / to_square | text | e.g. "e2", "e4" |
| fen_after | text | FEN completo post-movimiento |
| created_at | timestamptz | |

## Game Store (Zustand)

```typescript
interface GameStore {
  fen: string                     // FEN — fuente de verdad serializable del estado
  mode: 'local' | 'ai' | 'online'
  aiDifficulty: 'easy' | 'medium' | 'hard'
  playerColor: Color
  phase: 'idle' | 'playing' | 'ended'
  status: GameStatus              // derivado del engine (jaque, mate, tablas...)
  selectedSquare: Square | null
  validMoves: Move[]
  pendingPromotion: { from: Square; to: Square } | null
  lastMove: { from: Square; to: Square } | null
  history: string[]               // SAN
  result: { winner: Winner; reason: string } | null

  // Actions
  startGame: (mode: GameMode, options?: GameOptions) => void
  selectSquare: (square: Square) => void
  makeMove: (from: Square, to: Square, promotion?: PieceSymbol) => void
  cancelPromotion: () => void
  resign: (color: Color) => void
  resetGame: () => void
}
```

Nota: el store NO guarda una instancia `Chess` mutable. Cada movimiento pasa por `applyMove(fen, ...)` del engine (función pura) y el FEN resultante reemplaza al anterior. `gameId`/`realtimeChannel` se agregan en los steps 10-13 (Supabase).

## Component Structure (GamePage)

```
GamePage
  ├── Navbar
  └── div.game-container (position: relative, 100vh)
       ├── Canvas (R3F, fill viewport)
       │    └── GameScene
       │         ├── PerspectiveCamera + OrbitControls (limitado)
       │         ├── Lighting (ambient + spot con sombras)
       │         ├── Board3D → Square3D × 64
       │         ├── PieceSet → Piece3D × n (geometría procedural)
       │         └── MoveHighlight × n (esferas verdes)
       └── GameHUD (position: absolute, overlay)
            ├── TurnIndicator
            ├── CapturedPieces
            ├── MoveHistory (SAN)
            └── GameControls
```

## Routes

| Path | Page |
|------|------|
| `/` | HomePage — selección de modo |
| `/game/local` | GamePage — partida local |
| `/game/ai` | GamePage — vs IA |
| `/game/online/:roomCode` | GamePage — online |
| `/lobby` | LobbyPage — crear/unirse sala |
| `/profile` | ProfilePage — perfil propio |
| `/profile/:username` | ProfilePage — perfil público |

## AI Implementation

Motor minimax con alpha-beta pruning en Web Worker (`src/workers/ai.worker.ts`):
- Evaluación: valores material (P=100, N=320, B=330, R=500, Q=900, K=20000) + tablas posicionales
- Dificultad: Easy=depth 2 (<100ms), Medium=depth 3 (<500ms), Hard=depth 5 (<2s)
- Worker recibe `{fen, depth}` y devuelve `{bestMove: {from, to}}`

## Multiplayer Online

- Sala = canal Supabase Realtime `game:${roomCode}`
- Formato evento: `{ type: 'move' | 'result' | 'resign', san, fen, playerId }`
- Moves se broadcast (efímero) Y se guardan en tabla `moves` (persistente)
- Presence de Supabase para detectar desconexión

## Code Organization Rules

1. **Un componente por archivo.** Máximo 300 líneas. Extraer sub-componentes si excede.
2. **Path alias `@/`** para todos los imports desde `src/`.
3. **Immutabilidad total.** Nunca mutar la instancia de `chess` ni los arrays del store directamente.
4. **Sin lógica de ajedrez fuera de `src/lib/chess/`.** Componentes solo llaman funciones del engine.
5. **Sin `any` types.** TypeScript strict. Si un tipo es difícil, resuélvelo con el tipo correcto.

## Design System

### Colors (CSS variables en `src/index.css`)

```css
--background: #0A0A0F    /* fondo página */
--surface: #141420       /* cards, panels */
--surface-elevated: #1E1E2E  /* dropdowns, elevated */
--primary: #D4A853       /* gold — botones, accents, squares claros */
--primary-dark: #8B6914  /* hover, squares oscuros */
--text: #E8E8F0          /* texto principal */
--muted: #6B6B80         /* texto secundario, bordes */
--success: #4CAF82       /* valid moves, confirmaciones */
--destructive: #E05555   /* errores, jaque, rendirse */
--piece-white: #F0E6D3   /* material piezas blancas */
--piece-black: #2A2035   /* material piezas negras */
```

### Typography

- Headings: `Cinzel` (Google Fonts), weight 600-700
- Body: `Inter`, 14-16px, weight 400-500
- Move notation: `JetBrains Mono`, 13px

### Visual Style

Dark glass aesthetic: `backdrop-blur-md`, fondos semi-transparentes, bordes sutiles `#1E1E2E`.
Botones: borde dorado hover con fill dorado, transiciones 200ms ease.
Tablero: cuadros alternando `--primary` y `--primary-dark`, `receiveShadow`.
Piezas: `MeshStandardMaterial` roughness=0.3 metalness=0.1, `castShadow`.

## Build Order (pasos del plan)

1. **[Done]** Scaffold (Vite + React + TypeScript + Tailwind v4 + dependencias)
2. **[Done]** Tipos y Chess Logic Layer (`src/types/game.ts`, `src/lib/chess/engine.ts` + `coords.ts`, 30 tests)
3. **[Done]** Zustand Game Store (`src/stores/gameStore.ts`, 13 tests)
4. **[Done]** Escena 3D — Tablero (`GameScene.tsx`, `Board3D.tsx`, `Square3D.tsx`)
5. **[Done]** Escena 3D — Piezas (geometría procedural Three.js en `Piece3D.tsx`, `PieceSet.tsx` — sin GLB externos)
6. **[Done]** Interactividad — selección y movimientos (`MoveHighlight.tsx`, `PromotionDialog.tsx`)
7. **[Done]** Modo local completo + HUD (`GameHUD.tsx`, `GameResult.tsx`, `CapturedPieces.tsx`)
8. IA minimax en Web Worker (`ai/evaluate.ts`, `ai/minimax.ts`, `workers/ai.worker.ts`)
9. Animaciones de piezas (@react-spring/three)
10. Supabase setup (SQL migrations, client, RLS)
11. Auth (AuthModal, authStore, RequireAuth)
12. Perfiles y ELO (ProfilePage, elo.ts)
13. Multiplayer online (LobbyPage, realtime.ts)
14. Testing (Vitest unit + Playwright E2E)
15. Deploy Vercel

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | URL del proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Anon public key de Supabase |

## Reglas No Negociables

1. TypeScript strict mode. Cero `any`. Cero `@ts-ignore`. Build limpio = prerequisito para merge.
2. chess.js es la única fuente de verdad para reglas. No reimplementar validación de movimientos.
3. La IA DEBE correr en Web Worker. Nunca bloquear el main thread de R3F.
4. `.env.local` NUNCA se commitea. Solo `.env.example` va al repo.
5. RLS habilitado en todas las tablas Supabase. Nunca deshabilitar.
