import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Play,
  Pause,
  RotateCcw,
  Flag,
  X,
  Clock,
  Sparkles,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';

interface StopwatchModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
}

interface LapItem {
  lapIndex: number;
  lapDurationMs: number;
  totalDurationMs: number;
}

export const StopwatchModal: React.FC<StopwatchModalProps> = ({
  visible,
  theme,
  onClose,
}) => {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [laps, setLaps] = useState<LapItem[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTimeRef = useRef<number>(0);
  const currentLapStartRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      lastTimeRef.current = Date.now() - elapsedMs;
      timerRef.current = setInterval(() => {
        setElapsedMs(Date.now() - lastTimeRef.current);
      }, 30);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(true);
  };

  const handlePause = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsRunning(false);
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRunning(false);
    setElapsedMs(0);
    setLaps([]);
    currentLapStartRef.current = 0;
  };

  const handleLap = () => {
    if (!isRunning && elapsedMs === 0) return;
    Haptics.selectionAsync();

    const currentTotal = elapsedMs;
    const lapDuration = currentTotal - currentLapStartRef.current;
    currentLapStartRef.current = currentTotal;

    const newLap: LapItem = {
      lapIndex: laps.length + 1,
      lapDurationMs: lapDuration,
      totalDurationMs: currentTotal,
    };

    setLaps((prev) => [newLap, ...prev]);
  };

  // Find min/max lap duration for visual color coding
  const fastestLap = laps.length > 1 ? Math.min(...laps.map((l) => l.lapDurationMs)) : null;
  const slowestLap = laps.length > 1 ? Math.max(...laps.map((l) => l.lapDurationMs)) : null;

  const formatStopwatch = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const centis = Math.floor((ms % 1000) / 10);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${centis.toString().padStart(2, '0')}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.clockBadge, { backgroundColor: `${theme.primary}20` }]}>
                <Clock size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                  Stopwatch & Lap Timer
                </Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]} numberOfLines={1}>
                  Precision timing for rest sets, circuits & interval sprints
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* STOPWATCH BIG TIME DISPLAY */}
          <View style={[styles.timerHeroBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
            <Text style={[styles.stopwatchDigits, { color: theme.text }]}>
              {formatStopwatch(elapsedMs)}
            </Text>
            <Text style={[styles.stopwatchUnitLabel, { color: theme.subtext }]}>
              MINUTES : SECONDS . CENTISECONDS
            </Text>
          </View>

          {/* ACTION BUTTONS ROW */}
          <View style={styles.actionRow}>
            {/* Lap / Reset Button */}
            <TouchableOpacity
              onPress={isRunning ? handleLap : handleReset}
              disabled={elapsedMs === 0}
              style={[
                styles.roundControlBtn,
                {
                  backgroundColor: theme.cardElevated,
                  borderColor: theme.border,
                  opacity: elapsedMs === 0 ? 0.4 : 1,
                },
              ]}
            >
              {isRunning ? (
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Flag size={18} color={theme.text} />
                  <Text style={[styles.btnActionLabel, { color: theme.text }]}>LAP</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <RotateCcw size={18} color={theme.text} />
                  <Text style={[styles.btnActionLabel, { color: theme.text }]}>RESET</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Start / Pause Button */}
            <TouchableOpacity
              onPress={isRunning ? handlePause : handleStart}
              style={[
                styles.roundControlBtn,
                {
                  backgroundColor: isRunning ? 'rgba(255,42,84,0.18)' : `${theme.primary}25`,
                  borderColor: isRunning ? theme.accentRed : theme.primary,
                },
              ]}
            >
              {isRunning ? (
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Pause size={22} color={theme.accentRed} />
                  <Text style={[styles.btnActionLabel, { color: theme.accentRed }]}>STOP</Text>
                </View>
              ) : (
                <View style={{ alignItems: 'center', gap: 2 }}>
                  <Play size={22} color={theme.primary} fill={theme.primary} />
                  <Text style={[styles.btnActionLabel, { color: theme.primary }]}>START</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* LAPS LIST */}
          <View style={styles.lapsHeaderRow}>
            <Text style={[styles.lapsColHeader, { color: theme.subtext }]}>LAP</Text>
            <Text style={[styles.lapsColHeader, { color: theme.subtext, textAlign: 'center' }]}>SPLIT</Text>
            <Text style={[styles.lapsColHeader, { color: theme.subtext, textAlign: 'right' }]}>TOTAL</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 240, marginBottom: 20 }}>
            {laps.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <Text style={{ fontSize: 12, color: theme.subtext }}>
                  Hit 'Lap' while the timer runs to record interval splits
                </Text>
              </View>
            ) : (
              laps.map((lap) => {
                const isFastest = fastestLap !== null && lap.lapDurationMs === fastestLap;
                const isSlowest = slowestLap !== null && lap.lapDurationMs === slowestLap;
                const splitColor = isFastest ? theme.primary : isSlowest ? theme.accentOrange : theme.text;

                return (
                  <View
                    key={lap.lapIndex}
                    style={[styles.lapRowItem, { borderBottomColor: theme.border }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Text style={[styles.lapIndexText, { color: theme.subtext }]}>
                        Lap {lap.lapIndex}
                      </Text>
                      {isFastest && (
                        <View style={[styles.lapBadge, { backgroundColor: `${theme.primary}20` }]}>
                          <Text style={[styles.lapBadgeText, { color: theme.primary }]}>FASTEST</Text>
                        </View>
                      )}
                      {isSlowest && (
                        <View style={[styles.lapBadge, { backgroundColor: `${theme.accentOrange}20` }]}>
                          <Text style={[styles.lapBadgeText, { color: theme.accentOrange }]}>SLOWEST</Text>
                        </View>
                      )}
                    </View>

                    <Text style={[styles.lapSplitText, { color: splitColor }]}>
                      {formatStopwatch(lap.lapDurationMs)}
                    </Text>

                    <Text style={[styles.lapTotalText, { color: theme.subtext }]}>
                      {formatStopwatch(lap.totalDurationMs)}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  clockBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  timerHeroBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    borderRadius: 20,
    borderWidth: 1,
    marginVertical: 10,
  },
  stopwatchDigits: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  stopwatchUnitLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 14,
  },
  roundControlBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnActionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  lapsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    marginTop: 8,
  },
  lapsColHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    flex: 1,
  },
  lapRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
  },
  lapIndexText: {
    fontSize: 13,
    fontWeight: '700',
  },
  lapBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lapBadgeText: {
    fontSize: 8,
    fontWeight: '900',
  },
  lapSplitText: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
  lapTotalText: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    fontVariant: ['tabular-nums'],
  },
});
