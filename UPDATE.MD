# MEGA PROMPT: Scene Mapper Zipper Redesign — Ghost Card Architecture

## Executive Summary

**Problem**: Current zipper implementation is laggy due to:
- Continuous SVG rendering (rubber band threads)
- Complex overlay calculations every frame
- Multiple simultaneous animations
- Tight coupling between gesture state and visual rendering

**Solution**: Replace the gap-opening zipper with a **Ghost Card** pattern:
- Long-press word → **Ghost card appears ABOVE** with split-off text
- Ghost card has **dashed borders** (incomplete/preview state)
- Drag to adjust → **Ghost card updates instantly** (no smooth animations during drag)
- Tap to confirm → **Borders become solid**, card becomes real
- Simple, modular, performant, intuitive

---

## Core Conceptual Model

### The Mental Model for Users

**Current (laggy) model**: "I'm unzipping the card like a zipper"
- Problem: Complex metaphor, requires continuous visual feedback (rubber bands stretching)

**New model**: "I'm pulling out a new card from the existing one"
- Simpler: Card duplication is familiar (copy/paste)
- Preview: I see exactly what the new card will contain
- Confirmation: Dashed → Solid is clear "temporary → permanent" signal

### The Object Hierarchy

```
SCENE MAPPER (Container)
│
├─── SCENE CARDS (Array)
│    │
│    ├─── SCENE CARD (Normal State)
│    │    ├─── Header (Scene badge, drag handle)
│    │    ├─── Text Container
│    │    │    └─── Word Tokens (array)
│    │    └─── Gesture Layer (swipe wrapper)
│    │
│    └─── SCENE CARD (Split-Active State)
│         ├─── Header
│         ├─── GHOST CARD (new, floating above)
│         │    ├─── Ghost Header (dashed borders)
│         │    ├─── Ghost Text (words that will split off)
│         │    └─── Confirm Button
│         ├─── Text Container (words that will remain)
│         └─── Split Indicator Line (shows split point)
│
└─── INSERT BUTTONS (Between cards)
```

---

## Architectural Principles

### 1. **Separation of State and Visuals**

**State Layer** (Truth):
```
SceneMapperState {
  scenes: Scene[]           // Permanent data
  
  splitState: {             // Temporary interaction state
    sceneId: string         // Which scene is being split
    splitWordIndex: number  // Where the split will occur
    
    // Derived data (computed from above):
    topWords: string[]      // Words staying in original card
    bottomWords: string[]   // Words going to new card (ghost)
  } | null
}
```

**Visual Layer** (Representation):
```
SceneCard (renders based on state)
  ↓
  If splitState && splitState.sceneId === thisSceneId:
    Render with GhostCard
  Else:
    Render normal
```

**Key principle**: State describes WHAT, visuals describe HOW to display it.

### 2. **Component Modularity**

Each component has ONE responsibility:

| Component | Single Responsibility | Inputs | Outputs |
|-----------|----------------------|---------|---------|
| `SceneMapper` | Owns all state, coordinates everything | scenes[], splitState | Rendered list |
| `SceneCard` | Displays one scene (normal or split mode) | scene, splitState, handlers | Visual card |
| `GhostCard` | Shows preview of future scene | words[], onConfirm, onCancel | Floating preview |
| `WordToken` | Detects long-press on single word | word, index, onLongPress | Touch event |
| `SplitIndicator` | Shows split line position | wordIndex, wordPositions | Visual line |
| `SwipeWrapper` | Handles swipe-to-merge | canSwipe, onSwipe | Wrapped content |

### 3. **Interaction Boundaries**

**No component directly manipulates another component's state.**

Flow pattern:
```
User gesture → Component detects → Emits event → Parent updates state → Re-render
```

Example:
```
WordToken (detects long-press)
  ↓ emits: onLongPress(wordIndex, position)
SceneCard (receives event)
  ↓ emits: onSplitStart(sceneId, wordIndex)
SceneMapper (receives event)
  ↓ updates: splitState = { sceneId, splitWordIndex }
  ↓ re-renders all children with new state
GhostCard (receives splitState via props)
  ↓ renders: Ghost card with bottomWords
```

### 4. **Performance Isolation**

**What should NOT trigger re-renders**:
- Dragging finger position (should update position ONLY, not state)
- Word highlighting (visual only, no state change)
- Split line position (computed from wordIndex, not stored)

