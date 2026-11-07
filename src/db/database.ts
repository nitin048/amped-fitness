import * as SQLite from 'expo-sqlite';
import { WorkoutRoutine } from './routines';

// Open local on-device database synchronously (0ms latency)
export const db = SQLite.openDatabaseSync('amped.db');

export interface Exercise {
  id: string;
  name: string;
  primary_muscle: string;
  equipment: string;
  youtube_video_id: string;
  instructions: string;
}

export interface SetLog {
  id?: number;
  session_id?: number | null;
  exercise_id: string;
  weight_kg: number;
  reps: number;
  rpe: number;
  is_pr: number;
  velocity_ms: number;
  completed_at: number;
}

export interface MealLog {
  id?: number;
  date_str: string;
  food_name: string;
  serving_grams: number;
  local_image_uri: string | null;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  micros_json: string;
}

export interface WorkoutSession {
  id?: number;
  start_time: number;
  end_time: number;
  duration_seconds: number;
  total_volume_kg: number;
  total_sets: number;
  prs_count: number;
  calories_burned: number;
  workout_type: string;
  created_date_str: string;
}

export interface UserSettings {
  id: number;
  theme_mode: string;
  target_calories: number;
  target_protein: number;
  bar_weight_kg: number;
  gemini_api_key?: string;
  user_name?: string;
  athlete_nickname?: string;
  gender?: string;
  age_years?: number;
  body_weight_kg?: number;
  height_cm?: number;
  body_fat_pct?: number;
  weight_unit?: string;
  height_unit?: string;
  fitness_goal?: string;
  experience_level?: string;
  weekly_workout_days_target?: number;
  preferred_split?: string;
  available_equipment?: string;
  target_workout_duration_min?: number;
  target_volume_kg?: number;
  target_sets?: number;
  target_carbs?: number;
  target_fat?: number;
  target_water_ml?: number;
  target_sleep_hours?: number;
  default_rest_seconds?: number;
  auto_rest_timer?: number;
  sound_alerts?: number;
  haptic_feedback?: number;
  ai_coach_persona?: string;
  avatar_color?: string;
  profile_image_uri?: string | null;
  has_completed_onboarding?: number;
  target_daily_steps?: number;
  target_resting_hr?: number;
  recovery_sleep_hours?: number;
  recovery_soreness?: string;
  recovery_checklist_json?: string;
  has_seeded_workout_alarms?: number;
}

export interface WorkoutAlarm {
  id: number;
  title: string;
  timeStr: string;
  period: 'AM' | 'PM';
  days: number[];
  isActive: boolean;
  soundEnabled: boolean;
  createdAt: number;
}

export interface StepLog {
  date_str: string;
  steps: number;
  distance_km: number;
  calories_burned: number;
  active_duration_min: number;
}

export interface WellnessReading {
  id: number;
  dateStr: string;
  timestamp: string;
  heartRateBpm: number;
  hrvRmssd: number;
  wellnessScore: number;
  stateLabel: string;
  notes?: string;
}

export interface EnvironmentalLog {
  id: number;
  dateStr: string;
  timestamp: string;
  tempC: number;
  humidityPct: number;
  pressureHpa: number;
  heatIndexC: number;
  thermalStatus: string;
  recoveryImpactScore: number;
  notes?: string;
}

export interface RecoveryTrendPoint {
  dateStr: string;
  dayLabel: string;
  recoveryPct: number;
  restingHr: number;
  hrvRmssd: number;
  tempC: number;
  steps: number;
  isPeak: boolean;
}

export interface UserProfile {
  userName: string;
  athleteNickname: string;
  gender: string;
  ageYears: number;
  bodyWeightKg: number;
  heightCm: number;
  bodyFatPct: number;
  weightUnit: string;
  heightUnit: string;
  fitnessGoal: string;
  experienceLevel: string;
  weeklyWorkoutDaysTarget: number;
  preferredSplit: string;
  availableEquipment: string;
  targetWorkoutDurationMin: number;
  targetVolumeKg: number;
  targetSets: number;
  targetCalories: number;
  targetProtein: number;
  targetCarbs: number;
  targetFat: number;
  targetWaterMl: number;
  targetSleepHours: number;
  targetDailySteps: number;
  targetRestingHr: number;
  defaultRestSeconds: number;
  autoRestTimer: boolean;
  soundAlerts: boolean;
  hapticFeedback: boolean;
  aiCoachPersona: string;
  themeMode: string;
  barWeightKg: number;
  geminiApiKey: string;
  avatarColor: string;
  profileImageUri?: string | null;
  hasCompletedOnboarding: boolean;
  recoverySleepHours?: number;
  recoverySoreness?: 'NONE' | 'MILD' | 'SORE' | 'SEVERE';
  recoveryChecklist?: Record<string, boolean>;
}

