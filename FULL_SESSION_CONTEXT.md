# Pipeline Copilot — Full Session Context
> **Everything that has happened, every decision made, every bug found, every fix applied. Read this before doing anything.**

---

## 1. What The App Is

**Pipeline Copilot** is a personal offline-first pre-production planning tool for short-form video production. Android only. One user. Not public software.

**The workflow:** Plan everything on phone during dead time → sit at desk → generate everything in one production session using Flux/LTX/ComfyUI.

**The output:** A structured JSON per project: segmented script beats + selected visual style + tagged subjects + per-scene visual briefs (production prompts) ready for generative AI workflows.

---

## 2. Tech Stack

- **Expo SDK 54** + **Expo Router** (file-based routing)
- **React Native** New Architecture
- **react-native-reanimated** — all animations
- **react-native-gesture-handler** — all gestures
- **PowerSync** + **Supabase** — offline-first SQLite → Postgres sync
- **@react-native-async-storage/async-storage** — Supabase session persistence
- **TypeScript** throughout
- Physical Android device: Infinix X650C
- Local path: `C:/PipelineCopilot`
- Repo: `https://github.com/raniatiesin/pipeline-copilot`
- Run: `npx expo run:android`

---

## 3. App Structure — The Fractal Kanban

Two-level Kanban. The outer board shows all projects. Tapping a project opens its inner board with 4 pipeline stage cards.

### Projects Kanban (`app/project.tsx`)
- 5 columns: Waiting → Up Next → In Progress → In Review → Done
- Cards NOT draggable — status changes automatically
- Waiting column has Add button → `CreateProjectModal`
- Long-press project card → `ConfirmModal` with Delete option
- **On project creation → immediately navigate into that project's Stages Kanban**

### Stages Kanban (`app/stages.tsx`)
- Same 5 columns
- Exactly 4 pre-configured stage cards per project
- Cards NOT draggable
- Column width = 88–90% of screen, next column peeks at edge
- `decelerationRate={0.994}` for premium snap feel

---

## 4. The 4 Pipeline Cards

### Card 1 — Style Selector
- Browse 686 collage images bundled as local assets
- Filter system: 12 question dimensions, AND-intersection logic
- View toggle: 1 / 2 / 3 columns
- Images: `resizeMode="contain"`, `aspectRatio: 1` (square containers), no background fill
- Selected collage: 3px `colors.primary` border + checkmark badge
- Filter sheet: 2-column chip grid per question, "CLEAR ALL" button when filters active
- Swipe right to go back
- Saves `style_selection` JSON to DB on Continue

### Card 2 — Beat Butcher
- Gesture-driven scene segmenter
- **Routing: opens directly to `beat-butcher.tsx` — NOT via `input.tsx`**
- Script pre-loaded from DB (`pipelines.script` column)
- Three gesture systems (ALL FROZEN — `components/scene-segmentation/scene-mapper/`):
  - Long-press word (300ms) + drag down → split scene
  - Swipe card left/right → merge scenes
  - Long-press header (500ms) + drag → reorder
- Saves `beat_butcher_output: JSON.stringify(scenes)` to DB on Continue

### Card 3 — Entity Editor
- Reads `beat_butcher_output` from DB on mount
- Horizontal scene strip at top — one column per scene
- Tap word → tap second word → creates highlight span
- Subject profiles panel (8-color brand palette)
- Fuzzy repeat detection
- Saves `entity_editor_output: JSON.stringify(subjectCategories)` to DB on Continue

### Card 4 — Arc Assembler
- Reads `beat_butcher_output`, `entity_editor_output`, `style_selection` from DB on mount
- Two modes via full-page horizontal swipe:
  - **Scene Mode** — scene text + subject highlights + TextInput for visual brief + collage overlay
  - **Subject Mode** — subject name + TextInput + scenes list
- Subject highlights draggable into TextInput → inserts visual brief text at cursor
- Bidirectional sync between modes
- Saves `arc_assembler_output` debounced (800ms) to DB

---

## 5. Project Creation Flow

**Modal inputs:**
1. Prospect Name
2. Post Name
3. Script (the exact text to be segmented)

**On confirm:**
- `createProject()` in `lib/database.ts` creates pipeline row
- Initializes `card_statuses` with Beat Butcher at 50% IN_PROGRESS
- **Immediately navigates to that project's Stages Kanban** — no manual tap needed

---

## 6. Card Status & Progress System