**What SHOULD trigger re-renders**:
- Split initiated (splitState goes null → { sceneId, wordIndex })
- Split position changed (wordIndex updates)
- Split confirmed (scenes array updates, splitState goes null)
- Split cancelled (splitState goes null)

**Optimization strategy**: Use `React.memo` on components that receive same props frequently.

---

## The Ghost Card Pattern — Detailed Specification

### Visual States

**STATE 1: Normal (No Split Active)**
```
┌─ Scene 2 ────────────────────┐
│ ≡ Scene 2                    │  Header
│                              │
│ The dog runs across the      │  Text (all words)
│ bright green field quickly.  │
└──────────────────────────────┘
```

**STATE 2: Split Initiated (Ghost Appears)**
```
     ╔═ Scene 3 ═══════════════╗  ← GHOST CARD (dashed borders)
     ║ ┈ Scene 3 ┈              ║    Floats above, slightly offset
     ║                          ║
     ║ across the bright green  ║    Contains split-off words
     ║ field quickly.           ║
     ║                          ║
     ║      [Confirm Split]     ║    Confirm button inside ghost
     ╚══════════════════════════╝
           ↓ (dashed connecting line)
┌─ Scene 2 ────────────────────┐
│ ≡ Scene 2                    │
│                              │
│ The dog runs |               │  ← Split line shows division
│                              │     Words after line are dimmed
└──────────────────────────────┘
```

**STATE 3: Split Confirmed (Ghost Becomes Real)**
```
┌─ Scene 2 ────────────────────┐
│ ≡ Scene 2                    │  Original card (reduced content)
│                              │
│ The dog runs                 │  Only kept words
└──────────────────────────────┘
     ↓ (spring animation)
┌─ Scene 3 ────────────────────┐  ← Former ghost, now solid
│ ≡ Scene 3                    │     Borders become solid
│                              │
│ across the bright green      │
│ field quickly.               │
└──────────────────────────────┘
```

### Component Relationships

#### GhostCard Component

**Purpose**: Preview the new scene that will be created

**Visual Properties**:
```
Container:
  - Position: absolute
  - Top offset: -120px (floats above parent card)
  - Left offset: 8px (slightly indented)
  - Right offset: 8px
  - Z-index: 100 (appears above everything)
  
Border:
  - Width: 2px
  - Style: dashed
  - Color: #3B82F6 (blue)
  - Dash pattern: 4px dash, 4px gap
  - Border radius: 12px (same as normal cards)
  
Shadow:
  - Shadow opacity: 0.2
  - Shadow radius: 8px
  - Shadow offset: Y=4px
  - Gives floating appearance
  
Background:
  - White (same as normal cards)
  - Opacity: 0.98 (very slight transparency)
```

**Content**:
```
Header (Ghost):
  - "┈ Scene [N] ┈" (dashed lines around number)
  - Center aligned
  - Lighter gray color (#9CA3AF)
  - Font size: 12px
  - No drag handle (not interactive yet)

Text:
  - Words that will be in new scene
  - Same styling as normal scene text
  - Flowing layout (word tokens)

Confirm Button:
  - Position: Bottom of ghost card
  - Full width, 44px tall
  - Background: #3B82F6 (blue)
  - Text: "Confirm Split" (white, centered)
  - Border radius: 8px
  - Tap target: 44x44 minimum
```

**Interactions**:
```
User can:
  ✓ Tap confirm button → Confirms split
  ✓ Tap anywhere outside ghost → Cancels split
  ✗ Cannot drag ghost (it's just a preview)
  ✗ Cannot edit text in ghost
```

**Data Flow**:
```
GhostCard receives:
  - words: string[] (text to display)
  - sceneNumber: number (what number to show in header)
  - onConfirm: () => void (callback when confirmed)
  - onCancel: () => void (callback when cancelled)

GhostCard emits:
  - onConfirm() when button tapped
  - onCancel() when tapped outside
```

#### SplitIndicator Component

**Purpose**: Show exactly where the split will occur in the original card

**Visual Properties**:
```
Vertical Line:
  - Width: 2px
  - Height: Full text container height
  - Color: #3B82F6 (blue)
  - Style: solid
  - Position: Absolute, positioned between words
  - Z-index: 10 (above text, below ghost)
```

