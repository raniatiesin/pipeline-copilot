---
name: SceneSegmentation provider scope
description: useSceneSegmentation hook is scoped to the scene-segmentation route group only.
---

The `SceneSegmentationProvider` is mounted in `app/scene-segmentation/_layout.tsx`.
Any screen **outside** that route group (e.g. `app/arc-assembler/index.tsx`) that calls
`useSceneSegmentation()` will throw "Invalid hook call" or "must be used within provider".

**Why:** Expo Router wraps each `_layout.tsx` in its own context boundary. Hooks that
depend on a provider mounted in a layout file are only accessible to screens nested
under that layout's route segment.

**How to apply:** Before importing `useSceneSegmentation` in any screen, check that the
screen's file path is under `app/scene-segmentation/`. For screens outside that group
that need scene/entity data, use empty arrays as placeholders until a global state
layer is introduced in a later task.
