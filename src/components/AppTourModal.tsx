import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Activity,
  Dumbbell,
  HeartPulse,
  Utensils,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Play,
  X,
  Target,
  Flame,
  Clock,
  Layers,
  Timer,
  Scan,
  ShieldCheck,
  TrendingUp,
  RotateCcw,
  Sliders,
  Award,
  Zap,
  Plus,
  Minus,
  Check,
  Camera,
  Info,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';

interface AppTourModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onNavigateToTab?: (tab: 'SUMMARY' | 'WORKOUT' | 'RECOVERY' | 'NUTRITION') => void;
}

const SCREEN_WIDTH = Dimensions?.get ? Dimensions.get('window')?.width || 390 : 390;

const TOUR_STEPS = [
  {
    step: 1,
    title: 'Welcome to Apmed',
    subtitle: 'Athletic Operating System Overview',
    tag: 'SYSTEM OVERVIEW',
  },
  {
    step: 2,
    title: 'Summary & Health',
    subtitle: 'Activity Rings & Energy Score',
    tag: 'SUMMARY DASHBOARD',
  },
  {
    step: 3,
    title: 'Workout Engine',
    subtitle: 'Logging Sets, 1RM & Rest Timers',
    tag: 'TRAINING SUITE',
  },
  {
    step: 4,
    title: 'Biological Recovery',
    subtitle: 'Muscle Heatmap & Sensor Telemetry',
    tag: 'RECOVERY METRICS',
  },
  {
    step: 5,
    title: 'Nutrition & Tools',
    subtitle: 'Barcode Scanner & Studio Utilities',
    tag: 'NUTRITION & UTILITIES',
  },
];