**Positioning Logic**:
```
The line appears BEFORE the word at splitWordIndex.

Example:
  Words: ["The", "dog", "runs", "across", "the", "field"]
  splitWordIndex: 3
  
  Line appears before "across" (index 3)
  
  Visual:
    The dog runs | across the field
                ↑
            line here
```

**How It Knows Where to Render**:
```
Process:
  1. SceneCard measures all word positions on layout
  2. Stores: wordPositions = [{ x, y, width, height }, ...]
  3. SplitIndicator receives: splitWordIndex, wordPositions
  4. Calculates: position = wordPositions[splitWordIndex].x
  5. Renders line at that X position
```

**Data Flow**:
```
SplitIndicator receives:
  - splitWordIndex: number
  - wordPositions: Array<{x, y, width, height}>
  - containerHeight: number

SplitIndicator computes:
  - lineX = wordPositions[splitWordIndex]?.x ?? 0
  - lineY = 0
  - lineHeight = containerHeight

SplitIndicator renders:
  - Vertical line at computed position
```

#### Original Card (Split Mode)

**Visual Changes**:
```
Text Rendering:
  - Words BEFORE split line: Normal appearance
  - Words AFTER split line: Dimmed (opacity: 0.4)
  
  This shows "these words are leaving"

Border:
  - No change (stays solid)
  - Maintains normal appearance

Gestures:
  - Swipe disabled while split active
  - Reorder disabled while split active
  - Only split-related interactions allowed
```

**Layout Coordination**:
```
┌─────────────────────────────────┐
│  SceneCard Container            │
│  (position: relative)           │
│                                 │
│  ┌─────────────────────────┐   │
│  │ GhostCard               │   │  ← Positioned absolute
│  │ (top: -120px)           │   │     Extends above container
│  └─────────────────────────┘   │
│                                 │
│  ┌─────────────────────────┐   │
│  │ Text Container          │   │
│  │   Words before line     │   │
│  │   |  ← Split line       │   │  ← Positioned absolute
│  │   Words after (dimmed)  │   │
│  └─────────────────────────┘   │
└─────────────────────────────────┘
```

---

## Interaction Flows — State Machines

### Flow 1: Initiate Split

```
USER ACTION: Long-press word "across" (index 3)

WordToken:
  - Detects long press (300ms)
  - Measures position: measureInWindow()
  - Emits: onLongPress(3, {x: 150, y: 200})
    ↓
SceneCard:
  - Receives: onLongPress(wordIndex, position)
  - Emits: onSplitStart(sceneId: "scene-2", wordIndex: 3)
    ↓
SceneMapper:
  - Receives: onSplitStart(sceneId, wordIndex)
  - Updates state:
      splitState = {
        sceneId: "scene-2",
        splitWordIndex: 3,
        topWords: ["The", "dog", "runs"],
        bottomWords: ["across", "the", "bright", "green", "field", "quickly"]
      }
  - Fires haptic: Light impact
  - Re-renders
    ↓
SceneCard (re-render):
  - Receives: splitState (not null)
  - Checks: splitState.sceneId === this.sceneId? YES
  - Renders in split mode:
      1. Renders GhostCard (with bottomWords)
      2. Renders SplitIndicator (at wordIndex 3)
      3. Dims words after split line
    ↓
VISUAL RESULT:
  Ghost card appears above
  Split line appears at index 3
  Words after line are dimmed
```

### Flow 2: Adjust Split Position

```
USER ACTION: Drags finger left while split is active

WordToken (under finger):
  - Detects: onPressMove event
  - Determines: word index = 2 ("runs")
  - Emits: onSplitMove(2)
    ↓
SceneCard:
  - Receives: onSplitMove(wordIndex)
  - Emits: onSplitAdjust(sceneId, wordIndex: 2)
    ↓
SceneMapper:
  - Receives: onSplitAdjust(sceneId, newWordIndex)
  - Updates state:
      splitState.splitWordIndex = 2
      splitState.topWords = ["The", "dog"]
      splitState.bottomWords = ["runs", "across", "the", ...]
  - Re-renders (only affected components)
    ↓
GhostCard (re-render):
  - Receives: new bottomWords
  - Updates text display instantly
  - NO ANIMATION (just updates content)
    ↓
SplitIndicator (re-render):
  - Receives: new splitWordIndex = 2
  - Calculates: new position
  - Jumps to new position (NO ANIMATION)
    ↓
VISUAL RESULT:
  Ghost card text updates
  Split line jumps to new position
  Dimming updates to new word set
  
PERFORMANCE NOTE:
  - No smooth transitions = no animation overhead
  - Instant updates = 60fps easy
  - User sees immediate feedback
```

