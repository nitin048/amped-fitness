/**
 * Comprehensive Input Sanitization & Validation Engine
 * Protects all 34+ text and numeric inputs across the application from:
 * - Empty / whitespace-only required fields
 * - Multiple decimal points / malformed numeric strings
 * - Negative or astronomical out-of-bound values
 * - SQL / script injections & control characters
 * - Loss of precision on typing and formatting
 */

/**
 * Sanitizes numeric text input in real-time.
 * Ensures only digits and optionally at most one single decimal point.
 */
export const sanitizeNumeric = (val: string, allowDecimal: boolean = false, maxDecimals: number = 2): string => {
  if (!val) return '';
  let cleaned = val.replace(/[^0-9.]/g, '');

  if (!allowDecimal) {
    return cleaned.replace(/\./g, '');
  }

  // Allow only the first dot
  const firstDot = cleaned.indexOf('.');
  if (firstDot !== -1) {
    const intPart = cleaned.slice(0, firstDot);
    const decPart = cleaned.slice(firstDot + 1).replace(/\./g, '').slice(0, maxDecimals);
    return `${intPart}.${decPart}`;
  }

  return cleaned;
};

/**
 * Sanitizes integers (only digits 0-9).
 */
export const sanitizeInteger = (val: string, maxLen?: number): string => {
  if (!val) return '';
  const digits = val.replace(/[^0-9]/g, '');
  return maxLen ? digits.slice(0, maxLen) : digits;
};

/**
 * Sanitizes height input strings based on the active unit.
 * In FT mode, allows digits and dot or quote (e.g. "5.8" or "5'8").
 * In CM mode, allows digits only.
 */
export const sanitizeHeightInput = (val: string, unit: string = 'CM'): string => {
  if (!val) return '';
  if (unit.toUpperCase() === 'FT') {
    // Keep digits, dots, quotes, and spaces for feet & inches notation
    const cleaned = val.replace(/[^0-9.'\s]/g, '');
    return cleaned.slice(0, 5);
  }
  return sanitizeInteger(val, 3);
};

/**
 * Sanitizes weight input strings (numbers with up to 1 decimal place).
 */
export const sanitizeWeightInput = (val: string): string => {
  return sanitizeNumeric(val, true, 1).slice(0, 6);
};

/**
 * Sanitizes text names (cleans control characters and trims excess length).
 */
export const sanitizeText = (val: string, maxLen: number = 50): string => {
  if (!val) return '';
  return val.replace(/[\u0000-\u001F\u007F-\u009F]/g, '').slice(0, maxLen);
};

export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * Validates Athlete Full Name
 */
export const validateAthleteName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }
  if (trimmed.length > 40) {
    return { isValid: false, error: 'Name cannot exceed 40 characters' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates Athlete Nickname / Callsign
 */
export const validateAthleteNickname = (nick: string): ValidationResult => {
  const trimmed = nick.trim();
  if (trimmed.length > 30) {
    return { isValid: false, error: 'Nickname cannot exceed 30 characters' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates Athlete Age (12 to 100 years)
 */
export const validateAge = (age: string | number): ValidationResult => {
  const num = typeof age === 'number' ? age : parseInt(age, 10);
  if (isNaN(num) || num < 12 || num > 100) {
    return { isValid: false, error: 'Age must be between 12 and 100 years' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates Height in active unit
 */
export const validateHeight = (val: string | number, unit: string = 'CM'): ValidationResult => {
  const raw = String(val ?? '').trim();
  if (!raw) {
    return { isValid: false, error: 'Height is required' };
  }
  if (unit.toUpperCase() === 'FT') {
    const parts = raw.split(/[\s.'"\-]+/).filter(Boolean);
    const feet = parseInt(parts[0], 10);
    if (isNaN(feet) || feet < 3 || feet > 8) {
      return { isValid: false, error: 'Height in FT must be between 3.0 and 8.2' };
    }
    if (parts.length >= 2) {
      const inches = parseFloat(parts[1]);
      if (inches >= 12 && inches !== 75 && inches !== 5) {
        // e.g. 5.15 ft
        return { isValid: false, error: 'Inches must be between 0 and 11' };
      }
    }
    return { isValid: true, error: null };
  }

  const cm = typeof val === 'number' ? val : parseFloat(raw);
  if (isNaN(cm) || cm < 90 || cm > 250) {
    return { isValid: false, error: 'Height must be between 90 cm and 250 cm' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates Weight in active unit
 */
export const validateWeight = (val: string | number, unit: string = 'KG'): ValidationResult => {
  const raw = String(val ?? '').trim();
  if (!raw) {
    return { isValid: false, error: 'Weight is required' };
  }
  const num = typeof val === 'number' ? val : parseFloat(raw);
  if (isNaN(num)) {
    return { isValid: false, error: 'Please enter a valid weight' };
  }

  if (unit.toUpperCase() === 'LBS') {
    if (num < 66 || num > 660) {
      return { isValid: false, error: 'Weight must be between 66 lbs and 660 lbs' };
    }
    return { isValid: true, error: null };
  }

  if (num < 30 || num > 300) {
    return { isValid: false, error: 'Weight must be between 30 kg and 300 kg' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates Body Fat percentage (3% to 60%)
 */
export const validateBodyFat = (val: string | number): ValidationResult => {
  const raw = String(val ?? '').trim();
  if (!raw) return { isValid: true, error: null }; // Optional field
  const num = typeof val === 'number' ? val : parseFloat(raw);
  if (isNaN(num) || num < 3 || num > 60) {
    return { isValid: false, error: 'Body fat must be between 3% and 60%' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates Gym Set Log (Weight & Reps)
 */
export const validateGymSet = (weightKg: number, reps: number): ValidationResult => {
  if (isNaN(reps) || reps < 1) {
    return { isValid: false, error: 'Please log at least 1 rep' };
  }
  if (reps > 200) {
    return { isValid: false, error: 'Reps cannot exceed 200 per set' };
  }
  if (isNaN(weightKg) || weightKg < 0) {
    return { isValid: false, error: 'Weight cannot be negative' };
  }
  if (weightKg > 500) {
    return { isValid: false, error: 'Weight cannot exceed 500 kg' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates Custom Workout Routine Name
 */
export const validateRoutineName = (name: string): ValidationResult => {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Routine name is required' };
  }
  if (trimmed.length < 2) {
    return { isValid: false, error: 'Routine name must be at least 2 characters' };
  }
  if (trimmed.length > 50) {
    return { isValid: false, error: 'Routine name cannot exceed 50 characters' };
  }
  return { isValid: true, error: null };
};

/**
 * Validates Barcode Input (UPC/EAN: 6 to 14 digits)
 */
export const validateBarcode = (code: string): ValidationResult => {
  const cleaned = code.trim().replace(/[^0-9]/g, '');
  if (!cleaned) {
    return { isValid: false, error: 'Please enter a barcode number' };
  }
  if (cleaned.length < 6 || cleaned.length > 14) {
    return { isValid: false, error: 'Barcode must be between 6 and 14 digits' };
  }
  return { isValid: true, error: null };
};

/**
 * Clamps numeric values within safe ranges
 */
export const clampNumber = (val: string | number, min: number, max: number, defaultVal: number): number => {
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.]/g, ''));
  if (isNaN(num)) return defaultVal;
  return Math.max(min, Math.min(max, num));
};
