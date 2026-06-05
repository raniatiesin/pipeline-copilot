/**
 * ============================================
 * ENTITY EDITOR - SUBJECT IDENTIFICATION
 * ============================================
 *
 * Horizontal timeline for identifying and cataloguing
 * recurring subjects (people, objects, concepts) across
 * all scenes produced by Beat Butcher.
 *
 * Current state: skeleton — scene strip renders, no
 * highlight gesture or subject profile logic yet.
 *
 * @module app/scene-segmentation/entity-editor
 */

import { router } from 'expo-router';
import { stageCallbacks } from '../../lib/stageCallbacks';
import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Line } from '../../components/ui/Line';
import { ScreenLayout } from '../../components/ui/ScreenLayout';
import { THE_LINE } from '../../constants/line';
import { colors, typography } from '../../constants/theme';
import { useSceneSegmentation } from '../../hooks/useSceneSegmentation';
import type { Scene } from '../../types';

// ============================================
// CONSTANTS
// ============================================

const MIN_SCENE_WIDTH = 300;
const SCRIPT_TAPE_HEIGHT = 40;

// ============================================
// HELPERS
// ============================================

function getSceneText(scene: Scene): string {
  return scene.words.map(word => word.text).join(' ').trim();
}

// ============================================
// MAIN COMPONENT
// ============================================

export default function EntityEditorScreen() {
  const { state } = useSceneSegmentation();

  const sceneTexts = useMemo(() => state.scenes.map(getSceneText), [state.scenes]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleContinue = useCallback(() => {
    stageCallbacks.markInReview('entity-editor');
    router.back();
  }, []);

  return (
    <ScreenLayout
      tabs={[
        { label: 'Project', route: '/project' },
        { label: 'Entity Editor', route: '/scene-segmentation/entity-editor' },
      ]}
      title="Entity Editor"
      progress={66}
      onBack={handleBack}
      onContinue={handleContinue}
    >
      <View style={styles.root}>
        <ScrollView
          horizontal
          style={styles.horizontalScroll}
          contentContainerStyle={styles.horizontalContent}
          showsHorizontalScrollIndicator={true}
        >
          <View style={styles.planeRow}>
            {state.scenes.map((scene, index) => (
              <React.Fragment key={scene.id}>
                <View style={styles.sceneColumn}>
                  <View style={styles.scriptTape}>
                    <Text numberOfLines={1} style={styles.scriptText}>
                      {sceneTexts[index]}
                    </Text>
                  </View>

                  <Line
                    orientation="horizontal"
                    weight="hairline"
                    color={THE_LINE.color}
                  />

                  <View style={styles.sceneBody} />
                </View>

                {index < state.scenes.length - 1 ? (
                  <Line
                    orientation="vertical"
                    weight="hairline"
                    color={THE_LINE.color}
                    style={styles.sceneDivider}
                  />
                ) : null}
              </React.Fragment>
            ))}
          </View>
        </ScrollView>
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
    backgroundColor: colors.surface,
  },
  horizontalScroll: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  horizontalContent: {
    minHeight: '100%',
  },
  planeRow: {
    minHeight: '100%',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.surface,
  },
  sceneColumn: {
    minWidth: MIN_SCENE_WIDTH,
    backgroundColor: colors.surface,
  },
  scriptTape: {
    height: SCRIPT_TAPE_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  scriptText: {
    ...typography.body,
  },
  sceneBody: {
    flex: 1,
  },
  sceneDivider: {
    alignSelf: 'stretch',
  },
});