### Flow 3: Confirm Split

```
USER ACTION: Taps "Confirm Split" button in ghost card

GhostCard:
  - Detects: Button tap
  - Emits: onConfirm()
    ↓
SceneCard:
  - Receives: onConfirm()
  - Emits: onSplitConfirm(sceneId)
    ↓
SceneMapper:
  - Receives: onSplitConfirm(sceneId)
  - Calls data layer:
      newScenes = splitSceneAtWord(
        sceneId: "scene-2",
        wordIndex: 3
      )
  - Updates state:
      scenes = newScenes  // scene-2 now split into scene-2 and scene-3
      splitState = null    // Clear split state
  - Fires haptic: Medium impact
  - Triggers animation sequence
  - Re-renders
    ↓
ANIMATION SEQUENCE:
  1. GhostCard border: Dashed → Solid (200ms)
  2. GhostCard position: Current → Final position (300ms spring)
  3. Original card: Updates to show only topWords
  4. Cards below: Shift down (300ms spring, all together)
    ↓
VISUAL RESULT:
  Ghost becomes real Scene 3
  Original card shrinks to topWords only
  All scenes below shift down
  Scene numbers update
```

### Flow 4: Cancel Split

```
USER ACTION: Taps anywhere outside ghost card

SceneCard:
  - Detects: Tap on background
  - Emits: onSplitCancel(sceneId)
    ↓
SceneMapper:
  - Receives: onSplitCancel(sceneId)
  - Updates state:
      splitState = null
  - Fires haptic: Light impact
  - Re-renders
    ↓
SceneCard (re-render):
  - Receives: splitState = null
  - Renders in normal mode:
      1. GhostCard removed
      2. SplitIndicator removed
      3. All words normal opacity
    ↓
ANIMATION SEQUENCE:
  1. GhostCard fades out (150ms)
  2. SplitIndicator fades out (150ms)
  3. Dimmed words return to normal (150ms)
    ↓
VISUAL RESULT:
  Back to normal state
  No data changed
```

---

## Performance Architecture

### What Makes This Fast

**1. Minimal Continuous Rendering**:
```
OLD (laggy):
  - Every frame during drag:
    - Calculate rubber band curves (5 SVG paths)
    - Update gap size
    - Recalculate thread tension
    - Update confirmation badge position
    - Animate other cards shifting
  - Result: ~100 calculations per second

NEW (fast):
  - Only on state change (discrete events):
    - Update splitWordIndex (1 number)
    - Re-render affected components (memoized)
    - No calculations between changes
  - Result: ~5 calculations per second
```

**2. Component Memoization Strategy**:
```
Components that should memo:
  ✓ WordToken (re-renders only if word or highlight state changes)
  ✓ GhostCard (re-renders only if words array changes)
  ✓ SplitIndicator (re-renders only if wordIndex changes)
  ✓ SceneCard (re-renders only if scene data or splitState changes)

Components that should NOT memo:
  ✗ SceneMapper (parent, owns state, always re-renders)

Memoization implementation:
  export const WordToken = React.memo(({ word, isHighlighted, ... }) => {
    // Render logic
  }, (prevProps, nextProps) => {
    // Custom comparison
    return prevProps.word === nextProps.word &&
           prevProps.isHighlighted === nextProps.isHighlighted
  })
```

**3. Layout Measurement Caching**:
```
Problem:
  Measuring word positions is expensive if done every render

Solution:
  Measure once on layout, cache results

Implementation concept:
  SceneCard state:
    wordPositions: Array<{x, y, width, height}> | null
  
  On mount/layout:
    Each WordToken calls onLayout
    SceneCard collects positions
    Stores in local state
    
  On split:
    Uses cached positions
    No re-measurement needed
    
  On scene text change:
    Invalidates cache
    Re-measures on next layout
```

