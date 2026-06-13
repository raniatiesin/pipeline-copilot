# Pipeline Copilot — Full Codebase Rapport

> Generated: 2026-06-13
> Auditor: AI Code Audit (senior React Native engineer)
> Reference: Layer order correctness = `types/ → constants/ → lib/ → hooks/ → components/ → app/`
> Full context consulted: FULL_SESSION_CONTEXT.md

---

## types/ — Type definitions (layer 1)

### types/index.ts
**Role:** Barrel export — re-exports all public types from sub-modules.
**Flags:** None.

### types/core.ts
**Role:** Foundational types — `ModuleId`, `ModuleStatus`, `ModuleProgress`, `VideoProject`, `PressHandler`, `ChangeHandler`.
**Flags:**
- `ModuleId` union includes `'voice-cloner'`, `'script-generator'`, `'video-renderer'` — future modules not yet implemented. Intentional forward-planning but technically anticipatory dead code.

### types/kanban.ts
**Role:** All Kanban types — `KanbanItem`, `KanbanStatus`, `KanbanAction`, `KanbanContextValue`, component props, `RawPipelineRow`.
**Flags:**
- `KanbanAction` union includes `MARK_IN_REVIEW`, `MARK_DONE`, `FLAG_OUTDATED`, `CLEAR_OUTDATED` — these action types are defined but never dispatched through the reducer; mutations go directly to DB via callbacks. The `dispatch` in `useKanban.tsx` is a no-op (`() => {}`). **Dead code** in the action type union.

### types/arc-assembler.ts
**Role:** Types for Arc Assembler — `ArcAssemblerMode`, `ArcAssemblerOutput`, `ArcAssemblerContextValue`.
**Flags:** None.

### types/export.ts
**Role:** `PipelineExport` interface for JSON serialisation.
**Flags:** None.

### types/navigation.ts
**Role:** Route paths and navigation parameter types.
**Flags:**
- `AppRoute` type includes routes that no longer exist in the app: `'/style-selector/[order]'`, `'/style-selector/results'`, `'/scene-segmentation/input'`, `'/scene-segmentation/scene-mapper'`, `'/scene-segmentation/subject-mapper'`. These reference the old questionnaire-based style flow and the old scene-mapper route structure. **Stale dead route references.**

### types/scene-mapper-gestures.ts
**Role:** All gesture types for the frozen scene-mapper system.
**Flags:** None (frozen per architecture).

### types/scene-segmentation.ts
**Role:** Types for scene segmentation — `Scene`, `Word`, `Subject`, `SubjectCategory`, `SegmentationConfig`, etc.
**Flags:** None.

### types/style-matcher.ts
**Role:** Types for the **old** questionnaire-based style flow — `StyleQuestion`, `StyleOption`, `UserChoice`, `StylePrompt`, `StyleImage`.
**Flags:**
- These types belong to the old question-flow system which has been replaced by the gallery-based Style Selector. The only current consumer is `lib/styleMatcher.ts` (also dead — see below). **Dead type definitions** unless the questionnaire flow is revived.

### types/style-selector.ts
**Role:** Types for the current gallery-based Style Selector — `StyleSelection`, `FilterState`, `StyleSelectorContextValue`.
**Flags:** None.

### types/ui.ts
**Role:** Shared UI component types — `ButtonProps`, `TagProps`, `ModuleCardProps`.
**Flags:** `ModuleCardProps` references `ModuleStatus` from `core.ts` — but the actual `ModuleStatus` type (`'not-started' | 'in-progress' | 'completed'`) does NOT match the Kanban status system (`todo | up-next | in-progress | in-review | done`). This type is for a different component (`ModuleCard`, not `UniversalModuleCard`) and may refer to a deleted/never-built component.

---

## constants/ — Design tokens and static data (layer 2)

### constants/theme.ts
**Role:** Full neobrutalist design system — colors, typography, spacing, borderRadius, shadows.
**Flags:** None.

### constants/kanbanStatus.ts
**Role:** `KANBAN_STATUS` enum, `KANBAN_STATUS_ORDER`, `KANBAN_STATUS_CONFIG`.
**Flags:** None.

