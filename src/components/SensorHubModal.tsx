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
import { Accelerometer, Gyroscope, Barometer, Pedometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import {
  Cpu,
  Activity,
  Heart,
  Compass,
  Footprints,
  Thermometer,
  Gauge,
  Eye,
  Camera,
  Mic,
  Radio,
  CheckCircle2,
  X,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldCheck,
  Dumbbell,
  Flame,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import { MotionStepMetrics } from '../hooks/useMotionStepTracker';
import { WellnessReading, EnvironmentalLog } from '../db/database';

interface SensorHubModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  stepTracker: MotionStepMetrics;
  latestWellness: WellnessReading | null;
  latestEnv: EnvironmentalLog | null;
  onOpenStepModal: () => void;
  onOpenPpgModal: () => void;
  onOpenEnvModal: () => void;
  onOpenPermissions?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type HubTab = 'OVERVIEW' | 'SENSORS' | 'WORKOUT_MATRIX';

export const SensorHubModal: React.FC<SensorHubModalProps> = ({
  visible,
  theme,
  onClose,
  stepTracker,
  latestWellness,
  latestEnv,
  onOpenStepModal,
  onOpenPpgModal,
  onOpenEnvModal,
  onOpenPermissions,
}) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<HubTab>('OVERVIEW');
  const [accelData, setAccelData] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 1 });
  const [gyroData, setGyroData] = useState<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 0 });
  const [barometerPressure, setBarometerPressure] = useState<number>(1013.2);

  useEffect(() => {
    if (!visible) return;

    // Subscriptions for live telemetry
    const accelSub = Accelerometer.addListener(({ x, y, z }) => {
      setAccelData({ x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2) });
    });

    let gyroSub: { remove: () => void } | null = null;
    Gyroscope.isAvailableAsync().then((avail) => {
      if (avail) {
        gyroSub = Gyroscope.addListener(({ x, y, z }) => {
          setGyroData({ x: +x.toFixed(2), y: +y.toFixed(2), z: +z.toFixed(2) });
        });
      }
    });

    let baroSub: { remove: () => void } | null = null;
    Barometer.isAvailableAsync().then((avail) => {
      if (avail) {
        baroSub = Barometer.addListener(({ pressure }) => {
          setBarometerPressure(+pressure.toFixed(1));
        });
      }
    });

    return () => {
      accelSub.remove();
      if (gyroSub) gyroSub.remove();
      if (baroSub) baroSub.remove();
    };
  }, [visible]);

  const WORKOUT_SENSOR_MAPPING = [
    { workout: 'Walking & Hiking', sensors: 'Accelerometer, Pedometer, GPS, Barometer', level: 'Level 1' },
    { workout: 'Running & Jogging', sensors: 'Accelerometer, GPS, Gyroscope, Cadence', level: 'Level 1' },
    { workout: 'Weightlifting & VBT', sensors: 'Accelerometer (Velocity), Gyroscope (Tilt), Timer', level: 'Level 1' },
    { workout: 'Stair Climbing', sensors: 'Barometer (Elevation), Accelerometer, Steps', level: 'Level 1' },
    { workout: 'HIIT & Circuit', sensors: 'Accelerometer (G-Force), Heart Rate (PPG)', level: 'Level 2' },
    { workout: 'Recovery & Resting Vitals', sensors: 'Camera-based PPG, HRV (rMSSD), Temp Sensor', level: 'Level 2' },
    { workout: 'Yoga & Balance', sensors: 'Gyroscope (Angular Roll), Accelerometer', level: 'Level 1' },
  ];

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
                <Cpu size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Smartphone Sensor Suite</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>
                  15+ Motion, Biometric & Environmental Capabilities
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* TAB SEGMENTS */}
          <View style={[styles.tabBar, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
            {(
              [
                { id: 'OVERVIEW', label: 'Telemetry Hub' },
                { id: 'SENSORS', label: '15+ Sensors' },
                { id: 'WORKOUT_MATRIX', label: 'Workout Matrix' },
              ] as const
            ).map((t) => {
              const isSel = activeTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => {
                    setActiveTab(t.id);
                    Haptics.selectionAsync();
                  }}
                  style={[styles.tabItem, isSel && { backgroundColor: theme.primary }]}
                >
                  <Text style={[styles.tabText, { color: isSel ? theme.primaryText : theme.subtext, fontWeight: isSel ? '900' : '600' }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* ================= TAB 1: OVERVIEW & 3 CORE HUBS ================= */}
            {activeTab === 'OVERVIEW' && (
              <View style={{ gap: 12 }}>
                {/* HUB CARD 1: STEP COUNTER & CADENCE */}
                <TouchableOpacity
                  onPress={() => {
                    onClose();
                    onOpenStepModal();
                  }}
                  activeOpacity={0.8}
                  style={[styles.hubCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                >
                  <View style={styles.hubHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.hubIcon, { backgroundColor: `${theme.primary}20` }]}>
                        <Footprints size={18} color={theme.primary} />
                      </View>
                      <View>
                        <Text style={[styles.hubEyebrow, { color: theme.subtext }]}>MOTION & MOVEMENT SENSOR</Text>
                        <Text style={[styles.hubTitle, { color: theme.text }]}>Fused Motion Pedometer</Text>
                      </View>
                    </View>
                    <ChevronRight size={18} color={theme.subtext} />
                  </View>

                  <View style={{ gap: 8, marginTop: 10 }}>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={[styles.telemetryPill, { flex: 1, backgroundColor: theme.card }]}>
                        <Text style={[styles.telemetryLabel, { color: theme.subtext }]}>STEPS</Text>
                        <Text style={[styles.telemetryVal, { color: theme.text }]}>{stepTracker.steps.toLocaleString()}</Text>
                      </View>
                      <View style={[styles.telemetryPill, { flex: 1, backgroundColor: theme.card }]}>
                        <Text style={[styles.telemetryLabel, { color: theme.subtext }]}>CADENCE</Text>
                        <Text style={[styles.telemetryVal, { color: theme.primary }]}>{stepTracker.cadenceSpm} SPM</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={[styles.telemetryPill, { flex: 1, backgroundColor: theme.card }]}>
                        <Text style={[styles.telemetryLabel, { color: theme.subtext }]}>DISTANCE</Text>
                        <Text style={[styles.telemetryVal, { color: '#00F0FF' }]}>{stepTracker.distanceKm} KM</Text>
                      </View>
                      <View style={[styles.telemetryPill, { flex: 1, backgroundColor: theme.card }]}>
                        <Text style={[styles.telemetryLabel, { color: theme.subtext }]}>STATUS</Text>
                        <Text style={[styles.telemetryVal, { color: '#34C759' }]} numberOfLines={1}>{stepTracker.movementState}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>

                {/* HUB CARDS 2 & 3: 2-COLUMN ROW */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* HUB CARD 2: CAMERA PPG RESTING HEART RATE */}
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onOpenPpgModal();
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.hubCard,
                      {
                        flex: 1,
                        backgroundColor: theme.cardElevated,
                        borderColor: theme.border,
                        padding: 12,
                        justifyContent: 'space-between',
                      },
                    ]}
                  >
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <View style={[styles.hubIcon, { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FF2D5520' }]}>
                          <Heart size={16} color="#FF2D55" />
                        </View>
                        <ChevronRight size={14} color={theme.subtext} />
                      </View>
                      <Text style={[styles.hubEyebrow, { color: theme.subtext, fontSize: 8.5 }]}>OPTICAL BIOMETRIC</Text>
                      <Text style={[styles.hubTitle, { color: theme.text, fontSize: 13 }]}>Camera PPG</Text>
                    </View>

                    <View style={{ gap: 4, marginTop: 8 }}>
                      <View style={[styles.telemetryPill, { backgroundColor: theme.card, paddingVertical: 4 }]}>
                        <Text style={[styles.telemetryLabel, { color: theme.subtext, fontSize: 8 }]}>RESTING HR</Text>
                        <Text style={[styles.telemetryVal, { color: '#FF2D55', fontSize: 13 }]}>
                          {latestWellness ? `${latestWellness.heartRateBpm} BPM` : '62 BPM'}
                        </Text>
                      </View>
                      <View style={[styles.telemetryPill, { backgroundColor: theme.card, paddingVertical: 4 }]}>
                        <Text style={[styles.telemetryLabel, { color: theme.subtext, fontSize: 8 }]}>READINESS</Text>
                        <Text style={[styles.telemetryVal, { color: '#34C759', fontSize: 13 }]}>
                          {latestWellness ? `${latestWellness.wellnessScore}%` : '92%'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* HUB CARD 3: ENVIRONMENTAL & THERMAL RECOVERY */}
                  <TouchableOpacity
                    onPress={() => {
                      onClose();
                      onOpenEnvModal();
                    }}
                    activeOpacity={0.8}
                    style={[
                      styles.hubCard,
                      {
                        flex: 1,
                        backgroundColor: theme.cardElevated,
                        borderColor: theme.border,
                        padding: 12,
                        justifyContent: 'space-between',
                      },
                    ]}
                  >
                    <View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <View style={[styles.hubIcon, { width: 32, height: 32, borderRadius: 10, backgroundColor: '#FF950020' }]}>
                          <Thermometer size={16} color="#FF9500" />
                        </View>
                        <ChevronRight size={14} color={theme.subtext} />
                      </View>
                      <Text style={[styles.hubEyebrow, { color: theme.subtext, fontSize: 8.5 }]}>ENVIRONMENTAL</Text>
                      <Text style={[styles.hubTitle, { color: theme.text, fontSize: 13 }]}>Thermal & Barometer</Text>
                    </View>

                    <View style={{ gap: 4, marginTop: 8 }}>
                      <View style={[styles.telemetryPill, { backgroundColor: theme.card, paddingVertical: 4 }]}>
                        <Text style={[styles.telemetryLabel, { color: theme.subtext, fontSize: 8 }]}>TEMPERATURE</Text>
                        <Text style={[styles.telemetryVal, { color: theme.text, fontSize: 13 }]}>
                          {latestEnv ? `${latestEnv.tempC}°C` : '22.0°C'}
                        </Text>
                      </View>
                      <View style={[styles.telemetryPill, { backgroundColor: theme.card, paddingVertical: 4 }]}>
                        <Text style={[styles.telemetryLabel, { color: theme.subtext, fontSize: 8 }]}>BAROMETER</Text>
                        <Text style={[styles.telemetryVal, { color: '#34C759', fontSize: 13 }]}>{barometerPressure} hPa</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* HARDWARE PERMISSIONS & ON-DEVICE PRIVACY CARD */}
                {onOpenPermissions && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      onOpenPermissions();
                    }}
                    style={[
                      styles.hubCard,
                      {
                        backgroundColor: `${theme.primary}12`,
                        borderColor: `${theme.primary}40`,
                        padding: 14,
                        marginTop: 4,
                      },
                    ]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={[styles.hubIcon, { backgroundColor: `${theme.primary}25` }]}>
                          <ShieldCheck size={18} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.hubTitle, { color: theme.text, fontSize: 13 }]}>
                            Hardware & Sensor Permissions
                          </Text>
                          <Text style={[styles.hubEyebrow, { color: theme.subtext, fontSize: 10, marginTop: 2 }]}>
                            Consent, Privacy & Hardware Authorization
                          </Text>
                        </View>
                      </View>
                      <ChevronRight size={16} color={theme.primary} />
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* ================= TAB 2: 15+ SENSORS BREAKDOWN (2-COLUMN GRID) ================= */}
            {activeTab === 'SENSORS' && (
              <View style={{ gap: 10 }}>
                {/* A. Motion */}
                <Text style={[styles.categoryHeader, { color: theme.subtext }]}>A. MOTION & MOVEMENT SENSORS</Text>
                
                {/* ROW 1: 01 & 02 */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.sensorRowCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.sensorNum, { color: theme.primary }]}>01</Text>
                      <CheckCircle2 size={14} color="#34C759" />
                    </View>
                    <Text style={[styles.sensorName, { color: theme.text, fontSize: 12 }]}>3-Axis Accelerometer</Text>
                    <Text style={[styles.sensorRole, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                      VBT Velocity ({accelData.x}G • {accelData.y}G • {accelData.z}G)
                    </Text>
                  </View>

                  <View style={[styles.sensorRowCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.sensorNum, { color: theme.primary }]}>02</Text>
                      <CheckCircle2 size={14} color="#34C759" />
                    </View>
                    <Text style={[styles.sensorName, { color: theme.text, fontSize: 12 }]}>3-Axis Gyroscope</Text>
                    <Text style={[styles.sensorRole, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                      Angular velocity for bar tilt & form balance
                    </Text>
                  </View>
                </View>

                {/* ROW 2: 03 & 04 */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.sensorRowCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.sensorNum, { color: theme.primary }]}>03</Text>
                      <CheckCircle2 size={14} color="#34C759" />
                    </View>
                    <Text style={[styles.sensorName, { color: theme.text, fontSize: 12 }]}>Step Pedometer</Text>
                    <Text style={[styles.sensorRole, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                      Real-time cadence (SPM) & foot-strike
                    </Text>
                  </View>

                  <View style={[styles.sensorRowCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.sensorNum, { color: theme.primary }]}>04</Text>
                      <CheckCircle2 size={14} color="#34C759" />
                    </View>
                    <Text style={[styles.sensorName, { color: theme.text, fontSize: 12 }]}>Barometer</Text>
                    <Text style={[styles.sensorRole, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                      {barometerPressure} hPa (Altitude & stairs)
                    </Text>
                  </View>
                </View>

                {/* B. Biometric */}
                <Text style={[styles.categoryHeader, { color: theme.subtext, marginTop: 10 }]}>B. HEALTH & BIOMETRIC SENSORS</Text>
                
                {/* ROW 3: 05 & 06 */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.sensorRowCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.sensorNum, { color: '#FF2D55' }]}>05</Text>
                      <CheckCircle2 size={14} color="#34C759" />
                    </View>
                    <Text style={[styles.sensorName, { color: theme.text, fontSize: 12 }]}>Camera Optical PPG</Text>
                    <Text style={[styles.sensorRole, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                      Capillary waveform for Resting HR & HRV
                    </Text>
                  </View>

                  <View style={[styles.sensorRowCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.sensorNum, { color: '#FF9500' }]}>06</Text>
                      <CheckCircle2 size={14} color="#34C759" />
                    </View>
                    <Text style={[styles.sensorName, { color: theme.text, fontSize: 12 }]}>Ambient Thermal</Text>
                    <Text style={[styles.sensorRole, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                      Heat index & thermal recovery strain
                    </Text>
                  </View>
                </View>

                {/* C. Position & Fusion */}
                <Text style={[styles.categoryHeader, { color: theme.subtext, marginTop: 10 }]}>C. POSITION & HARDWARE FUSION</Text>
                
                {/* ROW 4: 07 & 08 */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.sensorRowCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.sensorNum, { color: '#00F0FF' }]}>07</Text>
                      <CheckCircle2 size={14} color="#34C759" />
                    </View>
                    <Text style={[styles.sensorName, { color: theme.text, fontSize: 12 }]}>Haptic Tactile</Text>
                    <Text style={[styles.sensorRole, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                      Pulse pacing, rest countdown & alarms
                    </Text>
                  </View>

                  <View style={[styles.sensorRowCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={[styles.sensorNum, { color: '#00F0FF' }]}>08</Text>
                      <CheckCircle2 size={14} color="#34C759" />
                    </View>
                    <Text style={[styles.sensorName, { color: theme.text, fontSize: 12 }]}>Gravity Vector</Text>
                    <Text style={[styles.sensorRole, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                      Low-pass 1G isolation & phone orientation
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* ================= TAB 3: WORKOUT-TO-SENSOR MATRIX (2-COLUMN GRID) ================= */}
            {activeTab === 'WORKOUT_MATRIX' && (
              <View style={{ gap: 8 }}>
                <Text style={{ fontSize: 12, color: theme.subtext, marginBottom: 4 }}>
                  Cross-referencing smartphone sensors for specialized athletic training protocols:
                </Text>
                
                {/* Paired 2-column rows for all workouts */}
                {Array.from({ length: Math.ceil(WORKOUT_SENSOR_MAPPING.length / 2) }).map((_, rIdx) => {
                  const item1 = WORKOUT_SENSOR_MAPPING[rIdx * 2];
                  const item2 = WORKOUT_SENSOR_MAPPING[rIdx * 2 + 1];
                  return (
                    <View key={rIdx} style={{ flexDirection: 'row', gap: 8 }}>
                      <View style={[styles.matrixCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10, justifyContent: 'space-between' }]}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <Text style={[styles.matrixWorkout, { color: theme.text, fontSize: 13 }]}>{item1.workout}</Text>
                          <View style={[styles.matrixLevelBadge, { backgroundColor: `${theme.primary}18`, paddingHorizontal: 6, paddingVertical: 2 }]}>
                            <Text style={[styles.matrixLevelText, { color: theme.primary, fontSize: 9 }]}>{item1.level}</Text>
                          </View>
                        </View>
                        <Text style={[styles.matrixSensors, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                          {item1.sensors}
                        </Text>
                      </View>

                      {item2 && (
                        <View style={[styles.matrixCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, padding: 10, justifyContent: 'space-between' }]}>
                          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <Text style={[styles.matrixWorkout, { color: theme.text, fontSize: 13 }]}>{item2.workout}</Text>
                            <View style={[styles.matrixLevelBadge, { backgroundColor: `${theme.primary}18`, paddingHorizontal: 6, paddingVertical: 2 }]}>
                              <Text style={[styles.matrixLevelText, { color: theme.primary, fontSize: 9 }]}>{item2.level}</Text>
                            </View>
                          </View>
                          <Text style={[styles.matrixSensors, { color: theme.subtext, fontSize: 10 }]} numberOfLines={2}>
                            {item2.sensors}
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
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
  tabBar: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    padding: 3,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabText: {
    fontSize: 11,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  hubCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  hubHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  hubIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubEyebrow: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  hubTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  telemetryPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  telemetryPill: {
    flex: 1,
    padding: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  telemetryLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  telemetryVal: {
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
  },
  categoryHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  sensorRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  sensorNum: {
    fontSize: 14,
    fontWeight: '900',
  },
  sensorName: {
    fontSize: 13,
    fontWeight: '800',
  },
  sensorRole: {
    fontSize: 10,
    marginTop: 1,
  },
  matrixCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  matrixWorkout: {
    fontSize: 13,
    fontWeight: '900',
  },
  matrixLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  matrixLevelText: {
    fontSize: 9,
    fontWeight: '900',
  },
  matrixSensors: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 16,
  },
});

