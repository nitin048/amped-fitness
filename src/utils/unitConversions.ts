/**
 * Biometric Unit Conversions (Height CM <-> FT/IN, Weight KG <-> LBS)
 * Ensures accurate conversions, robust user input parsing, and prevents clamping bugs.
 */

const LBS_PER_KG = 2.20462262;
const INCH_TO_CM = 2.54;

/**
 * Converts user height input string into centimeters (CM) for SQLite storage & metabolic formulas.
 * Handles:
 * - "5.8" -> 5 feet 8 inches (~173 cm)
 * - "5.10" -> 5 feet 10 inches (~178 cm)
 * - "5'8\"", "5 8", "6.0", "6"
 * - "178" in CM mode -> 178 cm
 */
export const heightToCm = (val: string | number, unit: string = 'CM'): number => {
  const raw = String(val ?? '').trim();
  if (!raw) return 178;

  const isFt = unit.toUpperCase() === 'FT';

  if (!isFt) {
    const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (isNaN(num) || num <= 0) return 178;
    return Math.max(90, Math.min(250, Math.round(num)));
  }

  // FT mode: parse feet and inches
  const parts = raw.split(/[\s.'"\-]+/).filter(Boolean);

  if (parts.length >= 2) {
    const feet = parseInt(parts[0], 10) || 5;
    const inches = parseFloat(parts[1]) || 0;

    // Normal feet & inches notation (e.g. 5.8, 5.10, 5'11)
    if (inches < 12) {
      const totalInches = feet * 12 + inches;
      const cm = totalInches * INCH_TO_CM;
      return Math.max(90, Math.min(250, Math.round(cm)));
    }

    // If second number is >= 12 (e.g., "5.75" entered as decimal feet)
    const decFeet = parseFloat(raw) || 5.8;
    const cm = decFeet * 30.48;
    return Math.max(90, Math.min(250, Math.round(cm)));
  }

  if (parts.length === 1) {
    const num = parseFloat(parts[0]);
    if (isNaN(num) || num <= 0) return 178;

    // If user typed e.g. "175" while accidentally in FT mode
    if (num >= 90) {
      return Math.max(90, Math.min(250, Math.round(num)));
    }

    // Bare feet number (e.g. "6" or "5")
    const cm = num * 12 * INCH_TO_CM;
    return Math.max(90, Math.min(250, Math.round(cm)));
  }

  return 178;
};

/**
 * Converts centimeters from SQLite into display string based on user preference.
 * - In CM mode: "178"
 * - In FT mode: 173 cm -> "5.8" (5 feet 8 inches), 178 cm -> "5.10" (5 feet 10 inches)
 */
export const cmToDisplayHeight = (cm: number, unit: string = 'CM'): string => {
  const validCm = Math.max(90, Math.min(250, Number(cm) || 178));

  if (unit.toUpperCase() !== 'FT') {
    return String(Math.round(validCm));
  }

  const totalInches = Math.round(validCm / INCH_TO_CM);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;

  return `${feet}.${inches}`;
};

/**
 * Converts user weight input string into kilograms (KG) for SQLite storage & metabolic formulas.
 */
export const weightToKg = (val: string | number, unit: string = 'KG'): number => {
  const raw = String(val ?? '').trim();
  if (!raw) return 75;

  const num = parseFloat(raw.replace(/[^0-9.]/g, ''));
  if (isNaN(num) || num <= 0) return 75;

  const isLbs = unit.toUpperCase() === 'LBS';
  const kg = isLbs ? num / LBS_PER_KG : num;

  return Math.max(30, Math.min(300, Math.round(kg * 10) / 10));
};

/**
 * Converts kilograms from SQLite into display string based on user preference.
 */
export const kgToDisplayWeight = (kg: number, unit: string = 'KG'): string => {
  const validKg = Math.max(30, Math.min(300, Number(kg) || 75));

  if (unit.toUpperCase() === 'LBS') {
    const lbs = validKg * LBS_PER_KG;
    return String(Math.round(lbs * 10) / 10);
  }

  return String(Math.round(validKg * 10) / 10);
};

/**
 * Stepper increment/decrement for height in both CM and FT.
 * In FT mode, delta adjusts by 1 inch!
 */
export const stepHeight = (currentVal: string, unit: string, delta: number): string => {
  const currentCm = heightToCm(currentVal, unit);
  if (unit.toUpperCase() === 'FT') {
    const totalInches = Math.max(35, Math.min(98, Math.round(currentCm / INCH_TO_CM) + delta));
    const nextCm = totalInches * INCH_TO_CM;
    return cmToDisplayHeight(nextCm, 'FT');
  }
  const nextCm = Math.max(90, Math.min(250, currentCm + delta));
  return String(nextCm);
};

/**
 * Stepper increment/decrement for weight in both KG and LBS.
 */
export const stepWeight = (currentVal: string, unit: string, delta: number): string => {
  if (unit.toUpperCase() === 'LBS') {
    const rawLbs = parseFloat(String(currentVal).replace(/[^0-9.]/g, '')) || 165;
    const nextLbs = Math.max(66, Math.min(660, Math.round((rawLbs + delta) * 10) / 10));
    return String(nextLbs);
  }
  const rawKg = parseFloat(String(currentVal).replace(/[^0-9.]/g, '')) || 75;
  const nextKg = Math.max(30, Math.min(300, Math.round((rawKg + delta) * 10) / 10));
  return String(nextKg);
};
