import * as FileSystem from 'expo-file-system/legacy';
import { db, MealLog } from '../db/database';

export interface AnalyzedFoodItem {
  foodName: string;
  servingGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  imageUri: string;
  source: 'ai_vision' | 'smart_estimator';
  micros: {
    ironMg: number;
    magnesiumMg: number;
    zincMg: number;
    sodiumMg: number;
    fiberG: number;
  };
}

interface FoodProfile {
  name: string;
  defaultGrams: number;
  calPer100g: number;
  proPer100g: number;
  carbPer100g: number;
  fatPer100g: number;
  ironMg: number;
  magMg: number;
  zincMg: number;
  sodiumMg: number;
  fiberG: number;
  keywords: string[];
}

export const GYM_FOOD_DATABASE: FoodProfile[] = [
  {
    name: 'Whole Boiled / Scrambled Eggs',
    defaultGrams: 150,
    calPer100g: 143,
    proPer100g: 12.6,
    carbPer100g: 0.8,
    fatPer100g: 9.5,
    ironMg: 1.8,
    magMg: 12,
    zincMg: 1.3,
    sodiumMg: 140,
    fiberG: 0,
    keywords: ['egg', 'anda', 'ande', 'omelet', 'scramble', 'boiled egg', 'poached'],
  },
  {
    name: 'Grilled Chicken Breast',
    defaultGrams: 200,
    calPer100g: 165,
    proPer100g: 31,
    carbPer100g: 0,
    fatPer100g: 3.6,
    ironMg: 1.0,
    magMg: 29,
    zincMg: 1.0,
    sodiumMg: 74,
    fiberG: 0,
    keywords: ['chicken', 'breast', 'murgh', 'tandoori chicken', 'grilled chicken', 'poultry'],
  },
  {
    name: 'Fresh Grilled Paneer / Cottage Cheese',
    defaultGrams: 150,
    calPer100g: 265,
    proPer100g: 18.3,
    carbPer100g: 4.0,
    fatPer100g: 20.8,
    ironMg: 0.8,
    magMg: 28,
    zincMg: 2.1,
    sodiumMg: 18,
    fiberG: 0,
    keywords: ['paneer', 'cottage cheese', 'paneer tikka', 'paneer bhurji'],
  },
  {
    name: '100% Whey Protein Shake',
    defaultGrams: 35,
    calPer100g: 390,
    proPer100g: 78,
    carbPer100g: 7.8,
    fatPer100g: 5.6,
    ironMg: 1.8,
    magMg: 110,
    zincMg: 3.8,
    sodiumMg: 430,
    fiberG: 0,
    keywords: ['whey', 'protein shake', 'shake', 'isolate', 'smoothie', 'scoop'],
  },
  {
    name: 'Steamed Rice & Dal Bowl',
    defaultGrams: 250,
    calPer100g: 130,
    proPer100g: 3.5,
    carbPer100g: 26,
    fatPer100g: 1.2,
    ironMg: 1.2,
    magMg: 24,
    zincMg: 1.1,
    sodiumMg: 150,
    fiberG: 2.1,
    keywords: ['rice', 'dal', 'chawal', 'basmati', 'curry', 'khichdi', 'biryani'],
  },
  {
    name: 'Whole Wheat Roti / Chapati',
    defaultGrams: 120,
    calPer100g: 212,
    proPer100g: 7.5,
    carbPer100g: 42.5,
    fatPer100g: 1.3,
    ironMg: 2.7,
    magMg: 54,
    zincMg: 1.8,
    sodiumMg: 150,
    fiberG: 5.0,
    keywords: ['roti', 'chapati', 'phulka', 'paratha', 'flatbread'],
  },
  {
    name: 'Rolled Oats with Milk & Berries',
    defaultGrams: 220,
    calPer100g: 140,
    proPer100g: 6.4,
    carbPer100g: 23.6,
    fatPer100g: 2.7,
    ironMg: 1.7,
    magMg: 50,
    zincMg: 1.4,
    sodiumMg: 40,
    fiberG: 3.8,
    keywords: ['oats', 'oatmeal', 'porridge', 'muesli', 'granola'],
  },
  {
    name: 'Greek Yogurt / Thick Curd',
    defaultGrams: 170,
    calPer100g: 59,
    proPer100g: 10.0,
    carbPer100g: 3.6,
    fatPer100g: 0.4,
    ironMg: 0.1,
    magMg: 11,
    zincMg: 0.5,
    sodiumMg: 36,
    fiberG: 0,
    keywords: ['yogurt', 'greek yogurt', 'dahi', 'curd', 'hung curd'],
  },
  {
    name: 'Atlantic Salmon / Fish Fillet',
    defaultGrams: 180,
    calPer100g: 208,
    proPer100g: 22.0,
    carbPer100g: 0,
    fatPer100g: 13.0,
    ironMg: 0.8,
    magMg: 29,
    zincMg: 0.6,
    sodiumMg: 59,
    fiberG: 0,
    keywords: ['salmon', 'fish', 'fillet', 'tuna', 'machli'],
  },
  {
    name: 'Grilled Tofu / Soya Chunks Bowl',
    defaultGrams: 150,
    calPer100g: 144,
    proPer100g: 17.3,
    carbPer100g: 2.8,
    fatPer100g: 8.7,
    ironMg: 2.7,
    magMg: 58,
    zincMg: 1.6,
    sodiumMg: 14,
    fiberG: 2.3,
    keywords: ['tofu', 'soya', 'soy', 'soya chunks', 'bean curd'],
  },
  {
    name: 'Lean Beef Steak / Mutton',
    defaultGrams: 200,
    calPer100g: 250,
    proPer100g: 26.0,
    carbPer100g: 0,
    fatPer100g: 15.0,
    ironMg: 2.6,
    magMg: 21,
    zincMg: 4.8,
    sodiumMg: 72,
    fiberG: 0,
    keywords: ['steak', 'beef', 'mutton', 'lamb', 'meat'],
  },
  {
    name: 'Peanut Butter & Banana Toast',
    defaultGrams: 120,
    calPer100g: 266,
    proPer100g: 10.8,
    carbPer100g: 23.3,
    fatPer100g: 15.0,
    ironMg: 1.5,
    magMg: 62,
    zincMg: 1.3,
    sodiumMg: 200,
    fiberG: 3.8,
    keywords: ['peanut butter', 'toast', 'bread', 'banana', 'sandwich'],
  },
  {
    name: 'Chickpeas / Chana / Rajma Curry',
    defaultGrams: 200,
    calPer100g: 164,
    proPer100g: 8.9,
    carbPer100g: 27.4,
    fatPer100g: 2.6,
    ironMg: 2.9,
    magMg: 48,
    zincMg: 1.5,
    sodiumMg: 240,
    fiberG: 7.6,
    keywords: ['chana', 'chickpea', 'rajma', 'beans', 'lentil', 'lobia'],
  },
  {
    name: 'Fresh Garden Protein Salad',
    defaultGrams: 200,
    calPer100g: 65,
    proPer100g: 5.5,
    carbPer100g: 7.0,
    fatPer100g: 2.0,
    ironMg: 1.6,
    magMg: 33,
    zincMg: 0.9,
    sodiumMg: 120,
    fiberG: 3.5,
    keywords: ['salad', 'sprouts', 'greens', 'lettuce', 'cucumber'],
  },
];

