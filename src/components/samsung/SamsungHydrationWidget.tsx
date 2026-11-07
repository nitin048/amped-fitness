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
import { Droplets, Plus, Minus, RotateCcw, CheckCircle } from 'lucide-react-native';
import { ThemePalette } from '../../theme/ThemeContext';

interface SamsungHydrationWidgetProps {
  theme: ThemePalette;
  todayWaterMl: number;
  targetWaterMl: number;
  onAddWater: (amountMl: number) => void;
  onResetWater?: () => void;
}

export const SamsungHydrationWidget: React.FC<SamsungHydrationWidgetProps> = ({
  theme,
  todayWaterMl = 0,
  targetWaterMl = 3000,
  onAddWater,
  onResetWater,
}) => {
  const ratio = Math.min(1, Math.max(0, todayWaterMl / Math.max(1, targetWaterMl)));
  const percentage = Math.round(ratio * 100);

  // Animated wave / fill level
  const animFill = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animFill, {
      toValue: ratio,
      duration: 700,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [ratio]);

  const fillWidth = animFill.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const isOled = theme.name === 'MIDNIGHT_OLED';
  const waterColor = isOled ? '#FFFFFF' : '#00E5FF';
  const isGoalReached = todayWaterMl >= targetWaterMl;

  return (
    <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* HEADER */}
      <View style={styles.headerRow}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={[styles.iconBadge, { backgroundColor: isOled ? '#FFFFFF15' : '#00E5FF20' }]}>
            <Droplets size={14} color={waterColor} />
          </View>
          <View>
            <Text style={[styles.eyebrow, { color: theme.subtext }]}>SAMSUNG HYDRATION</Text>
            <Text style={[styles.cardTitle, { color: theme.text }]}>Water Intake</Text>
          </View>
        </View>

        <View style={[styles.statusPill, { backgroundColor: isGoalReached ? '#34C75920' : `${waterColor}18` }]}>
          {isGoalReached && <CheckCircle size={11} color="#34C759" />}
          <Text style={[styles.statusText, { color: isGoalReached ? '#34C759' : waterColor }]}>
            {isGoalReached ? 'Daily Goal Met' : `${percentage}% Completed`}
          </Text>
        </View>
      </View>

      {/* METRIC ROW */}
      <View style={styles.metricRow}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
          <Text style={[styles.currentDigits, { color: waterColor }]}>
            {(todayWaterMl / 1000).toFixed(1)}
          </Text>
          <Text style={[styles.targetDigits, { color: theme.subtext }]}>
            / {(targetWaterMl / 1000).toFixed(1)} Liters
          </Text>
        </View>

        <Text style={[styles.glassesCount, { color: theme.subtext }]}>
          ~{Math.round(todayWaterMl / 250)} of {Math.round(targetWaterMl / 250)} Glasses
        </Text>
      </View>

      {/* LIQUID WAVE PROGRESS BAR */}
      <View style={[styles.liquidTrack, { backgroundColor: theme.cardElevated }]}>
        <Animated.View
          style={[
            styles.liquidFill,
            {
              width: fillWidth,
              backgroundColor: waterColor,
            },
          ]}
        />
      </View>

      {/* QUICK 1-TAP ACTION BUTTONS */}
      <View style={styles.buttonsRow}>
        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            onAddWater(250);
          }}
          activeOpacity={0.8}
          style={[styles.quickBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
        >
          <Plus size={14} color={waterColor} />
          <Text style={[styles.quickBtnText, { color: theme.text }]}>+250ml Glass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.selectionAsync();
            onAddWater(500);
          }}
          activeOpacity={0.8}
          style={[styles.quickBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
        >
          <Plus size={14} color={waterColor} />
          <Text style={[styles.quickBtnText, { color: theme.text }]}>+500ml Bottle</Text>
        </TouchableOpacity>

        {todayWaterMl > 0 && onResetWater && (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onResetWater();
            }}
            activeOpacity={0.8}
            style={[styles.resetBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
          >
            <RotateCcw size={12} color={theme.subtext} />
          </TouchableOpacity>
        )}
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
    marginBottom: 10,
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
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 2,
    marginBottom: 10,
  },
  currentDigits: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  targetDigits: {
    fontSize: 13,
    fontWeight: '700',
  },
  glassesCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  liquidTrack: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 14,
  },
  liquidFill: {
    height: '100%',
    borderRadius: 5,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  resetBtn: {
    width: 36,
    height: 36,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
