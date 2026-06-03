import type { Scene, SegmentationResult, Subject, Word } from '../types';

// ============================================
// CONSTANTS
// ============================================

// Speaking rate: ~150 words/minute = 2.5 words/second
const WORDS_PER_SECOND = 2.5;

// Target scene duration: 3-5 seconds
const MIN_SCENE_DURATION = 3;
const MAX_SCENE_DURATION = 5;

// Word count targets based on duration
const MIN_WORDS_PER_SCENE = Math.floor(MIN_SCENE_DURATION * WORDS_PER_SECOND); // ~8 words
const MAX_WORDS_PER_SCENE = Math.ceil(MAX_SCENE_DURATION * WORDS_PER_SECOND); // ~12 words

// Common phrase boundary markers
const PHRASE_BOUNDARIES = [',', '.', '!', '?', ';', ':', '—', '-', '–'];

// Common English articles, prepositions, and conjunctions (avoid ending scenes on these)
const WEAK_ENDINGS = [
  'a', 'an', 'the', 'and', 'or', 'but', 'of', 'in', 'on', 'at', 'to', 'for',
  'with', 'by', 'from', 'as', 'is', 'was', 'were', 'be', 'been', 'being',
  'that', 'which', 'who', 'whom', 'whose', 'this', 'these', 'those',
];

// Common nouns and subjects that make good visual elements (simplified list)
// In production, this would use ML Kit or similar for better detection
const SUBJECT_INDICATORS = [
  // People
  'man', 'woman', 'boy', 'girl', 'child', 'person', 'people', 'king', 'queen',
  'knight', 'prince', 'princess', 'hero', 'villain', 'warrior', 'soldier',
  // Animals
  'dog', 'cat', 'bird', 'horse', 'dragon', 'wolf', 'bear', 'lion', 'tiger',
  // Places
  'forest', 'castle', 'mountain', 'river', 'ocean', 'sea', 'city', 'town',
  'village', 'house', 'home', 'room', 'garden', 'path', 'road', 'bridge',
  // Objects
  'sword', 'shield', 'crown', 'ring', 'book', 'door', 'window', 'tree',
  'flower', 'star', 'moon', 'sun', 'fire', 'water', 'stone', 'light',
  // Abstract (that can be visualized)
  'time', 'darkness', 'shadow', 'dream', 'magic', 'power', 'love', 'hope',
];

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Generate a unique ID.
 */
