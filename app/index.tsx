import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import {
    StyleSheet,
    View,
} from 'react-native';
import { Button } from '../components/ui/Button';
import { ScreenLayout } from '../components/ui/ScreenLayout';
import { colors, spacing } from '../constants/theme';

export default function WelcomeScreen() {
  const handleContinue = () => {
    // Navigate to the modular project hub
    router.push({ pathname: '/project' });
  };

  return (
    <ScreenLayout
      tabs={[]}
      title="Welcome To Tiesin, Your Pipeline Copilot"
      showFooter={false}
    >
      <View style={styles.content}>
        <View style={styles.actions}>
          <Button
            title="Get Started"
            onPress={handleContinue}
            icon={<Feather name="arrow-right" size={18} color={colors.button.primaryText} />}
          />
        </View>
      </View>
    </ScreenLayout>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    width: '100%',
    maxWidth: 320,
  },
});
