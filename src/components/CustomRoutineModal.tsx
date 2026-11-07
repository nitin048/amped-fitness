import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Plus,
  Minus,
  Check,
  Dumbbell,
  Clock,
  Search,
  Sparkles,
  Layers,
  ChevronRight,
} from 'lucide-react-native';
import { Exercise, saveCustomRoutine } from '../db/database';
import { WorkoutRoutine } from '../db/routines';
import { ThemePalette } from '../theme/ThemeContext';
import { sanitizeText, validateRoutineName } from '../utils/inputValidation';

interface CustomRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onRoutineCreated: (newRoutine: WorkoutRoutine) => void;
  exercises: Exercise[];
  theme: ThemePalette;
}

const SPLIT_OPTIONS: Array<{ id: WorkoutRoutine['split']; label: string; icon: string }> = [
  { id: 'PUSH', label: 'Push', icon: 'PUSH' },
  { id: 'PULL', label: 'Pull', icon: 'PULL' },
  { id: 'LEGS', label: 'Legs', icon: 'LEGS' },
  { id: 'UPPER', label: 'Upper', icon: 'UPPER' },
  { id: 'LOWER', label: 'Lower', icon: 'LOWER' },
  { id: 'ARMS', label: 'Arms & Abs', icon: 'ARMS' },
  { id: 'FULL_BODY', label: 'Full Body', icon: 'FULL_BODY' },
];

const DIFFICULTY_OPTIONS: Array<WorkoutRoutine['difficulty']> = [
  'Beginner',
  'Intermediate',
  'Advanced',
];

