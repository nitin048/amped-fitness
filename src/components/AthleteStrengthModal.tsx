import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Trophy,
  X,
  Zap,
  TrendingUp,
  Dumbbell,
  Crown,
  ChevronRight,
  Info,
  ShieldCheck,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import { UserProfile, db, calculate1RM } from '../db/database';
import {
  getAthleteStrengthScore,
  AthleteStrengthResult,
} from '../utils/strengthFormulas';
import { sanitizeWeightInput } from '../utils/inputValidation';

interface AthleteStrengthModalProps {
  visible: boolean;
  theme: ThemePalette;
  userProfile: UserProfile;
  onClose: () => void;
}

export const AthleteStrengthModal: React.FC<AthleteStrengthModalProps> = ({
  visible,
  theme,
  userProfile,
  onClose,
}) => {
  const [bodyWeight, setBodyWeight] = useState<number>(userProfile.bodyWeightKg || 75);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [benchKg, setBenchKg] = useState<number>(90);
  const [squatKg, setSquatKg] = useState<number>(120);
  const [deadliftKg, setDeadliftKg] = useState<number>(150);

  // Auto-detect athlete PRs from database on open
  useEffect(() => {
    if (!visible) return;

    setBodyWeight(userProfile.bodyWeightKg || 75);
    setGender(userProfile.gender?.toLowerCase() === 'female' ? 'female' : 'male');

    try {
      const sets = db.getAllSync<{ exercise_id: string; weight_kg: number; reps: number }>(
        `SELECT exercise_id, weight_kg, reps FROM workout_sets`
      );

      let bestBench = 0;
      let bestSquat = 0;
      let bestDeadlift = 0;

      for (const s of sets) {
        const orm = calculate1RM(s.weight_kg, s.reps);
        const exId = s.exercise_id.toLowerCase();
        if (exId.includes('bench') && orm > bestBench) bestBench = orm;
        if (exId.includes('squat') && orm > bestSquat) bestSquat = orm;
        if (exId.includes('deadlift') && orm > bestDeadlift) bestDeadlift = orm;
      }

      if (bestBench > 0) setBenchKg(bestBench);
      if (bestSquat > 0) setSquatKg(bestSquat);
      if (bestDeadlift > 0) setDeadliftKg(bestDeadlift);
      if (userProfile.bodyWeightKg) setBodyWeight(userProfile.bodyWeightKg);
    } catch (e) {
      console.warn('Strength PR auto-fetch warning:', e);
    }
  }, [visible, userProfile]);

  const strength: AthleteStrengthResult = getAthleteStrengthScore(
    bodyWeight,
    gender,
    benchKg,
    squatKg,
    deadliftKg
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {/* HEADER */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconCircle, { backgroundColor: `${strength.tier.color}25` }]}>
                <Trophy size={20} color={strength.tier.color} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Strength Index & DOTS</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>
                  OpenPowerlifting Universal Ranking Algorithm
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* HERO TIER BADGE CARD */}
            <View style={[styles.heroTierCard, { backgroundColor: theme.cardElevated, borderColor: strength.tier.color }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View>
                  <Text style={[styles.tierEyebrow, { color: theme.subtext }]}>POUND-FOR-POUND TIER</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                    <Text style={{ fontSize: 22 }}>{strength.tier.badge}</Text>
                    <Text style={[styles.tierTitle, { color: strength.tier.color }]}>
                      {strength.tier.name}
                    </Text>
                  </View>
                </View>

                {/* BIG SCORE DISPLAY */}
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.scoreValue, { color: theme.text }]}>
                    {strength.dotsScore}
                  </Text>
                  <Text style={[styles.scoreLabel, { color: strength.tier.color }]}>
                    DOTS SCORE
                  </Text>
                </View>
              </View>

              <Text style={[styles.tierDescription, { color: theme.subtext }]}>
                {strength.tier.description}
              </Text>

              {/* PROGRESS BAR TO NEXT TIER */}
              <View style={styles.percentileRow}>
                <View style={[styles.percentileTrack, { backgroundColor: theme.card }]}>
                  <View
                    style={[
                      styles.percentileFill,
                      {
                        width: `${Math.min(100, (strength.dotsScore / 550) * 100)}%`,
                        backgroundColor: strength.tier.color,
                      },
                    ]}
                  />
                </View>
                <Text style={{ fontSize: 11, fontWeight: '800', color: strength.tier.color }}>
                  Top {100 - strength.tier.percentile}% Lifter
                </Text>
              </View>
            </View>

            {/* ATHLETE BIOMETRIC CONTROLS */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Lifter Specification</Text>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {/* Gender Toggle */}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext }]}>GENDER</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    {(['male', 'female'] as const).map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => {
                          setGender(g);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.genderBtn,
                          {
                            backgroundColor: gender === g ? theme.primary : theme.card,
                            borderColor: gender === g ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.genderBtnText,
                            { color: gender === g ? theme.primaryText : theme.subtext },
                          ]}
                        >
                          {g.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Bodyweight */}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext }]}>BODY WEIGHT (KG)</Text>
                  <TextInput
                    value={String(bodyWeight)}
                    onChangeText={(t) => {
                      const s = sanitizeWeightInput(t);
                      setBodyWeight(Math.min(300, parseFloat(s) || 0));
                    }}
                    keyboardType="numeric"
                    maxLength={5}
                    style={[styles.inputBox, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                  />
                </View>
              </View>
            </View>

            {/* BIG 3 COMPOUND PR INPUTS */}
            <View style={[styles.sectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>Big 3 Compound 1RMs</Text>
                <Text style={{ fontSize: 12, fontWeight: '900', color: theme.primary }}>
                  Total: {strength.totalKg} kg
                </Text>
              </View>

              <View style={{ gap: 10, marginTop: 12 }}>
                {/* Bench */}
                <View style={styles.liftRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.liftName, { color: theme.text }]}>Barbell Bench Press</Text>
                    <Text style={{ fontSize: 10, color: theme.subtext }}>Pectorals & Triceps</Text>
                  </View>
                  <View style={styles.liftInputContainer}>
                    <TextInput
                      value={String(benchKg)}
                      onChangeText={(t) => {
                        const s = sanitizeWeightInput(t);
                        setBenchKg(Math.min(400, parseFloat(s) || 0));
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                      style={[styles.liftInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.subtext }}>KG</Text>
                  </View>
                </View>

                {/* Squat */}
                <View style={styles.liftRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.liftName, { color: theme.text }]}>Barbell Back Squat</Text>
                    <Text style={{ fontSize: 10, color: theme.subtext }}>Quadriceps & Glutes</Text>
                  </View>
                  <View style={styles.liftInputContainer}>
                    <TextInput
                      value={String(squatKg)}
                      onChangeText={(t) => {
                        const s = sanitizeWeightInput(t);
                        setSquatKg(Math.min(550, parseFloat(s) || 0));
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                      style={[styles.liftInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.subtext }}>KG</Text>
                  </View>
                </View>

                {/* Deadlift */}
                <View style={styles.liftRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.liftName, { color: theme.text }]}>Barbell Deadlift</Text>
                    <Text style={{ fontSize: 10, color: theme.subtext }}>Posterior Chain</Text>
                  </View>
                  <View style={styles.liftInputContainer}>
                    <TextInput
                      value={String(deadliftKg)}
                      onChangeText={(t) => {
                        const s = sanitizeWeightInput(t);
                        setDeadliftKg(Math.min(550, parseFloat(s) || 0));
                      }}
                      keyboardType="numeric"
                      maxLength={5}
                      style={[styles.liftInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                    />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.subtext }}>KG</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* WILKS & METRICS SUMMARY */}
            <View style={[styles.summaryCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, { color: theme.subtext }]}>WILKS 2020</Text>
                <Text style={[styles.summaryItemVal, { color: theme.accentCyan }]}>{strength.wilksScore}</Text>
              </View>
              <View style={{ width: 1, backgroundColor: theme.border }} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, { color: theme.subtext }]}>BODY RATIO</Text>
                <Text style={[styles.summaryItemVal, { color: theme.primary }]}>
                  {bodyWeight > 0 ? (strength.totalKg / bodyWeight).toFixed(2) : 0}x
                </Text>
              </View>
              <View style={{ width: 1, backgroundColor: theme.border }} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryItemLabel, { color: theme.subtext }]}>POWER TIER</Text>
                <Text style={[styles.summaryItemVal, { color: strength.tier.color }]}>
                  {strength.tier.name}
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
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
  scrollContent: {
    padding: 18,
  },
  heroTierCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  tierEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  tierTitle: {
    fontSize: 20,
    fontWeight: '900',
  },
  scoreValue: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  scoreLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  tierDescription: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: 8,
  },
  percentileRow: {
    marginTop: 14,
    gap: 6,
  },
  percentileTrack: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  percentileFill: {
    height: '100%',
    borderRadius: 4,
  },
  sectionCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  genderBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  inputBox: {
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    marginTop: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  liftRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  liftName: {
    fontSize: 13,
    fontWeight: '700',
  },
  liftInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liftInput: {
    width: 75,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '800',
  },
  summaryCard: {
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryItemLabel: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  summaryItemVal: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 3,
  },
});
