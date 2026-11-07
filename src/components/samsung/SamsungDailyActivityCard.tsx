import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Footprints, Dumbbell, Flame, ChevronRight, Heart } from 'lucide-react-native';
import { ThemePalette } from '../../theme/ThemeContext';

interface SamsungDailyActivityCardProps {
  theme: ThemePalette;
  currentSteps: number;
  targetSteps: number;
  currentSets: number;
  targetSets: number;
  currentVolumeKg: number;
  targetVolumeKg: number;
  onOpenSteps?: () => void;
  onOpenWorkout?: () => void;
  onOpenTargets?: () => void;
}

export const SamsungDailyActivityCard: React.FC<SamsungDailyActivityCardProps> = ({
  theme,
  currentSteps = 0,
  targetSteps = 10000,
  currentSets = 0,
  targetSets = 20,
  currentVolumeKg = 0,
  targetVolumeKg = 5000,
  onOpenSteps,
  onOpenWorkout,
  onOpenTargets,
}) => {
  const stepsRatio = Math.min(1, Math.max(0, currentSteps / Math.max(1, targetSteps)));
  const setsRatio = Math.min(1, Math.max(0, currentSets / Math.max(1, targetSets)));
  const volumeRatio = Math.min(1, Math.max(0, currentVolumeKg / Math.max(1, targetVolumeKg)));

  // Animation values for smooth bar growth
  const animSteps = useRef(new Animated.Value(0)).current;
  const animSets = useRef(new Animated.Value(0)).current;
  const animVolume = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animSteps, {
        toValue: stepsRatio,
        duration: 900,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animSets, {
        toValue: setsRatio,
        duration: 1000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
      Animated.timing(animVolume, {
        toValue: volumeRatio,
        duration: 1100,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();
  }, [stepsRatio, setsRatio, volumeRatio]);

  const isOled = theme.name === 'MIDNIGHT_OLED';

  const metrics = [
    {
      id: 'steps',
      title: 'Daily Steps',
      current: currentSteps.toLocaleString(),
      target: targetSteps.toLocaleString(),
      unit: 'steps',
      pct: Math.round(stepsRatio * 100),
      color: isOled ? '#FFFFFF' : '#00E5FF',
      icon: Footprints,
      animVal: animSteps,
      onPress: onOpenSteps,
    },
    {
      id: 'sets',
      title: 'Active Sets',
      current: String(currentSets),
      target: String(targetSets),
      unit: 'sets',
      pct: Math.round(setsRatio * 100),
      color: isOled ? '#D1D1D6' : '#FF9500',
      icon: Dumbbell,
      animVal: animSets,
      onPress: onOpenWorkout,
    },
    {
      id: 'volume',
      title: 'Training Load',
      current: currentVolumeKg.toLocaleString(),
      target: targetVolumeKg.toLocaleString(),
      unit: 'kg',
      pct: Math.round(volumeRatio * 100),
      color: isOled ? '#8E8E93' : '#FF2D55',
      icon: Flame,
      animVal: animVolume,
      onPress: onOpenWorkout,
    },
  ];

  const overallAvg = Math.round(((stepsRatio + setsRatio + volumeRatio) / 3) * 100);

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* HEADER ROW */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.iconHeartBadge, { backgroundColor: isOled ? '#FFFFFF15' : '#00E5FF20' }]}>
            <Heart size={14} color={isOled ? '#FFFFFF' : '#00E5FF'} fill={isOled ? '#FFFFFF' : '#00E5FF'} />
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: theme.subtext }]}>DAILY TARGETS</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Activity</Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onOpenTargets}
          style={[styles.editTargetPill, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.editTargetText, { color: theme.primary }]}>
            {overallAvg}% Total Met
          </Text>
          <ChevronRight size={12} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* 3 PROGRESS BARS */}
      <View style={{ gap: 14, marginTop: 4 }}>
        {metrics.map((m) => {
          const IconComp = m.icon;
          const barWidth = m.animVal.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', '100%'],
          });

          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => {
                if (m.onPress) {
                  Haptics.selectionAsync();
                  m.onPress();
                }
              }}
              activeOpacity={0.8}
              style={styles.metricRowContainer}
            >
              {/* TOP LABELS */}
              <View style={styles.metricLabelRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <IconComp size={13} color={m.color} />
                  <Text style={[styles.metricTitle, { color: theme.text }]}>{m.title}</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                  <Text style={[styles.metricCurrent, { color: theme.text }]}>{m.current}</Text>
                  <Text style={[styles.metricTarget, { color: theme.subtext }]}>
                    / {m.target} {m.unit}
                  </Text>
                  <View style={[styles.pctBadge, { backgroundColor: `${m.color}20` }]}>
                    <Text style={[styles.pctBadgeText, { color: m.color }]}>{m.pct}%</Text>
                  </View>
                </View>
              </View>

              {/* PROGRESS TRACK */}
              <View style={[styles.progressTrack, { backgroundColor: theme.cardElevated }]}>
                <Animated.View
                  style={[
                    styles.progressFill,
                    {
                      width: barWidth,
                      backgroundColor: m.color,
                    },
                  ]}
                />
              </View>
            </TouchableOpacity>
          );
        })}
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
  iconHeartBadge: {
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
  editTargetPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  editTargetText: {
    fontSize: 11,
    fontWeight: '800',
  },
  metricRowContainer: {
    gap: 6,
  },
  metricLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricCurrent: {
    fontSize: 13,
    fontWeight: '900',
  },
  metricTarget: {
    fontSize: 11,
    fontWeight: '600',
  },
  pctBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 2,
  },
  pctBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});
