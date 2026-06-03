/**
 * ============================================
 * SCENE MAPPER - STORYBOARD OVERVIEW
 * ============================================
 * 
 * The ultimate synthesis page. Displays an overview of:
 * - Selected Style (Collage + Keywords)
 * - Identified Subjects
 * - Segmented Scenes & Beats (The Storyboard)
 * 
 * @module app/scene-mapper/index
 */

import { Feather } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useCallback } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ScreenLayout } from '@/components/ui/ScreenLayout';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { getLineThickness } from '@/constants/line';
import { useSceneSegmentation } from '@/hooks/useSceneSegmentation';

// ============================================
// MOCK STYLE DATA (Pending Global State)
// ============================================

const MOCK_STYLE = {
  id: 'style-14',
  color: colors.highlight.orange,
  keywords: ['Neon vibrant', 'High-contrast', 'Cyberpunk', 'Macro details'],
};

// ============================================
// MAIN COMPONENT
// ============================================

export default function StoryboardOverviewScreen() {
  const router = useRouter();
  const { state } = useSceneSegmentation();
  const { scenes, subjectCategories } = state;

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleContinue = useCallback(() => {
    // Generate JSON Export or next pipeline step
  }, []);

  return (
    <ScreenLayout
      tabs={[
        { label: 'Project', route: '/project' },
        { label: 'Storyboard', route: '/scene-mapper' },
      ]}
      title="Synthesis Overview"
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* SECTION 1: VISUAL STYLE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="image" size={18} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Visual Style Selection</Text>
          </View>
          <View style={styles.styleContainer}>
            <View style={[styles.styleMockCollage, { backgroundColor: MOCK_STYLE.color }]}>
              <Text style={styles.styleMockText}>{MOCK_STYLE.id.toUpperCase()}</Text>
            </View>
            <View style={styles.styleKeywords}>
              {MOCK_STYLE.keywords.map(kw => (
                <View key={kw} style={styles.keywordTag}>
                  <Text style={styles.keywordText}>{kw}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* SECTION 2: SUBJECTS SUMMARY */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="users" size={18} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Identified Subjects</Text>
          </View>
          <View style={styles.subjectsContainer}>
            {subjectCategories.length === 0 ? (
              <Text style={styles.emptyText}>No subjects categorized yet.</Text>
            ) : (
              subjectCategories.map((cat, idx) => (
                <View key={cat.id} style={styles.subjectCard}>
                  <View style={[styles.subjectAvatar, { backgroundColor: cat.color || colors.borderMuted }]} />
                  <Text style={styles.subjectName}>{cat.name}</Text>
                </View>
              ))
            )}
          </View>
        </View>

        {/* SECTION 3: STORYBOARD TIMELINE */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Feather name="film" size={18} color={colors.text.primary} />
            <Text style={styles.sectionTitle}>Storyboard Timeline</Text>
          </View>
          <View style={styles.timelineContainer}>
            {scenes.length === 0 ? (
              <Text style={styles.emptyText}>No scenes generated.</Text>
            ) : (
              scenes.map((scene, idx) => {
                const scriptText = scene.words.map(w => w.text).join(' ');
                
                // Collect subjects assigned in this scene
                const sceneSubjectIds = scene.subjects
                  .map(sub => sub.categoryId)
                  .filter(Boolean) as string[];
                const uniqueCatIds = Array.from(new Set(sceneSubjectIds));
                const sceneCategories = uniqueCatIds
                  .map(id => subjectCategories.find(c => c.id === id))
                  .filter(Boolean);

                return (
                  <View key={scene.id} style={styles.sceneCard}>
                    <View style={styles.sceneHeader}>
                      <Text style={styles.sceneOrder}>FRAME {(idx + 1).toString().padStart(2, '0')}</Text>
                    </View>
                    <View style={styles.sceneContent}>
                      <View style={styles.sceneThumbnailMock}>
                        <Feather name="camera" size={24} color={colors.borderMuted} />
                      </View>
                      <View style={styles.sceneTextWrap}>
                        <Text style={styles.sceneScript}>"{scriptText}"</Text>
                        
                        {sceneCategories.length > 0 && (
                          <View style={styles.sceneSubjectPills}>
                            {sceneCategories.map((cat, catIdx) => (
                              <View key={catIdx} style={[styles.miniSubjectPill, { backgroundColor: cat?.color || colors.primary }]}>
                                <Text style={styles.miniSubjectText}>{cat?.name}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>

      </ScrollView>
    </ScreenLayout>
  );
}

// ============================================
// STYLES
// ============================================

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  section: {
    gap: spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderBottomWidth: getLineThickness('base'),
    borderBottomColor: colors.border,
    paddingBottom: spacing.xs,
  },
  sectionTitle: {
    ...typography.subtitle,
    color: colors.text.primary,
    textTransform: 'uppercase',
  },
  
  // Style Section
  styleContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  styleMockCollage: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  styleMockText: {
    ...typography.caption,
    color: colors.text.inverse,
    fontWeight: '800',
  },
  styleKeywords: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  keywordTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: borderRadius.full,
  },
  keywordText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },

  // Subjects Section
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  subjectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.full,
    paddingRight: spacing.md,
  },
  subjectAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectName: {
    ...typography.caption,
    fontWeight: '700',
    color: colors.text.primary,
    marginLeft: spacing.sm,
  },

  // Timeline Section
  timelineContainer: {
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  sceneCard: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  sceneHeader: {
    backgroundColor: colors.backgroundMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: 2,
    borderBottomColor: colors.border,
  },
  sceneOrder: {
    ...typography.caption,
    fontWeight: '800',
    color: colors.text.primary,
  },
  sceneContent: {
    flexDirection: 'row',
    padding: spacing.sm,
    gap: spacing.md,
  },
  sceneThumbnailMock: {
    width: 80,
    height: 80,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.borderMuted,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sceneTextWrap: {
    flex: 1,
    gap: spacing.sm,
  },
  sceneScript: {
    ...typography.body,
    fontStyle: 'italic',
    color: colors.text.secondary,
  },
  sceneSubjectPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  miniSubjectPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  miniSubjectText: {
    ...typography.caption,
    fontSize: 10,
    color: colors.text.inverse,
    fontWeight: '800',
  },

  emptyText: {
    ...typography.body,
    color: colors.text.muted,
    fontStyle: 'italic',
  },
});