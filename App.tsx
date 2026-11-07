import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet, Text, View, TouchableOpacity, TextInput,
  ScrollView, StatusBar, Alert, Image, Modal, Dimensions, ActivityIndicator,
  AppState, Linking, KeyboardAvoidingView, Platform, Keyboard, TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { YouTubeEmbedPlayer } from './src/components/YouTubeEmbedPlayer';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import {
  Activity, Dumbbell, HeartPulse, Utensils, Trophy,
  Play, Pause, Flag, RotateCcw, Plus, Minus, Camera, Sparkles, Clock, Zap,
  ChevronRight, ChevronLeft, ArrowUpRight, Award, Flame, User, CheckCircle2, Trash2,
  Image as ImageIcon, Key, Search, Check, Layers, ListFilter,
  Globe, Quote, RefreshCw, BookOpen, X, Scale, Compass, Target,
  Droplets, CalendarCheck, Bell, Footprints, Heart, Thermometer, Cpu,
  Scan, Sliders, Moon, ChevronDown, ChevronUp, TrendingUp, Info, Barcode, Wind,
  Repeat
} from 'lucide-react-native';

import {
  initLocalDatabase, db, Exercise, logGymSet, MealLog,
  getDailyGymSummary, getTodaySets, DailyGymSummary, SetWithExercise,
  deleteGymSet, deleteMealLog, saveWorkoutSession, getRecentWorkoutSessions,
  WorkoutSession, getUserProfile, saveUserProfile, UserProfile,
  getHourlyTrainingDensity, HourlyDensityBucket,
  getWeeklyConsistency, WeeklyConsistency,
  getTodayWaterMl, addWaterMl, resetTodayWaterMl, calculateAthleteMetrics,
  checkHasCompletedOnboarding,
  getTodayStepLog,
  getLatestWellnessReading,
  getLatestEnvironmentalReading,
  WellnessReading,
  EnvironmentalLog,
  getExerciseHistorySummary,
  ExerciseHistorySummary,
  calculate1RM,
  saveRecoverySettings,
  getCustomRoutines,
  deleteCustomRoutine
} from './src/db/database';
import { ThemeProvider, useTheme, THEMES, ThemeName } from './src/theme/ThemeContext';
import { useGymSensors } from './src/hooks/useGymSensors';
import { useMotionStepTracker } from './src/hooks/useMotionStepTracker';
import { scanAndLogFoodPhoto, analyzeFoodPhoto, AnalyzedFoodItem } from './src/services/aiFoodScanner';
import { AmpedBrandLogo } from './src/components/AmpedBrandLogo';
import { FoodScanConfirmModal } from './src/components/FoodScanConfirmModal';
import { MuscleHeatmap } from './src/components/MuscleHeatmap';
import { getMuscleRecoveryData, MuscleGroup, MuscleRecoveryState, getMobilityProtocol } from './src/services/recoveryEngine';
import { exportDatabaseBackup, importDatabaseBackup } from './src/services/localBackup';
import { ApmedActivityRings } from './src/components/ApmedActivityRings';
import { OlympicPlateRack } from './src/components/OlympicPlateRack';
import { ApmedRestTimer } from './src/components/ApmedRestTimer';
import { PRESET_ROUTINES, WorkoutRoutine } from './src/db/routines';
import { CustomRoutineModal } from './src/components/CustomRoutineModal';
import { ExercisePickerModal } from './src/components/ExercisePickerModal';
import {
  sanitizeText,
  sanitizeInteger,
  sanitizeWeightInput,
  validateGymSet,
} from './src/utils/inputValidation';
import { WorkoutSummaryModal } from './src/components/WorkoutSummaryModal';
import { UserProfileModal } from './src/components/UserProfileModal';
import { DailyTargetsModal } from './src/components/DailyTargetsModal';
import { OnboardingModal } from './src/components/OnboardingModal';
import { WorkoutAlarmsModal } from './src/components/WorkoutAlarmsModal';
import { StopwatchModal } from './src/components/StopwatchModal';
import { StepCounterModal } from './src/components/StepCounterModal';
import { CameraPpgModal } from './src/components/CameraPpgModal';
import { EnvironmentalRecoveryModal } from './src/components/EnvironmentalRecoveryModal';
import { ApmedEnergyScoreCard } from './src/components/apmed/ApmedEnergyScoreCard';
import { ApmedDailyActivityCard } from './src/components/apmed/ApmedDailyActivityCard';
import { ApmedWeeklyGraph } from './src/components/apmed/ApmedWeeklyGraph';
import { ApmedHydrationTracker } from './src/components/apmed/ApmedHydrationTracker';
import { ApmedVitalsCard } from './src/components/apmed/ApmedVitalsCard';
import { SensorHubModal } from './src/components/SensorHubModal';
import { QuickToolsModal } from './src/components/QuickToolsModal';
import { AlarmRingingModal } from './src/components/AlarmRingingModal';
import { HardwarePermissionsModal } from './src/components/HardwarePermissionsModal';
import { useWorkoutAlarmEngine } from './src/hooks/useWorkoutAlarmEngine';

// Athlete Services
import { OnlineExerciseModal } from './src/components/OnlineExerciseModal';
import { AiWorkoutModal } from './src/components/AiWorkoutModal';
import { GeneratedWorkoutPlan } from './src/services/aiWorkoutCoach';
import { searchOpenFoodFacts, logFoodFromOpenApi, FoodSearchResult } from './src/services/openFoodApi';
import { fetchDailyMotivation, MotivationQuote } from './src/services/motivationApi';
import { GymEquipmentScannerModal } from './src/components/GymEquipmentScannerModal';
import { BarcodeFoodModal } from './src/components/BarcodeFoodModal';
import { AthleteStrengthModal } from './src/components/AthleteStrengthModal';
import { CnsTapTestModal } from './src/components/CnsTapTestModal';
import { VagalBreathworkModal } from './src/components/VagalBreathworkModal';
import {
  analyzeGymEquipmentImage,
  getEquipmentDiagnosticById,
  AnalyzedEquipment,
} from './src/services/aiEquipmentScanner';

// Initialize SQLite on boot
initLocalDatabase();

type ApmedTab = 'SUMMARY' | 'WORKOUT' | 'RECOVERY' | 'NUTRITION';