### constants/kanbanTheme.ts
**Role:** Kanban status colors, `MODULE_ORDER`, `MODULE_CONFIG`, kanban layout, animation constants, helper functions.
**Flags:**
- Declares its own `ModuleId = typeof MODULE_ORDER[number]` type at line 104, duplicating the `ModuleId` type from `types/core.ts`. **Naming inconsistency / type duplication.**

### constants/haptics.ts
**Role:** Unified haptic feedback wrappers.
**Flags:** None.

### constants/line.ts
**Role:** Line weight tokens and `LINE_WEIGHT` constant.
**Flags:** None.

### constants/pills.ts
**Role:** Pill size tokens — `small` and `big` geometries.
**Flags:** None.

### constants/sceneMapper.ts
**Role:** Thresholds, spring configs, timing, and colours for the scene-mapper gesture system.
**Flags:** None (frozen).

### constants/styles.ts
**Role:** Exports `STYLE_TAGS` array (12 style descriptors like 'Modern', 'Vintage', etc.) and `StyleTag` type.
**Flags:**
- **Dead code** — `STYLE_TAGS` and `StyleTag` are never imported or referenced anywhere in the codebase.

### constants/styleMatcherData.ts
**Role:** 2854 lines of hardcoded question/option data for the old questionnaire-based style flow.
**Flags:**
- This massive dataset is only consumed by `lib/styleMatcher.ts` (dead) and `lib/styleSelector.ts` (used by the current gallery system). The `lib/styleSelector.ts` uses it solely for its seeded tag-tally formula (`getCollageTags` iterates over these questions). If the gallery flag-per-collage mapping were replaced with a curated JSON map, this entire file could be deleted. Currently semi-dead — only 2% of its data value is used.

### constants/collageImages.ts
**Role:** Static `require()` map for all 686 collage images (709 lines).
**Flags:** None.

### constants/typography/ — directory
#### index.ts
**Role:** Barrel re-export of heading, normal, small.
**Flags:** None.

#### heading.ts, normal.ts, small.ts
**Role:** Base typography scale tokens (fontSize, fontWeight, lineHeight, letterSpacing).
**Flags:** None.

---

## lib/ — Domain logic and data access (layer 3)

### lib/database.ts
**Role:** Core DB layer — PowerSync queries, row mappers, card status derivation, project CRUD.
**Flags:**
- `parseCardStatuses` — single canonical declaration. No duplicate found here (good). The duplicate reported in FULL_SESSION_CONTEXT.md §16 Bug 2 must be in another file (if it still exists).
- `updateCardProgress()` — exported and used by hooks, but also has a local `cardStatus()` helper (line 221-223) that shadows the one at `lib/kanbanLogic.ts`. **Duplicate logic** — two `cardStatus()` implementations exist (one private here, one private in `hooks/useKanban.tsx`).

### lib/supabase.ts
**Role:** Supabase client singleton with anonymous auth + AsyncStorage session persistence.
**Flags:** None.

### lib/powersync.ts
**Role:** PowerSync database instance + SupabaseConnector (native).
**Flags:** None.

### lib/powersync.web.ts
**Role:** PowerSync database instance + SupabaseConnector (web — WASQLite).
**Flags:** None.

### lib/stageCallbacks.ts
**Role:** Mutable ref bridge for cross-route communication between work screens and stages board.
**Flags:** None.

### lib/sceneSegmentation.ts
**Role:** Pure scene segmentation utilities — `autoSegment`, `splitScene`, `mergeScenes`, `moveWords`, `generateId`, etc. (607 lines).
**Flags:** None.

### lib/arcAssembler.ts
**Role:** Pure parser utilities for Arc Assembler upstream data — `parseScenes`, `parseSubjectCategories`, `parseArcOutput`, `buildTagsPlaceholder`.
**Flags:** None.

### lib/exportPipeline.ts
**Role:** Pure function — converts `PipelineRow` to structured JSON export.
**Flags:** None.

