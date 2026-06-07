/**
 * ============================================
 * ENTITY EDITOR — SUBJECT IDENTIFICATION
 * ============================================
 *
 * Two-pane screen for tagging recurring subjects
 * (people, objects, concepts) across all scenes.
 *
 * Top pane  — horizontal scene strip; tap words to highlight
 * Bottom pane — subject profiles panel (categories + naming)
 *
 * Interaction model:
 *   1. Tap any word → anchors selection (amber)
 *   2. Tap second word in same scene → opens naming bar
 *   3. Name the subject OR assign to existing profile
 *   4. Profile appears in bottom panel with brand color swatch
 *   5. Long-press profile name to rename; × to delete
 *
 * @module app/scene-segmentation/entity-editor
 */

import { router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';

import { Line } from '../../components/ui/Line';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { THE_LINE } from '../../constants/line';
import { borderRadius, colors, spacing, typography } from '../../constants/theme';
import { useEntityEditor, getSubjectColor, SUBJECT_COLORS } from '../../hooks/useEntityEditor';
import { useSceneSegmentation } from '../../hooks/useSceneSegmentation';
import { stageCallbacks } from '../../lib/stageCallbacks';
import { updateProject, watchProject } from '../../lib/database';
import { parseScenes, parseSubjectCategories } from '../../lib/arcAssembler';
import type { Scene, Subject, SubjectCategory } from '../../types';

// ============================================
// CONSTANTS
// ============================================

const SCENE_MIN_WIDTH = 200;
const SCENE_HEADER_HEIGHT = 36;

// ============================================
// HELPERS
// ============================================

interface WordSubjectInfo {
  subject: Subject;
  color: string;
  isAssigned: boolean;
}

function getWordSubjectInfo(
  scene: Scene,
  wordIdx: number,
  categories: SubjectCategory[],
): WordSubjectInfo | null {
  const subject = scene.subjects.find(
    s => wordIdx >= s.startWordIndex && wordIdx <= s.endWordIndex,
  );
  if (!subject) return null;
  const cat = subject.categoryId
    ? categories.find(c => c.id === subject.categoryId)
    : null;
  const color = cat ? getSubjectColor(cat.order) : '#e8824f';
  return { subject, color, isAssigned: !!cat };
}

// ============================================
// WORD TOKEN
// ============================================

interface WordTokenProps {
  text: string;
  isSelectionAnchor: boolean;
  isPendingRange: boolean;
  subjectInfo: WordSubjectInfo | null;
  onPress: () => void;
}

const WordToken = React.memo(function WordToken({
  text,
  isSelectionAnchor,
  isPendingRange,
  subjectInfo,
  onPress,
}: WordTokenProps) {
  let bgColor = 'transparent';
  let borderColor = 'transparent';
  let textColor = colors.text.primary;

  if (isSelectionAnchor) {
    bgColor = '#ffc22acc';
    borderColor = '#ffc22a';
  } else if (isPendingRange) {
    bgColor = '#ffc22a55';
    borderColor = '#ffc22a';
  } else if (subjectInfo) {
    bgColor = subjectInfo.color + '30';
    borderColor = subjectInfo.isAssigned ? subjectInfo.color : '#e8824f';
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.wordToken,
        { backgroundColor: bgColor, borderColor },
        borderColor !== 'transparent' && styles.wordTokenHighlighted,
      ]}
    >
      <Text style={[styles.wordText, { color: textColor }]}>{text}</Text>
    </TouchableOpacity>
  );
});

// ============================================
// SCENE COLUMN
// ============================================

interface SceneColumnProps {
  scene: Scene;
  categories: SubjectCategory[];
  selectionAnchorWordIdx: number | null;
  pendingSceneId: string | null;
  pendingStartIdx: number | null;
  pendingEndIdx: number | null;
  onWordTap: (sceneId: string, wordIdx: number, wordText: string) => void;
}

