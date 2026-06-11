/**
 * ============================================
 * STYLE SELECTOR — GALLERY & FILTERS
 * ============================================
 *
 * Gallery: virtualized collage grid with 1/2/3 column toggle.
 * Filters: 2-column chip grid per question (FlatList, no nested ScrollView).
 *
 * @module app/style-selector/index
 */

import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';

import {
  COLLAGE_ASPECT_RATIO,
  CollageImage,
} from '@/components/style-selector/CollageImage';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { getProjectTabs } from '@/lib/navigationTabs';
import { KANBAN_STATUS } from '@/constants/kanbanStatus';
import { getLineThickness } from '@/constants/line';
import { styleMatcherData } from '@/constants/styleMatcherData';
import { borderRadius, colors, shadows, spacing, typography } from '@/constants/theme';
import { StyleSelectorProvider, useStyleSelector } from '@/hooks/useStyleSelector';
import { stageCallbacks } from '@/lib/stageCallbacks';

type FilterQuestion = (typeof styleMatcherData)[number];

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INITIAL_RENDER_COUNT = 6;
const MAX_RENDER_BATCH = 6;
const CHIP_MIN_HEIGHT = spacing.xl + spacing.xs;

// ============================================
// GALLERY ITEM
// ============================================

interface GalleryItemProps {
  id: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const GalleryItem = React.memo(function GalleryItem({
  id,
  selectedId,
  onSelect,
}: GalleryItemProps) {
  return (
    <CollageImage
      id={id}
      isSelected={selectedId === id}
      onSelect={onSelect}
    />
  );
});

// ============================================
// GALLERY TOOLBAR
// ============================================

interface GalleryToolbarProps {
  numColumns: number;
  onColumnChange: (cols: 1 | 2 | 3) => void;
  onOpenFilters: () => void;
}

function GalleryToolbar({ numColumns, onColumnChange, onOpenFilters }: GalleryToolbarProps) {
  const columns: Array<1 | 2 | 3> = [1, 2, 3];
  const icons: Record<1 | 2 | 3, keyof typeof Feather.glyphMap> = {
    1: 'square',
    2: 'grid',
    3: 'columns',
  };

  return (
    <View style={toolbarStyles.row}>
      <View style={toolbarStyles.spacer} />
      {columns.map((cols) => (
        <TouchableOpacity
          key={cols}
          style={[
            toolbarStyles.iconButton,
            numColumns === cols && toolbarStyles.iconButtonActive,
          ]}
          onPress={() => onColumnChange(cols)}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel={`${cols} column gallery`}
        >
          <Feather
            name={icons[cols]}
            size={18}
            color={numColumns === cols ? colors.text.inverse : colors.text.secondary}
          />
        </TouchableOpacity>
      ))}
      <TouchableOpacity
        style={toolbarStyles.iconButton}
        onPress={onOpenFilters}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Filter styles"
      >
        <Feather name="sliders" size={18} color={colors.text.secondary} />
      </TouchableOpacity>
    </View>
  );
}

const toolbarStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  spacer: {
    flex: 1,
  },
  iconButton: {
    width: spacing.xl + spacing.xs,
    height: spacing.xl + spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadows.soft,
  },
});

// ============================================
// FILTER SECTION
// ============================================

interface FilterSectionProps {
  question: FilterQuestion;
  activeLabel: string;
  onToggle: (questionId: string, optionLabel: string) => void;
}