### lib/kanbanActionPills.ts
**Role:** Pill label/color config per card status — `STAGE_CARD_PILL`, `FOOTER_PILL`, `PROJECT_CARD_PILLS`, with conditional "Finish" logic.
**Flags:** None.

### lib/kanbanLogic.ts
**Role:** Small pure helper functions — `getActiveColumnStatus`, `getPriorityItemInStatus`, `isSoleIncompleteCard`.
**Flags:** None.

### lib/navigationTabs.ts
**Role:** Generates breadcrumb `NavigationTab[]` for project context.
**Flags:** None.

### lib/styleMatcher.ts
**Role:** Business logic for the **old** questionnaire-based style flow — `isQuestionComplete`, `findFirstIncompleteQuestion`, `collectTags`, `generatePrompt` (105 lines).
**Flags:**
- **Dead code** — These functions implement the old multi-step questionnaire flow that has been replaced by the gallery-based Style Selector. No file in the current app imports from `lib/styleMatcher.ts`. The `constants/styleMatcherData.ts` data is consumed directly by `lib/styleSelector.ts` instead.

### lib/styleSelector.ts
**Role:** Pure logic for the gallery-based Style Selector — `getCollageTags`, `filterCollages`, `buildSelection`, `parseStyleSelection`.
**Flags:** None.

### lib/api/ — directory

#### lib/api/index.ts
**Role:** Barrel for the `api/` sub-directory.
**Flags:**
- **Dead barrel** — Not imported by any file in the main app. The `@/lib/api` import path is never used.

#### lib/api/supabase.ts
**Role:** **Second** Supabase client instance — creates its own `createClient` with `autoRefreshToken: false`, queries a `style_selections` table that does not exist in the current schema.
**Flags:**
- **Dead code** / **Duplicate** — The real Supabase client lives at `lib/supabase.ts`. This file creates a separate, differently configured client targeting a non-existent `style_selections` table. Its exports (`createStyleSelection`, `updateStyleSelection`, `getStyleSelectionsByClient`, `testSupabaseConnection`) are never used in the app. **File should be deleted.**

#### lib/api/n8n.ts
**Role:** N8N webhook client for AI style image generation — `generateStyleImages` with mock fallback.
**Flags:**
- **Dead code** — Not imported by any file in the main app. The `generateStyleImages` function is only re-exported from the dead `lib/api/index.ts` barrel. The current Style Selector uses local collage images, not AI-generated ones. **File should be deleted.**

---

## hooks/ — State management and context providers (layer 4)

### hooks/useKanban.tsx
**Role:** `KanbanProvider` + `useKanban` — watcher-based state for both Projects and Stages boards. Handles all card lifecycle mutations.
**Flags:**
- Has its own `cardStatus()` helper (line 54-59) that duplicates the private one in `lib/database.ts` (line 221-223). **Duplicate logic.**
- Has its own local `MODULE_ORDER` array (line 50) duplicating the one in `constants/kanbanTheme.ts`. **Duplicate constant.**
- `dispatch` in context value is a no-op (`() => {}`) — the `KanbanAction` type union in `types/kanban.ts` exists but is never dispatched. **Dead type-consumer mismatch.**

### hooks/useSyncStatus.ts
**Role:** Returns `'online' | 'offline'` by subscribing to PowerSync status via `registerListener`.
**Flags:** None.

### hooks/useArcAssembler.tsx
**Role:** `ArcAssemblerProvider` + `useArcAssembler` — loads upstream data, manages brief state, debounced DB save.
**Flags:** None.

### hooks/useEntityEditor.tsx
**Role:** Word-tap selection logic, naming state, fuzzy suggestions, category CRUD for Entity Editor.
**Flags:** None.

### hooks/useSceneSegmentation.tsx
**Role:** `SceneSegmentationProvider` + `useSceneSegmentation` — central state for scene segmentation context (scenes, subjects, categories, drag state). 427 lines.
**Flags:** None.

### hooks/useSplitGesture.ts
**Role:** Split-gesture state machine with SharedValues for UI-thread animation.
**Flags:** None.