**4. Animation Optimization**:
```
Use Animated.Value for performance-critical animations:

Fast (runs on native thread):
  - GhostCard position (transform)
  - Card opacity (fade in/out)
  - Scale transforms

Acceptable (runs on JS thread, but infrequent):
  - Border style change (dashed → solid)
  - Text content updates
  - Scene number changes

Avoid:
  - Animated SVG (too expensive)
  - Animated borders with dashes (recalculates every frame)
  - Continuous calculations during drag
```

### Memory Management

**1. Cleanup on Unmount**:
```
Every component with Animated.Value must:
  - Store refs to all Animated.Values
  - Clean up on unmount:
      useEffect(() => {
        return () => {
          // Cleanup
          animatedValue.removeAllListeners()
        }
      }, [])
```

**2. Event Listener Management**:
```
Problem:
  PanResponders can leak if not cleaned up

Solution:
  Create PanResponder in useRef
  Never recreate unless dependencies change
  Clean up in useEffect return

Pattern:
  const panResponder = useRef(
    PanResponder.create({ ... })
  ).current
  
  // PanResponder stays stable across re-renders
```

**3. State Size Management**:
```
Keep splitState minimal:
  ✓ Store: sceneId, splitWordIndex
  ✓ Compute on demand: topWords, bottomWords (derived from scenes + splitWordIndex)
  ✗ Don't store: word positions, ghost card position, visual states

Why:
  - Smaller state = faster updates
  - Derived data doesn't need to stay in sync
  - Computed properties prevent stale data bugs
```

---

## Modular Update Strategy

### Migration Path from Current Implementation

**Phase 1: Add Ghost Card (Keep Old Zipper)**
```
Goal: Introduce ghost card alongside existing system

Changes:
  1. Create GhostCard component
  2. Create SplitIndicator component
  3. Add ghost rendering to SceneCard (conditional)
  4. Keep all existing zipper code intact

Testing:
  - Verify ghost appears correctly
  - Verify split line positions correctly
  - Verify word dimming works
  
No deletions yet - both systems coexist
```

**Phase 2: Switch Gesture Detection**
```
Goal: Use ghost card system, remove zipper visuals

Changes:
  1. Remove ZipperOverlay component from render
  2. Remove RubberBandThreads component
  3. Keep gap opening logic but use for ghost positioning
  4. Test ghost card with existing gesture detection

Testing:
  - Verify no visual glitches
  - Verify performance improvement
  - Verify all interactions still work
```

**Phase 3: Simplify Animations**
```
Goal: Remove expensive animations

Changes:
  1. Remove thread animations
  2. Remove gap smooth animations
  3. Change split line to instant position updates
  4. Change ghost content to instant updates

Testing:
  - Measure FPS (should be 60fps constant)
  - Verify interactions feel responsive
  - Check for any jank
```

**Phase 4: Clean Up Dead Code**
```
Goal: Remove old zipper system entirely

Deletions:
  - ZipperOverlay.tsx
  - RubberBandThreads.tsx
  - ConfirmationBadge.tsx (if separate component)
  - Any gap-opening animation logic

Simplifications:
  - Remove gap size from splitState
  - Remove thread tension calculations
  - Remove complex pan gesture logic

Testing:
  - Ensure no references to deleted components
  - Verify build succeeds
  - Test all gesture flows end-to-end
```

### Component Dependency Map

```
BEFORE (Complex Dependencies):

SceneMapper
  ↓ owns
  ├─ scenes: Scene[]
  └─ splitState: { sceneId, wordIndex, gapSize, threadTension, ... }
       ↓ feeds into
       ZipperOverlay
         ↓ creates
         ├─ RubberBandThreads (depends on gapSize, threadTension)
         ├─ ConfirmationBadge (depends on gapSize >= threshold)
         └─ TopPart/BottomPart (depends on word splitting logic)
              ↓ creates
              WordToken[] (many instances)

Problem: Changes ripple through many layers


AFTER (Clean Dependencies):

SceneMapper
  ↓ owns
  ├─ scenes: Scene[]
  └─ splitState: { sceneId, wordIndex } ← Minimal!
       ↓ feeds into
       SceneCard
         ↓ computes
         ├─ topWords = scene.words.slice(0, wordIndex)
         ├─ bottomWords = scene.words.slice(wordIndex)
         └─ renders
            ├─ GhostCard (receives bottomWords)
            ├─ SplitIndicator (receives wordIndex)
            └─ WordToken[] (receives isHighlighted)

Benefit: Each component has ONE clear input
```

