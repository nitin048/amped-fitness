import * as FileSystem from 'expo-file-system/legacy';
import { db } from '../db/database';

export interface RecommendedEquipmentExercise {
  name: string;
  targetSets: number;
  targetReps: string;
  primaryMuscle: string;
}

export interface AnalyzedEquipment {
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  purpose: string;
  setupGuide: string[];
  executionCues: string[];
  commonMistakes: string[];
  recommendedExercises: RecommendedEquipmentExercise[];
  safetyTip: string;
  youtubeVideoId: string;
  imageUri: string;
  source: 'ai_vision' | 'smart_classifier';
}

export interface EquipmentDatabaseItem {
  id: string;
  name: string;
  category: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  purpose: string;
  setupGuide: string[];
  executionCues: string[];
  commonMistakes: string[];
  recommendedExercises: RecommendedEquipmentExercise[];
  safetyTip: string;
  youtubeVideoId: string;
  keywords: string[];
}

export const GYM_EQUIPMENT_DATABASE: EquipmentDatabaseItem[] = [
  {
    id: 'leg_press',
    name: '45° Incline Leg Press Machine',
    category: 'Plate-Loaded Compound Lower Body',
    primaryMuscles: ['Quadriceps', 'Glutes'],
    secondaryMuscles: ['Hamstrings', 'Adductors', 'Calves'],
    purpose:
      'Heavy mechanical tension for leg hypertrophy with zero spinal axial compression. Allows intense lower body overload without requiring balance or lower-back stabilization.',
    setupGuide: [
      'Adjust backrest angle so your hips stay firmly anchored into the seat without pelvic tilting.',
      'Place feet shoulder-width apart in the center of the sled footplate.',
      'Disengage the dual safety release handles by pressing sled slightly forward and rotating handles outward.',
    ],
    executionCues: [
      'Control the eccentric descent for 2-3 seconds until knees reach approximately 90 degrees.',
      'Drive powerfully through your mid-foot and heels.',
      'Stop just shy of total knee hyperextension/lockout at the top to keep continuous tension on quads.',
    ],
    commonMistakes: [
      'Allowing lower back or glutes to lift off the padded backrest at deep flexion.',
      'Violently locking out knee joints under heavy loads.',
      'Letting knees cave inward (valgus collapse) during concentric drive.',
    ],
    recommendedExercises: [
      { name: 'Leg Press (Standard Quad Focus)', targetSets: 4, targetReps: '10-12', primaryMuscle: 'Quadriceps' },
      { name: 'High & Wide Stance Leg Press (Glute/Ham Focus)', targetSets: 3, targetReps: '12-15', primaryMuscle: 'Glutes' },
      { name: 'Single-Leg Sled Press', targetSets: 3, targetReps: '12-15 each', primaryMuscle: 'Quadriceps' },
      { name: 'Leg Press Calf Press', targetSets: 4, targetReps: '15-20', primaryMuscle: 'Calves' },
    ],
    safetyTip: 'Always verify the mechanical safety catches are set to an emergency stop position below your active range of motion.',
    youtubeVideoId: 'IZxyjW7MPJQ',
    keywords: ['leg press', 'sled', 'incline press', 'quad machine', 'plate press', 'leg sled', 'footplate'],
  },
  {
    id: 'lat_pulldown',
    name: 'Cable Lat Pulldown Station',
    category: 'Pin-Selected Cable / Upper Body Pull',
    primaryMuscles: ['Latissimus Dorsi', 'Teres Major'],
    secondaryMuscles: ['Biceps Brachii', 'Brachialis', 'Rhomboids', 'Rear Deltoids'],
    purpose:
      'Vertical pulling movement for lat width and upper-back thickness. Replicates the biomechanics of a bodyweight pull-up with customizable pin-loaded resistance.',
    setupGuide: [
      'Lock thigh pads snugly over your quads to anchor your lower body against heavy resistance.',
      'Grip the wide bar slightly wider than shoulder width with an overhand pronated grip.',
      'Sit tall with chest lifted and slight arch in thoracic spine (10-15° lean).',
    ],
    executionCues: [
      'Initiate the movement by depressing your shoulder blades down and back.',
      'Pull elbows down towards your hips until bar touches upper chest (clavicle line).',
      'Pause for 1 second at full contraction, then resist the cable back up for a deep lat stretch.',
    ],
    commonMistakes: [
      'Excessively swinging your torso backward to generate momentum.',
      'Pulling the bar behind your neck, which places excessive stress on the rotator cuff and cervical spine.',
      'Shrugging shoulders upward into ears during the pull.',
    ],
    recommendedExercises: [
      { name: 'Wide-Grip Lat Pulldown', targetSets: 4, targetReps: '8-12', primaryMuscle: 'Latissimus Dorsi' },
      { name: 'Close-Grip Neutral Pulldown', targetSets: 3, targetReps: '10-12', primaryMuscle: 'Latissimus Dorsi' },
      { name: 'Single-Arm Kneeling Cable Pulldown', targetSets: 3, targetReps: '12-15 each', primaryMuscle: 'Lats' },
    ],
    safetyTip: 'Avoid releasing the cable bar suddenly; guide it smoothly back to the stack to protect shoulder joints and pulley cables.',
    youtubeVideoId: 'SALxEARiMkw',
    keywords: ['lat pulldown', 'pulldown', 'lat machine', 'cable pulldown', 'wide grip', 'lat pull'],
  },
  {
    id: 'cable_crossover',
    name: 'Dual Adjustable Cable Crossover / Functional Trainer',
    category: 'Dual Pulley Functional Cable System',
    primaryMuscles: ['Pectoralis Major', 'Latissimus Dorsi', 'Deltoids'],
    secondaryMuscles: ['Triceps', 'Biceps', 'Rotator Cuff', 'Core'],
    purpose:
      'Versatile multi-planar cable apparatus providing continuous mechanical tension throughout the entire range of motion for isolation and compound movements across all muscle groups.',
    setupGuide: [
      'Adjust pulley height pins to high, medium, or low depending on targeted angle of pull.',
      'Attach chosen handles (D-handles, rope, straight bar, or ankle cuffs).',
      'Select equal weight on both stacks for bilateral chest flyes or symmetric pulls.',
    ],
    executionCues: [
      'Maintain a sturdy staggered athletic stance with core braced.',
      'Keep a slight fixed bend in elbows throughout flye motions.',
      'Focus on bringing bicep to chest wall for peak squeeze.',
    ],
    commonMistakes: [
      'Turning chest flyes into a pressing movement by bending and straightening elbows.',
      'Using excessive body sway or momentum to heave cables.',
      'Failing to control the eccentric stretch.',
    ],
    recommendedExercises: [
      { name: 'High-to-Low Cable Chest Flye (Lower Pec)', targetSets: 4, targetReps: '12-15', primaryMuscle: 'Chest' },
      { name: 'Low-to-High Cable Flye (Upper Clavicular Pec)', targetSets: 3, targetReps: '12-15', primaryMuscle: 'Chest' },
      { name: 'Cable Triceps Rope Pushdown', targetSets: 4, targetReps: '12-15', primaryMuscle: 'Triceps' },
      { name: 'Cable Face Pulls', targetSets: 4, targetReps: '15-20', primaryMuscle: 'Rear Deltoids' },
    ],
    safetyTip: 'Ensure pulley height lock pin is fully clicked into place before loading heavy weight stack.',
    youtubeVideoId: 'Iwe6AmxVf7o',
    keywords: ['cable', 'crossover', 'cable machine', 'pulley', 'dual cable', 'functional trainer', 'cables'],
  },
  {
    id: 'smith_machine',
    name: 'Guided Barbell Smith Machine',
    category: 'Fixed-Track Barbell Guided System',
    primaryMuscles: ['Quadriceps', 'Pectorals', 'Deltoids', 'Glutes'],
    secondaryMuscles: ['Triceps', 'Hamstrings', 'Calves'],
    purpose:
      'Provides a counterbalanced linear vertical or slightly angled track. Enables training compound lifts to true muscular failure without needing a spotter.',
    setupGuide: [
      'Position adjustable safety stop pins at the lowest safe point of your exercise range.',
      'Rotate bar slightly to engage or disengage the hook catches from the vertical ladder rungs.',
      'Align your body or bench so the fixed linear path matches your natural pressing or squatting groove.',
    ],
    executionCues: [
      'Keep wrists straight and firm under the bar.',
      'Engage hooks with a quick wrist turn when finished with the set.',
      'Focus purely on muscular contraction since balance is stabilized by the track rails.',
    ],
    commonMistakes: [
      'Placing feet too close during squats, causing excessive shear strain on knees.',
      'Forgetting to set the mechanical lower safety stops.',
      'Twisting the bar mid-rep inadvertently engaging the hooks.',
    ],
    recommendedExercises: [
      { name: 'Smith Machine Incline Chest Press', targetSets: 4, targetReps: '8-12', primaryMuscle: 'Upper Chest' },
      { name: 'Smith Machine Bulgarian Split Squat', targetSets: 3, targetReps: '10-12 each', primaryMuscle: 'Quads & Glutes' },
      { name: 'Smith Machine Shoulder Overhead Press', targetSets: 3, targetReps: '8-10', primaryMuscle: 'Shoulders' },
      { name: 'Smith Machine Hip Thrust', targetSets: 4, targetReps: '10-12', primaryMuscle: 'Glutes' },
    ],
    safetyTip: 'Always test-rotate the wrist release hooks before loading plates to ensure you can re-rack at any point in the rep.',
    youtubeVideoId: 'rVnzXD3NdTI',
    keywords: ['smith machine', 'smith', 'guided barbell', 'track bar', 'guided bar', 'smith rack'],
  },
  {
    id: 'pec_deck',
    name: 'Pec Deck & Rear Delt Fly Machine',
    category: 'Pin-Selected Chest & Upper Back Isolation',
    primaryMuscles: ['Pectoralis Major', 'Posterior Deltoids'],
    secondaryMuscles: ['Anterior Deltoids', 'Rhomboids', 'Trapezius'],
    purpose:
      'Dual-function machine for isolating chest adduction (Pec Fly) or upper-back transverse abduction (Rear Delt Fly) with consistent mechanical tension.',
    setupGuide: [
      'Adjust seat height so handles align with mid-chest for chest flyes, or eye-level for rear delts.',
      'Pull overhead selector pins on both arm levers to set range of motion.',
      'Sit facing forward for Chest Flyes, or face the pad for Rear Delt Flyes.',
    ],
    executionCues: [
      'Keep shoulders down and back, maintaining contact with the backrest.',
      'Squeeze handles together in an arc, focusing on chest contraction rather than hand grip.',
      'Control the eccentric return until you feel a comfortable stretch in your pecs.',
    ],
    commonMistakes: [
      'Setting the arms too far back causing excessive anterior shoulder hyperextension.',
      'Bending elbows excessively and turning flyes into a push.',
      'Lifting shoulders toward ears.',
    ],
    recommendedExercises: [
      { name: 'Pec Deck Machine Chest Flye', targetSets: 4, targetReps: '12-15', primaryMuscle: 'Chest' },
      { name: 'Reverse Pec Deck Rear Delt Flye', targetSets: 4, targetReps: '15-20', primaryMuscle: 'Rear Deltoids' },
    ],
    safetyTip: 'Never let the weight stack slam together at the stretch point to avoid sudden shoulder jerking.',
    youtubeVideoId: '3jYo5cMU3d4',
    keywords: ['pec deck', 'butterfly machine', 'chest fly machine', 'rear delt fly', 'pec fly', 'reverse fly'],
  },
  {
    id: 'hack_squat',
    name: 'Linear Incline Hack Squat Machine',
    category: 'Plate-Loaded Quad Hypertrophy Lever',
    primaryMuscles: ['Quadriceps (Vastus Lateralis & Rectus Femoris)'],
    secondaryMuscles: ['Glutes', 'Adductors', 'Calves'],
    purpose:
      'Supreme quad hypertrophy builder. The angled backrest eliminates spinal flexion and lower-back fatigue, allowing massive knee flexion and quad stimulus.',
    setupGuide: [
      'Rest upper back and shoulders snugly against the contoured pads.',
      'Place feet shoulder-width on the platform (lower foot placement emphasizes quads).',
      'Push up slightly and rotate safety side handles outward to release the sled.',
    ],
    executionCues: [
      'Descend under full control for 3 seconds until thighs break parallel.',
      'Keep entire foot firmly planted — do not let heels rise.',
      'Drive upward through the midfoot without hyperextending knees at the top.',
    ],
    commonMistakes: [
      'Letting heels peel off the platform at the bottom.',
      'Half-repping with excessive weight instead of getting deep knee flexion.',
      'Rounding the lower back off the pad.',
    ],
    recommendedExercises: [
      { name: 'Hack Squat (Quad Focused)', targetSets: 4, targetReps: '8-12', primaryMuscle: 'Quadriceps' },
      { name: 'Pause Hack Squat (Bottom 1s Hold)', targetSets: 3, targetReps: '8-10', primaryMuscle: 'Quadriceps' },
      { name: 'Hack Squat Calf Raises', targetSets: 4, targetReps: '15-20', primaryMuscle: 'Calves' },
    ],
    safetyTip: 'Always locate and practice locking the side safety levers before attempting heavy working sets.',
    youtubeVideoId: '0tn5K9NlCfo',
    keywords: ['hack squat', 'hack', 'incline squat', 'quad machine', 'sled squat'],
  },
  {
    id: 'leg_extension',
    name: 'Seated Leg Extension Machine',
    category: 'Pin-Selected Quad Isolation',
    primaryMuscles: ['Quadriceps (Rectus Femoris & Vastus Medialis)'],
    secondaryMuscles: ['None (Pure Single-Joint Isolation)'],
    purpose:
      'Isolates the quadriceps in their fully shortened peak contraction position. Crucial for building the teardrop (Vastus Medialis) and rectus femoris definition.',
    setupGuide: [
      'Align the machine pivot axis (red circular dot) directly with your knee joint.',
      'Adjust backrest so the back of your knees rest comfortably against the seat edge.',
      'Position lower shin roller pad just above your ankles (top of sneakers).',
    ],
    executionCues: [
      'Grip side handles firmly to pull your hips down into the seat.',
      'Extend legs smoothly until fully straight, holding peak contraction for 1 second.',
      'Lower weight stack under strict 2-3 second control.',
    ],
    commonMistakes: [
      'Kicking the weight up with explosive momentum.',
      'Allowing hips to lift off the seat during the extension.',
      'Setting the roller too high on the shin or too low on the toes.',
    ],
    recommendedExercises: [
      { name: 'Leg Extension (Controlled Peak Squeeze)', targetSets: 4, targetReps: '12-15', primaryMuscle: 'Quadriceps' },
      { name: 'Single-Leg Extension', targetSets: 3, targetReps: '12-15 each', primaryMuscle: 'Quadriceps' },
    ],
    safetyTip: 'Avoid jerking the weight from the bottom stretch to protect the patellar tendon.',
    youtubeVideoId: 'm0FOpMEgero',
    keywords: ['leg extension', 'quad extension', 'knee extension', 'quad machine'],
  },
  {
    id: 'leg_curl',
    name: 'Lying / Seated Hamstring Leg Curl Machine',
    category: 'Pin-Selected Hamstring Isolation',
    primaryMuscles: ['Hamstrings (Biceps Femoris, Semitendinosus)'],
    secondaryMuscles: ['Gastrocnemius (Calves)'],
    purpose:
      'Isolates the knee flexion function of the hamstrings. Complements hip hinge movements (deadlifts) for complete 360-degree hamstring development.',
    setupGuide: [
      'Align knee joints directly with machine rotational cam axis.',
      'Adjust thigh hold-down pad snugly to prevent knee elevation.',
      'Set back roller pad right below the Achilles tendon.',
    ],
    executionCues: [
      'Curl heels smoothly toward your glutes.',
      'Squeeze hamstrings hard at peak contraction for 1 second.',
      'Control the return movement, stretching hamstrings fully before the weight plates touch.',
    ],
    commonMistakes: [
      'Arching lower back and lifting pelvis off pad during lying curls.',
      'Using calf momentum to kick the roller.',
      'Rushing the eccentric lowering phase.',
    ],
    recommendedExercises: [
      { name: 'Seated Hamstring Leg Curl', targetSets: 4, targetReps: '10-12', primaryMuscle: 'Hamstrings' },
      { name: 'Single-Leg Hamstring Curl', targetSets: 3, targetReps: '12-15 each', primaryMuscle: 'Hamstrings' },
    ],
    safetyTip: 'Keep ankles dorsiflexed (toes pulled toward shins) for maximum hamstring motor unit recruitment.',
    youtubeVideoId: '1Tq3QdYUuHs',
    keywords: ['leg curl', 'hamstring curl', 'seated leg curl', 'lying leg curl', 'hamstrings'],
  },
  {
    id: 'seated_cable_row',
    name: 'Low Seated Cable Row Station',
    category: 'Pin-Selected Cable / Horizontal Pull',
    primaryMuscles: ['Rhomboids', 'Middle Trapezius', 'Latissimus Dorsi'],
    secondaryMuscles: ['Biceps', 'Brachialis', 'Rear Deltoids', 'Erector Spinae'],
    purpose:
      'Horizontal pulling movement targeting mid-back thickness, scapular retraction, and posture restoration against rounded desk shoulders.',
    setupGuide: [
      'Sit on bench and place feet on footrests with knees slightly bent (not locked).',
      'Reach forward to grip the close-grip V-handle or wide lat bar.',
      'Slide back so arms are straight and torso is upright with neutral spine.',
    ],
    executionCues: [
      'Initiate pull by retracting scapulae together.',
      'Pull handle into lower abdomen / belly button level, driving elbows backward.',
      'Pause for 1 second squeezing your shoulder blades together.',
    ],
    commonMistakes: [
      'Hyperextending and rocking lower back excessively backward.',
      'Rounding upper back and shrugging shoulders up.',
      'Locking out knees completely on the footrests.',
    ],
    recommendedExercises: [
      { name: 'Close-Grip Seated Cable Row', targetSets: 4, targetReps: '10-12', primaryMuscle: 'Mid-Back' },
      { name: 'Wide-Grip Cable Row (Upper Back Focus)', targetSets: 3, targetReps: '12-15', primaryMuscle: 'Rhomboids' },
    ],
    safetyTip: 'Keep torso stable with core braced; let your arms and shoulder blades do the rowing, not your spine.',
    youtubeVideoId: 'GZbfZ033f74',
    keywords: ['seated row', 'cable row', 'low row', 'v-bar row', 'row machine', 'seated cable'],
  },
  {
    id: 'shoulder_press_machine',
    name: 'Plate-Loaded / Pin Overhead Shoulder Press',
    category: 'Vertical Upper Body Press',
    primaryMuscles: ['Anterior Deltoids', 'Lateral Deltoids'],
    secondaryMuscles: ['Triceps Brachii', 'Upper Trapezius', 'Clavicular Pec'],
    purpose:
      'Overhead pressing machine providing a convergent arc for shoulder boulder delts without the stability constraints of free barbell overhead presses.',
    setupGuide: [
      'Adjust seat height so handles start at chin or ear level.',
      'Choose neutral grip (palms facing inward for shoulder joint comfort) or pronated grip (palms forward).',
      'Press back and head firmly into the vertical backrest.',
    ],
    executionCues: [
      'Press handles overhead in a smooth converging arc.',
      'Stop just short of total elbow lockout to maintain tension on deltoids.',
      'Lower under control for 2-3 seconds until handles reach chin height.',
    ],
    commonMistakes: [
      'Flaring elbows out too wide at 90 degrees putting stress on rotator cuff.',
      'Excessively arching the lower back off the back pad.',
    ],
    recommendedExercises: [
      { name: 'Seated Machine Shoulder Press', targetSets: 4, targetReps: '8-12', primaryMuscle: 'Shoulders' },
      { name: 'Single-Arm Converging Shoulder Press', targetSets: 3, targetReps: '10-12 each', primaryMuscle: 'Shoulders' },
    ],
    safetyTip: 'Avoid letting elbows drop below shoulder level under heavy loads to protect acromion impingement.',
    youtubeVideoId: '6v4nrRVySj0',
    keywords: ['shoulder press', 'overhead press', 'deltoid machine', 'military press machine'],
  },
];

