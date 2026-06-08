/**
 * ============================================
 * STYLE SELECTOR — GALLERY & FILTERS
 * ============================================
 *
 * Gallery-first style selection: 686 collage thumbnails in a
 * 2-column virtualized grid. A collapsed bottom sheet exposes
 * 12 filter questions as chip rows that AND-intersect the gallery
 * in real time. Tapping a collage selects it (one at a time).
 * Continue persists the selection + marks the card In Review.
 *
 * @module app/style-selector/index
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
} from 'react-native';

import { CollageImage } from '@/components/style-selector/CollageImage';
import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { getLineThickness } from '@/constants/line';
import { styleMatcherData } from '@/constants/styleMatcherData';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { StyleSelectorProvider, useStyleSelector } from '@/hooks/useStyleSelector';
import { stageCallbacks } from '@/lib/stageCallbacks';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const CARD_GAP = spacing.md;
const INITIAL_RENDER_COUNT = 24;
const MAX_RENDER_BATCH = 24;

// Split images into 2 pages (each ~343 images)
const IMAGES_PER_PAGE = 343;

// ============================================
// GALLERY ITEM
// ============================================

interface GalleryItemProps {
  id: number;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const GalleryItem = React.memo(({ id, selectedId, onSelect }: GalleryItemProps) => (
  <CollageImage
    id={id}
    isSelected={selectedId === id}
    onSelect={onSelect}
  />
));

// ============================================
// INNER CONTENT
// ============================================

function StyleSelectorContent() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = React.useState(0);
  const {
    filters,
    filteredIds,
    selectedCollage,
    toggleFilter,
    clearFilters,
    selectCollage,
    confirmSelection,
    isLoading,
  } = useStyleSelector();

  const selectedId = selectedCollage?.collageId ?? null;
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;
  
  // Split filtered IDs into 2 pages
  const pageStartIdx = currentPage * IMAGES_PER_PAGE;
  const pageEndIdx = (currentPage + 1) * IMAGES_PER_PAGE;
  const pageFilteredIds = filteredIds.slice(pageStartIdx, pageEndIdx);

  // Mark card IN_PROGRESS when screen mounts
  useEffect(() => {
    stageCallbacks.markInProgress('style-selector');
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

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

  // ── Gallery render helpers ────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: number }) => (
      <GalleryItem id={item} selectedId={selectedId} onSelect={selectCollage} />
    ),
    [selectedId, selectCollage],
  );

  const keyExtractor = useCallback((item: number) => String(item), []);

  const ItemSeparator = useCallback(
    () => <View style={styles.rowSeparator} />,
    [],
  );

  // ── Render ───────────────────────────────────────────────────────

  return (
    <ScreenLayout
      tabs={[
        { label: 'Projects', route: '/project' },
        { label: 'Stages', route: '/stages' },
      ]}
      title="Style Collages"
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>

        {/* PAGED GALLERY — Swipe between page 1 & 2 */}
        <ScrollView
          horizontal
          pagingEnabled
          decelerationRate={0.92}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => {
            const pageIndex = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
            setCurrentPage(Math.max(0, Math.min(pageIndex, 1)));
          }}
          showsHorizontalScrollIndicator={false}
          style={styles.pagerContainer}
        >
          {/* PAGE 1 & PAGE 2 */}
          {[0, 1].map((page) => (
            <View key={page} style={[styles.pageContainer, { width: SCREEN_WIDTH }]}>
              <FlatList
                data={page === 0 ? pageFilteredIds : filteredIds.slice(IMAGES_PER_PAGE)}
                keyExtractor={(id) => `${page}-${id}`}
                renderItem={({ item: id }) => (
                  <GalleryItem id={id} selectedId={selectedId} onSelect={selectCollage} />
                )}
                numColumns={2}
                columnWrapperStyle={styles.columnWrapper}
                ItemSeparatorComponent={ItemSeparator}
                contentContainerStyle={styles.galleryContent}
                showsVerticalScrollIndicator={false}
                removeClippedSubviews={true}
                initialNumToRender={INITIAL_RENDER_COUNT}
                maxToRenderPerBatch={MAX_RENDER_BATCH}
                windowSize={8}
                updateCellsBatchingPeriod={50}
                scrollEventThrottle={16}
                ListEmptyComponent={
                  isLoading ? null : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyText}>No collages on this page.</Text>
                      {page === 1 && (
                        <TouchableOpacity onPress={() => setCurrentPage(0)} style={styles.clearBtn}>
                          <Text style={styles.clearBtnText}>BACK TO PAGE 1</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )
                }
              />
            </View>
          ))}
        </ScrollView>

        {/* PAGE INDICATOR */}
        <View style={styles.pageIndicator}>
          {[0, 1].map((page) => (
            <TouchableOpacity
              key={page}
              onPress={() => setCurrentPage(page)}
              style={[
                styles.pageIndicatorDot,
                currentPage === page && styles.pageIndicatorDotActive,
              ]}
            />
          ))}
        </View>

        {/* FILTERS PANEL — bottom overlay */}
        <View style={styles.filterPanel}>
          <View style={styles.filterPanelContent}>
            <View style={styles.filterPanelHeader}>
              <Text style={styles.filterPanelTitle}>FILTER</Text>
              {activeFilterCount > 0 && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </View>

            {activeFilterCount > 0 && (
              <TouchableOpacity onPress={handleClearFilters} style={styles.clearAllBtn}>
                <Text style={styles.clearAllText}>CLEAR</Text>
              </TouchableOpacity>
            )}

            <ScrollView
              style={styles.filtersScroll}
              showsVerticalScrollIndicator={false}
              scrollEventThrottle={16}
              decelerationRate={0.92}
            >
              {styleMatcherData.map(q => (
                <View key={q.id} style={styles.filterGroup}>
                  <Text style={styles.filterGroupTitle}>{q.title}</Text>
                  <View style={styles.filterOptions}>
                    {q.options.map(opt => {
                      const isActive = filters[q.id] === opt.label;
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          style={[styles.filterOption, isActive && styles.filterOptionActive]}
                          onPress={() => toggleFilter(q.id, opt.label)}
                        >
                          <Text
                            style={[
                              styles.filterOptionText,
                              isActive && styles.filterOptionTextActive,
                            ]}
                            numberOfLines={1}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              ))}
              <View style={styles.filterFooterPadding} />
            </ScrollView>
          </View>

          {/* Subtle overlay hint */}
          <View style={styles.filterOverlay} pointerEvents="none" />
        </View>

      </View>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // PAGER
  pagerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  pageContainer: {
    flex: 1,
  },
  pageIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: getLineThickness('base'),
    borderTopColor: colors.border,
  },
  pageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.borderMuted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pageIndicatorDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  // GALLERY
  galleryContent: {
    padding: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    gap: CARD_GAP,
  },
  rowSeparator: {
    height: CARD_GAP,
  },
  emptyState: {
    flex: 1,
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
  clearBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  clearBtnText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '800',
  },

  // BOTTOM FILTER PANEL
  filterPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: getLineThickness('base'),
    borderTopColor: colors.border,
    maxHeight: SCREEN_HEIGHT * 0.5,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  filterPanelContent: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
  },
  filterPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.xs,
    borderBottomWidth: getLineThickness('base'),
    borderBottomColor: colors.border,
    marginBottom: spacing.xs,
  },
  filterPanelTitle: {
    ...typography.overline,
    color: colors.text.primary,
    fontSize: 9,
  },
  activeBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.accentAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBadgeText: {
    ...typography.overline,
    color: colors.primary,
    fontSize: 8,
  },
  clearAllBtn: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.background,
  },
  clearAllText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '700',
    fontSize: 8,
  },

  // FILTER GROUPS
  filtersScroll: {
    flex: 1,
  },
  filterGroup: {
    marginBottom: spacing.xs,
  },
  filterGroupTitle: {
    ...typography.overline,
    color: colors.text.secondary,
    fontSize: 7,
    marginBottom: spacing.xxs,
    paddingHorizontal: spacing.xxs,
  },
  filterOptions: {
    gap: spacing.xxs,
  },
  filterOption: {
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    backgroundColor: colors.background,
    marginHorizontal: spacing.xxs,
  },
  filterOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterOptionText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '500',
    fontSize: 8,
  },
  filterOptionTextActive: {
    color: colors.text.inverse,
  },
  filterFooterPadding: {
    height: spacing.md,
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    backgroundColor: 'rgba(20, 22, 20, 0.03)',
    pointerEvents: 'none',
  },
});