const SceneColumn = React.memo(function SceneColumn({
  scene,
  categories,
  selectionAnchorWordIdx,
  pendingSceneId,
  pendingStartIdx,
  pendingEndIdx,
  onWordTap,
}: SceneColumnProps) {
  const isPending = pendingSceneId === scene.id;

  return (
    <View style={styles.sceneColumn}>
      <View style={styles.sceneHeader}>
        <Text style={styles.sceneHeaderLabel}>Scene {scene.order}</Text>
        <Text style={styles.sceneHeaderMeta}>{scene.words.length}w</Text>
      </View>

      <Line orientation="horizontal" weight="hairline" color={THE_LINE.color} />

      <View style={styles.wordsArea}>
        {scene.words.map(word => {
          const isAnchor = selectionAnchorWordIdx === word.index;
          const inRange =
            isPending &&
            pendingStartIdx !== null &&
            pendingEndIdx !== null &&
            word.index >= pendingStartIdx &&
            word.index <= pendingEndIdx;

          const subjectInfo = getWordSubjectInfo(scene, word.index, categories);

          return (
            <WordToken
              key={word.id}
              text={word.text}
              isSelectionAnchor={isAnchor}
              isPendingRange={inRange}
              subjectInfo={subjectInfo}
              onPress={() => onWordTap(scene.id, word.index, word.text)}
            />
          );
        })}

        {scene.words.length === 0 && (
          <Text style={styles.emptySceneText}>empty scene</Text>
        )}
      </View>
    </View>
  );
});

// ============================================
// NAMING BAR
// ============================================

interface NamingBarProps {
  suggestedName: string;
  suggestions: SubjectCategory[];
  onConfirmNew: (name: string) => void;
  onAssignExisting: (name: string, categoryId: string) => void;
  onCancel: () => void;
}