### Interface Contracts

**WordToken Contract**:
```
Input:
  - word: string (required)
  - index: number (required)
  - sceneId: string (required)
  - isHighlighted: boolean (default: false)
  - onLongPress: (index, position) => void (required)

Output:
  - onLongPress event when held 300ms
  - Measured position via callback

Guarantees:
  - Always provides accurate position when pressed
  - Never triggers for presses shorter than 300ms
  - Provides minimum 44x44 touch target

Dependencies:
  - None (pure component)
```

**GhostCard Contract**:
```
Input:
  - words: string[] (required)
  - sceneNumber: number (required)
  - onConfirm: () => void (required)
  - onCancel: () => void (required)

Output:
  - onConfirm when confirm button tapped
  - onCancel when background tapped

Guarantees:
  - Always renders above parent (absolute positioning)
  - Confirm button always 44px tall (accessibility)
  - Dashed borders clearly indicate preview state

Dependencies:
  - None (pure component)
```

**SplitIndicator Contract**:
```
Input:
  - splitWordIndex: number (required)
  - wordPositions: Array<{x, y, width, height}> (required)
  - containerHeight: number (required)

Output:
  - Visual vertical line at computed position

Guarantees:
  - Line positioned before word at splitWordIndex
  - Height matches container
  - Updates instantly (no animation)

Dependencies:
  - None (pure component)
```

**SceneCard Contract**:
```
Input:
  - scene: Scene (required)
  - splitState: SplitState | null (required)
  - isFirst: boolean (required)
  - isLast: boolean (required)
  - onSplitStart: (sceneId, wordIndex) => void
  - onSplitAdjust: (sceneId, wordIndex) => void
  - onSplitConfirm: (sceneId) => void
  - onSplitCancel: (sceneId) => void
  - onMergePrev: (sceneId) => void
  - onMergeNext: (sceneId) => void

Output:
  - Events for all user interactions

Guarantees:
  - Renders correctly in both normal and split mode
  - Disables swipe when split active
  - Provides all necessary callbacks to children

Dependencies:
  - WordToken (child)
  - GhostCard (conditional child)
  - SplitIndicator (conditional child)
  - SwipeWrapper (wrapper)
```

---

## Testing Strategy

### Unit Testing (Component Level)

**WordToken Tests**:
```
Test 1: Renders word text correctly
  Given: word="hello"
  Expect: Text displays "hello "

Test 2: Fires long-press after 300ms
  Given: User presses and holds
  When: 300ms elapses
  Expect: onLongPress called with index and position

Test 3: Does not fire for short press
  Given: User presses for 200ms
  Expect: onLongPress not called

Test 4: Highlighted words have different style
  Given: isHighlighted=true
  Expect: Text has opacity 0.4
```

**GhostCard Tests**:
```
Test 1: Renders all provided words
  Given: words=["across", "the", "field"]
  Expect: Text displays "across the field"

Test 2: Calls onConfirm when button tapped
  Given: Ghost card rendered
  When: User taps confirm button
  Expect: onConfirm called once

Test 3: Calls onCancel when background tapped
  Given: Ghost card rendered
  When: User taps outside card
  Expect: onCancel called once

Test 4: Shows correct scene number
  Given: sceneNumber=5
  Expect: Header displays "┈ Scene 5 ┈"
```

**SplitIndicator Tests**:
```
Test 1: Positions line correctly
  Given: splitWordIndex=2, wordPositions=[{x:0}, {x:50}, {x:100}]
  Expect: Line rendered at x=100

Test 2: Handles edge case (first word)
  Given: splitWordIndex=0
  Expect: Line at position of first word

Test 3: Updates position when index changes
  Given: Initial index=2
  When: Index changes to 3
  Expect: Line moves to new position
```

### Integration Testing (Flow Level)

**Split Flow Tests**:
```
Test 1: Complete split flow
  1. User long-presses word
  2. Ghost appears with correct text
  3. User taps confirm
  4. Two scenes exist with correct text

Test 2: Adjust and split
  1. User long-presses word index 3
  2. User drags to word index 2
  3. Ghost updates to show new split
  4. User confirms
  5. Split occurs at index 2

Test 3: Cancel split
  1. User long-presses word
  2. Ghost appears
  3. User taps outside
  4. Ghost disappears
  5. Scene unchanged

Test 4: Multiple splits
  1. User splits scene A
  2. User splits scene B
  3. Both splits work independently
  4. No state conflicts
```