const FilterSection = React.memo(function FilterSection({
  question,
  activeLabel,
  onToggle,
}: FilterSectionProps) {
  return (
    <View style={filterStyles.group}>
      <Text style={filterStyles.groupTitle}>{question.title}</Text>
      <View style={filterStyles.chipGrid}>
        {question.options.map((opt) => {
          const isActive = activeLabel === opt.label;
          return (
            <TouchableOpacity
              key={opt.label}
              style={[filterStyles.chip, isActive && filterStyles.chipActive]}
              onPress={() => onToggle(question.id, opt.label)}
              activeOpacity={0.8}
            >
              <Text
                style={[filterStyles.chipText, isActive && filterStyles.chipTextActive]}
                numberOfLines={2}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
});

const filterStyles = StyleSheet.create({
  group: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  groupTitle: {
    ...typography.overline,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    width: '48%',
    minHeight: CHIP_MIN_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    backgroundColor: colors.surface,
    ...shadows.soft,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  chipTextActive: {
    color: colors.text.inverse,
  },
});

// ============================================
// INNER CONTENT
// ============================================

function StyleSelectorContent() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { projectId, projectNumber, title: postName } = useLocalSearchParams<{
    projectId?: string;
    projectNumber?: string;
    title?: string;
  }>();
  const parsedProjectNumber = projectNumber ? parseInt(projectNumber, 10) : 1;
  const [numColumns, setNumColumns] = useState<1 | 2 | 3>(2);

  const {
    filters,
    filteredIds,
    selectedCollage,
    toggleFilter,
    clearFilters,
    selectCollage,
    confirmSelection,
    isLoading,
    mode,
    setMode,
  } = useStyleSelector();

  const selectedId = selectedCollage?.collageId ?? null;
  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  const galleryPadding = spacing.sm * 2;
  const columnGap = spacing.sm;
  const itemWidth = useMemo(
    () => (width - galleryPadding - columnGap * (numColumns - 1)) / numColumns,
    [width, numColumns, galleryPadding, columnGap],
  );
  const itemHeight = itemWidth / COLLAGE_ASPECT_RATIO;
  const rowHeight = itemHeight + columnGap;

  const navigateBack = useCallback(() => {
    router.back();
  }, [router]);

  const swipeBackGesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([20, 999])
        .failOffsetY([-15, 15])
        .onEnd((event) => {
          if (event.translationX > 60) {
            runOnJS(navigateBack)();
          }
        }),
    [navigateBack],
  );

  useEffect(() => {
    if (stageCallbacks.getModuleStatus('style-selector') === KANBAN_STATUS.UP_NEXT) {
      stageCallbacks.markInProgress('style-selector');
    }
  }, []);

  const handleBack = useCallback(() => {
    if (mode === 'filters') {
      setMode('gallery');
      return;
    }
    router.back();
  }, [mode, router, setMode]);

  const handleContinue = useCallback(async () => {
    const ok = await confirmSelection();
    if (!ok) {
      Alert.alert(
        'No Style Selected',
        'Please tap a collage to select it before continuing.',
        [{ text: 'OK' }],
      );
      return;
    }
    stageCallbacks.markInReview('style-selector');
    router.dismissAll();
  }, [confirmSelection, router]);

  const handleClearFilters = useCallback(() => {
    clearFilters();
  }, [clearFilters]);

  const getItemLayout = useCallback(
    (_data: ArrayLike<number> | null | undefined, index: number) => {
      const row = Math.floor(index / numColumns);
      return {
        length: rowHeight,
        offset: rowHeight * row,
        index,
      };
    },
    [numColumns, rowHeight],
  );

  const renderGalleryItem: ListRenderItem<number> = useCallback(
    ({ item: id }) => (
      <GalleryItem
        id={id}
        selectedId={selectedId}
        onSelect={selectCollage}
      />
    ),
    [selectedId, selectCollage],
  );

  const renderFilterSection: ListRenderItem<FilterQuestion> = useCallback(
    ({ item: question }) => (
      <FilterSection
        question={question}
        activeLabel={filters[question.id] ?? ''}
        onToggle={toggleFilter}
      />
    ),
    [filters, toggleFilter],
  );

  const filterListHeader = useMemo(
    () => (
      <View style={styles.filterHeaderBlock}>
        <View style={styles.sheetHandle} />
        <View style={styles.filterPageHeader}>
          <Text style={styles.filterPanelTitle}>FILTER STYLES</Text>
          {activeFilterCount > 0 && (
            <>
              <View style={styles.activeBadge}>
                <Text style={styles.activeBadgeText}>{activeFilterCount}</Text>
              </View>
              <TouchableOpacity
                onPress={handleClearFilters}
                style={styles.clearAllBtn}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Clear all filters"
              >
                <Text style={styles.clearAllText}>CLEAR ALL</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    ),
    [activeFilterCount, handleClearFilters],
  );

  return (
    <ScreenLayout
      tabs={getProjectTabs(
        Number.isFinite(parsedProjectNumber) ? parsedProjectNumber : 1,
        postName || 'Project',
        projectId || '',
      )}
      title="Style Selector"
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <GestureDetector gesture={swipeBackGesture}>
        <View style={styles.gestureRoot}>
          {mode === 'gallery' ? (
            <>
              <GalleryToolbar
                numColumns={numColumns}
                onColumnChange={setNumColumns}
                onOpenFilters={() => setMode('filters')}
              />
              <FlatList
                key={String(numColumns)}
                data={filteredIds}
                keyExtractor={(id) => String(id)}
                renderItem={renderGalleryItem}
                numColumns={numColumns}
                columnWrapperStyle={numColumns > 1 ? styles.columnWrapper : undefined}
                contentContainerStyle={styles.galleryContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews
                initialNumToRender={INITIAL_RENDER_COUNT}
                maxToRenderPerBatch={MAX_RENDER_BATCH}
                windowSize={3}
                updateCellsBatchingPeriod={50}
                getItemLayout={getItemLayout}
                scrollEventThrottle={16}
                ListEmptyComponent={
                  isLoading ? null : (
                    <View style={styles.emptyState}>
                      <Feather name="image" size={40} color={colors.text.secondary} />
                      <Text style={styles.emptyText}>No collages match these filters.</Text>
                    </View>
                  )
                }
              />
            </>
          ) : (
            <View style={styles.filterPage}>
              <FlatList
                data={styleMatcherData}
                keyExtractor={(q) => q.id}
                renderItem={renderFilterSection}
                ListHeaderComponent={filterListHeader}
                contentContainerStyle={styles.filterListContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews
                initialNumToRender={4}
                maxToRenderPerBatch={4}
                windowSize={5}
              />
            </View>
          )}
        </View>
      </GestureDetector>
    </ScreenLayout>
  );
}

// ============================================
// MAIN SCREEN
// ============================================

export default function StyleSelectorIndexScreen() {
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();

  return (
    <StyleSelectorProvider projectId={projectId ?? ''}>
      <StyleSelectorContent />
    </StyleSelectorProvider>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  gestureRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  galleryContent: {
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  columnWrapper: {
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xxl,
    gap: spacing.md,
  },
  emptyText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  filterPage: {
    flex: 1,
    backgroundColor: colors.background,
  },
  filterListContent: {
    paddingBottom: spacing.xxl,
    backgroundColor: colors.background,
  },
  filterHeaderBlock: {
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: spacing.xxxl,
    height: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    backgroundColor: colors.surface,
    marginBottom: spacing.sm,
  },
  filterPageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: getLineThickness('base'),
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  filterPanelTitle: {
    ...typography.overline,
    color: colors.text.secondary,
    flex: 1,
  },
  activeBadge: {
    minWidth: spacing.lg,
    height: spacing.lg,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  activeBadgeText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '700',
  },
  clearAllBtn: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.error,
    backgroundColor: colors.surface,
  },
  clearAllText: {
    ...typography.caption,
    color: colors.error,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
