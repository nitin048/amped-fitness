import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  X,
  Search,
  Dumbbell,
  Check,
  ChevronRight,
  Layers,
} from 'lucide-react-native';
import { Exercise } from '../db/database';
import { WorkoutRoutine } from '../db/routines';
import { ThemePalette } from '../theme/ThemeContext';
import { sanitizeText } from '../utils/inputValidation';

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (ex: Exercise) => void;
  exercises: Exercise[];
  currentRoutine?: WorkoutRoutine | null;
  currentExerciseId?: string;
  theme: ThemePalette;
}

const MUSCLE_FILTERS = [
  { id: 'ALL', label: 'All' },
  { id: 'CHEST', label: 'Chest' },
  { id: 'BACK', label: 'Back' },
  { id: 'LEGS', label: 'Legs' },
  { id: 'SHOULDERS', label: 'Shoulders' },
  { id: 'ARMS', label: 'Arms' },
  { id: 'CORE', label: 'Core' },
];

export const ExercisePickerModal: React.FC<ExercisePickerModalProps> = ({
  visible,
  onClose,
  onSelectExercise,
  exercises,
  currentRoutine,
  currentExerciseId,
  theme,
}) => {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [muscleFilter, setMuscleFilter] = useState('ALL');

  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ex.name.toLowerCase().includes(q) ||
        ex.primary_muscle.toLowerCase().includes(q);
      const matchMuscle =
        muscleFilter === 'ALL' ||
        ex.primary_muscle.toUpperCase() === muscleFilter.toUpperCase();
      return matchSearch && matchMuscle;
    });
  }, [exercises, searchQuery, muscleFilter]);

  const routineExercises = useMemo(() => {
    if (!currentRoutine || !currentRoutine.exerciseIds || currentRoutine.exerciseIds.length === 0) {
      return [];
    }
    return currentRoutine.exerciseIds
      .map((id) => exercises.find((e) => e.id === id))
      .filter((e): e is Exercise => Boolean(e));
  }, [currentRoutine, exercises]);

  const handleSelect = (ex: Exercise) => {
    Haptics.selectionAsync();
    onSelectExercise(ex);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.bg,
            paddingTop: Math.max(16, insets.top),
            paddingBottom: Math.max(16, insets.bottom),
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* HEADER */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <View>
              <Text style={[styles.headerSub, { color: theme.primary }]}>
                APMED WORKOUT
              </Text>
              <Text style={[styles.headerTitle, { color: theme.text }]}>
                Select Movement
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
              activeOpacity={0.8}
            >
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View style={styles.searchSection}>
            <View
              style={[
                styles.searchBar,
                { backgroundColor: theme.cardElevated, borderColor: theme.border },
              ]}
            >
              <Search size={16} color={theme.subtext} />
              <TextInput
                placeholder="Search exercise by name or muscle..."
                placeholderTextColor={theme.subtext}
                value={searchQuery}
                onChangeText={(t) => setSearchQuery(sanitizeText(t, 60))}
                maxLength={60}
                returnKeyType="search"
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity
                  onPress={() => setSearchQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={16} color={theme.subtext} />
                </TouchableOpacity>
              )}
            </View>

            {/* MUSCLE FILTER CHIPS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {MUSCLE_FILTERS.map((item) => {
                const active = muscleFilter === item.id;
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setMuscleFilter(item.id);
                    }}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active ? theme.primary : theme.cardElevated,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: active ? theme.primaryText : theme.subtext,
                          fontWeight: active ? '800' : '600',
                        },
                      ]}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* EXERCISES SCROLL */}
          <ScrollView
            style={styles.listScroll}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
          >
            {/* ROUTINE EXERCISES SECTION (IF AVAILABLE AND NO SEARCH QUERY) */}
            {routineExercises.length > 0 && !searchQuery && muscleFilter === 'ALL' && (
              <View style={styles.sectionContainer}>
                <View style={styles.sectionHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Layers size={13} color={theme.primary} />
                    <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>
                      ROUTINE EXERCISES ({routineExercises.length})
                    </Text>
                  </View>
                  <Text style={[styles.sectionHeaderSub, { color: theme.subtext }]}>
                    {currentRoutine?.name}
                  </Text>
                </View>

                <View style={{ gap: 8 }}>
                  {routineExercises.map((ex, index) => {
                    const isSelected = ex.id === currentExerciseId;
                    return (
                      <TouchableOpacity
                        key={`routine-${ex.id}`}
                        onPress={() => handleSelect(ex)}
                        style={[
                          styles.exerciseCard,
                          {
                            backgroundColor: isSelected ? `${theme.primary}15` : theme.card,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        activeOpacity={0.75}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View
                            style={[
                              styles.stepBadge,
                              {
                                backgroundColor: isSelected ? theme.primary : theme.cardElevated,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.stepBadgeText,
                                {
                                  color: isSelected ? theme.primaryText : theme.subtext,
                                },
                              ]}
                            >
                              {index + 1}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={[
                                styles.exerciseName,
                                {
                                  color: isSelected ? theme.primary : theme.text,
                                  fontWeight: isSelected ? '900' : '800',
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {ex.name}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                              <View
                                style={[
                                  styles.muscleBadge,
                                  { backgroundColor: `${theme.primary}20` },
                                ]}
                              >
                                <Text style={[styles.muscleBadgeText, { color: theme.primary }]}>
                                  {ex.primary_muscle.toUpperCase()}
                                </Text>
                              </View>
                              <Text style={[styles.equipmentText, { color: theme.subtext }]}>
                                {ex.equipment}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {isSelected ? (
                          <View
                            style={[
                              styles.checkCircle,
                              { backgroundColor: theme.primary },
                            ]}
                          >
                            <Check size={12} color={theme.primaryText} strokeWidth={3} />
                          </View>
                        ) : (
                          <ChevronRight size={16} color={theme.subtext} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* ALL EXERCISES / SEARCH RESULTS */}
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Dumbbell size={13} color={theme.subtext} />
                  <Text style={[styles.sectionHeaderTitle, { color: theme.text }]}>
                    {searchQuery || muscleFilter !== 'ALL'
                      ? `MATCHING MOVEMENTS (${filteredExercises.length})`
                      : `ALL EXERCISES (${filteredExercises.length})`}
                  </Text>
                </View>
              </View>

              {filteredExercises.length === 0 ? (
                <View
                  style={[
                    styles.emptyBox,
                    { backgroundColor: theme.cardElevated, borderColor: theme.border },
                  ]}
                >
                  <Dumbbell size={28} color={theme.subtext} />
                  <Text style={[styles.emptyTitle, { color: theme.text }]}>
                    No movements found
                  </Text>
                  <Text style={[styles.emptySub, { color: theme.subtext }]}>
                    Try searching for another exercise name or muscle group.
                  </Text>
                </View>
              ) : (
                <View style={{ gap: 8 }}>
                  {filteredExercises.map((ex) => {
                    const isSelected = ex.id === currentExerciseId;
                    return (
                      <TouchableOpacity
                        key={ex.id}
                        onPress={() => handleSelect(ex)}
                        style={[
                          styles.exerciseCard,
                          {
                            backgroundColor: isSelected ? `${theme.primary}15` : theme.card,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        activeOpacity={0.75}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text
                            style={[
                              styles.exerciseName,
                              {
                                color: isSelected ? theme.primary : theme.text,
                                fontWeight: isSelected ? '900' : '800',
                              },
                            ]}
                            numberOfLines={1}
                          >
                            {ex.name}
                          </Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <View
                              style={[
                                styles.muscleBadge,
                                { backgroundColor: `${theme.primary}20` },
                              ]}
                            >
                              <Text style={[styles.muscleBadgeText, { color: theme.primary }]}>
                                {ex.primary_muscle.toUpperCase()}
                              </Text>
                            </View>
                            <Text style={[styles.equipmentText, { color: theme.subtext }]}>
                              {ex.equipment}
                            </Text>
                          </View>
                        </View>

                        {isSelected ? (
                          <View
                            style={[
                              styles.checkCircle,
                              { backgroundColor: theme.primary },
                            ]}
                          >
                            <Check size={12} color={theme.primaryText} strokeWidth={3} />
                          </View>
                        ) : (
                          <ChevronRight size={16} color={theme.subtext} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
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
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 6,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  filterScroll: {
    gap: 6,
    paddingBottom: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 12,
  },
  listScroll: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 24,
  },
  sectionContainer: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 6,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  sectionHeaderSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  exerciseName: {
    fontSize: 15,
  },
  muscleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  muscleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  equipmentText: {
    fontSize: 11,
    fontWeight: '600',
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