### Progress Rules Per Card
```
Beat Butcher:
  Created = 50% (script pasted = half done)
  Continue pressed = 100%

Style Selector:
  Created = 0%
  Collage selected = 50%
  Continue pressed = 100%

Entity Editor:
  Created = 0%
  Any subject tagged = 50%
  Continue pressed = 100%

Arc Assembler:
  Created = 0%
  Any brief written = 50%
  Continue pressed = 100%
```

### Status Derived From Progress (never hardcoded after creation)
```
progress = 0   AND not unlocked → TODO
progress = 0   AND unlocked     → UP_NEXT
0 < progress < 100              → IN_PROGRESS
progress = 100 AND !isApproved  → IN_REVIEW
progress = 100 AND isApproved   → DONE
```

### Unlock Chain
```
On project creation:
  Beat Butcher    → IN_PROGRESS (50%)    ← starts here immediately
  Style Selector  → UP_NEXT (0%)         ← unlocked at creation
  Entity Editor   → TODO                 ← locked
  Arc Assembler   → TODO                 ← locked

Beat Butcher → 100% (Continue):
  Entity Editor → UP_NEXT

Entity Editor → 100% (Continue):
  Arc Assembler → UP_NEXT

Style Selector unlocks independently — no downstream effect
```

### isModuleUnlocked Logic
- Indices 0 and 1 (`style-selector`, `beat-butcher`) → always unlocked
- Index 2 (`entity-editor`) → unlocked when `beat-butcher.progress >= 100`
- Index 3 (`arc-assembler`) → unlocked when `entity-editor.progress >= 100`

### Module Order
```typescript
MODULE_ORDER = ['style-selector', 'beat-butcher', 'entity-editor', 'arc-assembler']
```

### Overall Project Progress
```typescript
progress = Math.round((ssProgress + bbProgress + eeProgress + aaProgress) / 4)
```

---

## 7. card_statuses JSON Structure

Stored as a JSON string in the `pipelines.card_statuses` column.

```typescript
interface StageCardStatus {
  progress: number;      // 0–100
  isApproved: boolean;   // true = DONE
  isOutdated: boolean;   // true = shows OUTDATED badge
  quickNote: string;
}

type CardStatuses = Record<string, StageCardStatus>;
```

**Initial state on project creation:**
```json
{
  "beat-butcher":   { "progress": 50, "isApproved": false, "isOutdated": false, "quickNote": "" },
  "style-selector": { "progress": 0,  "isApproved": false, "isOutdated": false, "quickNote": "" },
  "entity-editor":  { "progress": 0,  "isApproved": false, "isOutdated": false, "quickNote": "" },
  "arc-assembler":  { "progress": 0,  "isApproved": false, "isOutdated": false, "quickNote": "" }
}
```

**Status is NOT stored in card_statuses — it is always derived.**

---

## 8. Navigation

```
Welcome (app/index.tsx)
  └── Get Started → Projects Kanban (app/project.tsx)
        └── Create project → immediately → Stages Kanban (app/stages.tsx)
        └── Tap project card → Stages Kanban (app/stages.tsx)
              ├── Beat Butcher → app/scene-segmentation/beat-butcher.tsx (DIRECT — skip input.tsx)
              ├── Entity Editor → app/scene-segmentation/entity-editor.tsx
              ├── Style Selector → app/style-matcher/index.tsx
              └── Arc Assembler → app/arc-assembler/index.tsx
```

### Navigation Rules
- **Continue** on any work screen → `router.dismissAll()` (returns to Stages)
- **Back** → `router.back()` (one level up)
- `projectId` passed as route param to every work screen
- `input.tsx` is NOT in the main flow — Beat Butcher opens directly

### Mount Effects (all 4 work screens)
Each screen calls `stageCallbacks.markInProgress(moduleId)` on mount if current status is `UP_NEXT`.

---

## 9. Cross-Route Bridge: stageCallbacks

`lib/stageCallbacks.ts` — mutable ref pattern for cross-route communication.

- `stageCallbacks.markInProgress(moduleId)` — called on screen mount
- `stageCallbacks.markInReview(moduleId)` — called on Continue
- Registered in `app/stages.tsx` on mount, unregistered on unmount

---

## 10. Data Model

```
Supabase table: pipelines
  id                    UUID (crypto.randomUUID())
  prospect_name         text
  post_name             text
  script                text
  style_selection       text (JSON)
  beat_butcher_output   text (JSON: Scene[])
  entity_editor_output  text (JSON: SubjectCategory[])
  arc_assembler_output  text (JSON: { sceneBriefs, subjectBriefs })
  card_statuses         text (JSON: CardStatuses)
  created_at            timestamptz
  updated_at            timestamptz (auto-updated via trigger)
```

