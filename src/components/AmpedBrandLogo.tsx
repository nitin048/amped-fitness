import React, { useState } from 'react';
import { StyleSheet, View, Text, Image, Platform } from 'react-native';
import Svg, { Path, Polygon, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { ThemePalette } from '../theme/ThemeContext';

interface AmpedBrandLogoProps {
  theme: ThemePalette;
  size?: number; // emblem size (default 36)
  showText?: boolean;
  tagline?: string;
  use3dLogo?: boolean;
  brandText?: string;
}

export const AmpedBrandLogo: React.FC<AmpedBrandLogoProps> = ({
  theme,
  size = 36,
  showText = true,
  tagline,
  use3dLogo = true,
  brandText,
}) => {
  const [imageError, setImageError] = useState(false);

  return (
    <View style={styles.container}>
      {/* 3D BRAND EMBLEM (OR VECTOR CREST FALLBACK) */}
      <View style={[styles.emblemWrapper, { width: size, height: size }]}>
        {use3dLogo && !imageError ? (
          <Image
            source={require('../../assets/apmed_logo_transparent.png')}
            style={{ width: size, height: size, borderRadius: size * 0.18 }}
            resizeMode="contain"
            onError={() => setImageError(true)}
          />
        ) : (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Defs>
              <LinearGradient id="ampedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={theme.primary} />
                <Stop offset="50%" stopColor={theme.accentCyan || theme.primary} />
                <Stop offset="100%" stopColor={theme.primary} />
              </LinearGradient>
              <LinearGradient id="crestBg" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={theme.cardElevated} />
                <Stop offset="100%" stopColor={theme.card} />
              </LinearGradient>
            </Defs>

            {/* HEXAGONAL ATHLETIC SHIELD */}
            <Polygon
              points="50,4 92,25 92,75 50,96 8,75 8,25"
              fill="url(#crestBg)"
              stroke={theme.border}
              strokeWidth="3"
            />

            {/* INNER GLOW ACCENT BORDER */}
            <Polygon
              points="50,10 86,28 86,72 50,90 14,72 14,28"
              fill="none"
              stroke="url(#ampedGrad)"
              strokeWidth="2"
              opacity="0.35"
            />

            {/* SCULPTED DUAL-WING 'A' CREST */}
            <Path
              d="M 50,18 L 24,78 L 36,78 L 45,54 L 50,54 Z"
              fill="url(#ampedGrad)"
            />
            <Path
              d="M 50,18 L 76,78 L 64,78 L 55,54 L 50,54 Z"
              fill="url(#ampedGrad)"
            />

            {/* ELECTRIC BOLT SPEAR (CENTER CORE OF 'A') */}
            <Polygon
              points="52,22 41,50 51,50 47,82 60,46 50,46"
              fill="#FFFFFF"
              stroke={theme.primaryText === '#000000' ? theme.primary : '#000000'}
              strokeWidth="1.2"
            />

            {/* LOWER HORIZONTAL CROSSBAR */}
            <Rect
              x="36"
              y="60"
              width="28"
              height="4"
              rx="2"
              fill={theme.primary}
              opacity="0.9"
            />
          </Svg>
        )}
      </View>

      {/* BRAND TYPOGRAPHY */}
      {showText && (
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
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  emblemWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
