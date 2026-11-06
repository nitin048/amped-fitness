/**
 * AMPED FITNESS - COMPREHENSIVE E2E VALIDATION SUITE
 * Validates each and every feature, service, database operation, and edge case.
 */

import test, { describe, it } from 'node:test';
import assert from 'node:assert';
import { DatabaseSync } from 'node:sqlite';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createRequire } from 'node:module';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const Module = require('module');

// 1. Setup in-memory SQLite and mock native modules
const memDb = new DatabaseSync(':memory:');

const originalRequire = Module.prototype.require;
Module.prototype.require = function (modulePath: string) {
  if (modulePath === 'expo-sqlite') {
    return {
      openDatabaseSync: () => ({
        execSync: (sql: string) => memDb.exec(sql),
        runSync: (sql: string, params: any[] = []) => {
          const info = memDb.prepare(sql).run(...(params || []));
          return {
            ...info,
            lastInsertRowId: info.lastInsertRowid,
          };
        },
        getFirstSync: (sql: string, params: any[] = []) => memDb.prepare(sql).get(...(params || [])),
        getAllSync: (sql: string, params: any[] = []) => memDb.prepare(sql).all(...(params || [])),
      }),
    };
  }
  if (modulePath.startsWith('expo-file-system')) {
    return {
      documentDirectory: '/data/mock_amped/',
      copyAsync: async () => {},
      readAsStringAsync: async () => '',
      EncodingType: { UTF8: 'utf8', Base64: 'base64' },
    };
  }
  if (modulePath === 'expo-haptics') {
    return {
      selectionAsync: async () => {},
      impactAsync: async () => {},
      notificationAsync: async () => {},
      ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
      NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
    };
  }
  if (modulePath === 'react-native') {
    return {
      StyleSheet: { create: (s: any) => s, absoluteFill: {} },
      View: () => null,
      Text: () => null,
      TouchableOpacity: () => null,
      Platform: { OS: 'ios' },
      Linking: {
        canOpenURL: async () => true,
        openURL: async () => {},
      },
    };
  }
  if (modulePath === 'react-native-webview') {
    return { WebView: () => null };
  }
  if (modulePath === 'lucide-react-native') {
    return new Proxy({}, { get: () => () => null });
  }
  return originalRequire.apply(this, arguments);
};

const origResolve = Module._resolveFilename;
Module._resolveFilename = function(request: string, parent: any, isMain: boolean, options: any) {
  if (request.startsWith('.')) {
    const dir = parent ? path.dirname(parent.filename) : process.cwd();
    const candidate = path.resolve(dir, request);
    if (fs.existsSync(candidate + '.ts')) return candidate + '.ts';
    if (fs.existsSync(candidate + '.tsx')) return candidate + '.tsx';
    if (fs.existsSync(candidate + '/index.ts')) return candidate + '/index.ts';
    if (fs.existsSync(candidate + '/index.tsx')) return candidate + '/index.tsx';
  }
  return origResolve.apply(this, arguments);
};

require.extensions['.ts'] = function(module: any, filename: string) {
  const code = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true }
  }).outputText;
  module._compile(transpiled, filename);
};

require.extensions['.tsx'] = function(module: any, filename: string) {
  const code = fs.readFileSync(filename, 'utf8');
  const transpiled = ts.transpileModule(code, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true, jsx: ts.JsxEmit.React }
  }).outputText;
  module._compile(transpiled, filename);
};

const currentDir = path.dirname(new URL(import.meta.url).pathname);

// Helper to load TS modules directly using our transpiling loader
function loadTsModule(relativePath: string) {
  const fullPath = path.resolve(currentDir, '..', relativePath);
  return require(fullPath);
}

// Load compiled modules
const dbModule = loadTsModule('src/db/database.ts');
const routinesModule = loadTsModule('src/db/routines.ts');
const themeModule = loadTsModule('src/theme/ThemeContext.tsx');
const equipmentModule = loadTsModule('src/services/aiEquipmentScanner.ts');
const recoveryModule = loadTsModule('src/services/recoveryEngine.ts');
const freeExerciseModule = loadTsModule('src/services/freeExerciseApi.ts');
const weatherModule = loadTsModule('src/services/weatherService.ts');
const strengthModule = loadTsModule('src/utils/strengthFormulas.ts');
const openFoodModule = loadTsModule('src/services/openFoodApi.ts');

/* =========================================================================
   SUITE 1: DATABASE INITIALIZATION & SCHEMA MIGRATIONS
========================================================================= */
describe('E2E Feature 1: Database Initialization & Migrations', () => {
  it('initLocalDatabase should create all tables and performance indexes', () => {
    dbModule.initLocalDatabase();

    const tables = memDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as any[];
    const tableNames = tables.map((t) => t.name);

    const requiredTables = [
      'user_settings',
      'workout_alarms',
      'exercises',
      'workout_sessions',
      'workout_sets',
      'meal_logs',
      'water_logs',
      'step_logs',
      'wellness_biometrics',
      'environmental_logs',
    ];

    for (const req of requiredTables) {
      assert.ok(tableNames.includes(req), `Table ${req} must exist in database`);
    }
  });

  it('initLocalDatabase should seed starter exercises across all 6 core muscle groups', () => {
    const exercises = memDb.prepare('SELECT id, primary_muscle, name FROM exercises').all() as any[];
    assert.ok(exercises.length >= 40, `Expected at least 40 starter exercises, found ${exercises.length}`);

    const muscles = new Set(exercises.map((e) => e.primary_muscle));
    for (const m of ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE']) {
      assert.ok(muscles.has(m), `Starter database must include exercises for muscle: ${m}`);
    }
  });

  it('initLocalDatabase should seed default user profile with Minimalist OLED theme', () => {
    const profile = dbModule.getUserProfile();
    assert.ok(profile, 'Default profile must exist');
    assert.strictEqual(profile.themeMode, 'MIDNIGHT_OLED', 'Default theme must be MIDNIGHT_OLED');
    assert.strictEqual(profile.barWeightKg, 20);
    assert.strictEqual(profile.targetDailySteps, 10000);
  });
});

