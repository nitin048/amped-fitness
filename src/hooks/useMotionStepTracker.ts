import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Accelerometer, Gyroscope, Pedometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import { getTodayStepLog, saveTodayStepLog, UserProfile } from '../db/database';

export type MovementState = 'STATIONARY' | 'LIGHT WALKING' | 'BRISK WALKING' | 'RUNNING' | 'SPRINTING';

export interface MotionStepMetrics {
  steps: number;
  distanceKm: number;
  caloriesBurned: number;
  activeDurationMin: number;
  cadenceSpm: number;
  movementState: MovementState;
  isPedometerActive: boolean;
  isSensorMoving: boolean;
  netGForce: number;
  addManualSteps: (count: number) => void;
  resetTodaySteps: () => void;
  refreshTodaySteps: () => void;
  isMotionPermissionGranted: boolean;
  requestMotionPermission: () => Promise<boolean>;
}

export const useMotionStepTracker = (userProfile: UserProfile): MotionStepMetrics => {
  // Initial database load
  const initialLog = useMemo(() => getTodayStepLog(), []);

  // Real-time live step count state (instantaneous UI rendering)
  const [liveSteps, setLiveSteps] = useState<number>(initialLog.steps);
  const [isPedometerActive, setIsPedometerActive] = useState<boolean>(false);
  const [isMotionPermissionGranted, setIsMotionPermissionGranted] = useState<boolean>(false);
  const [cadenceSpm, setCadenceSpm] = useState<number>(0);
  const [movementState, setMovementState] = useState<MovementState>('STATIONARY');
  const [netGForce, setNetGForce] = useState<number>(1.0);
  const [isSensorMoving, setIsSensorMoving] = useState<boolean>(false);

  // High-frequency signal processing references (bypass React render loop for 25Hz math)
  const liveStepsRef = useRef<number>(initialLog.steps);
  const recentStepTimestampsRef = useRef<number[]>([]);
  const lastStepTimeRef = useRef<number>(0);
  const strokeStateRef = useRef<'idle' | 'peak'>('idle');
  const gravityRef = useRef<{ x: number; y: number; z: number }>({ x: 0, y: 0, z: 1 });
  const hardwarePedometerBaseRef = useRef<number | null>(null);
  const hardwareStepsDeltaRef = useRef<number>(0);
  const dbSyncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Biomechanical stride length based on athlete height (standard formula: height * 0.415)
  const athleteHeightCm = userProfile.heightCm || 178;
  const athleteWeightKg = userProfile.bodyWeightKg || 75;
  const strideLengthMeters = (athleteHeightCm * 0.415) / 100;
  const massMultiplier = athleteWeightKg / 70;

  // Real-time derived biometric values
  const distanceKm = useMemo(() => {
    return Number(((liveSteps * strideLengthMeters) / 1000).toFixed(2));
  }, [liveSteps, strideLengthMeters]);

  const caloriesBurned = useMemo(() => {
    return Math.round(liveSteps * 0.042 * massMultiplier);
  }, [liveSteps, massMultiplier]);

  const activeDurationMin = useMemo(() => {
    return Math.round(liveSteps / 100);
  }, [liveSteps]);

  // Debounced SQLite persistence helper (updates in memory in 0ms, flushes to SQLite safely)
  const scheduleDbSync = useCallback((stepsToSave: number) => {
    if (dbSyncTimeoutRef.current) {
      clearTimeout(dbSyncTimeoutRef.current);
    }

    dbSyncTimeoutRef.current = setTimeout(() => {
      const dist = Number(((stepsToSave * strideLengthMeters) / 1000).toFixed(2));
      const cals = Math.round(stepsToSave * 0.042 * massMultiplier);
      const mins = Math.round(stepsToSave / 100);
      saveTodayStepLog(stepsToSave, dist, cals, mins);
    }, 1200);
  }, [strideLengthMeters, massMultiplier]);

  // Instant real-time step register
  const registerInstantStep = useCallback(() => {
    const nextSteps = liveStepsRef.current + 1;
    liveStepsRef.current = nextSteps;
    setLiveSteps(nextSteps);

    // Track timestamp for cadence
    const now = Date.now();
    recentStepTimestampsRef.current.push(now);

    scheduleDbSync(nextSteps);
  }, [scheduleDbSync]);

  // 1. HIGH-FREQUENCY MULTI-AXIS ACCELEROMETER PIPELINE (25 Hz)
  // Provides instantaneous, zero-latency step registration on every single foot-fall / stride
  useEffect(() => {
    Accelerometer.setUpdateInterval(40); // 25 Hz sampling rate

    const accelSub = Accelerometer.addListener(({ x, y, z }) => {
      // Net G-force vector
      const totalG = Math.sqrt(x * x + y * y + z * z);
      setNetGForce(Number(totalG.toFixed(2)));

      // Low-pass filter to isolate gravity vector
      gravityRef.current.x = 0.8 * gravityRef.current.x + 0.2 * x;
      gravityRef.current.y = 0.8 * gravityRef.current.y + 0.2 * y;
      gravityRef.current.z = 0.8 * gravityRef.current.z + 0.2 * z;

      // Linear dynamic acceleration (excluding 1G Earth gravity)
      const linearX = x - gravityRef.current.x;
      const linearY = y - gravityRef.current.y;
      const linearZ = z - gravityRef.current.z;
      const linearMagnitude = Math.sqrt(linearX * linearX + linearY * linearY + linearZ * linearZ);

      const isMoving = linearMagnitude > 0.08;
      setIsSensorMoving(isMoving);

      const now = Date.now();

      // Human walking foot-strike peak detector
      // Foot impact causes an acceleration crest (>0.18G dynamic), followed by rebound (<0.06G)
      if (linearMagnitude > 0.18 && strokeStateRef.current === 'idle') {
        strokeStateRef.current = 'peak';
      } else if (linearMagnitude < 0.06 && strokeStateRef.current === 'peak') {
        strokeStateRef.current = 'idle';

        // 240ms debounce: human stride speed limit (max ~4.1 steps/sec during full sprint)
        if (now - lastStepTimeRef.current > 240) {
          lastStepTimeRef.current = now;
          registerInstantStep();
        }
      }
    });

    return () => {
      accelSub.remove();
    };
  }, [registerInstantStep]);

  // 2. HARDWARE PEDOMETER INTEGRATION & RECONCILIATION WITH PERMISSION GATING
  const requestMotionPermission = useCallback(async (): Promise<boolean> => {
    try {
      const available = await Pedometer.isAvailableAsync();
      if (!available) return false;
      const res = await Pedometer.requestPermissionsAsync();
      const granted = res.granted || res.status === 'granted';
      setIsMotionPermissionGranted(granted);
      setIsPedometerActive(granted);
      return granted;
    } catch (e) {
      console.warn('[useMotionStepTracker] Motion permission request error:', e);
      return false;
    }
  }, []);

  useEffect(() => {
    let pedometerSub: { remove: () => void } | null = null;

    const setupPedometer = async () => {
      try {
        const available = await Pedometer.isAvailableAsync();
        if (!available) {
          setIsPedometerActive(false);
          setIsMotionPermissionGranted(false);
          return;
        }

        const perm = await Pedometer.getPermissionsAsync();
        const granted = perm.granted || perm.status === 'granted';
        setIsMotionPermissionGranted(granted);
        setIsPedometerActive(granted);

        if (granted) {
          pedometerSub = Pedometer.watchStepCount((result) => {
            if (hardwarePedometerBaseRef.current === null) {
              hardwarePedometerBaseRef.current = result.steps;
            }

            const delta = Math.max(0, result.steps - (hardwarePedometerBaseRef.current || 0));
            if (delta > hardwareStepsDeltaRef.current) {
              const diff = delta - hardwareStepsDeltaRef.current;
              hardwareStepsDeltaRef.current = delta;

              // Reconcile: If hardware steps registered more than our instantaneous accelerometer steps
              const newTotal = Math.max(liveStepsRef.current + diff, liveStepsRef.current);
              if (newTotal > liveStepsRef.current) {
                liveStepsRef.current = newTotal;
                setLiveSteps(newTotal);
                scheduleDbSync(newTotal);
              }
            }
          });
        }
      } catch (e) {
        console.warn('Pedometer availability or permission check failed:', e);
      }
    };

    setupPedometer();

    return () => {
      if (pedometerSub) pedometerSub.remove();
    };
  }, [scheduleDbSync]);

  // 3. REAL-TIME STRIDE CADENCE (SPM) & ATHLETIC STATE ENGINE
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      // Sliding 6-second window for instantaneous cadence
      recentStepTimestampsRef.current = recentStepTimestampsRef.current.filter((t) => now - t <= 6000);
      const countInWindow = recentStepTimestampsRef.current.length;

      // Project to steps per minute (SPM)
      const spm = Math.round((countInWindow / 6) * 60);
      setCadenceSpm(spm);

      // Real-time classification
      if (spm <= 10) {
        setMovementState('STATIONARY');
      } else if (spm <= 85) {
        setMovementState('LIGHT WALKING');
      } else if (spm <= 125) {
        setMovementState('BRISK WALKING');
      } else if (spm <= 165) {
        setMovementState('RUNNING');
      } else {
        setMovementState('SPRINTING');
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // Manual step injection (useful for treadmill or calibration)
  const addManualSteps = (count: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newSteps = liveStepsRef.current + count;
    liveStepsRef.current = newSteps;
    setLiveSteps(newSteps);
    scheduleDbSync(newSteps);
  };

  const resetTodaySteps = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    liveStepsRef.current = 0;
    hardwarePedometerBaseRef.current = null;
    hardwareStepsDeltaRef.current = 0;
    setLiveSteps(0);
    scheduleDbSync(0);
  };

  const refreshTodaySteps = useCallback(() => {
    const fresh = getTodayStepLog();
    liveStepsRef.current = fresh.steps;
    setLiveSteps(fresh.steps);
  }, []);

  return {
    steps: liveSteps,
    distanceKm,
    caloriesBurned,
    activeDurationMin,
    cadenceSpm,
    movementState,
    isPedometerActive,
    isSensorMoving,
    netGForce,
    addManualSteps,
    resetTodaySteps,
    refreshTodaySteps,
    isMotionPermissionGranted,
    requestMotionPermission,
  };
};
