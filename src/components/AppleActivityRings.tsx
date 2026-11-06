import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, G, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeContext';

interface ActivityRingsProps {
  volumeProgress: number; // 0 to 1 (Move / Red)
  setsProgress: number;   // 0 to 1 (Exercise / Green)
  recoveryProgress: number; // 0 to 1 (Readiness / Cyan)
  size?: number;
}

export const AppleActivityRings: React.FC<ActivityRingsProps> = ({
  volumeProgress = 0.72,
  setsProgress = 0.65,
  recoveryProgress = 0.88,
  size = 124,
}) => {
  const { theme } = useTheme();
  const strokeWidth = Math.max(8, Math.round(size * 0.088));
  const gap = Math.max(2, Math.round(size * 0.024));
  const center = size / 2;

  // Outer ring (Move / Volume - Apple Pink-Red)
  const r1 = center - strokeWidth / 2;
  const c1 = 2 * Math.PI * r1;
  const o1 = c1 * (1 - Math.min(1, Math.max(0.05, volumeProgress)));

  // Middle ring (Exercise / Sets - Apple Lime-Green)
  const r2 = r1 - strokeWidth - gap;
  const c2 = 2 * Math.PI * r2;
  const o2 = c2 * (1 - Math.min(1, Math.max(0.05, setsProgress)));

  // Inner ring (Recovery / Stand - Apple Electric Cyan)
  const r3 = r2 - strokeWidth - gap;
  const c3 = 2 * Math.PI * r3;
  const o3 = c3 * (1 - Math.min(1, Math.max(0.05, recoveryProgress)));

  const isOled = theme.name === 'MIDNIGHT_OLED';

  const ringColors = isOled
    ? {
        redStart: '#FFFFFF',
        redEnd: '#E5E5EA',
        greenStart: '#D1D1D6',
        greenEnd: '#AEAEB2',
        cyanStart: '#8E8E93',
        cyanEnd: '#636366',
      }
    : {
        redStart: '#FF1744',
        redEnd: theme.accentRed,
        greenStart: '#CCFF00',
        greenEnd: theme.primary,
        cyanStart: '#00E5FF',
        cyanEnd: theme.accentCyan,
      };

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="redRingGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={ringColors.redStart} />
            <Stop offset="100%" stopColor={ringColors.redEnd} />
          </LinearGradient>
          <LinearGradient id="greenRingGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={ringColors.greenStart} />
            <Stop offset="100%" stopColor={ringColors.greenEnd} />
          </LinearGradient>
          <LinearGradient id="cyanRingGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor={ringColors.cyanStart} />
            <Stop offset="100%" stopColor={ringColors.cyanEnd} />
          </LinearGradient>
        </Defs>

        <G rotation="-90" origin={`${center}, ${center}`}>
          {/* THEMED BACKGROUND TRACKS */}
          <Circle
            cx={center}
            cy={center}
            r={r1}
            stroke={theme.ringTrackRed}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={center}
            cy={center}
            r={r2}
            stroke={theme.ringTrackGreen}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <Circle
            cx={center}
            cy={center}
            r={r3}
            stroke={theme.ringTrackCyan}
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* ACTIVE RINGS WITH ROUNDED CAPS */}
          <Circle
            cx={center}
            cy={center}
            r={r1}
            stroke="url(#redRingGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={c1}
            strokeDashoffset={o1}
            strokeLinecap="round"
            fill="transparent"
          />
          <Circle
            cx={center}
            cy={center}
            r={r2}
            stroke="url(#greenRingGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={c2}
            strokeDashoffset={o2}
            strokeLinecap="round"
            fill="transparent"
          />
          <Circle
            cx={center}
            cy={center}
            r={r3}
            stroke="url(#cyanRingGrad)"
            strokeWidth={strokeWidth}
            strokeDasharray={c3}
            strokeDashoffset={o3}
            strokeLinecap="round"
            fill="transparent"
          />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
