# Scene Mapper — Status, Architecture & Improvement Roadmap

> **Last updated**: February 10, 2026  
> **Module**: `app/scene-segmentation/scene-mapper.tsx`  
> **Components**: `components/scene-segmentation/scene-mapper/`

---

## 1. What Happened — The Journey So Far

### Phase 1: Ghost Card Architecture (Failed)

The original split interaction used a **"Ghost Card"** pattern:

```
Long-press word → floating preview card materializes ABOVE the original
→ confirm/cancel buttons on the ghost card → tap to commit
```

This had **3 critical bugs**:

| Bug | Root Cause | Impact |
|-----|-----------|--------|
| Ghost card never appeared | `words.slice(splitWordIndex)` used the word's **data index** instead of its **array position**. When words are filtered/reordered, `word.index !== array[i]`. | Split looked "frozen" — nothing rendered |
| Frozen UI after dismiss | No fallback dismiss path if the ghost card didn't render. Once split state was set, user had no way to cancel. | App required force-close |
| Android crash on drag | `borderStyle: 'dashed'` crashes React Native on Android. Period. | Instant crash on Android devices |

All 3 were fixed, but the Ghost Card approach still felt **laggy and indirect** — a floating card with buttons isn't tactile enough for a gesture-driven editor.

### Phase 2: Interrupt & Drop Pattern (Current)

Complete rewrite to the **"Interrupt & Drop"** pattern:

```
Long-press word → interrupted card overlaps at 70% opacity
→ drag DOWN to separate the two halves visually
→ release above 20px → confirmed split
→ release below 20px → cancelled, snaps back
```

**Key architectural change**: Drag distance IS the confirmation. No buttons, no confirmation UI. The gesture communicates intent directly.

#### What was changed

| File | Action | Summary |
|------|--------|---------|
| `types/scene-mapper-gestures.ts` | **Rewritten** | `SplitState` now has `dragOffset` + `initialY`. `InterruptedCardProps` replaces `GhostCardProps`/`SplitIndicatorProps`. `WordTokenProps.onLongPress` now passes `(wordIndex, pageY)`. |
| `constants/sceneMapper.ts` | **Updated** | Removed all `GHOST_*` constants. Added `SPLIT_CONFIRM_THRESHOLD=20`, `INTERRUPTED_CARD_OPACITY=0.7`, `SPLIT_CONFIRM_DURATION=150`, `SPLIT_CANCEL_DURATION=150`. |
| `InterruptedCard.tsx` | **Created** | Replaces GhostCard. `position: absolute, top: 0`, translated by `dragOffset`. Handles Android dashed-border crash with solid fallback (thinner + muted color). |
| `SceneMapperCard.tsx` | **Rewritten** | Uses `findIndex` for correct array→data index mapping. Derives `topWords`/`bottomWords` from split point. Renders `InterruptedCard` inside the card's layout. |
| `WordToken.tsx` | **Rewritten** | Removed `onLayout` measurement. Captures `pageY` on `pressIn`, passes it to `onLongPress`. Simpler, no layout side-effects. |
| `scene-mapper.tsx` (screen) | **Rewritten** | Uses `PanResponder` on a transparent wrapper to track drag. `splitStateRef` avoids stale closures. Threshold check on release. |
| `GhostCard.tsx` | **Deleted** | — |
| `SplitIndicator.tsx` | **Deleted** | — |
| Barrel exports (3 files) | **Updated** | All stale references cleaned |

**Verification**: Zero compile errors. Zero stale references in source.

---

## 2. Current Architecture

### Component Tree

```
scene-mapper.tsx (Screen)                    ← Owns all state + PanResponder
  ├─ NavigationHeader
  ├─ Stats Bar (scene count, total duration)
  ├─ View + PanResponder.panHandlers         ← Captures vertical drag during split
  │   └─ ScrollView (scrollEnabled={!gestureActive})
  │       ├─ [DropZone]                      ← Reorder mode only
  │       ├─ SceneMapperCard                 ← Composite card
  │       │   ├─ SwipeableWrapper            ← Horizontal pan (merge)
  │       │   │   └─ Card View
  │       │   │       ├─ SceneHeader         ← Long-press pan (reorder)
  │       │   │       ├─ WordToken[]         ← Long-press Pressable (split)
  │       │   │       └─ InterruptedCard     ← Absolute overlay (split active)
  │       │   └─ Action backgrounds (merge labels)
  │       └─ [DropZone]                      ← After last card
  └─ FooterActions
```

### Gesture Hierarchy (Priority Order)

| Priority | Gesture | Trigger | Handler | Technology |
|----------|---------|---------|---------|------------|
| 1 | Split | Long-press word (300ms) | Screen via PanResponder | `Pressable` → `PanResponder` |
| 2 | Merge | Horizontal swipe on card | SwipeableWrapper | `react-native-gesture-handler` Pan |
| 3 | Reorder | Long-press header (500ms) | SceneHeader | `react-native-gesture-handler` Pan + `activateAfterLongPress` |

