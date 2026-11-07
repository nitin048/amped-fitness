import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Sparkles,
  X,
  Play,
  Clock,
  Dumbbell,
  Zap,
  Target,
  Flame,
  Shield,
  Layers,
  ChevronRight,
  Check,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import { generateAiWorkoutPlan, GeneratedWorkoutPlan } from '../services/aiWorkoutCoach';
import { UserProfile } from '../db/database';

interface AiWorkoutModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onStartGeneratedWorkout: (plan: GeneratedWorkoutPlan) => void;
  userProfile?: UserProfile;
}

const SPLIT_OPTIONS = ['Push', 'Pull', 'Legs', 'Upper Body', 'Lower Body', 'Full Body'];
const GOAL_OPTIONS = ['Hypertrophy', 'Max Strength', 'Fat Loss', 'Conditioning'];
const EQUIPMENT_OPTIONS = ['Full Gym', 'Dumbbells Only', 'Barbell & Rack', 'Bodyweight'];
const DURATION_OPTIONS = ['30 Min', '45 Min', '60 Min'];

export const AiWorkoutModal: React.FC<AiWorkoutModalProps> = ({
  visible,
  theme,
  onClose,
  onStartGeneratedWorkout,
  userProfile,
}) => {
  const [selectedSplit, setSelectedSplit] = useState<string>('Push');
  const [selectedGoal, setSelectedGoal] = useState<string>('Hypertrophy');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Full Gym');
  const [selectedDuration, setSelectedDuration] = useState<string>('45 Min');
  const [prompt, setPrompt] = useState<string>('45-minute Push hypertrophy workout with dumbbells & cables');
  const [loading, setLoading] = useState<boolean>(false);
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedWorkoutPlan | null>(null);

  React.useEffect(() => {
    if (visible && userProfile) {
      // Derive initial selections from athlete profile
      let s = 'Push';
      if (userProfile.preferredSplit?.includes('Pull')) s = 'Pull';
      else if (userProfile.preferredSplit?.includes('Legs')) s = 'Legs';
      else if (userProfile.preferredSplit?.includes('Upper')) s = 'Upper Body';
      else if (userProfile.preferredSplit?.includes('Lower')) s = 'Lower Body';
      else if (userProfile.preferredSplit?.includes('Full')) s = 'Full Body';
      setSelectedSplit(s);

      let g = 'Hypertrophy';
      if (userProfile.fitnessGoal?.includes('Strength') || userProfile.fitnessGoal?.includes('Power')) g = 'Max Strength';
      else if (userProfile.fitnessGoal?.includes('Fat') || userProfile.fitnessGoal?.includes('Cut')) g = 'Fat Loss';
      else if (userProfile.fitnessGoal?.includes('Conditioning')) g = 'Conditioning';
      setSelectedGoal(g);

      let eq = 'Full Gym';
      if (userProfile.availableEquipment?.includes('Dumbbells Only')) eq = 'Dumbbells Only';
      else if (userProfile.availableEquipment?.includes('Home') || userProfile.availableEquipment?.includes('Barbell')) eq = 'Barbell & Rack';
      else if (userProfile.availableEquipment?.includes('Bodyweight')) eq = 'Bodyweight';
      setSelectedEquipment(eq);

      const durMin = userProfile.targetWorkoutDurationMin || 45;
      const dur = durMin <= 35 ? '30 Min' : durMin <= 50 ? '45 Min' : '60 Min';
      setSelectedDuration(dur);

      const initialPrompt = `${dur} ${s} session focused on ${g} using ${eq.toLowerCase()} tailored for ${userProfile.experienceLevel || 'Intermediate'}`;
      setPrompt(initialPrompt);
    }
  }, [visible, userProfile]);

  const updatePromptFromFilters = (split: string, goal: string, equip: string, dur: string) => {
    const text = `${dur} ${split} session focused on ${goal} using ${equip.toLowerCase()}`;
    setPrompt(text);
  };

  const handleSelectSplit = (split: string) => {
    setSelectedSplit(split);
    updatePromptFromFilters(split, selectedGoal, selectedEquipment, selectedDuration);
    Haptics.selectionAsync();
  };

  const handleSelectGoal = (goal: string) => {
    setSelectedGoal(goal);
    updatePromptFromFilters(selectedSplit, goal, selectedEquipment, selectedDuration);
    Haptics.selectionAsync();
  };

  const handleSelectEquipment = (equip: string) => {
    setSelectedEquipment(equip);
    updatePromptFromFilters(selectedSplit, selectedGoal, equip, selectedDuration);
    Haptics.selectionAsync();
  };

  const handleSelectDuration = (dur: string) => {
    setSelectedDuration(dur);
    updatePromptFromFilters(selectedSplit, selectedGoal, selectedEquipment, dur);
    Haptics.selectionAsync();
  };

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    setLoading(true);
    setGeneratedPlan(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const plan = await generateAiWorkoutPlan(textToUse, userProfile);
      setGeneratedPlan(plan);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      // Handled inside service fallback
    } finally {
      setLoading(false);
    }
  };

  const handleStartPlan = () => {
    if (!generatedPlan) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStartGeneratedWorkout(generatedPlan);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
              <View style={[styles.sparkleCircle, { backgroundColor: `${theme.primary}20` }]}>
                <Sparkles size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={[styles.modalTitle, { color: theme.text }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  AI Workout Coach
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.subtext }]} numberOfLines={1}>
                  Personalized Sports Science Program Generator
                </Text>
              </View>
            </View>

            {/* VISIBLE CIRCULAR CLOSE BUTTON */}
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 30 }}>
            {/* 1. TARGET SPLIT CHIPS */}
            <Text style={[styles.filterGroupTitle, { color: theme.subtext }]}>TARGET SPLIT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
              {SPLIT_OPTIONS.map((sp) => {
                const active = selectedSplit === sp;
                return (
                  <TouchableOpacity
                    key={sp}
                    onPress={() => handleSelectSplit(sp)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? theme.primary : theme.cardElevated,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? theme.primaryText : theme.text },
                      ]}
                    >
                      {sp}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 2. GOAL & DURATION ROW */}
            <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.filterGroupTitle, { color: theme.subtext }]}>GOAL</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {GOAL_OPTIONS.map((g) => {
                    const active = selectedGoal === g;
                    return (
                      <TouchableOpacity
                        key={g}
                        onPress={() => handleSelectGoal(g)}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: active ? `${theme.primary}25` : theme.cardElevated,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            { color: active ? theme.primary : theme.text },
                          ]}
                        >
                          {g}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              <View style={{ width: 140 }}>
                <Text style={[styles.filterGroupTitle, { color: theme.subtext }]}>DURATION</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                  {DURATION_OPTIONS.map((d) => {
                    const active = selectedDuration === d;
                    return (
                      <TouchableOpacity
                        key={d}
                        onPress={() => handleSelectDuration(d)}
                        style={[
                          styles.filterChip,
                          {
                            backgroundColor: active ? `${theme.primary}25` : theme.cardElevated,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            { color: active ? theme.primary : theme.text },
                          ]}
                        >
                          {d}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* 3. EQUIPMENT */}
            <Text style={[styles.filterGroupTitle, { color: theme.subtext }]}>EQUIPMENT ACCESSIBLE</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 12 }}>
              {EQUIPMENT_OPTIONS.map((eq) => {
                const active = selectedEquipment === eq;
                return (
                  <TouchableOpacity
                    key={eq}
                    onPress={() => handleSelectEquipment(eq)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? `${theme.primary}25` : theme.cardElevated,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        { color: active ? theme.primary : theme.text },
                      ]}
                    >
                      {eq}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 4. PROMPT INPUT */}
            <Text style={[styles.filterGroupTitle, { color: theme.subtext }]}>COACH DIRECTIVE</Text>
            <View style={[styles.inputBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <TextInput
                placeholder="e.g. 45 min Push hypertrophy focusing on upper chest and lateral delts"
                placeholderTextColor={theme.subtext}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                style={[styles.textInput, { color: theme.text }]}
              />
            </View>

            {/* GENERATE BUTTON */}
            <TouchableOpacity
              onPress={() => handleGenerate()}
              disabled={loading}
              activeOpacity={0.85}
              style={[styles.generateBtn, { backgroundColor: theme.primary }]}
            >
              {loading ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <ActivityIndicator size="small" color={theme.primaryText} />
                  <Text style={[styles.generateBtnText, { color: theme.primaryText }]}>
                    Designing Optimal Protocol...
                  </Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Zap size={18} color={theme.primaryText} fill={theme.primaryText} />
                  <Text style={[styles.generateBtnText, { color: theme.primaryText }]}>
                    GENERATE AI WORKOUT
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* GENERATED PLAN DISPLAY */}
            {generatedPlan && (
              <View style={[styles.planCard, { backgroundColor: theme.cardElevated, borderColor: theme.primary }]}>
                <View style={styles.planHeader}>
                  <Text style={[styles.planTitle, { color: theme.text }]}>{generatedPlan.title}</Text>
                  <Text style={[styles.planTagline, { color: theme.primary }]}>{generatedPlan.tagline}</Text>
                </View>

                {/* META BADGES */}
                <View style={styles.planMetaRow}>
                  <View style={[styles.metaPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Clock size={12} color={theme.primary} />
                    <Text style={[styles.metaPillText, { color: theme.text }]}>
                      {generatedPlan.estimatedMinutes} Mins
                    </Text>
                  </View>
                  <View style={[styles.metaPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Flame size={12} color={theme.accentOrange} />
                    <Text style={[styles.metaPillText, { color: theme.text }]}>
                      {generatedPlan.exercises.length} Exercises
                    </Text>
                  </View>
                  <View style={[styles.metaPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Dumbbell size={12} color={theme.accentCyan} />
                    <Text style={[styles.metaPillText, { color: theme.text }]}>
                      {generatedPlan.split} Split
                    </Text>
                  </View>
                </View>

                {/* COACHING CUES */}
                <View style={[styles.coachTipsBox, { backgroundColor: `${theme.primary}15`, borderColor: theme.border }]}>
                  <Text style={[styles.coachTipsTitle, { color: theme.primary }]}>COACHING CUES</Text>
                  <Text style={[styles.coachTipsBody, { color: theme.text }]}>{generatedPlan.coachTips}</Text>
                </View>

                {/* EXERCISES LIST */}
                <Text style={[styles.exercisesHeader, { color: theme.subtext }]}>EXERCISE PROTOCOL</Text>
                {generatedPlan.exercises.map((ex, i) => (
                  <View
                    key={i}
                    style={[
                      styles.exerciseRow,
                      { borderBottomColor: theme.border },
                      i === generatedPlan.exercises.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[styles.exName, { color: theme.text }]} numberOfLines={1}>
                        {i + 1}. {ex.name}
                      </Text>
                      <Text style={[styles.exCue, { color: theme.subtext }]}>
                        {ex.coachingCue}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                      <Text style={[styles.exSets, { color: theme.primary }]} numberOfLines={1}>
                        {ex.targetSets} sets × {ex.repsRange}
                      </Text>
                      <Text style={[styles.exMeta, { color: theme.subtext }]} numberOfLines={1}>
                        RPE {ex.rpe} • {ex.restSec}s rest
                      </Text>
                    </View>
                  </View>
                ))}

                {/* START THIS WORKOUT BUTTON (SINGLE PLAY ICON, NO DUPLICATE) */}
                <TouchableOpacity
                  onPress={handleStartPlan}
                  activeOpacity={0.85}
                  style={[styles.startPlanBtn, { backgroundColor: theme.primary }]}
                >
                  <Play size={18} color={theme.primaryText} fill={theme.primaryText} />
                  <Text style={[styles.startPlanBtnText, { color: theme.primaryText }]}>
                    Start Workout Session
                  </Text>
                </TouchableOpacity>
              </View>
            )}
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
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '92%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sparkleCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  modalSubtitle: {
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
  filterGroupTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  inputBox: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  textInput: {
    fontSize: 13,
    minHeight: 44,
    textAlignVertical: 'top',
  },
  generateBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  generateBtnText: {
    fontSize: 13.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  planCard: {
    borderRadius: 22,
    padding: 16,
    borderWidth: 1.5,
    marginTop: 4,
  },
  planHeader: {
    marginBottom: 10,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  planTagline: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  planMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  metaPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  coachTipsBox: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  coachTipsTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  coachTipsBody: {
    fontSize: 12,
    lineHeight: 16,
  },
  exercisesHeader: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  exName: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  exCue: {
    fontSize: 11,
    lineHeight: 14,
  },
  exSets: {
    fontSize: 13,
    fontWeight: '800',
  },
  exMeta: {
    fontSize: 10,
    marginTop: 2,
  },
  startPlanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 16,
  },
  startPlanBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});
