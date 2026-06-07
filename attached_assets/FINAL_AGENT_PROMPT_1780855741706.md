# Final Agent — Ship It

> **Repo:** https://github.com/raniatiesin/pipeline-copilot  
> **Master doc:** `PIPELINE_COPILOT_MASTER_V2.md` in `attached_assets/` — read it in full before touching anything.  
> **Your role:** This is the final session. You ship the app. You fix what's broken, refine every screen to production quality, remove all dead code, and leave the codebase clean. No half-measures.

---

## Before You Start

Read these files in full before writing a single line:

- `PIPELINE_COPILOT_MASTER_V2.md` — full spec, current state, what must not change
- `app/_layout.tsx` — root layout
- `app/project.tsx` — projects kanban
- `app/stages.tsx` — stages kanban
- `lib/stageCallbacks.ts` — cross-route bridge
- `lib/database.ts` — all DB functions
- `hooks/useKanban.tsx` — full dependency logic
- `hooks/useSyncStatus.ts` — currently stubbed
- `constants/theme.ts` — design system (READ ONLY)
- `components/ui/ScreenLayout.tsx` — universal screen wrapper
- `components/ui/card/UniversalModuleCard.tsx` — kanban card
- `components/kanban/KanbanBoard.tsx` — kanban board
- `components/kanban/KanbanColumn.tsx` — kanban column
- `components/kanban/KanbanCard.tsx` — kanban card wrapper
- Every work screen: `app/style-matcher/index.tsx`, `app/scene-segmentation/beat-butcher.tsx`, `app/scene-segmentation/entity-editor.tsx`, `app/arc-assembler/index.tsx`

Present your full understanding and task plan before writing any code. Then execute task by task.

---

## TASK 1 — Fix Continue Navigation on All Work Screens

**Problem:** Tapping Continue on any work screen (Beat Butcher, Entity Editor, Style Selector, Arc Assembler) navigates one level up instead of all the way back to the Stages Kanban.

**Fix:** In each of the 4 work screens, find `handleContinue` and replace `router.back()` with `router.dismissAll()`. The Back button (`handleBack`) stays as `router.back()`.

Screens to fix:
- `app/scene-segmentation/beat-butcher.tsx`
- `app/scene-segmentation/entity-editor.tsx`
- `app/style-matcher/index.tsx`
- `app/arc-assembler/index.tsx`

Verify: after Continue, the user lands on the Stages Kanban, not on an intermediate screen.

---

## TASK 2 — Fix Card Status Wiring End-to-End

**Problem:** Cards may not be transitioning status correctly. The full chain needs to work on device:

1. Create project → Style Selector and Beat Butcher show UP_NEXT, Entity Editor and Arc Assembler show TODO
2. Open Beat Butcher → card moves to IN_PROGRESS
3. Complete and Continue → card moves to IN_REVIEW, Entity Editor unlocks to UP_NEXT
4. Open Entity Editor → card moves to IN_PROGRESS
5. Complete and Continue → card moves to IN_REVIEW, Arc Assembler unlocks to UP_NEXT
6. Style Selector follows the same pattern independently
7. "Mark as Done" button visible on IN_REVIEW cards, moves card to DONE

**What to check and fix:**
- Confirm `stageCallbacks.setMarkInReview` and `stageCallbacks.setMarkInProgress` are registered in `app/stages.tsx` on mount and unregistered on unmount
- Confirm all 4 work screens call `stageCallbacks.markInProgress(moduleId)` in a `useEffect` on mount (only when current status is UP_NEXT — do not re-trigger if already IN_PROGRESS)
- Confirm all 4 work screens call `stageCallbacks.markInReview(moduleId)` in `handleContinue`
- Confirm `markInReview` in `useKanban` unlocks the next card correctly
- Confirm "Mark as Done" button renders on `UniversalModuleCard` when status is IN_REVIEW and calls `markDone`
- Fix anything that isn't working

---

## TASK 3 — Remove Auto-Seed and Cleanup Code

**Remove from `app/project.tsx`:**
- The auto-seed block that creates a demo project on mount (the `useRef` + `setTimeout` + `createProject` block). The project creation form exists now — the seed is no longer needed.