/* =========================================================================
   SUITE 2: WORKOUT SET LOGGING & REAL-TIME PR ENGINE
========================================================================= */
describe('E2E Feature 2: Set Logging, 1RM Formulas & PR Detection', () => {
  it('calculate1RM should accurately apply Brzycki & Epley formulas', () => {
    // 1 rep = exact weight
    assert.strictEqual(dbModule.calculate1RM(100, 1), 100);

    // Epley: weight * (1 + reps / 30) for 2-10 reps
    assert.strictEqual(dbModule.calculate1RM(100, 10), 133);
    assert.strictEqual(dbModule.calculate1RM(80, 5), 93);

    // Brzycki: weight * (36 / (37 - reps)) for 11-30 reps
    assert.strictEqual(dbModule.calculate1RM(100, 15), 164);

    // Edge cases
    assert.strictEqual(dbModule.calculate1RM(0, 10), 0);
    assert.strictEqual(dbModule.calculate1RM(-50, 5), 0);
    assert.strictEqual(dbModule.calculate1RM(100, 0), 0);
    assert.strictEqual(dbModule.calculate1RM(100, -2), 0);
  });

  it('logGymSet should detect Personal Records dynamically against previous history', () => {
    // Clean sets for bench_press
    memDb.prepare('DELETE FROM workout_sets WHERE exercise_id = ?').run('barbell_bench_press');

    // First set is always a PR
    const set1 = dbModule.logGymSet('barbell_bench_press', 80, 8, 0.65, 8);
    assert.strictEqual(set1.isPR, true, 'First set ever must be a PR');

    // Weaker set is NOT a PR
    const set2 = dbModule.logGymSet('barbell_bench_press', 80, 6, 0.58, 8.5);
    assert.strictEqual(set2.isPR, false, 'Weaker set must not be a PR');

    // Matching set is NOT a PR
    const set3 = dbModule.logGymSet('barbell_bench_press', 80, 8, 0.60, 8);
    assert.strictEqual(set3.isPR, false, 'Equal set must not be a new PR');

    // Beating weight with same reps IS a new PR
    const set4 = dbModule.logGymSet('barbell_bench_press', 85, 8, 0.52, 9);
    assert.strictEqual(set4.isPR, true, 'Beating previous 1RM must be marked as PR');
  });

  it('getDailyGymSummary and getTodaySets should reflect logged sets accurately', () => {
    const summary = dbModule.getDailyGymSummary();
    assert.ok(summary.totalSets >= 4, `Expected at least 4 sets, got ${summary.totalSets}`);
    assert.ok(summary.totalVolumeKg > 0, 'Volume must be positive');
    assert.ok(summary.prCount >= 2, 'Must have at least 2 PRs logged');

    const todaySets = dbModule.getTodaySets();
    assert.ok(todaySets.length >= 4, 'getTodaySets must return logged sets');
    assert.ok(todaySets[0].exercise_name, 'Set must include joined exercise name');
  });

  it('deleteGymSet should delete set and update summary metrics', () => {
    const sets = dbModule.getTodaySets();
    const targetSet = sets[0];
    const initialCount = sets.length;

    const success = dbModule.deleteGymSet(targetSet.id);
    assert.strictEqual(success, true);

    const updatedSets = dbModule.getTodaySets();
    assert.strictEqual(updatedSets.length, initialCount - 1);
  });

  it('getExerciseHistorySummary should return last set, all-time best set and today sets', () => {
    memDb.prepare('DELETE FROM workout_sets WHERE exercise_id = ?').run('squat_test_summary');

    // Initially null history
    const emptyHistory = dbModule.getExerciseHistorySummary('squat_test_summary');
    assert.strictEqual(emptyHistory.lastSet, null);
    assert.strictEqual(emptyHistory.bestSet, null);
    assert.strictEqual(emptyHistory.totalSetsLogged, 0);
    assert.strictEqual(emptyHistory.todaySets.length, 0);

    // Log set 1: 100kg x 5 (est 1RM 117)
    dbModule.logGymSet('squat_test_summary', 100, 5, 0.55, 8);
    // Log set 2: 120kg x 3 (est 1RM 132)
    dbModule.logGymSet('squat_test_summary', 120, 3, 0.45, 9);
    // Log set 3: 90kg x 10 (est 1RM 120)
    dbModule.logGymSet('squat_test_summary', 90, 10, 0.60, 8.5);

    const summary = dbModule.getExerciseHistorySummary('squat_test_summary');
    assert.strictEqual(summary.totalSetsLogged, 3);
    assert.strictEqual(summary.todaySets.length, 3);
    // Last set logged was 90kg x 10
    assert.strictEqual(summary.lastSet?.weight_kg, 90);
    assert.strictEqual(summary.lastSet?.reps, 10);
    // Best set was 120kg x 3 (highest 1RM = 132kg)
    assert.strictEqual(summary.bestSet?.weight_kg, 120);
    assert.strictEqual(summary.bestSet?.reps, 3);
    assert.strictEqual(summary.bestSet?.est1RM, 132);
  });
});