function NamingBar({
  suggestedName,
  suggestions,
  onConfirmNew,
  onAssignExisting,
  onCancel,
}: NamingBarProps) {
  const [name, setName] = useState(suggestedName);

  return (
    <View style={styles.namingBar}>
      <View style={styles.namingBarHeader}>
        <Text style={styles.namingBarTitle}>Name this subject</Text>
        <TouchableOpacity onPress={onCancel} style={styles.namingCancelBtn}>
          <Text style={styles.namingCancelText}>✕ Cancel</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.namingInput}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Speaker, Product Logo, Slide"
        placeholderTextColor={colors.text.muted}
        autoFocus
        returnKeyType="done"
        onSubmitEditing={() => name.trim() && onConfirmNew(name)}
        selectTextOnFocus
      />

      {suggestions.length > 0 && (
        <View style={styles.suggestionRow}>
          <Text style={styles.suggestionLabel}>Add to existing:</Text>
          {suggestions.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[styles.suggestionChip, { borderColor: getSubjectColor(cat.order) }]}
              onPress={() => onAssignExisting(name, cat.id)}
            >
              <View style={[styles.suggestionDot, { backgroundColor: getSubjectColor(cat.order) }]} />
              <Text style={styles.suggestionChipText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.confirmBtn, !name.trim() && styles.confirmBtnDisabled]}
        onPress={() => name.trim() && onConfirmNew(name)}
        disabled={!name.trim()}
      >
        <Text style={styles.confirmBtnText}>
          {suggestions.length > 0 ? 'Create New Profile' : 'Add Subject'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ============================================
// PROFILE CARD
// ============================================

interface ProfileCardProps {
  category: SubjectCategory;
  isEditing: boolean;
  editingName: string;
  onEditNameChange: (name: string) => void;
  onEditConfirm: () => void;
  onEditCancel: () => void;
  onLongPress: () => void;
  onDelete: () => void;
  appearanceCount: number;
}

const ProfileCard = React.memo(function ProfileCard({
  category,
  isEditing,
  editingName,
  onEditNameChange,
  onEditConfirm,
  onEditCancel,
  onLongPress,
  onDelete,
  appearanceCount,
}: ProfileCardProps) {
  const color = getSubjectColor(category.order);

  return (
    <View style={styles.profileCard}>
      <View style={[styles.profileSwatch, { backgroundColor: color }]} />

      <View style={styles.profileContent}>
        {isEditing ? (
          <TextInput
            style={styles.profileEditInput}
            value={editingName}
            onChangeText={onEditNameChange}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={onEditConfirm}
            selectTextOnFocus
          />
        ) : (
          <TouchableOpacity onLongPress={onLongPress} delayLongPress={400}>
            <Text style={styles.profileName} numberOfLines={1}>{category.name}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.profileMeta}>
          {category.subjectIds.length} highlight{category.subjectIds.length !== 1 ? 's' : ''}
          {appearanceCount > 0 ? ` · ${appearanceCount} scene${appearanceCount !== 1 ? 's' : ''}` : ''}
        </Text>
      </View>

      {isEditing ? (
        <View style={styles.profileEditActions}>
          <TouchableOpacity style={styles.profileEditBtn} onPress={onEditConfirm}>
            <Text style={styles.profileEditBtnText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.profileEditBtn} onPress={onEditCancel}>
            <Text style={styles.profileEditBtnTextCancel}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={styles.profileDeleteBtn} onPress={onDelete}>
          <Text style={styles.profileDeleteText}>×</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

// ============================================
// EMPTY STATES
// ============================================

function EmptyScenes() {
  return (
    <View style={styles.emptyCenter}>
      <Text style={styles.emptyTitle}>No scenes yet</Text>
      <Text style={styles.emptyBody}>
        Process a script in Beat Butcher first to generate scenes for subject tagging.
      </Text>
    </View>
  );
}

function EmptyProfiles() {
  return (
    <View style={styles.emptyProfiles}>
      <Text style={styles.emptyProfilesTitle}>No subjects tagged</Text>
      <Text style={styles.emptyProfilesBody}>
        Tap a word above to start, then tap a second word to select a range and name it.
      </Text>
    </View>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

export default function EntityEditorScreen() {
  const { height: windowHeight } = useWindowDimensions();
  const stripHeight = Math.max(240, Math.round(windowHeight * 0.42));
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();

  // Mark this card IN_PROGRESS when screen first opens (UP_NEXT → IN_PROGRESS)
  useEffect(() => {
    stageCallbacks.markInProgress('entity-editor');
  }, []);

  const { state, setScenes, setSubjectCategories } = useSceneSegmentation();
  const editor = useEntityEditor();

  // ── Load beat_butcher_output from DB on mount ─────────────────────
  // Mirrors useArcAssembler pattern exactly: single-shot watchProject read.
  useEffect(() => {
    if (!projectId) return;
    let aborted = false;

    const run = async () => {
      for await (const rows of watchProject(projectId)) {
        if (aborted) break;
        const row = rows[0];
        if (row) {
          // Only seed if the context is empty (avoid overwriting in-session edits)
          if (state.scenes.length === 0) {
            const parsedScenes = parseScenes(row.beat_butcher_output);
            setScenes(parsedScenes);
          }
          if (state.subjectCategories.length === 0 && row.entity_editor_output) {
            const parsedCategories = parseSubjectCategories(row.entity_editor_output);
            setSubjectCategories(parsedCategories);
          }
        }
        // Single-shot — break after first emission
        break;
      }
    };

    run().catch(err => console.error('[EntityEditor] failed to load from DB:', err));
    return () => { aborted = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleContinue = useCallback(async () => {
    if (state.subjectCategories.length === 0) {
      Alert.alert(
        'No subjects tagged',
        'Tag at least one recurring subject before continuing.',
        [{ text: 'OK' }],
      );
      return;
    }
    // Save subject categories to DB so Arc Assembler can read them
    if (projectId) {
      try {
        await updateProject(projectId, {
          entity_editor_output: JSON.stringify(state.subjectCategories),
        });
      } catch (err) {
        console.error('[EntityEditor] failed to save output:', err);
      }
    }
    stageCallbacks.markInReview('entity-editor');
    router.back();
  }, [state.subjectCategories, projectId]);

  // ----------------------------------------
  // Derive appearance counts per category
  // ----------------------------------------
  const appearanceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const scene of state.scenes) {
      const seenCats = new Set<string>();
      for (const subject of scene.subjects) {
        if (subject.categoryId && !seenCats.has(subject.categoryId)) {
          seenCats.add(subject.categoryId);
          counts[subject.categoryId] = (counts[subject.categoryId] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [state.scenes]);

  // ----------------------------------------
  // Naming bar handlers
  // ----------------------------------------
  const handleConfirmNew = useCallback((name: string) => {
    editor.confirmSubject(name);
  }, [editor]);

  const handleAssignExisting = useCallback((name: string, categoryId: string) => {
    editor.confirmSubject(name, categoryId);
  }, [editor]);

  // ----------------------------------------
  // Profile card handlers
  // ----------------------------------------
  const handleDeleteCategory = useCallback((catId: string, name: string) => {
    Alert.alert(
      `Delete "${name}"?`,
      'All highlights in this profile will be untagged.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => editor.handleDeleteCategory(catId),
        },
      ],
    );
  }, [editor]);

  // ----------------------------------------
  // Render profile card item
  // ----------------------------------------
  const renderProfile = useCallback(({ item }: { item: SubjectCategory }) => (
    <ProfileCard
      key={item.id}
      category={item}
      isEditing={editor.editingCategoryId === item.id}
      editingName={editor.editingName}
      onEditNameChange={editor.setEditingName}
      onEditConfirm={editor.confirmEditCategory}
      onEditCancel={editor.cancelEditCategory}
      onLongPress={() => editor.startEditCategory(item.id, item.name)}
      onDelete={() => handleDeleteCategory(item.id, item.name)}
      appearanceCount={appearanceCounts[item.id] ?? 0}
    />
  ), [editor, appearanceCounts, handleDeleteCategory]);

  // ----------------------------------------
  // Naming suggestions
  // ----------------------------------------
  const suggestions = useMemo(
    () => editor.namingState ? editor.getSuggestions(editor.namingState.suggestedName) : [],
    [editor],
  );

  // ----------------------------------------
  // Selection anchor info
  // ----------------------------------------
  const selectionAnchorInfo = editor.selectionStart;
  const namingState = editor.namingState;

  // ----------------------------------------
  // Scene count badge
  // ----------------------------------------
  const profileCount = state.subjectCategories.length;

  return (
    <ScreenLayout
      tabs={[
        { label: 'Projects', route: '/project' },
        { label: 'Stages', route: '/stages' },
        { label: 'Entity Editor', route: '/scene-segmentation/entity-editor' },
      ]}
      title="Entity Editor"
      progress={66}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <View style={styles.root}>

        {/* ---- SCENE STRIP ---- */}
        {state.scenes.length === 0 ? (
          <View style={[styles.sceneStripContainer, styles.sceneStripEmpty, { height: stripHeight }]}>
            <EmptyScenes />
          </View>
        ) : (
          <View style={[styles.sceneStripContainer, { height: stripHeight }]}>
            {selectionAnchorInfo && (
              <View style={styles.selectionHint}>
                <Text style={styles.selectionHintText}>
                  Tap a second word in the same scene to complete selection
                </Text>
                <TouchableOpacity onPress={editor.cancelSelection}>
                  <Text style={styles.selectionHintCancel}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <FlatList
              data={state.scenes}
              horizontal
              keyExtractor={s => s.id}
              showsHorizontalScrollIndicator
              ItemSeparatorComponent={() => (
                <Line orientation="vertical" weight="hairline" color={THE_LINE.color} style={styles.sceneDivider} />
              )}
              renderItem={({ item: scene }) => (
                <SceneColumn
                  scene={scene}
                  categories={state.subjectCategories}
                  selectionAnchorWordIdx={
                    selectionAnchorInfo?.sceneId === scene.id
                      ? selectionAnchorInfo.wordIdx
                      : null
                  }
                  pendingSceneId={namingState?.sceneId ?? null}
                  pendingStartIdx={namingState?.startWordIdx ?? null}
                  pendingEndIdx={namingState?.endWordIdx ?? null}
                  onWordTap={editor.handleWordTap}
                />
              )}
              contentContainerStyle={styles.sceneStripContent}
            />
          </View>
        )}

        <Line orientation="horizontal" weight="base" color={THE_LINE.color} />

        {/* ---- SUBJECT PROFILES PANEL ---- */}
        <View style={styles.profilesPanel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Subject Profiles</Text>
            {profileCount > 0 && (
              <View style={styles.profileCountBadge}>
                <Text style={styles.profileCountText}>{profileCount}</Text>
              </View>
            )}
          </View>

          {namingState && (
            <NamingBar
              suggestedName={namingState.suggestedName}
              suggestions={suggestions}
              onConfirmNew={handleConfirmNew}
              onAssignExisting={handleAssignExisting}
              onCancel={editor.cancelSelection}
            />
          )}

          {profileCount === 0 && !namingState ? (
            <EmptyProfiles />
          ) : (
            <FlatList
              data={state.subjectCategories}
              keyExtractor={c => c.id}
              renderItem={renderProfile}
              contentContainerStyle={styles.profileListContent}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

      </View>
    </ScreenLayout>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Scene strip
  sceneStripContainer: {
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  sceneStripEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  sceneStripContent: {
    flexGrow: 1,
  },
  selectionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#ffc22a22',
    borderBottomWidth: 1,
    borderBottomColor: '#ffc22a',
  },
  selectionHintText: {
    ...typography.caption,
    color: colors.text.secondary,
    flex: 1,
  },
  selectionHintCancel: {
    ...typography.body,
    color: colors.text.secondary,
    paddingLeft: spacing.sm,
  },

  // Scene column
  sceneColumn: {
    minWidth: SCENE_MIN_WIDTH,
    backgroundColor: colors.surface,
  },
  sceneHeader: {
    height: SCENE_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surfaceMuted,
  },
  sceneHeaderLabel: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '700',
  },
  sceneHeaderMeta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  wordsArea: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: spacing.sm,
    alignContent: 'flex-start',
    gap: 4,
  },
  sceneDivider: {
    alignSelf: 'stretch',
  },
  emptySceneText: {
    ...typography.caption,
    color: colors.text.muted,
    fontStyle: 'italic',
  },

  // Word token
  wordToken: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: 2,
    marginBottom: 2,
  },
  wordTokenHighlighted: {
    borderWidth: 1,
  },
  wordText: {
    ...typography.caption,
    fontSize: 12,
  },

  // Profiles panel
  profilesPanel: {
    flex: 1,
    backgroundColor: colors.background,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
  },
  panelTitle: {
    ...typography.overline,
    color: colors.text.primary,
    fontWeight: '700',
  },
  profileCountBadge: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  profileCountText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '700',
    fontSize: 11,
  },

  // Naming bar
  namingBar: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    padding: spacing.md,
    gap: spacing.sm,
  },
  namingBarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  namingBarTitle: {
    ...typography.overline,
    color: colors.text.primary,
    fontWeight: '700',
  },
  namingCancelBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  namingCancelText: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  namingInput: {
    ...typography.body,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  suggestionLabel: {
    ...typography.caption,
    color: colors.text.muted,
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: 4,
  },
  suggestionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  suggestionChipText: {
    ...typography.caption,
    color: colors.text.primary,
    fontSize: 11,
  },
  confirmBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  confirmBtnDisabled: {
    opacity: 0.4,
  },
  confirmBtnText: {
    ...typography.button,
    color: colors.text.inverse,
  },

  // Profile card
  profileListContent: {
    paddingBottom: spacing.lg,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderMuted,
    overflow: 'hidden',
  },
  profileSwatch: {
    width: 5,
    alignSelf: 'stretch',
  },
  profileContent: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: 2,
  },
  profileName: {
    ...typography.body,
    color: colors.text.primary,
    fontWeight: '600',
  },
  profileMeta: {
    ...typography.caption,
    color: colors.text.muted,
  },
  profileEditInput: {
    ...typography.body,
    color: colors.text.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 2,
  },
  profileEditActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.sm,
  },
  profileEditBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    backgroundColor: colors.surfaceMuted,
  },
  profileEditBtnText: {
    ...typography.body,
    color: colors.success,
    fontWeight: '700',
  },
  profileEditBtnTextCancel: {
    ...typography.body,
    color: colors.error,
    fontWeight: '700',
  },
  profileDeleteBtn: {
    width: 44,
    height: '100%' as any,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileDeleteText: {
    fontSize: 22,
    color: colors.text.muted,
    lineHeight: 24,
  },

  // Empty states
  emptyCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyTitle: {
    ...typography.subtitle,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyBody: {
    ...typography.body,
    color: colors.text.muted,
    textAlign: 'center',
  },
  emptyProfiles: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  emptyProfilesTitle: {
    ...typography.overline,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  emptyProfilesBody: {
    ...typography.caption,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
});