### State Flow

```
WordToken.onLongPress(wordIndex, pageY)
  → SceneMapperCard.handleWordLongPress (validates min-words)
    → Screen.handleSplitStart (sets SplitState with dragOffset=0)

PanResponder.onMove(dy)
  → Screen.handleSplitDrag (clamps to max(0, dy))
    → setSplitState({...prev, dragOffset})
      → SceneMapperCard receives splitState prop
        → InterruptedCard renders at translateY(dragOffset)

PanResponder.onRelease
  → Screen.handleSplitRelease
    → if dragOffset >= 20px: splitSceneAt(sceneId, wordIndex) → data update
    → else: setSplitState(null) → visual snap-back
```

### Data Layer

All scene data flows through `useSceneSegmentation` context:
- `splitSceneAt(sceneId, wordIndex)` — splits scene, reindexes all
- `mergeScenesById(id1, id2)` — combines words, removes duplicate
- `reorderSceneById(sceneId, newIndex)` — repositions scene in list

The lib layer (`lib/sceneSegmentation.ts`) handles pure functions: `splitScene`, `mergeScenes`, `reorderScenes`, `autoSegment`.

---

## 3. Known Issues & Gaps

### Critical (Likely to Cause Problems on Device)

#### 3A. PanResponder ↔ Long-Press Handoff May Fail

**Problem**: The split starts when `Pressable.onLongPress` fires (300ms hold). Then the user needs to drag down, which the `PanResponder` on the parent `View` must capture. But `PanResponder` uses `onMoveShouldSetPanResponder` — this races with `Pressable`'s own responder. If `Pressable` is still the active responder, `PanResponder` may never activate.

**Risk**: High — this is the most likely failure mode on a real device. Tested only for compile errors so far.

**Fix options**:
1. **Replace `Pressable` + `PanResponder` with a single Gesture Handler** — Use `react-native-gesture-handler`'s `LongPress` + `Pan` composed gesture on each WordToken
2. **Use `GestureDetector` at the card level** with a `LongPress` → `Pan` manual composition
3. **Move to a `Gesture.Manual()` handler** that detects long-press internally and transitions to pan

#### 3B. DropZone Uses `borderStyle: 'dashed'` on Android

**Problem**: [DropZone.tsx](components/scene-segmentation/scene-mapper/DropZone.tsx) line 67 uses `borderStyle: 'dashed'`. This is the exact same bug that crashed the Ghost Card on Android. The InterruptedCard was fixed, but DropZone was NOT.

**Fix**: Add the same Platform.OS === 'android' fallback used in InterruptedCard.

#### 3C. No Animated Cancel/Confirm Transitions

**Problem**: When split is released, the state simply clears — `setSplitState(null)`. The interrupted card vanishes instantly with no animation. Constants `SPLIT_CONFIRM_DURATION` and `SPLIT_CANCEL_DURATION` exist (150ms each) but aren't used anywhere.

**Effect**: Split confirm feels abrupt. Split cancel has no spring-back animation. Violates the "every gesture should feel physical" design principle.

**Fix**: Use `Animated.timing` or reanimated `withTiming`/`withSpring` to:
- **Cancel**: Animate `dragOffset` back to 0, then clear state
- **Confirm**: Animate opacity to 1.0, border to solid, brief pause, then commit data

### Medium Priority

#### 3D. PanResponder Recreated on Dependency Changes

**Problem**: The `useMemo` for `PanResponder.create()` has `[handleSplitDrag, handleSplitRelease]` as dependencies. `handleSplitRelease` depends on `splitSceneAt` which comes from context. If context value ref changes, the PanResponder is recreated, which can cause gesture tracking to break mid-drag.

**Fix**: Make handler refs truly stable by wrapping in `useRef` + `useEffect` pattern, or move to `useCallback` with empty deps and ref-based state access (already partially done with `splitStateRef` but `handleSplitRelease` still closes over `splitSceneAt`).

#### 3E. ScrollView Content Shifts During Split

**Problem**: When the InterruptedCard is positioned absolutely and translates downward, it doesn't push content below it. Other scene cards don't slide down to make room. This means the interrupted card may visually overlap the card beneath it.

**Fix options**:
1. Add a spacer `View` with height equal to `dragOffset` beneath the card being split
2. Or accept the overlap as intentional (simpler, still functional)

#### 3F. No "Tap Outside to Cancel" for Split

**Problem**: PROMPT.MD specifies "Tap anywhere outside the card while split is active → cancels immediately." Currently the only cancel path is releasing the finger below the 20px threshold.

**Fix**: Add an `onTouchStart` handler on the ScrollView (or a transparent overlay) that calls `handleSplitRelease()` when `splitState !== null` and the touch is outside the active card.

### Low Priority / Polish

#### 3G. No Visual Feedback During Drag

**Problem**: As the user drags the interrupted card down, there's no progressive visual feedback — no color change, no opacity shift, no threshold indicator. The card is always at 70% opacity with a dashed border, regardless of drag distance.

