import { db, MealLog } from '../db/database';

export interface FoodSearchResult {
  id: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  fiberPer100g: number;
  sodiumMgPer100g: number;
}

export const searchOpenFoodFacts = async (query: string): Promise<FoodSearchResult[]> => {
  const cleanQuery = query.trim();
  if (cleanQuery.length < 2) return [];

  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    cleanQuery
  )}&search_simple=1&action=process&json=1&page_size=8`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AmpedFitness - OpenSourceFitnessApp - Version 1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Nutrition service error: ${res.status}`);
    }

    const data = await res.json();
    const products = data.products || [];

    const results: FoodSearchResult[] = [];

    for (const p of products) {
      const nutriments = p.nutriments || {};
      const name = p.product_name || p.product_name_en || p.generic_name;
      if (!name) continue;

      const calories =
        Number(nutriments['energy-kcal_100g']) ||
        Number(nutriments['energy-kcal']) ||
        Math.round((Number(nutriments['energy_100g']) || 0) / 4.184) ||
        0;

      const protein = Number(nutriments['proteins_100g']) || 0;
      const carbs = Number(nutriments['carbohydrates_100g']) || 0;
      const fat = Number(nutriments['fat_100g']) || 0;
      const fiber = Number(nutriments['fiber_100g']) || 0;
      const sodium = Math.round((Number(nutriments['sodium_100g']) || 0) * 1000);

      results.push({
        id: p._id || String(Math.random()),
        name: name.trim(),
        brand: p.brands || undefined,
        imageUrl: p.image_front_small_url || p.image_url || undefined,
        caloriesPer100g: Math.round(calories),
        proteinPer100g: Math.round(protein * 10) / 10,
        carbsPer100g: Math.round(carbs * 10) / 10,
        fatPer100g: Math.round(fat * 10) / 10,
        fiberPer100g: Math.round(fiber * 10) / 10,
        sodiumMgPer100g: sodium,
      });
    }

    return results;
  } catch (error) {
    console.warn('Open Food Facts search error:', error);
    return [];
  }
};

export interface BarcodePreset {
  barcode: string;
  label: string;
  brand: string;
}

export const ATHLETE_PRESET_BARCODES: BarcodePreset[] = [
  { barcode: '737628064502', label: 'Peanut Noodle Bowl', brand: 'Thai Kitchen' },
  { barcode: '0041196910759', label: 'Gold Standard Whey', brand: 'Optimum Nutrition' },
  { barcode: '0030000010204', label: 'Whole Grain Rolled Oats', brand: 'Quaker' },
  { barcode: '0051500255162', label: 'Creamy Peanut Butter', brand: 'Jif' },
  { barcode: '0894700010045', label: 'Plain Greek Yogurt 0%', brand: 'Chobani' },
];

export const fetchFoodByBarcode = async (barcode: string): Promise<FoodSearchResult | null> => {
  const cleanBarcode = barcode.trim().replace(/[^0-9]/g, '');
  if (cleanBarcode.length < 5) return null;

  const url = `https://world.openfoodfacts.org/api/v2/product/${cleanBarcode}.json`;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'AmpedFitness - OpenSourceFitnessApp - Version 1.0',
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error(`Open Food Facts barcode error: ${res.status}`);
    }

    const data = await res.json();
    if (data.status !== 1 || !data.product) {
      return null;
    }

    const p = data.product;
    const nutriments = p.nutriments || {};
    const name = p.product_name || p.product_name_en || p.generic_name || 'Scanned Food Product';

    const calories =
      Number(nutriments['energy-kcal_100g']) ||
      Number(nutriments['energy-kcal']) ||
      Math.round((Number(nutriments['energy_100g']) || 0) / 4.184) ||
      0;

    const protein = Number(nutriments['proteins_100g']) || 0;
    const carbs = Number(nutriments['carbohydrates_100g']) || 0;
    const fat = Number(nutriments['fat_100g']) || 0;
    const fiber = Number(nutriments['fiber_100g']) || 0;
    const sodium = Math.round((Number(nutriments['sodium_100g']) || 0) * 1000);

    return {
      id: p._id || cleanBarcode,
      name: name.trim(),
      brand: p.brands || undefined,
      imageUrl: p.image_front_small_url || p.image_url || undefined,
      caloriesPer100g: Math.round(calories),
      proteinPer100g: Math.round(protein * 10) / 10,
      carbsPer100g: Math.round(carbs * 10) / 10,
      fatPer100g: Math.round(fat * 10) / 10,
      fiberPer100g: Math.round(fiber * 10) / 10,
      sodiumMgPer100g: sodium,
    };
  } catch (error) {
    console.warn('Open Food Facts barcode lookup error:', error);
    return null;
  }
};

export const logFoodFromOpenApi = (
  food: FoodSearchResult,
  grams: number = 100
): MealLog => {
  const factor = grams / 100;
  const todayStr = new Date().toISOString().split('T')[0];

  const calories = Math.round(food.caloriesPer100g * factor);
  const protein = Math.round(food.proteinPer100g * factor * 10) / 10;
  const carbs = Math.round(food.carbsPer100g * factor * 10) / 10;
  const fat = Math.round(food.fatPer100g * factor * 10) / 10;

  const microsJson = JSON.stringify({
    fiber_g: Math.round(food.fiberPer100g * factor * 10) / 10,
    sodium_mg: Math.round(food.sodiumMgPer100g * factor),
    source: 'Open Food Facts Database',
  });

  const res = db.runSync(
    `INSERT INTO meal_logs (date_str, food_name, serving_grams, local_image_uri, calories, protein_g, carbs_g, fat_g, micros_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [todayStr, food.name, grams, food.imageUrl || null, calories, protein, carbs, fat, microsJson]
  );

  return {
    id: Number(res.lastInsertRowId),
    date_str: todayStr,
    food_name: food.name,
    serving_grams: grams,
    local_image_uri: food.imageUrl || null,
    calories,
    protein_g: protein,
    carbs_g: carbs,
    fat_g: fat,
    micros_json: microsJson,
  };
};

