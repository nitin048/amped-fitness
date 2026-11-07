/**
 * wger Workout Manager Open-Source Fitness API Client
 * Official REST API: https://wger.de/api/v2/
 * Provides exercises, muscle group anatomies, equipment, and step-by-step instructions.
 * Includes complete offline fallback data for 100% offline functionality.
 */

import { db, Exercise } from '../db/database';

export interface WgerMuscle {
  id: number;
  name: string;
  name_en?: string;
  is_front?: boolean;
  image_url_main?: string;
}

export interface WgerEquipment {
  id: number;
  name: string;
}

export interface WgerExerciseImage {
  id: number;
  image: string;
  is_main?: boolean;
}

export interface WgerExercise {
  id: number;
  name: string;
  category: string;
  description: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  images: string[];
  licenseAuthor?: string;
}

const WGER_BASE_URL = 'https://wger.de/api/v2';

// Clean HTML tags from wger descriptions
export const stripHtml = (htmlStr: string): string => {
  if (!htmlStr) return '';
  return htmlStr
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+([.,!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
};

// Map wger muscle names to Apmed core muscle groups
export const mapWgerMuscleToCore = (muscleName: string): string => {
  const m = (muscleName || '').toLowerCase();
  if (m.includes('pectoral') || m.includes('chest')) return 'CHEST';
  if (
    m.includes('latissimus') ||
    m.includes('trapezius') ||
    m.includes('rhomboid') ||
    m.includes('back') ||
    m.includes('teres') ||
    m.includes('infraspinatus')
  ) {
    return 'BACK';
  }
  if (
    m.includes('quadriceps') ||
    m.includes('femoris') ||
    m.includes('gluteus') ||
    m.includes('hamstring') ||
    m.includes('gastrocnemius') ||
    m.includes('soleus') ||
    m.includes('calf') ||
    m.includes('leg') ||
    m.includes('adductor')
  ) {
    return 'LEGS';
  }
  if (m.includes('deltoid') || m.includes('shoulder')) return 'SHOULDERS';
  if (
    m.includes('biceps') ||
    m.includes('triceps') ||
    m.includes('brachialis') ||
    m.includes('forearm') ||
    m.includes('arm')
  ) {
    return 'ARMS';
  }
  if (
    m.includes('abdominis') ||
    m.includes('oblique') ||
    m.includes('core') ||
    m.includes('serratus')
  ) {
    return 'CORE';
  }
  return 'FULL_BODY';
};

// Rich offline fallback dataset from wger catalog
export const WGER_FALLBACK_EXERCISES: WgerExercise[] = [
  {
    id: 1001,
    name: 'Barbell Flat Bench Press',
    category: 'Chest',
    description: 'Lie flat on the bench with your eyes under the bar. Grip slightly wider than shoulder-width. Unrack, pull shoulder blades back and down. Lower bar with control to lower chest/nipple line, touch lightly, and press back up explosively.',
    primaryMuscles: ['Pectoralis major', 'Anterior deltoid'],
    secondaryMuscles: ['Triceps brachii'],
    equipment: ['Barbell', 'Bench'],
    images: ['https://wger.de/media/exercise-images/192/benchpress-1.png'],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1002,
    name: 'Incline Dumbbell Chest Press',
    category: 'Chest',
    description: 'Set bench to a 30 to 45 degree angle. Sit with dumbbells on thighs. Kick weights up into position. Retract scapula, lower dumbbells until elbows form a 90-degree angle, then press up towards each other without clanging.',
    primaryMuscles: ['Clavicular Pectoralis (Upper Chest)', 'Anterior deltoid'],
    secondaryMuscles: ['Triceps brachii'],
    equipment: ['Dumbbell', 'Incline Bench'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1003,
    name: 'Barbell Conventional Deadlift',
    category: 'Back',
    description: 'Stand with feet hip-width apart, barbell over mid-foot. Hinge at hips and grip bar outside legs. Push chest out, engage lats, take slack out of the bar. Drive through the floor, extending hips and knees simultaneously to full lockout.',
    primaryMuscles: ['Latissimus dorsi', 'Gluteus maximus', 'Hamstrings'],
    secondaryMuscles: ['Trapezius', 'Quadriceps', 'Core'],
    equipment: ['Barbell'],
    images: ['https://wger.de/media/exercise-images/105/deadlift-1.png'],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1004,
    name: 'Overhand Pull-Up',
    category: 'Back',
    description: 'Grip overhead bar slightly wider than shoulder-width with palms facing away. Hang at full extension. Depress shoulder blades and pull chest up towards the bar by driving elbows downward into ribs.',
    primaryMuscles: ['Latissimus dorsi', 'Teres major'],
    secondaryMuscles: ['Biceps brachii', 'Rhomboids'],
    equipment: ['Pull-Up Bar'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1005,
    name: 'Barbell Back Squat',
    category: 'Legs',
    description: 'Rest bar securely on upper traps (high bar) or rear delts (low bar). Stand feet shoulder-width, toes slightly flared. Brace core, break at hips and knees together. Descend until hip crease is below parallel, then drive forcefully up through mid-foot.',
    primaryMuscles: ['Quadriceps femoris', 'Gluteus maximus'],
    secondaryMuscles: ['Hamstrings', 'Adductors', 'Core'],
    equipment: ['Barbell', 'Squat Rack'],
    images: ['https://wger.de/media/exercise-images/111/squat-1.png'],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1006,
    name: 'Romanian Deadlift (RDL)',
    category: 'Legs',
    description: 'Hold barbell with overhand grip at hip height. Keep slight bend in knees. Hinge hips back as if touching a wall behind you, sliding bar down along shins until maximum hamstring stretch. Drive hips forward to stand.',
    primaryMuscles: ['Hamstrings', 'Gluteus maximus'],
    secondaryMuscles: ['Latissimus dorsi', 'Erector spinae'],
    equipment: ['Barbell'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1007,
    name: 'Overhead Barbell Military Press',
    category: 'Shoulders',
    description: 'Stand tall with core braced and glutes squeezed. Grip bar at collarbone height. Press straight upward, moving head back slightly to clear the bar path, then bring head through window at top lockout.',
    primaryMuscles: ['Anterior deltoid', 'Lateral deltoid'],
    secondaryMuscles: ['Triceps brachii', 'Upper Trapezius', 'Core'],
    equipment: ['Barbell'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1008,
    name: 'Dumbbell Lateral Raise',
    category: 'Shoulders',
    description: 'Stand with dumbbells at sides, slight forward torso lean of 10 degrees. Raise arms outward in the scapular plane with elbows slightly bent until parallel to floor. Pause briefly at apex, then control negative.',
    primaryMuscles: ['Lateral deltoid'],
    secondaryMuscles: ['Trapezius', 'Supraspinatus'],
    equipment: ['Dumbbell'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1009,
    name: 'Standing Barbell Bicep Curl',
    category: 'Arms',
    description: 'Hold barbell with underhand grip at shoulder-width. Keep elbows pinned tight against ribs. Curl bar upward towards chest while contracting biceps hard at top. Lower under steady 2-second tempo.',
    primaryMuscles: ['Biceps brachii', 'Brachialis'],
    secondaryMuscles: ['Forearms'],
    equipment: ['Barbell'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1010,
    name: 'Lying Triceps Skull Crusher',
    category: 'Arms',
    description: 'Lie on flat bench holding EZ-curl bar or dumbbells directly above shoulders. Keep upper arms vertical and fixed in place. Bend elbows to lower weight smoothly toward forehead, then extend elbows back to straight.',
    primaryMuscles: ['Triceps brachii (Long & Lateral Head)'],
    secondaryMuscles: ['Anconeous'],
    equipment: ['EZ-Bar', 'Bench'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1011,
    name: 'Hanging Leg Raise',
    category: 'Core',
    description: 'Hang from pull-up bar with straight arms. Tilt pelvis backwards to engage deep abdominals. Raise legs with straight knees (or bent for beginners) until thighs are at or above parallel to floor. Lower with zero swinging.',
    primaryMuscles: ['Rectus abdominis', 'Iliopsoas'],
    secondaryMuscles: ['Obliques'],
    equipment: ['Pull-Up Bar'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1012,
    name: 'Seated Cable Row',
    category: 'Back',
    description: 'Sit on cable bench with knees slightly bent and feet firmly on footplates. Grasp V-bar handle. Keep upright spine, pull handles into belly button while squeezing shoulder blades together. Slowly extend arms back forward.',
    primaryMuscles: ['Latissimus dorsi', 'Rhomboids', 'Middle Trapezius'],
    secondaryMuscles: ['Biceps brachii', 'Rear Deltoid'],
    equipment: ['Cable Machine'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1013,
    name: 'Bulgarian Split Squat',
    category: 'Legs',
    description: 'Stand two feet in front of a flat bench. Place top of back foot onto the bench. Lower rear knee down towards floor until front thigh is parallel. Drive up through front heel to return to top.',
    primaryMuscles: ['Quadriceps femoris', 'Gluteus maximus'],
    secondaryMuscles: ['Hamstrings', 'Calves'],
    equipment: ['Dumbbell', 'Bench'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1014,
    name: 'Cable Triceps Rope Pushdown',
    category: 'Arms',
    description: 'Attach rope handle to high cable pulley. Keep elbows tucked at sides. Push rope down until arms are fully extended, flaring the rope outward at bottom for peak triceps contraction.',
    primaryMuscles: ['Triceps brachii (Lateral head)'],
    secondaryMuscles: ['Forearms'],
    equipment: ['Cable Machine'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
  {
    id: 1015,
    name: 'Cable Face Pull',
    category: 'Shoulders',
    description: 'Set pulley at upper chest height with rope attachment. Grip rope with thumbs pointing backward. Step back to create tension. Pull rope straight towards forehead/eyes while separating hands outward.',
    primaryMuscles: ['Posterior deltoid', 'Infraspinatus', 'Trapezius'],
    secondaryMuscles: ['Rhomboids', 'Biceps'],
    equipment: ['Cable Machine'],
    images: [],
    licenseAuthor: 'wger Workout Manager Community',
  },
];

let cachedWgerExercises: WgerExercise[] | null = null;

/**
 * Fetch exercises from wger Workout Manager API
 * Falls back gracefully to offline dataset if network is down or API limits apply
 */
export const fetchWgerExercises = async (): Promise<WgerExercise[]> => {
  if (cachedWgerExercises && cachedWgerExercises.length > 0) {
    return cachedWgerExercises;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${WGER_BASE_URL}/exerciseinfo/?language=2&limit=60`, {
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`wger API response code: ${res.status}`);
    }

    const data = await res.json();
    const results = data.results || [];

    const parsed: WgerExercise[] = results
      .map((item: any) => {
        const primaryMuscles = (item.muscles || []).map((m: any) => m.name_en || m.name);
        const secondaryMuscles = (item.muscles_secondary || []).map((m: any) => m.name_en || m.name);
        const equipment = (item.equipment || []).map((e: any) => e.name);
        const images = (item.images || []).map((img: any) => img.image);

        return {
          id: item.id,
          name: item.name ? item.name.trim() : 'Unknown Exercise',
          category: item.category?.name || 'Strength',
          description: stripHtml(item.description || ''),
          primaryMuscles,
          secondaryMuscles,
          equipment,
          images,
          licenseAuthor: item.license_author || 'wger Workout Manager Community',
        };
      })
      .filter((ex: WgerExercise) => ex.name.length > 2);

    if (parsed.length > 0) {
      // Merge with offline fallbacks to ensure full catalog richness
      const map = new Map<string, WgerExercise>();
      for (const f of WGER_FALLBACK_EXERCISES) map.set(f.name.toLowerCase(), f);
      for (const p of parsed) map.set(p.name.toLowerCase(), p);
      cachedWgerExercises = Array.from(map.values());
      return cachedWgerExercises;
    }
  } catch (err) {
    console.warn('wger API network fetch fallback:', err);
  }

  // Safe offline fallback
  cachedWgerExercises = WGER_FALLBACK_EXERCISES;
  return cachedWgerExercises;
};

/**
 * Filter wger exercises by query and muscle group
 */
export const searchWgerExercises = async (
  query: string = '',
  muscleFilter: string = 'ALL'
): Promise<WgerExercise[]> => {
  const all = await fetchWgerExercises();
  const q = query.trim().toLowerCase();

  return all.filter((item) => {
    // Text search
    if (q.length > 0) {
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchEquip = item.equipment.some((e) => e.toLowerCase().includes(q));
      const matchMuscle = item.primaryMuscles.some((m) => m.toLowerCase().includes(q));
      if (!matchName && !matchDesc && !matchEquip && !matchMuscle) return false;
    }

    // Muscle filter
    if (muscleFilter !== 'ALL') {
      const primaryCore = item.primaryMuscles.length > 0
        ? mapWgerMuscleToCore(item.primaryMuscles[0])
        : mapWgerMuscleToCore(item.category);
      if (primaryCore !== muscleFilter.toUpperCase()) return false;
    }

    return true;
  });
};

/**
 * Import a wger exercise directly into the local SQLite exercises table
 */
export const importWgerExerciseToLocalDb = (item: WgerExercise): Exercise => {
  const localId = `wger_${item.id}`;
  const primaryMuscle = item.primaryMuscles.length > 0
    ? mapWgerMuscleToCore(item.primaryMuscles[0])
    : mapWgerMuscleToCore(item.category);

  const equipmentStr = item.equipment.length > 0 ? item.equipment.join(', ').toUpperCase() : 'FREE WEIGHTS';
  const defaultYoutubeId = 'vcBig73ojpE';
  const instructionsText = item.description || 'Controlled cadence, full range of motion, and maintain muscular tension.';

  const newExercise: Exercise = {
    id: localId,
    name: item.name.trim(),
    primary_muscle: primaryMuscle,
    equipment: equipmentStr,
    youtube_video_id: defaultYoutubeId,
    instructions: instructionsText,
  };

  try {
    const existing = db.getFirstSync<Exercise>(
      `SELECT * FROM exercises WHERE id = ? OR LOWER(name) = LOWER(?)`,
      [localId, item.name.trim()]
    );

    if (existing) {
      return existing;
    }

    db.runSync(
      `INSERT INTO exercises (id, name, primary_muscle, equipment, youtube_video_id, instructions)
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
  } catch (err) {
    console.warn('Failed to insert wger exercise to SQLite:', err);
    return newExercise;
  }
};
