import { db } from '../db/database';

export type MuscleGroup = 'CHEST' | 'BACK' | 'LEGS' | 'SHOULDERS' | 'ARMS' | 'CORE';

export interface MuscleRecoveryState {
  muscle: MuscleGroup;
  name: string;
  recoveryPercent: number; // 0 - 100
  status: 'OPTIMAL' | 'RECOVERING' | 'FATIGUED';
  statusLabel: string;
  color: string;
  lastTrainedHoursAgo: number | null;
  totalRecentSets: number;
  totalRecentVolumeKg: number;
  recommendation: string;
  recoveryHorizonHours: number;
}

// Physiological Muscle Recovery Windows (ACSM / NSCA Hypertrophy guidelines)
const MUSCLE_RECOVERY_HOURS: Record<MuscleGroup, number> = {
  LEGS: 66,       // Quadriceps, Hamstrings, Glutes require 60-72h
  BACK: 56,       // Lats, Trapezius, Erector Spinae require 48-60h
  CHEST: 48,      // Pectorals require 44-52h
  SHOULDERS: 40,  // Deltoids (anterior, lateral, rear) require 36-44h
  ARMS: 32,       // Biceps & Triceps require 24-36h
  CORE: 26,       // Abdominals & Obliques require 24-30h
};

export const getMuscleRecoveryData = (): Record<MuscleGroup, MuscleRecoveryState> => {
  const muscleGroups: MuscleGroup[] = ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE'];
  const now = Date.now();
  const maxLookbackHours = 96;
  const cutoffTimestamp = now - maxLookbackHours * 60 * 60 * 1000;

  // Fetch recent sets joined with exercise muscle group
  const recentSets = db.getAllSync<{
    primary_muscle: string;
    weight_kg: number;
    reps: number;
    completed_at: number;
  }>(
    `SELECT e.primary_muscle, w.weight_kg, w.reps, w.completed_at
     FROM workout_sets w
     JOIN exercises e ON w.exercise_id = e.id
     WHERE w.completed_at >= ?
     ORDER BY w.completed_at DESC`,
    [cutoffTimestamp]
  );

  const results = {} as Record<MuscleGroup, MuscleRecoveryState>;

  for (const muscle of muscleGroups) {
    const muscleSets = recentSets.filter((s) => s.primary_muscle.toUpperCase() === muscle);
    const horizonHours = MUSCLE_RECOVERY_HOURS[muscle];

    if (muscleSets.length === 0) {
      results[muscle] = {
        muscle,
        name: getMuscleDisplayName(muscle),
        recoveryPercent: 100,
        status: 'OPTIMAL',
        statusLabel: '100% Ready',
        color: '#30D158', // Apple Green
        lastTrainedHoursAgo: null,
        totalRecentSets: 0,
        totalRecentVolumeKg: 0,
        recommendation: 'Prime neuromuscular state. Maximum capacity for progressive overload.',
        recoveryHorizonHours: horizonHours,
      };
      continue;
    }

    const latestSetTime = muscleSets[0].completed_at;
    const hoursElapsed = Math.max(0, (now - latestSetTime) / (1000 * 60 * 60));
    const totalVolume = muscleSets.reduce((acc, s) => acc + s.weight_kg * s.reps, 0);
    const totalSets = muscleSets.length;

    // Physiological Recovery Exponential Curve
    // Immediate post-workout baseline: 30% recovery
    // Recovers along its muscle-specific time horizon
    const progressRatio = Math.min(1.0, hoursElapsed / horizonHours);
    const baseRecovery = 30 + progressRatio * 70;

    // Volume fatigue damper: >3500kg of volume adds a small recovery tax
    const volumeTax = Math.min(12, (totalVolume / 4500) * 8) * (1 - progressRatio);
    const recoveryPercent = Math.min(100, Math.max(25, Math.round(baseRecovery - volumeTax)));

    let status: 'OPTIMAL' | 'RECOVERING' | 'FATIGUED' = 'OPTIMAL';
    let statusLabel = 'Optimal';
    let color = '#30D158'; // Green
    let recommendation = 'Fully restored. Ready for maximum intensity and heavy compound sets.';

    if (recoveryPercent < 60) {
      status = 'FATIGUED';
      statusLabel = 'High Strain';
      color = '#FF453A'; // Apple Red
      recommendation = `Active muscle fiber remodeling (${Math.round(hoursElapsed)}h ago). Emphasize protein synthesis and sleep.`;
    } else if (recoveryPercent < 85) {
      status = 'RECOVERING';
      statusLabel = 'Rebuilding';
      color = '#FFD60A'; // Apple Yellow
      recommendation = `Secondary recovery phase. Light active recovery or antagonist training recommended.`;
    }

    results[muscle] = {
      muscle,
      name: getMuscleDisplayName(muscle),
      recoveryPercent,
      status,
      statusLabel: `${recoveryPercent}% ${statusLabel}`,
      color,
      lastTrainedHoursAgo: Math.round(hoursElapsed),
      totalRecentSets: totalSets,
      totalRecentVolumeKg: Math.round(totalVolume),
      recommendation,
      recoveryHorizonHours: horizonHours,
    };
  }

  return results;
};

