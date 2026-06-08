/**
 * ============================================
 * STYLE SELECTOR — GALLERY & FILTERS
 * ============================================
 *
 * Two-page horizontal swipe layout:
 *   LEFT  — Gallery: 686 collage thumbnails in 2-column virtualized grid
 *   RIGHT — Filters: 12 filter questions as scrollable chip rows
 *
 * Tapping a collage selects it. Continue persists the selection + marks In Review.
 *
 * @module app/style-selector/index
 */

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Dimensions,
    FlatList,
    NativeScrollEvent,
    NativeSyntheticEvent,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    UIManager,
    View,
    useWindowDimensions,
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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_GAP = spacing.md;
const INITIAL_RENDER_COUNT = 24;
const MAX_RENDER_BATCH = 24;

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
// MODE INDICATOR
// ============================================

interface ModeIndicatorProps {
  mode: 'gallery' | 'filters';
  onSelect: (mode: 'gallery' | 'filters') => void;
}

function ModeIndicator({ mode, onSelect }: ModeIndicatorProps) {
  return (
    <View style={indicatorStyles.row}>
      <TouchableOpacity
        style={[
          indicatorStyles.tab,
          mode === 'gallery' && indicatorStyles.tabActive,
        ]}
        onPress={() => onSelect('gallery')}
        activeOpacity={0.75}
      >
        <Text
          style={[
            indicatorStyles.tabLabel,
            mode === 'gallery' && indicatorStyles.tabLabelActive,
          ]}
        >
          GALLERY
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          indicatorStyles.tab,
          mode === 'filters' && indicatorStyles.tabActive,
        ]}
        onPress={() => onSelect('filters')}
        activeOpacity={0.75}
      >
        <Text
          style={[
            indicatorStyles.tabLabel,
            mode === 'filters' && indicatorStyles.tabLabelActive,
          ]}
        >
          FILTERS
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const indicatorStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    borderBottomWidth: getLineThickness('base'),
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.xs,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.primary,
    backgroundColor: colors.surfaceMuted,
  },
  tabLabel: {
    ...typography.overline,
    color: colors.text.muted,
    fontSize: 11,
  },
  tabLabelActive: {
    color: colors.text.primary,
  },
});

// ============================================
// INNER CONTENT
// ============================================

function StyleSelectorContent() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);

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
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  // Mark card IN_PROGRESS when screen mounts
  useEffect(() => {
    stageCallbacks.markInProgress('style-selector');
  }, []);

  // ── Mode handlers ─────────────────────────────────────────────────

  const handleModeSelect = useCallback((newMode: 'gallery' | 'filters') => {
    setMode(newMode);
    scrollRef.current?.scrollTo({
      x: newMode === 'gallery' ? 0 : width,
      animated: true,
    });
  }, [setMode, width]);

  const handleScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const pageIndex = Math.round(
        event.nativeEvent.contentOffset.x / width,
      );
      setMode(pageIndex === 0 ? 'gallery' : 'filters');
    },
    [setMode, width],
  );

  // ── Navigation ───────────────────────────────────────────────────

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

      <ModeIndicator mode={mode} onSelect={handleModeSelect} />

      <View style={styles.container}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          decelerationRate="fast"
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScrollEnd}
          showsHorizontalScrollIndicator={false}
          style={styles.pagerContainer}
          contentContainerStyle={{ width: width * 2 }}
        >
          {/* LEFT PAGE: GALLERY */}
          <View style={[styles.pageContainer, { width }]}>
            <FlatList
              data={filteredIds}
              keyExtractor={(id) => String(id)}
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
                    <Text style={styles.emptyText}>No collages match these filters.</Text>
                  </View>
                )
              }
            />
          </View>

          {/* RIGHT PAGE: FILTERS */}
          <View style={[styles.pageContainer, { width }]}>
            <View style={styles.filterPageContent}>
              <View style={styles.filterPageHeader}>
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
          </View>
        </ScrollView>
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

  // FILTER PAGE
  filterPageContent: {
    flex: 1,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  filterPageHeader: {
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
});