export function generateId(): string {
  return `id_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Clean and tokenize text into words
 */
export function tokenize(text: string): string[] {
  return text
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .split(/\s+/)
    .filter(word => word.trim().length > 0);
}

/**
 * Create Word objects from tokens
 */
export function createWords(tokens: string[]): Word[] {
  return tokens.map((text, index) => ({
    id: generateId(),
    text,
    index,
  }));
}

/**
 * Check if a word ends with a phrase boundary
 */
function hasPhraseBreak(word: string): boolean {
  return PHRASE_BOUNDARIES.some(marker => word.endsWith(marker));
}

/**
 * Check if a word is a weak ending (articles, prepositions, etc.)
 */
function isWeakEnding(word: string): boolean {
  const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
  return WEAK_ENDINGS.includes(cleaned);
}

/**
 * Check if a word likely represents a visual subject
 */
function isLikelySubject(word: string): boolean {
  const cleaned = word.toLowerCase().replace(/[^\w]/g, '');
  return SUBJECT_INDICATORS.includes(cleaned);
}

/**
 * Calculate estimated duration based on word count
 */
export function estimateDuration(wordCount: number): number {
  return wordCount / WORDS_PER_SECOND;
}

// ============================================
// AUTO-SEGMENTATION (HYBRID APPROACH)
// ============================================

/**
 * Find the best break point within a range of words
 * Prioritizes: phrase boundaries > strong endings > target word count
 */
function findBestBreakPoint(words: Word[], startIndex: number, minIndex: number, maxIndex: number): number {
  // First, look for phrase boundaries
  for (let i = maxIndex; i >= minIndex; i--) {
    if (hasPhraseBreak(words[i].text)) {
      return i;
    }
  }

  // Next, find a strong ending (not articles/prepositions)
  for (let i = maxIndex; i >= minIndex; i--) {
    if (!isWeakEnding(words[i].text)) {
      return i;
    }
  }

  // Fall back to max target
  return maxIndex;
}

/**
 * Hybrid auto-segmentation algorithm
 * - Targets 8-12 words per scene (3-5 seconds)
 * - Respects natural phrase boundaries
 * - Ensures each segment can have visual elements
 */
export function autoSegment(script: string): SegmentationResult {
  const tokens = tokenize(script);
  const words = createWords(tokens);
  
  if (words.length === 0) {
    return {
      scenes: [],
      totalWords: 0,
      estimatedTotalDuration: 0,
    };
  }

  const scenes: Scene[] = [];
  let currentIndex = 0;
  let sceneOrder = 1;

  while (currentIndex < words.length) {
    const remainingWords = words.length - currentIndex;
    
    // Determine target range for this scene
    let minEnd = currentIndex + MIN_WORDS_PER_SCENE - 1;
    let maxEnd = currentIndex + MAX_WORDS_PER_SCENE - 1;
    
    // Adjust if we're near the end
    if (remainingWords <= MAX_WORDS_PER_SCENE) {
      // Take all remaining words
      maxEnd = words.length - 1;
      minEnd = Math.min(minEnd, maxEnd);
    }
    
    // Clamp to valid range
    minEnd = Math.max(currentIndex, Math.min(minEnd, words.length - 1));
    maxEnd = Math.min(maxEnd, words.length - 1);
    
    // Find the best break point
    const breakPoint = findBestBreakPoint(words, currentIndex, minEnd, maxEnd);
    
    // Extract words for this scene
    const sceneWords = words.slice(currentIndex, breakPoint + 1);
    
    // Detect subjects in this scene
    const subjects = detectSubjects(sceneWords);
    
    // Create the scene
    scenes.push({
      id: generateId(),
      order: sceneOrder,
      words: sceneWords,
      subjects,
      estimatedDuration: estimateDuration(sceneWords.length),
    });
    
    currentIndex = breakPoint + 1;
    sceneOrder++;
  }

  return {
    scenes,
    totalWords: words.length,
    estimatedTotalDuration: estimateDuration(words.length),
  };
}

// ============================================
// SUBJECT DETECTION
// ============================================

/**
 * Detect visual subjects within a list of words
 * Creates Subject objects for words that likely represent visual elements
 */
export function detectSubjects(words: Word[]): Subject[] {
  const subjects: Subject[] = [];
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    
    if (isLikelySubject(word.text)) {
      // Check if there's an adjective before (e.g., "brave knight")
      let startIndex = i;
      if (i > 0) {
        const prevWord = words[i - 1].text.toLowerCase().replace(/[^\w]/g, '');
        // Simple heuristic: if previous word isn't a weak word and isn't a subject itself
        if (!isWeakEnding(words[i - 1].text) && !isLikelySubject(words[i - 1].text)) {
          startIndex = i - 1;
        }
      }
      
      // Get the relative indices within this word array
      const relativeStartIndex = words[startIndex].index;
      const relativeEndIndex = word.index;
      
      // Build the text
      const subjectWords = words.slice(startIndex, i + 1);
      const text = subjectWords.map(w => w.text).join(' ');
      
      subjects.push({
        id: generateId(),
        startWordIndex: relativeStartIndex,
        endWordIndex: relativeEndIndex,
        text,
      });
    }
  }
  
  return subjects;
}

/**
 * Re-detect subjects for a scene after words have changed
 */
export function redetectSubjects(scene: Scene): Scene {
  return {
    ...scene,
    subjects: detectSubjects(scene.words),
  };
}

// ============================================
// SCENE MANIPULATION UTILITIES
// ============================================

/**
 * Get the full text of a scene
 */
export function getSceneText(scene: Scene): string {
  return scene.words.map(w => w.text).join(' ');
}

function partitionSubjectsBySplit(
  subjects: Subject[],
  splitAtWordIndex: number,
): {
  firstSubjects: Subject[];
  secondSubjects: Subject[];
  hasCrossingSubjects: boolean;
} {
  const firstSubjects: Subject[] = [];
  const secondSubjects: Subject[] = [];
  let hasCrossingSubjects = false;

  subjects.forEach((subject) => {
    if (subject.endWordIndex < splitAtWordIndex) {
      firstSubjects.push(subject);
      return;
    }
    if (subject.startWordIndex >= splitAtWordIndex) {
      secondSubjects.push(subject);
      return;
    }
    hasCrossingSubjects = true;
  });

  return {
    firstSubjects,
    secondSubjects,
    hasCrossingSubjects,
  };
}

/**
 * Split a scene at a word index
 * Returns [sceneBeforeSplit, sceneAfterSplit]
 */
export function splitScene(scene: Scene, splitAtWordIndex: number): [Scene, Scene] {
  const wordIdx = scene.words.findIndex(w => w.index === splitAtWordIndex);
  
  if (wordIdx <= 0 || wordIdx >= scene.words.length) {
    // Can't split at invalid position
    return [scene, { ...scene, id: generateId(), words: [], subjects: [], order: scene.order + 1 }];
  }
  
  const firstWords = scene.words.slice(0, wordIdx);
  const secondWords = scene.words.slice(wordIdx);

  const {
    firstSubjects,
    secondSubjects,
    hasCrossingSubjects,
  } = partitionSubjectsBySplit(scene.subjects, splitAtWordIndex);

  const resolvedFirstSubjects = hasCrossingSubjects
    ? detectSubjects(firstWords)
    : firstSubjects;
  const resolvedSecondSubjects = hasCrossingSubjects
    ? detectSubjects(secondWords)
    : secondSubjects;
  
  const firstScene: Scene = {
    ...scene,
    words: firstWords,
    subjects: resolvedFirstSubjects,
    estimatedDuration: estimateDuration(firstWords.length),
  };
  
  const secondScene: Scene = {
    id: generateId(),
    order: scene.order + 1,
    words: secondWords,
    subjects: resolvedSecondSubjects,
    estimatedDuration: estimateDuration(secondWords.length),
  };
  
  return [firstScene, secondScene];
}

/**
 * Merge two consecutive scenes
 */
export function mergeScenes(scene1: Scene, scene2: Scene): Scene {
  const mergedWords = [...scene1.words, ...scene2.words];
  
  return {
    id: scene1.id,
    order: scene1.order,
    words: mergedWords,
    subjects: detectSubjects(mergedWords),
    estimatedDuration: estimateDuration(mergedWords.length),
  };
}

/**
 * Move words from one scene to another
 * @param fromScene - Source scene
 * @param toScene - Destination scene
 * @param fromWordIndex - Starting word index to move (inclusive)
 * @param direction - 'start' adds to beginning, 'end' adds to end
 */
export function moveWords(
  fromScene: Scene,
  toScene: Scene,
  fromWordIndex: number,
  direction: 'up' | 'down'
): [Scene, Scene] {
  const wordIdx = fromScene.words.findIndex(w => w.index === fromWordIndex);
  
  if (wordIdx < 0) {
    return [fromScene, toScene];
  }
  
  let movedWords: Word[];
  let remainingWords: Word[];
  
  if (direction === 'down') {
    // Moving word and everything after to next scene
    movedWords = fromScene.words.slice(wordIdx);
    remainingWords = fromScene.words.slice(0, wordIdx);
  } else {
    // Moving everything up to and including word to previous scene
    movedWords = fromScene.words.slice(0, wordIdx + 1);
    remainingWords = fromScene.words.slice(wordIdx + 1);
  }
  
  const updatedFromScene: Scene = {
    ...fromScene,
    words: remainingWords,
    subjects: detectSubjects(remainingWords),
    estimatedDuration: estimateDuration(remainingWords.length),
  };
  
  const newToWords = direction === 'down'
    ? [...movedWords, ...toScene.words]
    : [...toScene.words, ...movedWords];
  
  const updatedToScene: Scene = {
    ...toScene,
    words: newToWords,
    subjects: detectSubjects(newToWords),
    estimatedDuration: estimateDuration(newToWords.length),
  };
  
  return [updatedFromScene, updatedToScene];
}

/**
 * Update scene orders after modifications.
 * Reference-stable: only creates a new object when the order actually changes,
 * preserving identity for downstream React.memo / useMemo comparisons.
 */
export function reorderScenes(scenes: Scene[]): Scene[] {
  return scenes.map((scene, index) => {
    const newOrder = index + 1;
    if (scene.order === newOrder) return scene;
    return { ...scene, order: newOrder };
  });
}

/**
 * Expand or contract a subject box
 */
export function updateSubjectBounds(
  scene: Scene,
  subjectId: string,
  newStartIndex: number,
  newEndIndex: number
): Scene {
  const updatedSubjects = scene.subjects.map(subject => {
    if (subject.id !== subjectId) return subject;
    
    // Find the words for the new bounds
    const startWord = scene.words.find(w => w.index === newStartIndex);
    const endWord = scene.words.find(w => w.index === newEndIndex);
    
    if (!startWord || !endWord) return subject;
    
    const startIdx = scene.words.indexOf(startWord);
    const endIdx = scene.words.indexOf(endWord);
    
    const subjectWords = scene.words.slice(startIdx, endIdx + 1);
    
    return {
      ...subject,
      startWordIndex: newStartIndex,
      endWordIndex: newEndIndex,
      text: subjectWords.map(w => w.text).join(' '),
    };
  });
  
  return {
    ...scene,
    subjects: updatedSubjects,
  };
}

/**
 * Add a manual subject from selected words
 */
export function addManualSubject(
  scene: Scene,
  startWordIndex: number,
  endWordIndex: number
): Scene {
  const startWord = scene.words.find(w => w.index === startWordIndex);
  const endWord = scene.words.find(w => w.index === endWordIndex);
  
  if (!startWord || !endWord) return scene;
  
  const startIdx = scene.words.indexOf(startWord);
  const endIdx = scene.words.indexOf(endWord);
  const subjectWords = scene.words.slice(startIdx, endIdx + 1);
  
  const newSubject: Subject = {
    id: generateId(),
    startWordIndex,
    endWordIndex,
    text: subjectWords.map(w => w.text).join(' '),
    isManual: true,
  };
  
  return {
    ...scene,
    subjects: [...scene.subjects, newSubject],
  };
}

/**
 * Remove a subject from a scene
 */
export function removeSubject(scene: Scene, subjectId: string): Scene {
  return {
    ...scene,
    subjects: scene.subjects.filter(s => s.id !== subjectId),
  };
}

// ============================================
// SCENE MAPPER: SPLIT & MOVE
// ============================================

/**
 * Split words out of a scene and move them to a new or neighboring scene.
 * This is the core operation behind the Scene Mapper's long-press interaction.
 *
 * Direction determines everything:
 * - 'up': selects words[0..wordIndex], destination is before/above
 *   - 'new': creates a new scene inserted before the source
 *   - 'neighbor': appends selected words to the END of the previous scene
 * - 'down': selects words[wordIndex..last], destination is after/below
 *   - 'new': creates a new scene inserted after the source
 *   - 'neighbor': prepends selected words to the BEGINNING of the next scene
 *
 * Empty scenes are automatically filtered out and all orders recalculated.
 */
export function splitAndMove(
  scenes: Scene[],
  sourceSceneId: string,
  wordIndex: number,
  direction: 'up' | 'down',
  destination: 'new' | 'neighbor'
): Scene[] {
  const sourceIdx = scenes.findIndex(s => s.id === sourceSceneId);
  if (sourceIdx < 0) return scenes;

  const source = scenes[sourceIdx];
  const wordIdx = source.words.findIndex(w => w.index === wordIndex);
  if (wordIdx < 0) return scenes;

  // Determine which words move and which stay
  let movedWords: Word[];
  let remainingWords: Word[];

  if (direction === 'down') {
    movedWords = source.words.slice(wordIdx);
    remainingWords = source.words.slice(0, wordIdx);
  } else {
    movedWords = source.words.slice(0, wordIdx + 1);
    remainingWords = source.words.slice(wordIdx + 1);
  }

  if (movedWords.length === 0) return scenes;

  // Update the source scene (may become empty → filtered later)
  const updatedSource: Scene = {
    ...source,
    words: remainingWords,
    subjects: detectSubjects(remainingWords),
    estimatedDuration: estimateDuration(remainingWords.length),
  };

  const newScenes = [...scenes];
  newScenes[sourceIdx] = updatedSource;

  if (destination === 'new') {
    // Create a brand new scene with the moved words
    const newScene: Scene = {
      id: generateId(),
      order: 0, // Will be recalculated by reorderScenes
      words: movedWords,
      subjects: detectSubjects(movedWords),
      estimatedDuration: estimateDuration(movedWords.length),
    };
    // UP → insert before source, DOWN → insert after source
    const insertIdx = direction === 'up' ? sourceIdx : sourceIdx + 1;
    newScenes.splice(insertIdx, 0, newScene);
  } else {
    // Move to the neighboring scene
    const neighborIdx = direction === 'up' ? sourceIdx - 1 : sourceIdx + 1;
    if (neighborIdx < 0 || neighborIdx >= newScenes.length) return scenes;

    const neighbor = newScenes[neighborIdx];
    // UP → append to END of previous scene
    // DOWN → prepend to BEGINNING of next scene
    const mergedWords = direction === 'down'
      ? [...movedWords, ...neighbor.words]
      : [...neighbor.words, ...movedWords];

    newScenes[neighborIdx] = {
      ...neighbor,
      words: mergedWords,
      subjects: detectSubjects(mergedWords),
      estimatedDuration: estimateDuration(mergedWords.length),
    };
  }

  return reorderScenes(newScenes.filter(s => s.words.length > 0));
}
