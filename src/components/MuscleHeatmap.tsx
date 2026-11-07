import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Svg, { Path, G, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';
import { MuscleGroup, MuscleRecoveryState } from '../services/recoveryEngine';

interface Props {
  recoveryData: Record<MuscleGroup, MuscleRecoveryState>;
  onSelectMuscleFilter?: (muscle: MuscleGroup) => void;
}

export const MuscleHeatmap: React.FC<Props> = ({ recoveryData, onSelectMuscleFilter }) => {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'FRONT' | 'BACK'>('FRONT');
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleGroup>('CHEST');

  const handlePressMuscle = (muscle: MuscleGroup) => {
    setSelectedMuscle(muscle);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getFill = (muscle: MuscleGroup) => {
    const data = recoveryData[muscle];
    return data?.color || theme.primary;
  };

  const isSelected = (muscle: MuscleGroup) => selectedMuscle === muscle;
  const currentData = recoveryData[selectedMuscle] || recoveryData['CHEST'];

  // Overall system readiness score average
  const muscles = Object.values(recoveryData);
  const avgReadiness = Math.round(muscles.reduce((acc, m) => acc + m.recoveryPercent, 0) / (muscles.length || 1));

  return (
    <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {/* HEADER WITH APMED RECOVERY ENGINE */}
      <View style={styles.topRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={[styles.eyebrow, { color: theme.subtext }]} numberOfLines={1}>
            MUSCLE RECOVERY
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
              Readiness
            </Text>
            <View style={[styles.scorePill, { backgroundColor: `${theme.primary}18` }]}>
              <Text style={[styles.scorePillText, { color: theme.primary }]}>{avgReadiness}%</Text>
            </View>
          </View>
        </View>

        {/* IOS SEGMENTED CONTROL */}
        <View style={[styles.segmentedControl, { backgroundColor: theme.cardElevated, borderColor: theme.border, flexShrink: 0 }]}>
          <TouchableOpacity
            onPress={() => {
              setViewMode('FRONT');
              Haptics.selectionAsync();
            }}
            style={[
              styles.segmentBtn,
              viewMode === 'FRONT' && { backgroundColor: theme.card },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: viewMode === 'FRONT' ? theme.text : theme.subtext },
              ]}
            >
              Front
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setViewMode('BACK');
              Haptics.selectionAsync();
            }}
            style={[
              styles.segmentBtn,
              viewMode === 'BACK' && { backgroundColor: theme.card },
            ]}
          >
            <Text
              style={[
                styles.segmentText,
                { color: viewMode === 'BACK' ? theme.text : theme.subtext },
              ]}
            >
              Back
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* HEATMAP COLOR LEGEND */}
      <View style={[styles.legendRow, { borderBottomColor: theme.border }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#30D158' }]} />
          <Text style={[styles.legendText, { color: theme.subtext }]}>Fresh (&gt;85%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FFD60A' }]} />
          <Text style={[styles.legendText, { color: theme.subtext }]}>Rebuilding (60-84%)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#FF453A' }]} />
          <Text style={[styles.legendText, { color: theme.subtext }]}>Fatigued (&lt;60%)</Text>
        </View>
      </View>

      {/* SVG BODY ANATOMY */}
      <View style={styles.svgWrapper}>
        <Svg width="250" height="330" viewBox="0 0 260 340">
          <Defs>
            <LinearGradient id="heatGlow" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor="rgba(255,255,255,0.08)" />
              <Stop offset="1" stopColor="rgba(255,255,255,0.02)" />
            </LinearGradient>
          </Defs>

          {/* HEAD & NECK SILHOUETTE */}
          <Circle cx="130" cy="28" r="18" fill={theme.cardElevated} stroke={theme.border} strokeWidth="2" />
          <Path
            d="M 120 44 L 120 54 L 140 54 L 140 44 Z"
            fill={theme.cardElevated}
            stroke={theme.border}
            strokeWidth="1.5"
          />

          {viewMode === 'FRONT' ? (
            /* ================= FRONT VIEW ================= */
            <G>
              {/* SHOULDERS */}
              <Path
                d="M 85 58 C 70 60 62 76 65 92 C 72 95 82 86 86 78 Z"
                fill={getFill('SHOULDERS')}
                fillOpacity={isSelected('SHOULDERS') ? 1 : 0.8}
                stroke={isSelected('SHOULDERS') ? theme.text : theme.border}
                strokeWidth={isSelected('SHOULDERS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('SHOULDERS')}
              />
              <Path
                d="M 175 58 C 190 60 198 76 195 92 C 188 95 178 86 174 78 Z"
                fill={getFill('SHOULDERS')}
                fillOpacity={isSelected('SHOULDERS') ? 1 : 0.8}
                stroke={isSelected('SHOULDERS') ? theme.text : theme.border}
                strokeWidth={isSelected('SHOULDERS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('SHOULDERS')}
              />

              {/* CHEST */}
              <Path
                d="M 128 62 L 92 62 C 86 78 90 98 128 102 Z"
                fill={getFill('CHEST')}
                fillOpacity={isSelected('CHEST') ? 1 : 0.8}
                stroke={isSelected('CHEST') ? theme.text : theme.border}
                strokeWidth={isSelected('CHEST') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('CHEST')}
              />
              <Path
                d="M 132 62 L 168 62 C 174 78 170 98 132 102 Z"
                fill={getFill('CHEST')}
                fillOpacity={isSelected('CHEST') ? 1 : 0.8}
                stroke={isSelected('CHEST') ? theme.text : theme.border}
                strokeWidth={isSelected('CHEST') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('CHEST')}
              />

              {/* ARMS */}
              <Path
                d="M 64 96 C 58 110 58 126 67 134 C 74 126 77 110 74 96 Z"
                fill={getFill('ARMS')}
                fillOpacity={isSelected('ARMS') ? 1 : 0.8}
                stroke={isSelected('ARMS') ? theme.text : theme.border}
                strokeWidth={isSelected('ARMS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('ARMS')}
              />
              <Path
                d="M 66 138 C 55 152 50 176 56 190 C 64 186 68 165 72 138 Z"
                fill={getFill('ARMS')}
                fillOpacity={isSelected('ARMS') ? 1 : 0.8}
                stroke={isSelected('ARMS') ? theme.text : theme.border}
                strokeWidth={isSelected('ARMS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('ARMS')}
              />
              <Path
                d="M 196 96 C 202 110 202 126 193 134 C 186 126 183 110 186 96 Z"
                fill={getFill('ARMS')}
                fillOpacity={isSelected('ARMS') ? 1 : 0.8}
                stroke={isSelected('ARMS') ? theme.text : theme.border}
                strokeWidth={isSelected('ARMS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('ARMS')}
              />
              <Path
                d="M 194 138 C 205 152 210 176 204 190 C 196 186 192 165 188 138 Z"
                fill={getFill('ARMS')}
                fillOpacity={isSelected('ARMS') ? 1 : 0.8}
                stroke={isSelected('ARMS') ? theme.text : theme.border}
                strokeWidth={isSelected('ARMS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('ARMS')}
              />

              {/* CORE */}
              <Path
                d="M 106 106 L 154 106 L 148 165 L 112 165 Z"
                fill={getFill('CORE')}
                fillOpacity={isSelected('CORE') ? 1 : 0.8}
                stroke={isSelected('CORE') ? theme.text : theme.border}
                strokeWidth={isSelected('CORE') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('CORE')}
              />

              {/* LEGS */}
              <Path
                d="M 100 172 C 92 195 88 226 95 248 C 108 250 120 235 125 174 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
              <Path
                d="M 95 254 C 88 276 90 305 98 325 C 106 325 116 295 114 254 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
              <Path
                d="M 160 172 C 168 195 172 226 165 248 C 152 250 140 235 135 174 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
              <Path
                d="M 165 254 C 172 276 170 305 162 325 C 154 325 144 295 146 254 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
            </G>
          ) : (
            /* ================= BACK VIEW ================= */
            <G>
              <Path
                d="M 115 54 L 145 54 L 165 75 L 130 95 L 95 75 Z"
                fill={getFill('BACK')}
                fillOpacity={isSelected('BACK') ? 1 : 0.8}
                stroke={isSelected('BACK') ? theme.text : theme.border}
                strokeWidth={isSelected('BACK') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('BACK')}
              />
              <Path
                d="M 96 82 L 126 98 L 118 152 L 88 120 Z"
                fill={getFill('BACK')}
                fillOpacity={isSelected('BACK') ? 1 : 0.8}
                stroke={isSelected('BACK') ? theme.text : theme.border}
                strokeWidth={isSelected('BACK') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('BACK')}
              />
              <Path
                d="M 164 82 L 134 98 L 142 152 L 172 120 Z"
                fill={getFill('BACK')}
                fillOpacity={isSelected('BACK') ? 1 : 0.8}
                stroke={isSelected('BACK') ? theme.text : theme.border}
                strokeWidth={isSelected('BACK') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('BACK')}
              />

              {/* REAR DELTS */}
              <Path
                d="M 85 64 C 70 68 62 82 66 96 C 74 98 84 88 88 78 Z"
                fill={getFill('SHOULDERS')}
                fillOpacity={isSelected('SHOULDERS') ? 1 : 0.8}
                stroke={isSelected('SHOULDERS') ? theme.text : theme.border}
                strokeWidth={isSelected('SHOULDERS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('SHOULDERS')}
              />
              <Path
                d="M 175 64 C 190 68 198 82 194 96 C 186 98 176 88 172 78 Z"
                fill={getFill('SHOULDERS')}
                fillOpacity={isSelected('SHOULDERS') ? 1 : 0.8}
                stroke={isSelected('SHOULDERS') ? theme.text : theme.border}
                strokeWidth={isSelected('SHOULDERS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('SHOULDERS')}
              />

              {/* TRICEPS */}
              <Path
                d="M 64 98 C 56 112 56 128 65 138 C 72 128 75 112 72 98 Z"
                fill={getFill('ARMS')}
                fillOpacity={isSelected('ARMS') ? 1 : 0.8}
                stroke={isSelected('ARMS') ? theme.text : theme.border}
                strokeWidth={isSelected('ARMS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('ARMS')}
              />
              <Path
                d="M 196 98 C 204 112 204 128 195 138 C 188 128 185 112 188 98 Z"
                fill={getFill('ARMS')}
                fillOpacity={isSelected('ARMS') ? 1 : 0.8}
                stroke={isSelected('ARMS') ? theme.text : theme.border}
                strokeWidth={isSelected('ARMS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('ARMS')}
              />

              {/* GLUTES & HAMSTRINGS */}
              <Path
                d="M 98 160 C 95 185 125 188 128 160 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
              <Path
                d="M 162 160 C 165 185 135 188 132 160 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
              <Path
                d="M 98 190 C 92 215 90 238 98 250 C 112 250 125 230 126 190 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
              <Path
                d="M 162 190 C 168 215 170 238 162 250 C 148 250 135 230 134 190 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
              <Path
                d="M 96 256 C 88 280 90 305 98 325 C 108 325 116 295 114 256 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
              <Path
                d="M 164 256 C 172 280 170 305 162 325 C 152 325 144 295 146 256 Z"
                fill={getFill('LEGS')}
                fillOpacity={isSelected('LEGS') ? 1 : 0.8}
                stroke={isSelected('LEGS') ? theme.text : theme.border}
                strokeWidth={isSelected('LEGS') ? 2.5 : 1.2}
                onPress={() => handlePressMuscle('LEGS')}
              />
            </G>
          )}
        </Svg>
      </View>

      {/* QUICK SELECTOR CHIPS */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
        {(Object.keys(recoveryData) as MuscleGroup[]).map((m) => {
          const item = recoveryData[m];
          const active = selectedMuscle === m;
          return (
            <TouchableOpacity
              key={m}
              onPress={() => handlePressMuscle(m)}
              style={[
                styles.muscleChip,
                {
                  backgroundColor: active ? theme.cardElevated : theme.card,
                  borderColor: active ? theme.primary : theme.border,
                },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: item.color }]} />
              <Text
                style={{
                  color: active ? theme.text : theme.subtext,
                  fontWeight: '700',
                  fontSize: 12,
                }}
              >
                {m} ({item.recoveryPercent}%)
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* SELECTED MUSCLE HUD CARD (APMED RECOVERY ENGINE) */}
      <View style={[styles.hudCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
        <View style={styles.hudHeader}>
          <View>
            <Text style={[styles.hudTitle, { color: theme.text }]}>{currentData.name}</Text>
            <Text style={{ color: theme.subtext, fontSize: 12, marginTop: 2 }}>
              {currentData.lastTrainedHoursAgo === null
                ? 'No fatigue detected • Ready to train'
                : `Last stimulated ${currentData.lastTrainedHoursAgo}h ago (${currentData.recoveryHorizonHours}h recovery window)`}
            </Text>
          </View>
          <View style={[styles.badge, { backgroundColor: `${currentData.color}20`, borderColor: currentData.color }]}>
            <Text style={[styles.badgeText, { color: currentData.color }]}>{currentData.statusLabel}</Text>
          </View>
        </View>

        {/* PROGRESS BAR */}
        <View style={styles.progressBarWrapper}>
          <View style={[styles.progressBarTrack, { backgroundColor: theme.card }]}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${currentData.recoveryPercent}%`, backgroundColor: currentData.color },
              ]}
            />
          </View>
          <Text style={[styles.progressNumber, { color: currentData.color }]}>
            {currentData.recoveryPercent}%
          </Text>
        </View>

        {/* METRICS ROW */}
        <View style={[styles.metricsRow, { borderTopColor: theme.border }]}>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>RECENT SETS</Text>
            <Text style={[styles.metricValue, { color: theme.text }]}>
              {currentData.totalRecentSets} sets
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>VOLUME LOAD</Text>
            <Text style={[styles.metricValue, { color: theme.primary }]}>
              {currentData.totalRecentVolumeKg.toLocaleString()} kg
            </Text>
          </View>
          <View style={styles.metricItem}>
            <Text style={[styles.metricLabel, { color: theme.subtext }]}>READINESS</Text>
            <Text
              style={[
                styles.metricValue,
                { color: currentData.recoveryPercent > 75 ? '#30D158' : '#FFD60A' },
              ]}
            >
              {currentData.recoveryPercent > 85 ? 'HIGH' : currentData.recoveryPercent > 60 ? 'MODERATE' : 'LOW'}
            </Text>
          </View>
        </View>

        {/* RECOMMENDATION */}
        <View style={[styles.recommendationBox, { backgroundColor: theme.card }]}>
          <Text style={[styles.recommendationText, { color: theme.text }]}>
            <Text style={{ fontWeight: '700' }}>Coach Note:</Text> {currentData.recommendation}
          </Text>
        </View>

        {/* FILTER BUTTON */}
        {onSelectMuscleFilter && (
          <TouchableOpacity
            onPress={() => onSelectMuscleFilter(selectedMuscle)}
            style={[styles.filterActionBtn, { borderColor: theme.primary }]}
          >
            <Text style={[styles.filterActionText, { color: theme.primary }]}>
              Open {selectedMuscle} in Gym Logger →
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  scorePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  scorePillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 2,
    borderWidth: 1,
  },
  segmentBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  segmentText: {
    fontSize: 11,
    fontWeight: '700',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 10,
    paddingVertical: 6,
    borderBottomWidth: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  legendText: {
    fontSize: 11,
    fontWeight: '600',
  },
  svgWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  chipsRow: {
    marginVertical: 14,
  },
  muscleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  hudCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 4,
  },
  hudHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  hudTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  progressBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 14,
  },
  progressBarTrack: {
    flex: 1,
    height: 7,
    borderRadius: 3.5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3.5,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '900',
    width: 44,
    textAlign: 'right',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '800',
    marginTop: 3,
  },
  recommendationBox: {
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  recommendationText: {
    fontSize: 12,
    lineHeight: 18,
  },
  filterActionBtn: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  filterActionText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
