# Architecture Guide

> **Tiesin — Your Pipeline Copilot**
>
> _A video production pipeline tool built with Expo/React Native._

---

## Table of Contents

1. [Overview](#overview)
2. [Layer Architecture](#layer-architecture)
3. [Directory Structure](#directory-structure)
4. [Data Flow](#data-flow)
5. [Navigation & Routing](#navigation--routing)
6. [State Management](#state-management)
7. [Design System](#design-system)
8. [Module Reference](#module-reference)
9. [API Integration](#api-integration)
10. [Conventions & Patterns](#conventions--patterns)

---

## Overview

Tiesin guides users through modular stages of video creation — from script analysis and scene segmentation to style selection and asset generation. Each module operates as a self-contained feature flow with shared design tokens, typed contracts, and scoped state.

### Design Principles

| Principle | Implementation |
| --- | --- |
| **Type Safety** | Pure `types/` layer with zero runtime code; all props and state fully typed |
| **Separation of Concerns** | `types → constants → lib → hooks → components → app` layering |
| **Feature Isolation** | Context providers scoped at `_layout.tsx` per route group |
| **No External State** | React Context + hooks only; no Redux / Zustand / Jotai |
| **Barrel Exports** | Every directory has an `index.ts` with documented re-exports |
| **Self-Documenting** | JSDoc `@module` headers on every file; inline comments for complex logic |

---

## Layer Architecture

Dependencies flow strictly downward. No layer may import from a layer above it.

```
┌─────────────────────────────────────────────────┐
│  app/              Screens & route layouts       │  ← Expo Router
├─────────────────────────────────────────────────┤
│  components/       Visual building blocks        │  ← React components
├─────────────────────────────────────────────────┤
│  hooks/            Stateful logic (Context)      │  ← useContext, useState
├─────────────────────────────────────────────────┤
│  styles/           Shared StyleSheet objects      │
├─────────────────────────────────────────────────┤
│  lib/              Pure functions & API clients   │  ← No React dependency
├─────────────────────────────────────────────────┤
│  constants/        Design tokens & static data    │  ← Runtime values
├─────────────────────────────────────────────────┤
│  types/            TypeScript interfaces only     │  ← Zero runtime code
└─────────────────────────────────────────────────┘
```

**Import rules:**

- `types/` → imports nothing (bottom layer)
- `constants/` → may import from `types/`
- `lib/` → may import from `types/`, `constants/`
- `styles/` → may import from `constants/`
- `hooks/` → may import from `types/`, `constants/`, `lib/`
- `components/` → may import from all lower layers + `hooks/`
- `app/` → may import from all layers

---

## Directory Structure

```
style_selector/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx               # Root: GestureHandler → SafeArea → Stack
│   ├── index.tsx                 # Home / Welcome screen
│   ├── input.tsx                 # Script input screen
│   ├── project.tsx               # Project hub (Kanban module cards)
│   ├── confirmation.tsx          # Confirmation screen
│   ├── results.tsx               # General results screen
│   ├── scene-segmentation/       # Scene Segmentation module
│   │   ├── _layout.tsx           # SceneSegmentationProvider → Stack
│   │   ├── index.tsx             # Module landing / overview
│   │   ├── input.tsx             # Script input for segmentation
│   │   ├── scene-mapper.tsx      # Stage 1: phrase-to-scene mapping
│   │   └── subject-mapper.tsx    # Stage 2: subject categorization
│   └── style-matcher/            # Style Matcher module
│       ├── _layout.tsx           # StyleMatcherProvider → Stack
│       ├── index.tsx             # Module landing
│       ├── [order].tsx           # Dynamic question screen
│       └── results.tsx           # Style results with image grid
│
├── components/
│   ├── ui/                       # Shared UI primitives
│   │   ├── Breadcrumb.tsx        # Breadcrumb navigation trail
│   │   ├── Button.tsx            # Primary action button
│   │   ├── FooterActions.tsx     # Universal back/continue footer
│   │   ├── ModuleCard.tsx        # Project hub module card
│   │   ├── NavigationHeader.tsx  # Screen header with tabs + progress
│   │   ├── PageHeader.tsx        # Section title header
│   │   └── Tag.tsx               # Selectable tag chip
│   │
│   ├── kanban/                   # Kanban board components
│   │   ├── KanbanBoard.tsx       # Full board with column layout
│   │   ├── KanbanCard.tsx        # Individual task card
│   │   └── KanbanColumn.tsx      # Status column container
│   │
│   └── scene-segmentation/       # Scene segmentation components
│       ├── SceneCard.tsx          # Shared scene display card
│       ├── SceneDivider.tsx       # Numbered divider between scenes
│       ├── SubjectBox.tsx         # Subject highlight box
│       ├── SceneMapperCard.tsx    # Flowing text card with long-press splitting (Stage 1)
│       ├── InlineSubjectBox.tsx   # Pending/assigned subject inline
│       ├── EmbeddedScene.tsx      # Flowing text with subject boxes
│       ├── SceneLine.tsx          # Minimal scene separator line
│       └── SubjectCategoryCard.tsx # Category card + AddNewCard
│
├── constants/
│   ├── theme.ts                  # Design tokens (colors, spacing, typography)
│   ├── styles.ts                 # STYLE_TAGS for style matcher
│   ├── styleMatcherData.ts       # 2800+ lines of question/option data
│   ├── kanbanStatus.ts           # KANBAN_STATUS, ORDER, CONFIG
│   └── kanbanTheme.ts            # Module order, colors, layout config
│
├── hooks/
│   ├── useKanban.tsx             # KanbanProvider + useKanban
│   ├── useSceneSegmentation.tsx  # SceneSegmentationProvider + hook
│   └── useStyleMatcher.tsx       # StyleMatcherProvider + hook
│
├── lib/
│   ├── sceneSegmentation.ts      # Pure scene/word manipulation functions
│   ├── styleMatcher.ts           # Tag collection, prompt generation
│   └── api/
│       ├── n8n.ts                # N8N webhook for image generation
│       └── supabase.ts           # Supabase client + CRUD operations
│
├── styles/
│   └── common.ts                 # commonStyles: screen, container, etc.
│
└── types/
    ├── core.ts                   # ModuleId, ModuleStatus, VideoProject
    ├── ui.ts                     # ButtonProps, TagProps, ModuleCardProps
    ├── navigation.ts             # AppRoute, RouteParams, BreadcrumbPath
    ├── scene-segmentation.ts     # Scene, Subject, Word, DragState, etc.
    ├── style-matcher.ts          # StyleQuestion, UserChoice, StyleImage
    └── kanban.ts                 # KanbanItem, KanbanState, KanbanAction
```

---

## Data Flow

### Per-Screen Lifecycle

```
Screen mounts
  → reads state from nearest Context (Provider in _layout.tsx)
  → derives display values with useMemo
  → renders components with typed props
  → user interaction → useCallback handler
    → calls hook mutation (setState / dispatch)
    → hook delegates to lib/ pure function (if complex)
    → state updates → re-render
```

### Cross-Module Communication

Modules are isolated — they don't share React state. Communication happens via:

1. **Navigation params** — `router.push('/style-matcher/results', { prompt, tags })`
2. **Persistent storage** — Supabase writes from one module, reads from another
3. **Project hub** — `project.tsx` reads aggregate status via `useKanban`

---

## Navigation & Routing

The app uses **Expo Router** with nested `Stack` navigators. There are no tabs.

### Root Stack (`app/_layout.tsx`)

```
GestureHandlerRootView
  └── SafeAreaProvider
        └── Stack (fade animation)
              ├── index           → Home
              ├── input           → Script Input
              ├── project         → Project Hub
              ├── confirmation    → Confirmation
              ├── results         → Results
              ├── scene-segmentation/ → Nested Stack
              └── style-matcher/     → Nested Stack
```

### Module Stacks

Each module has its own `_layout.tsx` that wraps children in a **Context Provider**:

```tsx
// app/scene-segmentation/_layout.tsx
export default function Layout() {
  return (
    <SceneSegmentationProvider>
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />
    </SceneSegmentationProvider>
  );
}
```

This scopes state to the module — navigating away unmounts the provider and resets state.

---

## State Management

### Pattern: Context + Provider + Hook

Every module follows the same triple:

| Part | Role | Example |
| --- | --- | --- |
| `createContext()` | Typed context with `null` default | `KanbanContext` |
| `<Provider>` component | Wraps children, manages state internally | `KanbanProvider` |
| `useXxx()` hook | Consumes context, throws if outside provider | `useKanban()` |

### State tools used:

- **`useState`** — All three hooks use individual `useState` calls (no `useReducer`)
- **`useCallback`** — Every mutation is wrapped for referential stability
- **`useMemo`** — Derived values (counts, filtered lists, sorted arrays)
- **`useContext`** — Consumer hook with "must be inside Provider" guard

### Hook responsibilities:

| Hook | State Shape | Key Actions |
| --- | --- | --- |
| `useKanban` | `items: KanbanItem[]` | `updateProgress`, `approveItem` |
| `useSceneSegmentation` | `{ scenes, selectedSubjectId, subjectCategories }` | `processScript`, `movePhraseToScene`, `createCategory`, `assignSubjectToCategory` |
| `useStyleMatcher` | `{ choices: UserChoice[], prompt, tags }` | `setAnswer`, `resetChoices` |

---

## Design System

The **Tiesin Design System** follows neobrutalist aesthetics.

### Color Palette

| Token | Hex | Usage |
| --- | --- | --- |
| `background` | `#fef4dd` | Warm cream base |
| `primary` | `#d72a21` | CTA buttons, emphasis |
| `secondary` | `#2e2a26` | Secondary actions |
| `accent` | `#69c2ef` | Info, links, highlights |
| `accentAlt` | `#ffc22a` | Warnings, selection |
| `border` | `#141614` | Hard 3px borders |
| `surface` | `#ffffff` | Card backgrounds |
| `text.primary` | `#141614` | Body text |
| `text.inverse` | `#ffffff` | Text on dark backgrounds |

### Typography Scale

| Token | Size / Weight | Usage |
| --- | --- | --- |
| `title` | 30px / 800 | Screen titles |
| `subtitle` | 18px / 600 | Section headings |
| `body` | 16px / 500 | Body text |
| `button` | 16px / 700 uppercase | Button labels |
| `caption` | 13px / 600 | Labels, stats |
| `overline` | 12px / 700 uppercase | Category headers |

### Spacing

`xxs=4` `xs=8` `sm=12` `md=18` `lg=24` `xl=32` `xxl=48` `xxxl=64`

### Shadows (neobrutalist progression)

| Level | Offset | Opacity | Use |
| --- | --- | --- | --- |
| `soft` | 2×2 | 0.18 | Cards, inputs |
| `medium` | 4×4 | 0.30 | Elevated cards, modals |
| `hard` | 6×6 / radius 0 | 0.40 | CTA buttons, key actions |

### Visual Signatures

- **3px solid borders** on all cards and interactive elements
- **Hard drop shadows** (`radius: 0`) for primary actions
- **Warm cream background** (`#fef4dd`) throughout
- **Bold uppercase labels** for status indicators and overlines

---

## Module Reference

### Style Matcher

**Purpose:** Guide users through a branching questionnaire to determine their visual style preferences, then generate matching reference images.

**Flow:** `index → [order] (loop) → results`

**Key file:** `constants/styleMatcherData.ts` — 2800+ lines of question definitions with parent/sub-question hierarchy, style tags, and image options.

**Logic:** `lib/styleMatcher.ts` — `collectTags()` aggregates style tags from answers; `generatePrompt()` builds a human-readable style description.

### Scene Segmentation

**Purpose:** Two-stage system for breaking a script into scenes and identifying recurring subjects.

**Stage 1 — Scene Mapper** (`scene-mapper.tsx`):
Users rearrange phrases between scene cards. Tap a phrase to select it, then tap a target card (or the space between cards) to move it.

**Stage 2 — Subject Mapper** (`subject-mapper.tsx`):
The segmented text flows inline with highlighted subject spans. Users tap subjects to select them, then assign them to categories via a bottom panel.

**Logic:** `lib/sceneSegmentation.ts` — pure functions for `autoSegment`, `splitScene`, `mergeScenes`, `moveWords`, `addManualSubject`, `removeSubject`, `tokenize`.

### Project Hub (Kanban)

**Purpose:** Dashboard showing all modules as Kanban cards with auto-derived status based on progress percentage and approval state.

**Status derivation:**
- `0% + locked` → TODO
- `0% + unlocked` → UP NEXT
- `1-99%` → IN PROGRESS
- `100% + !approved` → IN REVIEW
- `100% + approved` → DONE

---

## API Integration

### N8N — Image Generation (`lib/api/n8n.ts`)

- Endpoint: `EXPO_PUBLIC_N8N_WEBHOOK_URL`
- Method: `POST` with `{ prompt, style_tags, count }`
- **Dev fallback:** Returns mock images from `picsum.photos` when URL is missing
- Response: `{ images: StyleImage[] }`

### Supabase — Persistence (`lib/api/supabase.ts`)

- Client: `EXPO_PUBLIC_SUPABASE_URL` + `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- Auth: Disabled (anonymous access)
- Table: `style_selections` — CRUD for saving/loading style choices
- Hard fail on missing env vars at module load

---

## Conventions & Patterns

### File Organization

- **One component per file** — extracted to `components/` with typed props interface
- **Styles co-located** — each component has its own `StyleSheet.create()` at the bottom
- **Barrel index.ts** — every directory exports through a documented barrel file
- **JSDoc module headers** — every file starts with `@module` documentation block

### Naming Conventions

| Item | Convention | Example |
| --- | --- | --- |
| Components | PascalCase | `SceneMapperCard` |
| Hooks | camelCase with `use` prefix | `useSceneSegmentation` |
| Constants | UPPER_SNAKE_CASE | `KANBAN_STATUS` |
| Types/Interfaces | PascalCase | `KanbanItem`, `StyleQuestion` |
| Files | PascalCase for components, camelCase for utilities | `SceneCard.tsx`, `styleMatcher.ts` |
| Prop interfaces | ComponentName + `Props` | `SceneMapperCardProps`, `KanbanCardProps` |

### Import Order

1. External packages (`react`, `expo-*`, `react-native`)
2. Internal components (`../../components/...`)
3. Constants (`../../constants/...`)
4. Hooks (`../../hooks/...`)
5. Lib (`../../lib/...`)
6. Styles (`../../styles/...`)
7. Types (`../../types/...`)

### Anti-Patterns Avoided

- ❌ Runtime values in `types/` (moved to `constants/`)
- ❌ Business logic in data files (extracted to `lib/`)
- ❌ Components defined inside render loops (extracted to module level)
- ❌ Duplicate utility functions across files (single source of truth)
- ❌ Phantom type exports (unused types removed)
- ❌ Mixed-concern barrel files (each barrel exports one layer only)
