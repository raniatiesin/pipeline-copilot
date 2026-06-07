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
 * @module app/style-matcher/index
 */

import { Feather } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';

import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { CollageImage } from '@/components/style-selector/CollageImage';
import { styleMatcherData } from '@/constants/styleMatcherData';
import { getLineThickness } from '@/constants/line';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';
import { StyleSelectorProvider, useStyleSelector } from '@/hooks/useStyleSelector';
import { stageCallbacks } from '@/lib/stageCallbacks';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_GAP = spacing.md;
const SHEET_COLLAPSED_HEIGHT = 64;

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

  const [filterExpanded, setFilterExpanded] = useState(false);

  const selectedId = selectedCollage?.collageId ?? null;
  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

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

  const toggleFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilterExpanded(prev => !prev);
  }, []);

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

        {/* GALLERY */}
        <FlatList
          data={filteredIds}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          ItemSeparatorComponent={ItemSeparator}
          contentContainerStyle={[
            styles.galleryContent,
            { paddingBottom: SHEET_COLLAPSED_HEIGHT + spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
          initialNumToRender={12}
          maxToRenderPerBatch={16}
          windowSize={5}
          ListEmptyComponent={
            isLoading ? null : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No collages match these filters.</Text>
                <TouchableOpacity onPress={handleClearFilters} style={styles.clearBtn}>
                  <Text style={styles.clearBtnText}>CLEAR FILTERS</Text>
                </TouchableOpacity>
              </View>
            )
          }
        />

        {/* BOTTOM SHEET FILTERS */}
        <View
          style={[
            styles.filterSheet,
            filterExpanded && { height: SCREEN_HEIGHT * 0.75 },
          ]}
        >
          <TouchableOpacity
            style={styles.sheetHeader}
            onPress={toggleFilters}
            activeOpacity={0.8}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                {'Filter Styles'}
                {activeFilterCount > 0 && (
                  <Text style={styles.filterBadge}>{`  (${activeFilterCount})`}</Text>
                )}
              </Text>
              <View style={styles.sheetHeaderRight}>
                {activeFilterCount > 0 && (
                  <TouchableOpacity
                    onPress={handleClearFilters}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.clearChip}
                  >
                    <Text style={styles.clearChipText}>CLEAR</Text>
                  </TouchableOpacity>
                )}
                <Feather
                  name={filterExpanded ? 'chevron-down' : 'chevron-up'}
                  size={20}
                  color={colors.text.primary}
                />
              </View>
            </View>
          </TouchableOpacity>

          {filterExpanded && (
            <ScrollView
              style={styles.filtersScroll}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {styleMatcherData.map(q => (
                <View key={q.id} style={styles.filterGroup}>
                  <Text style={styles.filterTitle}>{q.title}</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterChipsRow}
                  >
                    {q.options.map(opt => {
                      const isActive = filters[q.id] === opt.label;
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          style={[styles.filterChip, isActive && styles.filterChipActive]}
                          onPress={() => toggleFilter(q.id, opt.label)}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              isActive && styles.filterChipTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ))}
              <View style={styles.filterFooterPadding} />
            </ScrollView>
          )}
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

  // GALLERY
  galleryContent: {
    padding: spacing.md,
  },
  columnWrapper: {
    justifyContent: 'space-between',
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

  // BOTTOM SHEET
  filterSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: getLineThickness('heavy'),
    borderTopColor: colors.border,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.75,
    overflow: 'hidden',
  },
  sheetHeader: {
    padding: spacing.md,
    paddingTop: spacing.sm,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderBottomWidth: getLineThickness('base'),
    borderBottomColor: colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.borderMuted,
    marginBottom: spacing.xs,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  sheetTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
  },
  filterBadge: {
    ...typography.subtitle,
    color: colors.secondary,
  },
  sheetHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clearChip: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  clearChipText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '800',
    fontSize: 10,
  },

  // FILTER GROUPS
  filtersScroll: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  filterGroup: {
    marginBottom: spacing.md,
    paddingHorizontal: spacing.md,
  },
  filterTitle: {
    ...typography.caption,
    fontWeight: '700',
    marginBottom: spacing.xs,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChipsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingRight: spacing.md,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: getLineThickness('base'),
    borderColor: colors.borderMuted,
    backgroundColor: colors.background,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    ...typography.caption,
    color: colors.text.primary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: colors.text.inverse,
  },
  filterFooterPadding: {
    height: spacing.xl,
  },
});