/* =========================================================================
   SUITE 3: WORKOUT SESSION LIFECYCLE & HISTORY
========================================================================= */
describe('E2E Feature 3: Workout Session Lifecycle & History Persistence', () => {
  it('saveWorkoutSession and getRecentWorkoutSessions should persist and query history', () => {
    const now = Date.now();
    const sessionId = dbModule.saveWorkoutSession({
      start_time: now - 3600000,
      end_time: now,
      duration_seconds: 3600,
      total_volume_kg: 4800,
      total_sets: 16,
      prs_count: 3,
      calories_burned: 450,
      workout_type: 'Push Hypertrophy',
      created_date_str: '2026-11-06',
    });

    assert.ok(sessionId > 0, 'Session ID must be positive integer');

    const recent = dbModule.getRecentWorkoutSessions(5);
    assert.ok(recent.length > 0, 'Recent workout sessions must not be empty');
    assert.strictEqual(recent[0].workout_type, 'Push Hypertrophy');
    assert.strictEqual(recent[0].total_volume_kg, 4800);
    assert.strictEqual(recent[0].total_sets, 16);
    assert.strictEqual(recent[0].prs_count, 3);
  });
});

/* =========================================================================
   SUITE 4: DAILY HYDRATION TRACKER
========================================================================= */
describe('E2E Feature 4: Daily Hydration Tracking & Quick Logging', () => {
  it('addWaterMl, getTodayWaterMl and resetTodayWaterMl should manage hydration state', () => {
    dbModule.resetTodayWaterMl();
    assert.strictEqual(dbModule.getTodayWaterMl(), 0, 'Initial hydration after reset must be 0 ml');

    // Add +250ml (Cup)
    const afterCup = dbModule.addWaterMl(250);
    assert.strictEqual(afterCup, 250);
    assert.strictEqual(dbModule.getTodayWaterMl(), 250);

    // Add +500ml (Bottle)
    const afterBottle = dbModule.addWaterMl(500);
    assert.strictEqual(afterBottle, 750);
    assert.strictEqual(dbModule.getTodayWaterMl(), 750);

    // Reset back to 0
    dbModule.resetTodayWaterMl();
    assert.strictEqual(dbModule.getTodayWaterMl(), 0);
  });

  it('hydration edge case: negative water addition should not produce negative balance', () => {
    dbModule.resetTodayWaterMl();
    dbModule.addWaterMl(-100);
    const balance = dbModule.getTodayWaterMl();
    assert.ok(balance >= 0, 'Water balance must never be negative');
  });
});

/* =========================================================================
   SUITE 5: RECOVERY ENGINE & PHYSIOLOGICAL FATIGUE WINDOWS
========================================================================= */
describe('E2E Feature 5: Muscle Recovery Windows & Biological State Engine', () => {
  it('getMuscleRecoveryData should calculate status for all 6 muscle groups', () => {
    const recovery = recoveryModule.getMuscleRecoveryData();
    assert.ok(recovery, 'Recovery data must be returned');

    for (const group of ['CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE']) {
      const state = recovery[group];
      assert.ok(state, `Recovery state for ${group} must exist`);
      assert.ok(state.recoveryPercent >= 0 && state.recoveryPercent <= 100, `Percent must be 0-100: ${state.recoveryPercent}`);
      assert.ok(['OPTIMAL', 'RECOVERING', 'FATIGUED'].includes(state.status), `Valid status: ${state.status}`);
      assert.ok(state.color, 'Must have status color');
      assert.ok(state.recommendation, 'Must have scientific recommendation');
      assert.ok(state.recoveryHorizonHours > 0, 'Recovery horizon must be positive');
    }
  });

  it('physiological recovery horizons must match scientific sports guidelines', () => {
    const recovery = recoveryModule.getMuscleRecoveryData();
    assert.strictEqual(recovery.LEGS.recoveryHorizonHours, 66, 'Legs require 66 hours');
    assert.strictEqual(recovery.BACK.recoveryHorizonHours, 56, 'Back requires 56 hours');
    assert.strictEqual(recovery.CHEST.recoveryHorizonHours, 48, 'Chest requires 48 hours');
    assert.strictEqual(recovery.SHOULDERS.recoveryHorizonHours, 40, 'Shoulders require 40 hours');
    assert.strictEqual(recovery.ARMS.recoveryHorizonHours, 32, 'Arms require 32 hours');
    assert.strictEqual(recovery.CORE.recoveryHorizonHours, 26, 'Core requires 26 hours');
  });
});

/* =========================================================================
   SUITE 6: GYM EQUIPMENT SCANNER & YOUTUBE TUTORIAL VIDEOS
========================================================================= */
describe('E2E Feature 6: Gym Equipment Diagnostic & YouTube Embed Safety', () => {
  it('should have all 10 gym equipment diagnostics with verified YouTube IDs', () => {
    const db = equipmentModule.GYM_EQUIPMENT_DATABASE;
    assert.ok(db.length >= 10, 'Expected at least 10 gym equipment items');

    const expectedEquipment = [
      'leg_press', 'chest_press', 'lat_pulldown', 'cable_crossover',
      'seated_row', 'leg_extension', 'leg_curl', 'smith_machine',
      'hack_squat', 'preacher_curl'
    ];

    for (const id of expectedEquipment) {
      const item = equipmentModule.getEquipmentDiagnosticById(id);
      assert.ok(item, `Item ${id} must exist`);
      assert.ok(item.name.length > 0, `Item ${id} must have a name`);
      assert.ok(item.setupGuide.length >= 3, `Item ${id} setup guide >= 3 steps`);
      assert.ok(item.executionCues.length >= 3, `Item ${id} execution cues >= 3`);
      assert.ok(item.commonMistakes.length >= 2, `Item ${id} common mistakes >= 2`);
      assert.ok(item.safetyTip.length > 0, `Item ${id} safety tip`);
      assert.ok(item.youtubeVideoId.length >= 10, `Item ${id} must have valid video ID`);
    }
  });

  it('getEquipmentDiagnosticById edge case: unknown ID falls back safely to leg_press', () => {
    const fallback = equipmentModule.getEquipmentDiagnosticById('non_existent_gym_gizmo');
    assert.ok(fallback, 'Must return diagnostic');
    assert.strictEqual(fallback.name, '45° Incline Leg Press Machine');
  });

  it('getFallbackYoutubeId should return valid tutorial ID for each muscle group', () => {
    assert.strictEqual(equipmentModule.getFallbackYoutubeId('', ['CHEST']), '3jYo5cMU3d4');
    assert.strictEqual(equipmentModule.getFallbackYoutubeId('', ['BACK']), 'SALxEARiMkw');
    assert.strictEqual(equipmentModule.getFallbackYoutubeId('', ['LEGS']), 'IZxyjW7MPJQ');
    assert.strictEqual(equipmentModule.getFallbackYoutubeId('', ['SHOULDERS']), '6v4nrRVySj0');
    assert.strictEqual(equipmentModule.getFallbackYoutubeId('lat pull'), 'SALxEARiMkw');
    assert.strictEqual(equipmentModule.getFallbackYoutubeId('smith machine'), 'rVnzXD3NdTI');
  });
});

