import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Target, X, Check, Plus, Minus, Flame, Dumbbell, Utensils, Footprints } from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import { UserProfile, saveDailyTargets } from '../db/database';

interface DailyTargetsModalProps {
  visible: boolean;
  theme: ThemePalette;
  userProfile: UserProfile;
  onClose: () => void;
  onTargetsSaved: (updated: UserProfile) => void;
}

const VOLUME_PRESETS = [3000, 5000, 8000, 10000, 15000];
const SETS_PRESETS = [10, 15, 20, 25, 30];
const CALORIE_PRESETS = [1800, 2200, 2500, 2800, 3200];
const PROTEIN_PRESETS = [120, 140, 160, 180, 200];
const WATER_PRESETS = [2000, 2500, 3000, 3500, 4000];
const STEP_PRESETS = [6000, 8000, 10000, 12000, 15000];

export const DailyTargetsModal: React.FC<DailyTargetsModalProps> = ({
  visible,
  theme,
  userProfile,
  onClose,
  onTargetsSaved,
}) => {
  const insets = useSafeAreaInsets();
  const [volumeKg, setVolumeKg] = useState<number>(5000);
  const [setsCount, setSetsCount] = useState<number>(20);
  const [calories, setCalories] = useState<number>(2400);
  const [proteinG, setProteinG] = useState<number>(160);
  const [waterMl, setWaterMl] = useState<number>(3000);
  const [stepsCount, setStepsCount] = useState<number>(10000);

  useEffect(() => {
    if (visible && userProfile) {
      setVolumeKg(userProfile.targetVolumeKg || 5000);
      setSetsCount(userProfile.targetSets || 20);
      setCalories(userProfile.targetCalories || 2400);
      setProteinG(userProfile.targetProtein || 160);
      setWaterMl(userProfile.targetWaterMl || 3000);
      setStepsCount(userProfile.targetDailySteps || 10000);
    }
  }, [visible, userProfile]);

  const handleSave = () => {
    const updated = saveDailyTargets({
      targetVolumeKg: volumeKg,
      targetSets: setsCount,
      targetCalories: calories,
      targetProtein: proteinG,
      targetWaterMl: waterMl,
      targetDailySteps: stepsCount,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onTargetsSaved(updated);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              paddingBottom: Math.max(16, insets.bottom),
            },
          ]}
        >
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.targetIconCircle, { backgroundColor: `${theme.primary}20` }]}>
                <Target size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                  Daily Targets
                </Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]} numberOfLines={1}>
                  Powers your Activity Rings & Nutrition progress
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

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: Math.max(28, insets.bottom + 16) }}
          >
            {/* 1. MOVE RING (DAILY VOLUME) */}
            <View style={[styles.targetSectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.ringIndicatorDot, { backgroundColor: theme.accentRed }]} />
                  <Text style={[styles.targetCardLabel, { color: theme.accentRed }]}>
                    MOVE RING (DAILY VOLUME)
                  </Text>
                </View>
                <Text style={[styles.targetCardDesc, { color: theme.subtext }]}>Weight × Reps</Text>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.currentValueText, { color: theme.accentRed }]}>
                  {volumeKg.toLocaleString()}{' '}
                  <Text style={[styles.unitText, { color: theme.subtext }]}>KG</Text>
                </Text>

                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    onPress={() => {
                      setVolumeKg((prev) => Math.max(500, prev - 500));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Minus size={14} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setVolumeKg((prev) => prev + 500);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {VOLUME_PRESETS.map((val) => {
                  const active = volumeKg === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        setVolumeKg(val);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: active ? `${theme.accentRed}25` : theme.card,
                          borderColor: active ? theme.accentRed : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.presetChipText, { color: active ? theme.accentRed : theme.text }]}>
                        {val.toLocaleString()} KG
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 2. EXERCISE RING (WORKING SETS) */}
            <View style={[styles.targetSectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.ringIndicatorDot, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.targetCardLabel, { color: theme.primary }]}>
                    EXERCISE RING (WORKING SETS)
                  </Text>
                </View>
                <Text style={[styles.targetCardDesc, { color: theme.subtext }]}>Completed Sets</Text>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.currentValueText, { color: theme.primary }]}>
                  {setsCount}{' '}
                  <Text style={[styles.unitText, { color: theme.subtext }]}>SETS</Text>
                </Text>

                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    onPress={() => {
                      setSetsCount((prev) => Math.max(1, prev - 1));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Minus size={14} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setSetsCount((prev) => prev + 1);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {SETS_PRESETS.map((val) => {
                  const active = setsCount === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        setSetsCount(val);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: active ? `${theme.primary}25` : theme.card,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.presetChipText, { color: active ? theme.primary : theme.text }]}>
                        {val} Sets
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. CALORIES TARGET */}
            <View style={[styles.targetSectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.ringIndicatorDot, { backgroundColor: theme.accentOrange }]} />
                  <Text style={[styles.targetCardLabel, { color: theme.accentOrange }]}>
                    DAILY CALORIE INTAKE
                  </Text>
                </View>
                <Text style={[styles.targetCardDesc, { color: theme.subtext }]}>Daily Energy Target</Text>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.currentValueText, { color: theme.accentOrange }]}>
                  {calories.toLocaleString()}{' '}
                  <Text style={[styles.unitText, { color: theme.subtext }]}>KCAL</Text>
                </Text>

                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    onPress={() => {
                      setCalories((prev) => Math.max(500, prev - 100));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Minus size={14} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setCalories((prev) => prev + 100);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {CALORIE_PRESETS.map((val) => {
                  const active = calories === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        setCalories(val);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: active ? `${theme.accentOrange}25` : theme.card,
                          borderColor: active ? theme.accentOrange : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.presetChipText, { color: active ? theme.accentOrange : theme.text }]}>
                        {val.toLocaleString()} kcal
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 4. PROTEIN GOAL */}
            <View style={[styles.targetSectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.ringIndicatorDot, { backgroundColor: theme.accentCyan }]} />
                  <Text style={[styles.targetCardLabel, { color: theme.accentCyan }]}>
                    PROTEIN MUSCLE RECOVERY GOAL
                  </Text>
                </View>
                <Text style={[styles.targetCardDesc, { color: theme.subtext }]}>Hypertrophy Building</Text>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.currentValueText, { color: theme.accentCyan }]}>
                  {proteinG}{' '}
                  <Text style={[styles.unitText, { color: theme.subtext }]}>GRAMS</Text>
                </Text>

                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    onPress={() => {
                      setProteinG((prev) => Math.max(20, prev - 10));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Minus size={14} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setProteinG((prev) => prev + 10);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {PROTEIN_PRESETS.map((val) => {
                  const active = proteinG === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        setProteinG(val);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: active ? `${theme.accentCyan}25` : theme.card,
                          borderColor: active ? theme.accentCyan : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.presetChipText, { color: active ? theme.accentCyan : theme.text }]}>
                        {val}g Protein
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 5. HYDRATION TARGET */}
            <View style={[styles.targetSectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.ringIndicatorDot, { backgroundColor: '#00F0FF' }]} />
                  <Text style={[styles.targetCardLabel, { color: '#00F0FF' }]}>
                    DAILY HYDRATION GOAL
                  </Text>
                </View>
                <Text style={[styles.targetCardDesc, { color: theme.subtext }]}>Water Intake</Text>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.currentValueText, { color: '#00F0FF' }]}>
                  {waterMl.toLocaleString()}{' '}
                  <Text style={[styles.unitText, { color: theme.subtext }]}>ML</Text>
                </Text>

                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    onPress={() => {
                      setWaterMl((prev) => Math.max(500, prev - 250));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Minus size={14} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setWaterMl((prev) => prev + 250);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {WATER_PRESETS.map((val) => {
                  const active = waterMl === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        setWaterMl(val);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: active ? 'rgba(0,240,255,0.2)' : theme.card,
                          borderColor: active ? '#00F0FF' : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.presetChipText, { color: active ? '#00F0FF' : theme.text }]}>
                        {(val / 1000).toFixed(1)}L ({val} ml)
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 6. DAILY STEP TARGET */}
            <View style={[styles.targetSectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={[styles.ringIndicatorDot, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.targetCardLabel, { color: theme.primary }]}>DAILY STEPS GOAL</Text>
                </View>
                <Text style={[styles.targetCardDesc, { color: theme.subtext }]}>Fused Motion Pedometer</Text>
              </View>

              <View style={styles.valueRow}>
                <Text style={[styles.currentValueText, { color: theme.primary }]}>
                  {stepsCount.toLocaleString()} <Text style={[styles.unitText, { color: theme.subtext }]}>STEPS</Text>
                </Text>

                <View style={styles.stepperBox}>
                  <TouchableOpacity
                    onPress={() => {
                      setStepsCount((prev) => Math.max(1000, prev - 1000));
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Minus size={14} color={theme.text} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setStepsCount((prev) => prev + 1000);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={14} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginTop: 8 }}>
                {STEP_PRESETS.map((val) => {
                  const active = stepsCount === val;
                  return (
                    <TouchableOpacity
                      key={val}
                      onPress={() => {
                        setStepsCount(val);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor: active ? `${theme.primary}25` : theme.card,
                          borderColor: active ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text style={[styles.presetChipText, { color: active ? theme.primary : theme.text }]}>
                        {(val / 1000).toFixed(0)}k Steps
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* SAVE BUTTON */}
            <TouchableOpacity
              onPress={handleSave}
              activeOpacity={0.85}
              style={[styles.saveTargetsBtn, { backgroundColor: theme.primary }]}
            >
              <Check size={18} color={theme.primaryText} />
              <Text style={[styles.saveTargetsBtnText, { color: theme.primaryText }]}>
                SAVE DAILY TARGETS
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 18,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  targetIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetSectionCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ringIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  targetCardLabel: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  targetCardDesc: {
    fontSize: 10,
    fontWeight: '600',
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  currentValueText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperBox: {
    flexDirection: 'row',
    gap: 8,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  presetChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  saveTargetsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 15,
    marginTop: 8,
  },
  saveTargetsBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});