### Key DB Functions (`lib/database.ts`)
- `createProject(data)` — creates row, initializes card_statuses with BB at 50%
- `updateProject(id, data)` — partial update
- `deleteProject(id)` — deletes row
- `getProjects()` — one-time read (used before watch for initial state)
- `watchProjects()` — async generator, yields on any change
- `watchProject(id)` — async generator, watches one row
- `rowToProjectItem(row)` — maps PipelineRow → KanbanItem for Projects board
- `rowToStageItems(row)` — maps PipelineRow → 4 KanbanItems for Stages board
- `parseCardStatuses(raw)` — safely parses card_statuses JSON

---

## 11. Storage — Fully Wired ✅

**Everything working:**
- Supabase anonymous auth enabled + `@react-native-async-storage/async-storage` for session persistence
- PowerSync JWT secret configured (Supabase JWT secret pasted into PowerSync dashboard)
- Sync rules deployed: `SELECT * FROM pipelines`
- Local SQLite reads/writes work offline
- Cloud sync works when online
- Sync status dot: `colors.accent` (skyBlue) = online, `colors.error` (alizarinCrimson) = offline
- `useSyncStatus` wired to real PowerSync status via `useContext(PowerSyncContext)` + `registerListener`

**How it was fixed:**
- `lib/supabase.ts`: `autoRefreshToken: true`, `persistSession: true`, `storage: AsyncStorage`
- `getSupabaseToken()`: calls `signInAnonymously()` if no session exists
- PowerSync dashboard: "Use Supabase Auth" checked + JWT secret filled in
- Sync rules: were pointing to `mytable` — fixed to `pipelines`

---

## 12. Design System — LOCKED

All values in `constants/theme.ts`. Never hardcode. Never deviate.

### Colors
| Token | Hex | Usage |
|---|---|---|
| `colors.background` | `#fef4dd` | Every screen background — warm cream |
| `colors.surface` | `#ffffff` | Card backgrounds, inputs |
| `colors.primary` | `#141614` | Borders, primary text |
| `colors.secondary` | `#e8824f` | Burnt sienna — IN_PROGRESS |
| `colors.accent` | `#69c2ef` | Sky blue — DONE, success, sync online |
| `colors.accentAlt` | `#ffc22a` | Sunglow — UP_NEXT, warnings, outdated |
| `colors.error` | `#d72a21` | Alizarin crimson — CTAs, delete, sync offline |
| `colors.border` | `#141614` | All 3px borders |
| `colors.text.primary` | `#141614` | Body text |
| `colors.text.secondary` | `#2e2a26` | Muted text |
| `colors.text.inverse` | `#ffffff` | Text on dark/colored backgrounds |

### Typography
| Token | Size/Weight | Usage |
|---|---|---|
| `typography.title` | 30px/800 | Screen titles only |
| `typography.subtitle` | 18px/600 | Card titles, section headings |
| `typography.body` | 16px/500 | Body text, word tokens |
| `typography.button` | 16px/700 uppercase | All button labels |
| `typography.caption` | 13px/600 | Badges, stats, descriptions |
| `typography.overline` | 12px/700 uppercase | Column headers, overlines |

### Spacing: `xxs=4 xs=8 sm=12 md=18 lg=24 xl=32 xxl=48 xxxl=64`
### Border Radius: `sm=6 md=12 lg=18 xl=26`
### Shadows: `soft(2×2/0.18)` `medium(4×4/0.30)` `hard(6×6/0/0.40)`

### Neobrutalist Rules
- 3px solid border on every card and interactive element
- Hard offset shadows on primary CTAs
- Warm cream background on every screen — never white, never gray
- Bold uppercase on status indicators and badges
- No glassmorphism, no blur, no gradients
- No full pill radius on cards — `borderRadius.md` or `borderRadius.lg` only

---

## 13. Pill Button Unification

**All pill buttons app-wide must match the column header pills exactly:**
- Same height, padding, border radius, typography, border width
- Applies to: Continue/Cancel (`FooterActions.tsx`), `Button.tsx` primary/secondary, `ConfirmModal.tsx` buttons, inline action buttons in kanban
- Prompt dispatched — `fix: unify pill button sizing across all components`

---

## 14. Card Visual Design Per Status

| Status | Column | Left Accent Bar | Opacity |
|---|---|---|---|
| TODO | Waiting | none | 0.45 |
| UP_NEXT | Up Next | `colors.accentAlt` (sunglow) | 1.0 |
| IN_PROGRESS | In Progress | `colors.secondary` (burnt sienna) | 1.0 |
| IN_REVIEW | In Review | `#7c3aed` (purple) | 1.0 |
| DONE | Done | `colors.accent` (sky blue) | 0.75 |