export const CustomRoutineModal: React.FC<CustomRoutineModalProps> = ({
  visible,
  onClose,
  onRoutineCreated,
  exercises,
  theme,
}) => {
  const insets = useSafeAreaInsets();
  const isOled = theme.name === 'MIDNIGHT_OLED';

  const [routineName, setRoutineName] = useState('');
  const [tagline, setTagline] = useState('');
  const [selectedSplit, setSelectedSplit] = useState<WorkoutRoutine['split'] | null>(null);
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [difficulty, setDifficulty] = useState<WorkoutRoutine['difficulty']>('Intermediate');
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('ALL');

  // Filter exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const matchSearch =
        !searchQuery ||
        ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ex.primary_muscle.toLowerCase().includes(searchQuery.toLowerCase());
      const matchMuscle =
        muscleFilter === 'ALL' ||
        ex.primary_muscle.toUpperCase() === muscleFilter.toUpperCase();
      return matchSearch && matchMuscle;
    });
  }, [exercises, searchQuery, muscleFilter]);

  const toggleExerciseSelection = (exId: string) => {
    Haptics.selectionAsync();
    setSelectedExerciseIds((prev) => {
      if (prev.includes(exId)) {
        return prev.filter((id) => id !== exId);
      } else {
        return [...prev, exId];
      }
    });
  };

  const adjustDuration = (delta: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDurationMinutes((prev) => Math.max(15, Math.min(180, prev + delta)));
  };

  const handleSave = () => {
    const nameVal = validateRoutineName(routineName);
    if (!nameVal.isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Invalid Routine Name', nameVal.error || 'Please enter a name for your custom workout routine (2-50 characters).');
      return;
    }

    // Auto-calculate target muscles from selected exercises if any
    const selectedExs = exercises.filter((e) => selectedExerciseIds.includes(e.id));
    const targetMuscles = Array.from(
      new Set(selectedExs.map((e) => e.primary_muscle.toUpperCase()))
    );

    const splitVal = selectedSplit || 'FULL_BODY';
    const splitMeta = SPLIT_OPTIONS.find((s) => s.id === splitVal);

    const newRoutine: Omit<WorkoutRoutine, 'isCustom'> = {
      id: `custom_${Date.now()}`,
      name: routineName.trim(),
      tagline: tagline.trim() || (selectedSplit ? `${selectedSplit} Day hypertrophy and strength` : 'Custom Apmed Routine'),
      split: splitVal,
      icon: splitMeta?.icon || 'FULL_BODY',
      estimatedMinutes: durationMinutes,
      difficulty,
      targetMuscles,
      exerciseIds: selectedExerciseIds,
    };

    try {
      const saved = saveCustomRoutine(newRoutine);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onRoutineCreated(saved);
      // Reset form
      setRoutineName('');
      setTagline('');
      setSelectedSplit(null);
      setSelectedExerciseIds([]);
      setSearchQuery('');
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to save custom routine. Please try again.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* MODAL HEADER */}
            <View style={[styles.modalHeaderRow, { borderBottomColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={14} color={theme.primary} />
                  <Text style={[styles.modalEyebrow, { color: theme.primary }]}>CUSTOM WORKOUT BUILDER</Text>
                </View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Create Routine</Text>
              </View>

              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <X size={18} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.scrollBody}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
            >
            {/* 1. ROUTINE NAME & TAGLINE */}
            <View style={styles.sectionBlock}>
              <Text style={[styles.sectionLabel, { color: theme.subtext }]}>ROUTINE NAME *</Text>
              <TextInput
                placeholder="e.g. Arms & Shoulder Blast, Upper Power..."
                placeholderTextColor={theme.subtext}
                value={routineName}
                onChangeText={(t) => setRoutineName(sanitizeText(t, 50))}
                maxLength={50}
                style={[
                  styles.textInput,
                  { backgroundColor: theme.cardElevated, borderColor: theme.border, color: theme.text },
                ]}
              />

              <Text style={[styles.sectionLabel, { color: theme.subtext, marginTop: 12 }]}>
                TARGET GOAL / TAGLINE (OPTIONAL)
              </Text>
              <TextInput
                placeholder="e.g. High mechanical tension & bicep peak isolation"
                placeholderTextColor={theme.subtext}
                value={tagline}
                onChangeText={(t) => setTagline(sanitizeText(t, 100))}
                maxLength={100}
                style={[
                  styles.textInput,
                  { backgroundColor: theme.cardElevated, borderColor: theme.border, color: theme.text },
                ]}
              />
            </View>

            {/* 2. SPLIT CATEGORY CHIPS (OPTIONAL) */}
            <View style={styles.sectionBlock}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Text style={[styles.sectionLabel, { color: theme.subtext, marginBottom: 0 }]}>
                  PRIMARY SPLIT (OPTIONAL)
                </Text>
                {selectedSplit && (
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedSplit(null);
                      Haptics.selectionAsync();
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '700' }}>None</Text>
                  </TouchableOpacity>
                )}
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {SPLIT_OPTIONS.map((opt) => {
                  const isSelected = selectedSplit === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      onPress={() => {
                        setSelectedSplit((prev) => (prev === opt.id ? null : opt.id));
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.splitChip,
                        {
                          backgroundColor: isSelected
                            ? isOled
                              ? '#FFFFFF'
                              : theme.primary
                            : theme.cardElevated,
                          borderColor: isSelected
                            ? isOled
                              ? '#FFFFFF'
                              : theme.primary
                            : theme.border,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.splitChipText,
                          {
                            color: isSelected
                              ? isOled
                                ? '#000000'
                                : theme.primaryText
                              : theme.text,
                            fontWeight: isSelected ? '900' : '600',
                          },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* 3. DURATION & DIFFICULTY ROW */}
            <View style={[styles.sectionBlock, { flexDirection: 'row', gap: 12 }]}>
              {/* Duration Stepper */}
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionLabel, { color: theme.subtext }]}>DURATION</Text>
                <View
                  style={[
                    styles.stepperContainer,
                    { backgroundColor: theme.cardElevated, borderColor: theme.border },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => adjustDuration(-5)}
                    style={[styles.stepperBtn, { backgroundColor: theme.card }]}
                  >
                    <Minus size={14} color={theme.text} />
                  </TouchableOpacity>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '900', color: theme.primary }}>
                      {durationMinutes}
                    </Text>
                    <Text style={{ fontSize: 9, color: theme.subtext, fontWeight: '700' }}>MIN</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => adjustDuration(5)}
                    style={[styles.stepperBtn, { backgroundColor: theme.card }]}
                  >
                    <Plus size={14} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Difficulty Chips */}
              <View style={{ flex: 1.2 }}>
                <Text style={[styles.sectionLabel, { color: theme.subtext }]}>DIFFICULTY</Text>
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                  {DIFFICULTY_OPTIONS.map((diff) => {
                    const isSelected = difficulty === diff;
                    return (
                      <TouchableOpacity
                        key={diff}
                        onPress={() => {
                          setDifficulty(diff);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.diffChip,
                          {
                            backgroundColor: isSelected ? `${theme.primary}25` : theme.cardElevated,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.diffChipText,
                            {
                              color: isSelected ? theme.primary : theme.subtext,
                              fontWeight: isSelected ? '900' : '600',
                            },
                          ]}
                          numberOfLines={1}
                        >
                          {diff === 'Intermediate' ? 'Inter' : diff}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>

            {/* 4. EXERCISE PICKER */}
            <View style={styles.sectionBlock}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={[styles.sectionLabel, { color: theme.subtext, marginBottom: 0 }]}>
                  SELECT MOVEMENTS ({selectedExerciseIds.length} SELECTED)
                </Text>
                {selectedExerciseIds.length > 0 && (
                  <TouchableOpacity onPress={() => setSelectedExerciseIds([])}>
                    <Text style={{ fontSize: 11, color: theme.danger, fontWeight: '700' }}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* SEARCH BOX */}
              <View
                style={[
                  styles.searchContainer,
                  { backgroundColor: theme.cardElevated, borderColor: theme.border },
                ]}
              >
                <Search size={15} color={theme.subtext} />
                <TextInput
                  placeholder="Filter exercises..."
                  placeholderTextColor={theme.subtext}
                  value={searchQuery}
                  onChangeText={(t) => setSearchQuery(sanitizeText(t, 50))}
                  maxLength={50}
                  style={[styles.searchInput, { color: theme.text }]}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Text style={{ fontSize: 11, color: theme.subtext, fontWeight: '700' }}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* MUSCLE GROUP CHIPS */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }}>
                {['ALL', 'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE'].map((m) => {
                  const isSelected = muscleFilter === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => {
                        setMuscleFilter(m);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.muscleChip,
                        {
                          backgroundColor: isSelected ? `${theme.primary}20` : theme.cardElevated,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.muscleChipText,
                          {
                            color: isSelected ? theme.primary : theme.subtext,
                            fontWeight: isSelected ? '800' : '600',
                          },
                        ]}
                      >
                        {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* EXERCISE LIST (CHECKBOXES) */}
              <View style={{ gap: 6 }}>
                {filteredExercises.map((ex) => {
                  const isChecked = selectedExerciseIds.includes(ex.id);
                  const orderIndex = selectedExerciseIds.indexOf(ex.id);
                  return (
                    <TouchableOpacity
                      key={ex.id}
                      onPress={() => toggleExerciseSelection(ex.id)}
                      style={[
                        styles.exercisePickRow,
                        {
                          backgroundColor: isChecked ? `${theme.primary}12` : theme.cardElevated,
                          borderColor: isChecked ? theme.primary : theme.border,
                        },
                      ]}
                      activeOpacity={0.75}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          {
                            backgroundColor: isChecked ? theme.primary : 'transparent',
                            borderColor: isChecked ? theme.primary : theme.subtext,
                          },
                        ]}
                      >
                        {isChecked && <Check size={12} color={theme.primaryText} />}
                      </View>

                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.exPickName, { color: theme.text }]}>{ex.name}</Text>
                        <Text style={[styles.exPickMeta, { color: theme.subtext }]}>
                          {ex.primary_muscle} • {ex.equipment}
                        </Text>
                      </View>

                      {isChecked && (
                        <View style={[styles.orderBadge, { backgroundColor: theme.primary }]}>
                          <Text style={[styles.orderBadgeText, { color: theme.primaryText }]}>
                            #{orderIndex + 1}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* BOTTOM ACTION BUTTON */}
          <View
            style={[
              styles.modalFooter,
              {
                borderTopColor: theme.border,
                backgroundColor: theme.card,
                paddingBottom: Math.max(20, insets.bottom + 12),
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleSave}
              disabled={!routineName.trim()}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: routineName.trim()
                    ? (isOled ? '#FFFFFF' : theme.primary)
                    : theme.cardElevated,
                  borderWidth: 1,
                  borderColor: routineName.trim()
                    ? (isOled ? '#FFFFFF' : theme.primary)
                    : theme.border,
                  opacity: routineName.trim() ? 1 : 0.45,
                },
              ]}
              activeOpacity={0.85}
            >
              <Check
                size={18}
                color={
                  routineName.trim()
                    ? (isOled ? '#000000' : theme.primaryText)
                    : theme.subtext
                }
              />
              <Text
                style={[
                  styles.saveBtnText,
                  {
                    color: routineName.trim()
                      ? (isOled ? '#000000' : theme.primaryText)
                      : theme.subtext,
                  },
                ]}
              >
                {selectedExerciseIds.length > 0
                  ? `Save Routine (${selectedExerciseIds.length} Exercises)`
                  : 'Save Routine'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </View>
      </KeyboardAvoidingView>
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
    maxHeight: '92%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  modalEyebrow: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  textInput: {
    fontSize: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    fontWeight: '600',
  },
  splitChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  splitChipText: {
    fontSize: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 6,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diffChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  diffChipText: {
    fontSize: 11,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    padding: 0,
  },
  muscleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 6,
  },
  muscleChipText: {
    fontSize: 11,
  },
  exercisePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exPickName: {
    fontSize: 13,
    fontWeight: '800',
  },
  exPickMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  orderBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  orderBadgeText: {
    fontSize: 10,
    fontWeight: '900',
  },
  modalFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    width: '100%',
  },
  saveBtn: {
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});