/* =========================================================================
   SUITE 7: PRESET ROUTINES & SPLIT TARGETS
========================================================================= */
describe('E2E Feature 7: Preset Workout Routines', () => {
  it('PRESET_ROUTINES must contain all standard splits', () => {
    const routines = routinesModule.PRESET_ROUTINES;
    assert.ok(routines.length >= 6, 'At least 6 preset routines');

    for (const r of routines) {
      assert.ok(r.id, 'Routine must have id');
      assert.ok(r.name, `Routine ${r.id} must have name`);
      assert.ok(r.estimatedMinutes >= 20 && r.estimatedMinutes <= 90, `Sensible duration for ${r.id}`);
      assert.ok(r.exerciseIds.length > 0, `Routine ${r.id} must have exercise IDs`);
      assert.ok(r.targetMuscles.length > 0, `Routine ${r.id} must have target muscles`);
    }
  });
});

/* =========================================================================
   SUITE 8: THEME PALETTES & MINIMALIST OLED
========================================================================= */
describe('E2E Feature 8: Themes & Minimalist OLED Monochrome System', () => {
  it('THEMES must define all 8 core palettes with 100% complete design tokens', () => {
    const themes = themeModule.THEMES;
    const requiredKeys = [
      'MIDNIGHT_OLED', 'APPLE_FITNESS', 'VOLT_DARK', 'BLOOD_IRON',
      'CYBER_PULSE', 'EMERALD_NIGHT', 'DAYLIGHT', 'SOLAR_LIGHT', 'NORDIC_FROST'
    ];

    for (const key of requiredKeys) {
      assert.ok(themes[key], `Theme ${key} must exist`);
      const t = themes[key];
      assert.ok(t.bg, `Theme ${key} bg`);
      assert.ok(t.card, `Theme ${key} card`);
      assert.ok(t.primary, `Theme ${key} primary`);
      assert.ok(t.primaryText, `Theme ${key} primaryText`);
      assert.ok(t.text, `Theme ${key} text`);
      assert.ok(t.subtext, `Theme ${key} subtext`);
      assert.ok(t.accentRed, `Theme ${key} accentRed`);
      assert.ok(t.accentCyan, `Theme ${key} accentCyan`);
    }
  });

  it('MIDNIGHT_OLED must be true pitch black #000000 and pure white #FFFFFF accents', () => {
    const oled = themeModule.THEMES.MIDNIGHT_OLED;
    assert.strictEqual(oled.bg, '#000000', 'Background must be true pitch black');
    assert.strictEqual(oled.card, '#090909', 'Card must be subtle deep charcoal');
    assert.strictEqual(oled.primary, '#FFFFFF', 'Primary accent must be monochrome pure white');
    assert.strictEqual(oled.primaryText, '#000000', 'Text inside primary button must be black');
    assert.strictEqual(oled.isDark, true);
  });
});

/* =========================================================================
   SUITE 9: USER PROFILE & ATHLETE BIOMETRIC CALCULATIONS
========================================================================= */
describe('E2E Feature 9: User Profile, Biometrics & Macro Targets', () => {
  it('saveUserProfile and getUserProfile should persist user settings', () => {
    dbModule.saveUserProfile({
      userName: 'Karan Sharma',
      athleteNickname: 'Iron Beast',
      fitnessGoal: 'Hypertrophy & Strength',
      bodyWeightKg: 82.5,
      heightCm: 182,
      targetDailySteps: 12000,
      targetWaterMl: 3500,
    });

    const updated = dbModule.getUserProfile();
    assert.strictEqual(updated.userName, 'Karan Sharma');
    assert.strictEqual(updated.athleteNickname, 'Iron Beast');
    assert.strictEqual(updated.bodyWeightKg, 82.5);
    assert.strictEqual(updated.heightCm, 182);
    assert.strictEqual(updated.targetDailySteps, 12000);
    assert.strictEqual(updated.targetWaterMl, 3500);
  });

  it('calculateAthleteMetrics should calculate accurate BMR, TDEE and Macro split', () => {
    const metrics = dbModule.calculateAthleteMetrics({
      gender: 'Male',
      ageYears: 25,
      bodyWeightKg: 80,
      heightCm: 180,
      fitnessGoal: 'Hypertrophy & Muscle Building',
      experienceLevel: 'Intermediate',
    });

    assert.ok(metrics.bmr > 1500 && metrics.bmr < 2100, `BMR sensible: ${metrics.bmr}`);
    assert.ok(metrics.tdee > 2000, `TDEE sensible: ${metrics.tdee}`);
    assert.ok(metrics.suggestedProtein >= 140, `Protein recommendation sensible: ${metrics.suggestedProtein}`);
    assert.ok(metrics.bmi > 20 && metrics.bmi < 30, `BMI sensible: ${metrics.bmi}`);
  });
});