**Spec says**: Opacity should go from 0.7 → 1.0 as drag approaches threshold. Border should transition from dashed → solid at threshold.

#### 3H. No Insert Scene Gesture

**Problem**: PROMPT.MD lists "Insert new scenes" as a core objective. The hook exposes `insertSceneAfter()` and `insertSceneAtIndex()`. But there's no UI trigger for it on the Scene Mapper screen.

**Fix**: Add an "insert scene" button between cards, or a FAB, or a gesture.

#### 3I. Merge Direction Labels Are Swapped

**Problem**: In `SceneMapperCard`, swipe **left** calls `onMergeWithPrevious` and swipe **right** calls `onMergeWithNext`. But in `SwipeableWrapper`, swiping right reveals the **left** action background labeled "Merge next". This may confuse the mapping — verify that "swipe right reveals left bg" is actually correct (it reveals the content that was hidden on the left side of the card).

#### 3J. Words Don't Re-index After Split

**Problem**: When `splitSceneAt` runs in `useSceneSegmentation`, it calls `splitScene(scene, wordIndex)` from `lib/sceneSegmentation.ts`. Need to verify that words in the new (second) scene get their `word.index` values reset to start from 0, since `findIndex(w => w.index === splitWordIndex)` in SceneMapperCard depends on word indices being unique within each scene.

---

## 4. Improvement Roadmap

### Sprint 1: Make It Actually Work (Device Testing)

- [ ] **Fix 3A**: Replace Pressable + PanResponder with `Gesture.LongPress().simultaneousWithExternalGesture(Gesture.Pan())` or use `Gesture.Race()`
- [ ] **Fix 3B**: Add Android dashed-border fallback to DropZone
- [ ] **Test on Android + iOS device** — verify all 3 gestures work

### Sprint 2: Make It Feel Right (Animations)

- [ ] **Fix 3C**: Animate split cancel (spring dragOffset→0) and confirm (opacity→1, pause, commit)
- [ ] **Fix 3G**: Progressive visual feedback during drag (opacity gradient, threshold indicator)
- [ ] **Fix 3E**: Add spacer View that grows with dragOffset to push cards below
- [ ] **Stagger animations** on merge confirm and split confirm (cards cascade with 50ms delays)

### Sprint 3: Make It Complete (Missing Features)

- [ ] **Fix 3F**: Tap-outside-to-cancel for split
- [ ] **Fix 3H**: Add insert-scene UI trigger
- [ ] **Fix 3I**: Audit merge direction labels vs actual behavior
- [ ] **Fix 3J**: Verify word re-indexing after split in lib layer
- [ ] **Fix 3D**: Stabilize PanResponder handler references

### Sprint 4: Polish & Delight

- [ ] Haptic feedback tuning (different intensity for threshold approach vs cross)
- [ ] Card elevation shadow increases during drag
- [ ] Scene count badge animates when scenes split/merge
- [ ] Undo support (keep last N operations in a stack)

---

## 5. File Reference

| File | Lines | Purpose |
|------|-------|---------|
| `types/scene-mapper-gestures.ts` | 209 | All types for gesture system |
| `constants/sceneMapper.ts` | 131 | All numeric constants |
| `app/scene-segmentation/scene-mapper.tsx` | 481 | Main screen, owns state + PanResponder |
| `components/.../SceneMapperCard.tsx` | 180 | Composite card with InterruptedCard |
| `components/.../InterruptedCard.tsx` | 169 | Absolute overlay during split |
| `components/.../WordToken.tsx` | 80 | Atomic word with long-press |
| `components/.../SwipeableWrapper.tsx` | 243 | Swipe merge via gesture-handler |
| `components/.../SceneHeader.tsx` | 144 | Scene badge + reorder drag |
| `components/.../DropZone.tsx` | 98 | Reorder drop targets |
| `hooks/useSceneSegmentation.tsx` | 351 | Context + state management |
| `lib/sceneSegmentation.ts` | 551 | Pure functions for scene operations |

---

## 6. Quick Architectural Decisions Log

| Decision | Rationale | Date |
|----------|-----------|------|
| PanResponder over gesture-handler for split drag | Needed to capture drag after Pressable's long-press fires. PanResponder can intercept on Move. May need revisiting if handoff fails. | Feb 2026 |
| 20px confirm threshold (down from 60px in spec) | 60px felt too far in testing discussions. 20px keeps it quick. | Feb 2026 |
| No SVG anywhere | Performance. SVG re-renders on every frame during drag. Transform-only GPU updates instead. | Feb 2026 |
| Android dashed-border solid fallback | `borderStyle: 'dashed'` crashes Android RN. Thinner + muted solid border as visual cue. | Feb 2026 |
| useRef for splitState in PanResponder | PanResponder.create captures closures at creation time. useRef provides current value without recreation. | Feb 2026 |
| InterruptedCard uses `position: absolute` | Overlaps the original card exactly at dragOffset=0. translateY separates them. No layout shifts on siblings. | Feb 2026 |