### hooks/useStyleSelector.tsx
**Role:** `StyleSelectorProvider` + `useStyleSelector` — filter state, gallery selection, DB load/persist.
**Flags:** None.

---

## components/ — Presentation and interaction components (layer 5)

### components/ui/ — Primitives

#### ScreenLayout.tsx
**Role:** Universal screen wrapper with header, divider lines, content area, and footer.
**Flags:** None.

#### Button.tsx
**Role:** Multi-variant button (primary/secondary/action) with press animation and haptics.
**Flags:**
- Uses `Animated` from React Native's legacy API (not `react-native-reanimated`). The architecture spec (FULL_SESSION_CONTEXT.md §15) says "All animations: `react-native-reanimated` only". **Inconsistent animation library.** This is the only component still using the legacy `Animated` API.

#### FooterActions.tsx
**Role:** Back + Continue button bar with safe-area insets.
**Flags:** None.

#### NavigationHeader.tsx
**Role:** Tabbed breadcrumb header with progress badge and sync status dot.
**Flags:** None.

#### ConfirmModal.tsx
**Role:** Reusable confirmation dialog with dark overlay and two buttons.
**Flags:** None.

#### ActionPill.tsx
**Role:** Unified pressable pill for card actions matching `pillSizes.big`.
**Flags:** None.

#### Tag.tsx
**Role:** Interactive chip component with selection state animation (legacy `Animated` API).
**Flags:**
- Also uses legacy `Animated` API instead of `react-native-reanimated`. **Inconsistent animation library.**

#### Line.tsx
**Role:** Horizontal/vertical divider line with configurable weight and color.
**Flags:** None.

### components/ui/card/ — Card primitives

#### index.ts
**Role:** Barrel export for all card sub-components.
**Flags:** None.

#### UniversalModuleCard.tsx
**Role:** Composite neobrutalist card used by both Projects and Stages Kanban.
**Flags:** None.

#### CardContainer.tsx, CardHeader.tsx, CardContent.tsx, CardFooter.tsx, CardBadge.tsx, CardProgressBar.tsx, CardIdentityPill.tsx, CardDescriptionProgressRow.tsx, CardNotesSheet.tsx, useCardAnimation.ts
**Role:** Composable card building blocks.
**Flags:** None individually audited (all used by `UniversalModuleCard.tsx`).

### components/kanban/ — Kanban

#### index.ts
**Role:** Barrel export.
**Flags:** None.

#### KanbanBoard.tsx
**Role:** Horizontally paged scroll view with 88%-width snap columns.
**Flags:** None.

#### KanbanCard.tsx
**Role:** Item card with pill actions, export, delete modal, and navigation.
**Flags:** None.

#### KanbanColumn.tsx
**Role:** Single status column with colored pill header and card list.
**Flags:** None.

#### AddProjectButton.tsx
**Role:** Dashed "+" button at the bottom of To Do column.
**Flags:** None.

#### CreateProjectModal.tsx
**Role:** 3-input form for new project creation (Prospect Name, Post Name, Script).
**Flags:** None.

#### CardActionModal.tsx
**Role:** Modal with Export JSON / Delete / Cancel actions for a project card.
**Flags:**
- **Dead code** — Never imported or referenced by any file in the app. The actual project card (`KanbanCard.tsx`) uses `ConfirmModal` for delete and `Clipboard.setStringAsync` for export. `CardActionModal.tsx` is a superseded implementation. **File should be deleted.**

### components/arc-assembler/ — Arc Assembler sub-components

#### index.ts
**Role:** Barrel export for `CollageOverlay`, `SceneModePage`, `SubjectBriefPopup`, `SubjectHighlightText`, `SubjectModePage`.
**Flags:** Files not individually audited (contents not read), but barrel is imported by `app/arc-assembler/index.tsx`.

### components/style-selector/ — Style Selector

#### CollageImage.tsx
**Role:** Single collage thumbnail — square container, `resizeMode="contain"`, selected badge with checkmark.
**Flags:** None.

### components/scene-segmentation/scene-mapper/ — FROZEN

