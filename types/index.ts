/**
 * ============================================
 * TYPE DEFINITIONS BARREL
 * ============================================
 *
 * Central export point for all application types.
 * This module contains **types only** — no runtime values.
 * For runtime constants, import from `@/constants`.
 *
 * @example
 * ```typescript
 * import type { Scene, Subject, ModuleStatus } from '@/types';
 * ```
 *
 * @module types
 */

// ============================================
// CORE TYPES
// ============================================

export type {
    ChangeHandler,
    ModuleId,
    ModuleProgress,
    ModuleStatus,
    PressHandler,
    VideoProject
} from './core';

// ============================================
// UI COMPONENT TYPES
// ============================================

export type {
    ButtonProps,
    ButtonVariant,
    ModuleCardProps,
    TagProps
} from './ui';

// ============================================
// NAVIGATION TYPES
// ============================================

export type {
    AppRoute,
    BreadcrumbPath,
    NavigationDestination,
    NavigationState,
    ProjectParams,
    RouteParams,
    StyleMatcherQuestionParams,
    StyleResultsParams
} from './navigation';

// ============================================
// SCENE SEGMENTATION TYPES
// ============================================

export type {
    CreateScenePayload,
    CreateSubjectPayload,
    DragDirection,
    DragEdge,
    DragState,
    DragType,
    EditMode,
    Scene,
    SceneSegmentationState,
    SegmentationConfig,
    SegmentationResult,
    Subject,
    SubjectCategory,
    Word,
    WordRange
} from './scene-segmentation';

// ============================================
// SCENE MAPPER GESTURE TYPES
// ============================================

export type {
    ActiveGesture,
    CardLayoutRect,
    DropZoneProps,
    InterruptedCardProps,
    ReorderGestureState,
    SceneHeaderProps,
    SceneMapperCardProps,
    SceneMapperGestureType,
    SplitPhase,
    SplitSpacerProps,
    SplitTarget,
    SwipeDirection,
    SwipeGestureState,
    SwipeableWrapperProps,
    WordLayoutRect,
    WordTokenProps
} from './scene-mapper-gestures';

// ============================================
// STYLE MATCHER TYPES
// ============================================

export type {
    StyleImage,
    StyleMatcherParams,
    StyleMatcherState,
    StyleOption,
    StyleParentQuestion,
    StylePrompt,
    StyleQuestion,
    StyleTags,
    UserChoice
} from './style-matcher';

// ============================================
// KANBAN TYPES
// ============================================

export type {
    KanbanAction,
    KanbanBoardProps,
    KanbanCardProps,
    KanbanColumnProps,
    KanbanContextValue,
    KanbanItem,
    KanbanItemBase,
    KanbanItemMeta,
    KanbanState,
    KanbanStatus,
    KanbanStatusConfig,
    KanbanTabsProps
} from './kanban';