/**
 * Copies temporary image into app document storage and analyzes food contents
 */
export const analyzeFoodPhoto = async (
  tempImageUri: string,
  userHint?: string
): Promise<AnalyzedFoodItem> => {
  const fileName = `meal_${Date.now()}.jpg`;
  const permanentLocalUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.copyAsync({ from: tempImageUri, to: permanentLocalUri });

  // 1. Try Gemini 2.5 Flash Vision if user has an AI Studio key configured
  const settingsRow = db.getFirstSync<{ gemini_api_key?: string }>(
    'SELECT gemini_api_key FROM user_settings WHERE id = 1'
  );
  const apiKey = settingsRow?.gemini_api_key?.trim();

  if (apiKey && apiKey.length > 20) {
    try {
      const base64Img = await FileSystem.readAsStringAsync(permanentLocalUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      const prompt = `Analyze this food image${userHint ? ` with user hint "${userHint}"` : ''}.
Identify the main food item and estimate portion and nutritional macros accurately.
Return ONLY a valid JSON object (no markdown fences, no explanatory text):
{
  "food_name": "string (clear specific food title e.g. 3 Scrambled Eggs with Avocado)",
  "serving_grams": number,
  "calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fat_g": number,
  "micros": {
    "iron_mg": number,
    "magnesium_mg": number,
    "zinc_mg": number,
    "sodium_mg": number,
    "fiber_g": number
  }
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
      if (data.error) {
        throw new Error(data.error.message || 'Gemini Vision Error');
      }

      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const match = rawText.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.food_name && typeof parsed.calories === 'number') {
          return {
            foodName: parsed.food_name,
            servingGrams: Math.round(parsed.serving_grams || 200),
            calories: Math.round(parsed.calories),
            proteinG: Math.round(parsed.protein_g || 0),
            carbsG: Math.round(parsed.carbs_g || 0),
            fatG: Math.round(parsed.fat_g || 0),
            imageUri: permanentLocalUri,
            source: 'ai_vision',
            micros: {
              ironMg: Number(parsed.micros?.iron_mg || 1.5),
              magnesiumMg: Number(parsed.micros?.magnesium_mg || 30),
              zincMg: Number(parsed.micros?.zinc_mg || 1.2),
              sodiumMg: Number(parsed.micros?.sodium_mg || 150),
              fiberG: Number(parsed.micros?.fiber_g || 2.0),
            },
          };
        }
      }
    } catch (err) {
      console.warn('Gemini AI Vision call did not return structured JSON, using smart dictionary:', err);
    }
  }

  // 2. Intelligent Matcher with Rich Gym Food Database
  const hintLower = (userHint || '').toLowerCase().trim();
  let matchedProfile: FoodProfile | null = null;

  if (hintLower.length > 0) {
    for (const item of GYM_FOOD_DATABASE) {
      if (item.keywords.some((k) => hintLower.includes(k))) {
        matchedProfile = item;
        break;
      }
    }
  }

  // Fallback to high-protein whole eggs if no match found
  const profile = matchedProfile || GYM_FOOD_DATABASE[0];
  const grams = profile.defaultGrams;
  const ratio = grams / 100;

  return {
    foodName: userHint && userHint.trim().length > 0 ? userHint.trim() : profile.name,
    servingGrams: grams,
    calories: Math.round(profile.calPer100g * ratio),
    proteinG: Math.round(profile.proPer100g * ratio),
    carbsG: Math.round(profile.carbPer100g * ratio),
    fatG: Math.round(profile.fatPer100g * ratio),
    imageUri: permanentLocalUri,
    source: 'smart_estimator',
    micros: {
      ironMg: Math.round(profile.ironMg * ratio * 10) / 10,
      magnesiumMg: Math.round(profile.magMg * ratio),
      zincMg: Math.round(profile.zincMg * ratio * 10) / 10,
      sodiumMg: Math.round(profile.sodiumMg * ratio),
      fiberG: Math.round(profile.fiberG * ratio * 10) / 10,
    },
  };
};

/**
 * Saves confirmed meal log to SQLite
 */
export const saveConfirmedMeal = (meal: {
  foodName: string;
  servingGrams: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  localImageUri: string;
  microsJson?: string;
}): MealLog => {
  const today = new Date().toISOString().split('T')[0];
  const defaultMicros = JSON.stringify({
    iron_mg: 1.8,
    magnesium_mg: 35,
    zinc_mg: 1.4,
    sodium_mg: 160,
    fiber_g: 2.5,
  });

  const record: MealLog = {
    date_str: today,
    food_name: meal.foodName,
    serving_grams: meal.servingGrams,
    local_image_uri: meal.localImageUri,
    calories: Math.round(meal.calories),
    protein_g: Math.round(meal.proteinG),
    carbs_g: Math.round(meal.carbsG),
    fat_g: Math.round(meal.fatG),
    micros_json: meal.microsJson || defaultMicros,
  };

  db.runSync(
    `INSERT INTO meal_logs (date_str, food_name, serving_grams, local_image_uri, calories, protein_g, carbs_g, fat_g, micros_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      record.date_str,
      record.food_name,
      record.serving_grams,
      record.local_image_uri,
      record.calories,
      record.protein_g,
      record.carbs_g,
      record.fat_g,
      record.micros_json,
    ]
  );

  return record;
};

// Legacy helper for backwards compatibility
export const scanAndLogFoodPhoto = async (tempImageUri: string, customHint?: string): Promise<MealLog> => {
  const analyzed = await analyzeFoodPhoto(tempImageUri, customHint);
  return saveConfirmedMeal({
    foodName: analyzed.foodName,
    servingGrams: analyzed.servingGrams,
    calories: analyzed.calories,
    proteinG: analyzed.proteinG,
    carbsG: analyzed.carbsG,
    fatG: analyzed.fatG,
    localImageUri: analyzed.imageUri,
    microsJson: JSON.stringify(analyzed.micros),
  });
};