### UniversalModuleCard Spec
- Background: `colors.surface`, 3px `colors.border`, `shadows.soft`, `borderRadius.md`
- Title: `typography.subtitle` bold
- Description: `typography.caption`, `colors.text.secondary`, 2 lines max
- Progress bar: 4px height, status color fill
- Status pill: uppercase, status color background, `colors.text.inverse`, tight padding
- "Mark as Done" button: visible only on IN_REVIEW cards
- Outdated badge: "OUTDATED" pill, `colors.accentAlt` bg, `colors.primary` text
- Long-press → `ConfirmModal` for delete (project cards only)

---

## 15. Architecture Rules — NEVER VIOLATED

### Layer Order
```
types/ → constants/ → lib/ → hooks/ → components/ → app/
```

### Rules
- No Redux, Zustand, Jotai — React Context + hooks only
- Every screen uses `ScreenLayout` — no exceptions
- All animations: `react-native-reanimated` only
- All gestures: `react-native-gesture-handler` only
- SharedValues for animation state — never `setState` during drag
- `StyleSheet.create()` at bottom of every file
- `React.memo()` on all list-rendered components
- Every file has JSDoc `@module` header
- UUID v4 always — never `Date.now()` or `Math.random().toString(36)`
- **`components/scene-segmentation/scene-mapper/` is FROZEN — do not touch**

---

## 16. Known Bugs & Active Fixes

### Bug 1 — Cards teleport to TODO after project creation ← ACTIVE
**Symptom:** Cards show correct positions briefly then all jump to Waiting/TODO.
**Root cause:** `rowToStageItems()` has `status: KANBAN_STATUS.TODO` hardcoded as the initial value before `applyDerivedStatuses` runs. The derived status logic in `useKanban` should override it — but may be failing on first watch emission.
**Suspected cause:** `parseCardStatuses` duplicate declaration introduced by an agent — `TypeError: Duplicate declaration "parseCardStatuses"` — this crashes the bundle and may be causing the issue.
**Fix needed:**
1. Find and remove the duplicate `parseCardStatuses` declaration — it's somewhere in `lib/database.ts` (already has one at line 197) or a file the agent created
2. Ensure `rowToStageItems()` uses derived status not hardcoded TODO
3. Ensure `applyDerivedStatuses()` in `useKanban` runs correctly on first emit

### Bug 2 — parseCardStatuses duplicate declaration
**Error:** `TypeError: Duplicate declaration "parseCardStatuses"` at line 54 of some file
**Search result:** Only found at `lib/database.ts:197` — the duplicate must be in a newly created file
**Fix:** Run `Get-ChildItem -Path "C:\PipelineCopilot" -Recurse -Include "*.ts","*.tsx" | Where-Object { $_.FullName -notlike "*node_modules*" } | Select-String -Pattern "function parseCardStatuses"` to find all occurrences. Delete the duplicate.

### Bug 3 — Continue navigation (partially fixed)
**Status:** `router.dismissAll()` prompt dispatched but not yet confirmed working on all 4 screens.
**Files:** `beat-butcher.tsx`, `entity-editor.tsx`, `style-matcher/index.tsx`, `arc-assembler/index.tsx`

### Bug 4 — input.tsx still in Beat Butcher routing
**Status:** Prompt dispatched. Beat Butcher should open directly to `beat-butcher.tsx` skipping `input.tsx`.

---

## 17. Completed Fixes (History)

| Fix | Status |
|---|---|
| PowerSync cloud sync — JWT secret, sync rules | ✅ Done |
| Supabase anonymous auth + AsyncStorage | ✅ Done |
| useSyncStatus wired to real PowerSync status | ✅ Done |
| UUID generation fixed (v4 format everywhere) | ✅ Done |
| Bad UUID stuck in PowerSync CRUD queue | ✅ Done |
| RLS policies on Supabase pipelines table | ✅ Done |
| watchProjects initial state (getProjects before watch) | ✅ Done |
| Duplicate style-selector folder deleted | ✅ Done |
| Style Selector: square image containers, no crop | ✅ Done |
| Style Selector: FlatList performance optimizations | ✅ Done |
| Style Selector: 2-column filter chip grid | ✅ Done |
| Style Selector: design coherence with app theme | ✅ Done |
| ConfirmModal for project deletion | ✅ Done |
| Kanban column peek + snap feel | ✅ Done |
| Beat Butcher branding (removed "Scene Segmentor") | ✅ Done |
| Entity Editor reads Beat Butcher output from DB | ✅ Done |
| Arc Assembler reads all upstream outputs from DB | ✅ Done |
| markInProgress / markInReview / markDone in useKanban | ✅ Done |
| Outdated badge system | ✅ Done |

