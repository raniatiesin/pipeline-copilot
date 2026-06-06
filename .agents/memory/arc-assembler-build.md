---
name: Arc Assembler build — Stage 3A
description: Architecture decisions and patterns for the Arc Assembler module (app/arc-assembler/index.tsx).
---

## Data flow
- All upstream data (scenes, subjects, style) read from local SQLite via `watchProject(projectId)` — single read on mount (break after first emission), same as `useStyleSelector`.
- `arc_assembler_output` column holds `{ sceneBriefs: Record<sceneId,string>, subjectBriefs: Record<categoryId,string> }`.
- Debounced 800ms write on every brief edit. `confirmAndSave()` flushes immediately + calls `stageCallbacks.markInReview('arc-assembler')`.

## Route param fix
`stages.tsx` must pass `projectId` as a route param to `/arc-assembler/`. The original push had no params — this was fixed as part of Stage 3A.

## JSX apostrophe gotcha
Unescaped apostrophes inside JSX string literals cause TS1005/1381 errors. Use `\u2019` (curly apostrophe) or double-quote the string.

## Mode-switching scroll coordination
- Horizontal `ScrollView` (pagingEnabled) handles native swipe — `onMomentumScrollEnd` updates `mode` state.
- ModeIndicator tabs call `setMode` + `scrollRef.current.scrollTo()` for programmatic switch.
- No `useEffect` watching `mode` (avoids loop). The two code paths (tab tap vs. user swipe) are mutually exclusive by design.

## SubjectBriefPopup navigation
SubjectBriefPopup has an `onNavigateToSubject(categoryId)` callback. The hook's `navigateToSubject()` sets both the subject index and mode state. The screen's `handleNavigateToSubject` calls `scrollRef.current.scrollTo({ x: width })` to reveal Subject Mode.

## Subject highlight rendering
`SubjectHighlightText` uses `View flexDirection:row flexWrap:wrap` (not nested Text) to allow `TouchableOpacity` wrappers. Consecutive words in the same subject are grouped into one tappable span via `buildSegments()`.

## Drag-to-insert mechanic (Scene Mode)
- Each subject span uses `Gesture.Exclusive(Pan.activateAfterLongPress(300), Tap)` from RNGH v2.
- `dragX` / `dragY` are `useSharedValue` — updated directly on UI thread inside `.onChange`, no `runOnJS` needed for smooth animation.
- `onDragStart`, `onDragEnd`, `onDragCancel` are JS-thread callbacks (`runOnJS`) that update React state.
- `DragGhost` is an `Animated.View` rendered outside the ScrollView (inside root View), positioned via `useAnimatedStyle` reading `dragX`/`dragY`.
- TextInput bounds measured via `.measure()` (absolute screen coords) on layout + re-measured on drag start.
- Cursor position tracked via `onSelectionChange` → `selectionRef`. Insert at cursor with space-separator logic.
- Subject tap (short press) is a no-op in drag mode (Tap gesture wins via Exclusive when hold < 300ms).
- ScrollView is disabled (`scrollEnabled={!draggingCategoryId}`) during active drag to prevent accidental scroll.

## Files created
- `types/arc-assembler.ts`
- `lib/arcAssembler.ts` (pure: parseScenes, parseSubjectCategories, parseArcOutput, buildTagsPlaceholder, getSceneIndicesForCategory)
- `hooks/useArcAssembler.tsx`
- `components/arc-assembler/SubjectHighlightText.tsx`
- `components/arc-assembler/SubjectBriefPopup.tsx`
- `components/arc-assembler/CollageOverlay.tsx`
- `components/arc-assembler/SceneModePage.tsx`
- `components/arc-assembler/SubjectModePage.tsx`
- `components/arc-assembler/index.ts`
- `app/arc-assembler/index.tsx` (full rewrite of skeleton)
