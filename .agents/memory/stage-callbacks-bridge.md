---
name: Stage callbacks bridge
description: Pattern for calling markInReview from work screens into the Stages KanbanProvider without a shared context.
---

Work screens (beat-butcher, entity-editor) live in a different route tree than
`app/stages.tsx`, which owns its own `KanbanProvider`. To let work screens call
`markInReview` on that provider without a new global store or library:

- `lib/stageCallbacks.ts` — module-level mutable ref that holds the callback.
- `stages.tsx` → `StagesContent` registers `stageCallbacks.setMarkInReview(markInReview)` in a `useEffect`, clears it on unmount.
- Work screens call `stageCallbacks.markInReview(moduleId)` in their `handleContinue`.

**Why:** Expo Router route groups create separate navigator trees. A hook that reads
from a `KanbanProvider` mounted in `stages.tsx` is not accessible from screens under
`app/scene-segmentation/`. No new library is needed for a single shared callback.

**How to apply:** Extend `stageCallbacks` with additional named callbacks if more
cross-route events are needed (e.g. `markDone`). Keep the bridge thin — only put
fire-and-forget calls here, never query return values.

**Navigation after calling markInReview:** Work screens call `router.back()` after
`markInReview`. From beat-butcher the user lands on input (one hop), from entity-editor
they land directly on stages (one hop). Proper "back to stages" navigation will be
cleaned up in 2A when the full stage flow is built.
