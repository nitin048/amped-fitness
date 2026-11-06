import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

interface RestTimerProps {
  remainingSeconds: number;
  totalSeconds?: number;
  onSkip: () => void;
  onAdd30s: () => void;
}

export const AppleRestTimer: React.FC<RestTimerProps> = ({
  remainingSeconds,
  totalSeconds = 90,
  onSkip,
  onAdd30s,
}) => {
  const { theme } = useTheme();
  if (remainingSeconds <= 0) return null;

  const size = 38;
  const strokeWidth = 3.5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, remainingSeconds / totalSeconds));
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <View style={styles.floatingContainer}>
      <View style={[styles.capsule, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
        {/* CIRCULAR MINI PROGRESS RING */}
        <View style={styles.ringWrapper}>
          <Svg width={size} height={size}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.border}
              strokeWidth={strokeWidth}
              fill="transparent"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={theme.primary}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              rotation="-90"
              origin={`${size / 2}, ${size / 2}`}
            />
          </Svg>
          <View style={styles.ringCenterText}>
            <Text style={[styles.secondsNumber, { color: theme.primary }]}>{remainingSeconds}</Text>
          </View>
        </View>

        {/* TIMER LABEL & CONTROLS */}
        <View style={styles.textColumn}>
          <Text style={[styles.titleText, { color: theme.text }]}>REST & RECOVER</Text>
          <Text style={[styles.subText, { color: theme.subtext }]}>Shake phone to reset 90s</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onAdd30s();
            }}
            style={[styles.actionBtn, { backgroundColor: theme.card }]}
          >
            <Text style={[styles.actionBtnText, { color: theme.text }]}>+30s</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              onSkip();
            }}
            style={[styles.actionBtn, { backgroundColor: `${theme.danger}18` }]}
          >
            <Text style={[styles.actionBtnText, { color: theme.danger }]}>Skip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  floatingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'transparent',
  },
  capsule: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  ringWrapper: {
    position: 'relative',
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterText: {
    position: 'absolute',
  },
  secondsNumber: {
    fontSize: 12,
    fontWeight: '900',
  },
  textColumn: {
    flex: 1,
    marginLeft: 12,
  },
  titleText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subText: {
    fontSize: 10,
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
