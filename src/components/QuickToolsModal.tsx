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
  X,
  Clock,
  Bell,
  Cpu,
  Footprints,
  ChevronRight,
  Sparkles,
  Heart,
  Thermometer,
  Scan,
  Trophy,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import { MotionStepMetrics } from '../hooks/useMotionStepTracker';
import { WorkoutAlarm, WellnessReading, EnvironmentalLog } from '../db/database';

interface QuickToolsModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  alarms: WorkoutAlarm[];
  stepTracker: MotionStepMetrics;
  isWorkoutActive: boolean;
  sessionSeconds: number;
  latestWellness?: WellnessReading | null;
  latestEnv?: EnvironmentalLog | null;
  onOpenStopwatch: () => void;
  onOpenAlarms: () => void;
  onOpenSensors: () => void;
  onOpenSteps: () => void;
  onOpenPpg?: () => void;
  onOpenEnv?: () => void;
  onOpenEquipmentScanner?: () => void;
  onOpenStrength?: () => void;
}

export const QuickToolsModal: React.FC<QuickToolsModalProps> = ({
  visible,
  theme,
  onClose,
  alarms,
  stepTracker,
  isWorkoutActive,
  sessionSeconds,
  latestWellness,
  latestEnv,
  onOpenStopwatch,
  onOpenAlarms,
  onOpenSensors,
  onOpenSteps,
  onOpenPpg,
  onOpenEnv,
  onOpenEquipmentScanner,
  onOpenStrength,
}) => {
  const insets = useSafeAreaInsets();
  const activeAlarms = alarms.filter((a) => a.isActive);
  const nextAlarm = activeAlarms[0];

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBox, { backgroundColor: `${theme.primary}20` }]}>
                <Sparkles size={18} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Studio Utilities & Tools</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>
                  Athletic timing, sensors, biometrics & alarms
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* STRICT 2-COLUMN GRID (ROW BY ROW) */}
            <View style={styles.twoColumnGrid}>
              {/* ROW 1: STOPWATCH & ALARMS */}
              <View style={styles.gridRow}>
                {/* 1. STOPWATCH */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    onClose();
                    onOpenStopwatch();
                  }}
                  style={[styles.toolCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.toolCardHeader}>
                    <View style={[styles.toolIconBox, { backgroundColor: '#00F0FF20' }]}>
                      <Clock size={18} color="#00F0FF" />
                    </View>
                    <ChevronRight size={14} color={theme.subtext} />
                  </View>
                  <View>
                    <Text style={[styles.toolTitle, { color: theme.text }]}>Stopwatch</Text>
                    <Text style={[styles.toolSub, { color: theme.subtext }]} numberOfLines={2}>
                      {isWorkoutActive
                        ? `${formatSeconds(sessionSeconds)} Running`
                        : 'Lap timer & splits'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 2. ALARMS */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    onClose();
                    onOpenAlarms();
                  }}
                  style={[styles.toolCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.toolCardHeader}>
                    <View style={[styles.toolIconBox, { backgroundColor: '#FF9F0A20' }]}>
                      <Bell size={18} color="#FF9F0A" />
                    </View>
                    {activeAlarms.length > 0 && (
                      <View style={styles.activePillBadge}>
                        <Text style={styles.activePillBadgeText}>{activeAlarms.length}</Text>
                      </View>
                    )}
                  </View>
                  <View>
                    <Text style={[styles.toolTitle, { color: theme.text }]}>Workout Alarms</Text>
                    <Text style={[styles.toolSub, { color: theme.subtext }]} numberOfLines={2}>
                      {nextAlarm
                        ? `${nextAlarm.timeStr} ${nextAlarm.period}`
                        : 'Set scheduled cues'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ROW 2: SENSORS & STEPS */}
              <View style={styles.gridRow}>
                {/* 3. 15+ SENSORS HUB */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    onClose();
                    onOpenSensors();
                  }}
                  style={[styles.toolCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.toolCardHeader}>
                    <View style={[styles.toolIconBox, { backgroundColor: `${theme.primary}20` }]}>
                      <Cpu size={18} color={theme.primary} />
                    </View>
                    <ChevronRight size={14} color={theme.subtext} />
                  </View>
                  <View>
                    <Text style={[styles.toolTitle, { color: theme.text }]}>15+ Sensor Suite</Text>
                    <Text style={[styles.toolSub, { color: theme.subtext }]} numberOfLines={2}>
                      {stepTracker.isSensorMoving
                        ? `${stepTracker.netGForce}G Live Motion`
                        : 'Hardware sensors hub'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 4. MOTION STEP TRACKER */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    onClose();
                    onOpenSteps();
                  }}
                  style={[styles.toolCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.toolCardHeader}>
                    <View style={[styles.toolIconBox, { backgroundColor: '#34C75920' }]}>
                      <Footprints size={18} color="#34C759" />
                    </View>
                    <ChevronRight size={14} color={theme.subtext} />
                  </View>
                  <View>
                    <Text style={[styles.toolTitle, { color: theme.text }]}>Step Telemetry</Text>
                    <Text style={[styles.toolSub, { color: theme.subtext }]} numberOfLines={2}>
                      {stepTracker.steps.toLocaleString()} • {stepTracker.cadenceSpm} SPM
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ROW 3: CAMERA PPG & THERMAL RECOVERY */}
              <View style={styles.gridRow}>
                {/* 5. CAMERA OPTICAL PPG */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    onClose();
                    if (onOpenPpg) onOpenPpg();
                  }}
                  style={[styles.toolCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.toolCardHeader}>
                    <View style={[styles.toolIconBox, { backgroundColor: '#FF2D5520' }]}>
                      <Heart size={18} color="#FF2D55" />
                    </View>
                    <ChevronRight size={14} color={theme.subtext} />
                  </View>
                  <View>
                    <Text style={[styles.toolTitle, { color: theme.text }]}>Camera PPG</Text>
                    <Text style={[styles.toolSub, { color: theme.subtext }]} numberOfLines={2}>
                      {latestWellness
                        ? `${latestWellness.heartRateBpm} BPM • ${latestWellness.hrvRmssd}ms HRV`
                        : 'Resting pulse & HRV'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 6. THERMAL & BAROMETER RECOVERY */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    onClose();
                    if (onOpenEnv) onOpenEnv();
                  }}
                  style={[styles.toolCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.toolCardHeader}>
                    <View style={[styles.toolIconBox, { backgroundColor: '#00F0FF20' }]}>
                      <Thermometer size={18} color="#00F0FF" />
                    </View>
                    <ChevronRight size={14} color={theme.subtext} />
                  </View>
                  <View>
                    <Text style={[styles.toolTitle, { color: theme.text }]}>Thermal & Env</Text>
                    <Text style={[styles.toolSub, { color: theme.subtext }]} numberOfLines={2}>
                      {latestEnv
                        ? `${latestEnv.tempC}°C • ${latestEnv.pressureHpa} hPa`
                        : 'Heat index & strain'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>

              {/* ROW 4: AI SCANNER & STRENGTH RANK */}
              <View style={styles.gridRow}>
                {/* 7. AI EQUIPMENT SCANNER */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    onClose();
                    if (onOpenEquipmentScanner) onOpenEquipmentScanner();
                  }}
                  style={[styles.toolCard, { backgroundColor: theme.cardElevated, borderColor: '#00F0FF50' }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.toolCardHeader}>
                    <View style={[styles.toolIconBox, { backgroundColor: '#00F0FF20' }]}>
                      <Scan size={18} color="#00F0FF" />
                    </View>
                    <View style={[styles.activePillBadge, { backgroundColor: '#00F0FF25' }]}>
                      <Text style={[styles.activePillBadgeText, { color: '#00F0FF' }]}>AI VISION</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={[styles.toolTitle, { color: theme.text }]}>Machine Scanner</Text>
                    <Text style={[styles.toolSub, { color: theme.subtext }]} numberOfLines={2}>
                      Snap gym machines for pin setup & form
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* 8. OPENPOWERLIFTING STRENGTH & DOTS SCORE */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    onClose();
                    if (onOpenStrength) onOpenStrength();
                  }}
                  style={[styles.toolCard, { backgroundColor: theme.cardElevated, borderColor: `${theme.primary}50` }]}
                  activeOpacity={0.75}
                >
                  <View style={styles.toolCardHeader}>
                    <View style={[styles.toolIconBox, { backgroundColor: `${theme.primary}20` }]}>
                      <Trophy size={18} color={theme.primary} />
                    </View>
                    <View style={[styles.activePillBadge, { backgroundColor: `${theme.primary}25` }]}>
                      <Text style={[styles.activePillBadgeText, { color: theme.primary }]}>DOTS</Text>
                    </View>
                  </View>
                  <View>
                    <Text style={[styles.toolTitle, { color: theme.text }]}>Strength Index</Text>
                    <Text style={[styles.toolSub, { color: theme.subtext }]} numberOfLines={2}>
                      Pound-for-pound DOTS & Wilks powerlifting score
                    </Text>
                  </View>
                </TouchableOpacity>
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '85%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 18,
    paddingTop: 18,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
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
  scrollContent: {
    paddingBottom: 24,
  },
  twoColumnGrid: {
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  toolCard: {
    flex: 1,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    minHeight: 112,
    justifyContent: 'space-between',
  },
  toolCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  toolIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePillBadge: {
    backgroundColor: '#FF9F0A',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  activePillBadgeText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '900',
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  toolSub: {
    fontSize: 11,
    lineHeight: 15,
  },
});