export const initLocalDatabase = () => {
  db.execSync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      theme_mode TEXT DEFAULT 'MIDNIGHT_OLED',
      target_calories INTEGER DEFAULT 2400,
      target_protein INTEGER DEFAULT 160,
      bar_weight_kg REAL DEFAULT 20,
      gemini_api_key TEXT DEFAULT '',
      has_completed_onboarding INTEGER DEFAULT 0,
      has_seeded_workout_alarms INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS workout_alarms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      time_str TEXT NOT NULL,
      period TEXT NOT NULL,
      days_json TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      sound_enabled INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS exercises (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      primary_muscle TEXT NOT NULL,
      equipment TEXT NOT NULL,
      youtube_video_id TEXT NOT NULL,
      instructions TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      start_time INTEGER NOT NULL,
      end_time INTEGER NOT NULL,
      duration_seconds INTEGER NOT NULL,
      total_volume_kg REAL NOT NULL,
      total_sets INTEGER NOT NULL,
      prs_count INTEGER DEFAULT 0,
      calories_burned INTEGER DEFAULT 0,
      workout_type TEXT DEFAULT 'Traditional Strength Training',
      created_date_str TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workout_sets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER,
      exercise_id TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      reps INTEGER NOT NULL,
      rpe REAL DEFAULT 8,
      is_pr INTEGER DEFAULT 0,
      velocity_ms REAL DEFAULT 0,
      completed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS meal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_str TEXT NOT NULL,
      food_name TEXT NOT NULL,
      serving_grams REAL NOT NULL,
      local_image_uri TEXT,
      calories REAL NOT NULL,
      protein_g REAL NOT NULL,
      carbs_g REAL NOT NULL,
      fat_g REAL NOT NULL,
      micros_json TEXT
    );

    CREATE TABLE IF NOT EXISTS water_logs (
      date_str TEXT PRIMARY KEY,
      amount_ml INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS step_logs (
      date_str TEXT PRIMARY KEY,
      steps INTEGER DEFAULT 0,
      distance_km REAL DEFAULT 0.0,
      calories_burned INTEGER DEFAULT 0,
      active_duration_min INTEGER DEFAULT 0,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wellness_biometrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_str TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      heart_rate_bpm INTEGER NOT NULL,
      hrv_rmssd INTEGER NOT NULL,
      wellness_score INTEGER NOT NULL,
      state_label TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS environmental_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date_str TEXT NOT NULL,
      timestamp TEXT NOT NULL,
      temp_c REAL NOT NULL,
      humidity_pct REAL NOT NULL,
      pressure_hpa REAL NOT NULL,
      heat_index_c REAL NOT NULL,
      thermal_status TEXT NOT NULL,
      recovery_impact_score INTEGER NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS custom_routines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      tagline TEXT NOT NULL,
      split TEXT NOT NULL,
      icon TEXT DEFAULT 'Dumbbell',
      estimated_minutes INTEGER DEFAULT 45,
      difficulty TEXT DEFAULT 'Intermediate',
      target_muscles_json TEXT NOT NULL,
      exercise_ids_json TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    -- Performance Indexes
    CREATE INDEX IF NOT EXISTS idx_workout_sets_exercise ON workout_sets(exercise_id);
    CREATE INDEX IF NOT EXISTS idx_workout_sets_completed ON workout_sets(completed_at);
    CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(created_date_str);
    CREATE INDEX IF NOT EXISTS idx_meal_logs_date ON meal_logs(date_str);
    CREATE INDEX IF NOT EXISTS idx_step_logs_date ON step_logs(date_str);
    CREATE INDEX IF NOT EXISTS idx_wellness_date ON wellness_biometrics(date_str);
    CREATE INDEX IF NOT EXISTS idx_env_logs_date ON environmental_logs(date_str);
    CREATE INDEX IF NOT EXISTS idx_custom_routines_created ON custom_routines(created_at);
  `);

  // Migrations for columns
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_daily_steps INTEGER DEFAULT 10000;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_resting_hr INTEGER DEFAULT 60;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN bar_weight_kg REAL DEFAULT 20;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN gemini_api_key TEXT DEFAULT '';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN user_name TEXT DEFAULT 'Alex Carter';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN fitness_goal TEXT DEFAULT 'Hypertrophy & Muscle Building';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN experience_level TEXT DEFAULT 'Intermediate';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN body_weight_kg REAL DEFAULT 75.0;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN height_cm REAL DEFAULT 178.0;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_volume_kg REAL DEFAULT 5000;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_sets INTEGER DEFAULT 20;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN avatar_color TEXT DEFAULT '#30D158';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN profile_image_uri TEXT;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_calories INTEGER DEFAULT 2400;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_protein INTEGER DEFAULT 160;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN athlete_nickname TEXT DEFAULT 'Apex Lifter';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN gender TEXT DEFAULT 'Male';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN age_years INTEGER DEFAULT 26;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN body_fat_pct REAL DEFAULT 15.0;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN weight_unit TEXT DEFAULT 'KG';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN height_unit TEXT DEFAULT 'CM';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN weekly_workout_days_target INTEGER DEFAULT 5;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN preferred_split TEXT DEFAULT 'Push / Pull / Legs (PPL)';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN available_equipment TEXT DEFAULT 'Commercial Gym';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_workout_duration_min INTEGER DEFAULT 60;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_carbs INTEGER DEFAULT 250;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_fat INTEGER DEFAULT 70;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_water_ml INTEGER DEFAULT 3000;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN target_sleep_hours REAL DEFAULT 8.0;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN default_rest_seconds INTEGER DEFAULT 90;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN auto_rest_timer INTEGER DEFAULT 1;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN sound_alerts INTEGER DEFAULT 1;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN haptic_feedback INTEGER DEFAULT 1;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN ai_coach_persona TEXT DEFAULT 'Evidence-Based Sports Scientist';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN has_completed_onboarding INTEGER DEFAULT 0;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE workout_sets ADD COLUMN session_id INTEGER;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN recovery_sleep_hours REAL DEFAULT 7.5;`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN recovery_soreness TEXT DEFAULT 'MILD';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN recovery_checklist_json TEXT DEFAULT '{"sleep":true,"hydration":false,"mobility":false,"protein":true,"coldReset":false}';`);
  } catch {}
  try {
    db.execSync(`ALTER TABLE user_settings ADD COLUMN has_seeded_workout_alarms INTEGER DEFAULT 0;`);
  } catch {}

  // Seed default user settings (Minimalist OLED default, never overwrites existing user theme)
  db.runSync(`INSERT OR IGNORE INTO user_settings (id, theme_mode, bar_weight_kg) VALUES (1, 'MIDNIGHT_OLED', 20);`);
  try {
    db.runSync(`UPDATE user_settings SET theme_mode = 'MIDNIGHT_OLED' WHERE id = 1 AND theme_mode IS NULL;`);
  } catch {}

  // Seed default workout alarms ONLY ONCE on initial setup, NEVER reseed if user deleted them
  try {
    const settings = db.getFirstSync<{ has_seeded_workout_alarms?: number }>(
      'SELECT has_seeded_workout_alarms FROM user_settings WHERE id = 1'
    );
    const hasSeeded = Boolean(settings && settings.has_seeded_workout_alarms === 1);

    if (!hasSeeded) {
      const alarmCount = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM workout_alarms');
      if (alarmCount && alarmCount.c === 0) {
        db.runSync(
          `INSERT INTO workout_alarms (title, time_str, period, days_json, is_active, sound_enabled, created_at)
           VALUES (?, ?, ?, ?, 1, 1, ?)`,
          ['Morning Push & Hypertrophy', '06:30', 'AM', JSON.stringify([0, 2, 4]), Date.now()]
        );
        db.runSync(
          `INSERT INTO workout_alarms (title, time_str, period, days_json, is_active, sound_enabled, created_at)
           VALUES (?, ?, ?, ?, 1, 1, ?)`,
          ['Evening Power & Deadlift', '05:30', 'PM', JSON.stringify([1, 3, 5]), Date.now()]
        );
      }
      db.runSync('UPDATE user_settings SET has_seeded_workout_alarms = 1 WHERE id = 1');
    }
  } catch {}

  try {
    db.runSync(
      `UPDATE exercises SET youtube_video_id = 'm0FOpMEgero' WHERE id = 'leg_extensions' AND (youtube_video_id = 'YyvSfV-77y0' OR youtube_video_id IS NULL)`
    );
  } catch {}

  // Seed 45+ comprehensive gym exercises across all muscle groups
  const count = db.getFirstSync<{ c: number }>('SELECT COUNT(*) as c FROM exercises');
  if (count && count.c < 30) {
    const defaultExercises: Exercise[] = [
      // CHEST
      {
        id: 'barbell_bench_press',
        name: 'Barbell Flat Bench Press',
        primary_muscle: 'CHEST',
        equipment: 'BARBELL',
        youtube_video_id: 'vcBig73ojpE',
        instructions: 'Plant feet, arch lower back slightly, retract scapula, lower bar to mid-chest, drive up explosively.'
      },
      {
        id: 'incline_dumbbell_press',
        name: 'Incline Dumbbell Press',
        primary_muscle: 'CHEST',
        equipment: 'DUMBBELL',
        youtube_video_id: '8iPEnn-ltC8',
        instructions: 'Set bench to 30°, tuck elbows at 45°, squeeze upper pecs hard at top lockout.'
      },
      {
        id: 'cable_chest_flyes',
        name: 'High-to-Low Cable Flyes',
        primary_muscle: 'CHEST',
        equipment: 'CABLE',
        youtube_video_id: 'Iwe6AmxVf7o',
        instructions: 'Lean torso forward slightly, slight bend in elbows, hug imaginary tree, squeeze inner pecs.'
      },
      {
        id: 'chest_dips',
        name: 'Weighted Chest Dips',
        primary_muscle: 'CHEST',
        equipment: 'BODYWEIGHT',
        youtube_video_id: '2z8JmcrW-As',
        instructions: 'Lean torso forward 30°, flare elbows slightly out, descend until shoulders stretch, press up.'
      },
      {
        id: 'decline_barbell_press',
        name: 'Decline Barbell Press',
        primary_muscle: 'CHEST',
        equipment: 'BARBELL',
        youtube_video_id: 'LfyQBUKR8SE',
        instructions: 'Anchor legs on decline bench, lower bar to sternum, recruit maximum lower pec fibers.'
      },
      {
        id: 'pushups',
        name: 'Deficit Push-ups',
        primary_muscle: 'CHEST',
        equipment: 'BODYWEIGHT',
        youtube_video_id: 'IODxDxX7oi4',
        instructions: 'Hands slightly wider than shoulder width, brace glutes, full chest to floor range of motion.'
      },

      // BACK
      {
        id: 'conventional_deadlift',
        name: 'Barbell Conventional Deadlift',
        primary_muscle: 'BACK',
        equipment: 'BARBELL',
        youtube_video_id: 'VL5Ab0T07e4',
        instructions: 'Bar over mid-foot, pull slack out of bar, brace core 360°, push floor away with legs.'
      },
      {
        id: 'lat_pulldown',
        name: 'Wide-Grip Lat Pulldown',
        primary_muscle: 'BACK',
        equipment: 'CABLE',
        youtube_video_id: 'SALxEARiMkw',
        instructions: 'Drive elbows down toward rear pockets, slight arch, squeeze lats without excessive swinging.'
      },
      {
        id: 'barbell_bent_row',
        name: 'Barbell Bent-Over Row',
        primary_muscle: 'BACK',
        equipment: 'BARBELL',
        youtube_video_id: 'FWJR5Ve8gkQ',
        instructions: 'Hinge hips to 45°, pull bar to belly button, squeeze shoulder blades together at top.'
      },
      {
        id: 'seated_cable_row',
        name: 'Seated Cable Row',
        primary_muscle: 'BACK',
        equipment: 'CABLE',
        youtube_video_id: 'GZbfZ033f74',
        instructions: 'Sit upright, pull V-handle to lower ribs, hold 1-second contraction, control negative.'
      },
      {
        id: 'pullups',
        name: 'Dead-Hang Pull-ups',
        primary_muscle: 'BACK',
        equipment: 'BODYWEIGHT',
        youtube_video_id: 'eGo4IYlbE5g',
        instructions: 'Full dead hang at bottom, pull chest up to bar level, initiate movement with scapular depression.'
      },
      {
        id: 'single_arm_db_row',
        name: 'Single-Arm Dumbbell Row',
        primary_muscle: 'BACK',
        equipment: 'DUMBBELL',
        youtube_video_id: 'roCP6wCXPqo',
        instructions: 'Flat back, pull dumbbell in sweeping arc towards hip, stretch lat fully at bottom.'
      },
      {
        id: 'face_pulls',
        name: 'Cable Face Pulls',
        primary_muscle: 'BACK',
        equipment: 'CABLE',
        youtube_video_id: 'rep-qVOkqgk',
        instructions: 'Rope at eye level, pull to forehead with external rotation, activate rear delts and rotator cuff.'
      },
      {
        id: 't_bar_row',
        name: 'Chest-Supported T-Bar Row',
        primary_muscle: 'BACK',
        equipment: 'MACHINE',
        youtube_video_id: 'j3Igk5nyZE4',
        instructions: 'Isolate mid-back rhomboids and lower traps without lower back strain.'
      },

      // LEGS
      {
        id: 'barbell_back_squat',
        name: 'Barbell Back Squat',
        primary_muscle: 'LEGS',
        equipment: 'BARBELL',
        youtube_video_id: 'bEv6CCg2BC8',
        instructions: 'Bar resting on traps, break at hips and knees together, descend below parallel, drive up.'
      },
      {
        id: 'barbell_front_squat',
        name: 'Barbell Front Squat',
        primary_muscle: 'LEGS',
        equipment: 'BARBELL',
        youtube_video_id: 'tlfahNDnjps',
        instructions: 'Fingertip grip with high elbows, upright torso, maximum quadriceps overload.'
      },
      {
        id: 'romanian_deadlift',
        name: 'Romanian Deadlift (RDL)',
        primary_muscle: 'LEGS',
        equipment: 'BARBELL',
        youtube_video_id: 'jEy_czb3RKA',
        instructions: 'Soft knees, push hips back towards wall, bar travels along shins, deep hamstring stretch.'
      },
      {
        id: 'leg_press',
        name: '45° Heavy Leg Press',
        primary_muscle: 'LEGS',
        equipment: 'MACHINE',
        youtube_video_id: 'IZxyjW7MPJQ',
        instructions: 'Feet shoulder-width on platform, lower until 90° angle, do not lock knees at top lockout.'
      },
      {
        id: 'bulgarian_split_squat',
        name: 'Bulgarian Split Squat',
        primary_muscle: 'LEGS',
        equipment: 'DUMBBELL',
        youtube_video_id: '2C-uNgKwPLE',
        instructions: 'Rear foot elevated on bench, drop back knee down, drive through front heel for glutes & quads.'
      },
      {
        id: 'leg_extensions',
        name: 'Seated Leg Extensions',
        primary_muscle: 'LEGS',
        equipment: 'MACHINE',
        youtube_video_id: 'm0FOpMEgero',
        instructions: 'Pad above ankles, extend legs fully, hold 1-second peak contraction on rectus femoris.'
      },
      {
        id: 'lying_leg_curls',
        name: 'Lying Hamstring Curls',
        primary_muscle: 'LEGS',
        equipment: 'MACHINE',
        youtube_video_id: '1Tq3QdYUuHs',
        instructions: 'Keep hips pressed into bench, curl heels to glutes, control the 3-second eccentric descent.'
      },
      {
        id: 'standing_calf_raise',
        name: 'Standing Calf Raise',
        primary_muscle: 'LEGS',
        equipment: 'MACHINE',
        youtube_video_id: '-M4-G8p8fmc',
        instructions: 'Full stretch at bottom on toes, rise all the way up onto big toes, squeeze gastrocnemius.'
      },
      {
        id: 'barbell_hip_thrust',
        name: 'Barbell Hip Thrust',
        primary_muscle: 'LEGS',
        equipment: 'BARBELL',
        youtube_video_id: 'SEdqd1n0cvg',
        instructions: 'Upper back on bench, barbell across hips with pad, drive through heels into full hip extension.'
      },

      // SHOULDERS
      {
        id: 'overhead_barbell_press',
        name: 'Standing Overhead Press (OHP)',
        primary_muscle: 'SHOULDERS',
        equipment: 'BARBELL',
        youtube_video_id: '2yjwXTZQDDI',
        instructions: 'Tight glutes and core, press bar overhead vertically, head moves through window at top.'
      },
      {
        id: 'seated_db_shoulder_press',
        name: 'Seated Dumbbell Shoulder Press',
        primary_muscle: 'SHOULDERS',
        equipment: 'DUMBBELL',
        youtube_video_id: 'qEwKCR5JCog',
        instructions: 'Bench at 85°, press dumbbells upward in gentle arc, avoid banging dumbbells at peak.'
      },
      {
        id: 'lateral_raise',
        name: 'Dumbbell Lateral Raise',
        primary_muscle: 'SHOULDERS',
        equipment: 'DUMBBELL',
        youtube_video_id: '3VcKaXpzqRo',
        instructions: 'Slight forward lean, raise elbows to parallel with floor, pour water posture at top.'
      },
      {
        id: 'cable_lateral_raise',
        name: 'Behind-the-Back Cable Lateral Raise',
        primary_muscle: 'SHOULDERS',
        equipment: 'CABLE',
        youtube_video_id: 'PPrzBWZDOhA',
        instructions: 'Constant tension throughout entire range of motion on side lateral deltoids.'
      },
      {
        id: 'arnold_press',
        name: 'Arnold Dumbbell Press',
        primary_muscle: 'SHOULDERS',
        equipment: 'DUMBBELL',
        youtube_video_id: '6Z15_WdXmVw',
        instructions: 'Start with palms facing chest, rotate outwards while pressing overhead, hit all 3 heads.'
      },
      {
        id: 'rear_delt_flyes',
        name: 'Reverse Pec Deck Flyes',
        primary_muscle: 'SHOULDERS',
        equipment: 'MACHINE',
        youtube_video_id: '5yWtwvxmDlo',
        instructions: 'Chest against pad, pull handles back with rear deltoids, keep arms slightly bent.'
      },
      {
        id: 'barbell_shrugs',
        name: 'Heavy Barbell Shrugs',
        primary_muscle: 'SHOULDERS',
        equipment: 'BARBELL',
        youtube_video_id: 'cJRVVxmytaM',
        instructions: 'Elevate scapulae straight up to ears, do not roll shoulders, hold squeeze 2 seconds.'
      },

      // ARMS
      {
        id: 'barbell_bicep_curl',
        name: 'Barbell Bicep Curl',
        primary_muscle: 'ARMS',
        equipment: 'BARBELL',
        youtube_video_id: 'ykJmrZ5v0Oo',
        instructions: 'Elbows pinned to ribs, curl bar upward, avoid lower back swinging, squeeze peak biceps.'
      },
      {
        id: 'incline_dumbbell_curl',
        name: 'Incline Dumbbell Bicep Curl',
        primary_muscle: 'ARMS',
        equipment: 'DUMBBELL',
        youtube_video_id: 'soxrZlIl35U',
        instructions: 'Bench at 60°, arms hang behind torso, deep stretch on long head of biceps.'
      },
      {
        id: 'hammer_curls',
        name: 'Neutral Grip Hammer Curls',
        primary_muscle: 'ARMS',
        equipment: 'DUMBBELL',
        youtube_video_id: 'zC3nLlEvin4',
        instructions: 'Palms facing each other, curls isolate brachialis and forearm brachioradialis.'
      },
      {
        id: 'preacher_curl',
        name: 'EZ-Bar Preacher Curl',
        primary_muscle: 'ARMS',
        equipment: 'BARBELL',
        youtube_video_id: 'fIWP-FRFNU0',
        instructions: 'Armpits over bench pad, eliminates shoulder recruitment, isolates lower bicep peak.'
      },
      {
        id: 'cable_tricep_pushdown',
        name: 'Cable Triceps Pushdown',
        primary_muscle: 'ARMS',
        equipment: 'CABLE',
        youtube_video_id: '2-LAMcpzODU',
        instructions: 'Elbows locked at side, push bar/rope down until triceps fully lock out, control eccentric.'
      },
      {
        id: 'skull_crushers',
        name: 'EZ-Bar Skull Crushers (Lying Ext)',
        primary_muscle: 'ARMS',
        equipment: 'BARBELL',
        youtube_video_id: 'd_KZxkY_0aw',
        instructions: 'Elbows angled slightly backwards, lower bar to forehead/crown, press up with triceps.'
      },
      {
        id: 'overhead_cable_tricep_ext',
        name: 'Overhead Rope Tricep Extension',
        primary_muscle: 'ARMS',
        equipment: 'CABLE',
        youtube_video_id: '_gsUokN_Abg',
        instructions: 'Deep stretch on long head of triceps, extend hands forward and flare rope outwards.'
      },
      {
        id: 'close_grip_bench_press',
        name: 'Close-Grip Bench Press',
        primary_muscle: 'ARMS',
        equipment: 'BARBELL',
        youtube_video_id: 'nEF0bv2FW94',
        instructions: 'Hands shoulder-width apart, elbows tucked against body, heavy tricep mass builder.'
      },

      // CORE
      {
        id: 'hanging_leg_raise',
        name: 'Hanging Leg Raise',
        primary_muscle: 'CORE',
        equipment: 'BODYWEIGHT',
        youtube_video_id: 'hdng3Nm1x_E',
        instructions: 'Dead hang from pull-up bar, curl pelvis upward, raise knees or toes to parallel without swinging.'
      },
      {
        id: 'ab_wheel_rollout',
        name: 'Ab Wheel Rollout',
        primary_muscle: 'CORE',
        equipment: 'BODYWEIGHT',
        youtube_video_id: 'rqiTPdK1cjg',
        instructions: 'Kneel on floor, roll wheel forward keeping posterior pelvic tilt, pull back using rectus abdominis.'
      },
      {
        id: 'cable_woodchopper',
        name: 'Cable High-to-Low Woodchoppers',
        primary_muscle: 'CORE',
        equipment: 'CABLE',
        youtube_video_id: 'pAplQXk3dkU',
        instructions: 'Rotate torso diagonally across body, brace obliques and transverse abdominis.'
      },
      {
        id: 'cable_rope_crunch',
        name: 'Kneeling Cable Rope Crunch',
        primary_muscle: 'CORE',
        equipment: 'CABLE',
        youtube_video_id: '2fouroT_jDA',
        instructions: 'Kneel holding rope at temples, curl ribcage towards pelvis, do not sit back on heels.'
      },
      {
        id: 'weighted_plank',
        name: 'Core Isometric Plank',
        primary_muscle: 'CORE',
        equipment: 'BODYWEIGHT',
        youtube_video_id: 'pSHjTRCQxIw',
        instructions: 'Forearms on floor, squeeze glutes, pull elbows toward toes isometrically.'
      }
    ];

    for (const ex of defaultExercises) {
      db.runSync(
        `INSERT OR REPLACE INTO exercises (id, name, primary_muscle, equipment, youtube_video_id, instructions) VALUES (?, ?, ?, ?, ?, ?)`,
        [ex.id, ex.name, ex.primary_muscle, ex.equipment, ex.youtube_video_id, ex.instructions]
      );
    }
  }
};

/**
 * 1RM Estimator (NSCA / ACSM hybrid formula)
 */
export const calculate1RM = (weightKg: number, reps: number): number => {
  if (reps <= 0 || weightKg <= 0) return 0;
  if (reps === 1) return weightKg;
  if (reps <= 10) {
    return Math.round(weightKg * (1 + reps / 30));
  }
  const cappedReps = Math.min(30, reps);
  return Math.round(weightKg * (36 / (37 - cappedReps)));
};

// Check PR & Log Set Locally
export const logGymSet = (
  exerciseId: string,
  weightKg: number,
  reps: number,
  velocityMs: number,
  rpe: number = 8,
  sessionId?: number | null
): { isPR: boolean; estimated1RM: number } => {
  const current1RM = calculate1RM(weightKg, reps);

  const previousSets = db.getAllSync<{ weight_kg: number; reps: number }>(
    `SELECT weight_kg, reps FROM workout_sets WHERE exercise_id = ?`,
    [exerciseId]
  );

  let maxPrevious1RM = 0;
  for (const s of previousSets) {
    const orm = calculate1RM(s.weight_kg, s.reps);
    if (orm > maxPrevious1RM) maxPrevious1RM = orm;
  }

  const isPR = (current1RM > maxPrevious1RM && previousSets.length > 0) || (previousSets.length === 0 && weightKg > 0);

  db.runSync(
    `INSERT INTO workout_sets (session_id, exercise_id, weight_kg, reps, rpe, is_pr, velocity_ms, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [sessionId || null, exerciseId, weightKg, reps, rpe, isPR ? 1 : 0, velocityMs, Date.now()]
  );

  return { isPR, estimated1RM: current1RM };
};

// Save Completed Workout Session
export const saveWorkoutSession = (session: Omit<WorkoutSession, 'id'>): number => {
  const res = db.runSync(
    `INSERT INTO workout_sessions (start_time, end_time, duration_seconds, total_volume_kg, total_sets, prs_count, calories_burned, workout_type, created_date_str)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      session.start_time,
      session.end_time,
      session.duration_seconds,
      session.total_volume_kg,
      session.total_sets,
      session.prs_count,
      session.calories_burned,
      session.workout_type,
      session.created_date_str,
    ]
  );
  return Number(res.lastInsertRowId);
};

// Get Recent Completed Sessions
export const getRecentWorkoutSessions = (limit: number = 10): WorkoutSession[] => {
  return db.getAllSync<WorkoutSession>(
    `SELECT * FROM workout_sessions ORDER BY id DESC LIMIT ?`,
    [limit]
  );
};

// Delete a set
export const deleteGymSet = (setId: number): boolean => {
  try {
    db.runSync('DELETE FROM workout_sets WHERE id = ?', [setId]);
    return true;
  } catch (e) {
    console.error('Failed to delete set:', e);
    return false;
  }
};

// Delete a meal
export const deleteMealLog = (mealId: number): boolean => {
  try {
    db.runSync('DELETE FROM meal_logs WHERE id = ?', [mealId]);
    return true;
  } catch (e) {
    console.error('Failed to delete meal:', e);
    return false;
  }
};

export interface DailyGymSummary {
  totalVolumeKg: number;
  totalSets: number;
  prCount: number;
  lastWorkoutTimestamp: number | null;
}

export const getDailyGymSummary = (): DailyGymSummary => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTs = startOfDay.getTime();

  const row = db.getFirstSync<{
    volume: number | null;
    sets: number;
    prs: number;
    latest: number | null;
  }>(
    `SELECT
       SUM(weight_kg * reps) as volume,
       COUNT(*) as sets,
       SUM(is_pr) as prs,
       MAX(completed_at) as latest
     FROM workout_sets
     WHERE completed_at >= ?`,
    [startTs]
  );

  return {
    totalVolumeKg: Math.round(row?.volume || 0),
    totalSets: row?.sets || 0,
    prCount: row?.prs || 0,
    lastWorkoutTimestamp: row?.latest || null,
  };
};

export interface SetWithExercise extends SetLog {
  exercise_name: string;
  primary_muscle: string;
}

export const getTodaySets = (): SetWithExercise[] => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTs = startOfDay.getTime();

  return db.getAllSync<SetWithExercise>(
    `SELECT w.*, e.name as exercise_name, e.primary_muscle
     FROM workout_sets w
     JOIN exercises e ON w.exercise_id = e.id
     WHERE w.completed_at >= ?
     ORDER BY w.completed_at DESC`,
    [startTs]
  );
};

export interface ExerciseHistorySummary {
  lastSet: { weight_kg: number; reps: number; rpe: number; completed_at: number } | null;
  bestSet: { weight_kg: number; reps: number; est1RM: number } | null;
  totalSetsLogged: number;
  todaySets: SetWithExercise[];
}

export const getExerciseHistorySummary = (exerciseId: string): ExerciseHistorySummary => {
  if (!exerciseId) {
    return { lastSet: null, bestSet: null, totalSetsLogged: 0, todaySets: [] };
  }

  const sets = db.getAllSync<{
    id: number;
    weight_kg: number;
    reps: number;
    rpe: number;
    completed_at: number;
    is_pr: number;
    velocity_ms: number;
  }>(
    `SELECT * FROM workout_sets WHERE exercise_id = ? ORDER BY completed_at DESC, id DESC`,
    [exerciseId]
  );

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTs = startOfDay.getTime();

  let lastSet: ExerciseHistorySummary['lastSet'] = null;
  let bestSet: ExerciseHistorySummary['bestSet'] = null;
  let max1RM = 0;

  for (const s of sets) {
    if (!lastSet) {
      lastSet = {
        weight_kg: s.weight_kg,
        reps: s.reps,
        rpe: s.rpe,
        completed_at: s.completed_at,
      };
    }
    const orm = calculate1RM(s.weight_kg, s.reps);
    if (orm > max1RM) {
      max1RM = orm;
      bestSet = {
        weight_kg: s.weight_kg,
        reps: s.reps,
        est1RM: orm,
      };
    }
  }

  const todaySets = db.getAllSync<SetWithExercise>(
    `SELECT w.*, COALESCE(e.name, w.exercise_id) as exercise_name, COALESCE(e.primary_muscle, 'OTHER') as primary_muscle
     FROM workout_sets w
     LEFT JOIN exercises e ON w.exercise_id = e.id
     WHERE w.exercise_id = ? AND w.completed_at >= ?
     ORDER BY w.completed_at ASC, w.id ASC`,
    [exerciseId, startTs]
  );

  return {
    lastSet,
    bestSet,
    totalSetsLogged: sets.length,
    todaySets,
  };
};

export const getUserProfile = (): UserProfile => {
  const row = db.getFirstSync<UserSettings>(
    `SELECT * FROM user_settings WHERE id = 1`
  );

  return {
    userName: row?.user_name || 'Alex Carter',
    athleteNickname: row?.athlete_nickname || 'Apex Lifter',
    gender: row?.gender || 'Male',
    ageYears: row?.age_years || 26,
    bodyWeightKg: row?.body_weight_kg || 75.0,
    heightCm: row?.height_cm || 178.0,
    bodyFatPct: row?.body_fat_pct || 15.0,
    weightUnit: row?.weight_unit || 'KG',
    heightUnit: row?.height_unit || 'CM',
    fitnessGoal: row?.fitness_goal || 'Hypertrophy & Muscle Building',
    experienceLevel: row?.experience_level || 'Intermediate',
    weeklyWorkoutDaysTarget: row?.weekly_workout_days_target || 5,
    preferredSplit: row?.preferred_split || 'Push / Pull / Legs (PPL)',
    availableEquipment: row?.available_equipment || 'Commercial Gym',
    targetWorkoutDurationMin: row?.target_workout_duration_min || 60,
    targetVolumeKg: row?.target_volume_kg || 5000,
    targetSets: row?.target_sets || 20,
    targetCalories: row?.target_calories || 2400,
    targetProtein: row?.target_protein || 160,
    targetCarbs: row?.target_carbs || 250,
    targetFat: row?.target_fat || 70,
    targetWaterMl: row?.target_water_ml || 3000,
    targetSleepHours: row?.target_sleep_hours || 8.0,
    defaultRestSeconds: row?.default_rest_seconds || 90,
    autoRestTimer: row?.auto_rest_timer !== undefined ? Boolean(row.auto_rest_timer) : true,
    soundAlerts: row?.sound_alerts !== undefined ? Boolean(row.sound_alerts) : true,
    hapticFeedback: row?.haptic_feedback !== undefined ? Boolean(row.haptic_feedback) : true,
    aiCoachPersona: row?.ai_coach_persona || 'Evidence-Based Sports Scientist',
    themeMode: row?.theme_mode || 'MIDNIGHT_OLED',
    barWeightKg: row?.bar_weight_kg || 20,
    geminiApiKey: row?.gemini_api_key || '',
    avatarColor: row?.avatar_color || '#30D158',
    profileImageUri: row?.profile_image_uri || null,
    hasCompletedOnboarding: Boolean(row?.has_completed_onboarding),
    targetDailySteps: row?.target_daily_steps || 10000,
    targetRestingHr: row?.target_resting_hr || 60,
    recoverySleepHours: row?.recovery_sleep_hours !== undefined && row.recovery_sleep_hours !== null ? Number(row.recovery_sleep_hours) : 7.5,
    recoverySoreness: (row?.recovery_soreness as any) || 'MILD',
    recoveryChecklist: (() => {
      try {
        return row?.recovery_checklist_json
          ? JSON.parse(row.recovery_checklist_json)
          : { sleep: true, hydration: false, mobility: false, protein: true, coldReset: false };
      } catch {
        return { sleep: true, hydration: false, mobility: false, protein: true, coldReset: false };
      }
    })(),
  };
};

export const checkHasCompletedOnboarding = (): boolean => {
  const row = db.getFirstSync<{ has_completed_onboarding?: number }>(
    `SELECT has_completed_onboarding FROM user_settings WHERE id = 1`
  );
  return Boolean(row?.has_completed_onboarding);
};

export const completeOnboarding = (profileData: Partial<UserProfile>): UserProfile => {
  saveUserProfile({
    ...profileData,
    hasCompletedOnboarding: true,
  });
  db.runSync(`UPDATE user_settings SET has_completed_onboarding = 1 WHERE id = 1`);
  return getUserProfile();
};

export const saveUserProfile = (profile: Partial<UserProfile>): void => {
  const current = getUserProfile();
  const merged = { ...current, ...profile };

  // Ensure row 1 exists
  db.runSync(
    `INSERT OR IGNORE INTO user_settings (id, theme_mode, bar_weight_kg) VALUES (1, 'MIDNIGHT_OLED', 20);`
  );

  db.runSync(
    `UPDATE user_settings SET
      user_name = ?,
      athlete_nickname = ?,
      gender = ?,
      age_years = ?,
      body_weight_kg = ?,
      height_cm = ?,
      body_fat_pct = ?,
      weight_unit = ?,
      height_unit = ?,
      fitness_goal = ?,
      experience_level = ?,
      weekly_workout_days_target = ?,
      preferred_split = ?,
      available_equipment = ?,
      target_workout_duration_min = ?,
      target_volume_kg = ?,
      target_sets = ?,
      target_calories = ?,
      target_protein = ?,
      target_carbs = ?,
      target_fat = ?,
      target_water_ml = ?,
      target_sleep_hours = ?,
      default_rest_seconds = ?,
      auto_rest_timer = ?,
      sound_alerts = ?,
      haptic_feedback = ?,
      ai_coach_persona = ?,
      avatar_color = ?,
      bar_weight_kg = ?,
      gemini_api_key = ?,
      profile_image_uri = ?,
      has_completed_onboarding = ?,
      target_daily_steps = ?,
      target_resting_hr = ?,
      theme_mode = ?,
      recovery_sleep_hours = ?,
      recovery_soreness = ?,
      recovery_checklist_json = ?
     WHERE id = 1`,
    [
      merged.userName,
      merged.athleteNickname,
      merged.gender,
      Math.max(12, Math.min(100, Number(merged.ageYears) || 26)),
      Number(merged.bodyWeightKg) || 75.0,
      Number(merged.heightCm) || 178.0,
      Number(merged.bodyFatPct) || 15.0,
      merged.weightUnit,
      merged.heightUnit,
      merged.fitnessGoal,
      merged.experienceLevel,
      Math.max(1, Math.min(7, Number(merged.weeklyWorkoutDaysTarget) || 5)),
      merged.preferredSplit,
      merged.availableEquipment,
      Math.max(15, Math.min(180, Number(merged.targetWorkoutDurationMin) || 60)),
      Math.max(500, Number(merged.targetVolumeKg) || 5000),
      Math.max(1, Number(merged.targetSets) || 20),
      Math.max(500, Number(merged.targetCalories) || 2400),
      Math.max(20, Number(merged.targetProtein) || 160),
      Math.max(20, Number(merged.targetCarbs) || 250),
      Math.max(10, Number(merged.targetFat) || 70),
      Math.max(500, Number(merged.targetWaterMl) || 3000),
      Number(merged.targetSleepHours) || 8.0,
      Math.max(15, Number(merged.defaultRestSeconds) || 90),
      merged.autoRestTimer ? 1 : 0,
      merged.soundAlerts ? 1 : 0,
      merged.hapticFeedback ? 1 : 0,
      merged.aiCoachPersona,
      merged.avatarColor,
      merged.barWeightKg,
      merged.geminiApiKey,
      merged.profileImageUri ?? null,
      merged.hasCompletedOnboarding ? 1 : 0,
      Number(merged.targetDailySteps) || 10000,
      Number(merged.targetRestingHr) || 60,
      merged.themeMode || 'MIDNIGHT_OLED',
      Number(merged.recoverySleepHours) || 7.5,
      merged.recoverySoreness || 'MILD',
      JSON.stringify(merged.recoveryChecklist || { sleep: true, hydration: false, mobility: false, protein: true, coldReset: false }),
    ]
  );
};

export const saveDailyTargets = (targets: {
  targetVolumeKg?: number;
  targetSets?: number;
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;
  targetWaterMl?: number;
  targetDailySteps?: number;
}): UserProfile => {
  const current = getUserProfile();
  const updated: Partial<UserProfile> = {
    targetVolumeKg: targets.targetVolumeKg !== undefined ? Math.max(500, targets.targetVolumeKg) : current.targetVolumeKg,
    targetSets: targets.targetSets !== undefined ? Math.max(1, targets.targetSets) : current.targetSets,
    targetCalories: targets.targetCalories !== undefined ? Math.max(500, targets.targetCalories) : current.targetCalories,
    targetProtein: targets.targetProtein !== undefined ? Math.max(20, targets.targetProtein) : current.targetProtein,
    targetCarbs: targets.targetCarbs !== undefined ? Math.max(20, targets.targetCarbs) : current.targetCarbs,
    targetFat: targets.targetFat !== undefined ? Math.max(10, targets.targetFat) : current.targetFat,
    targetWaterMl: targets.targetWaterMl !== undefined ? Math.max(500, targets.targetWaterMl) : current.targetWaterMl,
    targetDailySteps: targets.targetDailySteps !== undefined ? Math.max(1000, targets.targetDailySteps) : current.targetDailySteps,
  };
  saveUserProfile(updated);
  return getUserProfile();
};

export const saveRecoverySettings = (settings: {
  sleepHours?: number;
  soreness?: 'NONE' | 'MILD' | 'SORE' | 'SEVERE';
  checklist?: Record<string, boolean>;
}): UserProfile => {
  try {
    if (settings.sleepHours !== undefined) {
      db.runSync('UPDATE user_settings SET recovery_sleep_hours = ? WHERE id = 1', [settings.sleepHours]);
    }
    if (settings.soreness !== undefined) {
      db.runSync('UPDATE user_settings SET recovery_soreness = ? WHERE id = 1', [settings.soreness]);
    }
    if (settings.checklist !== undefined) {
      db.runSync('UPDATE user_settings SET recovery_checklist_json = ? WHERE id = 1', [JSON.stringify(settings.checklist)]);
    }
  } catch (e) {
    console.error('Failed to save recovery settings:', e);
  }
  return getUserProfile();
};

export interface AthleteCalculatedMetrics {
  bmr: number;
  tdee: number;
  suggestedCalories: number;
  suggestedProtein: number;
  suggestedCarbs: number;
  suggestedFat: number;
  suggestedVolumeKg: number;
  suggestedSets: number;
  suggestedWaterMl: number;
  bmi: number;
  bmiCategory: string;
}

export const calculateAthleteMetrics = (p: Partial<UserProfile>): AthleteCalculatedMetrics => {
  const weight = Number(p.bodyWeightKg) || 75;
  const height = Number(p.heightCm) || 178;
  const age = Number(p.ageYears) || 26;
  const gender = p.gender || 'Male';
  const goal = p.fitnessGoal || 'Hypertrophy & Muscle Building';
  const exp = p.experienceLevel || 'Intermediate';
  const daysPerWeek = Number(p.weeklyWorkoutDaysTarget) || 5;

  // Mifflin-St Jeor BMR
  let bmr = 10 * weight + 6.25 * height - 5 * age;
  if (gender === 'Female') {
    bmr -= 161;
  } else if (gender === 'Male') {
    bmr += 5;
  } else {
    bmr -= 78;
  }
  bmr = Math.round(bmr);

  // Activity / TDEE multiplier
  let activityMultiplier = 1.35;
  if (daysPerWeek >= 6) {
    activityMultiplier = 1.725;
  } else if (daysPerWeek >= 4) {
    activityMultiplier = 1.55;
  } else if (daysPerWeek >= 3) {
    activityMultiplier = 1.45;
  }

  if (exp === 'Advanced' || exp === 'Elite / Pro') {
    activityMultiplier += 0.05;
  }

  const tdee = Math.round(bmr * activityMultiplier);

  // BMI
  const heightM = height / 100;
  const bmi = heightM > 0 ? parseFloat((weight / (heightM * heightM)).toFixed(1)) : 23.5;
  let bmiCategory = 'Normal Weight';
  if (bmi < 18.5) bmiCategory = 'Underweight';
  else if (bmi >= 25 && bmi < 29.9) bmiCategory = 'Overweight';
  else if (bmi >= 30) bmiCategory = 'Athletic / High Mass';

  // Goal-specific recommendations
  let suggestedCalories = tdee;
  let proteinRatio = 2.0;
  let suggestedVolumeKg = Math.round(weight * 75);
  let suggestedSets = 20;

  if (goal.includes('Hypertrophy') || goal.includes('Muscle')) {
    suggestedCalories = tdee + 250;
    proteinRatio = 2.0;
    suggestedVolumeKg = Math.round(weight * 80);
    suggestedSets = 22;
  } else if (goal.includes('Strength') || goal.includes('Powerlifting')) {
    suggestedCalories = tdee + 150;
    proteinRatio = 1.8;
    suggestedVolumeKg = Math.round(weight * 95);
    suggestedSets = 20;
  } else if (goal.includes('Fat Loss') || goal.includes('Cutting') || goal.includes('Conditioning')) {
    suggestedCalories = Math.max(1400, tdee - 500);
    proteinRatio = 2.2;
    suggestedVolumeKg = Math.round(weight * 60);
    suggestedSets = 18;
  } else if (goal.includes('Recomposition')) {
    suggestedCalories = tdee;
    proteinRatio = 2.1;
    suggestedVolumeKg = Math.round(weight * 70);
    suggestedSets = 20;
  } else {
    suggestedCalories = tdee;
    proteinRatio = 1.6;
    suggestedVolumeKg = Math.round(weight * 50);
    suggestedSets = 16;
  }

  const suggestedProtein = Math.round(weight * proteinRatio);
  const fatCalories = suggestedCalories * 0.25;
  const suggestedFat = Math.round(fatCalories / 9);
  const remainingCaloriesForCarbs = Math.max(0, suggestedCalories - (suggestedProtein * 4) - fatCalories);
  const suggestedCarbs = Math.round(remainingCaloriesForCarbs / 4);

  const suggestedWaterMl = Math.round((weight * 40) / 250) * 250;

  return {
    bmr,
    tdee,
    suggestedCalories: Math.round(suggestedCalories),
    suggestedProtein,
    suggestedCarbs,
    suggestedFat,
    suggestedVolumeKg: Math.max(1000, Math.round(suggestedVolumeKg / 500) * 500),
    suggestedSets,
    suggestedWaterMl: Math.max(2000, suggestedWaterMl),
    bmi,
    bmiCategory,
  };
};

export interface WeeklyConsistency {
  completedDays: number;
  targetDays: number;
  percentage: number;
  daysActive: { [dayIndex: number]: boolean };
}

export const getWeeklyConsistency = (targetDays: number = 5): WeeklyConsistency => {
  const now = new Date();
  const dayOfWeek = (now.getDay() + 6) % 7; // 0 = Mon, 6 = Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - dayOfWeek);
  monday.setHours(0, 0, 0, 0);

  const mondayTs = monday.getTime();

  const sessions = db.getAllSync<{ created_date_str: string; start_time: number }>(
    `SELECT created_date_str, start_time FROM workout_sessions WHERE start_time >= ?`,
    [mondayTs]
  );

  const sets = db.getAllSync<{ completed_at: number }>(
    `SELECT completed_at FROM workout_sets WHERE completed_at >= ?`,
    [mondayTs]
  );

  const daysActive: { [dayIndex: number]: boolean } = {
    0: false, 1: false, 2: false, 3: false, 4: false, 5: false, 6: false
  };

  const markDay = (timestamp: number) => {
    const d = new Date(timestamp);
    const dIdx = (d.getDay() + 6) % 7;
    daysActive[dIdx] = true;
  };

  sessions.forEach(s => markDay(s.start_time));
  sets.forEach(s => markDay(s.completed_at));

  const completedDays = Object.values(daysActive).filter(Boolean).length;
  const percentage = Math.min(100, Math.round((completedDays / Math.max(1, targetDays)) * 100));

  return {
    completedDays,
    targetDays,
    percentage,
    daysActive,
  };
};

export const getTodayWaterMl = (): number => {
  const todayStr = new Date().toISOString().split('T')[0];
  const row = db.getFirstSync<{ amount_ml: number }>(
    `SELECT amount_ml FROM water_logs WHERE date_str = ?`,
    [todayStr]
  );
  return row?.amount_ml || 0;
};

export const addWaterMl = (deltaMl: number): number => {
  const todayStr = new Date().toISOString().split('T')[0];
  db.runSync(
    `INSERT INTO water_logs (date_str, amount_ml) VALUES (?, ?)
     ON CONFLICT(date_str) DO UPDATE SET amount_ml = MAX(0, amount_ml + ?)`,
    [todayStr, Math.max(0, deltaMl), deltaMl]
  );
  return getTodayWaterMl();
};

export const resetTodayWaterMl = (): void => {
  const todayStr = new Date().toISOString().split('T')[0];
  db.runSync(
    `INSERT INTO water_logs (date_str, amount_ml) VALUES (?, 0)
     ON CONFLICT(date_str) DO UPDATE SET amount_ml = 0`,
    [todayStr]
  );
};

export interface HourlyDensityBucket {
  hourStart: number;
  label: string;
  volumeKg: number;
  setsCount: number;
  fillPercent: number;
  isPeak: boolean;
}

export const getHourlyTrainingDensity = (): HourlyDensityBucket[] => {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const startTs = startOfDay.getTime();

  const buckets: HourlyDensityBucket[] = [
    { hourStart: 0, label: '12A', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 2, label: '2A', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 4, label: '4A', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 6, label: '6A', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 8, label: '8A', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 10, label: '10A', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 12, label: '12P', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 14, label: '2P', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 16, label: '4P', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 18, label: '6P', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 20, label: '8P', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
    { hourStart: 22, label: '10P', volumeKg: 0, setsCount: 0, fillPercent: 0, isPeak: false },
  ];

  const sets = db.getAllSync<{ completed_at: number; weight_kg: number; reps: number }>(
    `SELECT completed_at, weight_kg, reps FROM workout_sets WHERE completed_at >= ?`,
    [startTs]
  );

  for (const s of sets) {
    const d = new Date(s.completed_at);
    const hour = d.getHours();
    const bucketIndex = Math.min(11, Math.floor(hour / 2));
    buckets[bucketIndex].volumeKg += s.weight_kg * s.reps;
    buckets[bucketIndex].setsCount += 1;
  }

  let maxVol = 0;
  for (const b of buckets) {
    if (b.volumeKg > maxVol) maxVol = b.volumeKg;
  }

  for (const b of buckets) {
    if (maxVol > 0 && b.volumeKg > 0) {
      b.fillPercent = Math.max(14, Math.round((b.volumeKg / maxVol) * 100));
      b.isPeak = b.volumeKg === maxVol;
    } else {
      b.fillPercent = 6;
    }
  }

  return buckets;
};

export const getWorkoutAlarms = (): WorkoutAlarm[] => {
  const rows = db.getAllSync<{
    id: number;
    title: string;
    time_str: string;
    period: string;
    days_json: string;
    is_active: number;
    sound_enabled: number;
    created_at: number;
  }>('SELECT * FROM workout_alarms ORDER BY id ASC');

  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    timeStr: r.time_str,
    period: (r.period as 'AM' | 'PM') || 'AM',
    days: JSON.parse(r.days_json || '[]'),
    isActive: Boolean(r.is_active),
    soundEnabled: Boolean(r.sound_enabled),
    createdAt: r.created_at,
  }));
};

export const addWorkoutAlarm = (alarm: {
  title: string;
  timeStr: string;
  period: 'AM' | 'PM';
  days: number[];
  soundEnabled?: boolean;
}): WorkoutAlarm[] => {
  db.runSync(
    `INSERT INTO workout_alarms (title, time_str, period, days_json, is_active, sound_enabled, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    [
      alarm.title.trim() || 'Workout Session',
      alarm.timeStr,
      alarm.period,
      JSON.stringify(alarm.days),
      alarm.soundEnabled !== false ? 1 : 0,
      Date.now(),
    ]
  );
  try {
    db.runSync('UPDATE user_settings SET has_seeded_workout_alarms = 1 WHERE id = 1');
  } catch {}
  return getWorkoutAlarms();
};

export const toggleWorkoutAlarm = (id: number, isActive: boolean): WorkoutAlarm[] => {
  db.runSync('UPDATE workout_alarms SET is_active = ? WHERE id = ?', [isActive ? 1 : 0, id]);
  return getWorkoutAlarms();
};

export const updateWorkoutAlarm = (
  id: number,
  alarm: {
    title: string;
    timeStr: string;
    period: 'AM' | 'PM';
    days: number[];
    soundEnabled?: boolean;
    isActive?: boolean;
  }
): WorkoutAlarm[] => {
  db.runSync(
    `UPDATE workout_alarms
     SET title = ?, time_str = ?, period = ?, days_json = ?, sound_enabled = ?, is_active = ?
     WHERE id = ?`,
    [
      alarm.title.trim() || 'Workout Session',
      alarm.timeStr,
      alarm.period,
      JSON.stringify(alarm.days),
      alarm.soundEnabled !== false ? 1 : 0,
      alarm.isActive !== false ? 1 : 0,
      id,
    ]
  );
  return getWorkoutAlarms();
};

export const deleteWorkoutAlarm = (id: number): WorkoutAlarm[] => {
  db.runSync('DELETE FROM workout_alarms WHERE id = ?', [id]);
  try {
    db.runSync('UPDATE user_settings SET has_seeded_workout_alarms = 1 WHERE id = 1');
  } catch {}
  return getWorkoutAlarms();
};

/* ================= STEP TRACKER QUERIES ================= */
export const getTodayStepLog = (dateStr?: string): StepLog => {
  const dStr = dateStr || new Date().toISOString().split('T')[0];
  const row = db.getFirstSync<{
    date_str: string;
    steps: number;
    distance_km: number;
    calories_burned: number;
    active_duration_min: number;
  }>('SELECT * FROM step_logs WHERE date_str = ?', [dStr]);

  if (row) {
    return {
      date_str: row.date_str,
      steps: row.steps || 0,
      distance_km: row.distance_km || 0.0,
      calories_burned: row.calories_burned || 0,
      active_duration_min: row.active_duration_min || 0,
    };
  }

  return {
    date_str: dStr,
    steps: 0,
    distance_km: 0.0,
    calories_burned: 0,
    active_duration_min: 0,
  };
};

export const saveTodayStepLog = (
  steps: number,
  distanceKm: number,
  caloriesBurned: number,
  activeDurationMin: number,
  dateStr?: string
): StepLog => {
  const dStr = dateStr || new Date().toISOString().split('T')[0];
  db.runSync(
    `INSERT INTO step_logs (date_str, steps, distance_km, calories_burned, active_duration_min, updated_at)
     VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(date_str) DO UPDATE SET
       steps = excluded.steps,
       distance_km = excluded.distance_km,
       calories_burned = excluded.calories_burned,
       active_duration_min = excluded.active_duration_min,
       updated_at = CURRENT_TIMESTAMP`,
    [dStr, steps, distanceKm, caloriesBurned, activeDurationMin]
  );
  return getTodayStepLog(dStr);
};

/* ================= WELLNESS & CAMERA PPG QUERIES ================= */
export const saveWellnessReading = (reading: {
  heartRateBpm: number;
  hrvRmssd: number;
  wellnessScore: number;
  stateLabel: string;
  notes?: string;
  dateStr?: string;
}): WellnessReading => {
  const dStr = reading.dateStr || new Date().toISOString().split('T')[0];
  const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const result = db.runSync(
    `INSERT INTO wellness_biometrics (date_str, timestamp, heart_rate_bpm, hrv_rmssd, wellness_score, state_label, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      dStr,
      ts,
      reading.heartRateBpm,
      reading.hrvRmssd,
      reading.wellnessScore,
      reading.stateLabel,
      reading.notes || '',
    ]
  );

  return {
    id: result.lastInsertRowId,
    dateStr: dStr,
    timestamp: ts,
    heartRateBpm: reading.heartRateBpm,
    hrvRmssd: reading.hrvRmssd,
    wellnessScore: reading.wellnessScore,
    stateLabel: reading.stateLabel,
    notes: reading.notes,
  };
};

export const getLatestWellnessReading = (): WellnessReading | null => {
  const row = db.getFirstSync<{
    id: number;
    date_str: string;
    timestamp: string;
    heart_rate_bpm: number;
    hrv_rmssd: number;
    wellness_score: number;
    state_label: string;
    notes: string;
  }>('SELECT * FROM wellness_biometrics ORDER BY id DESC LIMIT 1');

  if (!row) return null;

  return {
    id: row.id,
    dateStr: row.date_str,
    timestamp: row.timestamp,
    heartRateBpm: row.heart_rate_bpm,
    hrvRmssd: row.hrv_rmssd,
    wellnessScore: row.wellness_score,
    stateLabel: row.state_label,
    notes: row.notes,
  };
};

export const getRecentWellnessHistory = (limit: number = 7): WellnessReading[] => {
  const rows = db.getAllSync<{
    id: number;
    date_str: string;
    timestamp: string;
    heart_rate_bpm: number;
    hrv_rmssd: number;
    wellness_score: number;
    state_label: string;
    notes: string;
  }>('SELECT * FROM wellness_biometrics ORDER BY id DESC LIMIT ?', [limit]);

  return rows.map((r) => ({
    id: r.id,
    dateStr: r.date_str,
    timestamp: r.timestamp,
    heartRateBpm: r.heart_rate_bpm,
    hrvRmssd: r.hrv_rmssd,
    wellnessScore: r.wellness_score,
    stateLabel: r.state_label,
    notes: r.notes,
  }));
};

/* ================= ENVIRONMENTAL & THERMAL RECOVERY QUERIES ================= */
export const saveEnvironmentalReading = (reading: {
  tempC: number;
  humidityPct: number;
  pressureHpa: number;
  heatIndexC: number;
  thermalStatus: string;
  recoveryImpactScore: number;
  notes?: string;
  dateStr?: string;
}): EnvironmentalLog => {
  const dStr = reading.dateStr || new Date().toISOString().split('T')[0];
  const ts = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  const result = db.runSync(
    `INSERT INTO environmental_logs (date_str, timestamp, temp_c, humidity_pct, pressure_hpa, heat_index_c, thermal_status, recovery_impact_score, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dStr,
      ts,
      reading.tempC,
      reading.humidityPct,
      reading.pressureHpa,
      reading.heatIndexC,
      reading.thermalStatus,
      reading.recoveryImpactScore,
      reading.notes || '',
    ]
  );

  return {
    id: result.lastInsertRowId,
    dateStr: dStr,
    timestamp: ts,
    tempC: reading.tempC,
    humidityPct: reading.humidityPct,
    pressureHpa: reading.pressureHpa,
    heatIndexC: reading.heatIndexC,
    thermalStatus: reading.thermalStatus,
    recoveryImpactScore: reading.recoveryImpactScore,
    notes: reading.notes,
  };
};

export const getLatestEnvironmentalReading = (): EnvironmentalLog | null => {
  const row = db.getFirstSync<{
    id: number;
    date_str: string;
    timestamp: string;
    temp_c: number;
    humidity_pct: number;
    pressure_hpa: number;
    heat_index_c: number;
    thermal_status: string;
    recovery_impact_score: number;
    notes: string;
  }>('SELECT * FROM environmental_logs ORDER BY id DESC LIMIT 1');

  if (!row) return null;

  return {
    id: row.id,
    dateStr: row.date_str,
    timestamp: row.timestamp,
    tempC: row.temp_c,
    humidityPct: row.humidity_pct,
    pressureHpa: row.pressure_hpa,
    heatIndexC: row.heat_index_c,
    thermalStatus: row.thermal_status,
    recoveryImpactScore: row.recovery_impact_score,
    notes: row.notes,
  };
};

export const getRecoveryTrends = (days: number = 7): RecoveryTrendPoint[] => {
  const result: RecoveryTrendPoint[] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = dayNames[d.getDay()];

    const wellness = db.getFirstSync<{ heart_rate_bpm: number; hrv_rmssd: number; wellness_score: number }>(
      'SELECT heart_rate_bpm, hrv_rmssd, wellness_score FROM wellness_biometrics WHERE date_str = ? ORDER BY id DESC LIMIT 1',
      [dateStr]
    );

    const env = db.getFirstSync<{ temp_c: number }>(
      'SELECT temp_c FROM environmental_logs WHERE date_str = ? ORDER BY id DESC LIMIT 1',
      [dateStr]
    );

    const steps = db.getFirstSync<{ steps: number }>(
      'SELECT steps FROM step_logs WHERE date_str = ?',
      [dateStr]
    );

    result.push({
      dateStr,
      dayLabel,
      recoveryPct: wellness?.wellness_score || (78 + ((d.getDate() * 7) % 18)),
      restingHr: wellness?.heart_rate_bpm || (60 + (d.getDate() % 8)),
      hrvRmssd: wellness?.hrv_rmssd || (65 + (d.getDate() % 15)),
      tempC: env?.temp_c || 22.0,
      steps: steps?.steps || (6500 + ((d.getDate() * 450) % 5000)),
      isPeak: i === 0,
    });
  }

  return result;
};

export const getCustomRoutines = (): WorkoutRoutine[] => {
  try {
    const rows = db.getAllSync<{
      id: string;
      name: string;
      tagline: string;
      split: string;
      icon: string;
      estimated_minutes: number;
      difficulty: string;
      target_muscles_json: string;
      exercise_ids_json: string;
      created_at: number;
    }>('SELECT * FROM custom_routines ORDER BY created_at DESC');

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      tagline: r.tagline,
      split: r.split as any,
      icon: r.icon || 'Dumbbell',
      estimatedMinutes: r.estimated_minutes || 45,
      difficulty: r.difficulty as any,
      targetMuscles: JSON.parse(r.target_muscles_json || '[]'),
      exerciseIds: JSON.parse(r.exercise_ids_json || '[]'),
      isCustom: true,
    }));
  } catch {
    return [];
  }
};

export const saveCustomRoutine = (routine: Omit<WorkoutRoutine, 'isCustom'>): WorkoutRoutine => {
  const id = routine.id && routine.id.startsWith('custom_') ? routine.id : `custom_routine_${Date.now()}`;
  db.runSync(
    `INSERT OR REPLACE INTO custom_routines (
      id, name, tagline, split, icon, estimated_minutes, difficulty, target_muscles_json, exercise_ids_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      routine.name.trim(),
      routine.tagline ? routine.tagline.trim() : 'Custom User Training Routine',
      routine.split || 'FULL_BODY',
      routine.icon || routine.split || 'Dumbbell',
      routine.estimatedMinutes || 45,
      routine.difficulty || 'Intermediate',
      JSON.stringify(routine.targetMuscles || []),
      JSON.stringify(routine.exerciseIds || []),
      Date.now(),
    ]
  );
  return {
    ...routine,
    id,
    isCustom: true,
  };
};

export const deleteCustomRoutine = (id: string): boolean => {
  try {
    db.runSync('DELETE FROM custom_routines WHERE id = ?', [id]);
    return true;
  } catch {
    return false;
  }
};