**Remove from `app/_layout.tsx` startup (or `lib/database.ts`):**
- `cleanupInvalidUUIDs()` call — UUIDs are correct now, this is dead code
- `clearStuckCrudTransactions()` call — the stuck UUID is gone, this is dead code

**Remove the functions themselves from `lib/database.ts`:**
- `cleanupInvalidUUIDs()` 
- `clearStuckCrudTransactions()`

After removal, verify the app still starts cleanly.

---

## TASK 4 — Wire Real Sync Status Dot

**Problem:** `hooks/useSyncStatus.ts` is stubbed to always return `'offline'`. The dot in `NavigationHeader` is always red.

**Fix:** Replace the stub with the real PowerSync status hook. The correct API is `useStatus()` from `@powersync/react`. Wrap it in a try/catch with `'offline'` fallback for the window before PowerSync context is ready:

```typescript
import { useContext } from 'react';
import { PowerSyncContext } from '@powersync/react';

export type SyncStatusResult = 'online' | 'offline';

export function useSyncStatus(): SyncStatusResult {
  try {
    const db = useContext(PowerSyncContext);
    if (!db) return 'offline';
    // PowerSyncDatabase has a currentStatus property
    return db.currentStatus?.connected ? 'online' : 'offline';
  } catch {
    return 'offline';
  }
}
```

Check what status API is actually available on the PowerSync DB instance before writing — look at `node_modules/@powersync/react-native/dist/index.js` or the type definitions. Use whatever `.connected` or `.currentStatus.connected` pattern is actually exported. Do not guess.

---

## TASK 5 — JSON Export

**Build `lib/exportPipeline.ts`:**

```typescript
// Pure function — takes a PipelineRow, returns a structured export object
export function exportPipeline(row: PipelineRow): PipelineExport {
  return {
    meta: {
      prospectName: row.prospect_name,
      postName: row.post_name,
      exportedAt: new Date().toISOString(),
    },
    script: row.script,
    styleSelection: row.style_selection ? JSON.parse(row.style_selection) : null,
    scenes: row.beat_butcher_output ? JSON.parse(row.beat_butcher_output) : [],
    subjects: row.entity_editor_output ? JSON.parse(row.entity_editor_output) : [],
    arcAssembler: row.arc_assembler_output ? JSON.parse(row.arc_assembler_output) : null,
  };
}
```

**Add export button to project cards:**
- In `components/kanban/KanbanCard.tsx` or `components/ui/card/UniversalModuleCard.tsx` — add a small export icon button (Feather `"copy"` icon) visible only on project cards (`moduleId === 'project'`)
- Tap → call `exportPipeline(row)` → `JSON.stringify(result, null, 2)` → copy to clipboard via `expo-clipboard`
- Show a brief inline confirmation ("Copied!") that disappears after 2 seconds using local state
- The export button sits in the card footer area, secondary styling (no hard shadow, just border)
- Install `expo-clipboard` if not already installed: `npx expo install expo-clipboard`

**Type:**
```typescript
// types/export.ts
export interface PipelineExport {
  meta: { prospectName: string; postName: string; exportedAt: string };
  script: string;
  styleSelection: any | null;
  scenes: any[];
  subjects: any[];
  arcAssembler: any | null;
}
```

---

## TASK 6 — Full UI Refinement (Designer Pass)

This is the most important task. Every screen gets a designer's eye. The goal: premium, coherent, neobrutalist. No structural rewrites — only visual refinement.

**Global rules:**
- Every color from `constants/theme.ts` only
- Every spacing value from the spacing scale only
- 3px borders everywhere interactive
- Hard shadows on CTAs
- Warm cream background on everything
- No white voids, no floating elements without borders

---

### 6.1 Projects Kanban (`app/project.tsx` + `components/kanban/`)

**KanbanBoard:**
- Column width = 88% of screen width so next column peeks at ~12%
- `snapToInterval` = column width + gap, `decelerationRate="fast"`, `snapToAlignment="start"`
- No horizontal padding on the board itself — columns bleed to edges with inner padding