interface SessionSetRecord {
  exerciseId: string;
  exerciseName: string;
  muscle: string;
  weightKg: number;
  reps: number;
  isPr: boolean;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GYM_STAPLES = [
  { id: '1', name: '3 Whole Eggs', cal: 210, p: 18, c: 1, f: 14, grams: 150 },
  { id: '2', name: '1 Scoop Whey', cal: 120, p: 24, c: 3, f: 1, grams: 35 },
  { id: '3', name: '200g Chicken Breast', cal: 330, p: 62, c: 0, f: 7, grams: 200 },
  { id: '4', name: 'Oats & Milk', cal: 320, p: 14, c: 48, f: 7, grams: 250 },
  { id: '5', name: '150g Fresh Paneer', cal: 390, p: 27, c: 5, f: 30, grams: 150 },
  { id: '6', name: 'Banana + Peanut Butter', cal: 280, p: 8, c: 38, f: 12, grams: 150 },
  { id: '7', name: 'Dal & Steamed Rice', cal: 360, p: 12, c: 68, f: 4, grams: 300 },
  { id: '8', name: 'Grilled Fish / Salmon', cal: 280, p: 34, c: 0, f: 15, grams: 180 },
];

const MainScreen = () => {
  const insets = useSafeAreaInsets();
  const { theme, setThemeMode } = useTheme();
  const isOled = theme.name === 'MIDNIGHT_OLED';
  const [activeTab, setActiveTab] = useState<ApmedTab>('SUMMARY');
  const [summaryDashboardView, setSummaryDashboardView] = useState<'APMED_HEALTH' | 'APMED_RINGS'>('APMED_HEALTH');
  const [showProfileModal, setShowProfileModal] = useState<boolean>(false);
  const [showRingsInfoModal, setShowRingsInfoModal] = useState<boolean>(false);
  const [showTargetsModal, setShowTargetsModal] = useState<boolean>(false);
  const [userProfile, setUserProfile] = useState<UserProfile>(getUserProfile());
  const [hourlyDensity, setHourlyDensity] = useState<HourlyDensityBucket[]>(getHourlyTrainingDensity());
  const [showVbtSensor, setShowVbtSensor] = useState<boolean>(false);

  // First-Time Onboarding & Utility Modals
  const [showOnboarding, setShowOnboarding] = useState<boolean>(!userProfile.hasCompletedOnboarding);
  const [showAlarmsModal, setShowAlarmsModal] = useState<boolean>(false);
  const [showStopwatchModal, setShowStopwatchModal] = useState<boolean>(false);
  const [showQuickToolsModal, setShowQuickToolsModal] = useState<boolean>(false);

  // Active Workout Alarm Engine & Ringing Daemon
  const {
    alarms,
    ringingAlarm,
    dismissRingingAlarm,
    snoozeRingingAlarm,
    testTriggerAlarm,
    refreshAlarms,
  } = useWorkoutAlarmEngine();

  // Motion Step Tracker, Camera PPG & Environmental Sensors
  const stepTracker = useMotionStepTracker(userProfile);
  const [showStepModal, setShowStepModal] = useState<boolean>(false);
  const [showPpgModal, setShowPpgModal] = useState<boolean>(false);
  const [showEnvModal, setShowEnvModal] = useState<boolean>(false);
  const [showSensorHubModal, setShowSensorHubModal] = useState<boolean>(false);
  const [showPermissionsModal, setShowPermissionsModal] = useState<boolean>(false);
  const [latestWellness, setLatestWellness] = useState<WellnessReading | null>(() => getLatestWellnessReading());
  const [latestEnv, setLatestEnv] = useState<EnvironmentalLog | null>(() => getLatestEnvironmentalReading());

  // Hydration & Weekly Consistency State
  const [todayWaterMl, setTodayWaterMl] = useState<number>(0);
  const [weeklyConsistency, setWeeklyConsistencyState] = useState<WeeklyConsistency>({
    completedDays: 0,
    targetDays: 5,
    percentage: 0,
    daysActive: { 0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false },
  });

  const athleteMetrics = useMemo(() => calculateAthleteMetrics(userProfile), [userProfile]);

  // Athlete Tools & Services State
  const [showOnlineModal, setShowOnlineModal] = useState<boolean>(false);
  const [showAiWorkoutModal, setShowAiWorkoutModal] = useState<boolean>(false);
  const [dailyQuote, setDailyQuote] = useState<MotivationQuote | null>(null);

  // AI Food Scan & Confirm State
  const [analyzedFood, setAnalyzedFood] = useState<AnalyzedFoodItem | null>(null);
  const [showFoodConfirmModal, setShowFoodConfirmModal] = useState<boolean>(false);
  const [isAnalyzingFood, setIsAnalyzingFood] = useState<boolean>(false);

  // AI Gym Machine & Equipment Scanner State
  const [analyzedEquipment, setAnalyzedEquipment] = useState<AnalyzedEquipment | null>(null);
  const [showEquipmentScannerModal, setShowEquipmentScannerModal] = useState<boolean>(false);
  const [isAnalyzingEquipment, setIsAnalyzingEquipment] = useState<boolean>(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState<boolean>(false);
  const [showStrengthModal, setShowStrengthModal] = useState<boolean>(false);
  const [showCnsModal, setShowCnsModal] = useState<boolean>(false);
  const [showBreathworkModal, setShowBreathworkModal] = useState<boolean>(false);
  const [latestCnsResult, setLatestCnsResult] = useState<{ taps: number; label: string } | null>(null);
  const [recoverySleepHours, setRecoverySleepHours] = useState<number>(() => userProfile.recoverySleepHours ?? 7.5);
  const [recoverySoreness, setRecoverySoreness] = useState<'NONE' | 'MILD' | 'SORE' | 'SEVERE'>(() => userProfile.recoverySoreness ?? 'MILD');
  const [recoveryChecklist, setRecoveryChecklist] = useState<Record<string, boolean>>(() => userProfile.recoveryChecklist ?? {
    sleep: true,
    hydration: false,
    mobility: false,
    protein: true,
    coldReset: false,
  });

  // Open Food Facts Search State
  const [foodSearchQuery, setFoodSearchQuery] = useState<string>('');
  const [foodSearchResults, setFoodSearchResults] = useState<FoodSearchResult[]>([]);
  const [isSearchingFoodDb, setIsSearchingFoodDb] = useState<boolean>(false);
  const [selectedFoodItem, setSelectedFoodItem] = useState<FoodSearchResult | null>(null);
  const [servingGramsInput, setServingGramsInput] = useState<string>('100');

  // Settings State
  const [geminiKeyInput, setGeminiKeyInput] = useState<string>('');
  const [barWeightKg, setBarWeightKg] = useState<number>(20);

  // Gym Database & Routines State
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('ALL');
  const [selectedSplitFilter, setSelectedSplitFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine | null>(PRESET_ROUTINES[0]);
  const [customRoutines, setCustomRoutines] = useState<WorkoutRoutine[]>([]);
  const [showCustomRoutineModal, setShowCustomRoutineModal] = useState<boolean>(false);
  const [routineFilterTab, setRoutineFilterTab] = useState<'ALL' | 'PRESET' | 'CUSTOM'>('ALL');
  const [workoutViewMode, setWorkoutViewMode] = useState<'ROUTINES' | 'EXERCISES'>('ROUTINES');
  const [selectedEx, setSelectedEx] = useState<Exercise | null>(null);
  const [showExercisePickerModal, setShowExercisePickerModal] = useState<boolean>(false);
  const [currentSetNumber, setCurrentSetNumber] = useState<number>(1);
  const [weightKg, setWeightKg] = useState<number>(80);
  const [repsCount, setRepsCount] = useState<number>(8);
  const [selectedRpe, setSelectedRpe] = useState<number>(8);
  const [selectedSetTag, setSelectedSetTag] = useState<'WORKING' | 'WARMUP' | 'DROPSET' | 'FAILURE'>('WORKING');
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistorySummary | null>(null);
  const [showWarmupCalc, setShowWarmupCalc] = useState<boolean>(false);
  const [showPlateRack, setShowPlateRack] = useState<boolean>(false);
  const [restSeconds, setRestSeconds] = useState<number>(0);
  const [showVideo, setShowVideo] = useState<boolean>(false);
  const [showQuickLogger, setShowQuickLogger] = useState<boolean>(false);
  const [prBanner, setPrBanner] = useState<string | null>(null);

  // Active Workout Session State
  const [isWorkoutActive, setIsWorkoutActive] = useState<boolean>(false);
  const [isStopwatchPaused, setIsStopwatchPaused] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [activeWorkoutName, setActiveWorkoutName] = useState<string>('Traditional Strength Training');
  const [sessionVolumeKg, setSessionVolumeKg] = useState<number>(0);
  const [sessionSetsCount, setSessionSetsCount] = useState<number>(0);
  const [sessionPrsCount, setSessionPrsCount] = useState<number>(0);
  const [sessionSets, setSessionSets] = useState<SessionSetRecord[]>([]);
  const [showSummaryModal, setShowSummaryModal] = useState<boolean>(false);
  const [recentSessions, setRecentSessions] = useState<WorkoutSession[]>([]);

  // Stopwatch Interval
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    if (isWorkoutActive && !isStopwatchPaused) {
      interval = setInterval(() => {
        setSessionSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutActive, isStopwatchPaused]);

  // Load Daily Motivation Quote on boot
  useEffect(() => {
    loadMotivationQuote();
  }, []);

  const loadMotivationQuote = async () => {
    try {
      const q = await fetchDailyMotivation();
      setDailyQuote(q);
    } catch {
      // ignore
    }
  };

  const formatTimer = (totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Daily Summary & History
  const [dailySummary, setDailySummary] = useState<DailyGymSummary>({
    totalVolumeKg: 0,
    totalSets: 0,
    prCount: 0,
    lastWorkoutTimestamp: null,
  });
  const [todaySetsList, setTodaySetsList] = useState<SetWithExercise[]>([]);

  // Recovery State
  const [recoveryData, setRecoveryData] = useState<Record<MuscleGroup, MuscleRecoveryState>>(() => getMuscleRecoveryData());

  // Nutrition State
  const [meals, setMeals] = useState<MealLog[]>([]);
  const [foodHint, setFoodHint] = useState('');
  const [isScanningFood, setIsScanningFood] = useState(false);

  // Hardware Mobile Sensors (Accelerometer, Gyroscope, Pedometer)
  const {
    currentVelocity,
    peakVelocity,
    isTrackingSet,
    vbtZone,
    vbtZoneColor,
    startVelocityTracking,
    stopVelocityTracking,
    detectedReps,
    resetDetectedReps,
    barTiltAngle,
    balanceStatus,
    isBarLopsided,
    sessionSteps,
    isPedometerAvailable,
  } = useGymSensors(() => {
    if (userProfile.autoRestTimer !== false) {
      setRestSeconds(userProfile.defaultRestSeconds || 90);
    }
  });

  // Auto-sync accelerometer rep counter into active workout set
  useEffect(() => {
    if (isTrackingSet && detectedReps > 0) {
      setRepsCount(detectedReps);
    }
  }, [isTrackingSet, detectedReps]);

  const refreshAllData = useCallback(() => {
    const loadedEx = db.getAllSync<Exercise>('SELECT * FROM exercises');
    setExercises(loadedEx);
    if (!selectedEx && loadedEx.length > 0) {
      setSelectedEx(loadedEx[0]);
    }

    // Load user settings & profile
    const prof = getUserProfile();
    setUserProfile(prof);
    setBarWeightKg(prof.barWeightKg);
    setGeminiKeyInput(prof.geminiApiKey);
    if (prof.recoverySleepHours !== undefined) setRecoverySleepHours(prof.recoverySleepHours);
    if (prof.recoverySoreness) setRecoverySoreness(prof.recoverySoreness);
    if (prof.recoveryChecklist) setRecoveryChecklist(prof.recoveryChecklist);

    const today = new Date().toISOString().split('T')[0];
    const mealList = db.getAllSync<MealLog>('SELECT * FROM meal_logs WHERE date_str = ? ORDER BY id DESC', [today]);
    setMeals(mealList);

    const summary = getDailyGymSummary();
    setDailySummary(summary);
    const sets = getTodaySets();
    setTodaySetsList(sets);
    setCurrentSetNumber(sets.length + 1);
    setRecoveryData(getMuscleRecoveryData());
    setHourlyDensity(getHourlyTrainingDensity());

    const pastSessions = getRecentWorkoutSessions(10);
    setRecentSessions(pastSessions);
    setCustomRoutines(getCustomRoutines());

    setTodayWaterMl(getTodayWaterMl());
    setWeeklyConsistencyState(getWeeklyConsistency(prof.weeklyWorkoutDaysTarget || 5));
    setLatestWellness(getLatestWellnessReading());
    setLatestEnv(getLatestEnvironmentalReading());
  }, [selectedEx]);

  const handleAddWater = (deltaMl: number) => {
    const updated = addWaterMl(deltaMl);
    setTodayWaterMl(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleResetWater = () => {
    resetTodayWaterMl();
    setTodayWaterMl(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  useEffect(() => {
    refreshAllData();
  }, [refreshAllData]);

  // Real-time synchronization when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        refreshAllData();
        stepTracker.refreshTodaySteps();
      }
    });
    return () => sub.remove();
  }, [refreshAllData, stepTracker]);

  // Rest Timer Countdown with Haptics
  useEffect(() => {
    if (restSeconds <= 0) return;
    const timer = setInterval(() => {
      setRestSeconds((prev) => {
        if (prev <= 4 && prev > 1) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (prev === 1) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [restSeconds]);

  // Steppers
  const adjustWeight = (delta: number) => {
    setWeightKg((prev) => Math.max(0, Math.round((prev + delta) * 10) / 10));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const adjustReps = (delta: number) => {
    setRepsCount((prev) => Math.max(1, prev + delta));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Exercise History Synchronization
  useEffect(() => {
    if (selectedEx?.id) {
      const hist = getExerciseHistorySummary(selectedEx.id);
      setExerciseHistory(hist);
      if (hist.lastSet) {
        setWeightKg(hist.lastSet.weight_kg);
        setRepsCount(hist.lastSet.reps);
        setSelectedRpe(hist.lastSet.rpe || 8);
      } else {
        const eq = (selectedEx.equipment || '').toLowerCase();
        const muscle = (selectedEx.primary_muscle || '').toUpperCase();
        if (eq.includes('bodyweight')) {
          setWeightKg(0);
          setRepsCount(12);
        } else if (eq.includes('dumbbell')) {
          setWeightKg(muscle === 'ARMS' || muscle === 'SHOULDERS' ? 14 : 22.5);
          setRepsCount(10);
        } else if (eq.includes('barbell')) {
          setWeightKg(muscle === 'LEGS' ? 60 : 40);
          setRepsCount(8);
        } else {
          setWeightKg(30);
          setRepsCount(10);
        }
        setSelectedRpe(8);
      }
      setSelectedSetTag('WORKING');
    } else {
      setExerciseHistory(null);
    }
  }, [selectedEx?.id]);

  // Live Metric Previews
  const liveEst1RM = useMemo(() => calculate1RM(weightKg, repsCount), [weightKg, repsCount]);
  const liveSetVolume = useMemo(() => Math.round(weightKg * repsCount), [weightKg, repsCount]);

  // 3-Stage Progressive Warmup Calculator
  const warmupPlanSets = useMemo(() => {
    if (weightKg <= 15) return [];
    const w1 = Math.max(10, Math.round((weightKg * 0.5) / 2.5) * 2.5);
    const w2 = Math.max(w1 + 2.5, Math.round((weightKg * 0.7) / 2.5) * 2.5);
    const w3 = Math.max(w2 + 2.5, Math.round((weightKg * 0.85) / 2.5) * 2.5);
    return [
      { step: '1', label: 'Warmup Set', pct: '50%', weight: w1, reps: 10, tag: 'WARMUP' as const, note: 'Joint prep & bloodflow' },
      { step: '2', label: 'Acclimation', pct: '70%', weight: w2, reps: 5, tag: 'WARMUP' as const, note: 'CNS groove' },
      { step: '3', label: 'Potentiation', pct: '85%', weight: w3, reps: 2, tag: 'WARMUP' as const, note: 'Heavy prime without fatigue' },
    ];
  }, [weightKg]);

  // Merged available routines (Custom User Routines + Science Presets)
  const allAvailableRoutines = useMemo(() => [...customRoutines, ...PRESET_ROUTINES], [customRoutines]);
  const displayedRoutines = useMemo(() => {
    if (routineFilterTab === 'PRESET') return PRESET_ROUTINES;
    if (routineFilterTab === 'CUSTOM') return customRoutines;
    return allAvailableRoutines;
  }, [routineFilterTab, allAvailableRoutines, customRoutines]);

  const handleDeleteCustomRoutine = (routine: WorkoutRoutine) => {
    Alert.alert(
      'Delete Routine',
      `Delete "${routine.name}"? This custom routine will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const ok = deleteCustomRoutine(routine.id);
            if (ok) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setCustomRoutines(getCustomRoutines());
              if (selectedRoutine?.id === routine.id) {
                setSelectedRoutine(PRESET_ROUTINES[0]);
              }
            }
          },
        },
      ]
    );
  };

  const handleCustomRoutineCreated = (newRoutine: WorkoutRoutine) => {
    setCustomRoutines(getCustomRoutines());
    setSelectedRoutine(newRoutine);
    setRoutineFilterTab('CUSTOM');
  };

  // Routine Navigator for Active Workout Session
  const currentRoutineExIndex = useMemo(() => {
    if (!selectedRoutine || !selectedEx) return -1;
    return selectedRoutine.exerciseIds.indexOf(selectedEx.id);
  }, [selectedRoutine, selectedEx]);

  const hasNextRoutineEx = Boolean(selectedRoutine && currentRoutineExIndex >= 0 && currentRoutineExIndex < selectedRoutine.exerciseIds.length - 1);
  const hasPrevRoutineEx = Boolean(selectedRoutine && currentRoutineExIndex > 0);

  const nextRoutineEx = useMemo(() => {
    if (!selectedRoutine || !hasNextRoutineEx) return null;
    const nextId = selectedRoutine.exerciseIds[currentRoutineExIndex + 1];
    return exercises.find((e) => e.id === nextId) || null;
  }, [selectedRoutine, currentRoutineExIndex, hasNextRoutineEx, exercises]);

  const handleNextRoutineExercise = () => {
    if (nextRoutineEx) {
      setSelectedEx(nextRoutineEx);
      setShowVideo(false);
      Haptics.selectionAsync();
    }
  };

  const handlePrevRoutineExercise = () => {
    if (!selectedRoutine || !hasPrevRoutineEx) return;
    const prevId = selectedRoutine.exerciseIds[currentRoutineExIndex - 1];
    const prevEx = exercises.find((e) => e.id === prevId);
    if (prevEx) {
      setSelectedEx(prevEx);
      setShowVideo(false);
      Haptics.selectionAsync();
    }
  };

  const handleApplyWarmupSet = (w: number, r: number) => {
    setWeightKg(w);
    setRepsCount(r);
    setSelectedSetTag('WARMUP');
    Haptics.selectionAsync();
  };

  const handleUseLastSession = () => {
    if (!exerciseHistory?.lastSet) return;
    setWeightKg(exerciseHistory.lastSet.weight_kg);
    setRepsCount(exerciseHistory.lastSet.reps);
    setSelectedRpe(exerciseHistory.lastSet.rpe || 8);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const getRpeDescription = (rpe: number) => {
    switch (rpe) {
      case 6: return 'RPE 6 • Light warmup / Low effort (4+ reps in reserve)';
      case 7: return 'RPE 7 • Moderate intensity (3 reps in tank)';
      case 8: return 'RPE 8 • Optimal hypertrophy working set (2 reps in tank)';
      case 9: return 'RPE 9 • High effort compound lift (1 rep in tank)';
      case 10: return 'RPE 10 • Maximum limit effort / Muscle failure';
      default: return `RPE ${rpe} effort intensity`;
    }
  };

  const handleBarWeightChange = (newBarKg: number) => {
    setBarWeightKg(newBarKg);
    try {
      db.runSync('UPDATE user_settings SET bar_weight_kg = ? WHERE id = 1', [newBarKg]);
    } catch {
      // ignore
    }
  };

  const handleSaveApiKey = () => {
    try {
      db.runSync('UPDATE user_settings SET gemini_api_key = ? WHERE id = 1', [geminiKeyInput.trim()]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Saved', 'Gemini Vision & Workout API Key saved securely in SQLite.');
    } catch (e) {
      Alert.alert('Error', 'Failed to save API key.');
    }
  };

  const handleSelectSplitFilter = (splitId: string) => {
    setSelectedSplitFilter(splitId);
    setSelectedMuscleFilter('ALL');
    setShowVideo(false);

    let match: Exercise | undefined;
    if (splitId === 'ROUTINE' && selectedRoutine) {
      match = exercises.find((e) => selectedRoutine.exerciseIds.includes(e.id));
    } else if (splitId === 'PUSH') {
      match = exercises.find((e) => ['CHEST', 'SHOULDERS'].includes(e.primary_muscle) || e.id.includes('tricep'));
    } else if (splitId === 'PULL') {
      match = exercises.find((e) => ['BACK'].includes(e.primary_muscle) || e.id.includes('bicep') || e.id.includes('curl'));
    } else if (splitId === 'LEGS') {
      match = exercises.find((e) => ['LEGS'].includes(e.primary_muscle));
    } else if (splitId === 'ARMS') {
      match = exercises.find((e) => ['ARMS'].includes(e.primary_muscle) || e.id.includes('curl') || e.id.includes('tricep'));
    } else if (splitId === 'CORE') {
      match = exercises.find((e) => ['CORE'].includes(e.primary_muscle));
    } else {
      match = exercises[0];
    }

    if (match) {
      setSelectedEx(match);
    }
    Haptics.selectionAsync();
  };

  const handleSelectPresetRoutine = (routine: WorkoutRoutine) => {
    setSelectedRoutine(routine);
    setSelectedSplitFilter('ROUTINE');
    setSelectedMuscleFilter('ALL');
    setShowVideo(false);
    if (routine.exerciseIds.length > 0) {
      const firstEx = exercises.find((e) => e.id === routine.exerciseIds[0]);
      if (firstEx) {
        setSelectedEx(firstEx);
      }
    }
    Haptics.selectionAsync();
  };

  const handleUpdateSleepHours = (deltaHours: number) => {
    const nextVal = Math.max(4, Math.min(14, Number((recoverySleepHours + deltaHours).toFixed(1))));
    setRecoverySleepHours(nextVal);
    saveRecoverySettings({ sleepHours: nextVal });
    Haptics.selectionAsync();
  };

  const handleUpdateSoreness = (lvl: 'NONE' | 'MILD' | 'SORE' | 'SEVERE') => {
    setRecoverySoreness(lvl);
    saveRecoverySettings({ soreness: lvl });
    Haptics.selectionAsync();
  };

  const handleToggleChecklist = (key: string) => {
    setRecoveryChecklist((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      saveRecoverySettings({ checklist: updated });
      return updated;
    });
    Haptics.selectionAsync();
  };

  // Workout Session Handlers
  const handleStartWorkout = (routine?: WorkoutRoutine | null, customTitle?: string) => {
    const isExplicitEmpty = routine === null || (!routine && customTitle);
    const routineObj = isExplicitEmpty ? null : (routine !== undefined ? routine : selectedRoutine);
    const name = customTitle || (routineObj ? routineObj.name : 'Traditional Strength Training');
    setActiveWorkoutName(name);

    if (routineObj) {
      setSelectedRoutine(routineObj);
      const firstEx = exercises.find((e) => routineObj.exerciseIds.includes(e.id));
      if (firstEx) setSelectedEx(firstEx);
    } else {
      setSelectedRoutine(null);
      if (!selectedEx && exercises.length > 0) {
        setSelectedEx(exercises[0]);
      }
    }

    setIsWorkoutActive(true);
    setIsStopwatchPaused(false);
    setSessionSeconds(0);
    setSessionStartTime(Date.now());
    setSessionVolumeKg(0);
    setSessionSetsCount(0);
    setSessionPrsCount(0);
    setSessionSets([]);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleTogglePause = () => {
    setIsStopwatchPaused((prev) => !prev);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handlePromptEndWorkout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (sessionSetsCount === 0) {
      Alert.alert(
        'Finish Workout',
        'You have not logged any sets in this session yet. Are you sure you want to end?',
        [
          { text: 'Keep Training', style: 'cancel' },
          {
            text: 'End Session',
            style: 'destructive',
            onPress: () => setShowSummaryModal(true),
          },
        ]
      );
    } else {
      setShowSummaryModal(true);
    }
  };

  const handleDiscardWorkout = () => {
    Alert.alert(
      'Discard Session',
      'Stop the stopwatch and discard this workout session? Your logged sets will still remain in your daily log.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setIsWorkoutActive(false);
            setIsStopwatchPaused(false);
            setSessionSeconds(0);
            setSessionSets([]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  };

  const handleFinishWorkoutSummary = () => {
    const activeCalories = Math.max(15, Math.round(sessionSeconds * 0.12));
    const todayStr = new Date().toISOString().split('T')[0];

    saveWorkoutSession({
      start_time: sessionStartTime || (Date.now() - sessionSeconds * 1000),
      end_time: Date.now(),
      duration_seconds: sessionSeconds,
      total_volume_kg: sessionVolumeKg,
      total_sets: sessionSetsCount,
      prs_count: sessionPrsCount,
      calories_burned: activeCalories,
      workout_type: activeWorkoutName,
      created_date_str: todayStr,
    });

    setShowSummaryModal(false);
    setIsWorkoutActive(false);
    setIsStopwatchPaused(false);
    setSessionSeconds(0);
    setSessionSets([]);
    refreshAllData();
    setActiveTab('SUMMARY');
  };

  // Complete Set (Gym Logger)
  const handleCompleteSet = () => {
    if (!selectedEx) return;

    const setValidation = validateGymSet(weightKg, repsCount);
    if (!setValidation.isValid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Invalid Set Details', setValidation.error || 'Please enter valid reps and weight.');
      return;
    }

    const velocity = isTrackingSet ? stopVelocityTracking() : 0.65;

    const result = logGymSet(selectedEx.id, weightKg, repsCount, velocity, selectedRpe);
    if (userProfile.autoRestTimer !== false) {
      setRestSeconds(userProfile.defaultRestSeconds || 90);
    }

    // If active workout session, accumulate session stats
    if (isWorkoutActive) {
      const addedVol = weightKg * repsCount;
      setSessionVolumeKg((prev) => prev + addedVol);
      setSessionSetsCount((prev) => prev + 1);
      if (result.isPR) setSessionPrsCount((prev) => prev + 1);

      setSessionSets((prev) => [
        ...prev,
        {
          exerciseId: selectedEx.id,
          exerciseName: selectedEx.name,
          muscle: selectedEx.primary_muscle,
          weightKg,
          reps: repsCount,
          isPr: result.isPR,
        },
      ]);
    }

    refreshAllData();
    if (selectedEx?.id) {
      setExerciseHistory(getExerciseHistorySummary(selectedEx.id));
    }

    if (result.isPR) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setPrBanner(`PERSONAL RECORD: ${selectedEx.name} (Est. 1RM: ${result.estimated1RM} kg)`);
      setTimeout(() => setPrBanner(null), 5000);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
  };

  // Online Exercise API callback
  const handleExerciseImported = (newEx: Exercise) => {
    refreshAllData();
    setSelectedEx(newEx);
    setShowOnlineModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // AI Workout Plan Callback
  const handleStartAiWorkout = (plan: GeneratedWorkoutPlan) => {
    // Seed any new exercises from AI plan into local SQLite
    for (const ex of plan.exercises) {
      db.runSync(
        `INSERT OR REPLACE INTO exercises (id, name, primary_muscle, equipment, youtube_video_id, instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          ex.id,
          ex.name,
          ex.muscle,
          'DUMBBELL',
          'vcBig73ojpE',
          ex.coachingCue || 'Control tempo and maintain full muscular tension.',
        ]
      );
    }

    refreshAllData();
    const firstExObj = exercises.find((e) => e.id === plan.exercises[0]?.id) || {
      id: plan.exercises[0].id,
      name: plan.exercises[0].name,
      primary_muscle: plan.exercises[0].muscle,
      equipment: 'DUMBBELL',
      youtube_video_id: 'vcBig73ojpE',
      instructions: plan.exercises[0].coachingCue,
    };
    setSelectedEx(firstExObj);

    handleStartWorkout(undefined, plan.title);
    setShowAiWorkoutModal(false);
  };

  // Global Nutrition Database Search
  const handleSearchOpenFood = async () => {
    if (foodSearchQuery.trim().length < 2) return;
    setIsSearchingFoodDb(true);
    try {
      const results = await searchOpenFoodFacts(foodSearchQuery);
      setFoodSearchResults(results);
      if (results.length > 0) {
        setSelectedFoodItem(results[0]);
      }
    } finally {
      setIsSearchingFoodDb(false);
    }
  };

  const handleLogFoodItem = (item: FoodSearchResult, customGrams?: number) => {
    const grams = customGrams || parseFloat(servingGramsInput) || 100;
    logFoodFromOpenApi(item, grams);
    refreshAllData();
    setSelectedFoodItem(null);
    setFoodSearchResults([]);
    setFoodSearchQuery('');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Logged!', `Added ${item.name} (${grams}g) to today's macros.`);
  };

  const handleDeleteSet = (setId: number) => {
    Alert.alert('Delete Set', 'Remove this set from today\'s workout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteGymSet(setId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          refreshAllData();
          if (selectedEx?.id) {
            setExerciseHistory(getExerciseHistorySummary(selectedEx.id));
          }
        },
      },
    ]);
  };

  const handleDeleteMeal = (mealId: number) => {
    Alert.alert('Delete Meal', 'Remove this food entry from today\'s log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteMealLog(mealId);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          refreshAllData();
        },
      },
    ]);
  };

  const handlePickFoodImage = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission needed', 'Camera permission is required to snap meals.');
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: false,
        });
        await processFoodImage(res);
      } else {
        const res = await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsEditing: false,
        });
        await processFoodImage(res);
      }
    } catch (err) {
      console.warn('Error picking image:', err);
    }
  };

  const processFoodImage = async (res: ImagePicker.ImagePickerResult) => {
    if (!res.canceled && res.assets && res.assets.length > 0 && res.assets[0].uri) {
      const pickedUri = res.assets[0].uri;
      setShowFoodConfirmModal(true);
      setIsAnalyzingFood(true);
      setAnalyzedFood(null);
      try {
        const result = await analyzeFoodPhoto(pickedUri, foodHint);
        setAnalyzedFood(result);
        setFoodHint('');
      } catch (e) {
        console.warn('Food scan error:', e);
      } finally {
        setIsAnalyzingFood(false);
      }
    }
  };

  // AI Equipment & Gym Machine Vision Scanner Handlers
  const handlePickEquipmentImage = async (source: 'camera' | 'library') => {
    try {
      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert(
            'Camera Access Required',
            'Camera permission is needed to scan gym equipment and machines for biomechanics and setup.'
          );
          return;
        }
        const res = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: false,
        });
        await processEquipmentImage(res);
      } else {
        const res = await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsEditing: false,
        });
        await processEquipmentImage(res);
      }
    } catch (err) {
      console.warn('[handlePickEquipmentImage] Error picking equipment image:', err);
    }
  };

  const processEquipmentImage = async (res: ImagePicker.ImagePickerResult) => {
    if (!res.canceled && res.assets && res.assets.length > 0 && res.assets[0].uri) {
      const pickedUri = res.assets[0].uri;
      setShowEquipmentScannerModal(true);
      setIsAnalyzingEquipment(true);
      setAnalyzedEquipment(null);
      try {
        const result = await analyzeGymEquipmentImage(pickedUri);
        setAnalyzedEquipment(result);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {
        console.warn('[processEquipmentImage] AI equipment scan failed:', e);
      } finally {
        setIsAnalyzingEquipment(false);
      }
    }
  };

  const handleSelectEquipmentExercise = (
    exerciseName: string,
    primaryMuscle: string,
    coachingCue?: string,
    youtubeVideoId?: string
  ) => {
    setShowEquipmentScannerModal(false);

    const videoId = youtubeVideoId || 'IZxyjW7MPJQ';

    // Look for matching exercise in SQLite or state
    const existing = exercises.find((e) => e.name.toLowerCase() === exerciseName.toLowerCase());
    if (existing) {
      if (existing.youtube_video_id === 'vcBig73ojpE' && youtubeVideoId) {
        db.runSync('UPDATE exercises SET youtube_video_id = ? WHERE id = ?', [youtubeVideoId, existing.id]);
        existing.youtube_video_id = youtubeVideoId;
      }
      setSelectedEx(existing);
    } else {
      const newExId = `eq_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      db.runSync(
        `INSERT OR REPLACE INTO exercises (id, name, primary_muscle, equipment, youtube_video_id, instructions)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newExId,
          exerciseName,
          primaryMuscle || 'Full Body',
          'MACHINE',
          videoId,
          coachingCue || 'Control eccentric descent, align joint axis with machine pivot, and avoid violent lockouts.',
        ]
      );
      refreshAllData();
      setSelectedEx({
        id: newExId,
        name: exerciseName,
        primary_muscle: primaryMuscle || 'Full Body',
        equipment: 'MACHINE',
        youtube_video_id: videoId,
        instructions: coachingCue || 'Control eccentric descent, align joint axis with machine pivot, and avoid violent lockouts.',
      });
    }

    setActiveTab('WORKOUT');

    if (!isWorkoutActive) {
      setIsWorkoutActive(true);
      setIsStopwatchPaused(false);
      setSessionSeconds(0);
      setSessionStartTime(Date.now());
      setCurrentSetNumber(1);
      setSessionSetsCount(0);
      setSessionVolumeKg(0);
      setSessionPrsCount(0);
      setSessionSets([]);
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleQuickLogStaple = (item: (typeof GYM_STAPLES)[number]) => {
    const today = new Date().toISOString().split('T')[0];
    db.runSync(
      'INSERT INTO meal_logs (date_str, name, calories, protein_g, carbs_g, fat_g, image_uri, micros_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [today, item.name, item.cal, item.p, item.c, item.f, '', JSON.stringify({ note: '1-Tap Gym Staple' })]
    );
    refreshAllData();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert('Logged!', `Added ${item.name} (${item.cal} kcal, ${item.p}g Protein) to today's macros.`);
  };

  const handleExportBackup = async () => {
    const success = await exportDatabaseBackup();
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleImportBackup = async () => {
    Alert.alert(
      'Import Backup',
      'This will replace your current workout and nutrition database. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          style: 'destructive',
          onPress: async () => {
            const success = await importDatabaseBackup();
            if (success) {
              refreshAllData();
              Alert.alert('Success', 'Backup restored successfully!');
            } else {
              Alert.alert('Error', 'Failed to import backup.');
            }
          },
        },
      ]
    );
  };

  // Filtered Exercises for the library & search
  const filteredExercises = useMemo(() => {
    return exercises.filter((ex) => {
      // Search query filter
      if (searchQuery.trim().length > 0) {
        const q = searchQuery.toLowerCase();
        return (
          ex.name.toLowerCase().includes(q) ||
          ex.primary_muscle.toLowerCase().includes(q) ||
          ex.equipment.toLowerCase().includes(q)
        );
      }

      // Routine filter (if routine selected and in routine-mode)
      if (selectedSplitFilter === 'ROUTINE' && selectedRoutine) {
        return selectedRoutine.exerciseIds.includes(ex.id);
      }

      // Muscle split filters
      if (selectedSplitFilter === 'PUSH') {
        return ['CHEST', 'SHOULDERS'].includes(ex.primary_muscle) || ex.id.includes('tricep');
      }
      if (selectedSplitFilter === 'PULL') {
        return ['BACK'].includes(ex.primary_muscle) || ex.id.includes('bicep') || ex.id.includes('curl');
      }
      if (selectedSplitFilter === 'LEGS') {
        return ['LEGS'].includes(ex.primary_muscle);
      }
      if (selectedSplitFilter === 'ARMS') {
        return ['ARMS'].includes(ex.primary_muscle) || ex.id.includes('curl') || ex.id.includes('tricep');
      }
      if (selectedSplitFilter === 'CORE') {
        return ['CORE'].includes(ex.primary_muscle);
      }

      // Muscle group filter fallback
      if (selectedMuscleFilter !== 'ALL') {
        return ex.primary_muscle.toUpperCase() === selectedMuscleFilter;
      }

      return true;
    });
  }, [exercises, searchQuery, selectedSplitFilter, selectedRoutine, selectedMuscleFilter]);

  // Aggregated completed exercises for summary modal
  const exercisesSummaryList = useMemo(() => {
    const map = new Map<string, { name: string; muscle: string; setsCount: number; maxWeightKg: number; totalVolumeKg: number }>();
    for (const s of sessionSets) {
      const existing = map.get(s.exerciseId);
      if (!existing) {
        map.set(s.exerciseId, {
          name: s.exerciseName,
          muscle: s.muscle,
          setsCount: 1,
          maxWeightKg: s.weightKg,
          totalVolumeKg: s.weightKg * s.reps,
        });
      } else {
        existing.setsCount += 1;
        existing.maxWeightKg = Math.max(existing.maxWeightKg, s.weightKg);
        existing.totalVolumeKg += s.weightKg * s.reps;
      }
    }
    return Array.from(map.values());
  }, [sessionSets]);

  const splitOptions = [
    { id: 'ALL', label: 'All Exercises' },
    { id: 'ROUTINE', label: 'Active Routine' },
    { id: 'PUSH', label: 'Push' },
    { id: 'PULL', label: 'Pull' },
    { id: 'LEGS', label: 'Legs' },
    { id: 'ARMS', label: 'Arms & Delts' },
    { id: 'CORE', label: 'Core & Abs' },
  ];

  const rpeOptions = [7, 8, 9, 10];

  // Dynamic Activity Rings Calculations from Athlete Profile
  const targetDailyVolume = userProfile.targetVolumeKg || 5000;
  const targetDailySets = userProfile.targetSets || 20;
  const volumeProgress = targetDailyVolume > 0 ? dailySummary.totalVolumeKg / targetDailyVolume : 0;
  const setsProgress = targetDailySets > 0 ? dailySummary.totalSets / targetDailySets : 0;

  const recoveryValues = Object.values(recoveryData);
  const avgReadiness = Math.round(
    recoveryValues.reduce((acc, m) => acc + m.recoveryPercent, 0) / (recoveryValues.length || 1)
  );
  const readinessProgress = avgReadiness / 100;

  const effectiveReadiness = useMemo(() => {
    let score = avgReadiness;
    const targetSleep = userProfile.targetSleepHours || 8.0;
    if (recoverySleepHours >= targetSleep) score += 4;
    else if (recoverySleepHours < targetSleep - 1.5) score -= 12;
    else if (recoverySleepHours < targetSleep) score -= 5;

    if (recoverySoreness === 'SORE') score -= 8;
    else if (recoverySoreness === 'SEVERE') score -= 18;
    else if (recoverySoreness === 'NONE') score += 3;

    if (todayWaterMl >= (userProfile.targetWaterMl || 3000)) score += 3;

    return Math.max(15, Math.min(100, score));
  }, [avgReadiness, recoverySleepHours, recoverySoreness, todayWaterMl, userProfile]);

  const mostFatiguedMuscle = useMemo(() => {
    const list = [...recoveryValues];
    list.sort((a, b) => a.recoveryPercent - b.recoveryPercent);
    return list[0] || null;
  }, [recoveryValues]);

  const recommendedMobility = useMemo(() => {
    if (!mostFatiguedMuscle) return [];
    return getMobilityProtocol(mostFatiguedMuscle.muscle);
  }, [mostFatiguedMuscle]);

  const totalCalories = meals.reduce((acc, m) => acc + m.calories, 0);
  const totalProtein = meals.reduce((acc, m) => acc + m.protein_g, 0);
  const totalCarbs = meals.reduce((acc, m) => acc + m.carbs_g, 0);
  const totalFat = meals.reduce((acc, m) => acc + m.fat_g, 0);

  const todayDateString = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).toUpperCase();

  const activeWorkoutCalories = Math.max(8, Math.round(sessionSeconds * 0.12));

  return (
    <View style={[styles.container, { backgroundColor: theme.bg, paddingTop: insets.top }]}>
      <StatusBar barStyle={theme.isDark ? 'light-content' : 'dark-content'} />

      {/* TOP HEADER WITH BESPOKE ATHLETIC LOGO & PROFILE */}
      <View style={styles.topHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <AmpedBrandLogo theme={theme} size={42} tagline={todayDateString} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {isWorkoutActive && (
            <TouchableOpacity
              onPress={() => setActiveTab('WORKOUT')}
              style={[styles.liveMiniPill, { backgroundColor: `${theme.primary}25`, borderColor: theme.primary }]}
            >
              <View style={[styles.pulsingGreenDot, { backgroundColor: theme.primary }]} />
              <Text style={[styles.liveMiniText, { color: theme.primary }]} numberOfLines={1}>
                {formatTimer(sessionSeconds)}
              </Text>
            </TouchableOpacity>
          )}

          {/* UNIFIED STUDIO UTILITIES CAPSULE */}
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setShowQuickToolsModal(true);
            }}
            style={[
              styles.studioToolsCapsule,
              {
                backgroundColor: theme.cardElevated,
                borderColor: alarms.some((a) => a.isActive) ? `${theme.primary}60` : theme.border,
              },
            ]}
            activeOpacity={0.75}
          >
            <Sparkles size={14} color={theme.primary} />
            <Text style={[styles.studioToolsText, { color: theme.text }]}>Studio</Text>
            {alarms.some((a) => a.isActive) && (
              <View style={[styles.studioActiveDot, { backgroundColor: '#FF9F0A' }]} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setShowProfileModal(true);
            }}
            activeOpacity={0.8}
            accessibilityLabel="Open Athlete Profile"
          >
            <View
              style={[
                styles.avatarCircle,
                {
                  backgroundColor: userProfile.avatarColor || theme.primary,
                  borderColor: theme.border,
                },
              ]}
            >
              {userProfile.profileImageUri ? (
                <Image source={{ uri: userProfile.profileImageUri }} style={styles.headerAvatarImage} />
              ) : (
                <Text style={styles.avatarInitialsText}>
                  {userProfile.userName
                    ? userProfile.userName
                        .trim()
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)
                    : 'AC'}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* FLOATING REST TIMER */}
      <ApmedRestTimer
        remainingSeconds={restSeconds}
        totalSeconds={userProfile.defaultRestSeconds || 90}
        onSkip={() => setRestSeconds(0)}
        onAdd30s={() => setRestSeconds((prev) => prev + 30)}
      />

      {/* PR CELEBRATION BANNER */}
      {prBanner && (
        <View style={[styles.prBanner, { backgroundColor: theme.cardElevated, borderBottomColor: isOled ? '#222222' : theme.border }]}>
          <Trophy size={18} color={isOled ? '#FFFFFF' : '#FFD60A'} />
          <Text style={[styles.prBannerText, { color: isOled ? '#FFFFFF' : '#FFD60A' }]}>{prBanner}</Text>
        </View>
      )}

      {/* SCROLLABLE CONTENT WITH KEYBOARD HANDLING */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
        {activeTab === 'SUMMARY' && (
          /* ================= TAB 1: SUMMARY ================= */
          <View>
            {/* SEGMENTED DASHBOARD VIEW SWITCHER (APMED HEALTH vs APMED RINGS) */}
            <View
              style={[
                styles.segmentSwitcherContainer,
                { backgroundColor: theme.cardElevated, borderColor: theme.border, marginBottom: 16 },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  setSummaryDashboardView('APMED_HEALTH');
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.segmentSwitcherTab,
                  summaryDashboardView === 'APMED_HEALTH' && { backgroundColor: isOled ? '#FFFFFF' : theme.primary },
                ]}
                activeOpacity={0.8}
              >
                <Zap
                  size={14}
                  color={
                    summaryDashboardView === 'APMED_HEALTH'
                      ? (isOled ? '#000000' : theme.primaryText)
                      : theme.subtext
                  }
                />
                <Text
                  style={[
                    styles.segmentSwitcherText,
                    {
                      color:
                        summaryDashboardView === 'APMED_HEALTH'
                          ? (isOled ? '#000000' : theme.primaryText)
                          : theme.subtext,
                      fontWeight: '800',
                    },
                  ]}
                >
                  Apmed Health
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSummaryDashboardView('APMED_RINGS');
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.segmentSwitcherTab,
                  summaryDashboardView === 'APMED_RINGS' && { backgroundColor: isOled ? '#FFFFFF' : theme.primary },
                ]}
                activeOpacity={0.8}
              >
                <Activity
                  size={14}
                  color={
                    summaryDashboardView === 'APMED_RINGS'
                      ? (isOled ? '#000000' : theme.primaryText)
                      : theme.subtext
                  }
                />
                <Text
                  style={[
                    styles.segmentSwitcherText,
                    {
                      color:
                        summaryDashboardView === 'APMED_RINGS'
                          ? (isOled ? '#000000' : theme.primaryText)
                          : theme.subtext,
                      fontWeight: '800',
                    },
                  ]}
                >
                  Apmed Rings
                </Text>
              </TouchableOpacity>
            </View>

            {summaryDashboardView === 'APMED_HEALTH' ? (
              /* ================= APMED HEALTH TELEMETRY VIEW ================= */
              <View>
                {/* 1. APMED ENERGY SCORE WITH CIRCULAR GAUGE & SUB-METRICS */}
                <ApmedEnergyScoreCard
                  theme={theme}
                  volumeProgress={volumeProgress}
                  setsProgress={setsProgress}
                  recoveryProgress={avgReadiness}
                  hydrationProgress={todayWaterMl / (userProfile.targetWaterMl || 3000)}
                  targetSleep={recoverySleepHours || 8.0}
                  onOpenRecovery={() => setActiveTab('RECOVERY')}
                />

                {/* 2. PROMINENT WORKOUT ACTION HERO */}
                {isWorkoutActive ? (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setActiveTab('WORKOUT');
                    }}
                    style={[styles.apmedWorkoutTile, { backgroundColor: theme.cardElevated, borderColor: theme.primary, marginBottom: 14 }]}
                  >
                    <View style={[styles.workoutIconCircle, { backgroundColor: `${theme.primary}25` }]}>
                      <Flame size={24} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14, paddingRight: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.pulsingGreenDot, { backgroundColor: theme.primary }]} />
                        <Text style={[styles.workoutTileName, { color: theme.text }]} numberOfLines={1}>
                          {activeWorkoutName}
                        </Text>
                      </View>
                      <Text style={[styles.workoutTileMeta, { color: theme.primary, fontWeight: '800' }]} numberOfLines={1}>
                        {formatTimer(sessionSeconds)} • {sessionVolumeKg.toLocaleString()} kg • {sessionSetsCount} sets
                      </Text>
                    </View>
                    <ChevronRight size={20} color={theme.primary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setActiveTab('WORKOUT');
                    }}
                    style={[styles.apmedWorkoutTile, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 14 }]}
                  >
                    <View style={[styles.workoutIconCircle, { backgroundColor: `${theme.primary}20` }]}>
                      <Play size={22} color={theme.primary} fill={theme.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14, paddingRight: 6 }}>
                      <Text style={[styles.workoutTileName, { color: theme.text }]} numberOfLines={1}>
                        Start Workout Session
                      </Text>
                      <Text style={[styles.workoutTileMeta, { color: theme.subtext }]} numberOfLines={1}>
                        {selectedRoutine?.name || 'Push, Pull, Legs & 45+ exercises'}
                      </Text>
                    </View>
                    <View style={[styles.startPillBadge, { backgroundColor: theme.primary, flexShrink: 0 }]}>
                      <Text style={[styles.startPillBadgeText, { color: theme.primaryText }]}>START</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* 3. APMED DAILY ACTIVITY 3-PILLARS PROGRESS CARD */}
                <ApmedDailyActivityCard
                  theme={theme}
                  currentSteps={stepTracker.steps}
                  targetSteps={userProfile.targetDailySteps || 10000}
                  currentSets={dailySummary.totalSets}
                  targetSets={targetDailySets}
                  currentVolumeKg={dailySummary.totalVolumeKg}
                  targetVolumeKg={targetDailyVolume}
                  onOpenSteps={() => setShowStepModal(true)}
                  onOpenWorkout={() => setActiveTab('WORKOUT')}
                  onOpenTargets={() => setShowTargetsModal(true)}
                />

                {/* 4. INTERACTIVE 7-DAY WEEKLY GRAPH WITH METRIC SWITCHER */}
                <ApmedWeeklyGraph
                  theme={theme}
                  daysActive={weeklyConsistency.daysActive}
                  todayVolumeKg={dailySummary.totalVolumeKg}
                  targetDailyVolume={targetDailyVolume}
                  todaySteps={stepTracker.steps}
                  targetDailySteps={userProfile.targetDailySteps || 10000}
                  recentSessionsCount={recentSessions.length}
                />

                {/* 5. LIQUID WAVE HYDRATION TRACKER WITH QUICK PRESETS */}
                <ApmedHydrationTracker
                  theme={theme}
                  todayWaterMl={todayWaterMl}
                  targetWaterMl={userProfile.targetWaterMl || 3000}
                  onAddWater={handleAddWater}
                  onResetWater={handleResetWater}
                />

                {/* 6. LIVE VITALS & ECG WAVEFORM CARD */}
                <ApmedVitalsCard
                  theme={theme}
                  heartRate={latestWellness?.heartRateBpm ?? 62}
                  hrvRmssd={latestWellness?.hrvRmssd ?? 68}
                  readinessScore={avgReadiness}
                  onOpenPpg={() => setShowPpgModal(true)}
                />
              </View>
            ) : (
              /* ================= APMED ACTIVITY RINGS VIEW ================= */
              <View>
                {/* HERO ACTIVITY RINGS CARD (100% DYNAMIC) */}
                <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>ATHLETIC EFFORT & ENERGY</Text>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>Today's Progress</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <TouchableOpacity
                        onPress={() => {
                          setShowTargetsModal(true);
                          Haptics.selectionAsync();
                        }}
                        style={[styles.actionHeaderPill, { backgroundColor: `${theme.primary}18`, borderColor: theme.primary }]}
                      >
                        <Target size={12} color={theme.primary} />
                        <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '800' }}>Edit Targets</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* READ-ONLY VIEW: ACTIVITY RINGS & LEGEND (EDIT VIA DEDICATED HEADER BTN) */}
                  <View style={styles.ringsSectionRow}>
                    <ApmedActivityRings
                      volumeProgress={volumeProgress}
                      setsProgress={setsProgress}
                      recoveryProgress={readinessProgress}
                      size={120}
                    />

                    <View style={styles.ringsLegendColumn}>
                      {/* RING 1: MOVE / VOLUME */}
                      <View style={styles.ringMetricItem}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={[styles.colorIndicator, { backgroundColor: isOled ? '#FFFFFF' : theme.accentRed }]} />
                          <Text style={[styles.ringMetricLabel, { color: theme.subtext }]} numberOfLines={1}>
                            MOVE ({Math.round(volumeProgress * 100)}%)
                          </Text>
                        </View>
                        <Text style={[styles.ringMetricValue, { color: isOled ? '#FFFFFF' : theme.accentRed }]} numberOfLines={1}>
                          {dailySummary.totalVolumeKg.toLocaleString()} <Text style={styles.ringMetricUnit}>KG</Text>
                        </Text>
                        <Text style={[styles.ringMetricGoal, { color: theme.subtext }]} numberOfLines={1}>
                          Goal: {targetDailyVolume.toLocaleString()} KG
                        </Text>
                      </View>

                      {/* RING 2: EXERCISE / SETS */}
                      <View style={styles.ringMetricItem}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={[styles.colorIndicator, { backgroundColor: isOled ? '#D1D1D6' : theme.primary }]} />
                          <Text style={[styles.ringMetricLabel, { color: theme.subtext }]} numberOfLines={1}>
                            EXERCISE ({Math.round(setsProgress * 100)}%)
                          </Text>
                        </View>
                        <Text style={[styles.ringMetricValue, { color: isOled ? '#D1D1D6' : theme.primary }]} numberOfLines={1}>
                          {dailySummary.totalSets} <Text style={styles.ringMetricUnit}>SETS</Text>
                        </Text>
                        <Text style={[styles.ringMetricGoal, { color: theme.subtext }]} numberOfLines={1}>
                          Goal: {targetDailySets} SETS
                        </Text>
                      </View>

                      {/* RING 3: STAND / RECOVERY */}
                      <View style={styles.ringMetricItem}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                          <View style={[styles.colorIndicator, { backgroundColor: isOled ? '#8E8E93' : theme.accentCyan }]} />
                          <Text style={[styles.ringMetricLabel, { color: theme.subtext }]} numberOfLines={1}>BODY READINESS</Text>
                        </View>
                        <Text style={[styles.ringMetricValue, { color: isOled ? '#8E8E93' : theme.accentCyan }]} numberOfLines={1}>
                          {avgReadiness}% <Text style={styles.ringMetricUnit}>OPTIMAL</Text>
                        </Text>
                        <Text style={[styles.ringMetricGoal, { color: theme.subtext }]} numberOfLines={1}>
                          Muscle State: {avgReadiness >= 80 ? 'Prime' : avgReadiness >= 50 ? 'Recovering' : 'Fatigued'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* DYNAMIC HOURLY TRAINING DENSITY DISTRIBUTION */}
                  <View style={[styles.hourlyBarContainer, { borderTopColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <Text style={[styles.hourlyLabel, { color: theme.subtext, marginBottom: 0 }]}>
                        TODAY'S TRAINING DENSITY
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.subtext, fontWeight: '700' }}>
                        {dailySummary.totalSets > 0 ? `${dailySummary.totalSets} Sets Logged Today` : 'No Sets Logged Yet'}
                      </Text>
                    </View>

                    <View style={styles.barsRow}>
                      {hourlyDensity.map((bucket, i) => (
                        <View key={i} style={styles.barCol}>
                          <View
                            style={[
                              styles.barFill,
                              {
                                height: `${bucket.fillPercent}%`,
                                backgroundColor:
                                  bucket.volumeKg > 0
                                    ? isOled
                                      ? bucket.isPeak ? '#FFFFFF' : '#8E8E93'
                                      : bucket.isPeak ? theme.accentRed : theme.primary
                                    : `${theme.subtext}25`,
                              },
                            ]}
                          />
                        </View>
                      ))}
                    </View>

                    {/* 2-HOUR INTERVAL LABELS */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                      {hourlyDensity.map((b, i) => (
                        <Text key={i} style={{ fontSize: 8, color: theme.subtext, textAlign: 'center', flex: 1 }}>
                          {i % 2 === 0 ? b.label : ''}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>

                {/* PROMINENT WORKOUT ACTION HERO (APMED ENGINE) */}
                {isWorkoutActive ? (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setActiveTab('WORKOUT');
                    }}
                    style={[styles.apmedWorkoutTile, { backgroundColor: theme.cardElevated, borderColor: theme.primary, marginBottom: 14 }]}
                  >
                    <View style={[styles.workoutIconCircle, { backgroundColor: `${theme.primary}25` }]}>
                      <Flame size={24} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14, paddingRight: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={[styles.pulsingGreenDot, { backgroundColor: theme.primary }]} />
                        <Text style={[styles.workoutTileName, { color: theme.text }]} numberOfLines={1}>
                          {activeWorkoutName}
                        </Text>
                      </View>
                      <Text style={[styles.workoutTileMeta, { color: theme.primary, fontWeight: '800' }]} numberOfLines={1}>
                        {formatTimer(sessionSeconds)} • {sessionVolumeKg.toLocaleString()} kg • {sessionSetsCount} sets
                      </Text>
                    </View>
                    <ChevronRight size={20} color={theme.primary} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setActiveTab('WORKOUT');
                    }}
                    style={[styles.apmedWorkoutTile, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 14 }]}
                  >
                    <View style={[styles.workoutIconCircle, { backgroundColor: `${theme.primary}20` }]}>
                      <Play size={22} color={theme.primary} fill={theme.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14, paddingRight: 6 }}>
                      <Text style={[styles.workoutTileName, { color: theme.text }]} numberOfLines={1}>
                        Start Workout Session
                      </Text>
                      <Text style={[styles.workoutTileMeta, { color: theme.subtext }]} numberOfLines={1}>
                        {selectedRoutine?.name || 'Push, Pull, Legs & 45+ exercises'}
                      </Text>
                    </View>
                    <View style={[styles.startPillBadge, { backgroundColor: theme.primary, flexShrink: 0 }]}>
                      <Text style={[styles.startPillBadgeText, { color: theme.primaryText }]}>START</Text>
                    </View>
                  </TouchableOpacity>
                )}

                {/* MINIMALIST ATHLETIC BIO-GLANCE GRID (4-PILL BENTO) */}
                <View style={styles.bioGlanceGrid}>
                  <View style={styles.bioGlanceRow}>
                    {/* TILE 1: STEPS TELEMETRY */}
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowStepModal(true);
                      }}
                      style={[styles.bioGlanceTile, { backgroundColor: theme.card, borderColor: theme.border }]}
                      activeOpacity={0.75}
                    >
                      <View style={styles.bioGlanceTopRow}>
                        <View style={[styles.bioGlanceIconBadge, { backgroundColor: isOled ? '#FFFFFF15' : `${theme.primary}20` }]}>
                          <Footprints size={14} color={isOled ? '#FFFFFF' : theme.primary} />
                        </View>
                        <Text style={[styles.bioGlanceStatusPill, { color: isOled ? '#FFFFFF' : theme.primary }]}>
                          {stepTracker.movementState}
                        </Text>
                      </View>
                      <Text style={[styles.bioGlanceValue, { color: theme.text }]} numberOfLines={1}>
                        {stepTracker.steps.toLocaleString()}
                      </Text>
                      <View style={styles.bioGlanceBottomRow}>
                        <Text style={[styles.bioGlanceLabel, { color: theme.subtext }]}>
                          Steps • {stepTracker.distanceKm}km
                        </Text>
                        <Text style={[styles.bioGlanceSub, { color: theme.subtext }]}>
                          {Math.min(100, Math.round((stepTracker.steps / (userProfile.targetDailySteps || 10000)) * 100))}%
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* TILE 2: VITALS & RESTING HR */}
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowPpgModal(true);
                      }}
                      style={[styles.bioGlanceTile, { backgroundColor: theme.card, borderColor: theme.border }]}
                      activeOpacity={0.75}
                    >
                      <View style={styles.bioGlanceTopRow}>
                        <View style={[styles.bioGlanceIconBadge, { backgroundColor: isOled ? '#FFFFFF15' : '#FF2D5520' }]}>
                          <Heart size={14} color={isOled ? '#FFFFFF' : '#FF2D55'} />
                        </View>
                        <Text style={[styles.bioGlanceStatusPill, { color: theme.subtext }]}>
                          {latestWellness ? `${latestWellness.hrvRmssd}ms HRV` : 'Pulse'}
                        </Text>
                      </View>
                      <Text style={[styles.bioGlanceValue, { color: isOled ? '#FFFFFF' : '#FF2D55' }]} numberOfLines={1}>
                        {latestWellness ? `${latestWellness.heartRateBpm}` : '62'}{' '}
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.subtext }}>BPM</Text>
                      </Text>
                      <View style={styles.bioGlanceBottomRow}>
                        <Text style={[styles.bioGlanceLabel, { color: theme.subtext }]}>
                          Resting HR
                        </Text>
                        <Text style={[styles.bioGlanceSub, { color: isOled ? '#FFFFFF' : '#34C759' }]}>
                          Optimal
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.bioGlanceRow}>
                    {/* TILE 3: HYDRATION GLANCE (TAP ADDS 250ML) */}
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        handleAddWater(250);
                      }}
                      style={[styles.bioGlanceTile, { backgroundColor: theme.card, borderColor: theme.border }]}
                      activeOpacity={0.75}
                    >
                      <View style={styles.bioGlanceTopRow}>
                        <View style={[styles.bioGlanceIconBadge, { backgroundColor: isOled ? '#FFFFFF15' : '#00E5FF20' }]}>
                          <Droplets size={14} color={isOled ? '#FFFFFF' : '#00E5FF'} />
                        </View>
                        <View style={[styles.bioQuickAddBadge, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                          <Plus size={10} color={theme.text} />
                          <Text style={{ fontSize: 9, fontWeight: '800', color: theme.text }}>250ml</Text>
                        </View>
                      </View>
                      <Text style={[styles.bioGlanceValue, { color: isOled ? '#FFFFFF' : '#00E5FF' }]} numberOfLines={1}>
                        {(todayWaterMl / 1000).toFixed(1)}{' '}
                        <Text style={{ fontSize: 13, fontWeight: '700', color: theme.subtext }}>
                          / {((userProfile.targetWaterMl || 3000) / 1000).toFixed(1)}L
                        </Text>
                      </Text>
                      <View style={styles.bioGlanceBottomRow}>
                        <Text style={[styles.bioGlanceLabel, { color: theme.subtext }]}>
                          Hydration
                        </Text>
                        <Text style={[styles.bioGlanceSub, { color: theme.subtext }]}>
                          {Math.round((todayWaterMl / (userProfile.targetWaterMl || 3000)) * 100)}%
                        </Text>
                      </View>
                    </TouchableOpacity>

                    {/* TILE 4: RECOVERY & READINESS */}
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setActiveTab('RECOVERY');
                      }}
                      style={[styles.bioGlanceTile, { backgroundColor: theme.card, borderColor: theme.border }]}
                      activeOpacity={0.75}
                    >
                      <View style={styles.bioGlanceTopRow}>
                        <View style={[styles.bioGlanceIconBadge, { backgroundColor: isOled ? '#FFFFFF15' : `${theme.primary}20` }]}>
                          <Zap size={14} color={isOled ? '#FFFFFF' : theme.primary} />
                        </View>
                        <Text style={[styles.bioGlanceStatusPill, { color: avgReadiness >= 75 ? (isOled ? '#FFFFFF' : '#30D158') : theme.subtext }]}>
                          {avgReadiness >= 75 ? 'Optimal' : avgReadiness >= 50 ? 'Recovering' : 'Fatigued'}
                        </Text>
                      </View>
                      <Text style={[styles.bioGlanceValue, { color: theme.text }]} numberOfLines={1}>
                        {avgReadiness}% <Text style={{ fontSize: 13, fontWeight: '700', color: theme.subtext }}>READY</Text>
                      </Text>
                      <View style={styles.bioGlanceBottomRow}>
                        <Text style={[styles.bioGlanceLabel, { color: theme.subtext }]}>
                          Recovery State
                        </Text>
                        <Text style={[styles.bioGlanceSub, { color: theme.primary }]}>
                          View Heatmap →
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* WEEKLY CONSISTENCY & GOAL TRACKER CARD */}
                <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>WEEKLY ATHLETE CONSISTENCY</Text>
                      <Text style={[styles.cardTitle, { color: theme.text }]}>
                        {weeklyConsistency.completedDays} of {userProfile.weeklyWorkoutDaysTarget || 5} Days Hit
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setShowProfileModal(true);
                        Haptics.selectionAsync();
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingVertical: 5,
                        paddingHorizontal: 9,
                        borderRadius: 10,
                        backgroundColor: `${theme.primary}20`,
                        borderWidth: 1,
                        borderColor: theme.primary,
                      }}
                    >
                      <CalendarCheck size={12} color={theme.primary} />
                      <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '800' }}>
                        {weeklyConsistency.percentage}% Hit
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* 7-DAY PROGRESS CIRCLES */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingHorizontal: 4 }}>
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((dayLetter, idx) => {
                      const isActive = weeklyConsistency.daysActive[idx];
                      const todayIdx = (new Date().getDay() + 6) % 7;
                      const isToday = todayIdx === idx;
                      return (
                        <View key={idx} style={{ alignItems: 'center', gap: 6 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: isToday ? theme.primary : theme.subtext }}>
                            {dayLetter}
                          </Text>
                          <View
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 17,
                              alignItems: 'center',
                              justifyContent: 'center',
                              backgroundColor: isActive ? theme.primary : theme.cardElevated,
                              borderWidth: isToday ? 2 : 1,
                              borderColor: isToday ? theme.primary : isActive ? theme.primary : theme.border,
                            }}
                          >
                            {isActive ? (
                              <Check size={16} color={theme.primaryText} />
                            ) : (
                              <View
                                style={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: 3,
                                  backgroundColor: theme.subtext,
                                  opacity: 0.35,
                                }}
                              />
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                    <Text style={{ fontSize: 11, color: theme.subtext }}>
                      Program: <Text style={{ fontWeight: '700', color: theme.text }}>{userProfile.preferredSplit || 'Push / Pull / Legs (PPL)'}</Text>
                    </Text>
                    <TouchableOpacity onPress={() => setShowProfileModal(true)}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
                        Adjust Goal →
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* RECENT SESSIONS HISTORY */}
            {recentSessions.length > 0 && (
              <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 4 }]}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>SAVED WORKOUT SESSIONS</Text>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Recent History</Text>
                  </View>
                  <Award size={20} color={theme.primary} />
                </View>

                {recentSessions.slice(0, 3).map((sess, idx) => (
                  <View
                    key={sess.id || idx}
                    style={[
                      styles.historyItemRow,
                      { borderBottomColor: theme.border },
                      idx === Math.min(2, recentSessions.length - 1) && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[styles.historyExerciseName, { color: theme.text }]} numberOfLines={1}>
                        {sess.workout_type}
                      </Text>
                      <Text style={[styles.historyMeta, { color: theme.subtext }]} numberOfLines={1}>
                        {sess.created_date_str} • {Math.round(sess.duration_seconds / 60)}m • {sess.calories_burned} kcal
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                      <Text style={[styles.historySetDigits, { color: theme.primary }]} numberOfLines={1}>
                        {sess.total_volume_kg.toLocaleString()} kg
                      </Text>
                      <Text style={[styles.historyMeta, { color: theme.subtext }]} numberOfLines={1}>
                        {sess.total_sets} sets {sess.prs_count > 0 ? `• ${sess.prs_count} PRs` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* TODAY'S COMPLETED SETS FEED */}
            <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>SESSION TIMELINE</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Logged Sets Today</Text>
                </View>
                <Clock size={18} color={theme.subtext} />
              </View>

              {todaySetsList.length === 0 ? (
                <View style={styles.emptyFeed}>
                  <Dumbbell size={32} color={theme.border} />
                  <Text style={[styles.emptyFeedText, { color: theme.subtext }]}>No sets logged today yet.</Text>
                  <Text style={[styles.emptyFeedSub, { color: theme.tertiary }]}>Tap Workout tab to start lifting!</Text>
                </View>
              ) : (
                todaySetsList.map((set, idx) => (
                  <View
                    key={set.id || idx}
                    style={[
                      styles.historyItemRow,
                      { borderBottomColor: theme.border },
                      idx === todaySetsList.length - 1 && { borderBottomWidth: 0 },
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={[styles.historyExerciseName, { color: theme.text }]} numberOfLines={1}>
                        {set.exercise_name}
                      </Text>
                      <Text style={[styles.historyMeta, { color: theme.subtext }]} numberOfLines={1}>
                        {set.primary_muscle} • RPE {set.rpe || 8} • {set.velocity_ms} m/s
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', flexDirection: 'row', gap: 10, flexShrink: 0 }}>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.historySetDigits, { color: theme.primary }]}>
                          {set.weight_kg} kg × {set.reps}
                        </Text>
                        {set.is_pr === 1 && (
                          <View
                            style={[
                              styles.prBadgePill,
                              { flexDirection: 'row', alignItems: 'center', gap: 3 },
                              isOled && { backgroundColor: 'rgba(255, 255, 255, 0.15)' },
                            ]}
                          >
                            <Trophy size={10} color={isOled ? '#FFFFFF' : '#FFD60A'} />
                            <Text style={[styles.prBadgeText, isOled && { color: '#FFFFFF' }]}>PR</Text>
                          </View>
                        )}
                      </View>
                      {set.id && (
                        <TouchableOpacity
                          onPress={() => handleDeleteSet(set.id!)}
                          style={styles.deleteIconBtn}
                        >
                          <Trash2 size={16} color={theme.danger} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        )}

        {activeTab === 'WORKOUT' && (
          /* ================= TAB 2: WORKOUT ================= */
          <View>
            {!isWorkoutActive ? (
              /* ================= MODE 1: PRE-WORKOUT TRAINING HUB ================= */
              <View>
                {/* 1. TOP HEADER & QUICK TOOLS BAR */}
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <View>
                    <Text style={{ fontSize: 11, fontWeight: '900', color: theme.primary, letterSpacing: 1.2 }}>
                      TRAINING HUB
                    </Text>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: theme.text, letterSpacing: -0.5 }}>
                      Workouts
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowAiWorkoutModal(true);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 14,
                        backgroundColor: `${theme.primary}20`,
                        borderWidth: 1,
                        borderColor: `${theme.primary}50`,
                      }}
                      activeOpacity={0.75}
                    >
                      <Sparkles size={13} color={theme.primary} />
                      <Text style={{ fontSize: 12, fontWeight: '800', color: theme.primary }}>AI Coach</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        if (!analyzedEquipment) setAnalyzedEquipment(getEquipmentDiagnosticById('leg_press'));
                        setShowEquipmentScannerModal(true);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                        paddingHorizontal: 12,
                        paddingVertical: 7,
                        borderRadius: 14,
                        backgroundColor: theme.cardElevated,
                        borderWidth: 1,
                        borderColor: theme.border,
                      }}
                      activeOpacity={0.75}
                    >
                      <Camera size={13} color={theme.text} />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: theme.text }}>Scan</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* 2. SEGMENTED SWITCHER: [ ROUTINES ] | [ EXERCISES ] */}
                <View
                  style={[
                    styles.segmentSwitcherContainer,
                    { backgroundColor: theme.cardElevated, borderColor: theme.border },
                  ]}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setWorkoutViewMode('ROUTINES');
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.segmentSwitcherTab,
                      workoutViewMode === 'ROUTINES' && { backgroundColor: theme.primary },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Layers
                      size={14}
                      color={workoutViewMode === 'ROUTINES' ? theme.primaryText : theme.subtext}
                    />
                    <Text
                      style={[
                        styles.segmentSwitcherText,
                        {
                          color: workoutViewMode === 'ROUTINES' ? theme.primaryText : theme.subtext,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      Routines ({allAvailableRoutines.length})
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => {
                      setWorkoutViewMode('EXERCISES');
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.segmentSwitcherTab,
                      workoutViewMode === 'EXERCISES' && { backgroundColor: theme.primary },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Dumbbell
                      size={14}
                      color={workoutViewMode === 'EXERCISES' ? theme.primaryText : theme.subtext}
                    />
                    <Text
                      style={[
                        styles.segmentSwitcherText,
                        {
                          color: workoutViewMode === 'EXERCISES' ? theme.primaryText : theme.subtext,
                          fontWeight: '800',
                        },
                      ]}
                    >
                      Exercises ({exercises.length}+)
                    </Text>
                  </TouchableOpacity>
                </View>

                {workoutViewMode === 'ROUTINES' ? (
                  /* ================= SECTION A: ROUTINES & QUICK START ================= */
                  <View>
                    {/* INSTANT START HERO CARD: START EMPTY WORKOUT */}
                    <TouchableOpacity
                      onPress={() => handleStartWorkout(null, 'Quick Strength Workout')}
                      style={[
                        styles.apmedCard,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.primary,
                          padding: 18,
                          marginBottom: 16,
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: `${theme.primary}25`,
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Play size={20} color={theme.primary} fill={theme.primary} />
                          </View>
                          <View>
                            <Text style={{ fontSize: 17, fontWeight: '900', color: theme.text }}>
                              Start Empty Workout
                            </Text>
                            <Text style={{ fontSize: 12, color: theme.subtext, marginTop: 2 }}>
                              Log any exercise, weights & reps on the fly
                            </Text>
                          </View>
                        </View>
                        <ChevronRight size={22} color={theme.primary} />
                      </View>
                    </TouchableOpacity>

                    {/* ROUTINES LIST */}
                    <View style={{ marginBottom: 20 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View>
                          <Text style={{ fontSize: 13, fontWeight: '900', color: theme.text, letterSpacing: 0.6 }}>
                            TRAINING ROUTINES
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 1 }}>
                            {displayedRoutines.length} routine{displayedRoutines.length !== 1 ? 's' : ''} available
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setShowCustomRoutineModal(true);
                          }}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 5,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 14,
                            backgroundColor: `${theme.primary}20`,
                            borderWidth: 1,
                            borderColor: `${theme.primary}40`,
                          }}
                          activeOpacity={0.8}
                        >
                          <Plus size={13} color={theme.primary} strokeWidth={2.5} />
                          <Text style={{ fontSize: 12, fontWeight: '800', color: theme.primary }}>
                            New Routine
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* ROUTINE FILTER PILLS: ALL | PRESETS | MY CUSTOM */}
                      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.selectionAsync();
                            setRoutineFilterTab('ALL');
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            backgroundColor: routineFilterTab === 'ALL' ? theme.primary : theme.cardElevated,
                            borderWidth: 1,
                            borderColor: routineFilterTab === 'ALL' ? theme.primary : theme.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '800',
                              color: routineFilterTab === 'ALL' ? theme.primaryText : theme.subtext,
                            }}
                          >
                            All ({allAvailableRoutines.length})
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            Haptics.selectionAsync();
                            setRoutineFilterTab('PRESET');
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            backgroundColor: routineFilterTab === 'PRESET' ? theme.primary : theme.cardElevated,
                            borderWidth: 1,
                            borderColor: routineFilterTab === 'PRESET' ? theme.primary : theme.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '800',
                              color: routineFilterTab === 'PRESET' ? theme.primaryText : theme.subtext,
                            }}
                          >
                            Presets ({PRESET_ROUTINES.length})
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            Haptics.selectionAsync();
                            setRoutineFilterTab('CUSTOM');
                          }}
                          style={{
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            borderRadius: 12,
                            backgroundColor: routineFilterTab === 'CUSTOM' ? theme.primary : theme.cardElevated,
                            borderWidth: 1,
                            borderColor: routineFilterTab === 'CUSTOM' ? theme.primary : theme.border,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 11,
                              fontWeight: '800',
                              color: routineFilterTab === 'CUSTOM' ? theme.primaryText : theme.subtext,
                            }}
                          >
                            My Custom ({customRoutines.length})
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {/* ROUTINES LIST OR EMPTY STATE */}
                      {displayedRoutines.length === 0 ? (
                        <View
                          style={[
                            styles.apmedCard,
                            {
                              backgroundColor: theme.card,
                              borderColor: theme.border,
                              alignItems: 'center',
                              paddingVertical: 28,
                              paddingHorizontal: 20,
                              marginBottom: 0,
                            },
                          ]}
                        >
                          <View
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 24,
                              backgroundColor: `${theme.primary}15`,
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: 12,
                            }}
                          >
                            <Sparkles size={24} color={theme.primary} />
                          </View>
                          <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 4 }}>
                            No Custom Routines Yet
                          </Text>
                          <Text
                            style={{
                              fontSize: 12,
                              color: theme.subtext,
                              textAlign: 'center',
                              lineHeight: 18,
                              marginBottom: 16,
                              maxWidth: 280,
                            }}
                          >
                            Build a personalized routine tailored to your weekly split, favorite movements, and target duration.
                          </Text>
                          <TouchableOpacity
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                              setShowCustomRoutineModal(true);
                            }}
                            style={{
                              paddingHorizontal: 18,
                              paddingVertical: 10,
                              borderRadius: 14,
                              backgroundColor: theme.primary,
                              flexDirection: 'row',
                              alignItems: 'center',
                              gap: 6,
                            }}
                          >
                            <Plus size={14} color={theme.primaryText} strokeWidth={2.5} />
                            <Text style={{ fontSize: 13, fontWeight: '900', color: theme.primaryText }}>
                              Create Your First Routine
                            </Text>
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <View style={{ gap: 10 }}>
                          {displayedRoutines.map((routine) => (
                            <TouchableOpacity
                              key={routine.id}
                              onPress={() => handleStartWorkout(routine)}
                              style={[
                                styles.apmedCard,
                                {
                                  backgroundColor: theme.card,
                                  borderColor: theme.border,
                                  padding: 16,
                                  marginBottom: 0,
                                },
                              ]}
                              activeOpacity={0.85}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                                    <Text style={{ fontSize: 15, fontWeight: '900', color: theme.text }}>
                                      {routine.name}
                                    </Text>
                                    <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: `${theme.primary}20` }}>
                                      <Text style={{ fontSize: 10, fontWeight: '800', color: theme.primary }}>
                                        {routine.estimatedMinutes} MIN
                                      </Text>
                                    </View>
                                    {routine.isCustom && (
                                      <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FFD60A25' }}>
                                        <Text style={{ fontSize: 9, fontWeight: '900', color: '#FFD60A', letterSpacing: 0.5 }}>
                                          CUSTOM
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text numberOfLines={1} style={{ fontSize: 12, color: theme.subtext }}>
                                    {routine.tagline}
                                  </Text>
                                  <Text style={{ fontSize: 11, color: theme.tertiary, marginTop: 4, fontWeight: '600' }}>
                                    {routine.exerciseIds.length} Exercises • {routine.difficulty}
                                  </Text>
                                </View>

                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                  {routine.isCustom && (
                                    <TouchableOpacity
                                      onPress={() => handleDeleteCustomRoutine(routine)}
                                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                      style={{
                                        width: 34,
                                        height: 34,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: `${theme.danger}15`,
                                        borderWidth: 1,
                                        borderColor: `${theme.danger}30`,
                                      }}
                                    >
                                      <Trash2 size={15} color={theme.danger} />
                                    </TouchableOpacity>
                                  )}
                                  <View style={{ paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Play size={12} color={theme.primaryText} fill={theme.primaryText} />
                                    <Text style={{ fontSize: 12, fontWeight: '900', color: theme.primaryText }}>START</Text>
                                  </View>
                                </View>
                              </View>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  </View>
                ) : (
                  /* ================= SECTION B: CLEAN EXERCISE DIRECTORY & GUIDES ================= */
                  <View style={{ marginBottom: 20 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                      <View>
                        <Text style={{ fontSize: 13, fontWeight: '900', color: theme.text, letterSpacing: 0.6 }}>
                          EXERCISE DIRECTORY
                        </Text>
                        <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 1 }}>
                          {filteredExercises.length} movement{filteredExercises.length !== 1 ? 's' : ''} found
                        </Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => setShowOnlineModal(true)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                          paddingHorizontal: 10,
                          paddingVertical: 6,
                          borderRadius: 12,
                          backgroundColor: `${theme.primary}15`,
                          borderWidth: 1,
                          borderColor: `${theme.primary}35`,
                        }}
                      >
                        <Globe size={12} color={theme.primary} />
                        <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '800' }}>
                          + Import 800+
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* SEARCH BAR WITH CLEAR BUTTON */}
                    <View style={[styles.searchBarContainer, { backgroundColor: theme.cardElevated, borderColor: theme.border, marginBottom: 10 }]}>
                      <Search size={16} color={theme.subtext} />
                      <TextInput
                        placeholder="Search movement (Bench, Squat, Pull Up)..."
                        placeholderTextColor={theme.subtext}
                        value={searchQuery}
                        onChangeText={(t) => setSearchQuery(sanitizeText(t, 60))}
                        maxLength={60}
                        returnKeyType="search"
                        style={[styles.searchInput, { color: theme.text, fontSize: 13 }]}
                      />
                      {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                          <X size={15} color={theme.subtext} />
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* MUSCLE SPLIT CATEGORY PILLS */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 14 }}>
                      {splitOptions.map((opt) => {
                        const active = selectedSplitFilter === opt.id;
                        return (
                          <TouchableOpacity
                            key={opt.id}
                            onPress={() => handleSelectSplitFilter(opt.id)}
                            style={[
                              styles.splitFilterPill,
                              {
                                backgroundColor: active ? (isOled ? '#FFFFFF' : theme.primary) : theme.cardElevated,
                                borderColor: active ? (isOled ? '#FFFFFF' : theme.primary) : theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.splitFilterPillText,
                                { color: active ? (isOled ? '#000000' : theme.primaryText) : theme.subtext, fontWeight: active ? '800' : '600' },
                              ]}
                            >
                              {opt.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* VERTICAL CLEAN EXERCISE CARDS */}
                    <View style={{ gap: 10 }}>
                      {filteredExercises.map((ex) => {
                        const isExpanded = selectedEx?.id === ex.id;
                        return (
                          <View
                            key={ex.id}
                            style={[
                              styles.apmedCard,
                              {
                                backgroundColor: isExpanded ? theme.cardElevated : theme.card,
                                borderColor: isExpanded ? theme.primary : theme.border,
                                padding: 14,
                                marginBottom: 0,
                              },
                            ]}
                          >
                            {/* EXERCISE ROW HEADER */}
                            <TouchableOpacity
                              onPress={() => {
                                setSelectedEx(isExpanded ? null : ex);
                                setShowVideo(false);
                                Haptics.selectionAsync();
                              }}
                              activeOpacity={0.8}
                              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                            >
                              <View style={{ flex: 1, paddingRight: 10 }}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                                  <View style={{ paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: `${theme.primary}20` }}>
                                    <Text style={{ fontSize: 9, fontWeight: '800', color: theme.primary }}>
                                      {ex.primary_muscle.toUpperCase()}
                                    </Text>
                                  </View>
                                  <Text style={{ fontSize: 11, color: theme.subtext, fontWeight: '600' }}>
                                    {ex.equipment}
                                  </Text>
                                </View>
                                <Text style={{ fontSize: 15, fontWeight: '900', color: theme.text }}>
                                  {ex.name}
                                </Text>
                              </View>

                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <TouchableOpacity
                                  onPress={() => {
                                    Haptics.selectionAsync();
                                    handleStartWorkout(undefined, ex.name);
                                  }}
                                  style={{
                                    paddingHorizontal: 12,
                                    paddingVertical: 7,
                                    borderRadius: 10,
                                    backgroundColor: theme.primary,
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    gap: 5,
                                  }}
                                  activeOpacity={0.8}
                                >
                                  <Play size={11} color={theme.primaryText} fill={theme.primaryText} />
                                  <Text style={{ fontSize: 11, fontWeight: '900', color: theme.primaryText }}>START</Text>
                                </TouchableOpacity>

                                <ChevronDown
                                  size={16}
                                  color={theme.subtext}
                                  style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                                />
                              </View>
                            </TouchableOpacity>

                            {/* INLINE EXPANSION: FORM GUIDE, INSTRUCTIONS & VIDEO */}
                            {isExpanded && (
                              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: theme.border }}>
                                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginBottom: 8 }}>
                                  <Sparkles size={13} color={theme.primary} style={{ marginTop: 2 }} />
                                  <Text style={[styles.instructionsText, { color: theme.subtext, flex: 1 }]}>
                                    {ex.instructions}
                                  </Text>
                                </View>

                                {/* VIDEO IFRAME TOGGLE */}
                                <TouchableOpacity
                                  onPress={() => {
                                    Haptics.selectionAsync();
                                    setShowVideo(!showVideo);
                                  }}
                                  style={[
                                    styles.ytFormGuideBtn,
                                    { backgroundColor: showVideo ? `${theme.primary}20` : theme.card, marginTop: 4, marginBottom: 8 },
                                  ]}
                                >
                                  <Play size={13} color={theme.primary} fill={theme.primary} />
                                  <Text style={[styles.ytFormGuideText, { color: theme.primary }]}>
                                    {showVideo ? 'Hide Video' : 'Watch Form Video Tutorial'}
                                  </Text>
                                </TouchableOpacity>

                                {showVideo && (
                                  <View style={styles.ytContainer}>
                                    <YouTubeEmbedPlayer
                                      videoId={ex.youtube_video_id}
                                      height={200}
                                      theme={theme}
                                      title={ex.name}
                                    />
                                  </View>
                                )}

                                {/* BENCHMARK & PR TARGET BANNER */}
                                <View style={[styles.benchmarkRow, { backgroundColor: theme.card, borderColor: theme.border, marginTop: 4 }]}>
                                  <View style={{ flex: 1, paddingRight: 6 }}>
                                    <Text style={[styles.benchmarkText, { color: theme.subtext }]} numberOfLines={1}>
                                      {exerciseHistory?.bestSet
                                        ? `PR Best: ${exerciseHistory.bestSet.weight_kg}kg × ${exerciseHistory.bestSet.reps} (1RM: ${exerciseHistory.bestSet.est1RM}kg)`
                                        : 'No PR logged yet • First set sets your personal record!'}
                                    </Text>
                                    {exerciseHistory?.lastSet && (
                                      <Text style={{ fontSize: 10, color: theme.primary, fontWeight: '700', marginTop: 1 }}>
                                        Last session: {exerciseHistory.lastSet.weight_kg}kg × {exerciseHistory.lastSet.reps} reps
                                      </Text>
                                    )}
                                  </View>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            ) : (
              /* ================= MODE 2: ACTIVE WORKOUT SESSION (FOCUSED HUD & LOGGER) ================= */
              <View>
                {/* 1. LIVE WORKOUT HUD */}
                <View style={[styles.liveWorkoutHudCard, { backgroundColor: theme.cardElevated, borderColor: theme.primary }]}>
                  {/* HUD STATUS HEADER */}
                  <View style={styles.hudStatusRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.pulsingGreenDot, { backgroundColor: isStopwatchPaused ? (isOled ? '#FFFFFF' : '#FFD60A') : theme.primary }]} />
                      <Text style={[styles.hudStatusText, { color: isStopwatchPaused ? (isOled ? '#FFFFFF' : '#FFD60A') : theme.primary }]}>
                        {isStopwatchPaused ? 'SESSION PAUSED' : 'RECORDING WORKOUT'}
                      </Text>
                    </View>

                    <TouchableOpacity onPress={handleDiscardWorkout}>
                      <Text style={[styles.hudDiscardText, { color: theme.subtext }]}>Discard</Text>
                    </TouchableOpacity>
                  </View>

                  {/* BIG DIGITAL STOPWATCH */}
                  <View style={styles.bigStopwatchRow}>
                    <Text
                      style={[styles.bigStopwatchDigits, { color: theme.text }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {formatTimer(sessionSeconds)}
                    </Text>
                  </View>

                  {/* ROUTINE NAME */}
                  <Text style={[styles.hudRoutineName, { color: theme.primary }]} numberOfLines={1}>
                    {activeWorkoutName}
                  </Text>

                  {/* ROUTINE EXERCISE NAVIGATION ROW (WHEN ACTIVE) */}
                  {selectedRoutine && currentRoutineExIndex >= 0 ? (
                    <View style={[styles.routineNavRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <TouchableOpacity
                        onPress={handlePrevRoutineExercise}
                        disabled={!hasPrevRoutineEx}
                        style={[styles.routineNavBtn, { opacity: hasPrevRoutineEx ? 1 : 0.35 }]}
                        activeOpacity={0.7}
                      >
                        <ChevronLeft size={14} color={theme.text} />
                        <Text style={[styles.routineNavBtnText, { color: theme.text }]}>Prev</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowExercisePickerModal(true);
                        }}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.routineNavProgressText, { color: theme.subtext }]}>
                          Exercise <Text style={{ color: theme.primary, fontWeight: '900' }}>{currentRoutineExIndex + 1}</Text> of {selectedRoutine.exerciseIds.length}
                        </Text>
                        <ChevronDown size={13} color={theme.primary} />
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={handleNextRoutineExercise}
                        disabled={!hasNextRoutineEx}
                        style={[styles.routineNavBtn, { opacity: hasNextRoutineEx ? 1 : 0.35 }]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.routineNavBtnText, { color: theme.primary }]}>Next</Text>
                        <ChevronRight size={14} color={theme.primary} />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', marginTop: 4, marginBottom: 8 }}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.selectionAsync();
                          setShowExercisePickerModal(true);
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 12,
                          backgroundColor: `${theme.primary}15`,
                          borderWidth: 1,
                          borderColor: `${theme.primary}35`,
                        }}
                        activeOpacity={0.75}
                      >
                        <Repeat size={12} color={theme.primary} />
                        <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>
                          {selectedEx ? `Switch Movement (${selectedEx.name})` : 'Choose Movement to Log'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  {/* LIVE STATS 4-GRID */}
                  <View style={[styles.hudStatsGrid, { borderColor: theme.border }]}>
                    <View style={styles.hudStatBox}>
                      <Text style={[styles.hudStatLabel, { color: theme.subtext }]} numberOfLines={1}>ACTIVE KCAL</Text>
                      <Text style={[styles.hudStatVal, { color: theme.accentRed }]} numberOfLines={1}>
                        {activeWorkoutCalories}
                      </Text>
                    </View>
                    <View style={styles.hudStatBox}>
                      <Text style={[styles.hudStatLabel, { color: theme.subtext }]} numberOfLines={1}>VOLUME</Text>
                      <Text style={[styles.hudStatVal, { color: theme.accentCyan }]} numberOfLines={1}>
                        {sessionVolumeKg.toLocaleString()} <Text style={{ fontSize: 10 }}>KG</Text>
                      </Text>
                    </View>
                    <View style={styles.hudStatBox}>
                      <Text style={[styles.hudStatLabel, { color: theme.subtext }]} numberOfLines={1}>SETS</Text>
                      <Text style={[styles.hudStatVal, { color: theme.primary }]} numberOfLines={1}>
                        {sessionSetsCount}
                      </Text>
                    </View>
                    <View style={styles.hudStatBox}>
                      <Text style={[styles.hudStatLabel, { color: theme.subtext }]} numberOfLines={1}>PRs HIT</Text>
                      <Text style={[styles.hudStatVal, { color: isOled ? '#FFFFFF' : '#FFD60A' }]} numberOfLines={1}>
                        {sessionPrsCount}
                      </Text>
                    </View>
                  </View>

                  {/* STOPWATCH ACTION CONTROLS */}
                  <View style={styles.hudActionsRow}>
                    <TouchableOpacity
                      onPress={handleTogglePause}
                      style={[
                        styles.hudActionBtn,
                        {
                          backgroundColor: theme.card,
                          borderColor: isStopwatchPaused ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      {isStopwatchPaused ? (
                        <Play size={18} color={theme.primary} fill={theme.primary} />
                      ) : (
                        <Pause size={18} color={theme.text} />
                      )}
                      <Text style={[styles.hudActionBtnText, { color: isStopwatchPaused ? theme.primary : theme.text }]}>
                        {isStopwatchPaused ? 'Resume' : 'Pause'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handlePromptEndWorkout}
                      style={[styles.hudEndWorkoutBtn, { backgroundColor: theme.accentRed }]}
                    >
                      <Flag size={18} color="#FFFFFF" fill="#FFFFFF" />
                      <Text style={styles.hudEndWorkoutBtnText}>End Workout</Text>
                    </TouchableOpacity>
                  </View>
                </View>

            {/* EMPTY MOVEMENT SELECTION CARD IF NONE SELECTED */}
            {!selectedEx && (isWorkoutActive || showQuickLogger) && (
              <View
                style={[
                  styles.apmedCard,
                  {
                    backgroundColor: theme.cardElevated,
                    borderColor: theme.border,
                    alignItems: 'center',
                    paddingVertical: 30,
                    paddingHorizontal: 20,
                  },
                ]}
              >
                <View
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: `${theme.primary}18`,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Dumbbell size={24} color={theme.primary} />
                </View>
                <Text style={{ fontSize: 16, fontWeight: '800', color: theme.text, marginBottom: 4 }}>
                  No Movement Selected
                </Text>
                <Text
                  style={{
                    fontSize: 12,
                    color: theme.subtext,
                    textAlign: 'center',
                    lineHeight: 18,
                    marginBottom: 16,
                    maxWidth: 280,
                  }}
                >
                  Select an exercise from your routine or library to log weights, reps, and start tracking.
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setShowExercisePickerModal(true);
                  }}
                  style={{
                    paddingHorizontal: 18,
                    paddingVertical: 10,
                    borderRadius: 14,
                    backgroundColor: theme.primary,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                  }}
                  activeOpacity={0.8}
                >
                  <Dumbbell size={14} color={theme.primaryText} />
                  <Text style={{ fontSize: 13, fontWeight: '900', color: theme.primaryText }}>
                    Choose Movement to Log
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ACTIVE APMED FOCUSED WORKOUT SET LOGGER */}
            {selectedEx && (isWorkoutActive || showQuickLogger) && (
              <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                {/* SET INDICATOR & UTILITY TOOLBAR */}
                <View style={styles.setCounterRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[styles.setCounterLabel, { color: theme.subtext }]} numberOfLines={1}>
                      SET {isWorkoutActive ? sessionSetsCount + 1 : currentSetNumber} • {selectedEx.primary_muscle.toUpperCase()}
                    </Text>
                    <Text
                      style={[styles.activeExerciseTitle, { color: theme.text }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {selectedEx.name}
                    </Text>
                  </View>

                  {/* 4-TOOL ICON PILLS (APMED PATTERN) */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowExercisePickerModal(true);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 4,
                        paddingHorizontal: 8,
                        paddingVertical: 5,
                        borderRadius: 8,
                        backgroundColor: `${theme.primary}18`,
                        borderWidth: 1,
                        borderColor: `${theme.primary}40`,
                      }}
                      activeOpacity={0.75}
                    >
                      <Repeat size={12} color={theme.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '800', color: theme.primary }}>Switch</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        setShowVideo(!showVideo);
                      }}
                      style={[
                        styles.ytFormGuideBtn,
                        {
                          backgroundColor: showVideo ? `${theme.primary}20` : theme.cardElevated,
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                        },
                      ]}
                    >
                      <Play size={12} color={theme.primary} fill={theme.primary} />
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
                        {showVideo ? 'Hide' : 'Video'}
                      </Text>
                    </TouchableOpacity>

                    {showQuickLogger && !isWorkoutActive && (
                      <TouchableOpacity
                        onPress={() => setShowQuickLogger(false)}
                        style={{
                          paddingHorizontal: 8,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: theme.cardElevated,
                          borderWidth: 1,
                          borderColor: theme.border,
                        }}
                      >
                        <Text style={{ fontSize: 11, fontWeight: '700', color: theme.subtext }}>Close</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* FORM INSTRUCTIONS */}
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginVertical: 4 }}>
                  <Sparkles size={13} color={theme.primary} style={{ marginTop: 2 }} />
                  <Text style={[styles.instructionsText, { color: theme.subtext, flex: 1 }]} numberOfLines={2}>
                    {selectedEx.instructions}
                  </Text>
                </View>

                {/* VIDEO IFRAME */}
                {showVideo && (
                  <View style={styles.ytContainer}>
                    <YouTubeEmbedPlayer
                      videoId={selectedEx.youtube_video_id}
                      height={200}
                      theme={theme}
                      title={selectedEx.name}
                    />
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.selectionAsync();
                        const vId = selectedEx.youtube_video_id;
                        Linking.openURL(`https://www.youtube.com/watch?v=${vId}`);
                      }}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        paddingVertical: 7,
                        backgroundColor: isOled ? 'rgba(255, 255, 255, 0.08)' : '#FF000018',
                        borderRadius: 8,
                        marginTop: 4,
                        borderWidth: 1,
                        borderColor: isOled ? 'rgba(255, 255, 255, 0.2)' : '#FF000035',
                      }}
                      activeOpacity={0.8}
                    >
                      <Play size={11} color={isOled ? '#FFFFFF' : '#FF0000'} fill={isOled ? '#FFFFFF' : '#FF0000'} />
                      <Text style={{ color: theme.text, fontSize: 11, fontWeight: '700' }}>
                        Watch on YouTube App (Full Screen)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* BENCHMARK & PR TARGET BANNER */}
                <View style={[styles.benchmarkRow, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flex: 1, paddingRight: 6 }}>
                    <Text style={[styles.benchmarkText, { color: theme.subtext }]} numberOfLines={1}>
                      {exerciseHistory?.bestSet
                        ? `PR Best: ${exerciseHistory.bestSet.weight_kg}kg × ${exerciseHistory.bestSet.reps} (1RM: ${exerciseHistory.bestSet.est1RM}kg)`
                        : 'No PR history yet • First set will establish your record!'}
                    </Text>
                    {exerciseHistory?.lastSet && (
                      <Text style={{ fontSize: 10, color: theme.primary, fontWeight: '700', marginTop: 1 }}>
                        Last session: {exerciseHistory.lastSet.weight_kg}kg × {exerciseHistory.lastSet.reps} reps (RPE {exerciseHistory.lastSet.rpe || 8})
                      </Text>
                    )}
                  </View>
                  {exerciseHistory?.lastSet && (
                    <TouchableOpacity
                      onPress={handleUseLastSession}
                      style={[styles.useLastBtn, { backgroundColor: `${theme.primary}25` }]}
                    >
                      <Text style={[styles.useLastBtnText, { color: theme.primary }]}>USE LAST</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* SET TYPE TAG SELECTOR */}
                <View style={styles.setTagRow}>
                  {[
                    { id: 'WORKING', label: 'Normal' },
                    { id: 'WARMUP', label: 'Warmup' },
                    { id: 'DROPSET', label: 'Drop Set' },
                    { id: 'FAILURE', label: 'Failure' },
                  ].map((t) => {
                    const active = selectedSetTag === t.id;
                    return (
                      <TouchableOpacity
                        key={t.id}
                        onPress={() => {
                          setSelectedSetTag(t.id as any);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.setTagPill,
                          {
                            backgroundColor: active ? (isOled ? '#FFFFFF' : theme.primary) : theme.cardElevated,
                            borderColor: active ? (isOled ? '#FFFFFF' : theme.primary) : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.setTagPillText,
                            { color: active ? (isOled ? '#000000' : theme.primaryText) : theme.subtext },
                          ]}
                        >
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* APMED PRECISION DIGITAL STEPPERS */}
                <View style={styles.steppersContainer}>
                  {/* WEIGHT STEPPER */}
                  <View style={[styles.stepperBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.stepperHeader, { color: theme.subtext }]} numberOfLines={1}>LOAD WEIGHT</Text>
                    <View style={styles.stepperValueRow}>
                      <TouchableOpacity
                        onPress={() => adjustWeight(-2.5)}
                        style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Minus size={16} color={theme.text} />
                      </TouchableOpacity>

                      <View style={styles.stepperDisplay}>
                        <TextInput
                          value={String(weightKg)}
                          onChangeText={(v) => {
                            const clean = sanitizeWeightInput(v);
                            setWeightKg(Math.min(500, parseFloat(clean) || 0));
                          }}
                          keyboardType="numeric"
                          maxLength={6}
                          style={[styles.stepperInput, { color: theme.text }]}
                        />
                        <Text style={[styles.stepperUnit, { color: theme.subtext }]}>KG</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => adjustWeight(2.5)}
                        style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Plus size={16} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* REPS STEPPER */}
                  <View style={[styles.stepperBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.stepperHeader, { color: theme.subtext }]} numberOfLines={1}>TARGET REPS</Text>
                    <View style={styles.stepperValueRow}>
                      <TouchableOpacity
                        onPress={() => adjustReps(-1)}
                        style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Minus size={16} color={theme.text} />
                      </TouchableOpacity>

                      <View style={styles.stepperDisplay}>
                        <TextInput
                          value={String(repsCount)}
                          onChangeText={(v) => {
                            const clean = sanitizeInteger(v, 3);
                            setRepsCount(Math.min(200, parseInt(clean, 10) || 0));
                          }}
                          keyboardType="numeric"
                          maxLength={3}
                          style={[styles.stepperInput, { color: theme.text }]}
                        />
                        <Text style={[styles.stepperUnit, { color: theme.subtext }]}>REPS</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => adjustReps(1)}
                        style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Plus size={16} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* QUICK WEIGHT BUMP BUTTONS */}
                <View style={styles.quickBumpRow}>
                  {[-10, -5, -2.5, 2.5, 5, 10, 20].map((delta) => (
                    <TouchableOpacity
                      key={delta}
                      onPress={() => adjustWeight(delta)}
                      style={[styles.quickBumpPill, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                    >
                      <Text style={[styles.quickBumpPillText, { color: delta > 0 ? (isOled ? '#FFFFFF' : theme.primary) : theme.subtext }]}>
                        {delta > 0 ? `+${delta}` : delta}kg
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* LIVE METRIC PREVIEW (EST 1RM & SET VOLUME) */}
                <View style={[styles.liveStatsPreviewPill, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Zap size={13} color={isOled ? '#FFFFFF' : theme.primary} />
                    <Text style={[styles.liveStatsPreviewText, { color: theme.text }]}>
                      Est. 1RM: <Text style={{ color: isOled ? '#FFFFFF' : theme.primary, fontWeight: '900' }}>{liveEst1RM} kg</Text>
                    </Text>
                  </View>
                  <View style={{ width: 1, height: 14, backgroundColor: theme.border }} />
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Flame size={13} color={theme.accentOrange} />
                    <Text style={[styles.liveStatsPreviewText, { color: theme.text }]}>
                      Set Volume: <Text style={{ color: theme.accentOrange, fontWeight: '900' }}>{liveSetVolume} kg</Text>
                    </Text>
                  </View>
                </View>

                {/* RPE SELECTOR */}
                <View style={{ marginTop: 12 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.stepperHeader, { color: theme.subtext, marginBottom: 0 }]}>
                      SET INTENSITY (RPE)
                    </Text>
                    <Text style={{ fontSize: 10, color: theme.primary, fontWeight: '800' }}>
                      RPE {selectedRpe}
                    </Text>
                  </View>
                  <View style={styles.rpeRow}>
                    {[6, 7, 8, 9, 10].map((rpe) => {
                      const isRpe = selectedRpe === rpe;
                      return (
                        <TouchableOpacity
                          key={rpe}
                          onPress={() => {
                            setSelectedRpe(rpe);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.rpeBtn,
                            {
                              backgroundColor: isRpe ? (isOled ? '#FFFFFF' : theme.primary) : theme.cardElevated,
                              borderColor: isRpe ? (isOled ? '#FFFFFF' : theme.primary) : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.rpeBtnText,
                              { color: isRpe ? (isOled ? '#000000' : theme.primaryText) : theme.subtext },
                            ]}
                          >
                            {rpe}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={[styles.rpeExplainText, { color: theme.subtext }]}>
                    {getRpeDescription(selectedRpe)}
                  </Text>
                </View>

                {/* PRIMARY COMPLETE SET ACTION BUTTON (IMMEDIATELY ACCESSIBLE) */}
                <TouchableOpacity
                  onPress={handleCompleteSet}
                  style={[styles.apmedPrimaryBtn, { backgroundColor: theme.primary, marginTop: 14 }]}
                  activeOpacity={0.85}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <CheckCircle2 size={18} color={theme.primaryText} />
                    <Text
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                      style={[styles.apmedPrimaryBtnText, { color: theme.primaryText }]}>
                      Log Set & Start Rest Timer
                    </Text>
                  </View>
                </TouchableOpacity>

                {/* COLLAPSIBLE ATHLETE UTILITIES */}
                {/* 1. WARMUP CALCULATOR TOGGLE */}
                <TouchableOpacity
                  onPress={() => {
                    setShowWarmupCalc(!showWarmupCalc);
                    Haptics.selectionAsync();
                  }}
                  style={[styles.toolAccordionToggle, { borderColor: theme.border }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TrendingUp size={14} color={theme.primary} />
                    <Text style={[styles.toolAccordionToggleText, { color: theme.text }]}>
                      3-Step Progressive Warmup Plan
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '800' }}>
                    {showWarmupCalc ? 'Hide ▲' : 'Open ▼'}
                  </Text>
                </TouchableOpacity>

                {showWarmupCalc && (
                  <View style={[styles.warmupPlanCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={styles.warmupPlanHeader}>
                      <Text style={[styles.warmupPlanTitle, { color: theme.subtext }]}>
                        WARMUP PYRAMID FOR {weightKg}KG WORKING SET
                      </Text>
                    </View>
                    {warmupPlanSets.map((wp, i) => (
                      <View key={i} style={[styles.warmupRow, { borderBottomColor: theme.border }]}>
                        <View style={styles.warmupRowLeft}>
                          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: `${theme.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                            <Text style={{ fontSize: 10, fontWeight: '900', color: theme.primary }}>{wp.step}</Text>
                          </View>
                          <View>
                            <Text style={[styles.warmupRowWeight, { color: theme.text }]}>
                              {wp.weight} kg × {wp.reps} reps
                            </Text>
                            <Text style={[styles.warmupRowSub, { color: theme.subtext }]}>
                              {wp.pct} • {wp.note}
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleApplyWarmupSet(wp.weight, wp.reps)}
                          style={[styles.warmupApplyBadge, { backgroundColor: theme.primary }]}
                        >
                          <Text style={[styles.warmupApplyBadgeText, { color: theme.primaryText }]}>Set Load</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* 2. OLYMPIC PLATE RACK TOGGLE */}
                <TouchableOpacity
                  onPress={() => {
                    setShowPlateRack(!showPlateRack);
                    Haptics.selectionAsync();
                  }}
                  style={[styles.toolAccordionToggle, { borderColor: theme.border }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Scale size={14} color={theme.primary} />
                    <Text style={[styles.toolAccordionToggleText, { color: theme.text }]}>
                      Olympic Barbell Plate Rack ({barWeightKg}kg Bar)
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '800' }}>
                    {showPlateRack ? 'Hide ▲' : 'Open ▼'}
                  </Text>
                </TouchableOpacity>

                {showPlateRack && (
                  <View style={{ marginTop: 8 }}>
                    <OlympicPlateRack
                      totalWeightKg={weightKg}
                      barWeightKg={barWeightKg}
                      onBarWeightChange={handleBarWeightChange}
                    />
                  </View>
                )}

                {/* 3. ADVANCED MOBILE SENSORS LAB & FORM ANALYZER */}
                <TouchableOpacity
                  onPress={() => {
                    setShowVbtSensor(!showVbtSensor);
                    Haptics.selectionAsync();
                  }}
                  style={[styles.toolAccordionToggle, { borderColor: theme.border }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Activity size={14} color={theme.primary} />
                    <Text style={[styles.toolAccordionToggleText, { color: theme.text }]}>
                      Live Motion Sensors & Form Balance
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={[styles.liveDot, { backgroundColor: isTrackingSet ? theme.danger : theme.primary }]} />
                    <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '800' }}>
                      {showVbtSensor ? 'Hide ▲' : 'Open ▼'}
                    </Text>
                  </View>
                </TouchableOpacity>

                {showVbtSensor && (
                  <View style={[styles.imuSensorCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    {/* SENSORS ACTIVE HEADER */}
                    <View style={styles.sensorStatusRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Zap size={14} color={theme.primary} />
                        <Text style={[styles.sensorHeaderTitle, { color: theme.text }]}>
                          ACCELEROMETER • GYROSCOPE • PEDOMETER
                        </Text>
                      </View>
                      <View style={[styles.sensorActivePill, { backgroundColor: `${theme.primary}20` }]}>
                        <Text style={[styles.sensorActivePillText, { color: theme.primary }]}>
                          {isTrackingSet ? 'TRACKING SET' : 'STANDBY'}
                        </Text>
                      </View>
                    </View>

                    {/* DUAL SENSOR GRIDS */}
                    <View style={styles.sensorMetricsGrid}>
                      <View style={[styles.sensorMetricBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <Text style={[styles.sensorMetricLabel, { color: theme.subtext }]}>BAR CONCENTRIC SPEED</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 3 }}>
                          <Text style={[styles.sensorMetricVal, { color: theme.primary }]}>
                            {peakVelocity.toFixed(2)}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.subtext, fontWeight: '700' }}>m/s peak</Text>
                        </View>
                        <Text style={[styles.vbtZoneLabel, { color: vbtZoneColor }]} numberOfLines={1}>
                          {vbtZone}
                        </Text>
                      </View>

                      <View style={[styles.sensorMetricBox, { backgroundColor: theme.card, borderColor: isBarLopsided ? theme.danger : theme.border }]}>
                        <Text style={[styles.sensorMetricLabel, { color: theme.subtext }]}>BARBELL TILT (GYRO)</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginVertical: 3 }}>
                          <Text style={[styles.sensorMetricVal, { color: isBarLopsided ? theme.danger : theme.text }]}>
                            {barTiltAngle > 0 ? `+${barTiltAngle}°` : `${barTiltAngle}°`}
                          </Text>
                          <Text style={{ fontSize: 11, color: theme.subtext, fontWeight: '700' }}>angle</Text>
                        </View>
                        <Text style={[styles.balanceStatusLabel, { color: isBarLopsided ? theme.danger : theme.primary }]} numberOfLines={1}>
                          {isBarLopsided ? 'TILT WARNING' : balanceStatus}
                        </Text>
                      </View>
                    </View>

                    {/* 3. AUTO REP COUNTER & SESSION STEPS */}
                    <View style={styles.sensorSecondaryRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Flame size={13} color={theme.accentOrange} />
                        <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>
                          Motion Reps: <Text style={{ color: theme.primary, fontWeight: '900' }}>{detectedReps}</Text>
                        </Text>
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Compass size={13} color={theme.accentCyan} />
                        <Text style={{ fontSize: 11, color: theme.text, fontWeight: '700' }}>
                          Gym Steps: <Text style={{ color: theme.accentCyan, fontWeight: '900' }}>{sessionSteps}</Text>
                        </Text>
                      </View>
                    </View>

                    {/* SENSOR TRACKING CONTROL BUTTON */}
                    <TouchableOpacity
                      onPress={isTrackingSet ? stopVelocityTracking : startVelocityTracking}
                      activeOpacity={0.85}
                      style={[
                        styles.sensorControlButton,
                        { backgroundColor: isTrackingSet ? theme.danger : theme.primary },
                      ]}
                    >
                      {isTrackingSet ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Pause size={16} color="#FFFFFF" fill="#FFFFFF" />
                          <Text style={[styles.sensorControlButtonText, { color: '#FFFFFF' }]}>
                            STOP SET TRACKING
                          </Text>
                        </View>
                      ) : (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                          <Play size={16} color={theme.primaryText} fill={theme.primaryText} />
                          <Text style={[styles.sensorControlButtonText, { color: theme.primaryText }]}>
                            START SENSOR TRACKING (VBT & REPS)
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                )}

                {/* TODAY'S SETS FOR THIS EXERCISE */}
                {exerciseHistory && exerciseHistory.todaySets.length > 0 && (
                  <View style={[styles.todayExSetsContainer, { borderColor: theme.border }]}>
                    <View style={styles.todayExSetsHeader}>
                      <Text style={[styles.todayExSetsTitle, { color: theme.text }]}>
                        SETS LOGGED TODAY ({exerciseHistory.todaySets.length})
                      </Text>
                      <Text style={{ fontSize: 10, color: theme.subtext }}>
                        Total: {exerciseHistory.todaySets.reduce((a, s) => a + s.weight_kg * s.reps, 0).toLocaleString()} kg
                      </Text>
                    </View>
                    {exerciseHistory.todaySets.map((ts, idx) => (
                      <View key={ts.id || idx} style={[styles.todayExSetItem, { borderBottomColor: theme.border }]}>
                        <View style={styles.todayExSetItemLeft}>
                          <View style={[styles.todayExSetNumBadge, { backgroundColor: `${theme.primary}20` }]}>
                            <Text style={[styles.todayExSetNumText, { color: theme.primary }]}>{idx + 1}</Text>
                          </View>
                          <View>
                            <Text style={[styles.todayExSetWeight, { color: theme.text }]}>
                              {ts.weight_kg} kg × {ts.reps} reps
                            </Text>
                            <Text style={[styles.todayExSetMeta, { color: theme.subtext }]}>
                              RPE {ts.rpe || 8} • {ts.velocity_ms} m/s {ts.is_pr === 1 ? '• PR' : ''}
                            </Text>
                          </View>
                        </View>
                        {ts.id && (
                          <TouchableOpacity
                            onPress={() => handleDeleteSet(ts.id!)}
                            style={{ padding: 6 }}
                          >
                            <Trash2 size={15} color={theme.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* NEXT EXERCISE / SWITCH MOVEMENT ACTION BUTTON */}
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (hasNextRoutineEx && nextRoutineEx) {
                      handleNextRoutineExercise();
                    } else {
                      setShowExercisePickerModal(true);
                    }
                  }}
                  style={{
                    marginTop: 14,
                    paddingVertical: 12,
                    borderRadius: 14,
                    backgroundColor: theme.cardElevated,
                    borderWidth: 1,
                    borderColor: theme.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                  activeOpacity={0.8}
                >
                  <Dumbbell size={15} color={theme.primary} />
                  <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>
                    {hasNextRoutineEx && nextRoutineEx
                      ? `Next: ${nextRoutineEx.name}`
                      : 'Switch to Another Movement'}
                  </Text>
                  <ChevronRight size={15} color={theme.primary} />
                </TouchableOpacity>
              </View>
            )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'RECOVERY' && (
          /* ================= TAB 3: RECOVERY ================= */
          <View>
            {/* 1. RECOVERY TOOLKIT 4-CAPSULE QUICK BAR */}
            <View style={styles.recoveryQuickBar}>
              <TouchableOpacity
                onPress={() => {
                  setShowCnsModal(true);
                  Haptics.selectionAsync();
                }}
                style={[styles.recoveryQuickCapsule, { backgroundColor: theme.cardElevated, borderColor: `${theme.primary}50` }]}
                activeOpacity={0.75}
              >
                <Zap size={14} color={theme.primary} />
                <Text style={[styles.recoveryQuickCapsuleText, { color: theme.primary }]}>
                  CNS Tap-Test
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowBreathworkModal(true);
                  Haptics.selectionAsync();
                }}
                style={[styles.recoveryQuickCapsule, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <Wind size={14} color="#00F0FF" />
                <Text style={[styles.recoveryQuickCapsuleText, { color: theme.text }]}>
                  4-7-8 Breath
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowPpgModal(true);
                  Haptics.selectionAsync();
                }}
                style={[styles.recoveryQuickCapsule, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <Heart size={14} color="#FF2D55" />
                <Text style={[styles.recoveryQuickCapsuleText, { color: theme.text }]}>
                  Camera PPG
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowEnvModal(true);
                  Haptics.selectionAsync();
                }}
                style={[styles.recoveryQuickCapsule, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <Thermometer size={14} color="#f59e0b" />
                <Text style={[styles.recoveryQuickCapsuleText, { color: theme.text }]}>
                  Climate
                </Text>
              </TouchableOpacity>
            </View>

            {/* 2. DYNAMIC BIO-READINESS HERO CARD (WITH EFFECTIVE READINESS SCORE) */}
            <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>SYSTEMIC BIO-READINESS</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Athlete Regeneration</Text>
                </View>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 14,
                    backgroundColor:
                      effectiveReadiness >= 75
                        ? '#30D15822'
                        : effectiveReadiness >= 50
                        ? '#FFD60A22'
                        : '#FF453A22',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: '900',
                      color:
                        effectiveReadiness >= 75
                          ? '#30D158'
                          : effectiveReadiness >= 50
                          ? '#FFD60A'
                          : '#FF453A',
                    }}
                  >
                    {effectiveReadiness}% READY
                  </Text>
                </View>
              </View>

              <Text style={{ fontSize: 13, color: theme.subtext, lineHeight: 18, marginBottom: 14 }}>
                {effectiveReadiness >= 75
                  ? 'Prime neuromuscular tone. High mechanical tension compound lifts and personal bests are authorized.'
                  : effectiveReadiness >= 50
                  ? 'Moderate systemic load. Antagonist muscle training, hypertrophy accessory work, or light mobility advised.'
                  : 'Elevated systemic overload detected across prime movers. Prioritize sleep, electrolytes, and parasympathetic reset.'}
              </Text>

              {/* INTERACTIVE SLEEP & SORENESS LOGGERS IN HERO CARD */}
              <View style={[styles.recoveryInteractiveRow, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                {/* 1. Interactive Sleep Tuner */}
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 10, fontWeight: '900', color: theme.subtext, letterSpacing: 0.5 }}>
                      LAST NIGHT SLEEP
                    </Text>
                    <Text style={{ fontSize: 12, fontWeight: '900', color: theme.primary }}>
                      {recoverySleepHours}h
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => handleUpdateSleepHours(-0.5)}
                      style={[styles.sleepStepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <Minus size={13} color={theme.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, alignItems: 'center' }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: theme.text }}>
                        {recoverySleepHours >= 8 ? 'Restorative' : recoverySleepHours >= 6.5 ? 'Moderate' : 'Deficit'}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUpdateSleepHours(0.5)}
                      style={[styles.sleepStepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <Plus size={13} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={{ width: 1, height: 44, backgroundColor: theme.border }} />

                {/* 2. Interactive Muscle Soreness (DOMS) Selector */}
                <View style={{ flex: 1, paddingLeft: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: theme.subtext, letterSpacing: 0.5, marginBottom: 4 }}>
                    MUSCLE SORENESS
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {(['NONE', 'MILD', 'SORE', 'SEVERE'] as const).map((lvl) => {
                      const active = recoverySoreness === lvl;
                      return (
                        <TouchableOpacity
                          key={lvl}
                          onPress={() => handleUpdateSoreness(lvl)}
                          style={[
                            styles.sorenessPill,
                            {
                              backgroundColor: active ? (isOled ? '#FFFFFF' : theme.primary) : theme.card,
                              borderColor: active ? (isOled ? '#FFFFFF' : theme.primary) : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.sorenessPillText,
                              { color: active ? (isOled ? '#000000' : theme.primaryText) : theme.subtext },
                            ]}
                          >
                            {lvl === 'NONE' ? '0' : lvl === 'MILD' ? '1' : lvl === 'SORE' ? '2' : '3'}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 4, textAlign: 'center' }}>
                    {recoverySoreness === 'NONE' ? 'Fresh • No Pain' : recoverySoreness === 'MILD' ? 'Normal Tension' : recoverySoreness === 'SORE' ? 'Moderate DOMS' : 'Heavy Soreness'}
                  </Text>
                </View>
              </View>

              {/* 3. 1-TAP HYDRATION SPEED BAR */}
              <View style={[styles.recoveryHydrationCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Droplets size={15} color="#00F0FF" />
                    <Text style={{ fontSize: 11, fontWeight: '900', color: theme.text, letterSpacing: 0.5 }}>
                      ATHLETE HYDRATION LOG
                    </Text>
                  </View>
                  <Text style={{ fontSize: 12, fontWeight: '900', color: '#00F0FF' }}>
                    {todayWaterMl} / {userProfile.targetWaterMl || 3000} ml
                  </Text>
                </View>

                {/* Quick Add Water Buttons */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {[
                    { label: '+250ml Glass', amount: 250 },
                    { label: '+500ml Shaker', amount: 500 },
                    { label: '+750ml Bottle', amount: 750 },
                  ].map((w) => (
                    <TouchableOpacity
                      key={w.amount}
                      onPress={() => handleAddWater(w.amount)}
                      style={[styles.waterQuickAddBtn, { backgroundColor: theme.card, borderColor: '#00F0FF40' }]}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.waterQuickAddText, { color: '#00F0FF' }]}>{w.label}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    onPress={handleResetWater}
                    style={[styles.waterResetBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <RotateCcw size={13} color={theme.subtext} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* 3. INTERACTIVE MUSCLE HEATMAP */}
            <MuscleHeatmap
              recoveryData={recoveryData}
              onSelectMuscleFilter={(muscle) => {
                setSelectedMuscleFilter(muscle);
                let splitTarget = 'ALL';
                if (muscle === 'CHEST' || muscle === 'SHOULDERS') splitTarget = 'PUSH';
                else if (muscle === 'BACK') splitTarget = 'PULL';
                else if (muscle === 'LEGS') splitTarget = 'LEGS';
                else if (muscle === 'ARMS') splitTarget = 'ARMS';
                else if (muscle === 'CORE') splitTarget = 'CORE';
                setSelectedSplitFilter(splitTarget);

                const match = exercises.find((e) => e.primary_muscle.toUpperCase() === muscle);
                if (match) setSelectedEx(match);
                setActiveTab('WORKOUT');
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            />

            {/* 4. TARGETED GUIDED MOBILITY PROTOCOL (FOR MOST FATIGUED MUSCLE) */}
            {mostFatiguedMuscle && recommendedMobility.length > 0 && (
              <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <View style={styles.cardHeaderRow}>
                  <View>
                    <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>
                      PRIORITY MOBILITY ({mostFatiguedMuscle.name.toUpperCase()})
                    </Text>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Targeted Recovery Drills</Text>
                  </View>
                  <View style={[styles.mobilityBadge, { backgroundColor: `${mostFatiguedMuscle.color}20`, borderColor: mostFatiguedMuscle.color }]}>
                    <Text style={[styles.mobilityBadgeText, { color: mostFatiguedMuscle.color }]}>
                      {mostFatiguedMuscle.recoveryPercent}% Recovered
                    </Text>
                  </View>
                </View>

                <Text style={{ fontSize: 12, color: theme.subtext, lineHeight: 16, marginBottom: 10 }}>
                  Sports science recommends 5-8 minutes of localized tissue mobilization on prime movers with highest recent mechanical tension.
                </Text>

                <View style={{ gap: 8 }}>
                  {recommendedMobility.map((drill, idx) => (
                    <View key={idx} style={[styles.mobilityItemRow, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: `${theme.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 11, fontWeight: '900', color: theme.primary }}>{idx + 1}</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: theme.text }}>{drill.name}</Text>
                        <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '700' }}>
                          {drill.duration} • {drill.target}
                        </Text>
                        <Text style={{ fontSize: 10, color: theme.subtext, marginTop: 1 }}>{drill.benefit}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 5. INTERACTIVE DAILY RECOVERY CHECKLIST */}
            <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>DAILY DISCIPLINE</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Athlete Regeneration Checklist</Text>
                </View>
                <View style={[styles.checklistScoreBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <Text style={[styles.checklistScoreText, { color: theme.primary }]}>
                    {Object.values(recoveryChecklist).filter(Boolean).length} / 5 Done
                  </Text>
                </View>
              </View>

              <View style={{ gap: 8, marginTop: 10 }}>
                {[
                  { key: 'sleep', label: '7.5h+ Deep Restorative Sleep', sub: 'Growth hormone & motor learning' },
                  { key: 'hydration', label: '3,000ml Intra-Day Electrolytes & Water', sub: 'Cellular volume & joint lubrication' },
                  { key: 'mobility', label: '10-Min Post-Workout Tissue Flossing', sub: 'Fascial glide & DOMS reduction' },
                  { key: 'protein', label: 'High-Leucine Protein Meal (35g+)', sub: 'Myofibrillar protein synthesis trigger' },
                  { key: 'coldReset', label: 'Parasympathetic Reset / Cold Splash', sub: 'Vagal tone & sympathetic downregulation' },
                ].map((item) => {
                  const isChecked = recoveryChecklist[item.key];
                  return (
                    <TouchableOpacity
                      key={item.key}
                      onPress={() => handleToggleChecklist(item.key)}
                      style={[
                        styles.checklistItem,
                        {
                          backgroundColor: isChecked ? `${theme.primary}12` : theme.cardElevated,
                          borderColor: isChecked ? theme.primary : theme.border,
                        },
                      ]}
                      activeOpacity={0.8}
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
                        <Text style={[styles.checklistItemTitle, { color: theme.text }]}>{item.label}</Text>
                        <Text style={{ fontSize: 10, color: theme.subtext }}>{item.sub}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* LOCAL SQLITE BACKUP VAULT */}
            <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>DATA OWNERSHIP</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Encrypted SQLite Vault</Text>
                </View>
                <CheckCircle2 size={22} color={theme.primary} />
              </View>

              <Text style={[styles.vaultSubtitle, { color: theme.subtext }]}>
                Your fitness & nutrition logs are stored 100% on this device in SQLite. Export an offline backup (.ampedbackup) anytime or restore.
              </Text>

              <View style={styles.vaultActionsRow}>
                <TouchableOpacity
                  onPress={handleExportBackup}
                  style={[styles.vaultBtn, { backgroundColor: theme.cardElevated, borderColor: theme.primary }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <ArrowUpRight size={14} color={theme.primary} />
                    <Text style={[styles.vaultBtnText, { color: theme.primary }]}>Export Backup</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleImportBackup}
                  style={[styles.vaultBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <RefreshCw size={14} color={theme.text} />
                    <Text style={[styles.vaultBtnText, { color: theme.text }]}>Restore Backup</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'NUTRITION' && (
          /* ================= TAB 4: NUTRITION ================= */
          <View>
            {/* MACRO SUMMARY HERO */}
            <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>ENERGY & MACRONUTRIENTS</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Daily Nutrition</Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    setShowTargetsModal(true);
                    Haptics.selectionAsync();
                  }}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    paddingVertical: 5,
                    paddingHorizontal: 9,
                    borderRadius: 10,
                    backgroundColor: `${theme.primary}20`,
                    borderWidth: 1,
                    borderColor: theme.primary,
                  }}
                  activeOpacity={0.7}
                >
                  <Target size={12} color={theme.primary} />
                  <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '800' }}>Edit Goals</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.macroHeroRow}>
                <TouchableOpacity
                  style={styles.caloriesBox}
                  onPress={() => {
                    setShowTargetsModal(true);
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[styles.caloriesDigits, { color: theme.accentOrange }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                  >
                    {totalCalories}
                  </Text>
                  <Text style={[styles.caloriesLabel, { color: theme.subtext }]} numberOfLines={1}>KCAL INTAKE</Text>
                  <Text style={[styles.caloriesGoal, { color: theme.subtext }]} numberOfLines={1}>
                    Target: {(userProfile.targetCalories || 2400).toLocaleString()} kcal
                  </Text>
                </TouchableOpacity>

                <View style={styles.macrosColumns}>
                  <TouchableOpacity
                    style={styles.macroPillStat}
                    onPress={() => {
                      setShowTargetsModal(true);
                      Haptics.selectionAsync();
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.macroPillLabel, { color: theme.subtext }]} numberOfLines={1}>PROTEIN</Text>
                    <Text
                      style={[styles.macroPillValue, { color: theme.primary }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {totalProtein}g
                    </Text>
                    <Text style={[styles.macroPillSub, { color: theme.tertiary }]} numberOfLines={1}>
                      Goal: {userProfile.targetProtein || 160}g
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.macroPillStat}>
                    <Text style={[styles.macroPillLabel, { color: theme.subtext }]} numberOfLines={1}>CARBS</Text>
                    <Text
                      style={[styles.macroPillValue, { color: isOled ? '#E5E5EA' : '#FFD60A' }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {totalCarbs}g
                    </Text>
                    <Text style={[styles.macroPillSub, { color: theme.tertiary }]} numberOfLines={1}>Energy</Text>
                  </View>
                  <View style={styles.macroPillStat}>
                    <Text style={[styles.macroPillLabel, { color: theme.subtext }]} numberOfLines={1}>FAT</Text>
                    <Text
                      style={[styles.macroPillValue, { color: theme.accentCyan }]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.75}
                    >
                      {totalFat}g
                    </Text>
                    <Text style={[styles.macroPillSub, { color: theme.tertiary }]} numberOfLines={1}>Hormones</Text>
                  </View>
                </View>
              </View>

              {/* MACRO PROGRESS BARS */}
              <View style={styles.macroProgressContainer}>
                {/* CALORIES PROGRESS BAR */}
                <View style={styles.macroProgressBarRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={[styles.macroProgressName, { color: theme.subtext }]}>
                      Daily Calorie Target ({(userProfile.targetCalories || 2400).toLocaleString()} kcal)
                    </Text>
                    <Text style={[styles.macroProgressVal, { color: theme.accentOrange }]}>
                      {Math.round((totalCalories / (userProfile.targetCalories || 2400)) * 100)}%
                    </Text>
                  </View>
                  <View style={[styles.progressBarTrack, { backgroundColor: theme.cardElevated }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.round((totalCalories / (userProfile.targetCalories || 2400)) * 100))}%`,
                          backgroundColor: theme.accentOrange,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* PROTEIN PROGRESS BAR */}
                <View style={styles.macroProgressBarRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={[styles.macroProgressName, { color: theme.subtext }]}>
                      Protein Muscle Goal ({userProfile.targetProtein || 160}g)
                    </Text>
                    <Text style={[styles.macroProgressVal, { color: theme.primary }]}>
                      {Math.round((totalProtein / (userProfile.targetProtein || 160)) * 100)}%
                    </Text>
                  </View>
                  <View style={[styles.progressBarTrack, { backgroundColor: theme.cardElevated }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.round((totalProtein / (userProfile.targetProtein || 160)) * 100))}%`,
                          backgroundColor: theme.primary,
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* CARBS PROGRESS BAR */}
                <View style={styles.macroProgressBarRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={[styles.macroProgressName, { color: theme.subtext }]}>
                      Carbohydrates ({userProfile.targetCarbs || 250}g)
                    </Text>
                    <Text style={[styles.macroProgressVal, { color: isOled ? '#E5E5EA' : '#FFD60A' }]}>
                      {Math.round((totalCarbs / (userProfile.targetCarbs || 250)) * 100)}%
                    </Text>
                  </View>
                  <View style={[styles.progressBarTrack, { backgroundColor: theme.cardElevated }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.round((totalCarbs / (userProfile.targetCarbs || 250)) * 100))}%`,
                          backgroundColor: isOled ? '#E5E5EA' : '#FFD60A',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* FAT PROGRESS BAR */}
                <View style={styles.macroProgressBarRow}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                    <Text style={[styles.macroProgressName, { color: theme.subtext }]}>
                      Healthy Fats ({userProfile.targetFat || 70}g)
                    </Text>
                    <Text style={[styles.macroProgressVal, { color: theme.accentCyan }]}>
                      {Math.round((totalFat / (userProfile.targetFat || 70)) * 100)}%
                    </Text>
                  </View>
                  <View style={[styles.progressBarTrack, { backgroundColor: theme.cardElevated }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${Math.min(100, Math.round((totalFat / (userProfile.targetFat || 70)) * 100))}%`,
                          backgroundColor: theme.accentCyan,
                        },
                      ]}
                    />
                  </View>
                </View>
              </View>

              {/* ADAPTIVE ENERGY BALANCE & TDEE CARD */}
              <View style={[styles.apmedCard, { backgroundColor: theme.cardElevated, borderColor: theme.border, marginTop: 14 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>METABOLIC ENERGY BALANCE</Text>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: theme.text }}>
                      {totalCalories > athleteMetrics.tdee + 100
                        ? `+${totalCalories - athleteMetrics.tdee} kcal Surplus`
                        : totalCalories < athleteMetrics.tdee - 100
                        ? `-${athleteMetrics.tdee - totalCalories} kcal Deficit`
                        : 'Balanced Maintenance'}
                    </Text>
                  </View>
                  <View
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 10,
                      backgroundColor:
                        totalCalories > athleteMetrics.tdee + 100
                          ? `${theme.primary}20`
                          : totalCalories < athleteMetrics.tdee - 100
                          ? 'rgba(255,159,10,0.2)'
                          : `${theme.border}`,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '800',
                        color:
                          totalCalories > athleteMetrics.tdee + 100
                            ? theme.primary
                            : totalCalories < athleteMetrics.tdee - 100
                            ? theme.accentOrange
                            : theme.subtext,
                      }}
                    >
                      {totalCalories > athleteMetrics.tdee + 100
                        ? 'Hypertrophy Surplus'
                        : totalCalories < athleteMetrics.tdee - 100
                        ? 'Fat Burning Deficit'
                        : 'Maintenance'}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 4 }}>
                  Estimated Burn: {athleteMetrics.tdee} kcal TDEE ({userProfile.bodyWeightKg}kg • {userProfile.gender} • {userProfile.weeklyWorkoutDaysTarget}d/wk)
                </Text>
              </View>
            </View>

            {/* 2. NUTRITION QUICK ACTION 4-CAPSULE DOCK */}
            <View style={styles.workoutQuickBar}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  handlePickFoodImage('camera');
                }}
                style={[styles.workoutQuickCapsule, { backgroundColor: theme.cardElevated, borderColor: `${theme.primary}50` }]}
                activeOpacity={0.75}
              >
                <Camera size={14} color={theme.primary} />
                <Text style={[styles.workoutQuickCapsuleText, { color: theme.primary }]}>AI Vision</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowBarcodeModal(true);
                }}
                style={[styles.workoutQuickCapsule, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <Barcode size={14} color={theme.text} />
                <Text style={[styles.workoutQuickCapsuleText, { color: theme.text }]}>Barcode</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  handleAddWater(250);
                }}
                style={[styles.workoutQuickCapsule, { backgroundColor: theme.cardElevated, borderColor: '#00F0FF40' }]}
                activeOpacity={0.75}
              >
                <Droplets size={14} color="#00F0FF" />
                <Text style={[styles.workoutQuickCapsuleText, { color: '#00F0FF' }]}>+250ml Water</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowTargetsModal(true);
                }}
                style={[styles.workoutQuickCapsule, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                activeOpacity={0.75}
              >
                <Target size={14} color={theme.text} />
                <Text style={[styles.workoutQuickCapsuleText, { color: theme.text }]}>Goals</Text>
              </TouchableOpacity>
            </View>

            {/* 3. 1-TAP QUICK GYM STAPLES */}
            <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View>
                  <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>INSTANT LOG</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>1-Tap Gym Staples</Text>
                </View>
                <Text style={{ fontSize: 10, color: theme.primary, fontWeight: '700' }}>TAP TO LOG</Text>
              </View>
              <View style={{ gap: 8 }}>
                {[0, 2, 4, 6].map((startIndex) => (
                  <View key={startIndex} style={{ flexDirection: 'row', gap: 8 }}>
                    {[GYM_STAPLES[startIndex], GYM_STAPLES[startIndex + 1]].map((st) => (
                      <TouchableOpacity
                        key={st.id}
                        onPress={() => handleQuickLogStaple(st)}
                        style={[
                          styles.quickStapleCard,
                          {
                            flex: 1,
                            backgroundColor: theme.cardElevated,
                            borderColor: theme.border,
                            minWidth: 0,
                            paddingVertical: 10,
                            paddingHorizontal: 12,
                          },
                        ]}
                        activeOpacity={0.7}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            backgroundColor: `${theme.primary}18`,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Utensils size={14} color={theme.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text numberOfLines={1} style={[styles.quickStapleName, { color: theme.text }]}>
                            {st.name}
                          </Text>
                          <Text numberOfLines={1} style={[styles.quickStapleMeta, { color: theme.primary }]}>
                            {st.cal} kcal • {st.p}g P
                          </Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                ))}
              </View>
            </View>

            {/* 4. SMART FOOD SEARCH & AI SCAN */}
            <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardEyebrow, { color: theme.subtext }]}>GLOBAL DATABASE</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>Food Search & AI Vision</Text>
                </View>
                <Sparkles size={20} color={theme.primary} />
              </View>

              {/* SEARCH INPUT */}
              <View style={[styles.openFoodSearchBox, { backgroundColor: theme.cardElevated, borderColor: theme.border, marginTop: 10 }]}>
                <Search size={16} color={theme.subtext} />
                <TextInput
                  placeholder="Search 3M+ foods (e.g. Oats, Chicken, Rice)..."
                  placeholderTextColor={theme.subtext}
                  value={foodSearchQuery}
                  onChangeText={(t) => setFoodSearchQuery(sanitizeText(t, 80))}
                  maxLength={80}
                  onSubmitEditing={handleSearchOpenFood}
                  returnKeyType="search"
                  style={[styles.openFoodSearchInput, { color: theme.text }]}
                />
                <TouchableOpacity
                  onPress={handleSearchOpenFood}
                  style={[styles.openFoodSearchBtn, { backgroundColor: theme.primary, flexShrink: 0 }]}
                >
                  {isSearchingFoodDb ? (
                    <ActivityIndicator size="small" color={theme.primaryText} />
                  ) : (
                    <Text style={[styles.openFoodSearchBtnText, { color: theme.primaryText }]}>Search</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* SEARCH RESULTS DROPDOWN */}
              {foodSearchResults.length > 0 && (
                <View style={[styles.foodResultsContainer, { backgroundColor: theme.cardElevated, borderColor: theme.border, marginTop: 8 }]}>
                  <Text style={[styles.resultsHeaderLabel, { color: theme.subtext }]}>
                    Found {foodSearchResults.length} foods in Open Database:
                  </Text>
                  {foodSearchResults.map((food) => {
                    const isSelected = selectedFoodItem?.id === food.id;
                    return (
                      <View
                        key={food.id}
                        style={[
                          styles.foodResultRow,
                          {
                            backgroundColor: isSelected ? theme.card : 'transparent',
                            borderBottomColor: theme.border,
                            flexDirection: 'column',
                            alignItems: 'stretch',
                          },
                        ]}
                      >
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedFoodItem(food);
                            Haptics.selectionAsync();
                          }}
                          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                        >
                          <View style={{ flex: 1, paddingRight: 6 }}>
                            <Text numberOfLines={1} style={[styles.foodResultTitle, { color: theme.text }]}>{food.name}</Text>
                            <Text numberOfLines={1} style={[styles.foodResultMeta, { color: theme.primary }]}>
                              {food.caloriesPer100g} kcal/100g • P: {food.proteinPer100g}g | C: {food.carbsPer100g}g | F: {food.fatPer100g}g
                            </Text>
                          </View>
                          <TouchableOpacity
                            onPress={() => handleLogFoodItem(food, 100)}
                            style={[styles.quickLogFoodBtn, { backgroundColor: theme.primary, flexShrink: 0 }]}
                          >
                            <Text style={[styles.quickLogFoodBtnText, { color: theme.primaryText }]}>+ Log 100g</Text>
                          </TouchableOpacity>
                        </TouchableOpacity>

                        {isSelected && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 6, borderTopWidth: 1, borderTopColor: theme.border }}>
                            <Text style={{ fontSize: 10, color: theme.subtext, fontWeight: '700' }}>Portion:</Text>
                            {[50, 150, 200, 250].map((grams) => (
                              <TouchableOpacity
                                key={grams}
                                onPress={() => handleLogFoodItem(food, grams)}
                                style={{
                                  paddingHorizontal: 8,
                                  paddingVertical: 3,
                                  borderRadius: 6,
                                  backgroundColor: theme.cardElevated,
                                  borderWidth: 1,
                                  borderColor: theme.border,
                                }}
                              >
                                <Text style={{ fontSize: 10, color: theme.text, fontWeight: '700' }}>+{grams}g</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              )}

              {/* PHOTO SCAN & HINT INPUT */}
              <View style={{ marginTop: 14 }}>
                <TextInput
                  placeholder="Optional hint: e.g. 3 Eggs Omelette + Toast"
                  placeholderTextColor={theme.subtext}
                  value={foodHint}
                  onChangeText={(t) => setFoodHint(sanitizeText(t, 120))}
                  maxLength={120}
                  style={[styles.foodHintInput, { backgroundColor: theme.cardElevated, color: theme.text, borderColor: theme.border }]}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                  <TouchableOpacity
                    onPress={() => handlePickFoodImage('camera')}
                    disabled={isScanningFood || isAnalyzingFood}
                    style={[styles.apmedPrimaryBtn, { flex: 1, backgroundColor: theme.primary, marginTop: 0 }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Camera size={16} color={theme.primaryText} />
                      <Text style={[styles.apmedPrimaryBtnText, { color: theme.primaryText }]}>
                        {isAnalyzingFood ? 'ANALYZING...' : 'CAMERA'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => handlePickFoodImage('library')}
                    disabled={isScanningFood || isAnalyzingFood}
                    style={[styles.apmedSecondaryBtn, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border, marginTop: 0 }]}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <ImageIcon size={16} color={theme.text} />
                      <Text style={[styles.apmedSecondaryBtnText, { color: theme.text }]}>
                        GALLERY
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* BARCODE SCANNER ACTION */}
              <TouchableOpacity
                onPress={() => {
                  setShowBarcodeModal(true);
                  Haptics.selectionAsync();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: `${theme.primary}18`,
                  borderWidth: 1,
                  borderColor: `${theme.primary}50`,
                  marginTop: 12,
                }}
                activeOpacity={0.8}
              >
                <Barcode size={16} color={theme.primary} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: theme.primary }}>
                  Scan or Enter Barcode (Open Food Facts)
                </Text>
              </TouchableOpacity>
            </View>

            {/* MEALS LIST */}
            <View style={{ marginTop: 14 }}>
              <Text style={[styles.sectionMainTitle, { color: theme.text }]}>Logged Meals</Text>
              {meals.length === 0 ? (
                <View style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center', marginTop: 10 }]}>
                  <Utensils size={32} color={theme.border} style={{ marginVertical: 8 }} />
                  <Text style={[styles.emptyFeedText, { color: theme.subtext }]}>No meals logged today yet.</Text>
                  <Text style={[styles.emptyFeedSub, { color: theme.tertiary }]}>Snap a photo or search Open Food Facts database.</Text>
                </View>
              ) : (
                meals.map((meal) => {
                  const micros = meal.micros_json ? JSON.parse(meal.micros_json) : {};
                  return (
                    <View
                      key={meal.id}
                      style={[styles.apmedCard, { backgroundColor: theme.card, borderColor: theme.border, marginBottom: 12 }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {meal.local_image_uri && (
                          <Image
                            source={{ uri: meal.local_image_uri }}
                            style={styles.mealThumb}
                          />
                        )}
                        <View style={{ flex: 1, marginLeft: meal.local_image_uri ? 12 : 0 }}>
                          <Text style={[styles.mealTitle, { color: theme.text }]}>{meal.food_name}</Text>
                          <Text style={[styles.mealMacrosLine, { color: theme.primary }]}>
                            {meal.calories} kcal • P: {meal.protein_g}g | C: {meal.carbs_g}g | F: {meal.fat_g}g
                          </Text>
                          <Text style={[styles.mealMicrosText, { color: theme.subtext }]}>
                            Iron: {micros.iron_mg || 0}mg • Mag: {micros.magnesium_mg || 0}mg • Zinc: {micros.zinc_mg || 0}mg • Fiber: {micros.fiber_g || 0}g
                          </Text>
                        </View>
                        {meal.id && (
                          <TouchableOpacity
                            onPress={() => handleDeleteMeal(meal.id!)}
                            style={styles.deleteIconBtn}
                          >
                            <Trash2 size={16} color={theme.danger} />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>

      {/* FLOATING BESPOKE ATHLETIC DOCK */}
      <View
        style={[
          styles.floatingDock,
          {
            backgroundColor: isOled
              ? 'rgba(10, 10, 10, 0.96)'
              : theme.isDark
              ? 'rgba(18, 20, 28, 0.95)'
              : 'rgba(255, 255, 255, 0.96)',
            borderColor: isOled ? '#222222' : theme.border,
            bottom: Math.max(12, insets.bottom),
          },
        ]}
      >
        {(
          [
            { id: 'SUMMARY', label: 'Summary', icon: Activity },
            { id: 'WORKOUT', label: 'Workout', icon: Dumbbell },
            { id: 'RECOVERY', label: 'Recovery', icon: HeartPulse },
            { id: 'NUTRITION', label: 'Nutrition', icon: Utensils },
          ] as const
        ).map((tab) => {
          const active = activeTab === tab.id;
          const IconComponent = tab.icon;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => {
                setActiveTab(tab.id);
                Haptics.selectionAsync();
              }}
              style={styles.dockItem}
              activeOpacity={0.75}
            >
              <View style={styles.dockIconBox}>
                <IconComponent
                  size={21}
                  color={active ? (isOled ? '#FFFFFF' : theme.primary) : theme.subtext}
                  strokeWidth={active ? 2.4 : 1.7}
                />
                {tab.id === 'WORKOUT' && isWorkoutActive && (
                  <View
                    style={[
                      styles.tabBadgeDot,
                      { backgroundColor: isOled ? '#FFFFFF' : theme.primary },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.dockLabel,
                  {
                    color: active ? (isOled ? '#FFFFFF' : theme.primary) : theme.subtext,
                    fontWeight: active ? '800' : '500',
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* GLOBAL EXERCISE LIBRARY MODAL */}
      <OnlineExerciseModal
        visible={showOnlineModal}
        theme={theme}
        onClose={() => setShowOnlineModal(false)}
        onExerciseImported={handleExerciseImported}
      />

      {/* AI WORKOUT COACH MODAL */}
      <AiWorkoutModal
        visible={showAiWorkoutModal}
        theme={theme}
        userProfile={userProfile}
        onClose={() => setShowAiWorkoutModal(false)}
        onStartGeneratedWorkout={handleStartAiWorkout}
      />

      {/* AI GYM MACHINE & EQUIPMENT VISION SCANNER MODAL */}
      <GymEquipmentScannerModal
        visible={showEquipmentScannerModal}
        theme={theme}
        item={analyzedEquipment}
        loading={isAnalyzingEquipment}
        onClose={() => setShowEquipmentScannerModal(false)}
        onStartExercise={handleSelectEquipmentExercise}
        onRetake={handlePickEquipmentImage}
        onSelectDatabaseItem={(id) => {
          setAnalyzedEquipment(getEquipmentDiagnosticById(id));
        }}
      />

      {/* OPEN FOOD FACTS BARCODE SCANNER MODAL */}
      <BarcodeFoodModal
        visible={showBarcodeModal}
        theme={theme}
        onClose={() => setShowBarcodeModal(false)}
        onFoodLogged={(newMeal) => {
          setMeals((prev) => [newMeal, ...prev]);
          refreshAllData();
        }}
      />

      {/* OPENPOWERLIFTING ATHLETE STRENGTH & DOTS SCORE MODAL */}
      <AthleteStrengthModal
        visible={showStrengthModal}
        theme={theme}
        userProfile={userProfile}
        onClose={() => setShowStrengthModal(false)}
      />

      {/* NEUROMUSCULAR CNS TAP-TEST MODAL */}
      <CnsTapTestModal
        visible={showCnsModal}
        theme={theme}
        onClose={() => setShowCnsModal(false)}
        onTestComplete={(taps, label) => {
          setLatestCnsResult({ taps, label });
          refreshAllData();
        }}
      />

      {/* 4-7-8 VAGAL PARASYMPATHETIC BREATHWORK MODAL */}
      <VagalBreathworkModal
        visible={showBreathworkModal}
        theme={theme}
        onClose={() => setShowBreathworkModal(false)}
        onSessionComplete={() => {
          refreshAllData();
        }}
      />

      {/* CUSTOM ROUTINE BUILDER MODAL */}
      <CustomRoutineModal
        visible={showCustomRoutineModal}
        theme={theme}
        exercises={exercises}
        onClose={() => setShowCustomRoutineModal(false)}
        onRoutineCreated={handleCustomRoutineCreated}
      />

      {/* EXERCISE PICKER / MOVEMENT SELECTOR MODAL */}
      <ExercisePickerModal
        visible={showExercisePickerModal}
        theme={theme}
        exercises={exercises}
        currentRoutine={selectedRoutine}
        currentExerciseId={selectedEx?.id}
        onClose={() => setShowExercisePickerModal(false)}
        onSelectExercise={(newEx) => {
          setSelectedEx(newEx);
          setShowVideo(false);
          setCurrentSetNumber(1);
        }}
      />

      {/* WORKOUT SUMMARY CELEBRATION MODAL (ON END WORKOUT) */}
      <WorkoutSummaryModal
        visible={showSummaryModal}
        theme={theme}
        workoutName={activeWorkoutName}
        durationSeconds={sessionSeconds}
        totalVolumeKg={sessionVolumeKg}
        totalSets={sessionSetsCount}
        prsCount={sessionPrsCount}
        caloriesBurned={activeWorkoutCalories}
        exercisesCompleted={exercisesSummaryList}
        onFinish={handleFinishWorkoutSummary}
      />

      {/* USER PROFILE & ATHLETE TARGETS MODAL */}
      <UserProfileModal
        visible={showProfileModal}
        theme={theme}
        onClose={() => setShowProfileModal(false)}
        onProfileUpdated={(updated) => {
          setUserProfile(updated);
          refreshAllData();
        }}
        onThemeChanged={(mode) => {
          setThemeMode(mode);
        }}
        onReplayOnboarding={() => {
          setShowProfileModal(false);
          setShowOnboarding(true);
        }}
        onOpenPermissions={() => {
          setShowProfileModal(false);
          setShowPermissionsModal(true);
        }}
      />

      {/* DAILY TARGETS MODAL */}
      <DailyTargetsModal
        visible={showTargetsModal}
        theme={theme}
        userProfile={userProfile}
        onClose={() => setShowTargetsModal(false)}
        onTargetsSaved={(updated) => {
          setUserProfile(updated);
          refreshAllData();
        }}
      />

      {/* 1ST TIME ATHLETE ONBOARDING SETUP */}
      <OnboardingModal
        visible={showOnboarding}
        theme={theme}
        onOnboardingComplete={(finished) => {
          setUserProfile(finished);
          setShowOnboarding(false);
          refreshAllData();
        }}
      />

      {/* QUICK STUDIO UTILITIES & TOOLS MODAL */}
      <QuickToolsModal
        visible={showQuickToolsModal}
        theme={theme}
        onClose={() => setShowQuickToolsModal(false)}
        alarms={alarms}
        stepTracker={stepTracker}
        isWorkoutActive={isWorkoutActive}
        sessionSeconds={sessionSeconds}
        latestWellness={latestWellness}
        latestEnv={latestEnv}
        onOpenStopwatch={() => setShowStopwatchModal(true)}
        onOpenAlarms={() => setShowAlarmsModal(true)}
        onOpenSensors={() => setShowSensorHubModal(true)}
        onOpenSteps={() => setShowStepModal(true)}
        onOpenPpg={() => setShowPpgModal(true)}
        onOpenEnv={() => setShowEnvModal(true)}
        onOpenEquipmentScanner={() => setShowEquipmentScannerModal(true)}
        onOpenStrength={() => setShowStrengthModal(true)}
      />

      {/* ACTIVE WORKOUT ALARM RINGING ALERT */}
      <AlarmRingingModal
        alarm={ringingAlarm}
        theme={theme}
        onDismiss={dismissRingingAlarm}
        onSnooze={snoozeRingingAlarm}
        onStartWorkout={(title) => {
          dismissRingingAlarm();
          handleStartWorkout(undefined, title);
          setActiveTab('WORKOUT');
        }}
      />

      {/* WORKOUT ALARMS & DISCIPLINE SCHEDULER */}
      <WorkoutAlarmsModal
        visible={showAlarmsModal}
        theme={theme}
        onClose={() => setShowAlarmsModal(false)}
        onAlarmsChanged={refreshAlarms}
        onTestTrigger={() => {
          setShowAlarmsModal(false);
          testTriggerAlarm();
        }}
      />

      {/* ATHLETIC STOPWATCH & LAP TIMER */}
      <StopwatchModal
        visible={showStopwatchModal}
        theme={theme}
        onClose={() => setShowStopwatchModal(false)}
      />

      {/* FUSED MOTION STEP COUNTER & CADENCE MODAL */}
      <StepCounterModal
        visible={showStepModal}
        theme={theme}
        userProfile={userProfile}
        stepTracker={stepTracker}
        onClose={() => setShowStepModal(false)}
        onTargetUpdated={(updated) => {
          setUserProfile(updated);
          refreshAllData();
        }}
      />

      {/* CAMERA OPTICAL PPG PULSE & HRV SCANNER */}
      <CameraPpgModal
        visible={showPpgModal}
        theme={theme}
        onClose={() => setShowPpgModal(false)}
        onScanCompleted={(reading) => {
          setLatestWellness(reading);
          refreshAllData();
        }}
      />

      {/* AMBIENT THERMAL & ENVIRONMENTAL RECOVERY MODAL */}
      <EnvironmentalRecoveryModal
        visible={showEnvModal}
        theme={theme}
        onClose={() => setShowEnvModal(false)}
        onReadingSaved={(reading) => {
          setLatestEnv(reading);
          refreshAllData();
        }}
      />

      {/* 15+ SMARTPHONE SENSORS SUITE HUB */}
      <SensorHubModal
        visible={showSensorHubModal}
        theme={theme}
        onClose={() => setShowSensorHubModal(false)}
        stepTracker={stepTracker}
        latestWellness={latestWellness}
        latestEnv={latestEnv}
        onOpenStepModal={() => setShowStepModal(true)}
        onOpenPpgModal={() => setShowPpgModal(true)}
        onOpenEnvModal={() => setShowEnvModal(true)}
        onOpenPermissions={() => {
          setShowSensorHubModal(false);
          setShowPermissionsModal(true);
        }}
      />

      {/* HARDWARE & SENSOR PERMISSIONS MODAL */}
      <HardwarePermissionsModal
        visible={showPermissionsModal}
        onClose={() => setShowPermissionsModal(false)}
        theme={theme}
      />

      {/* AI FOOD SCAN CONFIRMATION & PORTION ADJUSTMENT MODAL */}
      <FoodScanConfirmModal
        visible={showFoodConfirmModal}
        theme={theme}
        analyzedItem={analyzedFood}
        loading={isAnalyzingFood}
        onClose={() => {
          setShowFoodConfirmModal(false);
          setAnalyzedFood(null);
        }}
        onMealSaved={(saved) => {
          setShowFoodConfirmModal(false);
          setAnalyzedFood(null);
          refreshAllData();
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      {/* HOW ACTIVITY RINGS WORK MODAL */}
      <Modal visible={showRingsInfoModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.themeModalBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Activity size={20} color={theme.primary} />
                <Text style={[styles.modalTitle, { color: theme.text }]}>Today's Activity Rings</Text>
              </View>
              <TouchableOpacity onPress={() => setShowRingsInfoModal(false)} style={{ padding: 4 }}>
                <X size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 12 }}>
              <View style={[styles.ringExplainerCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <View style={[styles.colorIndicator, { backgroundColor: theme.accentRed }]} />
                  <Text style={[styles.ringExplainerTitle, { color: theme.accentRed }]}>MOVE RING (TOTAL VOLUME)</Text>
                </View>
                <Text style={[styles.ringExplainerBody, { color: theme.text }]}>
                  Tracks total weight moved today (Weight × Reps). It closes when you hit your daily volume goal of {userProfile.targetVolumeKg.toLocaleString()} KG.
                </Text>
              </View>

              <View style={[styles.ringExplainerCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <View style={[styles.colorIndicator, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.ringExplainerTitle, { color: theme.primary }]}>EXERCISE RING (SETS)</Text>
                </View>
                <Text style={[styles.ringExplainerBody, { color: theme.text }]}>
                  Counts completed working sets across any exercises. Closes as you work toward your target of {userProfile.targetSets} sets today.
                </Text>
              </View>

              <View style={[styles.ringExplainerCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <View style={[styles.colorIndicator, { backgroundColor: theme.accentCyan }]} />
                  <Text style={[styles.ringExplainerTitle, { color: theme.accentCyan }]}>RECOVERY RING (READINESS)</Text>
                </View>
                <Text style={[styles.ringExplainerBody, { color: theme.text }]}>
                  Dynamic muscle recovery score. Derived from biological recovery hours elapsed since you trained each muscle group. 80-100% means fully primed.
                </Text>
              </View>
            </View>

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
              <TouchableOpacity
                onPress={() => {
                  setShowRingsInfoModal(false);
                  setShowTargetsModal(true);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.apmedPrimaryBtn,
                  {
                    flex: 1,
                    backgroundColor: theme.cardElevated,
                    borderColor: theme.border,
                    borderWidth: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  },
                ]}
              >
                <Target size={16} color={theme.primary} />
                <Text style={[styles.apmedPrimaryBtnText, { color: theme.text, fontSize: 13 }]}>Edit Targets</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowRingsInfoModal(false)}
                style={[styles.apmedPrimaryBtn, { flex: 1, backgroundColor: theme.primary }]}
              >
                <Text style={[styles.apmedPrimaryBtnText, { color: theme.primaryText }]}>Got it</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <MainScreen />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  brandLogoBox: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandNameText: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  brandProBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  brandProText: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  dateLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 1,
  },
  avatarButton: {
    paddingBottom: 0,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  headerAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  avatarInitialsText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '900',
  },
  studioToolsCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  studioToolsText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  themeToggleCapsule: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  themeToggleText: {
    fontSize: 11,
    letterSpacing: 0.5,
  },
  bioGlanceGrid: {
    gap: 10,
    marginBottom: 16,
  },
  bioGlanceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  bioGlanceTile: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: 13,
    justifyContent: 'space-between',
    minHeight: 104,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  bioGlanceTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  bioGlanceIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bioGlanceStatusPill: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  bioQuickAddBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  bioGlanceValue: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginVertical: 2,
  },
  bioGlanceBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  bioGlanceLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  bioGlanceSub: {
    fontSize: 10,
    fontWeight: '800',
  },
  studioActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveMiniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 4,
  },
  liveMiniText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pulsingGreenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tabBadgeDot: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  prBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
    borderBottomWidth: 1,
  },
  prBannerText: {
    color: '#FFD60A',
    fontWeight: '800',
    fontSize: 13,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 136,
  },
  /* MOTIVATION CARD */
  motivationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 3,
  },
  motivationAccentLine: {
    width: 3.5,
    borderRadius: 2,
    alignSelf: 'stretch',
  },
  motivationEyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  motivationQuoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
    marginVertical: 4,
  },
  motivationAuthorText: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'right',
  },
  segmentSwitcherContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
  },
  segmentSwitcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  segmentSwitcherText: {
    fontSize: 13,
    letterSpacing: 0.2,
  },
  apmedCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 4,
  },
  actionHeaderPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  cardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  ringsSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  ringsLegendColumn: {
    flex: 1,
    marginLeft: 16,
    gap: 10,
  },
  ringMetricItem: {},
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  ringMetricValue: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  ringMetricGoal: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  ringMetricLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  ringMetricUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  hourlyBarContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  hourlyLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 10,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 44,
    gap: 6,
  },
  barCol: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    borderRadius: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 12,
  },
  sectionMainTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionActionText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionSubtitleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  apmedWorkoutTile: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 16,
    marginBottom: 18,
    borderWidth: 1,
  },
  workoutIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutTileName: {
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 3,
  },
  workoutTileMeta: {
    fontSize: 12,
    fontWeight: '500',
  },
  startPillBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  startPillBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  historyItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  historyExerciseName: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  historyMeta: {
    fontSize: 12,
  },
  historySetDigits: {
    fontSize: 15,
    fontWeight: '800',
  },
  prBadgePill: {
    backgroundColor: '#FFD60A25',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  prBadgeText: {
    color: '#FFD60A',
    fontSize: 10,
    fontWeight: '900',
  },
  deleteIconBtn: {
    padding: 6,
  },
  /* UNIFIED ATHLETIC VITALS RIBBON */
  vitalsRibbonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  vitalsSegment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  vitalsSegmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  vitalsIconDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalsSegmentLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  vitalsSegmentValue: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  vitalsSegmentUnit: {
    fontSize: 10,
    fontWeight: '700',
  },
  vitalsSegmentSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  vitalsDivider: {
    width: 1,
    height: 38,
    opacity: 0.4,
  },
  /* GYM EQUIPMENT VISION SCANNER HERO */
  equipmentScannerHeroCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 4,
  },
  equipmentScannerHeroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  equipmentScannerIconBox: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  equipmentScannerHeroTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  equipmentScannerHeroSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  equipmentScannerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  scannerHeroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  scannerHeroBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  /* ATHLETE PRO COMMAND HUB (WORKOUT TAB) */
  commandHubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  commandHubItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  commandHubItemText: {
    fontSize: 12,
    fontWeight: '800',
  },
  freeServicePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  freeServicePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  /* LIVE WORKOUT HUD STYLES */
  liveWorkoutHudCard: {
    borderRadius: 28,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
  },
  hudStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hudStatusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  hudDiscardText: {
    fontSize: 12,
    fontWeight: '700',
  },
  bigStopwatchRow: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  bigStopwatchDigits: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
    fontVariant: ['tabular-nums'],
  },
  hudRoutineName: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 14,
  },
  hudStatsGrid: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 10,
    marginBottom: 16,
  },
  hudStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  hudStatLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  hudStatVal: {
    fontSize: 14,
    fontWeight: '900',
  },
  hudActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hudActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  hudActionBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  hudEndWorkoutBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
  },
  hudEndWorkoutBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  /* WORKOUT LAUNCHER STYLES */
  launcherDescription: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  presetRoutineCard: {
    width: 200,
    minHeight: 140,
    justifyContent: 'space-between',
    borderRadius: 20,
    padding: 16,
    marginRight: 12,
    borderWidth: 1.5,
  },
  routineIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routineDiffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  routineDiffText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  presetRoutineTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 8,
    marginBottom: 2,
  },
  presetRoutineSub: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  presetRoutineCount: {
    fontSize: 11,
    fontWeight: '800',
  },
  bigStartWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    gap: 12,
  },
  startWorkoutIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startWorkoutTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  bigStartWorkoutTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  bigStartWorkoutSub: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  bigStartWorkoutBtnText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  /* NUTRITION PROGRESS & QUICK STAPLES */
  macroProgressContainer: {
    marginTop: 16,
    gap: 12,
  },
  macroProgressBarRow: {
    width: '100%',
  },
  macroProgressName: {
    fontSize: 12,
    fontWeight: '700',
  },
  macroProgressVal: {
    fontSize: 12,
    fontWeight: '900',
  },
  progressBarTrack: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  quickStapleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  quickStapleName: {
    fontSize: 12,
    fontWeight: '800',
  },
  quickStapleMeta: {
    fontSize: 10.5,
    fontWeight: '700',
    marginTop: 1,
  },
  /* SEARCH & SPLITS BAR */
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  splitFilterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  splitFilterPillText: {
    fontSize: 12,
  },
  exerciseCardChip: {
    width: 170,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
  },
  exerciseCardChipText: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 3,
  },
  exerciseCardChipSub: {
    fontSize: 11,
  },
  setCounterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  setCounterLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 3,
  },
  activeExerciseTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  ytFormGuideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  ytFormGuideText: {
    fontSize: 11,
    fontWeight: '800',
  },
  instructionsText: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
    marginBottom: 12,
  },
  ytContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 14,
  },
  steppersContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  stepperBox: {
    flex: 1,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
  },
  stepperHeader: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  stepperValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stepperDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 3,
  },
  stepperInput: {
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
    minWidth: 42,
  },
  stepperUnit: {
    fontSize: 11,
    fontWeight: '700',
  },
  rpeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  rpeBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  rpeBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  vbtToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    marginTop: 8,
    borderTopWidth: 1,
  },
  vbtToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  imuSensorCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  sensorStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sensorHeaderTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  sensorActivePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  sensorActivePillText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sensorMetricsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  sensorMetricBox: {
    flex: 1,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
  },
  sensorMetricLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  sensorMetricVal: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  vbtZoneLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  balanceStatusLabel: {
    fontSize: 10,
    fontWeight: '800',
  },
  sensorSecondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(128,128,128,0.15)',
    marginBottom: 8,
  },
  sensorControlButton: {
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorControlButtonText: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  apmedPrimaryBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  apmedPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  apmedSecondaryBtn: {
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  apmedSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  /* RECOVERY & VAULT */
  vaultSubtitle: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  vaultActionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  vaultBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  vaultBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  /* NUTRITION */
  macroHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  caloriesBox: {
    flex: 1.2,
  },
  caloriesDigits: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -1,
  },
  caloriesLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 2,
  },
  caloriesGoal: {
    fontSize: 11,
    marginTop: 2,
  },
  macrosColumns: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroPillStat: {
    alignItems: 'center',
  },
  macroPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  macroPillValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  macroPillSub: {
    fontSize: 9,
    marginTop: 1,
  },
  /* OPEN FOOD FACTS SEARCH STYLES */
  openFoodSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingLeft: 12,
    paddingRight: 6,
    paddingVertical: 6,
    borderWidth: 1,
  },
  openFoodSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 4,
    marginLeft: 6,
  },
  openFoodSearchBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  openFoodSearchBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  foodResultsContainer: {
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 8,
    padding: 10,
  },
  resultsHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  foodResultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  foodResultTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  foodResultMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  quickLogFoodBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginLeft: 8,
  },
  quickLogFoodBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  foodHintInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    borderWidth: 1,
  },
  mealThumb: {
    width: 60,
    height: 60,
    borderRadius: 14,
  },
  mealTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  mealMacrosLine: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  mealMicrosText: {
    fontSize: 10,
  },
  /* FLOATING BESPOKE ATHLETIC DOCK */
  floatingDock: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 16,
  },
  dockItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  dockIconBox: {
    width: 38,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockLabel: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  activeDockPill: {
    position: 'absolute',
    bottom: 5,
    width: 14,
    height: 3,
    borderRadius: 1.5,
  },
  apmedTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 12,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 2,
  },
  /* MODAL */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  themeModalBox: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
    marginBottom: 16,
  },
  ringExplainerCard: {
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
  },
  ringExplainerTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  ringExplainerBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  apiKeySection: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  apiKeyLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  apiKeyInput: {
    borderRadius: 10,
    padding: 10,
    fontSize: 12,
    marginTop: 4,
    borderWidth: 1,
  },
  saveKeyBtn: {
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveKeyBtnText: {
    fontWeight: '800',
    fontSize: 12,
  },
  themeOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    marginVertical: 4,
    borderWidth: 1,
  },
  themeOptionCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalCloseBtn: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 14,
  },
  emptyFeed: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyFeedText: {
    fontWeight: '700',
    fontSize: 14,
    marginTop: 8,
  },
  emptyFeedSub: {
    fontSize: 12,
    marginTop: 2,
  },
  // WORKOUT V2 ENHANCEMENTS
  workoutQuickBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  workoutQuickCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  workoutQuickCapsuleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  routineNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  routineNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  routineNavBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  routineNavProgressText: {
    fontSize: 12,
    fontWeight: '600',
  },
  benchmarkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
    marginBottom: 10,
  },
  benchmarkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  useLastBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  useLastBtnText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  setTagRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 12,
  },
  setTagPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  setTagPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  quickBumpRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
    marginBottom: 10,
    justifyContent: 'space-between',
  },
  quickBumpPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickBumpPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  liveStatsPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  liveStatsPreviewText: {
    fontSize: 11,
    fontWeight: '600',
  },
  rpeExplainText: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  toolAccordionToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 8,
  },
  toolAccordionToggleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  warmupPlanCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  warmupPlanHeader: {
    marginBottom: 8,
  },
  warmupPlanTitle: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  warmupRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  warmupRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  warmupRowWeight: {
    fontSize: 12,
    fontWeight: '800',
  },
  warmupRowSub: {
    fontSize: 10,
    marginTop: 1,
  },
  warmupApplyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 6,
  },
  warmupApplyBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  todayExSetsContainer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  todayExSetsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todayExSetsTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  todayExSetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  todayExSetItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  todayExSetNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayExSetNumText: {
    fontSize: 11,
    fontWeight: '900',
  },
  todayExSetWeight: {
    fontSize: 13,
    fontWeight: '800',
  },
  todayExSetMeta: {
    fontSize: 11,
    marginTop: 1,
  },
  // RECOVERY V2 INTERACTIVE ENHANCEMENTS
  recoveryQuickBar: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  recoveryQuickCapsule: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  recoveryQuickCapsuleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  recoveryInteractiveRow: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  sleepStepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sorenessPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  sorenessPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  recoveryHydrationCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  waterQuickAddBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  waterQuickAddText: {
    fontSize: 11,
    fontWeight: '800',
  },
  waterResetBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobilityBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  mobilityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  mobilityItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  checklistScoreBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  checklistScoreText: {
    fontSize: 11,
    fontWeight: '900',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
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
  checklistItemTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
});