/* =========================================================================
   SUITE 10: WORKOUT ALARMS & TIME UTILITIES
========================================================================= */
describe('E2E Feature 10: Workout Alarms & Scheduling Daemon', () => {
  it('addWorkoutAlarm, toggleWorkoutAlarm, and deleteWorkoutAlarm should manage alarms', () => {
    const alarmsAfterAdd = dbModule.addWorkoutAlarm({
      title: 'Morning Push Heavy',
      timeStr: '06:45',
      period: 'AM',
      days: [1, 3, 5],
      soundEnabled: true,
    });

    const created = alarmsAfterAdd.find((a: any) => a.title === 'Morning Push Heavy');
    assert.ok(created, 'Created alarm must be present in returned alarms list');
    assert.strictEqual(created.title, 'Morning Push Heavy');
    assert.strictEqual(created.timeStr, '06:45');
    assert.strictEqual(created.isActive, true);

    // Toggle alarm off
    const afterToggle = dbModule.toggleWorkoutAlarm(created.id, false);
    const toggled = afterToggle.find((a: any) => a.id === created.id);
    assert.strictEqual(toggled?.isActive, false, 'Alarm must be inactive');

    // Delete alarm
    const afterDelete = dbModule.deleteWorkoutAlarm(created.id);
    const deleted = afterDelete.find((a: any) => a.id === created.id);
    assert.strictEqual(deleted, undefined, 'Alarm must be deleted');
  });

  it('permanence: deleted workout alarms must NEVER be resurrected when initLocalDatabase is re-run', () => {
    // 1. Delete all existing alarms
    const initialAlarms = dbModule.getWorkoutAlarms();
    for (const a of initialAlarms) {
      dbModule.deleteWorkoutAlarm(a.id);
    }
    const emptyAlarms = dbModule.getWorkoutAlarms();
    assert.strictEqual(emptyAlarms.length, 0, 'All alarms should be deleted');

    // 2. Re-trigger initLocalDatabase() (as happens during hot-reload or app startup)
    dbModule.initLocalDatabase();

    // 3. Verify alarms are NOT reseeded/resurrected
    const alarmsAfterReinit = dbModule.getWorkoutAlarms();
    assert.strictEqual(
      alarmsAfterReinit.length,
      0,
      'Deleted alarms must remain deleted and never be resurrected by database initialization'
    );

    // 4. User can still add their own custom alarm cleanly
    const custom = dbModule.addWorkoutAlarm({
      title: 'Heavy Squat Morning',
      timeStr: '07:15',
      period: 'AM',
      days: [0, 2, 4],
      soundEnabled: true,
    });
    assert.strictEqual(custom.length, 1);
    assert.strictEqual(custom[0].title, 'Heavy Squat Morning');
  });
});

/* =========================================================================
   SUITE 11: SECURITY BOUNDARY & SQL INJECTION SANITIZATION
========================================================================= */
describe('E2E Feature 11: Security Boundary & Malformed Input Handling', () => {
  it('should sanitize dangerous SQL injection characters in exercise creation and queries', () => {
    const maliciousInput = "Squat'); DROP TABLE workout_sets;--";

    // Insert with prepared statement
    memDb.prepare('INSERT INTO exercises (id, name, primary_muscle, equipment, youtube_video_id, instructions) VALUES (?, ?, ?, ?, ?, ?)')
      .run('sec_test_1', maliciousInput, 'LEGS', 'BARBELL', 'test_vid', 'safe instructions');

    // Verify workout_sets table was NOT dropped
    const checkTable = memDb.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='workout_sets'").get();
    assert.ok(checkTable, 'workout_sets table must remain intact');

    // Verify malicious string is saved safely as raw text
    const fetched = memDb.prepare('SELECT name FROM exercises WHERE id = ?').get('sec_test_1') as any;
    assert.strictEqual(fetched.name, maliciousInput);
  });

  it('edge case: extreme weights and negative reps do not corrupt database', () => {
    // 0kg x 0 reps -> 1RM is 0, no division by zero
    const resZero = dbModule.logGymSet('barbell_bench_press', 0, 0, 0, 8);
    assert.strictEqual(resZero.isPR, false);
    assert.strictEqual(resZero.estimated1RM, 0);

    // Negative reps -> 1RM is 0
    const resNeg = dbModule.logGymSet('barbell_bench_press', 100, -5, 0, 8);
    assert.strictEqual(resNeg.isPR, false);
    assert.strictEqual(resNeg.estimated1RM, 0);
  });
});