**KanbanColumn:**
- Column header: overline typography, uppercase, `colors.text.secondary`
- Column count badge: small pill, `colors.surface`, 3px border, `borderRadius.sm`
- Empty column state: dashed 2px border box with "Nothing here" in `colors.text.secondary`
- Cards have `marginBottom: spacing.sm` between them

**KanbanCard / UniversalModuleCard:**
- Background: `colors.surface` (white)
- Border: 3px `colors.border` (primary/black)
- Shadow: `shadows.soft`
- Border radius: `borderRadius.md` (12px)
- Card title: `typography.subtitle`, bold, `colors.text.primary`
- Card description: `typography.caption`, `colors.text.secondary`, max 2 lines
- Status pill: small, uppercase, correct status color, tight padding — `paddingHorizontal: spacing.xs`, `paddingVertical: 2`, `borderRadius: borderRadius.sm`
- Progress bar: 3px height, `colors.border` track, status color fill
- Icon: Feather, size 18, `colors.text.secondary`
- No filled background containers inside the card — everything transparent or `colors.surface`
- "Mark as Done" button: only visible on IN_REVIEW cards — small secondary button at card bottom, `colors.accent` border and text
- Outdated badge: small "OUTDATED" pill in `colors.accentAlt` background, `colors.primary` text
- Export button (project cards only): Feather `"copy"`, size 16, `colors.text.secondary`, top-right of card or in footer

**Add Project Button (`components/kanban/AddProjectButton.tsx`):**
- Full width, dashed 2px border, `colors.border`, `borderRadius.md`
- "+" icon + "New Project" label, `colors.text.secondary`
- No fill background

---

### 6.2 Stages Kanban (`app/stages.tsx`)

Same card refinements as above. Additionally:
- Stage cards show the correct icon per module (check `constants/kanbanTheme.ts` for MODULE_CONFIG icons)
- TODO cards: reduced opacity (0.5), no tap feedback
- UP_NEXT cards: subtle `colors.accentAlt` left border accent (4px, `borderRadius.sm`)
- IN_PROGRESS cards: `colors.secondary` left border accent
- IN_REVIEW cards: purple left border accent
- DONE cards: `colors.accent` left border accent, slight opacity reduction

---

### 6.3 Style Selector (`app/style-matcher/index.tsx`)

- View toggle buttons: clean icon-only row, aligned right, above the gallery
  - Active: `colors.primary` background, `colors.text.inverse` icon
  - Inactive: `colors.surface` background, `colors.text.secondary` icon, 3px border
  - Size: 36×36, `borderRadius.sm`, `shadows.soft`
- Gallery: `contentContainerStyle` with `padding: spacing.sm`, `gap: spacing.sm` between items
- Each collage: 3px border `colors.border`, `borderRadius.md`, `shadows.soft`
- Selected collage: 3px `colors.primary` border + checkmark badge (Feather `"check"`, white, `colors.primary` background circle, top-right corner)
- Filter sheet handle: visible pill at top of sheet, `colors.border`, 3px border
- Filter chip: unselected = `colors.surface` + `colors.border` border; selected = `colors.primary` bg + `colors.text.inverse` text

---

### 6.4 Beat Butcher (`app/scene-segmentation/beat-butcher.tsx`)

- Screen title: "Beat Butcher" — `typography.title`, bold
- Scene cards: already refined (do not touch gesture system) — check that card border (3px), shadow, and border radius match design system
- Word tokens: `typography.body`, `colors.text.primary`, no background unless being split
- Split ghost card: matches the real card visually
- Drop zones: dashed border, "Drop here" label in `colors.text.secondary`
- Empty state (no script yet): centered message, Feather `"scissors"` icon, instructions

---

### 6.5 Entity Editor (`app/scene-segmentation/entity-editor.tsx`)

- Scene strip: `colors.surface` background, 3px bottom border `colors.border`, horizontal scroll
- Each scene column: 160px wide min, 3px right border `colors.border` (except last), scene text in `typography.caption`
- Active scene column: `colors.accentAlt` top border accent (3px)
- Highlight spans: colored background with 40% opacity, 2px border in full color, `borderRadius.sm`
- Naming bar: slides in from bottom, `colors.surface`, 3px top border, hard shadow
- Profile chips in naming bar: colored pill per existing profile
- Subject profiles panel: `colors.background` fill, 3px top border
- Each profile row: color dot (12px circle), name in `typography.body`, count badge in `typography.caption`
- Profile delete: Feather `"x"` icon, `colors.error`, right side of row
- Empty state in profiles panel: "No subjects yet — tap words above to tag them"

