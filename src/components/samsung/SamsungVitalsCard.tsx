import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Heart, Activity, ChevronRight, Zap } from 'lucide-react-native';
import { ThemePalette } from '../../theme/ThemeContext';

interface SamsungVitalsCardProps {
  theme: ThemePalette;
  heartRate?: number;
  hrvRmssd?: number;
  readinessScore?: number;
  onOpenPpg?: () => void;
}

export const SamsungVitalsCard: React.FC<SamsungVitalsCardProps> = ({
  theme,
  heartRate = 62,
  hrvRmssd = 68,
  readinessScore = 85,
  onOpenPpg,
}) => {
  // Continuous breathing pulse animation on the heart icon
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 350,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(500),
      ])
    ).start();
  }, []);

  const isOled = theme.name === 'MIDNIGHT_OLED';
  const pulseColor = isOled ? '#FFFFFF' : '#FF2D55';

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={[styles.iconBadge, { backgroundColor: isOled ? '#FFFFFF15' : '#FF2D5520' }]}>
              <Heart size={14} color={pulseColor} fill={pulseColor} />
            </View>
          </Animated.View>
          <View>
            <Text style={[styles.eyebrow, { color: theme.subtext }]}>HEART TELEMETRY</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Vitals & Pulse</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            if (onOpenPpg) {
              Haptics.selectionAsync();
              onOpenPpg();
            }
          }}
          style={[styles.measureBtn, { backgroundColor: `${pulseColor}18`, borderColor: `${pulseColor}40` }]}
          activeOpacity={0.8}
        >
          <Activity size={12} color={pulseColor} />
          <Text style={[styles.measureBtnText, { color: pulseColor }]}>Measure PPG</Text>
          <ChevronRight size={12} color={pulseColor} />
        </TouchableOpacity>
      </View>

      {/* METRIC ROW WITH ECG WAVE */}
      <View style={styles.contentRow}>
        {/* Left digits */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
            <Text style={[styles.bpmDigits, { color: pulseColor }]}>{heartRate}</Text>
            <Text style={[styles.bpmUnit, { color: theme.subtext }]}>BPM</Text>
          </View>
          <Text style={[styles.bpmSubtext, { color: theme.subtext }]}>
            Resting • <Text style={{ color: '#34C759', fontWeight: '800' }}>Optimal Range</Text>
          </Text>
        </View>

        {/* ECG SVG WAVE LINE */}
        <View style={styles.ecgWaveContainer}>
          <Svg width={110} height={44} viewBox="0 0 110 44">
            <Path
              d="M 0 22 L 20 22 L 26 12 L 32 34 L 38 4 L 44 40 L 50 18 L 56 22 L 75 22 L 81 14 L 87 30 L 93 22 L 110 22"
              fill="none"
              stroke={pulseColor}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      </View>

      {/* FOOTER 2-PILL METRICS */}
      <View style={styles.footerPillsRow}>
        <View style={[styles.footerPill, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
          <Text style={[styles.footerPillLabel, { color: theme.subtext }]}>HRV (RMSSD)</Text>
          <Text style={[styles.footerPillVal, { color: theme.text }]}>{hrvRmssd} ms</Text>
        </View>

        <View style={[styles.footerPill, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
          <Text style={[styles.footerPillLabel, { color: theme.subtext }]}>STRESS RECOVERY</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Zap size={11} color="#34C759" />
            <Text style={[styles.footerPillVal, { color: '#34C759' }]}>{readinessScore}% Low Stress</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 18,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 1,
  },
  measureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  measureBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bpmDigits: {
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bpmUnit: {
    fontSize: 13,
    fontWeight: '700',
  },
  bpmSubtext: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  ecgWaveContainer: {
    width: 110,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  footerPill: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  footerPillLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  footerPillVal: {
    fontSize: 13,
    fontWeight: '800',
  },
});

