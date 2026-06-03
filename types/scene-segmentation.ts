/**
 * ============================================
 * SCENE SEGMENTATION TYPES
 * ============================================
 * 
 * Types for the Scene Segmentation module which handles
 * breaking scripts into visual scenes with subject detection.
 * 
 * Two-stage mapping system:
 * 1. Script Input → User pastes script text
 * 2. Scene Mapper → Drag-and-drop phrases between scene cards
 * 3. Subject Mapper → Highlight and categorize recurring subjects
 * 
 * @module types/scene-segmentation
 */

// ============================================
// WORD & TEXT PRIMITIVES
// ============================================

/**
 * A single word token from the script.
 * Words are the atomic unit of the segmentation system.
 */
export interface Word {
  /** Unique identifier for this word */
  id: string;
  /** The actual text content */
  text: string;
  /** Position index in the original script (0-based) */
  index: number;
}

/**
 * Word range specification for selecting text spans.
 */
export interface WordRange {
  /** Starting word index (inclusive) */
  startIndex: number;
  /** Ending word index (inclusive) */
  endIndex: number;
}

// ============================================
// SUBJECT (VISUAL ELEMENT)
// ============================================

/**
 * A detected or user-defined subject within a scene.
 * Subjects represent visual elements that will be rendered.
 * 
 * Visual states:
 * - pending (orange/dashed): Detected but not yet assigned to a SubjectCategory
 * - assigned (blue/solid): Linked to a SubjectCategory
 */
export interface Subject {
  /** Unique identifier for this subject */
  id: string;
  /** Index of first word in subject (scene-relative) */
  startWordIndex: number;
  /** Index of last word in subject (scene-relative, inclusive) */
  endWordIndex: number;
  /** Combined text of all words in subject */
  text: string;
  /** Whether this subject was manually created by user */
  isManual?: boolean;
  /** Optional label/category for the subject */
  label?: string;
  /** ID of the SubjectCategory this is assigned to (null = pending/unassigned) */
  categoryId?: string | null;
}

/**
 * A subject category card in the bottom panel of Subject Mapper.
 * Groups all related subject highlights together.
 */
export interface SubjectCategory {
  /** Unique identifier */
  id: string;
  /** Display name (auto-generated from first highlight text) */
  name: string;
  /** IDs of all Subject highlights linked to this category */
  subjectIds: string[];
  /** Color for assigned state */
  color?: string;
  /** Creation order */
  order: number;
}

/**
 * Subject creation payload.
 * Used when creating a new subject from user selection.
 */
export interface CreateSubjectPayload {
  sceneId: string;
  startWordIndex: number;
  endWordIndex: number;
}

// ============================================
// SCENE
// ============================================

/**
 * A scene (frame) representing a visual segment of the video.
 * Scenes contain words and detected subjects.
 */
export interface Scene {
  /** Unique identifier for this scene */
  id: string;
  /** Display order (1-based) */
  order: number;
  /** Words contained in this scene */
  words: Word[];
  /** Detected or user-defined subjects */
  subjects: Subject[];
  /** Estimated duration in seconds (based on word count) */
  estimatedDuration?: number;
}

/**
 * Scene creation configuration.
 */
export interface CreateScenePayload {
  words: Word[];
  subjects?: Subject[];
}

// ============================================
// DRAG & DROP STATE
// ============================================

/**
 * Types of drag operations supported.
 */
export type DragType = 'phrase-to-scene' | 'subject-edge' | 'word-vertical' | 'highlight-text';

/**
 * Edge being dragged for subject resizing.
 */
export type DragEdge = 'left' | 'right';

/**
 * Direction for vertical word movement.
 */
export type DragDirection = 'up' | 'down';

/**
 * State for active drag operations.
 * Used to track in-progress drag-and-drop interactions.
 */
export interface DragState {
  /** Type of drag operation */
  type: DragType;
  /** Source scene identifier */
  sourceSceneId: string;
  /** Word index being dragged */
  sourceWordIndex: number;
  /** Which edge is being dragged (for subject resizing) */
  edge?: DragEdge;
  /** Direction of movement (for vertical word movement) */
  direction?: DragDirection;
  /** Target scene ID (for phrase-to-scene drag) */
  targetSceneId?: string;
  /** The phrase/words being dragged */
  draggedText?: string;
}

// ============================================
// EDIT MODES (legacy - kept for backward compat)
// ============================================

/**
 * Current editing mode in the scene editor.
 * - 'scene': User is editing scene boundaries (Scene Mapper)
 * - 'subject': User is editing subject boundaries (Subject Mapper)
 * - null: No active editing mode
 */
export type EditMode = 'scene' | 'subject' | null;

// ============================================
// MODULE STATE
// ============================================

/**
 * Complete state for the Scene Segmentation module.
 * This is managed by the SceneSegmentationContext.
 */
export interface SceneSegmentationState {
  /** Original unprocessed script text */
  originalScript: string;
  /** Processed scenes */
  scenes: Scene[];
  /** Whether auto-segmentation is running */
  isProcessing: boolean;
  /** Current editing mode */
  editMode: EditMode;
  /** Currently selected subject ID */
  selectedSubjectId: string | null;
  /** Currently selected word ID */
  selectedWordId: string | null;
  /** Active drag operation state */
  dragState: DragState | null;
  /** Subject categories for the Subject Mapper */
  subjectCategories: SubjectCategory[];
  /** Currently active pending highlight (word range not yet assigned) */
  pendingHighlight: WordRange | null;
}

// ============================================
// ALGORITHM RESULTS
// ============================================

/**
 * Result from the auto-segmentation algorithm.
 */
export interface SegmentationResult {
  /** Generated scenes */
  scenes: Scene[];
  /** Total word count */
  totalWords: number;
  /** Estimated total video duration in seconds */
  estimatedTotalDuration: number;
}

/**
 * Configuration for auto-segmentation.
 */
export interface SegmentationConfig {
  /** Target words per scene (default: 10) */
  wordsPerScene?: number;
  /** Reading speed in words per second (default: 2.5) */
  wordsPerSecond?: number;
  /** Enable automatic subject detection */
  detectSubjects?: boolean;
}
