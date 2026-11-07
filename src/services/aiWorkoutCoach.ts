import { db, UserProfile } from '../db/database';
import { WorkoutRoutine } from '../db/routines';

export interface GeneratedExerciseItem {
  id: string;
  name: string;
  muscle: string;
  targetSets: number;
  repsRange: string;
  rpe: number;
  restSec: number;
  coachingCue: string;
}

export interface GeneratedWorkoutPlan {
  title: string;
  tagline: string;
  split: 'PUSH' | 'PULL' | 'LEGS' | 'UPPER' | 'LOWER' | 'ARMS' | 'FULL_BODY';
  estimatedMinutes: number;
  coachTips: string;
  exercises: GeneratedExerciseItem[];
}

export const generateAiWorkoutPlan = async (
  userPrompt: string = '45 minute high intensity hypertrophy workout',
  userProfile?: UserProfile
): Promise<GeneratedWorkoutPlan> => {
  // Check if user has saved a Gemini API key
  const settings = db.getFirstSync<{ gemini_api_key?: string }>(
    'SELECT gemini_api_key FROM user_settings WHERE id = 1'
  );
  const apiKey = (userProfile?.geminiApiKey || settings?.gemini_api_key || '').trim();

  if (apiKey && apiKey.length > 10) {
    try {
      const persona = userProfile?.aiCoachPersona || 'Evidence-Based Sports Scientist';
      const systemPrompt = `You are an elite fitness coach acting as: "${persona}". Return ONLY a valid JSON object (no markdown, no backticks, no prose) with this exact structure:
{
  "title": "string (punchy workout title)",
  "tagline": "string (1-sentence description)",
  "split": "PUSH" | "PULL" | "LEGS" | "UPPER" | "LOWER" | "ARMS" | "FULL_BODY",
  "estimatedMinutes": number,
  "coachTips": "string (brief warm-up & intensity cues matching the coach persona)",
  "exercises": [
    {
      "id": "string (lowercase_underscore)",
      "name": "string (standard exercise name)",
      "muscle": "CHEST" | "BACK" | "LEGS" | "SHOULDERS" | "ARMS" | "CORE",
      "targetSets": number,
      "repsRange": "string (e.g. 8-10)",
      "rpe": number,
      "restSec": number,
      "coachingCue": "string"
    }
  ]
}

Athlete Profile Context:
- Experience Level: ${userProfile?.experienceLevel || 'Intermediate'}
- Primary Goal: ${userProfile?.fitnessGoal || 'Hypertrophy & Muscle Building'}
- Body Weight: ${userProfile?.bodyWeightKg || 75} KG
- Available Equipment: ${userProfile?.availableEquipment || 'Commercial Gym'}
- Preferred Split: ${userProfile?.preferredSplit || 'Push / Pull / Legs (PPL)'}
`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt },
                  { text: `Create an optimal workout routine for: ${userPrompt}` },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 1000,
            },
          }),
        }
      );

      if (res.ok) {
        const json = await res.json();
        const textResponse = json.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textResponse) {
          const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed: GeneratedWorkoutPlan = JSON.parse(jsonMatch[0]);
            if (parsed.title && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
              return parsed;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Gemini AI workout generation failed, using sports science fallback:', e);
    }
  }

  // Sports Science Algorithmic Fallback (100% Offline & Instant)
  const lowerPrompt = userPrompt.toLowerCase();

  if (lowerPrompt.includes('pull') || lowerPrompt.includes('back') || lowerPrompt.includes('bicep')) {
    return {
      title: 'Alpha Pull & Bicep Specialization',
      tagline: 'V-Taper lat width, spinal erectors and peak bicep recruitment',
      split: 'PULL',
      estimatedMinutes: 50,
      coachTips: 'Warm up with 2 sets of band pull-aparts. Focus on driving elbows down toward back pockets rather than yanking with hands.',
      exercises: [
        {
          id: 'conventional_deadlift',
          name: 'Barbell Conventional Deadlift',
          muscle: 'BACK',
          targetSets: 3,
          repsRange: '5-6 reps',
          rpe: 8.5,
          restSec: 150,
          coachingCue: 'Pack lats, pull slack out of bar, drive feet through the floor.',
        },
        {
          id: 'lat_pulldown',
          name: 'Wide-Grip Lat Pulldown',
          muscle: 'BACK',
          targetSets: 3,
          repsRange: '8-10 reps',
          rpe: 8,
          restSec: 90,
          coachingCue: 'Slight torso lean, squeeze lower lats at bottom for 1s.',
        },
        {
          id: 'barbell_bent_row',
          name: 'Barbell Bent-Over Row',
          muscle: 'BACK',
          targetSets: 3,
          repsRange: '8-10 reps',
          rpe: 8,
          restSec: 90,
          coachingCue: 'Hinge hips to 45 degrees, pull bar to belly button.',
        },
        {
          id: 'face_pulls',
          name: 'Cable Face Pulls',
          muscle: 'BACK',
          targetSets: 3,
          repsRange: '12-15 reps',
          rpe: 8,
          restSec: 60,
          coachingCue: 'Pull to eyebrow level, externally rotate wrists.',
        },
        {
          id: 'barbell_bicep_curl',
          name: 'Standing Barbell Bicep Curl',
          muscle: 'ARMS',
          targetSets: 3,
          repsRange: '8-10 reps',
          rpe: 8.5,
          restSec: 75,
          coachingCue: 'Pin elbows to ribs, squeeze biceps hard at top.',
        },
      ],
    };
  }

  if (lowerPrompt.includes('leg') || lowerPrompt.includes('squat') || lowerPrompt.includes('lower')) {
    return {
      title: 'High-Threshold Quad & Posterior Blast',
      tagline: 'Compound knee extension, hip hinging and calf strength',
      split: 'LEGS',
      estimatedMinutes: 55,
      coachTips: 'Perform 5 minutes of hip mobility and bodyweight squats before touching loaded bar. Hit parallel on every squat rep.',
      exercises: [
        {
          id: 'barbell_back_squat',
          name: 'Barbell Back Squat',
          muscle: 'LEGS',
          targetSets: 4,
          repsRange: '6-8 reps',
          rpe: 8.5,
          restSec: 180,
          coachingCue: 'Brace core 360°, break at hips and knees simultaneously.',
        },
        {
          id: 'romanian_deadlift',
          name: 'Romanian Deadlift (RDL)',
          muscle: 'LEGS',
          targetSets: 3,
          repsRange: '8-10 reps',
          rpe: 8,
          restSec: 120,
          coachingCue: 'Push hips backward until deep hamstring stretch, keep spine neutral.',
        },
        {
          id: 'leg_press',
          name: '45° Incline Leg Press',
          muscle: 'LEGS',
          targetSets: 3,
          repsRange: '10-12 reps',
          rpe: 8.5,
          restSec: 90,
          coachingCue: 'Feet shoulder width on platform, descend deep without pelvic tilt.',
        },
        {
          id: 'lying_leg_curls',
          name: 'Lying Hamstring Leg Curls',
          muscle: 'LEGS',
          targetSets: 3,
          repsRange: '10-12 reps',
          rpe: 9,
          restSec: 75,
          coachingCue: 'Control the 3-second negative eccentric phase.',
        },
        {
          id: 'standing_calf_raise',
          name: 'Standing Calf Raise',
          muscle: 'LEGS',
          targetSets: 4,
          repsRange: '12-15 reps',
          rpe: 9,
          restSec: 60,
          coachingCue: 'Full stretch at bottom, pause 2 seconds at peak contraction.',
        },
      ],
    };
  }

  // Default: Push / Upper Hypertrophy
  return {
    title: 'Push Day Hypertrophy & Deltoid Sculpt',
    tagline: 'Maximum clavicular pec activation, lateral delts and tricep lockout',
    split: 'PUSH',
    estimatedMinutes: 48,
    coachTips: 'Warm up rotator cuffs with light external rotations. Retract scapula on all pressing movements.',
    exercises: [
      {
        id: 'barbell_bench_press',
        name: 'Barbell Flat Bench Press',
        muscle: 'CHEST',
        targetSets: 4,
        repsRange: '6-8 reps',
        rpe: 8.5,
        restSec: 150,
        coachingCue: 'Plant feet, arch slightly, drive bar off lower chest.',
      },
      {
        id: 'incline_dumbbell_press',
        name: 'Incline Dumbbell Press',
        muscle: 'CHEST',
        targetSets: 3,
        repsRange: '8-10 reps',
        rpe: 8,
        restSec: 90,
        coachingCue: '30-degree incline, tuck elbows at 45 degrees, stretch pecs.',
      },
      {
        id: 'overhead_barbell_press',
        name: 'Overhead Barbell Military Press',
        muscle: 'SHOULDERS',
        targetSets: 3,
        repsRange: '6-8 reps',
        rpe: 8.5,
        restSec: 120,
        coachingCue: 'Squeeze glutes to protect spine, press vertically around head.',
      },
      {
        id: 'cable_lateral_raise',
        name: 'Single-Arm Cable Lateral Raise',
        muscle: 'SHOULDERS',
        targetSets: 3,
        repsRange: '12-15 reps',
        rpe: 9,
        restSec: 60,
        coachingCue: 'Keep constant tension on medial deltoid, do not swing torso.',
      },
      {
        id: 'cable_tricep_pushdown',
        name: 'Cable Tricep Rope Pushdown',
        muscle: 'ARMS',
        targetSets: 3,
        repsRange: '10-12 reps',
        rpe: 8.5,
        restSec: 60,
        coachingCue: 'Lock elbows at ribs, flare rope apart at bottom lockout.',
      },
    ],
  };
};

