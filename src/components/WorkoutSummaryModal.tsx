import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Trophy,
  Flame,
  Clock,
  Dumbbell,
  CheckCircle2,
  Sparkles,
  Award,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';

interface ExerciseSummaryItem {
  name: string;
  muscle: string;
  setsCount: number;
  maxWeightKg: number;
  totalVolumeKg: number;
}

interface WorkoutSummaryModalProps {
  visible: boolean;
  theme: ThemePalette;
  workoutName: string;
  durationSeconds: number;
  totalVolumeKg: number;
  totalSets: number;
  prsCount: number;
  caloriesBurned: number;
  exercisesCompleted: ExerciseSummaryItem[];
  onFinish: () => void;
}

export const WorkoutSummaryModal: React.FC<WorkoutSummaryModalProps> = ({
  visible,
  theme,
  workoutName,
  durationSeconds,
  totalVolumeKg,
  totalSets,
  prsCount,
  caloriesBurned,
  exercisesCompleted,
  onFinish,
}) => {
  const insets = useSafeAreaInsets();
  const formatTime = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const handleFinishPress = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onFinish();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onFinish}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onFinish}
        />
        <View style={[styles.cardContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* CELEBRATION BADGE */}
            <View style={styles.badgeWrapper}>
              <View style={[styles.glowRing, { backgroundColor: `${theme.primary}20` }]}>
                <View style={[styles.badgeCircle, { backgroundColor: theme.primary }]}>
                  <Trophy size={36} color={theme.primaryText} />
                </View>
              </View>
            </View>

            {/* HEADER */}
            <Text style={[styles.eyebrow, { color: theme.subtext }]}>WORKOUT COMPLETE</Text>
            <Text style={[styles.title, { color: theme.text }]}>Phenomenal Effort!</Text>
            <Text style={[styles.workoutName, { color: theme.primary }]}>{workoutName}</Text>

            {/* PR CALLOUT */}
            {prsCount > 0 ? (
              <View style={[styles.prBanner, { backgroundColor: '#FFD60A20', borderColor: '#FFD60A' }]}>
                <Award size={20} color="#FFD60A" />
                <Text style={styles.prBannerText}>
                  {prsCount} NEW PERSONAL RECORD{prsCount > 1 ? 'S' : ''} HIT!
                </Text>
              </View>
            ) : (
              <View style={[styles.prBanner, { backgroundColor: `${theme.primary}15`, borderColor: theme.border }]}>
                <Sparkles size={18} color={theme.primary} />
                <Text style={[styles.prBannerText, { color: theme.text }]}>
                  Consistency is King. High Quality Volume Logged!
                </Text>
              </View>
            )}

            {/* 2-COLUMN METRIC TILES */}
            <View style={styles.metricsGrid}>
              {/* Row 1: TIME & CALORIES */}
              <View style={styles.metricsRow}>
                {/* Tile 1: TIME (Green) */}
                <View style={[styles.metricTile, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={styles.metricIconRow}>
                    <Clock size={16} color={theme.primary} />
                    <Text style={[styles.metricLabel, { color: theme.subtext }]} numberOfLines={1}>TOTAL TIME</Text>
                  </View>
                  <Text
                    style={[styles.metricValue, { color: theme.primary }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {formatTime(durationSeconds)}
                  </Text>
                </View>

                {/* Tile 2: CALORIES (Red) */}
                <View style={[styles.metricTile, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={styles.metricIconRow}>
                    <Flame size={16} color={theme.accentRed} />
                    <Text style={[styles.metricLabel, { color: theme.subtext }]} numberOfLines={1}>ACTIVE ENERGY</Text>
                  </View>
                  <Text
                    style={[styles.metricValue, { color: theme.accentRed }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {caloriesBurned} <Text style={styles.metricUnit}>KCAL</Text>
                  </Text>
                </View>
              </View>

              {/* Row 2: VOLUME & SETS */}
              <View style={styles.metricsRow}>
                {/* Tile 3: VOLUME (Cyan) */}
                <View style={[styles.metricTile, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={styles.metricIconRow}>
                    <Dumbbell size={16} color={theme.accentCyan} />
                    <Text style={[styles.metricLabel, { color: theme.subtext }]} numberOfLines={1}>TOTAL VOLUME</Text>
                  </View>
                  <Text
                    style={[styles.metricValue, { color: theme.accentCyan }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {totalVolumeKg.toLocaleString()} <Text style={styles.metricUnit}>KG</Text>
                  </Text>
                </View>

                {/* Tile 4: SETS (Yellow) */}
                <View style={[styles.metricTile, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={styles.metricIconRow}>
                    <CheckCircle2 size={16} color="#FFD60A" />
                    <Text style={[styles.metricLabel, { color: theme.subtext }]} numberOfLines={1}>COMPLETED SETS</Text>
                  </View>
                  <Text
                    style={[styles.metricValue, { color: '#FFD60A' }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {totalSets} <Text style={styles.metricUnit}>SETS</Text>
                  </Text>
                </View>
              </View>
            </View>

            {/* EXERCISES BREAKDOWN */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Exercises Performed</Text>
              <Text style={[styles.sectionCount, { color: theme.subtext }]}>
                {exercisesCompleted.length} Movements
              </Text>
            </View>

            <View style={[styles.exercisesListCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              {exercisesCompleted.length === 0 ? (
                <Text style={[styles.emptyText, { color: theme.subtext }]}>
                  No sets logged in this session.
                </Text>
              ) : (
                exercisesCompleted.map((ex, i) => (
                  <View
                    key={i}
                    style={[
                      styles.exerciseRow,
                      { borderBottomColor: theme.border },
                      i === exercisesCompleted.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 6 }}>
                      <Text style={[styles.exerciseItemName, { color: theme.text }]} numberOfLines={1}>{ex.name}</Text>
                      <Text style={[styles.exerciseItemMuscle, { color: theme.subtext }]} numberOfLines={1}>
                        {ex.muscle} • Top Load: {ex.maxWeightKg} kg
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                      <Text style={[styles.exerciseItemSets, { color: theme.primary }]} numberOfLines={1}>
                        {ex.setsCount} {ex.setsCount === 1 ? 'Set' : 'Sets'}
                      </Text>
                      <Text style={[styles.exerciseItemVolume, { color: theme.subtext }]} numberOfLines={1}>
                        {ex.totalVolumeKg} kg vol
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {/* FINISH BUTTON */}
          <View
            style={[
              styles.footerContainer,
              {
                borderTopColor: theme.border,
                paddingBottom: Math.max(16, insets.bottom),
              },
            ]}
          >
            <TouchableOpacity
              onPress={handleFinishPress}
              style={[styles.finishBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.finishBtnText, { color: theme.primaryText }]}>
                Done & Save to History
              </Text>
            </TouchableOpacity>
          </View>
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
  cardContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 24,
    overflow: 'hidden',
  },
  scrollContent: {
    paddingHorizontal: 22,
    paddingBottom: 24,
    alignItems: 'center',
  },
  badgeWrapper: {
    marginBottom: 14,
  },
  glowRing: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 2,
    textAlign: 'center',
  },
  workoutName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
    textAlign: 'center',
  },
  prBanner: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 18,
  },
  prBannerText: {
    fontWeight: '800',
    fontSize: 13,
    color: '#FFD60A',
  },
  metricsGrid: {
    width: '100%',
    gap: 10,
    marginBottom: 20,
  },
  metricsRow: {
    width: '100%',
    flexDirection: 'row',
    gap: 10,
  },
  metricTile: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    justifyContent: 'center',
  },
  metricIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  sectionCount: {
    fontSize: 12,
    fontWeight: '600',
  },
  exercisesListCard: {
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  exerciseItemName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  exerciseItemMuscle: {
    fontSize: 12,
  },
  exerciseItemSets: {
    fontSize: 15,
    fontWeight: '800',
  },
  exerciseItemVolume: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyText: {
    paddingVertical: 16,
    textAlign: 'center',
    fontSize: 13,
  },
  footerContainer: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 24,
    borderTopWidth: 1,
  },
  finishBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

