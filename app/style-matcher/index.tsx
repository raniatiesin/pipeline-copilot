/**
 * ============================================
 * STYLE SELECTOR - GALLERY & FILTERS
 * ============================================
 * 
 * Unified interface for style selection.
 * Features a masonry/grid gallery of style collages
 * and an expandable bottom-sheet for filtering down
 * 690 collages based on visual questions.
 * 
 * @module app/style-matcher/index
 */

import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
    Dimensions,
    LayoutAnimation,
    ScrollView, StyleSheet, Text,
    TouchableOpacity, View
} from 'react-native';

import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { getLineThickness } from '@/constants/line';
import { styleMatcherData } from '@/constants/styleMatcherData';
import { borderRadius, colors, spacing, typography } from '@/constants/theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// ============================================
// MOCK DATA (will be 690 actual collages)
// ============================================
// We create 20 dummy objects to represent the gallery
const MOCK_GALLERY = Array.from({ length: 20 }).map((_, i) => ({
  id: `style-${i}`,
  color: [colors.highlight.red, colors.highlight.orange, colors.highlight.blue, colors.highlight.yellow][i % 4]
}));

// ============================================
// MAIN COMPONENT
// ============================================

export default function StyleSelectorIndexScreen() {
  const router = useRouter();

  // State
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<Record<string, string>>({});

  // Handlers
  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = useCallback(() => {
    router.back(); // Or move onto the next project stage 
  }, [router]);

  const toggleFilters = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setFilterExpanded((prev) => !prev);
  }, []);

  const toggleFilterOption = useCallback((questionId: string, optionLabel: string) => {
    setSelectedFilters(prev => ({
      ...prev,
      [questionId]: prev[questionId] === optionLabel ? '' : optionLabel
    }));
  }, []);

  return (
    <ScreenLayout
      tabs={[
        { label: 'Project', route: '/project' },
      ]}
      title="Style Collages"
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.container}>
        
        {/* GALLERY GRID */}
        <ScrollView 
          contentContainerStyle={styles.galleryContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {MOCK_GALLERY.map((item) => (
              <TouchableOpacity key={item.id} style={[styles.collageCard, { backgroundColor: item.color }]}>
                <View style={styles.collageOverlay}>
                  <Text style={styles.collageIdText}>{item.id.toUpperCase()}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        {/* BOTTOM SHEET FILTERS */}
        <View style={[styles.filterSheet, filterExpanded ? styles.filterSheetExpanded : undefined]}>
          <TouchableOpacity 
            style={styles.sheetHeader} 
            onPress={toggleFilters}
            activeOpacity={0.8}
          >
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetTitle}>
                Filter Styles {Object.keys(selectedFilters).filter(k => selectedFilters[k]).length > 0 ? `(${Object.keys(selectedFilters).filter(k => selectedFilters[k]).length})` : ''}
              </Text>
              <Feather name={filterExpanded ? 'chevron-down' : 'chevron-up'} size={20} color={colors.text.primary} />
            </View>
          </TouchableOpacity>

          {filterExpanded && (
            <ScrollView style={styles.filtersScroll} showsVerticalScrollIndicator={false}>
              {styleMatcherData.map((q) => (
                <View key={q.id} style={styles.filterGroup}>
                  <Text style={styles.filterTitle}>{q.title}</Text>
                  <View style={styles.filterChipsRow}>
                    {q.options.map((opt) => {
                      const isActive = selectedFilters[q.id] === opt.label;
                      return (
                        <TouchableOpacity
                          key={opt.label}
                          style={[styles.filterChip, isActive && styles.filterChipActive]}
                          onPress={() => toggleFilterOption(q.id, opt.label)}
                        >
                          <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
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
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  
  // GALLERY
  galleryContent: {
    padding: spacing.md,
    paddingBottom: 200, // Space for the folded bottom sheet
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  collageCard: {
    width: '47%',
    aspectRatio: 0.7,
    borderRadius: borderRadius.md,
    borderWidth: getLineThickness('base'),
    borderColor: colors.border,
    overflow: 'hidden',
  },
  collageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'flex-end',
    padding: spacing.sm,
  },
  collageIdText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '800',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // FILTER SHEET
  filterSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: getLineThickness('thick'),
    borderTopColor: colors.border,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    maxHeight: SCREEN_HEIGHT * 0.75, // Only extends up to 75% of screen when expanded
  },
  filterSheetExpanded: {
    height: SCREEN_HEIGHT * 0.75,
  },
  sheetHeader: {
    padding: spacing.md,
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    borderBottomWidth: getLineThickness('base'),
    borderBottomColor: colors.border,
  },
  sheetHandle: {
    width: 40,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderMuted,
    marginBottom: spacing.sm,
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
  filtersScroll: {
    padding: spacing.md,
  },
  filterGroup: {
    marginBottom: spacing.lg,
  },
  filterTitle: {
    ...typography.body,
    fontWeight: '700',
    marginBottom: spacing.sm,
    color: colors.text.secondary,
  },
  filterChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
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
    height: 40,
  },
});
