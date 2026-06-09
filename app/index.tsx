/**
 * ============================================
 * WELCOME SCREEN
 * ============================================
 *
 * Entry point — navigates to the Projects Kanban.
 *
 * @module app/index
 */

import { router } from 'expo-router';
import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { borderRadius, colors, shadows, spacing, typography } from '../constants/theme';

export default function WelcomeScreen() {
  const handleStart = () => {
    router.push({ pathname: '/project' });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <Text style={styles.title}>Pipeline Copilot</Text>
          <Text style={styles.subtitle}>Your pre-production companion</Text>
        </View>

        <TouchableOpacity
          onPress={handleStart}
          activeOpacity={0.85}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.ctaText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxxl,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xxl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  cta: {
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.error,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    ...shadows.hard,
  },
  ctaText: {
    ...typography.button,
    color: colors.text.inverse,
  },
});