const getMuscleDisplayName = (muscle: MuscleGroup): string => {
  switch (muscle) {
    case 'CHEST':
      return 'Chest (Pectorals)';
    case 'BACK':
      return 'Back (Lats & Traps)';
    case 'LEGS':
      return 'Legs (Quads & Hamstrings)';
    case 'SHOULDERS':
      return 'Shoulders (Deltoids)';
    case 'ARMS':
      return 'Arms (Biceps & Triceps)';
    case 'CORE':
      return 'Core (Abs & Obliques)';
  }
};

export interface MobilityExercise {
  name: string;
  duration: string;
  target: string;
  benefit: string;
}

export const getMobilityProtocol = (muscle: MuscleGroup): MobilityExercise[] => {
  switch (muscle) {
    case 'LEGS':
      return [
        { name: 'Couch Stretch', duration: '2 min / side', target: 'Hip Flexors & Quads', benefit: 'Relieves anterior pelvic tilt & patellar tendon tension' },
        { name: 'Elevated Pigeon Pose', duration: '90s / side', target: 'Glutes & Piriformis', benefit: 'Releases deep hip rotators after heavy squatting' },
        { name: 'Hamstring Floss & Elephant Walk', duration: '2 min', target: 'Posterior Knee & Biceps Femoris', benefit: 'Restores eccentric hamstring glide' },
      ];
    case 'BACK':
      return [
        { name: 'Hanging Lat Decompression', duration: '60s x 2', target: 'Latissimus Dorsi & Spine', benefit: 'Decompresses lumbar discs after deadlifts' },
        { name: 'Thread-the-Needle & Cat-Cow', duration: '2 min', target: 'Thoracic Spine & Rhomboids', benefit: 'Restores upper-back rotational freedom' },
        { name: 'Sphinx Pose Lumbar Extension', duration: '90s', target: 'Erector Spinae', benefit: 'Relieves lower-back pump and axial tightness' },
      ];
    case 'CHEST':
      return [
        { name: 'Doorway Pec Major & Minor Stretch', duration: '60s / side', target: 'Pectoralis Major/Minor', benefit: 'Opens anterior shoulder capsule and posture' },
        { name: 'Foam Roller Chest & Thoracic Opener', duration: '2 min', target: 'Ribcage & Sternum', benefit: 'Expands ribcage mobility after bench pressing' },
      ];
    case 'SHOULDERS':
      return [
        { name: 'Sleeper Stretch & Cross-Body Floss', duration: '60s / side', target: 'Posterior Deltoid & Rotator Cuff', benefit: 'Prevents impingement and frees internal rotation' },
        { name: 'Banded Dislocates & Over-and-Backs', duration: '20 reps', target: 'Entire Shoulder Girdle', benefit: 'Pumps fresh blood through the labrum and bursae' },
      ];
    case 'ARMS':
      return [
        { name: 'Wall Bicep & Flexor Stretch', duration: '60s / side', target: 'Biceps Brachii & Forearms', benefit: 'Eliminates elbow tendinopathy and tendon strain' },
        { name: 'Overhead Tricep & Lat Stretch', duration: '60s / side', target: 'Long Head Tricep', benefit: 'Releases overhead lockup after pressing volume' },
      ];
    case 'CORE':
      return [
        { name: 'Supine Windshield Wipers', duration: '90s', target: 'Obliques & Lower Back', benefit: 'Gentle spinal twist to ease intra-abdominal pressure' },
        { name: 'Cobra Abdominal Stretch', duration: '60s', target: 'Rectus Abdominis', benefit: 'Lengthens anterior abdominal wall' },
      ];
  }
};
