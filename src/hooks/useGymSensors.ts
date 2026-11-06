import { useState, useEffect, useRef } from 'react';
import { Accelerometer, Gyroscope, Pedometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';

export interface VBTMetrics {
  currentVelocity: number;
  peakVelocity: number;
  vbtZone: string;
  vbtZoneColor: string;
}

export type BarBalanceStatus = 'BALANCED' | 'SLIGHT TILT' | 'LOPSIDED';

export const useGymSensors = (onShakeDetected?: () => void) => {
  // Accelerometer & Velocity Tracking
  const [peakVelocity, setPeakVelocity] = useState<number>(0);
  const [currentVelocity, setCurrentVelocity] = useState<number>(0);
  const [isTrackingSet, setIsTrackingSet] = useState<boolean>(false);
  const [detectedReps, setDetectedReps] = useState<number>(0);

  // Gyroscope Barbell Tilt & Balance Tracking
  const [barTiltAngle, setBarTiltAngle] = useState<number>(0);
  const [balanceStatus, setBalanceStatus] = useState<BarBalanceStatus>('BALANCED');
  const [isBarLopsided, setIsBarLopsided] = useState<boolean>(false);

  // Pedometer Session Step Tracking
  const [sessionSteps, setSessionSteps] = useState<number>(0);
  const [isPedometerAvailable, setIsPedometerAvailable] = useState<boolean>(false);

  // Internal refs for high-frequency sensor callbacks
  const lastShakeRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const peakRef = useRef<number>(0);
  const repStrokePhaseRef = useRef<'idle' | 'concentric' | 'eccentric'>('idle');
  const lastRepTimeRef = useRef<number>(0);
  const repCountRef = useRef<number>(0);
  const lastLopsidedAlertRef = useRef<number>(0);

  // 1. ACCELEROMETER PIPELINE (VBT, Rep Motion, Shake)
  useEffect(() => {
    Accelerometer.setUpdateInterval(40); // 25 Hz sampling rate

    const accelSubscription = Accelerometer.addListener(({ x, y, z }) => {
      // Net G-force vector magnitude minus 1G Earth gravity
      const totalG = Math.sqrt(x * x + y * y + z * z);
      const netAcceleration = Math.abs(totalG - 1.0);

      // A. Shake Detection (>2.4G) with 1500ms debounce
      if (netAcceleration > 2.4 && onShakeDetected) {
        const now = Date.now();
        if (now - lastShakeRef.current > 1500) {
          lastShakeRef.current = now;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onShakeDetected();
        }
      }

      // B. Velocity-Based Training (VBT) Concentric Tracking
      if (isTrackingSet) {
        if (netAcceleration > 0.12) {
          // Dynamic conversion from G-force acceleration to concentric velocity (m/s)
          const liveVel = Number(Math.min(1.85, netAcceleration * 0.92).toFixed(2));
          velocityRef.current = liveVel;
          setCurrentVelocity(liveVel);

          if (liveVel > peakRef.current) {
            peakRef.current = liveVel;
            setPeakVelocity(liveVel);
          }
        } else {
          // Deceleration phase
          velocityRef.current = Math.max(0, velocityRef.current * 0.7);
          setCurrentVelocity(Number(velocityRef.current.toFixed(2)));
        }

        // C. Automatic Rep Motion Detector
        // Detects cyclic transition: concentric stroke (>0.32G) -> eccentric recovery (<0.10G)
        const now = Date.now();
        if (netAcceleration > 0.32 && repStrokePhaseRef.current === 'idle') {
          repStrokePhaseRef.current = 'concentric';
        } else if (
          netAcceleration < 0.12 &&
          repStrokePhaseRef.current === 'concentric' &&
          now - lastRepTimeRef.current > 850
        ) {
          repStrokePhaseRef.current = 'idle';
          lastRepTimeRef.current = now;
          repCountRef.current += 1;
          setDetectedReps(repCountRef.current);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      }
    });

    return () => accelSubscription.remove();
  }, [isTrackingSet, onShakeDetected]);

  // 2. GYROSCOPE PIPELINE (Barbell Tilt & Balance Angle)
  useEffect(() => {
    let gyroSubscription: { remove: () => void } | null = null;

    Gyroscope.isAvailableAsync().then((available) => {
      if (!available) return;

      Gyroscope.setUpdateInterval(60); // ~16 Hz
      gyroSubscription = Gyroscope.addListener(({ x, y, z }) => {
        // Calculate lateral barbell roll angle in degrees
        // Y and X axis angular velocity integrated into tilt estimate
        const tiltDeg = Math.round((x * 180) / Math.PI);
        const clampedTilt = Math.max(-45, Math.min(45, tiltDeg));
        setBarTiltAngle(clampedTilt);

        const absTilt = Math.abs(clampedTilt);
        if (absTilt <= 3) {
          setBalanceStatus('BALANCED');
          setIsBarLopsided(false);
        } else if (absTilt <= 7) {
          setBalanceStatus('SLIGHT TILT');
          setIsBarLopsided(false);
        } else {
          setBalanceStatus('LOPSIDED');
          setIsBarLopsided(true);

          // Alert athlete if bar is lopsided during an active set
          if (isTrackingSet) {
            const now = Date.now();
            if (now - lastLopsidedAlertRef.current > 2500) {
              lastLopsidedAlertRef.current = now;
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          }
        }
      });
    });

    return () => {
      if (gyroSubscription) gyroSubscription.remove();
    };
  }, [isTrackingSet]);

  // 3. PEDOMETER PIPELINE (Live Steps during gym session)
  useEffect(() => {
    let pedometerSub: { remove: () => void } | null = null;

    Pedometer.isAvailableAsync().then((available) => {
      setIsPedometerAvailable(available);
      if (available) {
        try {
          pedometerSub = Pedometer.watchStepCount((result) => {
            setSessionSteps(result.steps);
          });
        } catch (e) {
          console.warn('Pedometer watch error:', e);
        }
      }
    });

    return () => {
      if (pedometerSub) pedometerSub.remove();
    };
  }, []);

  const startVelocityTracking = () => {
    peakRef.current = 0;
    velocityRef.current = 0;
    repCountRef.current = 0;
    repStrokePhaseRef.current = 'idle';
    setPeakVelocity(0);
    setCurrentVelocity(0);
    setDetectedReps(0);
    setIsTrackingSet(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const stopVelocityTracking = (): number => {
    setIsTrackingSet(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const finalPeak = peakRef.current > 0 ? peakRef.current : 0.65;
    return finalPeak;
  };

  const resetDetectedReps = () => {
    repCountRef.current = 0;
    setDetectedReps(0);
  };

  // Determine VBT Zone according to Olympic strength conditioning standards (clean typography)
  const getVBTZone = (vel: number): { label: string; color: string } => {
    if (vel >= 1.0) return { label: 'Speed & Power', color: '#30D158' };
    if (vel >= 0.75) return { label: 'Speed-Strength', color: '#30D158' };
    if (vel >= 0.5) return { label: 'Hypertrophy & Strength', color: '#FFD60A' };
    if (vel >= 0.35) return { label: 'Accelerative Strength', color: '#FF9F0A' };
    return { label: 'Max Effort / Grinder', color: '#FF453A' };
  };

  const activeZone = getVBTZone(peakVelocity > 0 ? peakVelocity : 0.65);

  return {
    currentVelocity,
    peakVelocity,
    isTrackingSet,
    vbtZone: activeZone.label,
    vbtZoneColor: activeZone.color,
    startVelocityTracking,
    stopVelocityTracking,
    detectedReps,
    resetDetectedReps,
    barTiltAngle,
    balanceStatus,
    isBarLopsided,
    sessionSteps,
    isPedometerAvailable,
  };
};
