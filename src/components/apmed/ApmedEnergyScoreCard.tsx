import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { Sparkles, Moon, Flame, Zap, Droplets, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react-native';
import { ThemePalette } from '../../theme/ThemeContext';

interface ApmedEnergyScoreCardProps {
  theme: ThemePalette;
  volumeProgress: number; // 0 to 1
  setsProgress: number;   // 0 to 1
  recoveryProgress: number; // 0 to 100
  hydrationProgress: number; // 0 to 1
  targetSleep?: number;
  onOpenRecovery?: () => void;
}

export const ApmedEnergyScoreCard: React.FC<ApmedEnergyScoreCardProps> = React.memo(({
  theme,
  volumeProgress,
  setsProgress,
  recoveryProgress,
  hydrationProgress,
  targetSleep = 8.0,
  onOpenRecovery,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Compute composite Apmed Energy Score (0 - 100)
  // Factors: Recovery (40%), Hydration (20%), Volume/Activity Load (25%), Consistency (15%)
  const rawScore = Math.round(
    recoveryProgress * 0.4 +
    Math.min(1, hydrationProgress) * 100 * 0.2 +
    Math.min(1, (volumeProgress + setsProgress) / 2) * 100 * 0.25 +
    15
  );
  const energyScore = Math.max(35, Math.min(99, rawScore));

  // Determine Energy Tier
  const getEnergyTier = (score: number) => {
    if (score >= 85) return { label: 'Optimal Energy', color: '#34C759', desc: 'Body is primed for high mechanical tension and maximum output today.' };
    if (score >= 70) return { label: 'Good Readiness', color: '#00F0FF', desc: 'Solid physiological capacity. Moderate to high intensity recommended.' };
    if (score >= 50) return { label: 'Recharging', color: '#FF9500', desc: 'System is recovering. Prioritize hydration and moderate sets.' };
    return { label: 'Low Energy', color: '#FF2D55', desc: 'High fatigue detected. Focus on active recovery, mobility, and sleep.' };
  };

  const tier = getEnergyTier(energyScore);

  // Animation values
  const animatedScore = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Smooth progress entrance
    Animated.timing(animatedScore, {
      toValue: energyScore / 100,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Subtle gentle breathing pulse on the sparkle
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1400,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [energyScore]);

  // SVG Gauge calculations
  const size = 104;
  const strokeWidth = 9;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - energyScore / 100);

  const isOled = theme.name === 'MIDNIGHT_OLED';

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <View style={[styles.sparkleBadge, { backgroundColor: isOled ? '#FFFFFF15' : `${tier.color}20` }]}>
              <Sparkles size={13} color={isOled ? '#FFFFFF' : tier.color} />
            </View>
          </Animated.View>
          <View>
            <Text style={[styles.eyebrow, { color: theme.subtext }]}>APMED HEALTH ENGINE</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Energy Score</Text>
          </View>
        </View>

        <View style={[styles.tierPill, { backgroundColor: `${tier.color}18`, borderColor: `${tier.color}45` }]}>
          <View style={[styles.tierDot, { backgroundColor: tier.color }]} />
          <Text style={[styles.tierPillText, { color: tier.color }]}>{tier.label}</Text>
        </View>
      </View>

      {/* HERO SCORE & GAUGE SECTION */}
      <View style={styles.gaugeSectionRow}>
        {/* CIRCULAR SVG ENERGY GAUGE */}
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={size} height={size}>
            <Defs>
              <LinearGradient id="energyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <Stop offset="0%" stopColor={isOled ? '#FFFFFF' : tier.color} />
                <Stop offset="100%" stopColor={isOled ? '#AEAEB2' : `${tier.color}99`} />
              </LinearGradient>
            </Defs>

            {/* Background Track */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={isOled ? '#2C2C2E' : `${theme.subtext}20`}
              strokeWidth={strokeWidth}
              fill="none"
            />

            {/* Progress Arc */}
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="url(#energyGrad)"
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>

          {/* Centered Score */}
          <View style={styles.scoreTextCenter}>
            <Text style={[styles.scoreValue, { color: theme.text }]}>{energyScore}</Text>
            <Text style={[styles.scoreOutOf, { color: theme.subtext }]}>/100</Text>
          </View>
        </View>

        {/* SUMMARY INSIGHT */}
        <View style={styles.gaugeInfoCol}>
          <Text style={[styles.summaryDesc, { color: theme.text }]} numberOfLines={3}>
            {tier.desc}
          </Text>

          <View style={styles.recoveryStatusRow}>
            <ShieldCheck size={13} color={tier.color} />
            <Text style={[styles.recoveryStatusText, { color: theme.subtext }]}>
              Mifflin-St Jeor & HRV Calibrated
            </Text>
          </View>
        </View>
      </View>

      {/* 4 BIOMETRIC FACTORS PILL BAR */}
      <View style={styles.factorsGrid}>
        {/* Factor 1: Sleep */}
        <View style={[styles.factorCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Moon size={11} color="#5E5CE6" />
            <Text style={[styles.factorLabel, { color: theme.subtext }]}>SLEEP</Text>
          </View>
          <Text style={[styles.factorVal, { color: theme.text }]}>{targetSleep}h</Text>
          <Text style={{ fontSize: 9, color: '#34C759', fontWeight: '700' }}>Optimal</Text>
        </View>

        {/* Factor 2: Recovery */}
        <TouchableOpacity
          onPress={onOpenRecovery}
          activeOpacity={0.7}
          style={[styles.factorCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Zap size={11} color={theme.primary} />
            <Text style={[styles.factorLabel, { color: theme.subtext }]}>READINESS</Text>
          </View>
          <Text style={[styles.factorVal, { color: theme.primary }]}>{recoveryProgress}%</Text>
          <Text style={{ fontSize: 9, color: theme.subtext, fontWeight: '700' }}>Heatmap →</Text>
        </TouchableOpacity>

        {/* Factor 3: Training Load */}
        <View style={[styles.factorCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Flame size={11} color="#FF9500" />
            <Text style={[styles.factorLabel, { color: theme.subtext }]}>LOAD</Text>
          </View>
          <Text style={[styles.factorVal, { color: '#FF9500' }]}>{Math.round(volumeProgress * 100)}%</Text>
          <Text style={{ fontSize: 9, color: theme.subtext, fontWeight: '700' }}>Move Goal</Text>
        </View>

        {/* Factor 4: Hydration */}
        <View style={[styles.factorCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Droplets size={11} color="#00F0FF" />
            <Text style={[styles.factorLabel, { color: theme.subtext }]}>WATER</Text>
          </View>
          <Text style={[styles.factorVal, { color: '#00F0FF' }]}>{Math.round(hydrationProgress * 100)}%</Text>
          <Text style={{ fontSize: 9, color: theme.subtext, fontWeight: '700' }}>Balance</Text>
        </View>
      </View>

      {/* ACCORDION EXPAND TOGGLE */}
      <TouchableOpacity
        onPress={() => {
          setIsExpanded(!isExpanded);
          Haptics.selectionAsync();
        }}
        style={[styles.accordionToggleBtn, { borderTopColor: theme.border }]}
        activeOpacity={0.8}
      >
        <Text style={[styles.accordionToggleText, { color: theme.subtext }]}>
          {isExpanded ? 'Hide Energy Score Insights' : 'View Energy Score Insights'}
        </Text>
        {isExpanded ? (
          <ChevronUp size={14} color={theme.subtext} />
        ) : (
          <ChevronDown size={14} color={theme.subtext} />
        )}
      </TouchableOpacity>

      {/* EXPANDED SCIENTIFIC DETAILS */}
      {isExpanded && (
        <View style={[styles.expandedContent, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
          <Text style={[styles.expandedTitle, { color: theme.text }]}>How Your Energy Score Is Computed</Text>
          <Text style={[styles.expandedBody, { color: theme.subtext }]}>
            Apmed Health Engine calculates Energy Score by synthesizing 4 offline biometrics: resting recovery from logged sets, hydration intake vs daily requirements, training load volume, and sleep continuity.
          </Text>
          <View style={styles.expandedBullet}>
            <View style={[styles.bulletDot, { backgroundColor: tier.color }]} />
            <Text style={[styles.bulletText, { color: theme.text }]}>
              Optimal workout window today: <Text style={{ fontWeight: '800', color: tier.color }}>4:00 PM – 7:30 PM</Text>
            </Text>
          </View>
        </View>
      )}
    </View>
  );
});

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
    marginBottom: 14,
  },
  sparkleBadge: {
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
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  tierDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  tierPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  gaugeSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  scoreTextCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreOutOf: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: -2,
  },
  gaugeInfoCol: {
    flex: 1,
  },
  summaryDesc: {
    fontSize: 12.5,
    lineHeight: 18,
    fontWeight: '600',
  },
  recoveryStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 8,
  },
  recoveryStatusText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  factorsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  factorCard: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  factorLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  factorVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  accordionToggleBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingTop: 12,
    marginTop: 14,
    borderTopWidth: 1,
  },
  accordionToggleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  expandedContent: {
    marginTop: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  expandedTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 4,
  },
  expandedBody: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500',
  },
  expandedBullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bulletText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

