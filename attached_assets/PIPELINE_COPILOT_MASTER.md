# Pipeline Copilot — Master Reference Document

> **Version:** Stage 1 Complete, 2A Complete — Stage 2 In Progress  
> **Purpose:** Single source of truth for every decision, convention, mechanic, and piece of intent behind the app. This document governs all future actions. Nothing gets built without checking here first.

---

## Table of Contents

1. [What Is This App](#1-what-is-this-app)
2. [The Philosophy](#2-the-philosophy)
3. [Final Card List & Names](#3-final-card-list--names)
4. [App Structure — The Fractal Kanban](#4-app-structure--the-fractal-kanban)
5. [Navigation Map](#5-navigation-map)
6. [Card-by-Card Specification](#6-card-by-card-specification)
   - 6.1 [Style Selector](#61-style-selector)
   - 6.2 [Beat Butcher](#62-beat-butcher)
   - 6.3 [Entity Editor](#63-entity-editor)
   - 6.4 [Arc Assembler](#64-arc-assembler)
7. [Card Status & Dependency Logic](#7-card-status--dependency-logic)
8. [Project Creation Flow](#8-project-creation-flow)
9. [Design System](#9-design-system)
10. [Architecture & Code Conventions](#10-architecture--code-conventions)
11. [Data & Storage](#11-data--storage)
12. [Current State of the Codebase](#12-current-state-of-the-codebase)
13. [What Needs To Be Built](#13-what-needs-to-be-built)
14. [What Must Not Change](#14-what-must-not-change)
15. [Step-by-Step Build Checklist](#15-step-by-step-build-checklist)

---

## 1. What Is This App

Pipeline Copilot is a **personal, offline-first, pre-production planning tool** built exclusively for one user: Rania. It runs on Android. It exists to solve one specific problem: pre-production for Islamic short-form reels (Substack post → cinematic reel) takes too long at a desk. The app moves that entire cognitive workload to dead time — commutes, school, internship — turning it into something enjoyable through great UX and smart mobile-first gestures.

**What it is not:**
- It is not a video editor
- It is not a rendering tool
- It is not published software for the public
- It has no authentication
- It has no collaborative features
- It produces no video output

**What the output is:**
A structured JSON per project containing all pre-production decisions: the script segmented into beats, the visual style selected, the subjects identified and described, and the per-scene visual brief (the production prompt). This JSON feeds ComfyUI/Flux/LTX workflows on a home server after the fact.

**The workflow in one sentence:**  
Plan everything on phone in dead time → sit at home setup → generate everything in one locked session.

---

## 2. The Philosophy

These principles are non-negotiable and apply to every file, every component, every decision:

| Principle | What It Means In Practice |
|---|---|
| **Modular** | Every piece is a reusable building block. No logic repeated. No component written twice. |
| **Structured** | Strict layer architecture: `types → constants → lib → hooks → components → app`. Never violated. |
| **Minimal** | No feature that isn't actively needed. No UI element that doesn't serve a purpose. |
| **Instant reactive** | Every touch must respond immediately. The user must always feel in control. No lag, no jank, no dead zones. |
| **Optimized** | Dead code is removed on sight. Every render is justified. SharedValues over state wherever animation is involved. |
| **Premium** | Neobrutalist aesthetic, fully locked. Warm cream background, thick 3px borders, hard offset shadows, bold uppercase labels. No glassmorphism. No blur. No gradients. |
| **Consistent** | Every screen uses `ScreenLayout`. Every card uses the `UniversalModuleCard` shell or the scene-mapper card language. Every color comes from `constants/theme.ts`. |
| **Self-documenting** | Every file has a JSDoc `@module` header. Every function has an inline comment for anything non-obvious. |

---

## 3. Final Card List & Names

The app has been through several naming iterations. These are the locked, final names:

| # | Card Name | Old Name | Status |
|---|---|---|---|
| — | *(Project Creation Precondition)* | Script Pasting | Not a card. Becomes the project creation form. |
| 1 | **Style Selector** | Style Selector | Locked — 60% built |
| 2 | **Beat Butcher** | Scene Segmentor | Locked — 100% built |
| 3 | **Entity Editor** | Subject Segmentor | Locked — <10% built |
| 4 | **Arc Assembler** | Scene Mapper / "Pom Pom Pew Pew" | Locked — 0% built |

There are exactly **4 cards** per project. No more, no less. The old "Scene Mapper" route (`app/scene-mapper/`) is the skeleton of what will become the Arc Assembler.

---

## 4. App Structure — The Fractal Kanban

The app is a **Kanban inside a Kanban** — two levels deep.

### Level 1 — Projects Kanban (the outer board)
- One column per status: Waiting → Up Next → In Progress → In Review → Done
- Each card = one project = one video
- Cards are **not draggable** by the user. Status changes automatically.
- Only the **Waiting column** has an Add button (bottom of column, unique to that column)
- **Swipe left** on a project card → delete it (with confirmation)
- Swipe right on a project card → TBD / not yet decided

### Level 2 — Stages Kanban (the inner board, per project)
- Same 5 columns
- Contains exactly 4 pre-configured cards: Style Selector, Beat Butcher, Entity Editor, Arc Assembler
- Cards are **not draggable**. Their status changes automatically based on progress and dependency logic.
- Tapping a card in **In Progress** or **In Review** opens that card's work screen.

### The Fractal Logic
Clicking a project card opens its inner Stages Kanban. Clicking a stage card opens that stage's work interface. The data model reflects this hierarchy: one pipeline table in Supabase, each row = one project, each column = one stage's stored data.

---

## 5. Navigation Map

```
Welcome Screen (index.tsx)
  └── "Get Started" → Projects Kanban (project.tsx)
        └── Tap project card → Stages Kanban (per-project view)
              ├── Style Selector card → app/style-matcher/index.tsx
              ├── Beat Butcher card → app/scene-segmentation/scene-segmentor.tsx
              ├── Entity Editor card → app/scene-segmentation/entity-editor.tsx  [TO BUILD]
              └── Arc Assembler card → app/arc-assembler/index.tsx               [TO BUILD]
```

**Route rename required:**  
- `app/scene-mapper/` → `app/arc-assembler/`  
- `app/scene-segmentation/subject-segmentor.tsx` → `app/scene-segmentation/entity-editor.tsx`  
- All module IDs, nav labels, and `PROJECT_MODULES` entries updated to match final card names.

**PowerSync status indicator:**  
A single colored dot in the top-right corner of every screen's navigation header.  
- Green = synced / online  
- Red = offline  
Uses `colors.success` (skyBlue) and `colors.error` (alizarinCrimson) from the theme.

---

## 6. Card-by-Card Specification

---

### 6.1 Style Selector

**Purpose:** Browse and select one of 690 offline visual style collages. The selected collage becomes the visual conditioning anchor for the entire project.

**Current state:** ~60% done. The skeleton exists at `app/style-matcher/index.tsx`. Gallery renders with mock color placeholders. Filter bottom sheet exists but is cosmetic. No real collage images are wired. No selection persistence.

**What it needs to do:**

1. **Gallery first.** On enter, all 690 collage thumbnails are loaded and visible as a 2-column grid. No questions, no prompts on first view. Pure browsing.

2. **Filtering system (bottom sheet).** A persistent collapsed bottom sheet at the bottom of the screen shows "Filter Styles" with a count badge when filters are active. Tapping expands it. Inside: all questions from `styleMatcherData` rendered as horizontally-scrollable chip rows. Selecting chips filters the gallery in real time — fewer chips = more collages shown. All chips active simultaneously = AND logic (intersection, not union). The gallery updates live as chips are toggled.

3. **Selection.** Tapping a collage selects it. Selected state: 3px border in `colors.primary`, a checkmark badge in the corner. Only one collage can be selected at a time.

4. **Tag tally.** Each collage has a corresponding tag tally in `styleMatcherData` JSON. When a collage is selected, its tag tally is stored alongside the collage ID. These tags are used later in Arc Assembler as placeholder text.

5. **Collage images.** The 690 `.jpg` files are in `Style Collages/` folder in the repo. They need to be bundled into the app as local assets. Image IDs correspond to filenames (1.jpg → 686.jpg).

6. **Continue.** Marks the card In Review. Unlocks Entity Editor (moves it to Up Next).

**Layout decision:** Gallery takes the full screen. Filter sheet floats at the bottom, collapsed by default. When expanded it overlays the bottom ~75% of the gallery. The gallery scrolls independently behind it.

---

### 6.2 Beat Butcher

**Purpose:** Segment the pasted script into beats/scenes by splitting, merging, and reordering word cards.

**Current state:** 100% done. This card is complete and production-ready.

**Location:** `app/scene-segmentation/scene-segmentor.tsx`  
**Components:** `components/scene-segmentation/scene-mapper/` (all 6 files)  
**Hook:** `hooks/useSceneSegmentation.tsx`

**Gesture system (do not touch):**
- **Long-press a word (100ms) + drag down** → splits the card at that word, ghost card follows finger, releases into a new scene
- **Swipe right on a card** → merge with next scene
- **Swipe left on a card** → merge with previous scene
- **Long-press header (500ms) + drag** → reorder card in the list, drop zones appear between cards
- All animations driven by `SharedValue` — zero React re-renders during gesture

**Minor addition needed:**  
- First card: option to delete (remove first beat entirely)
- Last card: option to delete (remove last beat entirely)
- These are the only two cards that should have delete affordance

**Output:** Array of `Scene` objects, each containing `Word[]` and `estimatedDuration`.

---

### 6.3 Entity Editor

**Purpose:** Identify, name, and tag recurring subjects (people, objects, concepts) across all scenes. Each subject gets a named profile. When the same subject appears in multiple scenes, those appearances are linked to the same profile. This is the subject catalogue the Arc Assembler draws from.

**Current state:** Skeleton only. The old `subject-segmentor.tsx` renders an empty horizontal scroll of scene columns. Nothing functional.

**What it needs to do:**

1. **Scene strip (top).** A horizontal scrollable tape of all scenes from Beat Butcher. Each column = one scene. Scene text is shown at the top of each column. This gives spatial context while tagging.

2. **Subject highlighting.** Within each scene's text, the user can tap+drag across words to create a highlight (a subject span). The highlight renders as a colored box around those words.

3. **Naming subjects.** Creating a highlight opens a small inline input to name it. Default name = the highlighted text itself.

4. **Repeat detection.** When a subject is highlighted whose text closely matches an existing subject profile, the app surfaces a suggestion: "Is this the same as [existing subject name]?" If confirmed, the new highlight links to the existing profile. If rejected, a new profile is created.

5. **Subject profiles panel.** A bottom panel or side panel shows all distinct subject profiles created so far. Each profile shows: name, color dot, count of appearances across scenes.

6. **Colors.** Subject profile colors are dynamically generated but constrained to the app's brand palette ranges (warm cream → burnt sienna → sky blue range). Not pastel, not random HSL. Stays within the neobrutalist warmth.

7. **Editing.** A subject profile name can be edited by tapping it. Editing a name updates all linked highlights across all scenes immediately.

8. **Deleting.** Long-press a profile → delete option. Deleting a profile removes all its linked highlights. Individual highlights can also be deleted independently.

9. **Output:** `SubjectCategory[]` — each with an ID, name, color, and list of `Subject` objects (scene ID + word range) linked to it.

**UX note:** This screen has many interactions compressed into limited mobile real estate. The horizontal scene strip at the top + vertical subject panel at the bottom is the most efficient layout. The gesture language should mirror Beat Butcher where possible (long-press to initiate, tap to confirm).

---

### 6.4 Arc Assembler

**Purpose:** The final and most important card. Takes all upstream outputs (scenes from Beat Butcher, subjects from Entity Editor, collage + tags from Style Selector) and assembles them into a per-scene visual brief — the production prompt that drives the generative AI workflow.

**Current state:** 0% built. The skeleton at `app/scene-mapper/index.tsx` is a simple read-only overview. It needs to be gutted and rebuilt from scratch as `app/arc-assembler/index.tsx`.

**The two perspectives (modes):**

The Arc Assembler has two modes that coexist on the same screen, toggled by a full-page horizontal swipe:

#### Left Page — Scene Mode

Each scene is presented as a focused work unit:

- **Scene text** displayed at the top, read-only. Words belonging to subjects are shown as highlighted/colored inline boxes matching the Entity Editor colors.
- **Text area** below the scene text. This is where the visual brief is written for this scene. Large, comfortable, keyboard-friendly.
- **Placeholder text** in the text area = grayed-out tags from the selected collage's tag tally. They disappear the moment typing begins. This solves blank page paralysis.
- **Subject highlight interaction.** Tapping a subject highlight (colored box) in the scene text opens a small popup. The popup shows what has been written for that subject on the Right Page. There is an edit button inside the popup that opens the keyboard and lets the user write/edit the subject's brief inline. Edits here propagate to: all other scenes where that subject appears, and the Right Page.
- **Collage button.** A floating button (top right or inline in header) opens the selected collage as a full-screen overlay for reference. Tap anywhere to dismiss. Quick look only.
- **Next / Back buttons.** Move the cursor to the next or previous scene. The page scrolls and the text area receives focus automatically, opening the keyboard.

#### Right Page — Subject Mode

Identical structure but per subject instead of per scene:

- Each subject is presented one at a time.
- **Subject name** at the top.
- **Text area** for the subject's visual brief — what this subject looks like, how to represent it visually.
- **Placeholder text** = same collage tag tally placeholders.
- **Scenes list** (small, below or above text area) showing which scenes this subject appears in, as a quick reference.
- **Next / Back buttons.** Navigate through all subjects.
- Edits here propagate instantly back to all scene appearances on the Left Page.

#### Toggling between modes
- **Full-page swipe left/right** → switches between Scene Mode (left) and Subject Mode (right).
- The current position (which scene or subject is focused) is preserved when switching.
- A subtle indicator (pill or underline) shows which mode is active.

#### Collage reference overlay
- Available on both pages.
- Single button tap → full screen collage image.
- Tap anywhere → closes.
- Does not change navigation state.

#### Output
A structured object per project containing:
- Per-scene: `{ sceneId, sceneText, visualBrief: string }`
- Per-subject: `{ subjectId, subjectName, subjectBrief: string }`
- Collage ID + tag tally
- Final JSON suitable for copy-paste into AI generation workflows

---

## 7. Card Status & Dependency Logic

This is the heart of the app's intelligence. Status never changes manually — it derives from progress and upstream state.

### Status Definitions

| Status | Meaning | Visual |
|---|---|---|
| **Todo** | Locked. Upstream dependency not met. | Gray |
| **Up Next** | Unlocked, not started. | Yellow (sunglow) |
| **In Progress** | Work has begun (progress > 0%). | Orange (burntSienna) |
| **In Review** | Work complete (100%). Still editable. | Purple |
| **Done** | Locked and approved. | Blue (skyBlue) |

### Unlock Chain

```
Project Created
  → Style Selector: Up Next immediately
  → Beat Butcher: Up Next immediately (script is the project precondition, already done)
  → Entity Editor: Up Next only when Beat Butcher reaches In Review
  → Arc Assembler: Up Next only when Entity Editor reaches In Review
```

Style Selector and Beat Butcher unlock simultaneously on project creation because their inputs don't depend on each other. Entity Editor depends on Beat Butcher. Arc Assembler depends on Entity Editor (and implicitly on all upstream cards).

### Outdated State

If a card in **In Review** is edited (e.g. user goes back and changes a beat in Beat Butcher), all downstream cards that were In Progress or In Review get:
- Flagged with an **outdated badge** ("Outdated" pill overlay on the card)
- Reverted to **In Progress** status if they were In Review
- A visual indicator persists until the downstream card is re-reviewed and marked back to In Review

This prevents stale data silently flowing into the Arc Assembler.

### In Review → Done
- In Review cards have a unique "Mark as Done" button
- Tapping it locks the card and moves it to Done
- Done cards are read-only

---

## 8. Project Creation Flow

The old "Script Pasting" card is removed as a stage card. Instead, it becomes the **project creation form** triggered by the Add button in the Projects Kanban's Waiting column.

### Creation Modal / Screen
Three inputs, in order:

1. **Prospect Name** — the client this reel is for
2. **Post Name** — the Substack post being visualized
3. **Script** — paste or type the exact quote/excerpt that will be used

On confirm:
- A new project card is created in the Projects Kanban under "In Progress" (it goes directly to In Progress, not Waiting, because work starts immediately)
- Inside that project, the Stages Kanban is initialized with all 4 cards
- Style Selector and Beat Butcher are immediately set to "Up Next"
- Entity Editor and Arc Assembler are "Todo"
- The script text is stored and passed to Beat Butcher as its initial input

---

## 9. Design System

The design system is **fully locked**. No new colors, no new type sizes, no new shadows are introduced. Everything derives from `constants/theme.ts`.

### Color Palette

| Token | Hex | Usage |
|---|---|---|
| `colors.background` | `#fef4dd` | Warm cream — every screen background |
| `colors.surface` | `#ffffff` | Card backgrounds |
| `colors.primary` | `#141614` | Borders, primary text, active states |
| `colors.secondary` | `#e8824f` | Burnt sienna — In Progress, merge swipe |
| `colors.accent` | `#69c2ef` | Sky blue — Done, success, sync online |
| `colors.accentAlt` | `#ffc22a` | Sunglow — Up Next, warnings |
| `colors.error` | `#d72a21` | Alizarin crimson — CTA buttons, errors, sync offline |
| `colors.border` | `#141614` | All card borders (3px) |
| `colors.text.primary` | `#141614` | Body text |
| `colors.text.secondary` | `#2e2a26` | Muted text |
| `colors.text.inverse` | `#ffffff` | Text on dark backgrounds |

### Typography

| Token | Size / Weight | Usage |
|---|---|---|
| `typography.title` | 30px / 800 | Screen titles |
| `typography.subtitle` | 18px / 600 | Section headings |
| `typography.body` | 16px / 500 | Body text, word tokens |
| `typography.button` | 16px / 700 uppercase | Button labels |
| `typography.caption` | 13px / 600 | Labels, badges, stats |
| `typography.overline` | 12px / 700 uppercase | Column headers |

### Spacing Scale
`xxs=4` `xs=8` `sm=12` `md=18` `lg=24` `xl=32` `xxl=48` `xxxl=64`

### Border Radius
`sm=6` `md=12` `lg=18` `xl=26`

### Shadows
| Level | Offset | Use |
|---|---|---|
| `shadows.soft` | 2×2, opacity 0.18 | Cards, inputs |
| `shadows.medium` | 4×4, opacity 0.30 | Elevated elements |
| `shadows.hard` | 6×6 radius 0, opacity 0.40 | CTA buttons |

### Visual Signatures (must be present on all new UI)
- **3px solid border** on every card and interactive element
- **Hard offset shadow** on primary action buttons
- **Warm cream background** on every screen
- **Bold uppercase** on all status indicators, overlines, and badges
- **No rounded pill borders** on cards — `borderRadius.md` (12px) or `borderRadius.lg` (18px) only

### `ScreenLayout` — Universal Screen Wrapper
Every screen uses `ScreenLayout`. No exceptions. It provides:
- Navigation header (breadcrumb tabs + title + optional progress bar)
- Top `Line` divider (3px)
- Content area (flex: 1)
- Bottom `Line` divider (3px)
- Footer (Back + Continue buttons)

---

## 10. Architecture & Code Conventions

### Layer Architecture (strict, no violations)
```
types/       → imports nothing
constants/   → imports from types/
lib/         → imports from types/, constants/
styles/      → imports from constants/
hooks/       → imports from types/, constants/, lib/
components/  → imports from all lower layers + hooks/
app/         → imports from all layers
```

### State Management
- **No Redux. No Zustand. No Jotai.**
- Pattern: `createContext` + Provider component + `useXxx()` hook
- Every provider scoped at the relevant `_layout.tsx`
- All mutations wrapped in `useCallback`
- All derived values in `useMemo`

### Gesture & Animation Rules
- **Animations: `react-native-reanimated` only**
- **Gestures: `react-native-gesture-handler` only**
- SharedValues for all values that change during a gesture — never `setState` during drag
- `runOnJS` only for lifecycle callbacks (start/end), never for position updates
- Haptic feedback on all gesture confirmations via `expo-haptics`

### Component Rules
- One component per file
- Styles co-located at the bottom of each file via `StyleSheet.create()`
- Every directory has a documented `index.ts` barrel export
- Every file has a JSDoc `@module` header at the top
- Prop interfaces named `ComponentNameProps`
- `React.memo()` on all list-rendered components

### Naming Conventions
| Item | Convention | Example |
|---|---|---|
| Components | PascalCase | `SceneMapperCard` |
| Hooks | `use` prefix, camelCase | `useSceneSegmentation` |
| Constants | UPPER_SNAKE_CASE | `KANBAN_STATUS` |
| Types/Interfaces | PascalCase | `KanbanItem` |
| Files (components) | PascalCase | `SceneHeader.tsx` |
| Files (utilities) | camelCase | `styleMatcher.ts` |

### Import Order
1. External packages (`react`, `expo-*`, `react-native`)
2. Internal components
3. Constants
4. Hooks
5. Lib
6. Styles
7. Types

---

## 11. Data & Storage

### Strategy
**Offline-first, always.** Every piece of data lives on-device in SQLite (via PowerSync). When online, it syncs to Supabase automatically. When offline, the app functions 100% without degradation.

### Sync indicator
Single dot, top-right of NavigationHeader:
- `colors.success` (skyBlue `#69c2ef`) = online / synced
- `colors.error` (alizarinCrimson `#d72a21`) = offline

### Supabase
- Project name: **Pipeline Copilot**
- Main table: **`pipelines`**
- Each row = one project
- No authentication — anonymous access only
- Conflict resolution: **last-write-wins** (PowerSync default)
- No data expiry. No auto-deletion.

### Local SQLite
- Database filename: **`pipelines.db`**
- Size limit: **none** (dynamic, device capacity)
- Logical replication: all tables enabled for PowerSync

### Data Model (conceptual)
```
pipelines table:
  id                    UUID, primary key
  prospect_name         text
  post_name             text
  script                text (raw input)
  style_selection       JSON (collage ID + tag tally)
  beat_butcher_output   JSON (Scene[] with Word[])
  entity_editor_output  JSON (SubjectCategory[])
  arc_assembler_output  JSON (per-scene and per-subject briefs)
  card_statuses         JSON (status of each of the 4 cards)
  created_at            timestamp
  updated_at            timestamp
```

### JSON Export
Each project can be exported as a single JSON blob containing all pipeline data. A copy button on the project card produces this. The JSON is structured for direct use in ComfyUI/Flux/LTX generation workflows: timestamps, style tags, subject descriptions, per-scene prompts, camera notes, and storyboard text.

### Local AI (future)
A local GGUF model (~600MB–1GB) will handle subject auto-detection in Entity Editor. Model runs entirely on-device, no internet required. Integration is deferred until the 4 cards are fully built.

### N8N
Not integrated yet. Will be considered only after the full manual workflow is working and well understood.

---

## 12. Current State of the Codebase

### What Is Done and Must Not Be Touched

| Item | Location | State |
|---|---|---|
| Design system tokens | `constants/theme.ts` | ✅ Final |
| Beat Butcher gesture system | `components/scene-segmentation/scene-mapper/` | ✅ Final |
| Beat Butcher screen | `app/scene-segmentation/scene-segmentor.tsx` | ✅ Final |
| `ScreenLayout` | `components/ui/ScreenLayout.tsx` | ✅ Final |
| `NavigationHeader` | `components/ui/NavigationHeader.tsx` | ✅ Final |
| `FooterActions` | `components/ui/FooterActions.tsx` | ✅ Final |
| `Line` | `components/ui/Line.tsx` | ✅ Final |
| `Button` | `components/ui/Button.tsx` | ✅ Final |
| `UniversalModuleCard` | `components/ui/card/UniversalModuleCard.tsx` | ✅ Final |
| Kanban board components | `components/kanban/` | ✅ Final |
| `useSceneSegmentation` hook | `hooks/useSceneSegmentation.tsx` | ✅ Final |
| Style matcher data | `constants/styleMatcherData.ts` | ✅ Final (2854 lines) |
| Spacing/radius/shadow tokens | `constants/theme.ts` | ✅ Final |

### What Exists but Is Incomplete

| Item | Location | State |
|---|---|---|
| Style Selector screen | `app/style-matcher/index.tsx` | ~60% — mock gallery, cosmetic filters only |
| Projects Kanban | `app/project.tsx` | ~70% — hardcoded modules, no real data layer |
| Welcome screen | `app/index.tsx` | ~90% — just needs routing update |
| `useStyleMatcher` hook | `hooks/useStyleMatcher.tsx` | Built for old Q&A flow, needs filter adaptation |

### What Is A Skeleton Only

| Item | Location | State |
|---|---|---|
| Entity Editor screen | `app/scene-segmentation/subject-segmentor.tsx` | <10% — empty columns only |
| Arc Assembler screen | `app/scene-mapper/index.tsx` | ~5% — read-only overview, mock data |

### What Doesn't Exist Yet

| Item | Notes |
|---|---|
| Project creation form | Replaces "Script Pasting" card |
| Card dependency / outdated logic | The unlock chain and outdated badge system |
| PowerSync integration | `powersync-setup.md` exists as a guide but nothing is wired |
| Supabase `pipelines` table | Schema needs updating from old `style_selections` / `client_sessions` |
| JSON export button | Per project card on the Projects Kanban |
| Sync status dot | In `NavigationHeader` |
| Route renames | All old names must be migrated to final names |

---

## 13. What Needs To Be Built

In priority order:

### Priority 1 — Rename & Restructure
- Rename all routes, module IDs, labels, and file names to match the final card names
- `script-pasting` → removed from module list
- `scene-segmentor` → `beat-butcher`
- `subject-segmentor` → `entity-editor`
- `scene-mapper` → `arc-assembler`
- Update `PROJECT_MODULES` in `project.tsx`
- Update `MODULE_ORDER` and `MODULE_CONFIG` in `kanbanTheme.ts`

### Priority 2 — Project Creation Form
- Add button in Projects Kanban Waiting column
- 3-input form: prospect name, post name, script
- On submit: create project, initialize 4 stage cards, set Style Selector and Beat Butcher to Up Next

### Priority 3 — Card Dependency Logic
- Implement unlock chain in `useKanban`
- Implement outdated detection and badge system
- In Review → Done button per card

### Priority 4 — Style Selector (complete it)
- Wire real collage images from `Style Collages/` folder
- Implement real-time filter logic against `styleMatcherData` tag tallies
- Implement collage selection with persistence
- Store selected collage ID + tag tally to project state

### Priority 5 — Entity Editor (build it)
- Horizontal scene strip with scene texts
- Tap+drag word highlighting within scenes
- Subject naming on highlight creation
- Repeat detection and profile linking
- Subject profiles panel
- Edit / delete profiles
- Output: `SubjectCategory[]`

### Priority 6 — Arc Assembler (build it)
- Two-mode page with swipe toggle
- Scene Mode: scene text + text area + subject highlights + popup + collage button + next/back
- Subject Mode: subject name + text area + scene list + next/back
- Bidirectional sync between modes
- Placeholder text from collage tag tally
- Output: per-scene and per-subject brief JSON

### Priority 7 — PowerSync + Supabase
- Wire PowerSync with `pipelines.db`
- Update Supabase schema to `pipelines` table
- Sync all project data
- Add sync status dot to `NavigationHeader`

### Priority 8 — JSON Export
- Structured export per project
- Copy-to-clipboard button on project card
- Format: all pipeline data in one JSON blob

---

## 15. Step-by-Step Build Checklist

Every task below is atomic — one thing, fully done, committed, before moving to the next. No task is started unless the one above it has a ✅. Tasks are grouped by stage but ordered within each stage by dependency.

---

### STAGE 1 — Foundation & Data

#### 1A. Manual Infrastructure *(done)*
- [x] Supabase `pipelines` table created with full schema
- [x] `update_updated_at` trigger created
- [x] PowerSync publication `powersync` created on `pipelines` table
- [x] PowerSync project created, Supabase connected, sync rules deployed
- [x] `.env` populated with `EXPO_PUBLIC_POWERSYNC_URL`, `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`

#### 1B. File & Route Renames ✅ COMPLETE
- [x] Rename `app/scene-mapper/` → `app/arc-assembler/` (move `index.tsx` into new folder)
- [x] Rename `app/scene-segmentation/subject-segmentor.tsx` → `app/scene-segmentation/entity-editor.tsx`
- [x] Rename `app/scene-segmentation/scene-segmentor.tsx` → `app/scene-segmentation/beat-butcher.tsx`
- [x] Update all `router.push()` calls in `app/project.tsx` to new route paths
- [x] Update `PROJECT_MODULES` array in `app/project.tsx` — new IDs, titles, icons, routes
- [x] Update `MODULE_ORDER` in `constants/kanbanTheme.ts` to `['style-selector', 'beat-butcher', 'entity-editor', 'arc-assembler']`
- [x] Update `MODULE_CONFIG` in `constants/kanbanTheme.ts` with new labels and icons
- [x] Update breadcrumb `tabs` prop in every screen to reflect new route paths and labels
- [x] Verify app builds and navigates correctly after all renames

#### 1C. Project Creation Form ✅ COMPLETE
- [x] Add `AddProjectButton` component to Waiting column in `KanbanBoard` — bottom of column, unique to Waiting only
- [x] Build `CreateProjectModal` component — 3 inputs: prospect name, post name, script. Full neobrutalist styling. No HTML form tags — use controlled inputs + button.
- [x] Add `createProject` action to `useKanban` hook — initializes a new project with all 4 cards, sets Style Selector and Beat Butcher to `UP_NEXT`, Entity Editor and Arc Assembler to `TODO`
- [x] Wire `CreateProjectModal` to `createProject` action
- [x] On project creation, pass script text through to Beat Butcher's initial state via `useSceneSegmentation`
- [x] Verify new project card appears correctly in Projects Kanban

#### 1D. Card Dependency & Status Logic ✅ COMPLETE
- [x] Add `unlockDownstream` logic to `useKanban` — when a card reaches `IN_REVIEW`, move the next card from `TODO` to `UP_NEXT`
- [x] Add `markInReview` action — sets card to `IN_REVIEW` (triggered by Continue button on each card's work screen)
- [x] Add `markDone` action — sets card to `DONE`, locks it (triggered by unique "Mark as Done" button visible only on `IN_REVIEW` cards)
- [x] Add `flagOutdated` logic — when a card in `IN_REVIEW` is edited, all downstream cards that are `IN_PROGRESS` or `IN_REVIEW` get an `isOutdated: true` flag
- [x] Add outdated badge rendering to `UniversalModuleCard` — "Outdated" pill overlay when `isOutdated` is true
- [x] Add `clearOutdated` logic — flag clears when the outdated card is re-reviewed and marked back to `IN_REVIEW`
- [x] Verify full unlock chain works: create project → butcher beats → entity editor unlocks → assemble arc unlocks

#### 1E. PowerSync SDK Wiring ✅ COMPLETE
- [x] Install PowerSync React Native SDK: `@powersync/react-native`
- [x] Create `lib/powersync.ts` — PowerSync client setup, schema definition for `pipelines` table, connector to Supabase
- [x] Wrap root `_layout.tsx` in `PowerSyncProvider`
- [x] Replace any existing Supabase direct calls in hooks with PowerSync watched queries
- [x] Verify data persists across app restarts (SQLite offline)
- [x] Verify data syncs to Supabase when online

#### 1F. Sync Status Dot ✅ COMPLETE
- [x] Add `usePowerSyncStatus` hook — returns `'online' | 'offline'`
- [x] Add dot indicator to `NavigationHeader` — top right, `colors.success` when online, `colors.error` when offline, 8px diameter, no label

---

### STAGE 2 — The Three Upstream Cards

#### 2A. Beat Butcher — Minor Additions ✅ COMPLETE
- [x] Add delete affordance to first card — long-press or swipe reveals delete option, removes the first beat entirely
- [x] Add delete affordance to last card — same mechanic, removes last beat
- [x] Verify minimum 1 card always remains (cannot delete if only one scene exists)
- [x] Wire Beat Butcher's Continue → `markInReview('beat-butcher')` → triggers Entity Editor unlock

#### 2B. Style Selector — Complete It
- [ ] Bundle all 690 collage images from `Style Collages/` as local assets — determine bundling strategy (require() map vs expo-asset)
- [ ] Build `useStyleSelector` hook — replaces old `useStyleMatcher`, manages: active filters, filtered collage list, selected collage ID, selected collage tags
- [ ] Build real filter logic — `styleMatcherData` questions as AND-intersection filters against each collage's tag tally in the JSON
- [ ] Wire gallery to show real collage images instead of color placeholders
- [ ] Implement real-time filtering — gallery updates as chips are toggled
- [ ] Implement collage selection — tap to select, 3px primary border + checkmark badge on selected
- [ ] Store selected collage ID + tag tally to project state via PowerSync
- [ ] Wire Continue → `markInReview('style-selector')`
- [ ] Verify selection persists across app restarts

#### 2C. Entity Editor — Build From Scratch
- [ ] Create `app/scene-segmentation/entity-editor.tsx` screen with `ScreenLayout`
- [ ] Build horizontal scene strip — scrollable tape at top, one column per scene, scene text truncated to one line per column
- [ ] Build word highlight gesture — tap+drag across words within a scene column creates a highlight span
- [ ] Build `CreateSubjectModal` — appears on highlight release, pre-filled with highlighted text, editable name, confirm/cancel
- [ ] Build `SubjectProfile` type and `useEntityEditor` hook — manages: subject profiles list, highlights per scene, repeat detection
- [ ] Build repeat detection — on highlight creation, fuzzy-match against existing profile names, surface "Is this [name]?" suggestion
- [ ] Build subject profiles panel — bottom panel, scrollable list of all profiles, each showing: color dot, name, appearance count
- [ ] Build profile color generation — dynamic but constrained to brand palette warm range
- [ ] Build profile edit — tap profile name → inline editable input → updates all linked highlights instantly
- [ ] Build profile delete — long-press profile → confirm delete → removes profile and all its highlights
- [ ] Build individual highlight delete — long-press a highlight → remove it (profile remains)
- [ ] Store `SubjectCategory[]` output to project state via PowerSync
- [ ] Wire Continue → `markInReview('entity-editor')` → triggers Arc Assembler unlock
- [ ] Verify subject edits propagate instantly across all scenes

---

### STAGE 3 — Arc Assembler & Export

#### 3A. Arc Assembler — Build From Scratch
- [ ] Create `app/arc-assembler/` folder and `index.tsx` screen with `ScreenLayout`
- [ ] Build `useArcAssembler` hook — manages: current scene index, current subject index, active mode (scene/subject), all scene briefs, all subject briefs
- [ ] Build two-mode page shell — Scene Mode (left) and Subject Mode (right), full-page horizontal swipe to toggle, mode indicator pill
- [ ] **Scene Mode:**
  - [ ] Scene text display — read-only, subject spans rendered as colored inline highlight boxes matching Entity Editor colors
  - [ ] Text area — large, keyboard-friendly, auto-focuses and opens keyboard on scene navigation
  - [ ] Placeholder text — grayed-out tags from selected collage's tag tally, disappears on first keystroke
  - [ ] Subject highlight tap → popup — shows subject's current brief from Subject Mode, has Edit button
  - [ ] Popup Edit button → opens keyboard, allows typing/editing subject brief inline
  - [ ] Subject brief edit propagates to: all other scene appearances of that subject + Subject Mode text area
  - [ ] Next / Back buttons — move cursor to next/previous scene, scroll page, auto-focus text area
- [ ] **Subject Mode:**
  - [ ] Subject name displayed at top
  - [ ] Text area — same placeholder logic as Scene Mode
  - [ ] Scenes list — compact read-only list of scenes this subject appears in
  - [ ] Next / Back buttons — navigate through all subjects
  - [ ] Edits propagate instantly to all scene appearances on Scene Mode
- [ ] **Collage overlay:**
  - [ ] Floating collage button — available on both modes
  - [ ] Tap → full-screen image overlay of selected collage
  - [ ] Tap anywhere to dismiss
- [ ] **Bidirectional sync** — subject brief edited in either mode updates the other mode instantly via shared hook state
- [ ] Store all briefs to project state via PowerSync as they are typed (debounced, not on every keystroke)
- [ ] Wire Continue → `markInReview('arc-assembler')`

#### 3B. JSON Export
- [ ] Build `lib/exportPipeline.ts` — pure function that takes a full project row and returns a structured JSON object: `{ projectMeta, styleSelection, scenes, subjects, arcAssemblerOutput }`
- [ ] Add export/copy button to each project card in the Projects Kanban
- [ ] Tap export button → generates JSON → copies to clipboard via `expo-clipboard`
- [ ] Brief toast/confirmation that copy succeeded

#### 3C. Final Polish & Coherence Pass
- [ ] Audit every screen for design consistency — borders, shadows, spacing, typography all match design system
- [ ] Audit every screen for empty states — what does each card look like with no data yet
- [ ] Audit navigation — every Back button goes to the right place, every breadcrumb is accurate
- [ ] Audit dependency logic — create a project, run it through all 4 cards end to end, verify every status transition fires correctly
- [ ] Audit PowerSync — go offline mid-session, make changes, come back online, verify sync
- [ ] Remove all mock data, hardcoded arrays, and placeholder colors from every screen
- [ ] Remove all dead code, unused imports, and commented-out blocks
- [ ] Verify the app builds clean with zero TypeScript errors and zero warnings

---

## 14. What Must Not Change

These are frozen. Do not refactor, do not "improve", do not touch without explicit instruction:

1. **Beat Butcher gesture system** — `components/scene-segmentation/scene-mapper/` — every file, every constant, every spring value. It is complete and production-ready.
2. **The design system tokens** — `constants/theme.ts` — no new colors, no new sizes.
3. **`ScreenLayout` contract** — all screens use it, its props interface is stable.
4. **Layer architecture** — `types → constants → lib → hooks → components → app`. Never violated.
5. **Neobrutalist aesthetic** — no glassmorphism, no blur, no gradients, no rounded pills on cards.
6. **No external state libraries** — React Context + hooks only. No Redux, Zustand, Jotai, or anything else.
7. **Haptic feedback on gesture confirmations** — must remain on all confirmed gestures.
8. **SharedValues for animation** — never `setState` during a gesture or animation.
