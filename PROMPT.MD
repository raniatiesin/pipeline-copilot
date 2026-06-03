# MEGA PROMPT: Scene Mapper Complete Rebuild with Zipper Split Interaction

## Executive Summary

Completely rebuild the Scene Mapper from the ground up with a clean foundation that supports fluid animations. Replace the current broken drag-and-drop system with an intuitive gesture-based interface centered around a **zipper unzip** interaction for splitting scenes, swipe gestures for merging, and drag handles for reordering.

**Core Problem**: The current implementation has fundamental architectural issues. The phrase grouping, drop zones, and state management create brittle code with poor animation performance. Gestures conflict, animations stutter, and the foundation cannot support smooth interactions.

**Solution**: Build a new architecture with:
- **Zipper split gesture**: Tap & hold word → drag down to "unzip" card → release to split
- **Swipe to merge**: Swipe cards left/right to merge with adjacent scenes
- **Drag to reorder**: Long-press scene header to reorder entire scenes
- **Clean component hierarchy**: Separation of concerns, proper gesture handling, 60fps animations

---

## Core Objectives

**What users need to do**:
1. **Split scenes** — "this should be two scenes, not one"
2. **Merge scenes** — "these two scenes should be one"  
3. **Reorder scenes** — "scene 3 should come before scene 2"
4. **Insert new scenes** — "I need a blank scene here"

**Design principles**:
- Every gesture should feel **physical and tactile** (like manipulating real objects)
- Animations should communicate **what's happening** (spring physics, smooth transitions)
- Users should **see the result before confirming** (preview states, clear thresholds)
- **No ambiguity** — one gesture = one clear action
- **Forgiving** — easy to cancel, hard to make mistakes

---

## PRIMARY GESTURE: Zipper Split

### Visual Design Specification

**INITIAL STATE** (normal card):
```
┌─ Scene 2 ────────────────────┐
│ The dog runs across the      │
│ bright green field quickly.  │
└──────────────────────────────┘
```

**STEP 1** — User taps and holds the word "across" for 300ms:
```
┌─ Scene 2 ────────────────────┐
│ The dog runs [●] across the  │  ← Pin/handle appears under finger
│ bright green field quickly.  │     
└──────────────────────────────┘
```
- A small circular pin appears exactly where the user's finger is
- Pin is 24px diameter, solid color (blue), with a subtle shadow
- Pin appears with a scale animation: grows from 0% to 100% in 150ms
- Haptic feedback fires: light impact
- All other scene cards dim slightly (opacity reduces to 95%)
- The pin represents the split point — the split will happen BEFORE this word

**STEP 2** — User begins dragging their finger downward:
```
┌─ Scene 2 ────────────────────┐
│ The dog runs                 │  ← Top part stays anchored
├╌╌╌╌╌╌╌╌╌●╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤  ← Dashed zipper line appears
│         ║                    │
│         ║  20px gap         │  ← Gap opens as user drags
│         ║                    │     
├╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┤
│ across the bright green      │  ← Bottom part follows finger
│ field quickly.               │
└──────────────────────────────┘
    ↓ (other cards slide down to make room)
```
- The card visually splits into two parts at the pin location
- A dashed horizontal line appears at the split point (zipper teeth)
- Dashed line style: 2px thick, blue color, evenly spaced dashes
- The gap between top and bottom parts grows as the user drags down
- Gap size directly follows finger movement (1:1 tracking)
- 3-5 vertical "rubber band" threads connect the two parts
- Threads are semi-transparent blue lines (1px thick)
- Threads curve outward using bezier curves — the more stretched, the more curved
- Other scene cards below this one smoothly slide downward to accommodate the growing gap
- Smooth spring animation for card movements (tension: 68, friction: 12)