#### index.ts, DropZone.tsx, InterruptedCard.tsx, SceneHeader.tsx, SceneMapperCard.tsx, SwipeableWrapper.tsx, WordToken.tsx
**Role:** Seven gesture-driven scene editing components (split, merge, reorder).
**Flags:** None (frozen per architecture rules — DO NOT TOUCH).

### components/scene-segmentation/subject-mapper/
**Role:** Empty directory — no files.
**Flags:**
- **Dead directory** — Should be deleted. The subject mapping UI lives in `app/scene-segmentation/entity-editor.tsx`, not in a separate subject-mapper route.

---

## app/ — Routes and screen components (layer 6)

### app/_layout.tsx
**Role:** Root layout — wraps app in PowerSyncContext.Provider + GestureHandlerRootView + SafeAreaProvider.
**Flags:** None.

### app/_layout.web.tsx
**Role:** Web root layout — duplicates `_layout.tsx` with `powersync.web` import and additional `supabase.auth.signInAnonymously()` call.
**Flags:**
- Contains `supabase.auth.signInAnonymously()` call that is redundant with `getSupabaseToken()` in `lib/supabase.ts`. **Duplicate auth logic.** The native layout delegates auth to the connector.

### app/index.tsx
**Role:** Welcome screen — "Pipeline Copilot" title + "Get Started" CTA.
**Flags:** None.

### app/project.tsx
**Role:** Projects Kanban — outer board with all project cards.
**Flags:** None.

### app/stages.tsx
**Role:** Stages Kanban — inner board with 4 pipeline cards per project. Registers stageCallbacks.
**Flags:** None.

### app/arc-assembler/index.tsx
**Role:** Arc Assembler work screen — scene/subject mode toggle via horizontal swipe.
**Flags:** None.

### app/scene-segmentation/_layout.tsx
**Role:** Layout wrapper providing `SceneSegmentationProvider` context.
**Flags:** None.

### app/scene-segmentation/beat-butcher.tsx
**Role:** Beat Butcher — gesture-driven scene segmentation. Loads from DB on mount; saves on Continue.
**Flags:** None.

### app/scene-segmentation/entity-editor.tsx
**Role:** Entity Editor — word-tap to highlight, naming bar, subject profiles panel. 994 lines (largest file).
**Flags:** None.

### app/scene-segmentation/input.tsx
**Role:** Old script paste screen — collects script text and navigates to beat-butcher.tsx.
**Flags:**
- **NOT in main navigation flow per FULL_SESSION_CONTEXT.md §8.** Beat Butcher opens directly to `beat-butcher.tsx` which loads script from DB. `input.tsx` is a dead route superseded by the CreateProjectModal flow. **File should be deleted.**

### app/style-selector/_layout.tsx
**Role:** Bare Stack layout for style-selector routes.
**Flags:** None.

### app/style-selector/index.tsx
**Role:** Style Selector work screen — gallery grid + filter panel, swipe-to-go-back gesture.
**Flags:** None.

---

## Root / Misc — Config, scripts, stubs

### styles/ — directory (outside canonical layer order)

#### styles/index.ts, styles/common.ts
**Role:** Barrel and shared `StyleSheet.create()` definitions.
**Flags:**
- **Wrong layer placement** — The canonical order is `types/ → constants/ → lib/ → hooks/ → components/ → app/`. The `styles/` directory sits outside this order entirely. It duplicates token values already present in `constants/theme.ts`. Should be merged into `constants/` or deleted (its only non-trivial usage is `commonStyles.screen` in `ScreenLayout.tsx`).

### stubs/polyfill.js, stubs/powersync-react-native.js
**Role:** Polyfill stubs.
**Flags:** Not audited in detail (not source code).

### scripts/system-audit.mjs
**Role:** Automated codebase audit script — walks files, resolves imports, scores risk.
**Flags:** None (tooling, not runtime).

### constants/styleMatcherData.ts (2854 lines)
*(already covered above in constants/ section)*

---

## Summary: FILES TO DELETE