### Performance Testing

**Metrics to Track**:
```
1. Frame rate during split drag
   Target: Consistent 60fps
   Measure: Use React DevTools Profiler
   
2. Time to initiate split
   Target: < 350ms (300ms delay + 50ms render)
   Measure: From press to ghost appearance
   
3. Time to confirm split
   Target: < 400ms (animation duration)
   Measure: From confirm tap to final state
   
4. Memory usage over 100 splits
   Target: No growth (no leaks)
   Measure: Chrome DevTools Memory tab
```

**Stress Tests**:
```
Test 1: Very long scene (100+ words)
  - Split should still be 60fps
  - Ghost card should handle scrolling if needed

Test 2: Rapid split/cancel cycles (20 times)
  - No performance degradation
  - No memory leaks
  - All interactions still responsive

Test 3: Many scenes (50+) with split active
  - ScrollView performance maintained
  - No lag in other gestures
```

---

## Accessibility Considerations

### Screen Reader Support

**WordToken Accessibility**:
```
Accessibility label: "Word: [word text]. Long press to split here."
Accessibility hint: "Double tap and hold to create a new scene starting from this word."
Accessibility role: "button"
```

**GhostCard Accessibility**:
```
Accessibility label: "Preview of new scene [number]. Contains [X] words."
Accessibility hint: "This is a preview. Tap confirm to create, or tap cancel to dismiss."
Focus order: Confirm button should be focusable
```

**Confirm Button Accessibility**:
```
Accessibility label: "Confirm split"
Accessibility hint: "Creates a new scene with the selected text."
Accessibility role: "button"
Minimum size: 44x44pt (already specified)
```

### Reduced Motion Support

**Check system preference**:
```
If user has "Reduce Motion" enabled:
  - Ghost card: Appears instantly (no fade)
  - Border change: Instant (no transition)
  - Card separation: Linear movement (no spring)
  - Duration: 200ms max (vs 300-400ms normal)
```

### High Contrast Support

**Visual adjustments for high contrast mode**:
```
If high contrast enabled:
  - Ghost card border: Increase to 3px (from 2px)
  - Split line: Increase to 3px (from 2px)
  - Colors: Use system high contrast colors
  - Dimmed text: Opacity 0.5 → 0.6 (more visible)
```

---

## Error States and Edge Cases

### Data Validation

**Before Split**:
```
Validate:
  1. Scene exists in scenes array
  2. splitWordIndex >= 1 (at least one word in top)
  3. splitWordIndex < scene.words.length (at least one word in bottom)
  4. Scene has at least 2 words total

If invalid:
  - Don't allow split to initiate
  - Show subtle shake animation on card
  - Brief error message (toast or inline)
```

**During Split**:
```
Validate on wordIndex change:
  1. New index is within valid range
  2. New index creates valid top/bottom split

If invalid:
  - Clamp to valid range
  - Don't emit state change
```

**On Confirm**:
```
Validate before data mutation:
  1. splitState is not null
  2. Scene still exists
  3. Scene text hasn't changed since split started

If invalid:
  - Cancel split
  - Show error message
  - Reset to normal state
```

### Concurrent Gesture Handling

**Rules**:
```
1. Only one split can be active at a time
   - If split active on Scene A
   - User tries to split Scene B
   - Scene A split cancels first
   - Then Scene B split initiates

2. Split blocks swipe
   - If split active
   - Swipe gestures disabled on that card
   - Swipe enabled on other cards

3. Swipe blocks split
   - If user is mid-swipe
   - Long-press doesn't trigger
   - Must release swipe first

4. Reorder blocks everything
   - If drag mode active (reordering)
   - All other gestures disabled
   - Must release drag first
```

**Implementation**:
```
State machine concept:

Global gesture state (enum):
  - IDLE (no gestures active)
  - SPLITTING (split gesture active)
  - SWIPING (swipe gesture active)
  - DRAGGING (reorder active)

State transitions:
  IDLE → SPLITTING: Long-press word
  SPLITTING → IDLE: Confirm or cancel
  IDLE → SWIPING: Start swipe
  SWIPING → IDLE: Release swipe
  IDLE → DRAGGING: Long-press header
  DRAGGING → IDLE: Release drag
  
  Any state → IDLE: Tap outside or interrupt

Gesture detection checks state:
  if (globalGestureState !== IDLE && newGesture !== currentGesture) {
    cancel current gesture
    then allow new gesture
  }
```

