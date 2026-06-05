---
name: Project-level KanbanItem pattern
description: How to create project-level items in useKanban without breaking stage-card unlock logic.
---

Stage cards use `MODULE_ORDER` (`style-selector`, `beat-butcher`, `entity-editor`, `arc-assembler`)
to determine unlock chain. Non-stage items (e.g. project cards in the Projects Kanban) must:

1. Use `moduleId: 'project'` (or any string NOT in MODULE_ORDER).
   - `isModuleUnlocked` returns `true` for `indexOf === -1`, so project items are always unlocked.
2. Use `progress: 10` (1–99) to force `deriveStatus` to return `IN_PROGRESS`.
   - Per master doc §8: new projects go directly to In Progress on creation.
   - `progress: 0` + unlocked → `UP_NEXT` (wrong). `progress: 10` → `IN_PROGRESS` (correct).

**Why:** `applyDerivedStatuses` recalculates every item's status on every state change,
ignoring the `status` field set at creation. Setting `progress: 10` is the only way to
force IN_PROGRESS without bypassing the auto-derivation logic.

**How to apply:** Any time a new top-level concept is added to the kanban (not a stage card),
use a moduleId outside MODULE_ORDER and set an initial progress value that maps to the
desired starting status.