export const AppTourModal: React.FC<AppTourModalProps> = ({
  visible,
  theme,
  onClose,
  onNavigateToTab,
}) => {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [activeTabHighlight, setActiveTabHighlight] = useState<'SUMMARY' | 'WORKOUT' | 'RECOVERY' | 'NUTRITION'>('SUMMARY');

  // Interactive Demo State: Set Logger Simulation
  const [demoWeight, setDemoWeight] = useState<number>(80);
  const [demoReps, setDemoReps] = useState<number>(8);
  const [demoLogged, setDemoLogged] = useState<boolean>(false);
  const [demoTimerSeconds, setDemoTimerSeconds] = useState<number>(90);
  const [demoTimerActive, setDemoTimerActive] = useState<boolean>(false);

  // Interactive Demo State: Recovery Muscle Selector
  const [demoMuscle, setDemoMuscle] = useState<'Chest' | 'Back' | 'Legs' | 'Shoulders' | 'Arms' | 'Core'>('Chest');

  // Interactive Demo State: Energy Score Simulator
  const [demoSleepHours, setDemoSleepHours] = useState<number>(8);
  const [demoHydrationMl, setDemoHydrationMl] = useState<number>(2500);

  const calculateDemoEnergyScore = (sleep: number, water: number): number => {
    const sleepFactor = Math.min(100, (sleep / 8.0) * 50);
    const waterFactor = Math.min(100, (water / 3000) * 35);
    const recoveryBase = 15;
    return Math.min(100, Math.round(sleepFactor + waterFactor + recoveryBase));
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < 5) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const handleFinishWithTab = (tab: 'SUMMARY' | 'WORKOUT' | 'RECOVERY' | 'NUTRITION') => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (onNavigateToTab) {
      onNavigateToTab(tab);
    } else {
      onClose();
    }
  };

  const handleLogTestSet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setDemoLogged(true);
    setDemoTimerActive(true);
    setDemoTimerSeconds(90);
  };

  const currentStepData = TOUR_STEPS[currentStep - 1];

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.bg,
            paddingTop: Math.max(34, insets.top + 8),
            paddingBottom: Math.max(16, insets.bottom + 8),
          },
        ]}
      >
        {/* HEADER BAR */}
        <View style={styles.topHeader}>
          <View style={styles.headerTitleBox}>
            <View style={[styles.headerBadge, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}40` }]}>
              <Sparkles size={11} color={theme.primary} />
              <Text style={[styles.headerBadgeText, { color: theme.primary }]}>
                {currentStepData.tag}
              </Text>
            </View>
            <Text style={[styles.headerStepNumber, { color: theme.subtext }]}>
              STEP {currentStep} OF 5
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleFinish}
            style={[styles.skipBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={[styles.skipBtnText, { color: theme.subtext }]}>Skip Tour</Text>
            <X size={14} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* STEP PROGRESS SEGMENTS */}
        <View style={styles.progressRow}>
          {TOUR_STEPS.map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <TouchableOpacity
                key={s.step}
                onPress={() => {
                  Haptics.selectionAsync();
                  setCurrentStep(s.step);
                }}
                style={[
                  styles.progressSegment,
                  {
                    backgroundColor: isCurrent
                      ? theme.primary
                      : isCompleted
                      ? `${theme.primary}60`
                      : theme.cardElevated,
                  },
                ]}
              />
            );
          })}
        </View>

        {/* SLIDE CONTENT SCROLLER */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ================= STEP 1: WELCOME & HIGH-LEVEL ARCHITECTURE ================= */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.heroSection}>
                <Text style={[styles.heroHeadline, { color: theme.text }]}>
                  Welcome to Apmed
                </Text>
                <Text style={[styles.heroSubhead, { color: theme.subtext }]}>
                  Your all-in-one athletic operating system. Engineered for serious lifters with 100% offline, privacy-first biometric telemetry and scientific strength progression.
                </Text>
              </View>

              {/* CORE PRINCIPLES PILL GRID */}
              <View style={styles.principlesGrid}>
                <View style={[styles.principleCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <ShieldCheck size={18} color="#34C759" />
                  <Text style={[styles.principleTitle, { color: theme.text }]}>100% On-Device Privacy</Text>
                  <Text style={[styles.principleDesc, { color: theme.subtext }]}>
                    No account required, no telemetry tracking, and zero ads. All data remains in your local device SQLite vault.
                  </Text>
                </View>

                <View style={[styles.principleCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Zap size={18} color="#FF9500" />
                  <Text style={[styles.principleTitle, { color: theme.text }]}>Instant Performance</Text>
                  <Text style={[styles.principleDesc, { color: theme.subtext }]}>
                    Ultra-smooth 60fps transitions, hardware-accelerated animations, and zero cloud dependency.
                  </Text>
                </View>
              </View>

              {/* 4 CORE APPLICATION HUBS */}
              <View style={styles.sectionBlock}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>
                  Four Integrated Athletic Hubs
                </Text>
                <Text style={[styles.sectionSubhint, { color: theme.subtext }]}>
                  Tap any hub below to preview its capabilities:
                </Text>

                <View style={styles.hubTabsRow}>
                  {(
                    [
                      { id: 'SUMMARY', label: 'Summary', icon: Activity },
                      { id: 'WORKOUT', label: 'Workout', icon: Dumbbell },
                      { id: 'RECOVERY', label: 'Recovery', icon: HeartPulse },
                      { id: 'NUTRITION', label: 'Nutrition', icon: Utensils },
                    ] as const
                  ).map((tab) => {
                    const active = activeTabHighlight === tab.id;
                    const IconComp = tab.icon;
                    return (
                      <TouchableOpacity
                        key={tab.id}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setActiveTabHighlight(tab.id);
                        }}
                        style={[
                          styles.hubTabPill,
                          {
                            backgroundColor: active ? theme.primary : theme.cardElevated,
                            borderColor: active ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <IconComp
                          size={14}
                          color={active ? theme.primaryText : theme.subtext}
                        />
                        <Text
                          style={[
                            styles.hubTabPillText,
                            {
                              color: active ? theme.primaryText : theme.subtext,
                              fontWeight: active ? '800' : '600',
                            },
                          ]}
                        >
                          {tab.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* DYNAMIC HUB PREVIEW CARD */}
                <View style={[styles.hubDetailCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  {activeTabHighlight === 'SUMMARY' && (
                    <View style={styles.hubDetailInner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Activity size={18} color={theme.primary} />
                        <Text style={[styles.hubDetailTitle, { color: theme.text }]}>Summary Dashboard</Text>
                      </View>
                      <Text style={[styles.hubDetailDesc, { color: theme.subtext }]}>
                        Monitors daily active movement, workout sets, and caloric expenditure with interactive Activity Rings and readiness energy scoring.
                      </Text>
                    </View>
                  )}

                  {activeTabHighlight === 'WORKOUT' && (
                    <View style={styles.hubDetailInner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Dumbbell size={18} color="#FF9500" />
                        <Text style={[styles.hubDetailTitle, { color: theme.text }]}>Workout Engine</Text>
                      </View>
                      <Text style={[styles.hubDetailDesc, { color: theme.subtext }]}>
                        Log resistance sets with instant 1RM formulas, automated PR detection, vibrating rest timers, and custom routine building.
                      </Text>
                    </View>
                  )}

                  {activeTabHighlight === 'RECOVERY' && (
                    <View style={styles.hubDetailInner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <HeartPulse size={18} color="#FF2D55" />
                        <Text style={[styles.hubDetailTitle, { color: theme.text }]}>Recovery & Biometrics</Text>
                      </View>
                      <Text style={[styles.hubDetailDesc, { color: theme.subtext }]}>
                        Biological muscle recovery heatmap, optical camera photoplethysmography (PPG) pulse scanning, and CNS tap test diagnostics.
                      </Text>
                    </View>
                  )}

                  {activeTabHighlight === 'NUTRITION' && (
                    <View style={styles.hubDetailInner}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Utensils size={18} color="#30D158" />
                        <Text style={[styles.hubDetailTitle, { color: theme.text }]}>Nutrition & Fueling</Text>
                      </View>
                      <Text style={[styles.hubDetailDesc, { color: theme.subtext }]}>
                        Instant barcode food scanner via Open Food Facts API, dynamic macro distribution, and hydration target tracking.
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

          {/* ================= STEP 2: SUMMARY TAB & ENERGY SCORE ================= */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.heroSection}>
                <Text style={[styles.heroHeadline, { color: theme.text }]}>
                  Summary Tab: Health Dashboard
                </Text>
                <Text style={[styles.heroSubhead, { color: theme.subtext }]}>
                  The home screen for your daily physiological momentum. Understand your daily targets, energy readiness, and weekly training volume at a glance.
                </Text>
              </View>

              {/* CARD 1: ACTIVITY RINGS */}
              <View style={[styles.featureCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#FF2D5520' }]}>
                    <Activity size={18} color="#FF2D55" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Apmed Activity Rings</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>Move, Train & Stand Targets</Text>
                  </View>
                </View>

                <View style={styles.ringsBreakdownList}>
                  <View style={styles.ringItemRow}>
                    <View style={[styles.ringDot, { backgroundColor: '#FF2D55' }]} />
                    <Text style={[styles.ringItemName, { color: theme.text }]}>MOVE (Red):</Text>
                    <Text style={[styles.ringItemDesc, { color: theme.subtext }]}>Active calories burned during workouts & movement.</Text>
                  </View>
                  <View style={styles.ringItemRow}>
                    <View style={[styles.ringDot, { backgroundColor: '#34C759' }]} />
                    <Text style={[styles.ringItemName, { color: theme.text }]}>TRAIN (Green):</Text>
                    <Text style={[styles.ringItemDesc, { color: theme.subtext }]}>Total completed resistance sets vs daily goal.</Text>
                  </View>
                  <View style={styles.ringItemRow}>
                    <View style={[styles.ringDot, { backgroundColor: '#00F0FF' }]} />
                    <Text style={[styles.ringItemName, { color: theme.text }]}>STAND (Cyan):</Text>
                    <Text style={[styles.ringItemDesc, { color: theme.subtext }]}>Step count & active mobility progress.</Text>
                  </View>
                </View>
              </View>

              {/* CARD 2: INTERACTIVE ENERGY SCORE DEMO */}
              <View style={[styles.featureCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#FF950020' }]}>
                    <Flame size={18} color="#FF9500" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Real-Time Energy Score (0 - 100)</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>Try adjusting recovery metrics below:</Text>
                  </View>
                </View>

                {/* SIMULATED SCORE GAUGE */}
                <View style={[styles.simScoreBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.simScoreNumber, { color: theme.primary }]}>
                      {calculateDemoEnergyScore(demoSleepHours, demoHydrationMl)}
                    </Text>
                    <Text style={[styles.simScoreLabel, { color: theme.subtext }]}>
                      {calculateDemoEnergyScore(demoSleepHours, demoHydrationMl) >= 80
                        ? 'OPTIMAL PEAK PERFORMANCE'
                        : calculateDemoEnergyScore(demoSleepHours, demoHydrationMl) >= 60
                        ? 'READY FOR HYPERTROPHY'
                        : 'RECOVERY ADVISED'}
                    </Text>
                  </View>
                </View>

                {/* CONTROLS */}
                <View style={styles.sliderControls}>
                  <View style={styles.sliderRow}>
                    <Text style={[styles.sliderLabel, { color: theme.text }]}>Sleep Duration: {demoSleepHours}h</Text>
                    <View style={styles.stepperGroup}>
                      <TouchableOpacity
                        onPress={() => setDemoSleepHours((h) => Math.max(4, h - 0.5))}
                        style={[styles.miniStepBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Minus size={14} color={theme.text} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setDemoSleepHours((h) => Math.min(10, h + 0.5))}
                        style={[styles.miniStepBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Plus size={14} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View style={styles.sliderRow}>
                    <Text style={[styles.sliderLabel, { color: theme.text }]}>Hydration: {demoHydrationMl} ml</Text>
                    <View style={styles.stepperGroup}>
                      <TouchableOpacity
                        onPress={() => setDemoHydrationMl((w) => Math.max(500, w - 250))}
                        style={[styles.miniStepBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Minus size={14} color={theme.text} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => setDemoHydrationMl((w) => Math.min(4000, w + 250))}
                        style={[styles.miniStepBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Plus size={14} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* ================= STEP 3: WORKOUT TAB & LOGGING ENGINE ================= */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.heroSection}>
                <Text style={[styles.heroHeadline, { color: theme.text }]}>
                  Workout Engine: How to Train
                </Text>
                <Text style={[styles.heroSubhead, { color: theme.subtext }]}>
                  Logging your training should take seconds, not minutes. Apmed handles real-time 1RM calculations, PR detection, and auto rest timers.
                </Text>
              </View>

              {/* THREE STEP GUIDE */}
              <View style={styles.numberedStepsList}>
                <View style={[styles.numberedStepCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={[styles.stepNumCircle, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.stepNumText, { color: theme.primaryText }]}>1</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.numberedStepTitle, { color: theme.text }]}>Choose or Create a Routine</Text>
                    <Text style={[styles.numberedStepDesc, { color: theme.subtext }]}>
                      Pick from Push/Pull/Legs, Upper/Lower, or Arnold Split, or tap "Custom Routine" to build your own with optional split parameters.
                    </Text>
                  </View>
                </View>

                <View style={[styles.numberedStepCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={[styles.stepNumCircle, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.stepNumText, { color: theme.primaryText }]}>2</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.numberedStepTitle, { color: theme.text }]}>One-Tap Set Logging & PRs</Text>
                    <Text style={[styles.numberedStepDesc, { color: theme.subtext }]}>
                      Input weight and repetitions. Apmed automatically applies the Epley & Brzycki formulas to calculate your 1RM and highlights personal records.
                    </Text>
                  </View>
                </View>

                <View style={[styles.numberedStepCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={[styles.stepNumCircle, { backgroundColor: theme.primary }]}>
                    <Text style={[styles.stepNumText, { color: theme.primaryText }]}>3</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.numberedStepTitle, { color: theme.text }]}>Automatic Rest Countdown</Text>
                    <Text style={[styles.numberedStepDesc, { color: theme.subtext }]}>
                      The rest timer starts immediately upon logging a set, with tactile haptic vibrations and audio chime notifications when your recovery window ends.
                    </Text>
                  </View>
                </View>
              </View>

              {/* INTERACTIVE SET LOGGING SIMULATOR */}
              <View style={[styles.featureCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: `${theme.primary}20` }]}>
                    <Dumbbell size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Try It Now: Set Logging Simulator</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>Barbell Bench Press (Chest)</Text>
                  </View>
                </View>

                <View style={styles.simInputsRow}>
                  {/* WEIGHT */}
                  <View style={[styles.simInputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.simInputLabel, { color: theme.subtext }]}>WEIGHT (KG)</Text>
                    <View style={styles.stepperControl}>
                      <TouchableOpacity
                        onPress={() => setDemoWeight((w) => Math.max(20, w - 2.5))}
                        style={styles.stepBtnIcon}
                      >
                        <Minus size={15} color={theme.text} />
                      </TouchableOpacity>
                      <Text style={[styles.simInputValue, { color: theme.text }]}>{demoWeight}</Text>
                      <TouchableOpacity
                        onPress={() => setDemoWeight((w) => w + 2.5)}
                        style={styles.stepBtnIcon}
                      >
                        <Plus size={15} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* REPS */}
                  <View style={[styles.simInputCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.simInputLabel, { color: theme.subtext }]}>REPETITIONS</Text>
                    <View style={styles.stepperControl}>
                      <TouchableOpacity
                        onPress={() => setDemoReps((r) => Math.max(1, r - 1))}
                        style={styles.stepBtnIcon}
                      >
                        <Minus size={15} color={theme.text} />
                      </TouchableOpacity>
                      <Text style={[styles.simInputValue, { color: theme.text }]}>{demoReps}</Text>
                      <TouchableOpacity
                        onPress={() => setDemoReps((r) => r + 1)}
                        style={styles.stepBtnIcon}
                      >
                        <Plus size={15} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* ESTIMATED 1RM BADGE */}
                <View style={styles.ormRow}>
                  <Text style={[styles.ormText, { color: theme.subtext }]}>
                    Estimated 1RM: <Text style={{ color: '#FFD60A', fontWeight: '900' }}>{Math.round(demoWeight * (1 + demoReps / 30))} kg</Text>
                  </Text>
                  <Text style={[styles.ormText, { color: theme.subtext }]}>
                    Volume: <Text style={{ color: theme.primary, fontWeight: '900' }}>{demoWeight * demoReps} kg</Text>
                  </Text>
                </View>

                {/* LOG BUTTON */}
                <TouchableOpacity
                  onPress={handleLogTestSet}
                  style={[styles.simLogBtn, { backgroundColor: theme.primary }]}
                >
                  <Check size={16} color={theme.primaryText} />
                  <Text style={[styles.simLogBtnText, { color: theme.primaryText }]}>
                    {demoLogged ? 'Log Another Set' : 'Log Completed Set'}
                  </Text>
                </TouchableOpacity>

                {/* SIMULATED REST TIMER POPUP */}
                {demoTimerActive && (
                  <View style={[styles.simTimerBox, { backgroundColor: `${theme.primary}15`, borderColor: `${theme.primary}50` }]}>
                    <Timer size={16} color={theme.primary} />
                    <Text style={[styles.simTimerText, { color: theme.text }]}>
                      Rest Timer Active: <Text style={{ color: theme.primary, fontWeight: '900' }}>{demoTimerSeconds}s</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() => setDemoTimerActive(false)}
                      style={[styles.simTimerDismiss, { backgroundColor: theme.cardElevated }]}
                    >
                      <Text style={[styles.simTimerDismissText, { color: theme.subtext }]}>Dismiss</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* ================= STEP 4: RECOVERY TAB & SENSOR TELEMETRY ================= */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.heroSection}>
                <Text style={[styles.heroHeadline, { color: theme.text }]}>
                  Biological Recovery & Telemetry
                </Text>
                <Text style={[styles.heroSubhead, { color: theme.subtext }]}>
                  Track muscular fatigue windows and autonomic nervous system readiness to avoid overtraining and optimize strength adaptations.
                </Text>
              </View>

              {/* MUSCLE HEATMAP EXPLANATION */}
              <View style={[styles.featureCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#34C75920' }]}>
                    <Layers size={18} color="#34C759" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Interactive Muscle Recovery Heatmap</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>48h - 72h physiological recovery curves</Text>
                  </View>
                </View>

                <Text style={[styles.cardExplainer, { color: theme.subtext }]}>
                  Tap any muscle group below to inspect recovery protocols:
                </Text>

                {/* MUSCLE SELECTOR CHIPS */}
                <View style={styles.muscleChipsGrid}>
                  {(['Chest', 'Back', 'Legs', 'Shoulders', 'Arms', 'Core'] as const).map((m) => {
                    const isSelected = demoMuscle === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setDemoMuscle(m);
                        }}
                        style={[
                          styles.muscleChip,
                          {
                            backgroundColor: isSelected ? theme.primary : theme.card,
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.muscleChipText,
                            {
                              color: isSelected ? theme.primaryText : theme.text,
                              fontWeight: isSelected ? '800' : '600',
                            },
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* SELECTED MUSCLE STATUS PREVIEW */}
                <View style={[styles.musclePreviewCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.muscleName, { color: theme.text }]}>{demoMuscle} Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: '#34C75920' }]}>
                      <CheckCircle2 size={12} color="#34C759" />
                      <Text style={[styles.statusBadgeText, { color: '#34C759' }]}>100% RECOVERED</Text>
                    </View>
                  </View>
                  <Text style={[styles.muscleCue, { color: theme.subtext }]}>
                    {demoMuscle === 'Legs'
                      ? 'Quadriceps and posterior chain require 72h after heavy squats or deadlifts.'
                      : demoMuscle === 'Chest'
                      ? 'Pectoral myofibrils primed for progressive overload or bench variations.'
                      : 'Motor units recovered and cleared of acute metabolic fatigue.'}
                  </Text>
                </View>
              </View>

              {/* HARDWARE TELEMETRY FEATURES */}
              <View style={styles.hardwareGrid}>
                <View style={[styles.hardwareCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Camera size={16} color="#FF2D55" />
                  <Text style={[styles.hardwareTitle, { color: theme.text }]}>Camera PPG Pulse Scanner</Text>
                  <Text style={[styles.hardwareDesc, { color: theme.subtext }]}>
                    Place your fingertip on the camera to capture optical vascular density and real-time heart rate.
                  </Text>
                </View>

                <View style={[styles.hardwareCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Activity size={16} color="#00F0FF" />
                  <Text style={[styles.hardwareTitle, { color: theme.text }]}>10s CNS Tap Test</Text>
                  <Text style={[styles.hardwareDesc, { color: theme.subtext }]}>
                    Tests motor-cortex tapping velocity to detect central nervous system fatigue before heavy lifting.
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ================= STEP 5: NUTRITION, BARCODE SCANNER & STUDIO TOOLS ================= */}
          {currentStep === 5 && (
            <View style={styles.stepContainer}>
              <View style={styles.heroSection}>
                <Text style={[styles.heroHeadline, { color: theme.text }]}>
                  Nutrition & Studio Tools
                </Text>
                <Text style={[styles.heroSubhead, { color: theme.subtext }]}>
                  Fuel your recovery and streamline workout mechanics with integrated barcode nutrition and studio utilities.
                </Text>
              </View>

              {/* BARCODE SCANNER HIGHLIGHT */}
              <View style={[styles.featureCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#30D15820' }]}>
                    <Scan size={18} color="#30D158" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Barcode Food Scanner</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>Open Food Facts API Database</Text>
                  </View>
                </View>
                <Text style={[styles.cardExplainer, { color: theme.subtext }]}>
                  Point your camera at food barcodes to instantly extract Protein, Carbohydrates, Fats, and Calories directly into your daily macro targets.
                </Text>
              </View>

              {/* GYM EQUIPMENT VISION SCANNER */}
              <View style={[styles.featureCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: `${theme.primary}20` }]}>
                    <Camera size={18} color={theme.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Gym Equipment AI Scanner</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>Biomechanics & Seat Setup Guide</Text>
                  </View>
                </View>
                <Text style={[styles.cardExplainer, { color: theme.subtext }]}>
                  Scan any unfamiliar gym machine (lat pulldown, leg press, cable crossover) to see safety pin positions, seat alignment, and exercise cues.
                </Text>
              </View>

              {/* QUICK STUDIO UTILITIES */}
              <View style={[styles.featureCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View style={[styles.iconBox, { backgroundColor: '#FFD60A20' }]}>
                    <Sliders size={18} color="#FFD60A" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Quick Tools Dock</Text>
                    <Text style={[styles.cardSubtitle, { color: theme.subtext }]}>Built-in Gym Utilities</Text>
                  </View>
                </View>
                <View style={styles.toolsBulletList}>
                  <Text style={[styles.bulletText, { color: theme.subtext }]}>
                    • <Text style={{ color: theme.text, fontWeight: '700' }}>Workout Alarms:</Text> Scheduled notification alarms that persist across app launches.
                  </Text>
                  <Text style={[styles.bulletText, { color: theme.subtext }]}>
                    • <Text style={{ color: theme.text, fontWeight: '700' }}>Olympic Plate Rack:</Text> Instant barbell plate breakdown calculator for any weight target.
                  </Text>
                  <Text style={[styles.bulletText, { color: theme.subtext }]}>
                    • <Text style={{ color: theme.text, fontWeight: '700' }}>Precision Stopwatch:</Text> Millisecond studio timer for HIIT and rest intervals.
                  </Text>
                </View>
              </View>

              {/* LAUNCH SHORTCUTS */}
              <View style={styles.launchShortcutsSection}>
                <Text style={[styles.launchSectionTitle, { color: theme.text }]}>
                  Ready to Start? Choose Your Next Step:
                </Text>

                <View style={styles.launchBtnCol}>
                  <TouchableOpacity
                    onPress={() => handleFinishWithTab('WORKOUT')}
                    style={[styles.launchActionBtn, { backgroundColor: theme.primary }]}
                  >
                    <Dumbbell size={18} color={theme.primaryText} />
                    <Text style={[styles.launchActionBtnText, { color: theme.primaryText }]}>
                      Launch Workout Tab
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handleFinishWithTab('SUMMARY')}
                    style={[styles.launchActionBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border, borderWidth: 1 }]}
                  >
                    <Activity size={18} color={theme.text} />
                    <Text style={[styles.launchActionBtnText, { color: theme.text }]}>
                      Explore Health Dashboard
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* BOTTOM NAVIGATION FOOTER */}
        <View style={[styles.footerContainer, { borderTopColor: theme.border }]}>
          {currentStep > 1 ? (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
            >
              <ChevronLeft size={18} color={theme.text} />
              <Text style={[styles.backBtnText, { color: theme.text }]}>Back</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 80 }} />
          )}

          {/* STEP INDICATOR DOTS */}
          <View style={styles.stepDotsRow}>
            {TOUR_STEPS.map((s) => (
              <View
                key={s.step}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: currentStep === s.step ? theme.primary : theme.border,
                    width: currentStep === s.step ? 18 : 6,
                  },
                ]}
              />
            ))}
          </View>

          {currentStep < 5 ? (
            <TouchableOpacity
              onPress={handleNext}
              style={[styles.nextBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={[styles.nextBtnText, { color: theme.primaryText }]}>Next</Text>
              <ChevronRight size={18} color={theme.primaryText} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={handleFinish}
              style={[styles.nextBtn, { backgroundColor: '#34C759' }]}
            >
              <Text style={[styles.nextBtnText, { color: '#000000' }]}>Done</Text>
              <CheckCircle2 size={16} color="#000000" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerTitleBox: {
    flexDirection: 'column',
    gap: 4,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  headerStepNumber: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  skipBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  stepContainer: {
    gap: 16,
  },
  heroSection: {
    marginVertical: 4,
  },
  heroHeadline: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  heroSubhead: {
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  principlesGrid: {
    gap: 10,
  },
  principleCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  principleTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  principleDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionBlock: {
    gap: 10,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubhint: {
    fontSize: 12,
    marginTop: -4,
  },
  hubTabsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  hubTabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  hubTabPillText: {
    fontSize: 11,
  },
  hubDetailCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  hubDetailInner: {
    gap: 6,
  },
  hubDetailTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  hubDetailDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  featureCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  cardSubtitle: {
    fontSize: 11.5,
    marginTop: 1,
  },
  cardExplainer: {
    fontSize: 12,
    lineHeight: 17,
  },
  ringsBreakdownList: {
    gap: 8,
    marginTop: 4,
  },
  ringItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ringDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ringItemName: {
    fontSize: 12,
    fontWeight: '800',
  },
  ringItemDesc: {
    fontSize: 11.5,
    flex: 1,
  },
  simScoreBox: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simScoreNumber: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  simScoreLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  sliderControls: {
    gap: 10,
  },
  sliderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  miniStepBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberedStepsList: {
    gap: 10,
  },
  numberedStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  stepNumCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    fontSize: 13,
    fontWeight: '900',
  },
  numberedStepTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  numberedStepDesc: {
    fontSize: 11.5,
    lineHeight: 16,
    marginTop: 2,
  },
  simInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  simInputCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  simInputLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  stepperControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepBtnIcon: {
    padding: 4,
  },
  simInputValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  ormRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 4,
  },
  ormText: {
    fontSize: 12,
  },
  simLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  simLogBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  simTimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  simTimerText: {
    fontSize: 12,
    flex: 1,
    marginLeft: 8,
  },
  simTimerDismiss: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  simTimerDismissText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  muscleChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  muscleChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  muscleChipText: {
    fontSize: 11,
  },
  musclePreviewCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  muscleName: {
    fontSize: 13,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  muscleCue: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  hardwareGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  hardwareCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  hardwareTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  hardwareDesc: {
    fontSize: 10.5,
    lineHeight: 15,
  },
  toolsBulletList: {
    gap: 6,
  },
  bulletText: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  launchShortcutsSection: {
    gap: 10,
    marginTop: 6,
  },
  launchSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  launchBtnCol: {
    gap: 8,
  },
  launchActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  launchActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  footerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    width: 80,
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepDot: {
    height: 6,
    borderRadius: 3,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    minWidth: 80,
  },
  nextBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
});