Files that have no role, are superseded by another file, or are entirely dead code:

| # | File | Reason |
|---|---|---|
| 1 | `app/scene-segmentation/input.tsx` | NOT in main flow; Beat Butcher opens directly; superseded by CreateProjectModal |
| 2 | `components/kanban/CardActionModal.tsx` | Never imported; superseded by inline export + ConfirmModal in `KanbanCard.tsx` |
| 3 | `lib/api/index.ts` | Dead barrel — never imported by any file |
| 4 | `lib/api/supabase.ts` | Duplicate Supabase client with wrong config (targets non-existent `style_selections` table) |
| 5 | `lib/api/n8n.ts` | Dead N8N webhook client — unused, Style Selector uses local images |
| 6 | `lib/styleMatcher.ts` | Dead logic for the old questionnaire flow — replaced by gallery-based selector |
| 7 | `constants/styles.ts` | Exports `STYLE_TAGS` and `StyleTag` — never imported anywhere |
| 8 | `components/scene-segmentation/subject-mapper/` | Empty directory — zero files |

---

## Summary: FILES TO MOVE

Files placed in the wrong layer according to `types/ → constants/ → lib/ → hooks/ → components/ → app/`:

| # | File | Current Layer | Should Be In | Reason |
|---|---|---|---|---|
| 1 | `styles/common.ts` | `styles/` (outside canonical order) | `constants/` | Contains only themed StyleSheet definitions that depend on and extend `constants/theme.ts`. The `styles/` directory is not in the canonical layer order. Merge into `constants/` as `constants/commonStyles.ts`. |
| 2 | `styles/index.ts` | `styles/` (outside canonical order) | `constants/` | Barrel for the above — follows the same path. |

---

## Additional Flags (non-move/non-delete)

| File | Flag | Detail |
|---|---|---|
| `types/navigation.ts` | Stale dead route references | `AppRoute` references `'/style-selector/[order]'`, `'/style-selector/results'`, `'/scene-segmentation/scene-mapper'`, `'/scene-segmentation/subject-mapper'` — none exist. |
| `types/core.ts` | Anticipatory dead code | `ModuleId` includes `voice-cloner`, `script-generator`, `video-renderer` — not yet built. |
| `types/kanban.ts` | Dead action types | `KanbanAction` union has `MARK_IN_REVIEW`, `MARK_DONE`, `FLAG_OUTDATED`, `CLEAR_OUTDATED` but `dispatch` in `useKanban.tsx` is a no-op. |
| `types/ui.ts` | Potentially stale type | `ModuleCardProps` references `ModuleStatus` (`'not-started'|'in-progress'|'completed'`) which does NOT match the Kanban status system. May reference a deleted component. |
| `constants/kanbanTheme.ts` | Duplicate type | Declares its own `ModuleId` type (line 104) duplicating `types/core.ts`. |
| `constants/styleMatcherData.ts` | Mostly dead data | 2854 lines, only ~2% of its data used (seeded tag formula in `lib/styleSelector.ts`). |
| `hooks/useKanban.tsx` | Duplicate logic | Local `cardStatus()` helper + local `MODULE_ORDER` array duplicate `lib/database.ts` and `constants/kanbanTheme.ts`. |
| `lib/database.ts` | Duplicate logic | Private `cardStatus()` at line 221 duplicates the one in `hooks/useKanban.tsx`. |
| `components/ui/Button.tsx` | Inconsistent animation | Uses legacy `Animated` API (not `react-native-reanimated` as required by architecture spec §15). |
| `components/ui/Tag.tsx` | Inconsistent animation | Uses legacy `Animated` API (not `react-native-reanimated`). |
| `app/_layout.web.tsx` | Duplicate auth logic | Has its own `supabase.auth.signInAnonymously()` call that duplicates the logic in `lib/supabase.ts::getSupabaseToken()`. |

---

## Totals

- **Files to delete:** 8 (including 1 empty directory)
- **Files to move:** 2 (plus their barrel/index)
- **Additional issues flagged:** 11 (dead types, inconsistent animations, duplicate logic, stale references)