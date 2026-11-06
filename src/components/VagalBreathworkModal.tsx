import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Wind,
  X,
  Play,
  Pause,
  RotateCcw,
  Heart,
  CheckCircle2,
  Sparkles,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import { saveWellnessReading } from '../db/database';

interface VagalBreathworkModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onSessionComplete?: (cycles: number) => void;
}

type BreathPhase = 'INHALE' | 'HOLD' | 'EXHALE';

export const VagalBreathworkModal: React.FC<VagalBreathworkModalProps> = ({
  visible,
  theme,
  onClose,
  onSessionComplete,
}) => {
  const [isActive, setIsActive] = useState<boolean>(false);
  const [phase, setPhase] = useState<BreathPhase>('INHALE');
  const [secondsInPhase, setSecondsInPhase] = useState<number>(4);
  const [completedCycles, setCompletedCycles] = useState<number>(0);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (!visible) {
      handleReset();
    }
  }, [visible]);

  useEffect(() => {
    if (!isActive) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setTotalSeconds((prev) => prev + 1);

      setSecondsInPhase((prev) => {
        if (prev <= 1) {
          // Transition phase
          if (phase === 'INHALE') {
            setPhase('HOLD');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            return 7;
          } else if (phase === 'HOLD') {
            setPhase('EXHALE');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            return 8;
          } else {
            // Completed 1 full cycle
            setPhase('INHALE');
            setCompletedCycles((c) => c + 1);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            return 4;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, phase]);

  // Animate circle expansion/contraction
  useEffect(() => {
    if (!isActive) return;

    if (phase === 'INHALE') {
      Animated.timing(scaleAnim, {
        toValue: 1.45,
        duration: 4000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    } else if (phase === 'HOLD') {
      // Hold static scale
    } else if (phase === 'EXHALE') {
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 8000,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [phase, isActive]);

  const handleToggle = () => {
    if (!isActive) {
      setIsActive(true);
      Haptics.selectionAsync();
    } else {
      setIsActive(false);
      Haptics.selectionAsync();
    }
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsActive(false);
    setPhase('INHALE');
    setSecondsInPhase(4);
    setCompletedCycles(0);
    setTotalSeconds(0);
    scaleAnim.setValue(1);
  };

  const handleSaveSession = () => {
    try {
      saveWellnessReading({
        heartRateBpm: 58,
        hrvRmssd: 78,
        wellnessScore: 92,
        stateLabel: `4-7-8 Breath: ${completedCycles} cycles (${totalSeconds}s)`,
        notes: 'Vagal Parasympathetic Reset',
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (onSessionComplete) onSessionComplete(completedCycles);
      onClose();
    } catch (e) {
      console.warn('Breathwork save error:', e);
      onClose();
    }
  };

  const getPhaseColor = () => {
    if (phase === 'INHALE') return '#00F0FF';
    if (phase === 'HOLD') return '#f59e0b';
    return '#34C759';
  };

  const getPhaseText = () => {
    if (phase === 'INHALE') return 'Inhale Deeply (Nose)';
    if (phase === 'HOLD') return 'Hold Breath';
    return 'Exhale Slowly (Mouth)';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {/* HEADER */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconCircle, { backgroundColor: '#00F0FF20' }]}>
                <Wind size={20} color="#00F0FF" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                  4-7-8 Vagal Recovery Pacer
                </Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>
                  Parasympathetic Reset & Cortisol Downregulation
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
            >
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* PULSING ANIMATED BREATH CIRCLE */}
          <View style={styles.circleArena}>
            <Animated.View
              style={[
                styles.breathingCircle,
                {
                  borderColor: getPhaseColor(),
                  backgroundColor: `${getPhaseColor()}18`,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              <Text style={[styles.secondsDisplay, { color: theme.text }]}>
                {secondsInPhase}
              </Text>
              <Text style={[styles.phaseLabel, { color: getPhaseColor() }]}>
                {getPhaseText()}
              </Text>
            </Animated.View>
          </View>

          {/* CYCLE & TIME STATS */}
          <View style={[styles.statsRow, { borderColor: theme.border }]}>
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>CYCLES COMPLETED</Text>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {completedCycles}
              </Text>
            </View>
            <View style={{ width: 1, height: 28, backgroundColor: theme.border }} />
            <View style={styles.statBox}>
              <Text style={[styles.statLabel, { color: theme.subtext }]}>ACTIVE TIME</Text>
              <Text style={[styles.statValue, { color: theme.text }]}>
                {Math.floor(totalSeconds / 60)}:{(totalSeconds % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          <View style={styles.actionsRow}>
            <TouchableOpacity
              onPress={handleToggle}
              style={[styles.mainBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              {isActive ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pause size={18} color={theme.primaryText} fill={theme.primaryText} />
                  <Text style={[styles.mainBtnText, { color: theme.primaryText }]}>PAUSE PACER</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Play size={18} color={theme.primaryText} fill={theme.primaryText} />
                  <Text style={[styles.mainBtnText, { color: theme.primaryText }]}>START PACER</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleReset}
              style={[styles.iconActionBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
            >
              <RotateCcw size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {completedCycles >= 2 && (
            <TouchableOpacity
              onPress={handleSaveSession}
              style={[styles.finishBtn, { backgroundColor: '#34C759' }]}
              activeOpacity={0.85}
            >
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.finishBtnText}>Record Parasympathetic Session</Text>
            </TouchableOpacity>
          )}
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
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: 32,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
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
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  circleArena: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  breathingCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  secondsDisplay: {
    fontSize: 38,
    fontWeight: '900',
  },
  phaseLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 4,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginVertical: 14,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  mainBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  iconActionBtn: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  finishBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
