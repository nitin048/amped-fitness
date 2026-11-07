/**
 * OpenPowerlifting Strength Coefficients (DOTS & Wilks 2020)
 * 100% Open Algorithms based on OpenPowerlifting
 * GitHub: https://github.com/openpowerlifting
 */

export interface StrengthTier {
  name: string;
  badge: string;
  color: string;
  percentile: number;
  description: string;
}

export interface AthleteStrengthResult {
  bodyWeightKg: number;
  gender: 'male' | 'female';
  benchKg: number;
  squatKg: number;
  deadliftKg: number;
  totalKg: number;
  dotsScore: number;
  wilksScore: number;
  tier: StrengthTier;
}

/**
 * Calculates official DOTS powerlifting coefficient
 */
export const calculateDotsScore = (
  bodyWeightKg: number,
  totalKg: number,
  gender: 'male' | 'female' = 'male'
): number => {
  if (bodyWeightKg <= 0 || totalKg <= 0) return 0;

  // Clamp bodyweight to competitive range (40kg to 210kg)
  const bw = Math.max(40, Math.min(210, bodyWeightKg));

  let a: number;
  let b: number;
  let c: number;
  let d: number;
  let e: number;

  if (gender === 'female') {
    a = -0.0000010706;
    b = 0.0005158568;
    c = -0.1126655495;
    d = 13.6175032;
    e = -57.96288;
  } else {
    a = -0.000001093;
    b = 0.0007391293;
    c = -0.1918759221;
    d = 24.0900756;
    e = -307.2723216;
  }

  const denom =
    a * Math.pow(bw, 4) +
    b * Math.pow(bw, 3) +
    c * Math.pow(bw, 2) +
    d * bw +
    e;

  if (denom <= 0) return 0;
  const score = totalKg * (500 / denom);
  return Number(score.toFixed(1));
};

/**
 * Calculates official Wilks 2020 coefficient
 */
export const calculateWilks2020Score = (
  bodyWeightKg: number,
  totalKg: number,
  gender: 'male' | 'female' = 'male'
): number => {
  if (bodyWeightKg <= 0 || totalKg <= 0) return 0;
  const bw = Math.max(40, Math.min(210, bodyWeightKg));

  let a: number;
  let b: number;
  let c: number;
  let d: number;
  let e: number;

  if (gender === 'female') {
    a = -0.0000000472;
    b = 0.000034682;
    c = -0.0104193;
    d = 1.62416;
    e = -27.342;
  } else {
    a = -0.0000000147;
    b = 0.000016462;
    c = -0.0069925;
    d = 1.34138;
    e = -16.26;
  }

  const coeff =
    a * Math.pow(bw, 4) +
    b * Math.pow(bw, 3) +
    c * Math.pow(bw, 2) +
    d * bw +
    e;

  if (coeff <= 0) return 0;
  const score = (totalKg * 500) / (coeff * 10);
  return Number(score.toFixed(1));
};

/**
 * Maps DOTS score to competitive strength tiers
 */
export const getStrengthTier = (dotsScore: number): StrengthTier => {
  if (dotsScore >= 520) {
    return {
      name: 'World Class',
      badge: 'TIER I',
      color: '#FFD60A',
      percentile: 99.5,
      description: 'National and international podium caliber pound-for-pound power.',
    };
  }
  if (dotsScore >= 450) {
    return {
      name: 'Elite',
      badge: 'TIER II',
      color: '#FF2D55',
      percentile: 95,
      description: 'Top-tier competitive lifter. Exceptional strength-to-bodyweight ratio.',
    };
  }
  if (dotsScore >= 375) {
    return {
      name: 'Advanced',
      badge: 'TIER III',
      color: '#AF52DE',
      percentile: 80,
      description: 'Years of serious progressive overload. Far exceeds standard gym populations.',
    };
  }
  if (dotsScore >= 300) {
    return {
      name: 'Proficient',
      badge: 'TIER IV',
      color: '#00F0FF',
      percentile: 55,
      description: 'Solid foundation. 1.5x-2x bodyweight compound strength demonstrated.',
    };
  }
  if (dotsScore >= 200) {
    return {
      name: 'Intermediate',
      badge: 'TIER V',
      color: '#34C759',
      percentile: 30,
      description: 'Consistent lifter making steady linear progression gains.',
    };
  }
  return {
    name: 'Novice',
    badge: 'TIER VI',
    color: '#8E8E93',
    percentile: 10,
    description: 'Foundational phase. Focus on form mastery and progressive adaptation.',
  };
};

/**
 * Aggregates athlete's Big 3 compound total and generates complete strength diagnostics
 */
export const getAthleteStrengthScore = (
  bodyWeightKg: number,
  gender: 'male' | 'female' = 'male',
  benchKg: number = 0,
  squatKg: number = 0,
  deadliftKg: number = 0
): AthleteStrengthResult => {
  const totalKg = benchKg + squatKg + deadliftKg;
  const dotsScore = calculateDotsScore(bodyWeightKg, totalKg, gender);
  const wilksScore = calculateWilks2020Score(bodyWeightKg, totalKg, gender);
  const tier = getStrengthTier(dotsScore);

  return {
    bodyWeightKg,
    gender,
    benchKg,
    squatKg,
    deadliftKg,
    totalKg,
    dotsScore,
    wilksScore,
    tier,
  };
};

