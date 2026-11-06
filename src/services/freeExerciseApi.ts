import { db, Exercise } from '../db/database';

export interface OnlineExercise {
  id: string;
  name: string;
  force?: 'push' | 'pull' | null;
  level?: 'beginner' | 'intermediate' | 'expert';
  mechanic?: 'compound' | 'isolation' | null;
  equipment?: string | null;
  primaryMuscles: string[];
  secondaryMuscles?: string[];
  instructions: string[];
  category: string;
  images: string[];
}

const RAW_EXERCISES_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json';
const IMAGE_BASE_URL = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

let cachedOnlineExercises: OnlineExercise[] | null = null;

// Map online muscle names to our 6 core muscle groups
export const mapToCoreMuscle = (muscleName: string): string => {
  const m = muscleName.toLowerCase();
  if (['chest', 'pectoralis'].includes(m)) return 'CHEST';
  if (['lats', 'middle back', 'lower back', 'traps', 'neck'].includes(m)) return 'BACK';
  if (['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'].includes(m)) return 'LEGS';
  if (['shoulders', 'deltoids'].includes(m)) return 'SHOULDERS';
  if (['biceps', 'triceps', 'forearms'].includes(m)) return 'ARMS';
  if (['abdominals', 'obliques', 'core'].includes(m)) return 'CORE';
  return 'FULL_BODY';
};

// Fetch full dataset (876 exercises) with in-memory caching
export const fetchOnlineExercises = async (): Promise<OnlineExercise[]> => {
  if (cachedOnlineExercises && cachedOnlineExercises.length > 0) {
    return cachedOnlineExercises;
  }

  try {
    const response = await fetch(RAW_EXERCISES_URL);
    if (!response.ok) {
      throw new Error(`Failed to fetch free exercises: ${response.status}`);
    }
    const data: OnlineExercise[] = await response.json();
    cachedOnlineExercises = data;
    return data;
  } catch (error) {
    console.warn('Online exercises fetch error:', error);
    return [];
  }
};

// Search & filter online exercises
export const searchOnlineExercises = async (
  query: string = '',
  muscleFilter: string = 'ALL',
  equipmentFilter: string = 'ALL'
): Promise<OnlineExercise[]> => {
  const all = await fetchOnlineExercises();
  const q = query.trim().toLowerCase();

  return all.filter((item) => {
    // Text search
    if (q.length > 0) {
      const matchName = item.name.toLowerCase().includes(q);
      const matchEquip = item.equipment?.toLowerCase().includes(q);
      const matchMuscle = item.primaryMuscles.some((m) => m.toLowerCase().includes(q));
      if (!matchName && !matchEquip && !matchMuscle) return false;
    }

    // Muscle filter
    if (muscleFilter !== 'ALL') {
      const hasMuscle = item.primaryMuscles.some(
        (m) => mapToCoreMuscle(m) === muscleFilter.toUpperCase()
      );
      if (!hasMuscle) return false;
    }

    // Equipment filter
    if (equipmentFilter !== 'ALL') {
      if (item.equipment?.toLowerCase() !== equipmentFilter.toLowerCase()) return false;
    }

    return true;
  });
};

// Get full image url for an exercise
export const getExerciseImageUrl = (imageRelativePath?: string): string | null => {
  if (!imageRelativePath) return null;
  return `${IMAGE_BASE_URL}${imageRelativePath}`;
};

// Import an online exercise directly into local SQLite exercises table
export const importExerciseToLocalDb = (item: OnlineExercise): Exercise => {
  const localId = item.id.toLowerCase().replace(/[^a-z0-9_]/g, '_');
  const primaryMuscle = item.primaryMuscles.length > 0
    ? mapToCoreMuscle(item.primaryMuscles[0])
    : 'FULL_BODY';

  const instructionsText = Array.isArray(item.instructions)
    ? item.instructions.join(' ')
    : String(item.instructions || 'Control eccentric phase, brace core, and perform with full range of motion.');

  const equipmentText = (item.equipment || 'BODYWEIGHT').toUpperCase();

  // YouTube search query fallback ID (will play or guide form)
  const defaultYoutubeId = 'vcBig73ojpE';

  const newExercise: Exercise = {
    id: localId,
    name: item.name,
    primary_muscle: primaryMuscle,
    equipment: equipmentText,
    youtube_video_id: defaultYoutubeId,
    instructions: instructionsText,
  };

  db.runSync(
    `INSERT OR REPLACE INTO exercises (id, name, primary_muscle, equipment, youtube_video_id, instructions)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      newExercise.id,
      newExercise.name,
      newExercise.primary_muscle,
      newExercise.equipment,
      newExercise.youtube_video_id,
      newExercise.instructions,
    ]
  );

  return newExercise;
};