---

### 6.6 Arc Assembler (`app/arc-assembler/index.tsx`)

- Mode indicator: two pills (SCENES / SUBJECTS), active = `colors.primary` bg + `colors.text.inverse`, inactive = `colors.surface` + 3px border
- Scene counter overline: "SCENE 01 / 06" in `typography.overline`, `colors.text.secondary`
- Scene text display: `colors.surface` card, 3px border, `borderRadius.md`, `padding: spacing.md`
- Subject highlight spans within scene text: same as Entity Editor (colored bg 40% opacity, 2px border)
- TextInput: `colors.surface`, 3px border `colors.border`, `borderRadius.md`, `shadows.soft`, `minHeight: 120`, `padding: spacing.md`, `typography.body`
- Placeholder text (style tags): `colors.text.secondary`, italic
- Next / Back buttons: side by side, equal width, secondary style (3px border, no fill, hard shadow)
- Collage button: Feather `"image"`, `colors.error` background, `colors.text.inverse`, `shadows.hard`, 3px border, `borderRadius.md`, floating top-right
- Collage overlay: black background, `resizeMode="contain"`, tap anywhere to dismiss
- Subject mode: subject name in `typography.title`, color dot next to name
- Scenes appearances list: compact rows, `typography.caption`, `colors.text.secondary`, 3px left border in subject color

---

### 6.7 Welcome Screen (`app/index.tsx`)

- Background: `colors.background`
- Title: "Pipeline Copilot" in `typography.title`, bold, centered
- Subtitle: "Your pre-production companion" in `typography.body`, `colors.text.secondary`, centered
- Get Started button: full width, `colors.error` background, `colors.text.inverse`, `shadows.hard`, 3px border, `borderRadius.md`
- Ilmon branding reference optional — keep it minimal

---

## TASK 7 — Dead Code & Optimization Pass

**Remove:**
- All `console.log`, `console.warn`, `console.debug` statements added during debugging (keep intentional error logs with `console.error`)
- Any unused imports across all files you touch
- Any commented-out code blocks
- `hooks/useStyleMatcher.tsx` — the old Q&A flow hook. Check if anything still imports it. If not, delete it.
- Any remaining references to old route names (`scene-mapper`, `subject-segmentor`, `scene-segmentor`) in non-route files

**Optimize:**
- Every component rendered in a list must be wrapped in `React.memo()` — audit `KanbanCard`, `CollageImage`, scene mapper word tokens
- Every callback passed as a prop must be wrapped in `useCallback` — audit all work screens
- Every derived value must be in `useMemo` — audit `useKanban`, `useEntityEditor`, `useArcAssembler`
- `FlatList` in Style Selector: confirm `keyExtractor`, `getItemLayout` (if fixed height), `removeClippedSubviews={true}`, `maxToRenderPerBatch={6}`, `windowSize={3}`

---

## Constraints (Non-Negotiable)

- Every color from `constants/theme.ts` only — no hardcoded hex values anywhere
- No new libraries except `expo-clipboard` for Task 5
- No new state management patterns — React Context + hooks only
- Beat Butcher gesture system (`components/scene-segmentation/scene-mapper/`) — **DO NOT TOUCH**
- Every new file gets a JSDoc `@module` header
- `StyleSheet.create()` at bottom of every file
- `ScreenLayout` on every screen — no exceptions
- Animations via `react-native-reanimated` only
- Zero TypeScript errors in files you touch

---

## Delivery

When all tasks are complete:

1. Do a final pass — read every file you touched and verify it's clean
2. Run TypeScript check — zero errors
3. Remove all debug `console.log` statements
4. Commit with message: `feat: final pass — routing, wiring, export, UI refinement, dead code removal`
5. Push to `main`
6. Report:
   - What was done per task
   - Any decisions made that weren't specified here
   - Anything that needs follow-up or manual verification on device
   - The app is ready to test end-to-end