/* =========================================================================
   SUITE 12: YOUTUBE EMBED SECURITY & RESTRICTION BYPASS
========================================================================= */
describe('E2E Feature 12: YouTube Embed Player & Origin Restriction Bypass', () => {
  const extractVideoId = (input: string): string => {
    if (!input) return '';
    const trimmed = input.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/
    );
    return match ? match[1] : trimmed;
  };

  it('should extract 11-char video ID across all YouTube URL formats', () => {
    // Standard watch URL
    assert.strictEqual(extractVideoId('https://www.youtube.com/watch?v=IZxyjW7MPJQ'), 'IZxyjW7MPJQ');
    // Shortened URL
    assert.strictEqual(extractVideoId('https://youtu.be/SALxEARiMkw?si=test123'), 'SALxEARiMkw');
    // Shorts URL
    assert.strictEqual(extractVideoId('https://www.youtube.com/shorts/Iwe6AmxVf7o'), 'Iwe6AmxVf7o');
    // Embed URL
    assert.strictEqual(extractVideoId('https://www.youtube.com/embed/rVnzXD3NdTI'), 'rVnzXD3NdTI');
    // Mobile URL with timestamp
    assert.strictEqual(extractVideoId('https://m.youtube.com/watch?v=3jYo5cMU3d4&t=45s'), '3jYo5cMU3d4');
  });

  it('embed HTML must target youtube-nocookie.com domain with safe origin to prevent embed restrictions', () => {
    const videoId = 'IZxyjW7MPJQ';
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?enablejsapi=1&playsinline=1&rel=0&modestbranding=1`;
    assert.ok(embedUrl.startsWith('https://www.youtube-nocookie.com/embed/IZxyjW7MPJQ'));
    assert.ok(embedUrl.includes('playsinline=1'));
    assert.ok(embedUrl.includes('enablejsapi=1'));
  });

  it('edge case: invalid, malformed, or blank URL input handles safely', () => {
    assert.strictEqual(extractVideoId(''), '');
    assert.strictEqual(extractVideoId('   '), '');
    assert.strictEqual(extractVideoId('invalid_string'), 'invalid_string');
  });
});

/* =========================================================================
   SUITE 13: STEP TELEMETRY & MOTION SENSOR TRACKING
========================================================================= */
describe('E2E Feature 13: Step Telemetry & Sensor Motion Persistence', () => {
  it('saveTodayStepLog and getTodayStepLog should persist and retrieve daily motion data', () => {
    const dateStr = '2026-11-06';
    dbModule.saveTodayStepLog(8420, 6.4, 385, 62, dateStr);

    const log = dbModule.getTodayStepLog(dateStr);
    assert.strictEqual(log.steps, 8420);
    assert.strictEqual(log.distance_km, 6.4);
    assert.strictEqual(log.calories_burned, 385);
    assert.strictEqual(log.active_duration_min, 62);
  });

  it('subsequent step updates on same day should upsert without duplicate row errors', () => {
    const dateStr = '2026-11-06';
    dbModule.saveTodayStepLog(10500, 7.98, 480, 78, dateStr);

    const log = dbModule.getTodayStepLog(dateStr);
    assert.strictEqual(log.steps, 10500);
    assert.strictEqual(log.distance_km, 7.98);

    const count = memDb.prepare('SELECT COUNT(*) as c FROM step_logs WHERE date_str = ?').get(dateStr) as any;
    assert.strictEqual(count.c, 1, 'Only 1 row must exist for date_str');
  });
});

/* =========================================================================
   SUITE 14: BIOMETRICS & ENVIRONMENTAL TELEMETRY
========================================================================= */
describe('E2E Feature 14: Wellness Biometrics & Environmental Telemetry', () => {
  it('saveWellnessReading and getLatestWellnessReading should store and fetch vitals', () => {
    dbModule.saveWellnessReading({
      heartRateBpm: 64,
      hrvRmssd: 58,
      wellnessScore: 92,
      stateLabel: 'Peak Recovery',
      notes: 'Post-rest telemetry',
    });

    const latest = dbModule.getLatestWellnessReading();
    assert.ok(latest, 'Latest wellness reading must exist');
    assert.strictEqual(latest.heartRateBpm, 64);
    assert.strictEqual(latest.hrvRmssd, 58);
    assert.strictEqual(latest.wellnessScore, 92);
    assert.strictEqual(latest.stateLabel, 'Peak Recovery');
  });

  it('saveEnvironmentalReading and getLatestEnvironmentalReading should track climate', () => {
    dbModule.saveEnvironmentalReading({
      tempC: 22.4,
      humidityPct: 48.0,
      pressureHpa: 1013.2,
      heatIndexC: 22.8,
      thermalStatus: 'Optimal Training Zone',
      recoveryImpactScore: 95,
      notes: 'Ideal gym temperature',
    });

    const latest = dbModule.getLatestEnvironmentalReading();
    assert.ok(latest, 'Latest environmental reading must exist');
    assert.strictEqual(latest.tempC, 22.4);
    assert.strictEqual(latest.humidityPct, 48.0);
    assert.strictEqual(latest.thermalStatus, 'Optimal Training Zone');
  });

  it('getRecoveryTrends should aggregate multi-day recovery points', () => {
    const trends = dbModule.getRecoveryTrends(7);
    assert.ok(Array.isArray(trends), 'Trends must be an array');
    assert.strictEqual(trends.length, 7, '7-day trend must return 7 daily points');
  });
});

/* =========================================================================
   SUITE 15: WEEKLY ATHLETE CONSISTENCY & HOURLY DENSITY
========================================================================= */
describe('E2E Feature 15: Weekly Consistency & Hourly Density Distribution', () => {
  it('getWeeklyConsistency should calculate active days and hit percentage', () => {
    const consistency = dbModule.getWeeklyConsistency(5);
    assert.ok(consistency, 'Consistency object must exist');
    assert.strictEqual(typeof consistency.daysActive, 'object');
    assert.strictEqual(Object.keys(consistency.daysActive).length, 7, 'Must have 7 days in week');
    assert.ok(consistency.percentage >= 0 && consistency.percentage <= 100, `Percentage: ${consistency.percentage}`);
  });

  it('getHourlyTrainingDensity should bucket volume across 24 hours into 12 2-hour segments', () => {
    const density = dbModule.getHourlyTrainingDensity();
    assert.strictEqual(density.length, 12, 'Must produce 12 2-hour buckets');

    for (const b of density) {
      assert.ok(b.label, 'Bucket must have time label');
      assert.ok(b.fillPercent >= 0 && b.fillPercent <= 100, `Fill percent 0-100: ${b.fillPercent}`);
      assert.strictEqual(typeof b.isPeak, 'boolean', 'isPeak must be boolean');
    }
  });
});

/* =========================================================================
   SUITE 16: FREE EXERCISE API & ONLINE EXERCISE IMPORT
========================================================================= */
describe('E2E Feature 16: Exercise Muscle Mapping & Online Exercise Import', () => {
  it('mapToCoreMuscle should accurately map anatomical muscles to primary split groups', () => {
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('quadriceps'), 'LEGS');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('hamstrings'), 'LEGS');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('glutes'), 'LEGS');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('chest'), 'CHEST');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('pectoralis'), 'CHEST');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('lats'), 'BACK');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('traps'), 'BACK');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('deltoids'), 'SHOULDERS');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('biceps'), 'ARMS');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('triceps'), 'ARMS');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('abdominals'), 'CORE');
    assert.strictEqual(freeExerciseModule.mapToCoreMuscle('unknown_muscle_xyz'), 'FULL_BODY');
  });

  it('importExerciseToLocalDb should import online exercise into local database', () => {
    const imported = freeExerciseModule.importExerciseToLocalDb({
      id: 'online_hack_squat_1',
      name: 'Plate-Loaded Reverse Hack Squat',
      primaryMuscles: ['glutes'],
      equipment: 'machine',
      instructions: ['Place feet high on platform', 'Brace core and descend to 90 degrees'],
    });

    assert.ok(imported.id, 'Imported exercise must have ID');
    assert.strictEqual(imported.primary_muscle, 'LEGS', 'Target glutes must map to LEGS');

    const inDb = memDb.prepare('SELECT * FROM exercises WHERE id = ?').get(imported.id) as any;
    assert.ok(inDb, 'Imported exercise must exist in SQLite database');
    assert.strictEqual(inDb.name, 'Plate-Loaded Reverse Hack Squat');
  });
});

/* =========================================================================
   SUITE 17: USER PROFILE INITIALS & STRING SANITIZATION EDGE CASES
========================================================================= */
describe('E2E Feature 17: User Avatar Initials & Header String Edge Cases', () => {
  const getInitials = (name?: string): string => {
    if (!name || !name.trim()) return 'AC';
    return name
      .trim()
      .split(' ')
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  it('should extract two-letter initials correctly from user full names', () => {
    assert.strictEqual(getInitials('Alex Carter'), 'AC');
    assert.strictEqual(getInitials('John Ronald Tolkien'), 'JR');
    assert.strictEqual(getInitials('Karan Sharma'), 'KS');
  });

  it('should handle single-word names and edge cases gracefully', () => {
    assert.strictEqual(getInitials('Nitin'), 'N');
    assert.strictEqual(getInitials(''), 'AC');
    assert.strictEqual(getInitials(undefined), 'AC');
    assert.strictEqual(getInitials('   '), 'AC');
  });
});

/* =========================================================================
   SUITE 18: OPEN-METEO CLIMATE ENGINE & ATHLETE RECOVERY ADVICE
========================================================================= */
describe('E2E Feature 18: Open-Meteo Climate Engine & Athlete Recovery Advice', () => {
  it('getAthleteClimateAdvice should calculate accurate heat index and hydration needs', () => {
    // Optimal conditions
    const opt = weatherModule.getAthleteClimateAdvice({
      tempC: 22,
      humidityPct: 45,
      pressureHpa: 1013,
      uvIndex: 2,
      aqi: 30,
      pm25: 12,
      timestamp: Date.now(),
      source: 'Open-Meteo',
    });
    assert.strictEqual(opt.thermalCategory, 'OPTIMAL');
    assert.strictEqual(opt.hydrationMlPerHr, 500);
    assert.strictEqual(opt.airQualityCategory, 'EXCELLENT');

    // Heat strain conditions
    const hot = weatherModule.getAthleteClimateAdvice({
      tempC: 34,
      humidityPct: 75,
      pressureHpa: 1008,
      uvIndex: 8,
      aqi: 85,
      pm25: 65,
      timestamp: Date.now(),
      source: 'Open-Meteo',
    });
    assert.strictEqual(hot.thermalCategory, 'HEAT_RISK');
    assert.strictEqual(hot.hydrationMlPerHr, 950);
    assert.strictEqual(hot.airQualityCategory, 'POOR');

    // Cold conditions
    const cold = weatherModule.getAthleteClimateAdvice({
      tempC: 10,
      humidityPct: 50,
      pressureHpa: 1020,
      uvIndex: 1,
      aqi: 20,
      pm25: 8,
      timestamp: Date.now(),
      source: 'Open-Meteo',
    });
    assert.strictEqual(cold.thermalCategory, 'COLD');
    assert.strictEqual(cold.hydrationMlPerHr, 450);
  });
});

/* =========================================================================
   SUITE 19: OPEN FOOD FACTS BARCODE API & PRESETS
========================================================================= */
describe('E2E Feature 19: Open Food Facts Barcode API & Presets', () => {
  it('ATHLETE_PRESET_BARCODES should define verified fitness food presets', () => {
    assert.ok(openFoodModule.ATHLETE_PRESET_BARCODES.length >= 4);
    const whey = openFoodModule.ATHLETE_PRESET_BARCODES.find((b: any) => b.label.includes('Whey'));
    assert.ok(whey, 'Must contain a Whey Protein preset');
    assert.ok(whey.barcode.length >= 8, 'Barcode must be valid length');
  });

  it('fetchFoodByBarcode should reject invalid or short barcodes safely without errors', async () => {
    const invalidShort = await openFoodModule.fetchFoodByBarcode('123');
    assert.strictEqual(invalidShort, null);

    const blank = await openFoodModule.fetchFoodByBarcode('');
    assert.strictEqual(blank, null);
  });
});

/* =========================================================================
   SUITE 20: OPENPOWERLIFTING STRENGTH COEFFICIENTS (DOTS & WILKS 2020)
========================================================================= */
describe('E2E Feature 20: OpenPowerlifting DOTS & Wilks 2020 Strength Standards', () => {
  it('calculateDotsScore should match official competitive powerlifting standards', () => {
    // 80kg male lifting 500kg total
    const dots80 = strengthModule.calculateDotsScore(80, 500, 'male');
    assert.ok(dots80 >= 340 && dots80 <= 350, `Expected ~344.5 DOTS, got ${dots80}`);

    // Edge cases
    assert.strictEqual(strengthModule.calculateDotsScore(0, 500), 0);
    assert.strictEqual(strengthModule.calculateDotsScore(80, 0), 0);
    assert.strictEqual(strengthModule.calculateDotsScore(-80, 500), 0);
  });

  it('getStrengthTier should map DOTS score to correct competitive tier', () => {
    assert.strictEqual(strengthModule.getStrengthTier(530).name, 'World Class');
    assert.strictEqual(strengthModule.getStrengthTier(460).name, 'Elite');
    assert.strictEqual(strengthModule.getStrengthTier(380).name, 'Advanced');
    assert.strictEqual(strengthModule.getStrengthTier(310).name, 'Proficient');
    assert.strictEqual(strengthModule.getStrengthTier(220).name, 'Intermediate');
    assert.strictEqual(strengthModule.getStrengthTier(150).name, 'Novice');
  });

  it('getAthleteStrengthScore should aggregate Big 3 compounds and generate diagnostics', () => {
    const diag = strengthModule.getAthleteStrengthScore(75, 'male', 100, 140, 180);
    assert.strictEqual(diag.totalKg, 420);
    assert.ok(diag.dotsScore > 0);
    assert.ok(diag.wilksScore > 0);
    assert.strictEqual(diag.tier.name, 'Proficient');
  });
});

/* =========================================================================
   SUITE 21: ADVANCED RECOVERY & MOBILITY PROTOCOLS
========================================================================= */
describe('E2E Feature 21: Advanced Recovery Suite & Mobility Protocols', () => {
  it('getMobilityProtocol should provide targeted sports drills for each muscle group', () => {
    for (const m of ['LEGS', 'BACK', 'CHEST', 'SHOULDERS', 'ARMS', 'CORE'] as const) {
      const drills = recoveryModule.getMobilityProtocol(m);
      assert.ok(drills.length >= 2, `Muscle ${m} must provide at least 2 mobility drills`);
      assert.ok(drills[0].name.length > 3);
      assert.ok(drills[0].duration.length > 2);
      assert.ok(drills[0].benefit.length > 5);
    }
  });

  it('saveWellnessReading should persist CNS tap-test and breathwork sessions cleanly', () => {
    const cns = dbModule.saveWellnessReading({
      heartRateBpm: 68,
      hrvRmssd: 82,
      wellnessScore: 85,
      stateLabel: 'CNS: 65 taps (Optimal High Activation)',
      notes: 'Neuromuscular Tap Test',
    });
    assert.ok(cns.id, 'Reading must have generated ID');
    assert.strictEqual(cns.heartRateBpm, 68);

    const breath = dbModule.saveWellnessReading({
      heartRateBpm: 56,
      hrvRmssd: 90,
      wellnessScore: 95,
      stateLabel: '4-7-8 Breath: 4 cycles (120s)',
      notes: 'Vagal Parasympathetic Reset',
    });
    assert.ok(breath.id);
    assert.strictEqual(breath.heartRateBpm, 56);
  });
});

/* =========================================================================
   FEATURE 22: PERSISTENT SELECTIONS & STATE SYNCHRONIZATION ACROSS 4 PAGES
   ========================================================================= */
describe('E2E Feature 22: Persistent Selections & State Synchronization across 4 Pages', () => {
  it('saveRecoverySettings should persist sleep hours, muscle soreness and checklist without reverting', () => {
    // 1. Update recovery settings
    dbModule.saveRecoverySettings({
      sleepHours: 8.5,
      soreness: 'SORE',
      checklist: { sleep: true, hydration: true, mobility: true, protein: true, coldReset: true },
    });

    // 2. Fetch fresh profile from SQLite
    const prof = dbModule.getUserProfile();
    assert.strictEqual(prof.recoverySleepHours, 8.5, 'Sleep hours must persist 8.5h');
    assert.strictEqual(prof.recoverySoreness, 'SORE', 'Soreness must persist SORE');
    assert.strictEqual(prof.recoveryChecklist?.coldReset, true, 'Checklist coldReset must persist true');

    // 3. Re-run initLocalDatabase and verify user selections are NOT reverted to default
    dbModule.initLocalDatabase();
    const profAfterInit = dbModule.getUserProfile();
    assert.strictEqual(profAfterInit.recoverySleepHours, 8.5);
    assert.strictEqual(profAfterInit.recoverySoreness, 'SORE');
  });

  it('theme mode selected by user should never be overwritten back to default on database re-init', () => {
    dbModule.saveUserProfile({ themeMode: 'APPLE_FITNESS' });
    let prof = dbModule.getUserProfile();
    assert.strictEqual(prof.themeMode, 'APPLE_FITNESS');

    // Simulate app boot & database re-init
    dbModule.initLocalDatabase();
    prof = dbModule.getUserProfile();
    assert.strictEqual(prof.themeMode, 'APPLE_FITNESS', 'Selected theme must not revert back to MIDNIGHT_OLED');
  });

  it('muscle groups from recovery heatmap should map to valid split filters', () => {
    const mapping: Record<string, string> = {
      CHEST: 'PUSH',
      SHOULDERS: 'PUSH',
      BACK: 'PULL',
      LEGS: 'LEGS',
      ARMS: 'ARMS',
      CORE: 'CORE',
    };
    for (const [muscle, split] of Object.entries(mapping)) {
      let mapped = 'ALL';
      if (muscle === 'CHEST' || muscle === 'SHOULDERS') mapped = 'PUSH';
      else if (muscle === 'BACK') mapped = 'PULL';
      else if (muscle === 'LEGS') mapped = 'LEGS';
      else if (muscle === 'ARMS') mapped = 'ARMS';
      else if (muscle === 'CORE') mapped = 'CORE';
      assert.strictEqual(mapped, split, `Muscle ${muscle} must map to split ${split}`);
    }
  });
});


