/**
 * ============================================
 * WELCOME SCREEN
 * ============================================
 *
 * Entry point — navigates to the Projects Kanban.
 *
 * @module app/index
 */

import { Feather } from '@expo/vector-icons';
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

        {/* Logo mark */}
        <View style={styles.logoMark}>
          <Feather name="film" size={32} color={colors.text.primary} />
        </View>

        {/* Headline */}
        <View style={styles.hero}>
          <Text style={styles.title}>PIPELINE{'\n'}COPILOT</Text>
          <Text style={styles.subtitle}>Your pre-production companion</Text>
        </View>

        {/* CTA */}
        <TouchableOpacity
          onPress={handleStart}
          activeOpacity={0.85}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel="Get started"
        >
          <Text style={styles.ctaText}>GET STARTED</Text>
          <Feather name="arrow-right" size={18} color={colors.text.inverse} />
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
    paddingVertical: spacing.xxl,
    justifyContent: 'center',
    gap: spacing.xl,
  },
  logoMark: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    borderWidth: 3,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.hard,
  },
  hero: {
    gap: spacing.sm,
  },
  title: {
    ...typography.title,
    color: colors.text.primary,
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  subtitle: {
    ...typography.body,
    color: colors.text.secondary,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.primary,
    borderWidth: 3,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    ...shadows.hard,
  },
  ctaText: {
    ...typography.button,
    color: colors.text.inverse,
    letterSpacing: 1.5,
  },
});
