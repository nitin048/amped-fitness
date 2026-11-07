import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Footprints,
  Activity,
  Flame,
  Gauge,
  Compass,
  CheckCircle2,
  X,
  Plus,
  RotateCcw,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import { MotionStepMetrics } from '../hooks/useMotionStepTracker';
import { UserProfile, saveDailyTargets } from '../db/database';

interface StepCounterModalProps {
  visible: boolean;
  theme: ThemePalette;
  userProfile: UserProfile;
  stepTracker: MotionStepMetrics;
  onClose: () => void;
  onTargetUpdated?: (updated: UserProfile) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const StepCounterModal: React.FC<StepCounterModalProps> = ({
  visible,
  theme,
  userProfile,
  stepTracker,
  onClose,
  onTargetUpdated,
}) => {
  const insets = useSafeAreaInsets();
  const targetSteps = userProfile.targetDailySteps || 10000;
  const progressRatio = Math.min(1.0, stepTracker.steps / targetSteps);
  const progressPercent = Math.round(progressRatio * 100);

  const [selectedTarget, setSelectedTarget] = useState<number>(targetSteps);

  useEffect(() => {
    if (visible) {
      setSelectedTarget(userProfile.targetDailySteps || 10000);
    }
  }, [visible, userProfile.targetDailySteps]);

  const handleSetTarget = (newTarget: number) => {
    setSelectedTarget(newTarget);
    Haptics.selectionAsync();
    const updated = saveDailyTargets({ targetDailySteps: newTarget });
    if (onTargetUpdated) {
      onTargetUpdated(updated);
    }
  };

  const getMovementColor = () => {
    switch (stepTracker.movementState) {
      case 'SPRINTING':
        return '#FF2D55';
      case 'RUNNING':
        return '#FF9500';
      case 'BRISK WALKING':
        return theme.primary;
      case 'LIGHT WALKING':
        return '#00F0FF';
      default:
        return theme.subtext;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.modalContainer,
            {
              backgroundColor: theme.bg,
              borderColor: theme.border,
              paddingBottom: Math.max(16, insets.bottom),
            },
          ]}
        >
          {/* HEADER */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBox, { backgroundColor: `${theme.primary}20` }]}>
                <Footprints size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Step Telemetry & Cadence</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>
                  Fused Accelerometer + Pedometer Engine
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* MOTION PERMISSION NOTICE IF NOT GRANTED */}
            {!stepTracker.isMotionPermissionGranted && (
              <View style={[styles.permissionBanner, { backgroundColor: '#FF950015', borderColor: '#FF950040' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <AlertCircle size={16} color="#FF9500" />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#FF9500' }}>
                    Motion Sensor Consent Required
                  </Text>
                </View>
                <Text style={{ fontSize: 11, color: theme.subtext, lineHeight: 16, marginBottom: 10 }}>
                  Enable hardware pedometer access to allow low-power background step counting and high-accuracy stride cadence.
                </Text>
                <TouchableOpacity
                  onPress={async () => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    await stepTracker.requestMotionPermission();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    backgroundColor: theme.primary,
                    paddingVertical: 9,
                    borderRadius: 10,
                  }}
                >
                  <ShieldCheck size={14} color={theme.primaryText} />
                  <Text style={{ fontSize: 12, fontWeight: '800', color: theme.primaryText }}>
                    Grant Motion & Pedometer Permission
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* HERO STEP RING & PROGRESS */}
            <View style={[styles.heroCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.ringCenterBox}>
                <View style={[styles.glowRing, { borderColor: `${theme.primary}30` }]}>
                  <View style={[styles.innerRing, { borderColor: theme.primary }]}>
                    <Footprints size={28} color={theme.primary} />
                    <Text style={[styles.heroStepsCount, { color: theme.text }]}>
                      {stepTracker.steps.toLocaleString()}
                    </Text>
                    <Text style={[styles.heroStepsLabel, { color: theme.subtext }]}>
                      / {targetSteps.toLocaleString()} STEPS
                    </Text>
                  </View>
                </View>
              </View>

              {/* Progress Bar */}
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progressPercent}%`,
                      backgroundColor: theme.primary,
                    },
                  ]}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>
                  {progressPercent}% OF DAILY TARGET
                </Text>
                <Text style={{ fontSize: 11, color: theme.subtext }}>
                  {Math.max(0, targetSteps - stepTracker.steps).toLocaleString()} steps remaining
                </Text>
              </View>
            </View>

            {/* LIVE KINEMATICS & CADENCE GRID (STRICT 2-COLUMN ROWS) */}
            <View style={{ gap: 10 }}>
              {/* ROW 1: CADENCE & DISTANCE */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Cadence */}
                <View style={[styles.statTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Gauge size={14} color={getMovementColor()} />
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>STRIDE CADENCE</Text>
                  </View>
                  <Text style={[styles.statVal, { color: getMovementColor() }]}>
                    {stepTracker.cadenceSpm} <Text style={{ fontSize: 11, color: theme.subtext }}>SPM</Text>
                  </Text>
                  <View style={[styles.movementBadge, { backgroundColor: `${getMovementColor()}18` }]}>
                    <Text style={[styles.movementBadgeText, { color: getMovementColor() }]}>
                      {stepTracker.movementState}
                    </Text>
                  </View>
                </View>

                {/* Distance */}
                <View style={[styles.statTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Compass size={14} color="#00F0FF" />
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>DISTANCE</Text>
                  </View>
                  <Text style={[styles.statVal, { color: '#00F0FF' }]}>
                    {stepTracker.distanceKm} <Text style={{ fontSize: 11, color: theme.subtext }}>KM</Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 4 }}>
                    Stride: {userProfile.heightCm || 178}cm
                  </Text>
                </View>
              </View>

              {/* ROW 2: ACTIVE BURN & ACTIVE TIME */}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {/* Active Calories */}
                <View style={[styles.statTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Flame size={14} color="#FF9500" />
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>ACTIVE BURN</Text>
                  </View>
                  <Text style={[styles.statVal, { color: '#FF9500' }]}>
                    {stepTracker.caloriesBurned} <Text style={{ fontSize: 11, color: theme.subtext }}>kcal</Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 4 }}>
                    Mass: {userProfile.bodyWeightKg || 75}kg
                  </Text>
                </View>

                {/* Active Duration */}
                <View style={[styles.statTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Activity size={14} color="#34C759" />
                    <Text style={[styles.statLabel, { color: theme.subtext }]}>ACTIVE TIME</Text>
                  </View>
                  <Text style={[styles.statVal, { color: '#34C759' }]}>
                    {stepTracker.activeDurationMin} <Text style={{ fontSize: 11, color: theme.subtext }}>MIN</Text>
                  </Text>
                  <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 4 }}>
                    Continuous flow
                  </Text>
                </View>
              </View>
            </View>

            {/* SENSOR DIAGNOSTICS & TELEMETRY (2-COLUMN GRID) */}
            <View style={[styles.diagnosticsCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Zap size={15} color={theme.primary} />
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Hardware Sensor Pipeline</Text>
                </View>
                <View style={[styles.onlinePill, { backgroundColor: '#34C75920' }]}>
                  <View style={styles.onlineDot} />
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#34C759' }}>ACTIVE</Text>
                </View>
              </View>

              <View style={{ gap: 8 }}>
                {/* Diag Row 1 */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.diagBox, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.diagLabel, { color: theme.subtext }]}>ACCELEROMETER</Text>
                    <Text style={[styles.diagVal, { color: theme.text, marginTop: 2 }]}>{stepTracker.netGForce} G</Text>
                    <Text style={{ fontSize: 9, color: theme.subtext, marginTop: 1 }}>3-Axis dynamic vector</Text>
                  </View>

                  <View style={[styles.diagBox, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.diagLabel, { color: theme.subtext }]}>PEDOMETER</Text>
                    <Text style={[styles.diagVal, { color: stepTracker.isPedometerActive ? '#34C759' : '#FF9500', marginTop: 2 }]}>
                      {stepTracker.isPedometerActive ? 'Continuous' : 'Fallback'}
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.subtext, marginTop: 1 }}>Hardware counting</Text>
                  </View>
                </View>

                {/* Diag Row 2 */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.diagBox, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.diagLabel, { color: theme.subtext }]}>SIGNAL QUALITY</Text>
                    <Text style={[styles.diagVal, { color: stepTracker.isSensorMoving ? theme.primary : theme.subtext, marginTop: 2 }]}>
                      {stepTracker.isSensorMoving ? 'Dynamic Motion' : 'Stationary'}
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.subtext, marginTop: 1 }}>Foot-strike crest</Text>
                  </View>

                  <View style={[styles.diagBox, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.diagLabel, { color: theme.subtext }]}>SAMPLING RATE</Text>
                    <Text style={[styles.diagVal, { color: '#00F0FF', marginTop: 2 }]}>25 Hz (40ms)</Text>
                    <Text style={{ fontSize: 9, color: theme.subtext, marginTop: 1 }}>Zero-lag detection</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* DAILY TARGET STEP PRESETS (2-COLUMN GRID) */}
            <View style={[styles.presetsCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <Target size={15} color={theme.primary} />
                <Text style={[styles.cardTitle, { color: theme.text }]}>Configure Daily Step Goal</Text>
              </View>

              <View style={{ gap: 8 }}>
                {[
                  [6000, 8000],
                  [10000, 12000],
                  [15000, 20000],
                ].map(([s1, s2], rIdx) => (
                  <View key={rIdx} style={{ flexDirection: 'row', gap: 8 }}>
                    {[s1, s2].map((steps) => {
                      const isSel = targetSteps === steps;
                      return (
                        <TouchableOpacity
                          key={steps}
                          onPress={() => handleSetTarget(steps)}
                          style={[
                            styles.targetChip,
                            {
                              flex: 1,
                              backgroundColor: isSel ? theme.primary : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                              paddingVertical: 10,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '900',
                              color: isSel ? theme.primaryText : theme.text,
                            }}
                          >
                            {steps.toLocaleString()} Steps
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* QUICK STEP LOGGING / TESTING */}
            <View style={[styles.manualCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 4 }]}>Manual Quick Adjustment</Text>
              <Text style={{ fontSize: 11, color: theme.subtext, marginBottom: 10 }}>
                Log steps from treadmill, outdoor trail, or calibrate sensor baseline.
              </Text>

              <View style={{ gap: 8 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      stepTracker.addManualSteps(250);
                    }}
                    style={[styles.addStepBtn, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.primary} />
                    <Text style={[styles.addStepText, { color: theme.text }]}>+250 Steps</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      stepTracker.addManualSteps(500);
                    }}
                    style={[styles.addStepBtn, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.primary} />
                    <Text style={[styles.addStepText, { color: theme.text }]}>+500 Steps</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      stepTracker.addManualSteps(1000);
                    }}
                    style={[styles.addStepBtn, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.primary} />
                    <Text style={[styles.addStepText, { color: theme.text }]}>+1,000 Steps</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                      stepTracker.resetTodaySteps();
                    }}
                    style={[styles.addStepBtn, { flex: 1, backgroundColor: `${theme.accentRed}15`, borderColor: theme.accentRed }]}
                  >
                    <RotateCcw size={14} color={theme.accentRed} />
                    <Text style={[styles.addStepText, { color: theme.accentRed }]}>Reset Daily</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
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
  modalContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 16,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  permissionBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 4,
  },
  heroCard: {
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  ringCenterBox: {
    alignItems: 'center',
    marginVertical: 10,
  },
  glowRing: {
    width: 170,
    height: 170,
    borderRadius: 85,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerRing: {
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStepsCount: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  heroStepsLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  progressBarTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statTile: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  diagBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statVal: {
    fontSize: 18,
    fontWeight: '900',
  },
  movementBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  movementBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  diagnosticsCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  onlinePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34C759',
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  diagLabel: {
    fontSize: 11,
  },
  diagVal: {
    fontSize: 11,
    fontWeight: '700',
  },
  presetsCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  targetChip: {
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  manualCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  addStepBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  addStepText: {
    fontSize: 11,
    fontWeight: '800',
  },
});