### Recovery from Errors

**App backgrounded during split**:
```
Scenario: User initiating split, phone call comes in

Behavior:
  1. App goes to background
  2. onBlur event fires
  3. Split state cleared (splitState = null)
  4. When app returns to foreground
  5. Scene is in normal state (split cancelled)
  6. No data loss, no corrupt state
```

**Rapid state changes**:
```
Scenario: User taps confirm multiple times quickly

Protection:
  1. First tap: Triggers split confirmation
  2. Subsequent taps: Ignored (button disabled after first tap)
  3. Re-enabled only after split completes

Implementation:
  - Track "isProcessing" flag
  - Disable button while processing
  - Visual feedback (spinner or opacity change)
```

**Scene deleted during split**:
```
Scenario: User has split active, another user deletes that scene (collaborative mode)

Behavior:
  1. Scene deletion detected
  2. Check if splitState.sceneId === deletedSceneId
  3. If yes: Clear splitState
  4. Ghost disappears
  5. Show toast: "Scene was deleted"
```

---

## Summary: Key Architectural Decisions

### 1. **Ghost Card over Gap Opening**
- **Why**: Simpler mental model, less rendering overhead
- **Trade-off**: Less kinetic feel, but much better performance
- **Result**: Users see exactly what they're creating

### 2. **Dashed Borders for Preview State**
- **Why**: Universal "temporary" signal
- **Trade-off**: Less novel than rubber bands, but clearer
- **Result**: No ambiguity about preview vs real

### 3. **Instant Updates During Drag**
- **Why**: Eliminates continuous animation calculations
- **Trade-off**: Less smooth, but imperceptible at high frame rates
- **Result**: 60fps guaranteed, even on lower-end devices

### 4. **Minimal State, Computed Visuals**
- **Why**: Smaller state = faster updates, no sync issues
- **Trade-off**: More computation on render, but it's cheap
- **Result**: Bug-free derived data, easy to reason about

### 5. **Component Independence**
- **Why**: Each component testable in isolation
- **Trade-off**: More props drilling, but very clear contracts
- **Result**: Easy to modify one component without breaking others

### 6. **Event-Driven Communication**
- **Why**: Clear data flow, no hidden dependencies
- **Trade-off**: More verbose, but explicit is better
- **Result**: Easy to trace where state changes originate

---

## Implementation Readiness Checklist

Before starting implementation, ensure:

- [ ] All component contracts are clear
- [ ] State shape is finalized
- [ ] Event flow is mapped for each gesture
- [ ] Performance targets are agreed upon
- [ ] Animation specifications are complete
- [ ] Accessibility requirements are understood
- [ ] Error states are defined
- [ ] Testing strategy is approved
- [ ] Migration path from current code is planned
- [ ] Dependencies between components are documented

---

## CLARIFYING QUESTIONS

Please review this architectural specification and ask any questions about:

1. **Component Interactions**: Is the relationship between GhostCard, SplitIndicator, and the original SceneCard clear? Do you understand how they coordinate?

2. **State Management**: Is the splitState structure clear? Do you understand why it's minimal and how derived data works?

3. **Performance Strategy**: Do you understand which optimizations are most important and why instant updates (vs smooth animations) improve performance?

4. **Event Flow**: Can you trace the complete flow from user gesture → component detection → parent state update → re-render? Any unclear steps?

5. **Migration Strategy**: Is the phased approach to updating the current code clear? Do you know which parts to keep and which to delete?

6. **Modularity**: Do you understand the component contracts (inputs/outputs)? Can you see how each component could be developed and tested independently?

7. **Edge Cases**: Are there scenarios not covered that you think should be addressed?

8. **Visual Design**: Is the ghost card appearance clear? Do you understand the dashed-to-solid border transition?

9. **Gesture Conflicts**: Is the global gesture state machine concept clear? Do you understand how to prevent conflicting gestures?

10. **Testing**: Do you have enough detail to know what to test at each level (unit, integration, performance)?

Ask anything that would help you implement this architecture with confidence and maintain clean, modular code.