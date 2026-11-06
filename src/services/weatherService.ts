/**
 * Open-Meteo Global Weather & Air Quality Engine
 * 100% Free, Open-Source, No API Key Required
 * GitHub: https://github.com/open-meteo/open-meteo
 */

export interface ClimateReading {
  tempC: number;
  humidityPct: number;
  pressureHpa: number;
  uvIndex: number;
  aqi: number;
  pm25: number;
  timestamp: number;
  source: string;
}

export interface ClimateRecoveryAdvice {
  heatIndexC: number;
  hydrationMlPerHr: number;
  thermalCategory: 'OPTIMAL' | 'COLD' | 'WARM' | 'HEAT_RISK';
  airQualityCategory: 'EXCELLENT' | 'MODERATE' | 'POOR';
  advisory: string;
}

// Default fallback coordinates (New Delhi / Global urban gym default)
const DEFAULT_LAT = 28.6139;
const DEFAULT_LON = 77.2090;

export const fetchOpenMeteoClimate = async (
  lat: number = DEFAULT_LAT,
  lon: number = DEFAULT_LON
): Promise<ClimateReading> => {
  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,surface_pressure,uv_index`;
    const aqiUrl = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=pm2_5,european_aqi`;

    const [weatherRes, aqiRes] = await Promise.all([
      fetch(weatherUrl, { headers: { Accept: 'application/json' } }),
      fetch(aqiUrl, { headers: { Accept: 'application/json' } }).catch(() => null),
    ]);

    if (!weatherRes.ok) {
      throw new Error(`Open-Meteo weather response status: ${weatherRes.status}`);
    }

    const weatherData = await weatherRes.json();
    const current = weatherData.current || {};

    let pm25 = 25;
    let aqi = 40;

    if (aqiRes && aqiRes.ok) {
      const aqiData = await aqiRes.json();
      const aqiCurrent = aqiData.current || {};
      if (typeof aqiCurrent.pm2_5 === 'number') pm25 = Math.round(aqiCurrent.pm2_5);
      if (typeof aqiCurrent.european_aqi === 'number') aqi = Math.round(aqiCurrent.european_aqi);
    }

    const tempC = typeof current.temperature_2m === 'number' ? Number(current.temperature_2m.toFixed(1)) : 22.0;
    const humidityPct = typeof current.relative_humidity_2m === 'number' ? Math.round(current.relative_humidity_2m) : 50;
    const pressureHpa = typeof current.surface_pressure === 'number' ? Number(current.surface_pressure.toFixed(1)) : 1013.2;
    const uvIndex = typeof current.uv_index === 'number' ? Number(current.uv_index.toFixed(1)) : 1.0;

    return {
      tempC,
      humidityPct,
      pressureHpa,
      uvIndex,
      aqi,
      pm25,
      timestamp: Date.now(),
      source: 'Open-Meteo Global Weather Engine',
    };
  } catch (error) {
    console.warn('Open-Meteo climate fetch error, falling back to nominal values:', error);
    return {
      tempC: 22.0,
      humidityPct: 50,
      pressureHpa: 1013.2,
      uvIndex: 2.0,
      aqi: 35,
      pm25: 15,
      timestamp: Date.now(),
      source: 'Offline Default Baseline',
    };
  }
};

/**
 * Calculates apparent Heat Index (Steadman formula) and sports recovery advice
 */
export const getAthleteClimateAdvice = (climate: ClimateReading): ClimateRecoveryAdvice => {
  const { tempC, humidityPct, aqi } = climate;

  let heatIndexC = tempC;
  if (tempC >= 20) {
    const tempF = (tempC * 9) / 5 + 32;
    const hiF = 0.5 * (tempF + 61.0 + (tempF - 68.0) * 1.2 + humidityPct * 0.094);
    heatIndexC = Number((((hiF - 32) * 5) / 9).toFixed(1));
  }

  let thermalCategory: ClimateRecoveryAdvice['thermalCategory'] = 'OPTIMAL';
  let hydrationMlPerHr = 500;
  let advisory = 'Environmental conditions are optimal for peak neuromuscular force production.';

  if (heatIndexC >= 32) {
    thermalCategory = 'HEAT_RISK';
    hydrationMlPerHr = 950;
    advisory = 'High heat index detected. Elevate fluid & electrolyte intake by +450ml/hr to avoid cramping.';
  } else if (heatIndexC >= 26) {
    thermalCategory = 'WARM';
    hydrationMlPerHr = 750;
    advisory = 'Elevated ambient temperature. Prioritize intra-workout cooling and cold water between sets.';
  } else if (heatIndexC < 15) {
    thermalCategory = 'COLD';
    hydrationMlPerHr = 450;
    advisory = 'Cool ambient climate. Synovial fluid is stiffer; extend warm-up sets by 3-5 minutes.';
  }

  let airQualityCategory: ClimateRecoveryAdvice['airQualityCategory'] = 'EXCELLENT';
  if (aqi > 75) {
    airQualityCategory = 'POOR';
    advisory += ' High particulate matter: indoor training with ventilation recommended.';
  } else if (aqi > 50) {
    airQualityCategory = 'MODERATE';
  }

  return {
    heatIndexC,
    hydrationMlPerHr,
    thermalCategory,
    airQualityCategory,
    advisory,
  };
};

