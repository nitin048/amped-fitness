import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { BarChart3, TrendingUp, CheckCircle2, ChevronRight, Award } from 'lucide-react-native';
import { ThemePalette } from '../../theme/ThemeContext';

export type GraphMetric = 'VOLUME' | 'STEPS' | 'CALORIES';

interface DayGraphData {
  dayName: string;
  shortDate: string;
  volumeKg: number;
  steps: number;
  calories: number;
  sets: number;
  isToday: boolean;
  isGoalMet: boolean;
}

interface ApmedWeeklyGraphProps {
  theme: ThemePalette;
  daysActive: boolean[] | { [dayIndex: number]: boolean };
  todayVolumeKg: number;
  targetDailyVolume: number;
  todaySteps: number;
  targetDailySteps: number;
  recentSessionsCount: number;
}

export const ApmedWeeklyGraph: React.FC<ApmedWeeklyGraphProps> = React.memo(({
  theme,
  daysActive = [true, true, true, false, true, false, false],
  todayVolumeKg = 3800,
  targetDailyVolume = 5000,
  todaySteps = 8420,
  targetDailySteps = 10000,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<GraphMetric>('VOLUME');
  const todayIdx = (new Date().getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const [selectedDayIdx, setSelectedDayIdx] = useState<number>(todayIdx);

  // Generate 7-day realistic data mapped from user's consistency and today's stats
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const weekData: DayGraphData[] = dayLabels.map((name, idx) => {
    const isToday = idx === todayIdx;
    const isPast = idx <= todayIdx;
    const active = daysActive[idx] ?? false;

    // Simulate realistic historical distribution matching athlete's active days
    let vol = 0;
    let stp = 0;
    let cal = 0;
    let sets = 0;

    if (isToday) {
      vol = todayVolumeKg;
      stp = todaySteps;
      cal = Math.round(todayVolumeKg * 0.08 + todaySteps * 0.04);
      sets = Math.max(1, Math.round(todayVolumeKg / 220));
    } else if (isPast && active) {
      // Historical active day
      vol = Math.round(targetDailyVolume * (0.8 + ((idx * 37) % 35) / 100));
      stp = Math.round(targetDailySteps * (0.85 + ((idx * 43) % 25) / 100));
      cal = Math.round(vol * 0.08 + stp * 0.04);
      sets = Math.round(vol / 220);
    } else if (isPast && !active) {
      // Rest day
      vol = 0;
      stp = Math.round(targetDailySteps * 0.45);
      cal = Math.round(stp * 0.04);
      sets = 0;
    }

    const isGoalMet =
      selectedMetric === 'VOLUME'
        ? vol >= targetDailyVolume
        : selectedMetric === 'STEPS'
        ? stp >= targetDailySteps
        : cal >= 400;

    return {
      dayName: name,
      shortDate: `${name}`,
      volumeKg: vol,
      steps: stp,
      calories: cal,
      sets,
      isToday,
      isGoalMet,
    };
  });

  // Calculate maximums for bar scaling with 1.35x headroom so goal line and candles never collide
  const maxVolume = Math.max(targetDailyVolume * 1.35, ...weekData.map((d) => d.volumeKg));
  const maxSteps = Math.max(targetDailySteps * 1.35, ...weekData.map((d) => d.steps));
  const maxCalories = Math.max(600, ...weekData.map((d) => d.calories));

  const getMetricMax = () => {
    if (selectedMetric === 'VOLUME') return maxVolume;
    if (selectedMetric === 'STEPS') return maxSteps;
    return maxCalories;
  };

  const getMetricValue = (d: DayGraphData) => {
    if (selectedMetric === 'VOLUME') return d.volumeKg;
    if (selectedMetric === 'STEPS') return d.steps;
    return d.calories;
  };

  const getTargetValue = () => {
    if (selectedMetric === 'VOLUME') return targetDailyVolume;
    if (selectedMetric === 'STEPS') return targetDailySteps;
    return 400;
  };

  const getUnit = () => {
    if (selectedMetric === 'VOLUME') return 'kg';
    if (selectedMetric === 'STEPS') return 'steps';
    return 'kcal';
  };

  const selectedDay = weekData[selectedDayIdx] || weekData[todayIdx];
  const isOled = theme.name === 'MIDNIGHT_OLED';

  const metricColors: Record<GraphMetric, string> = {
    VOLUME: isOled ? '#FFFFFF' : theme.primary,
    STEPS: isOled ? '#FFFFFF' : '#00E5FF',
    CALORIES: isOled ? '#FFFFFF' : '#FF9500',
  };

  const activeColor = metricColors[selectedMetric];

  // Bar height animation on metric change
  const animHeights = useRef(weekData.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const max = getMetricMax();
    Animated.parallel(
      weekData.map((d, i) => {
        const ratio = Math.min(1, Math.max(0.06, getMetricValue(d) / max));
        return Animated.timing(animHeights[i], {
          toValue: ratio,
          duration: 650,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        });
      })
    ).start();
  }, [selectedMetric, todayVolumeKg, todaySteps]);

  // Target baseline line pixel positioning aligned with 96px bar track and 24px bottom offset
  const TRACK_HEIGHT = 96;
  const BOTTOM_OFFSET = 24;
  const targetRatio = Math.min(0.92, Math.max(0.12, getTargetValue() / getMetricMax()));
  const goalLineBottom = Math.round(BOTTOM_OFFSET + targetRatio * TRACK_HEIGHT);

  const formatCompact = (val: number) => {
    if (val >= 1000) {
      const k = val / 1000;
      return `${k % 1 === 0 ? k : k.toFixed(1)}k`;
    }
    return String(val);
  };

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* HEADER ROW WITH 3-METRIC SWITCHER */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.iconBadge, { backgroundColor: `${activeColor}20` }]}>
            <BarChart3 size={14} color={activeColor} />
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: theme.subtext }]}>WEEKLY TELEMETRY</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>7-Day Health Graph</Text>
          </View>
        </View>

        {/* METRIC SWITCHER PILLS */}
        <View style={[styles.switcherContainer, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
          {(['VOLUME', 'STEPS', 'CALORIES'] as GraphMetric[]).map((m) => {
            const isSel = selectedMetric === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => {
                  setSelectedMetric(m);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.switcherBtn,
                  isSel && { backgroundColor: activeColor },
                ]}
              >
                <Text
                  style={[
                    styles.switcherBtnText,
                    { color: isSel ? '#000000' : theme.subtext, fontWeight: isSel ? '900' : '600' },
                  ]}
                >
                  {m === 'VOLUME' ? 'Load' : m === 'STEPS' ? 'Steps' : 'Energy'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* SELECTED DAY STATS BANNER */}
      <View style={[styles.inspectBanner, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={[styles.inspectDayTitle, { color: theme.text }]}>
              {selectedDay.dayName} {selectedDay.isToday ? '(Today)' : 'Summary'}
            </Text>
            <Text style={[styles.inspectMetricsText, { color: activeColor }]}>
              {getMetricValue(selectedDay).toLocaleString()} {getUnit()}
              <Text style={{ color: theme.subtext, fontSize: 11, fontWeight: '600' }}>
                {' '}• Goal: {getTargetValue().toLocaleString()} {getUnit()}
              </Text>
            </Text>
          </View>

          <View style={[styles.goalPill, { backgroundColor: selectedDay.isGoalMet ? '#34C75920' : `${theme.subtext}18` }]}>
            <CheckCircle2 size={12} color={selectedDay.isGoalMet ? '#34C759' : theme.subtext} />
            <Text style={{ fontSize: 10, fontWeight: '800', color: selectedDay.isGoalMet ? '#34C759' : theme.subtext }}>
              {selectedDay.isGoalMet ? 'Target Hit' : 'In Progress'}
            </Text>
          </View>
        </View>
      </View>

      {/* INTERACTIVE 7-DAY BAR CHART CONTAINER */}
      <View style={styles.chartArea}>
        {/* DOTTED TARGET GUIDELINE & ANCHORED RIGHT GOAL CAPSULE */}
        <View style={[styles.targetGuideLineContainer, { bottom: goalLineBottom }]}>
          <View style={[styles.targetGuideDashedLine, { borderColor: `${theme.subtext}40` }]} />
          <View
            style={[
              styles.targetGuideBadge,
              {
                backgroundColor: theme.cardElevated,
                borderColor: isOled ? '#FFFFFF' : `${activeColor}60`,
              },
            ]}
          >
            <Text style={[styles.targetGuideBadgeText, { color: isOled ? '#FFFFFF' : activeColor }]}>
              Goal {formatCompact(getTargetValue())}
            </Text>
          </View>
        </View>

        {/* 7 DAY BARS (WITH DEDICATED RIGHT GUTTER TO PREVENT ANY OVERLAP) */}
        <View style={styles.barsFlexRow}>
          {weekData.map((d, i) => {
            const isSelected = i === selectedDayIdx;
            const barHeight = animHeights[i].interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            });

            return (
              <TouchableOpacity
                key={d.dayName}
                onPress={() => {
                  setSelectedDayIdx(i);
                  Haptics.selectionAsync();
                }}
                activeOpacity={0.75}
                style={styles.barItemTouchArea}
              >
                {/* Highlight Indicator Pill for Selected Day */}
                {isSelected && (
                  <View style={[styles.selectedIndicatorDot, { backgroundColor: activeColor }]} />
                )}

                {/* Vertical Bar Track & Fill */}
                <View
                  style={[
                    styles.verticalBarTrack,
                    { backgroundColor: theme.cardElevated },
                    isSelected && { borderColor: activeColor, borderWidth: 1.5 },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.verticalBarFill,
                      {
                        height: barHeight,
                        backgroundColor: isSelected ? activeColor : `${activeColor}70`,
                      },
                    ]}
                  />
                </View>

                {/* Day Label */}
                <Text
                  style={[
                    styles.dayAxisText,
                    { color: isSelected ? activeColor : d.isToday ? theme.text : theme.subtext },
                    isSelected && { fontWeight: '900' },
                  ]}
                >
                  {d.dayName[0]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* FOOTER TIP */}
      <View style={styles.graphFooter}>
        <TrendingUp size={12} color={activeColor} />
        <Text style={[styles.graphFooterText, { color: theme.subtext }]}>
          Tap any bar to inspect daily training volume, steps, and energy burn.
        </Text>
      </View>
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
  switcherContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 2,
    gap: 2,
  },
  switcherBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  switcherBtnText: {
    fontSize: 10,
  },
  inspectBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  inspectDayTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  inspectMetricsText: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  goalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  chartArea: {
    height: 140,
    justifyContent: 'flex-end',
    position: 'relative',
    marginVertical: 4,
  },
  targetGuideLineContainer: {
    position: 'absolute',
    left: 4,
    right: 4,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 2,
  },
  targetGuideDashedLine: {
    flex: 1,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    marginRight: 6,
  },
  targetGuideBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetGuideBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  barsFlexRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 130,
    paddingLeft: 4,
    paddingRight: 64, // Dedicated clearance for Goal badge so candles never collide
  },
  barItemTouchArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  selectedIndicatorDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  verticalBarTrack: {
    width: 20,
    height: 96,
    borderRadius: 10,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  verticalBarFill: {
    width: '100%',
    borderRadius: 10,
  },
  dayAxisText: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  graphFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  graphFooterText: {
    fontSize: 10.5,
    fontWeight: '500',
  },
});
