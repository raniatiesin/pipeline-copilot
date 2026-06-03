/**
 * ============================================
 * SCENE MAPPER SUB-COMPONENTS — BARREL EXPORT
 * ============================================
 *
 * Modular building blocks for the Scene Mapper card:
 *
 * Gesture layers:
 * - WordToken         → Single interactive word with long-press detection
 * - SwipeableWrapper  → Horizontal swipe-to-merge handler
 * - SceneHeader       → Header with drag-to-reorder long-press
 *
 * Interrupt & Drop split:
 * - InterruptedCard   → Overlapping card that separates on drag
 *
 * Structural:
 * - DropZone     → Reorder drop target between cards
 *
 * Composite:
 * - SceneMapperCard → Assembles all sub-components
 *
 * @module components/scene-segmentation/scene-mapper
 */

// Gesture layers
export { SceneHeader } from './SceneHeader';
export { SwipeableWrapper } from './SwipeableWrapper';
export { WordToken } from './WordToken';

// Split overlay
export { InterruptedCard } from './InterruptedCard';

// Structural
export { DropZone } from './DropZone';

// Composite
export { SceneMapperCard } from './SceneMapperCard';