**STEP 3** — User continues dragging, gap reaches 60px threshold:
```
┌─ Scene 2 ────────────────────┐
│ The dog runs                 │
└──────────────────────────────┘
         ║║║  ← Rubber threads now visibly strained
        ●═══●  ← Pull handles appear on both sides
         ║║║     (animated slight pulsing)
    ┌─────────────┐
    │ Release to  │  ← Confirmation badge fades in
    │    split    │     Green background, white text
    └─────────────┘
         ║║║
┌──────────────────────────────┐
│ across the bright green      │
│ field quickly.               │
└─ (Becoming new scene) ───────┘
```
- When gap reaches exactly 60px, visual changes occur:
- Confirmation badge fades in at the center of the gap (200ms fade)
- Badge has rounded corners, green background (#10B981), white text
- Badge text: "Release to split"
- Rubber band threads begin pulsing animation (subtle throb effect)
- Thread thickness increases from 1px to 2px
- Haptic feedback fires: medium impact (indicates threshold crossed)
- Pull handles appear at the edges where threads connect

**STEP 4A** — User releases finger when gap is 60px or greater:
```
┌─ Scene 2 ────────────────────┐
│ The dog runs                 │
└──────────────────────────────┘
    ✂️ SNIP! (threads break with snap animation)
    
    (300ms spring animation)
    
┌─ Scene 3 ────────────────────┐  ← New scene created
│ across the bright green      │     Scene number badge appears
│ field quickly.               │
└──────────────────────────────┘
┌─ Scene 4 ────────────────────┐  ← Previous Scene 3 becomes Scene 4
│ Next scene text...           │     All subsequent scenes renumbered
└──────────────────────────────┘
```
- Threads "break" with a quick snap animation (threads retract into cards)
- Optional: Small particle effect at break points (tiny circles dispersing)
- Top part stays in place, becomes final Scene 2
- Bottom part springs to its final position (300ms spring animation)
- New scene card header fades in with scene number badge
- Scene number badge: small rounded rectangle, solid color, white number
- All cards below cascade downward with staggered timing (50ms delay between each)
- Strong haptic feedback: medium impact
- The split is now permanent — data has been updated

**STEP 4B** — User releases finger when gap is less than 60px:
```
┌─ Scene 2 ────────────────────┐
│ The dog runs across the      │  ← Card zips back together
│ bright green field quickly.  │     
└──────────────────────────────┘
    (spring animation, 300ms)
```
- Gap closes with spring animation (300ms)
- Zipper teeth disappear
- Rubber threads retract and disappear
- Pin fades out
- Other cards slide back to original positions
- Light haptic feedback (indicates cancellation)
- No data changes occur

### Advanced Zipper Behaviors

**Repositioning the split point while dragging**:
- While dragging down to open the gap, user can also drag left/right
- This adjusts which word the split happens at
- The pin slides horizontally, snapping to word boundaries
- Snapping is magnetic — when user's finger comes within 15px of a word's center, pin jumps to that word
- Zipper line updates instantly to the new pin position
- Top and bottom text content updates in real-time
- Smooth animations for all repositioning (no jarring jumps)

**Visual highlighting**:
- Words in the "top part" (above zipper line): normal appearance
- Words in the "bottom part" (below zipper line): subtle background tint (rgba(59, 130, 246, 0.08))
- This creates a preview of what the split will look like
- Highlighting updates instantly as pin repositions

**Threshold visual feedback progression**:
- Gap 0-30px: Rubber threads are straight, thin (1px), light color
- Gap 30-50px: Threads begin curving slightly, color intensifies
- Gap 50-60px: Threads curve more, approaching threshold
- Gap 60px+: Threads pulse, thicken to 2px, confirmation badge visible
- This creates a clear progression toward the "ready to split" state

**Edge case: Split at first word**:
- If user long-presses the very first word and drags down
- Top part would be empty (no words)
- System should prevent this: minimum 1 word must remain in top part
- Pin cannot snap to the first word position
- If user tries, pin bounces back with rubber-band animation

**Edge case: Split at last word**:
- If user long-presses the last word
- Bottom part would be empty (no words)
- System should prevent this: minimum 1 word must remain in bottom part
- Pin cannot snap to position after last word
- If user tries, pin bounces back with rubber-band animation

**Cancellation methods**:
1. Release below threshold → automatic zip-back
2. Tap anywhere outside the card while split is active → cancels immediately
3. Swipe up while zipper is open → reverses the gesture, closes gap
4. Start another gesture (like swiping a different card) → current split cancels first

---

## SECONDARY GESTURE: Swipe to Merge

### Visual Design Specification

**Swipe Right** (merge with previous scene):
```
INITIAL:
┌─ Scene 1 ───────────┐
│ Previous scene text │
└─────────────────────┘
┌─ Scene 2 ───────────┐  ← User starts swiping this right →
│ Current scene text  │
└─────────────────────┘

SWIPING (40px):
┌─ Scene 1 ───────────┐
│ Previous scene text │
└─────────────────────┘
   ┌─ Scene 2 ───────────┐
   │ Current scene text  │  ← Card slides right
   └─────────────────────┘
   [Merge with previous]  ← Action label visible on left

THRESHOLD REACHED (80px):
┌─ Scene 1 ───────────┐
│ Previous scene text │
└─────────────────────┘
      ┌─ Scene 2 ───────────┐
      │ Current scene text  │  ← Haptic bump
      └─────────────────────┘
   [  Merge with previous  ]  ← Full label visible

RELEASE:
┌─ Scene 1 ───────────┐
│ Previous scene text │  ← Expands to include Scene 2 text
│ Current scene text  │
└─────────────────────┘
   (Scene 2 card slides right & fades out)
   (Cards below slide up to fill gap)
```

**Swipe Left** (merge with next scene):
```
Similar to swipe right, but:
- Card slides left
- Reveals "Merge with next" label on right side
- Merges content into next scene instead
```

### Interaction Specifications

**Swipe detection**:
- User places finger on card and drags horizontally
- Minimum movement to start swipe: 10px (prevents accidental swipes)
- Once swipe starts, vertical scrolling is disabled for that gesture
- Card follows finger position with slight resistance (0.6x multiplier)
- This resistance makes the card feel "weighted" and gives user control

**Action background reveal**:
- As card slides, action background appears behind it
- Background color: Green (#10B981) for merge actions
- Background width: 120px
- Action text appears on the background: "Merge with previous" or "Merge with next"
- Text is white, 14px, centered vertically
- Text opacity fades in as swipe distance increases (fully visible at 50px)

**Threshold system**:
- Swipe threshold: 80px in either direction
- Before threshold: Card movement is smooth, follows finger
- At threshold: Medium haptic feedback fires
- Card "snaps" slightly (5px instant jump) to indicate threshold crossed
- Past threshold: Resistance increases — card movement slows to 0.3x multiplier
- Maximum swipe distance: 120px (prevents swiping off screen)

**Release behaviors**:

*Release before threshold (< 80px):*
- Card springs back to original position (300ms spring animation)
- Action background slides away during spring-back
- No haptic feedback
- No data changes

*Release at/after threshold (≥ 80px):*
- Card continues sliding in swipe direction (200ms)
- Card fades out while sliding (opacity 1.0 → 0.0)
- Simultaneously, target scene's text updates to include merged content
- Target scene card briefly flashes or pulses to indicate update
- Cards below slide upward to fill the gap (staggered 50ms delays)
- Medium haptic feedback
- Data is permanently updated

**Direction-specific rules**:

*First card (Scene 1):*
- Cannot swipe right (no previous scene to merge with)
- If user tries: card has strong rubber-band resistance
- Card can move maximum 30px right before bouncing back
- Background shows diagonal striped pattern (indicates unavailable)
- No haptic feedback on release

*Last card:*
- Cannot swipe left (no next scene to merge with)
- Same rubber-band behavior as first card swiping right
- Striped pattern on left side

*Middle cards:*
- Can swipe both directions
- Direction determines merge target (previous or next)

**Conflict prevention**:
- If split gesture is active on a card, swipe is completely disabled
- If user tries to swipe while split cursor is visible, nothing happens
- If user starts split gesture while card is swiping, swipe cancels first

**Visual states summary**:
1. **Resting**: Card at x=0, no action background visible
2. **Swipe initiated**: Card translates, action background starts appearing
3. **Before threshold**: Card following finger smoothly, partial action reveal
4. **At threshold**: Haptic fired, card snapped, full action label visible
5. **Past threshold**: Resistance active, card movement slowed
6. **Releasing (cancel)**: Card springing back to x=0
7. **Releasing (confirm)**: Card sliding away, fading out, merge happening

---

## TERTIARY GESTURE: Reorder Scenes

### Visual Design Specification

**Long-press scene header** (500ms hold time):
```
INITIAL:
┌─ Scene 2 ───────────┐
│ ≡ Scene 2      [●]  │  ← User long-presses this header area
│ The dog runs...     │
└─────────────────────┘

DRAG MODE ACTIVATED:
     ╔═ Scene 2 ═══════╗
     ║ ≡ Scene 2  [●]  ║  ← Card lifts up
     ║ The dog runs... ║     Scale: 1.05
     ╚═════════════════╝     Strong shadow
          ↓ (user drags vertically)

DROP ZONES APPEAR:
┌─ Scene 1 ───────────┐
│ Previous scene      │
└─────────────────────┘
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  ← Drop zone (dashed outline)
│    Drop here       │     80px tall
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
     ╔═ Scene 2 ═══════╗  ← Dragged card
     ║ ≡ Scene 2  [●]  ║     (following finger)
     ╚═════════════════╝
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  ← Another drop zone
│    Drop here       │
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
┌─ Scene 3 ───────────┐
│ Next scene          │
└─────────────────────┘

RELEASE:
┌─ Scene 1 ───────────┐
┌─ Scene 3 ───────────┐  ← Reordered (was Scene 3)
│ Next scene          │     Now Scene 2
└─────────────────────┘
┌─ Scene 2 ───────────┐  ← Dropped here (was Scene 2)
│ The dog runs...     │     Now Scene 3
└─────────────────────┘     Numbers updated
```

### Interaction Specifications

**Long-press activation**:
- User must press and hold on the scene header for 500ms
- Header area: 44px tall, full card width, contains scene badge and drag handle icon
- Drag handle icon: Three horizontal lines (≡), positioned on left side
- During hold: No visual feedback until 500ms completes
- At 500ms: Medium haptic feedback, card enters drag mode

**Drag mode visual changes**:
- Card scales up to 105% (scale: 1.05)
- Card gains strong shadow:
  - Shadow opacity: 0.3
  - Shadow radius: 12px
  - Shadow offset: Y=6px, X=0px
  - Shadow color: black
- Card's z-index increases (appears to lift above other cards)
- Card border may subtly thicken or change color (optional enhancement)

**Drop zone generation**:
- As soon as drag mode activates, drop zones appear between all cards
- Drop zone visual:
  - Dashed outline rectangle
  - Border style: dashed, 2px thick
  - Border color: Medium gray (#9CA3AF)
  - Height: 80px
  - Background: transparent or very subtle gray
  - Centered text: "Drop here" in gray, 12px
- One drop zone appears above the first card, between each card pair, and below the last card
- Drop zones have smooth fade-in animation (200ms)

**Drag mechanics**:
- Dragged card follows user's finger Y position (vertical movement only)
- No horizontal movement (card stays horizontally centered)
- Card position updates every frame for smooth tracking
- As card overlaps drop zones, they respond:
  - Overlapping zone highlights (border color changes to blue)
  - Overlapping zone may scale slightly (1.02x)
  - Only one zone can be highlighted at a time (the one with most overlap)

**Auto-scrolling**:
- If user drags near top edge of ScrollView (within 60px): scroll automatically upward
- If user drags near bottom edge (within 60px): scroll automatically downward  
- Scroll speed proportional to proximity to edge (closer = faster)
- Maximum scroll speed: 5px per frame
- This allows reordering cards that aren't currently visible

**Visual feedback while dragging**:
- Other cards remain in their positions (don't shift yet)
- Drop zones clearly indicate where card will land
- Dragged card maintains elevated appearance (shadow, scale)
- Scene numbers on all cards remain unchanged during drag (update only on release)

**Release behaviors**:

*Release over valid drop zone:*
- Dragged card animates to target position (400ms spring animation)
- Card scales back to 1.0 during animation
- Shadow fades out during animation
- Other cards shift to make room (staggered 50ms delays per card)
- All scene numbers update to reflect new order
- Scene number badges animate (brief scale pulse)
- Medium haptic feedback
- Data updated: scene order changed in state

*Release outside drop zones:*
- Card animates back to original position (400ms spring animation)
- Card scales back to 1.0
- Shadow fades out
- Drop zones fade out
- Light haptic feedback
- No data changes

**Cancel drag mode**:
- While dragging, if user taps anywhere outside the dragged card: cancels
- Card returns to original position
- All drop zones disappear
- Light haptic feedback

**Edge cases**:
- Cannot reorder to same position (drop zone where card originated is disabled/grayed out)
- If there's only 1 scene, drag mode doesn't activate (nothing to reorder)
- If split gesture is active somewhere, reorder is disabled until split resolves

---

## QUATERNARY GESTURE: Insert New Scene

### Two Methods Provided

**Method A: Plus Button (Primary, Always Visible)**

Visual placement:
```
┌─ Scene 2 ────────────┐
│ Current scene text   │
└──────────────────────┘
        [  +  ]  ← Plus button appears here
        ↓ Tap to insert blank scene
┌─ Scene 3 ────────────┐
│ Next scene text      │
└──────────────────────┘
```

Specifications:
- Plus buttons appear between every pair of adjacent scenes
- Also appears above first scene and below last scene
- Button style:
  - Circular shape, 32px diameter
  - Light gray border (1px, #D1D5DB)
  - White or very light gray background
  - "+" icon in center (gray, 18px)
  - Subtle shadow for depth
- Spacing: 16px margin above and below each button
- Always visible (not hidden until hover)

Interaction:
- User taps plus button
- Gap opens at that location with spring animation (300ms)
- New empty scene card fades in (200ms fade, starts slightly smaller and scales to 1.0)
- New scene has scene number badge
- Scene contains placeholder text: "Tap to add text" (gray, italic)
- All scenes below shift downward (staggered 50ms delays)
- Light haptic feedback
- Data updated: empty scene inserted at position

**Method B: Long-Press Empty Space (Advanced)**

Visual:
```
LONG-PRESS in empty space between cards:
┌─ Scene 2 ────────────┐
│ Current scene        │
└──────────────────────┘
        ↓ Hold here 500ms
        
GHOST CARD APPEARS:
┌─ Scene 2 ────────────┐
│ Current scene        │
└──────────────────────┘
╔═══════════════════╗
║ ➕ New Scene      ║  ← Dashed outline, semi-transparent
╚═══════════════════╝     User can drag vertically to reposition
┌─ Scene 3 ────────────┐
│ Next scene           │
└──────────────────────┘

RELEASE:
Creates new empty scene at that position
```

Specifications:
- User long-presses (500ms) in the space between scene cards
- Space must be at least 30px tall to be pressable
- Ghost card preview appears with:
  - Dashed border (2px, blue)
  - Semi-transparent background (opacity 0.5)
  - "➕ New Scene" text centered
  - 60px tall initially
- User can drag ghost card up/down to adjust position
- Other cards shift to make room as ghost moves
- Release creates real scene at ghost position
- Medium haptic feedback

---

## Animation Specifications

### Spring Physics Parameters

All animations should use spring physics for natural, organic movement:

**Card movements** (splitting, merging, shifting):
- Tension: 68
- Friction: 12
- Use Animated.spring API
- Never use linear timing or ease curves for card movements

**Small UI elements** (badges, buttons, highlights):
- Tension: 120
- Friction: 14
- Faster, snappier response

**Micro-interactions** (pin appearance, threads pulsing):
- Tension: 180
- Friction: 16
- Very quick, tight springs

### Timing Constants

- Pin scale-in: 150ms
- Confirmation badge fade-in: 200ms
- Card split animation: 300ms
- Card merge slide/fade: 200ms
- Swipe spring-back: 300ms
- Reorder card movement: 400ms
- Insert scene fade-in: 200ms
- Thread break animation: 100ms
- Stagger delay between cascading cards: 50ms

### Haptic Feedback Mapping

Use React Native Haptic library with specific intensities:

**Light impact** (subtle confirmations):
- Split gesture initiated (pin appears)
- Insert new scene
- Cancel any gesture
- Swipe cancelled (spring back)

**Medium impact** (important actions):
- Split threshold crossed (60px gap reached)
- Split confirmed (scene actually splits)
- Merge confirmed (scenes actually merge)
- Reorder confirmed (scene moved)
- Drag mode activated (long-press complete)

**Heavy impact** (rare, only for major errors):
- Not used in this design
- Reserved for error states if needed

### Stagger Patterns

When multiple cards move simultaneously:
1. Calculate which cards need to move
2. Assign each card an index (0, 1, 2, ...)
3. Delay each card's animation: `index * 50ms`
4. All cards use same spring parameters
5. This creates elegant cascade effect

Example: After splitting Scene 2, if there are 5 scenes below:
- Scene 3 starts moving immediately (0ms delay)
- Scene 4 starts at 50ms
- Scene 5 starts at 100ms
- Scene 6 starts at 150ms
- Scene 7 starts at 200ms

---

## Architecture Principles

### State Management Philosophy

**Single source of truth**:
- All scene data lives in one state object
- All gesture states (split, swipe, drag) are separate but coordinated
- Use reducer pattern for complex state updates
- Never mutate state directly — always create new state

**Gesture state isolation**:
- Only one gesture can be active at a time
- Starting a new gesture cancels the previous one
- Gesture state includes:
  - Which gesture is active (split, swipe, drag, or none)
  - Which scene the gesture is operating on
  - Gesture-specific data (gap size, swipe distance, drag position)

**Animation state**:
- Animations are derived from gesture state
- Use Animated.Value objects for performance (runs on native thread)
- Animation state doesn't directly affect data state
- Only when gesture completes does data state update

### Component Hierarchy Design

**Screen level** (scene-mapper.tsx):
- Owns all state (scene data, gesture states)
- Handles all gesture callbacks
- Manages ScrollView
- Renders list of scene cards
- Handles global tap-to-cancel

**Card level** (SceneCard component):
- Represents one scene
- Receives gesture handlers as props
- Renders header, text, and gestures layers
- Self-contained visual logic
- Doesn't own state, just displays it

**Word level** (WordToken component):
- Represents single word
- Handles long-press detection
- Measures own position
- Communicates up to parent
- Styled based on props (highlighted, dimmed, etc.)

**Gesture overlay level** (ZipperOverlay, SwipeActions, etc.):
- Pure visual components
- Receive animated values as props
- Render gesture-specific UI (threads, handles, action labels)
- No state management
- Highly performant (memoized)

### Separation of Concerns

**Visual rendering**:
- Components only render what they're given
- All styling is deterministic based on props
- No business logic in render components

**Gesture detection**:
- Dedicated gesture handlers
- Use PanResponder for complex gestures
- Simple gestures use Pressable callbacks
- Gesture handlers emit events, don't update UI directly

**Data mutations**:
- All scene data changes happen in sceneSegmentation.ts
- Functions like splitSceneAtWord, mergeScenes, reorderScene
- These are pure functions (input → output)
- They return new state, don't mutate existing

**Animation orchestration**:
- Separate animation logic from gesture logic
- Gesture detects → State updates → Animation triggers
- Use Animated.timing, Animated.spring, Animated.stagger
- Coordinate multiple animations with Animated.parallel

---

## Component Responsibilities

### WordToken Component

**Purpose**: Render a single word as an interactive element

**Responsibilities**:
- Display the word text
- Detect long-press gesture (300ms)
- Measure own position on screen when long-pressed
- Provide position data to parent
- Style itself based on highlighting state (normal, top-part, bottom-part)
- Provide adequate touch target (minimum 44x44 points via hitSlop)

**Props received**:
- word: string (the text to display)
- index: number (position in word array)
- sceneId: string (which scene this word belongs to)
- isHighlighted: boolean (is this word in bottom part of split)
- onLongPress: callback with (sceneId, wordIndex, fingerPosition)
- onLayout: callback with (wordIndex, layoutData)

**Memoization**: Must be memoized to prevent re-renders (React.memo)

### ZipperOverlay Component

**Purpose**: Render the zipper split visual when active

**Responsibilities**:
- Display top part of text (words above split)
- Display bottom part of text (words below split)
- Render dashed zipper line
- Render rubber band threads with correct curvature
- Render draggable pin/handle
- Render confirmation badge when threshold met
- Handle pan gesture on pin
- Communicate drag movements and release to parent

**Props received**:
- topWords: array of strings (words in top part)
- bottomWords: array of strings (words in bottom part)
- gapSize: number (current gap in pixels)
- pinPosition: {x, y} (pin location)
- showConfirmation: boolean (is threshold met)
- onPinDrag: callback with (deltaY, deltaX)
- onRelease: callback when user releases

**Visual elements**:
- Top part container with dashed bottom border
- Gap container with rubber threads
- Bottom part container with dashed top border
- Pin (draggable)
- Confirmation badge (conditional)

### RubberBandThreads Component

**Purpose**: Render the connecting threads in zipper gap

**Responsibilities**:
- Calculate thread positions (evenly distributed)
- Calculate thread curvature based on gap size
- Render each thread as SVG path
- Animate thread appearance (pulse when near threshold)
- Adjust thread thickness based on tension

**Props received**:
- gapSize: number (current gap)
- numThreads: number (typically 5)

**Rendering**:
- Use SVG library (react-native-svg)
- Each thread is a Path element with quadratic bezier curve
- Curve control point offset increases with tension
- Thread color and opacity vary with tension

### SwipeableWrapper Component

**Purpose**: Wrap scene card with swipe gesture handling

**Responsibilities**:
- Detect horizontal pan gestures
- Apply resistance to card movement (0.6x multiplier)
- Reveal action backgrounds as card slides
- Determine when threshold is crossed
- Handle release (cancel or confirm merge)
- Prevent swipes when disabled

**Props received**:
- canSwipeLeft: boolean
- canSwipeRight: boolean
- onSwipeLeft: callback
- onSwipeRight: callback
- disabled: boolean (true when split active)
- children: ReactNode (the scene card to wrap)

**State management**:
- Tracks current swipe distance
- Tracks current swipe direction
- Uses Animated.Value for smooth translation

### SceneHeader Component

**Purpose**: Render scene header with drag handle

**Responsibilities**:
- Display scene number badge
- Display drag handle icon (≡)
- Detect long-press for reorder (500ms)
- Communicate drag activation to parent
- Style itself when in drag mode

**Props received**:
- sceneNumber: number
- isDragging: boolean
- onDragStart: callback
- onDragEnd: callback

**Visual layout**:
- Height: 44px (adequate touch target)
- Drag handle on left (≡ icon, 20px)
- Scene badge on right (rounded pill, number inside)
- Flexbox row layout with space-between

### InsertButton Component

**Purpose**: Render plus button for inserting scenes

**Responsibilities**:
- Display plus icon
- Detect tap
- Communicate insertion request to parent
- Animate on press (scale down slightly)

**Props received**:
- onPress: callback with insertion position
- position: number (which index to insert at)

**Visual design**:
- 32px circle
- Light gray border
- White background
- "+" icon centered
- Subtle shadow

---

## Edge Cases and Error Handling

### Split Gesture Edge Cases

**Attempt to split with only 1 word in top**:
- Prevention: Pin cannot snap to first word position
- If user drags pin left toward first word: rubber-band resistance
- Pin bounces back to second word position
- No error message needed (resistance is clear feedback)

**Attempt to split with only 1 word in bottom**:
- Prevention: Pin cannot snap to position after last word
- If user drags pin right past last word: rubber-band resistance
- Pin bounces back to second-to-last word position

**Split gesture interrupted**:
- Scenarios: App goes to background, phone call, notification
- Behavior: Split gesture cancels immediately
- Zipper closes with spring animation
- State resets to normal
- No data changes occur

**Multiple rapid taps on different words**:
- Only the first long-press (held for 300ms) activates
- Subsequent taps ignored while split is active
- User must cancel current split before starting new one

**Very short scenes** (2-3 words):
- Split is allowed if at least 1 word remains on each side
- For 2-word scenes: only one valid split position (between words)
- For 1-word scenes: split gesture disabled entirely (gray out words)

### Swipe Gesture Edge Cases

**Swipe on first card (no previous)**:
- Right swipe has strong resistance (maximum 30px movement)
- Background shows striped pattern (visual "impossible" indicator)
- Card bounces back strongly when released
- No haptic feedback
- User quickly learns this isn't possible

**Swipe on last card (no next)**:
- Left swipe behaves same as first card right swipe
- Striped pattern on left side

**Swipe while split is active**:
- Swipe completely disabled on card with active split
- Swiping does nothing (card doesn't move)
- User must cancel split first

**Very fast swipe** (finger moves quickly):
- Even if finger travels far, threshold still applies
- Momentum doesn't affect confirmation (only distance matters)
- This prevents accidental merges from quick scrolls

**Swipe then immediately scroll**:
- If user swipes card then tries to scroll list
- First gesture completion determines behavior:
  - If swipe released before threshold: card springs back, scroll enabled
  - If swipe released past threshold: merge happens, scroll enabled after
- No conflict between gestures

### Reorder Gesture Edge Cases

**Drag card off top of screen**:
- Auto-scroll activates (scrolls list upward)
- Card can be dropped at any position including above first card
- Scene becomes new first scene

**Drag card off bottom of screen**:
- Auto-scroll activates (scrolls list downward)
- Card can be dropped below last card
- Scene becomes new last card

**Release drag outside app window**:
- Treated as cancel (same as releasing outside drop zones)
- Card returns to original position
- No error state

**Phone rotation during drag**:
- Drag cancels immediately
- Card returns to original position
- State resets
- User must restart gesture after rotation completes

**Very long list** (20+ scenes):
- Auto-scroll allows dragging to any position
- Consider adding "drag to top" and "drag to bottom" quick actions
- Optional: minimap showing card position in full list

### Insert Scene Edge Cases

**Insert when list is empty** (no scenes exist):
- Plus button appears centered on empty screen
- Creates first scene (Scene 1)
- Scene starts empty with placeholder text

**Insert above first scene**:
- Plus button above Scene 1 is always available
- New scene becomes Scene 1
- Previous Scene 1 becomes Scene 2
- All scenes renumber

**Rapid multiple taps on plus button**:
- First tap triggers insert animation
- Subsequent taps ignored until animation completes
- Prevents creating many empty scenes accidentally
- Button temporarily disabled during insertion (visual: slight opacity reduction)

---

## Data Layer Requirements

### Scene Data Structure

Each scene needs:
- Unique ID (string, UUID or similar)
- Text content (string, the actual narrative text)
- Word array (computed from text, for split gesture)
- Order index (number, determines position in list)
- Metadata (optional: timestamps, user notes, etc.)

### Core Operations

**splitSceneAtWord(sceneId, wordIndex)**:
- Input: Scene ID, index where split occurs
- Output: Two new scenes (original scene is deleted)
- First scene: words from 0 to wordIndex-1
- Second scene: words from wordIndex to end
- Both scenes get new IDs
- Both scenes inserted at original scene's position
- All subsequent scenes shift down (indices increase by 1)
- Returns updated scenes array

**mergeScenes(sourceSceneId, targetSceneId)**:
- Input: ID of scene being merged, ID of target scene
- Output: Updated target scene, source scene deleted
- Target scene text = target text + " " + source text (space-separated)
- Source scene removed from list
- All subsequent scenes shift up (indices decrease by 1)
- Returns updated scenes array

**reorderScene(sceneId, newIndex)**:
- Input: Scene ID, new position index
- Output: Reordered scenes array
- Scene removed from original position
- Scene inserted at new position
- All affected scenes' indices update
- Returns updated scenes array

**insertEmptyScene(afterSceneId)**:
- Input: ID of scene after which to insert (or 'start' for beginning)
- Output: New scene created
- New scene gets fresh ID
- New scene text = "" (empty)
- New scene inserted at specified position
- All subsequent scenes shift down
- Returns updated scenes array

### Undo/Redo Support (Optional Enhancement)

Maintain operation history:
- Each operation (split, merge, reorder, insert) is logged
- Log contains: operation type, parameters, timestamp, previous state
- Undo: Revert to previous state from log
- Redo: Replay logged operation
- Maximum history: Last 20 operations
- Clear history when user manually edits scene text

---

## Success Criteria

### Performance Targets

**Animation smoothness**:
- All animations maintain 60fps on modern devices (iPhone 12+, Android flagship)
- No dropped frames during card movements
- Zipper gap opening/closing is buttery smooth
- Rubber thread curves update every frame without lag

**Gesture responsiveness**:
- Long-press activates within 300ms ±10ms
- Touch tracking has zero perceptible lag (<16ms latency)
- Swipe threshold detection is instant
- Pan gestures feel 1:1 with finger movement

**Memory efficiency**:
- No memory leaks from animations
- Animated.Value objects properly cleaned up
- Component unmounting releases all resources
- List virtualization if more than 50 scenes (react-native-virtualized-list)

### User Experience Goals

**Intuitiveness**:
- New users understand split gesture within 1-2 attempts
- Swipe to merge is discoverable (users try it naturally)
- Reorder gesture is findable (drag handle is clear affordance)
- No tutorial required for basic operations

**Error prevention**:
- Impossible actions clearly indicated (rubber-band, striped backgrounds)
- Destructive actions require confirmation (threshold system)
- Easy to cancel any gesture before committing
- Haptic feedback guides user toward correct usage

**Visual clarity**:
- Always clear which scene is active
- Always clear what will happen if user releases
- Previews show result before confirmation
- Color coding and typography establish clear hierarchy

### Code Quality Standards

**Maintainability**:
- Component responsibilities clearly defined
- No component exceeds 300 lines
- Functions are single-purpose
- Names are descriptive (no abbreviations)

**Testability**:
- Pure functions for all data operations
- Gesture handlers separated from rendering
- Easy to mock gesture events for testing
- Clear inputs and outputs for every function

**Documentation**:
- Each component has JSDoc comments
- Complex algorithms have inline comments
- Gesture thresholds explained with comments
- Animation parameters documented with rationale

---

## Visual Design Specifications

### Color Palette

**Primary blue** (split cursor, zipper, threads):
- Main: #3B82F6 (blue-500)
- Light: #DBEAFE (blue-100) for backgrounds
- Dark: #1E40AF (blue-700) for emphasis

**Success green** (merge actions, confirmations):
- Main: #10B981 (green-500)
- Light: #D1FAE5 (green-100)
- Dark: #047857 (green-700)

**Neutral grays** (disabled states, backgrounds):
- Light: #F3F4F6 (gray-100)
- Medium: #9CA3AF (gray-400)
- Dark: #4B5563 (gray-600)

**Warning red** (only for impossible actions):
- Main: #EF4444 (red-500)
- Light: #FEE2E2 (red-100)

### Typography Scale

**Scene text** (the narrative content):
- Font size: 16px
- Line height: 24px (1.5)
- Font weight: 400 (regular)
- Color: #1F2937 (gray-800)
- Letter spacing: 0

**Scene number badges**:
- Font size: 14px
- Font weight: 600 (semibold)
- Color: white
- Background: #3B82F6 (blue-500)

**Action labels** (swipe backgrounds):
- Font size: 14px
- Font weight: 500 (medium)
- Color: white
- All caps: yes

**Confirmation badges**:
- Font size: 13px
- Font weight: 600 (semibold)
- Color: white

**Placeholder text** (empty scenes):
- Font size: 16px
- Font weight: 400 (regular)
- Color: #9CA3AF (gray-400)
- Font style: italic

### Spacing System

Use consistent 4px grid:
- 4px: Tiny spacing (letter spacing, small gaps)
- 8px: Small spacing (between words, icon padding)
- 12px: Medium spacing (between UI elements)
- 16px: Default spacing (card padding, margins)
- 24px: Large spacing (between cards)
- 32px: Extra large (section separation)

**Card padding**:
- Horizontal: 16px
- Vertical: 16px
- Header: 12px all sides

**Gap sizes**:
- Between cards: 24px
- Between insert buttons and cards: 16px
- Zipper line from card edge: 0px (full width)

### Border and Shadow Styles

**Scene cards** (normal state):
- Border: 1px solid #E5E7EB (gray-200)
- Border radius: 12px
- Shadow: subtle (0px 1px 3px rgba(0,0,0,0.1))

**Scene cards** (dragging):
- Border: 1px solid #3B82F6 (blue-500)
- Border radius: 12px
- Shadow: strong (0px 6px 12px rgba(0,0,0,0.3))

**Zipper line**:
- Border width: 2px
- Border style: dashed
- Border color: #3B82F6 (blue-500)
- Dash pattern: 4px dash, 4px gap

**Plus buttons**:
- Border: 1px solid #D1D5DB (gray-300)
- Border radius: 16px (full circle)
- Shadow: 0px 1px 2px rgba(0,0,0,0.05)

---

## Implementation Approach

### Phase 1: Foundation (Core Infrastructure)

**Goal**: Build the basic architecture without gestures

**Tasks**:
1. Set up state structure (scenes array, gesture states)
2. Create SceneCard component (renders scene as flowing text)
3. Create WordToken component (renders individual words)
4. Implement word position measurement (onLayout callbacks)
5. Set up ScrollView with scene list
6. Add scene number badges and headers
7. Create basic styling (typography, colors, spacing)

**Success criteria**:
- Scenes render as flowing text (no phrase boxes)
- Each word is individually measurable
- List scrolls smoothly
- All styling matches spec

### Phase 2: Zipper Split Gesture

**Goal**: Implement the primary split functionality

**Tasks**:
1. Add long-press detection to WordToken
2. Create ZipperOverlay component
3. Implement pin/handle rendering and positioning
4. Add pan gesture to pin (drag to adjust split position)
5. Create RubberBandThreads component
6. Implement gap opening animation
7. Add threshold detection (60px)
8. Create ConfirmationBadge component
9. Implement release behavior (cancel vs confirm)
10. Connect to data layer (splitSceneAtWord function)
11. Add haptic feedback at key moments

**Success criteria**:
- Long-press word shows pin
- Dragging down opens zipper gap smoothly
- Pin can slide left/right to adjust split point
- Threshold triggers confirmation badge
- Release above threshold splits scene
- Release below threshold cancels (zips back up)
- Other cards shift smoothly

### Phase 3: Swipe to Merge

**Goal**: Add merge functionality

**Tasks**:
1. Create SwipeableWrapper component
2. Add pan gesture detection (horizontal)
3. Implement card sliding with resistance
4. Create action background reveal
5. Add threshold detection (80px)
6. Implement release behavior (cancel vs confirm)
7. Connect to data layer (mergeScenes function)
8. Add haptic feedback
9. Handle edge cases (first/last card, rubber-band)
10. Disable swipe when split is active

**Success criteria**:
- Swiping card reveals action label
- Threshold has clear feedback (haptic + snap)
- Release confirms or cancels appropriately
- Merge updates scene text correctly
- Cards shift up to fill gap
- First/last cards have proper resistance

### Phase 4: Reorder Scenes

**Goal**: Add drag-to-reorder functionality

**Tasks**:
1. Add long-press to SceneHeader (500ms)
2. Implement drag mode (card lifts up)
3. Create drop zone indicators
4. Add pan gesture for vertical dragging
5. Implement auto-scroll at edges
6. Add drop zone highlighting
7. Implement release behavior
8. Connect to data layer (reorderScene function)
9. Add haptic feedback
10. Update scene numbers after reorder

**Success criteria**:
- Long-press header activates drag mode
- Card follows finger vertically
- Drop zones appear and highlight
- Auto-scroll works near edges
- Release places card at target position
- Scene numbers update correctly

### Phase 5: Insert New Scene

**Goal**: Add scene insertion functionality

**Tasks**:
1. Create InsertButton component
2. Position buttons between all cards
3. Add tap handler
4. Implement gap opening animation
5. Create empty scene with placeholder
6. Connect to data layer (insertEmptyScene function)
7. Add haptic feedback
8. Optional: Add long-press empty space method

**Success criteria**:
- Plus buttons visible between all cards
- Tap creates new scene at correct position
- Animation is smooth
- Empty scene shows placeholder text
- All scenes renumber correctly

### Phase 6: Polish and Optimization

**Goal**: Refinements, performance, edge cases

**Tasks**:
1. Add React.memo to all components
2. Optimize re-renders (check with React DevTools Profiler)
3. Test all edge cases thoroughly
4. Fine-tune animation parameters (spring physics)
5. Adjust haptic intensities
6. Add accessibility labels (for screen readers)
7. Test on multiple device sizes
8. Test with very long scene lists (100+ scenes)
9. Add loading states if needed
10. Final visual polish (shadows, colors, spacing)

**Success criteria**:
- 60fps on all animations
- No unnecessary re-renders
- All edge cases handled gracefully
- Works on small phones (iPhone SE) and tablets
- Accessibility score >90

### Phase 7: Testing and Validation

**Goal**: Ensure everything works perfectly

**Tasks**:
1. Manual testing on iOS (physical device + simulator)
2. Manual testing on Android (physical device + emulator)
3. Test all gesture combinations
4. Test gesture interruptions (app background, notifications)
5. Test with screen readers
6. Test with different text lengths (1 word to 100+ words)
7. Test performance with 100+ scenes
8. Get user feedback (if possible)
9. Fix any bugs discovered
10. Document any known limitations

**Success criteria**:
- Zero crashes
- All gestures work on both platforms
- Performance targets met
- Users can complete tasks intuitively
- Edge cases handled without errors

---

## File Structure (for reference, not code)

Components will be organized as:
- scene-mapper.tsx (main screen)
- components/scene-segmentation/
  - SceneCard.tsx
  - SceneHeader.tsx
  - SceneTextContainer.tsx
  - WordToken.tsx
  - ZipperOverlay.tsx
  - RubberBandThreads.tsx
  - ConfirmationBadge.tsx
  - SwipeableWrapper.tsx
  - InsertButton.tsx

Utilities and data:
- lib/sceneSegmentation.ts (data operations)
- hooks/useSceneSegmentation.tsx (state management hook)
- types/scene-segmentation.ts (TypeScript types)

Files to delete:
- components/scene-segmentation/Phrase.tsx (obsolete)
- components/scene-segmentation/DropBetween.tsx (obsolete)
- Remove groupIntoPhrases function from sceneSegmentation.ts

---

## CLARIFYING QUESTIONS REQUEST

Before proceeding with implementation, please review this specification and ask any clarifying questions you may have about:

1. **Visual design ambiguities**: Are there any visual elements whose appearance or behavior isn't clear from the descriptions?

2. **Gesture mechanics**: Are the pan gesture detection, threshold systems, or animation triggers fully specified, or do you need more detail on any interaction?

3. **Edge cases**: Have I covered all the edge cases you can think of, or are there scenarios that need specification?

4. **Animation details**: Are the spring physics parameters, timing constants, and stagger patterns sufficient, or do you need more specific guidance on any animation?

5. **Component architecture**: Is the component hierarchy and separation of responsibilities clear, or do you need clarification on what each component should do?

6. **Data flow**: Is it clear how gesture events should flow to state updates to data mutations to re-renders?

7. **Platform differences**: Are there any React Native platform differences (iOS vs Android) that should be explicitly addressed in the spec?

8. **Performance considerations**: Do you need more specific guidance on memoization, virtualization, or other performance optimizations?

9. **Accessibility**: Should I add more detail about screen reader support, reduced motion preferences, or other accessibility features?

10. **Testing approach**: Do you need guidance on how to test gesture behaviors, or is the implementation verification sufficient?

Please ask any questions that would help you implement this specification with confidence. I want to ensure you have everything you need to build this cleanly from the ground up.