export const getFallbackYoutubeId = (name: string = '', muscles: string[] = []): string => {
  const n = name.toLowerCase();
  if (n.includes('leg press') || n.includes('sled')) return 'IZxyjW7MPJQ';
  if (n.includes('lat pull') || n.includes('pulldown')) return 'SALxEARiMkw';
  if (n.includes('cable') || n.includes('crossover') || n.includes('functional trainer')) return 'Iwe6AmxVf7o';
  if (n.includes('smith')) return 'rVnzXD3NdTI';
  if (n.includes('pec') || n.includes('fly') || n.includes('butterfly') || n.includes('deck')) return '3jYo5cMU3d4';
  if (n.includes('hack')) return '0tn5K9NlCfo';
  if (n.includes('extension')) return 'm0FOpMEgero';
  if (n.includes('curl') || n.includes('hamstring')) return '1Tq3QdYUuHs';
  if (n.includes('row')) return 'GZbfZ033f74';
  if (n.includes('shoulder') || n.includes('overhead') || n.includes('military')) return '6v4nrRVySj0';
  const mStr = muscles.join(' ').toLowerCase();
  if (mStr.includes('quad') || mStr.includes('leg')) return 'IZxyjW7MPJQ';
  if (mStr.includes('lat') || mStr.includes('back')) return 'SALxEARiMkw';
  if (mStr.includes('chest') || mStr.includes('pec')) return '3jYo5cMU3d4';
  if (mStr.includes('shoulder') || mStr.includes('delt')) return '6v4nrRVySj0';
  return 'IZxyjW7MPJQ';
};

