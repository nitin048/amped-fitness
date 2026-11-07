import React from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { ThemePalette } from '../theme/ThemeContext';

interface AmpedBrandLogoProps {
  theme: ThemePalette;
  size?: number;
  showText?: boolean;
  tagline?: string;
  brandText?: string;
  use3dLogo?: boolean;
}

export const AmpedBrandLogo: React.FC<AmpedBrandLogoProps> = ({
  theme,
  size = 36,
  showText = true,
  tagline,
  brandText,
}) => {
  return (
    <View style={styles.container}>
      {/* BRAND TYPOGRAPHY ONLY (NO EMBLEM/LOGO INSIDE APP) */}
      <View style={styles.textColumn}>
        <View style={styles.titleRow}>
          <Text style={[styles.brandTitle, { color: theme.text }]}>
            {brandText || 'APMED'}
          </Text>
          <Text style={[styles.brandFitnessText, { color: theme.primary }]}>FITNESS</Text>
        </View>
        {tagline ? (
          <Text style={[styles.brandTagline, { color: theme.subtext }]} numberOfLines={1}>
            {tagline}
          </Text>
        ) : (
          <Text style={[styles.brandMotto, { color: theme.subtext }]}>
            ELEVATE YOUR STRENGTH
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textColumn: {
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-black' : undefined,
    letterSpacing: 2,
  },
  brandFitnessText: {
    fontSize: 14,
    fontWeight: '900',
    fontFamily: Platform.OS === 'android' ? 'sans-serif-black' : undefined,
    letterSpacing: 2.2,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
    marginTop: 1,
    textTransform: 'uppercase',
  },
  brandMotto: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 1,
  },
});