---

## 18. File Structure Reference

```
app/
  _layout.tsx                           ← root layout, PowerSyncContext.Provider
  index.tsx                             ← welcome screen
  project.tsx                           ← projects kanban
  stages.tsx                            ← stages kanban + stageCallbacks registration
  arc-assembler/index.tsx               ← arc assembler work screen
  scene-segmentation/
    beat-butcher.tsx                    ← beat butcher work screen (MAIN ENTRY)
    entity-editor.tsx                   ← entity editor work screen
    input.tsx                           ← old paste screen (NOT in main flow)
  style-matcher/
    index.tsx                           ← style selector work screen

components/
  arc-assembler/                        ← arc assembler sub-components
  kanban/
    AddProjectButton.tsx
    CreateProjectModal.tsx
    KanbanBoard.tsx
    KanbanCard.tsx
    KanbanColumn.tsx
  scene-segmentation/scene-mapper/      ← FROZEN gesture system
  style-selector/
    CollageImage.tsx                    ← individual collage card
  ui/
    Button.tsx
    ConfirmModal.tsx
    FooterActions.tsx                   ← Continue + Cancel buttons
    NavigationHeader.tsx                ← sync status dot
    ScreenLayout.tsx                    ← universal screen wrapper
    card/
      UniversalModuleCard.tsx           ← kanban card
      (+ sub-components)

hooks/
  useArcAssembler.tsx
  useEntityEditor.tsx
  useKanban.tsx                         ← ALL card status/progress logic
  useSceneSegmentation.tsx
  useStyleSelector.tsx
  useSyncStatus.ts                      ← real PowerSync status via registerListener

lib/
  database.ts                           ← all DB functions, row mappers, parseCardStatuses
  powersync.ts                          ← PowerSync schema + SupabaseConnector
  stageCallbacks.ts                     ← cross-route bridge
  supabase.ts                           ← Supabase client + getSupabaseToken()
  sceneSegmentation.ts                  ← generateId() — UUID v4

constants/
  theme.ts                              ← LOCKED design system
  kanbanStatus.ts                       ← KANBAN_STATUS enum
  kanbanTheme.ts                        ← MODULE_ORDER, MODULE_CONFIG
  collageImages.ts                      ← 686 static require() calls
  styleMatcherData.ts                   ← 2800 lines of filter question data

types/
  kanban.ts                             ← KanbanItem, KanbanStatus, etc.
```

---

## 19. Immediate Next Actions (In Priority Order)

1. **Fix `parseCardStatuses` duplicate** — find the duplicate declaration, delete it, rebuild
2. **Fix cards teleporting to TODO** — verify `createProject` initializes BB at 50%, verify `applyDerivedStatuses` runs correctly on first watch emit
3. **Fix Continue navigation** — `router.dismissAll()` on all 4 work screens
4. **Fix Beat Butcher routing** — open directly to `beat-butcher.tsx`, skip `input.tsx`
5. **Unify pill button sizing** — Continue/Cancel match column header pills
6. **Style Selector swipe back + Clear Filters button**
7. **JSON Export** — `lib/exportPipeline.ts` + copy button on project cards
8. **Full UI refinement pass** — per the UI Design Guide

---

## 20. Active Prompts Ready to Dispatch

These have been written and are ready:

- **Router fixer** — `router.dismissAll()` on Continue for all 4 work screens
- **Card wiring fixer** — full status chain, createProject initializes correctly, derived status
- **parseCardStatuses duplicate** — find and delete duplicate
- **Project creation flow** — auto-navigate, direct BB routing, progress tracking, derived status
- **Pill button unification** — unify sizing across all components
- **Style Selector swipe back + clear filters** — two surgical fixes
- **UI Design Guide** — full screen-by-screen refinement spec (already written)

---

## 21. Agent Instructions (Standard Header)

Every agent session starts with this:

> You are a senior React Native engineer working on Pipeline Copilot — a personal offline-first pre-production planning tool for short-form video production. The full specification is in this context document. The repo is at https://github.com/raniatiesin/pipeline-copilot. Read it in full before doing anything. Your role: execute tasks in strict order. Do not skip ahead. Do not refactor things not on the task list. Do not introduce new patterns, libraries, or conventions not already present in the codebase. When in doubt, check this document first and ask before acting. **Do not touch `components/scene-segmentation/scene-mapper/` — it is frozen.**