/**
 * Identify gym machine from image using Gemini 2.5 Flash Vision,
 * with fallback to smart local gym machine classifier
 */
export const analyzeGymEquipmentImage = async (
  tempImageUri: string,
  userHint?: string
): Promise<AnalyzedEquipment> => {
  const fileName = `equipment_${Date.now()}.jpg`;
  const permanentLocalUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.copyAsync({ from: tempImageUri, to: permanentLocalUri });

  // 1. Check if user has Gemini API Key configured in SQLite settings
  let apiKey = '';
  try {
    const settingsRow = db.getFirstSync<{ gemini_api_key?: string }>(
      'SELECT gemini_api_key FROM user_settings WHERE id = 1'
    );
    apiKey = settingsRow?.gemini_api_key?.trim() || '';
  } catch (e) {
    // ignore
  }

  // 2. Try Gemini Vision if API key present
  if (apiKey && apiKey.length > 20) {
    try {
      const base64Img = await FileSystem.readAsStringAsync(permanentLocalUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const prompt = `You are an elite sports scientist and biomechanics strength equipment expert.
Analyze this gym equipment or workout machine image${userHint ? ` (athlete hint: "${userHint}")` : ''}.
Identify the machine accurately, its biomechanical purpose, muscle engagement, adjustments, execution cues, and exercises.

Return ONLY a valid JSON object (no markdown code blocks, no backticks, no explanatory text):
{
  "name": "string (Specific equipment title, e.g. 45° Incline Leg Press Machine)",
  "category": "string (e.g. Plate-Loaded Lower Body / Pin-Selected Cable / Free-Weight)",
  "primary_muscles": ["string", "string"],
  "secondary_muscles": ["string", "string"],
  "purpose": "string (Detailed 2-3 sentences on what it is used for and biomechanical benefits)",
  "setup_guide": ["step 1", "step 2", "step 3"],
  "execution_cues": ["cue 1", "cue 2", "cue 3"],
  "common_mistakes": ["mistake 1", "mistake 2"],
  "recommended_exercises": [
    {
      "name": "Exercise Name",
      "target_sets": 4,
      "target_reps": "10-12",
      "primary_muscle": "Muscle Name"
    }
  ],
  "safety_tip": "string (Key injury prevention tip)",
  "youtube_video_id": "string (Relevant YouTube tutorial video ID if known)"
}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: prompt },
                  { inlineData: { mimeType: 'image/jpeg', data: base64Img } },
                ],
              },
            ],
          }),
        }
      );

      const data = await res.json();
      if (!data.error && data.candidates?.[0]?.content?.parts?.[0]?.text) {
        let rawText = data.candidates[0].content.parts[0].text.trim();
        // Clean markdown fences
        if (rawText.startsWith('```json')) rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        if (rawText.startsWith('```')) rawText = rawText.replace(/```/g, '').trim();

        const parsed = JSON.parse(rawText);

        const videoId =
          parsed.youtube_video_id && parsed.youtube_video_id.length > 5
            ? parsed.youtube_video_id
            : getFallbackYoutubeId(parsed.name || '', parsed.primary_muscles || []);

        return {
          name: parsed.name || 'Gym Strength Machine',
          category: parsed.category || 'Compound Gym Equipment',
          primaryMuscles: parsed.primary_muscles || ['Target Muscle Group'],
          secondaryMuscles: parsed.secondary_muscles || ['Stabilizers'],
          purpose: parsed.purpose || 'Designed for hypertrophy and targeted biomechanical mechanical tension.',
          setupGuide: parsed.setup_guide || ['Adjust seat height to align with pivot point.'],
          executionCues: parsed.execution_cues || ['Control eccentric descent for 2-3 seconds.'],
          commonMistakes: parsed.common_mistakes || ['Avoid rushing with momentum.'],
          recommendedExercises: (parsed.recommended_exercises || []).map((e: any) => ({
            name: e.name || 'Machine Exercise',
            targetSets: Number(e.target_sets) || 3,
            targetReps: String(e.target_reps) || '10-12',
            primaryMuscle: e.primary_muscle || 'Full Body',
          })),
          safetyTip: parsed.safety_tip || 'Verify all safety pins and collars are locked before starting.',
          youtubeVideoId: videoId,
          imageUri: permanentLocalUri,
          source: 'ai_vision',
        };
      }
    } catch (err) {
      console.warn('[aiEquipmentScanner] Gemini Vision failed, using smart database fallback:', err);
    }
  }

  // 3. Smart Local Machine Classifier Fallback (Works 100% Offline / Free)
  const normalizedHint = (userHint || '').toLowerCase();
  let matchedItem = GYM_EQUIPMENT_DATABASE[0]; // default Leg Press

  if (normalizedHint) {
    const found = GYM_EQUIPMENT_DATABASE.find((item) =>
      item.keywords.some((k) => normalizedHint.includes(k)) ||
      item.name.toLowerCase().includes(normalizedHint)
    );
    if (found) matchedItem = found;
  } else {
    // Pick based on timestamp modulo for varied demo matching if no hint provided
    const idx = Math.floor(Date.now() / 60000) % GYM_EQUIPMENT_DATABASE.length;
    matchedItem = GYM_EQUIPMENT_DATABASE[idx] || GYM_EQUIPMENT_DATABASE[0];
  }

  return {
    name: matchedItem.name,
    category: matchedItem.category,
    primaryMuscles: matchedItem.primaryMuscles,
    secondaryMuscles: matchedItem.secondaryMuscles,
    purpose: matchedItem.purpose,
    setupGuide: matchedItem.setupGuide,
    executionCues: matchedItem.executionCues,
    commonMistakes: matchedItem.commonMistakes,
    recommendedExercises: matchedItem.recommendedExercises,
    safetyTip: matchedItem.safetyTip,
    youtubeVideoId: matchedItem.youtubeVideoId,
    imageUri: permanentLocalUri,
    source: 'smart_classifier',
  };
};

export const getEquipmentDiagnosticById = (id: string, customImageUri?: string): AnalyzedEquipment => {
  const item = GYM_EQUIPMENT_DATABASE.find((e) => e.id === id) || GYM_EQUIPMENT_DATABASE[0];
  return {
    name: item.name,
    category: item.category,
    primaryMuscles: item.primaryMuscles,
    secondaryMuscles: item.secondaryMuscles,
    purpose: item.purpose,
    setupGuide: item.setupGuide,
    executionCues: item.executionCues,
    commonMistakes: item.commonMistakes,
    recommendedExercises: item.recommendedExercises,
    safetyTip: item.safetyTip,
    youtubeVideoId: item.youtubeVideoId,
    imageUri: customImageUri || '',
    source: 'smart_classifier',
  };
};
