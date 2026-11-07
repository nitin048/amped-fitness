import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db/database';

export type ThemeName =
  | 'APMED_PRO'
  | 'VOLT_DARK'
  | 'BLOOD_IRON'
  | 'CYBER_PULSE'
  | 'MIDNIGHT_OLED'
  | 'EMERALD_NIGHT'
  | 'DAYLIGHT'
  | 'SOLAR_LIGHT'
  | 'NORDIC_FROST';

export interface ThemePalette {
  name: ThemeName;
  label: string;
  isDark: boolean;
  bg: string;
  card: string;
  cardElevated: string;
  border: string;
  primary: string;
  primaryText: string; // contrasting text color on primary button (#000 or #FFF)
  accentRed: string;
  accentCyan: string;
  accentOrange: string;
  text: string;
  subtext: string;
  tertiary: string;
  danger: string;
  ringTrackRed: string;
  ringTrackGreen: string;
  ringTrackCyan: string;
}

export const THEMES: Record<ThemeName, ThemePalette> = {
  MIDNIGHT_OLED: {
    name: 'MIDNIGHT_OLED',
    label: 'Minimalist OLED',
    isDark: true,
    bg: '#000000',
    card: '#090909',
    cardElevated: '#141414',
    border: '#1C1C1E',
    primary: '#FFFFFF',
    primaryText: '#000000',
    accentRed: '#FF453A',
    accentCyan: '#E5E5EA',
    accentOrange: '#F2F2F7',
    text: '#FFFFFF',
    subtext: '#8E8E93',
    tertiary: '#3A3A3C',
    danger: '#FF453A',
    ringTrackRed: '#1C1C1E',
    ringTrackGreen: '#2C2C2E',
    ringTrackCyan: '#3A3A3C',
  },
  APMED_PRO: {
    name: 'APMED_PRO',
    label: 'Apmed Pro',
    isDark: true,
    bg: '#000000',
    card: '#111319',
    cardElevated: '#1A1D26',
    border: 'rgba(255, 255, 255, 0.08)',
    primary: '#30D158', // Apmed Neon Green
    primaryText: '#000000',
    accentRed: '#FA114F', // Apmed Move Ring Red
    accentCyan: '#00E5FF', // Apmed Stand / Recovery Ring Cyan
    accentOrange: '#FF9F0A', // Apmed Gold / Nutrition
    text: '#FFFFFF',
    subtext: '#8E8E98',
    tertiary: '#48484A',
    danger: '#FF453A',
    ringTrackRed: '#2C0A10',
    ringTrackGreen: '#0D2A12',
    ringTrackCyan: '#06222F',
  },
  VOLT_DARK: {
    name: 'VOLT_DARK',
    label: 'Volt Dark',
    isDark: true,
    bg: '#07080B',
    card: '#101218',
    cardElevated: '#181B24',
    border: 'rgba(255, 255, 255, 0.08)',
    primary: '#CCFF00', // Electric Volt
    primaryText: '#000000',
    accentRed: '#FF2A54',
    accentCyan: '#00F0FF',
    accentOrange: '#FF9500',
    text: '#FAFAFA',
    subtext: '#A1A1AC',
    tertiary: '#52525B',
    danger: '#FF3B30',
    ringTrackRed: '#300810',
    ringTrackGreen: '#232E04',
    ringTrackCyan: '#05232A',
  },
  BLOOD_IRON: {
    name: 'BLOOD_IRON',
    label: 'Blood Iron',
    isDark: true,
    bg: '#0D0707',
    card: '#180E0E',
    cardElevated: '#281717',
    border: '#3D2020',
    primary: '#FF2A54', // PR Crimson
    primaryText: '#FFFFFF',
    accentRed: '#FF3B30',
    accentCyan: '#38BDF8',
    accentOrange: '#F97316',
    text: '#FFF5F5',
    subtext: '#B89E9E',
    tertiary: '#5C4444',
    danger: '#FF453A',
    ringTrackRed: '#380B10',
    ringTrackGreen: '#182C0E',
    ringTrackCyan: '#0C2534',
  },
  CYBER_PULSE: {
    name: 'CYBER_PULSE',
    label: 'Cyber Pulse',
    isDark: true,
    bg: '#040711',
    card: '#0C1222',
    cardElevated: '#141E36',
    border: '#1A294A',
    primary: '#00F0FF', // Electric Cyan
    primaryText: '#000000',
    accentRed: '#F43F5E',
    accentCyan: '#38BDF8',
    accentOrange: '#FBBF24',
    text: '#F9FAFB',
    subtext: '#94A3B8',
    tertiary: '#4B5563',
    danger: '#F43F5E',
    ringTrackRed: '#2E0914',
    ringTrackGreen: '#0E291F',
    ringTrackCyan: '#052433',
  },
  EMERALD_NIGHT: {
    name: 'EMERALD_NIGHT',
    label: 'Emerald Night',
    isDark: true,
    bg: '#06120D',
    card: '#0D2118',
    cardElevated: '#143124',
    border: '#1F4734',
    primary: '#10B981',
    primaryText: '#000000',
    accentRed: '#F43F5E',
    accentCyan: '#06B6D4',
    accentOrange: '#F59E0B',
    text: '#ECFDF5',
    subtext: '#A7F3D0',
    tertiary: '#047857',
    danger: '#EF4444',
    ringTrackRed: '#300810',
    ringTrackGreen: '#092B19',
    ringTrackCyan: '#08252E',
  },
  DAYLIGHT: {
    name: 'DAYLIGHT',
    label: 'Pure Daylight',
    isDark: false,
    bg: '#F2F2F7',
    card: '#FFFFFF',
    cardElevated: '#E5E5EA',
    border: '#D1D1D6',
    primary: '#007AFF',
    primaryText: '#FFFFFF',
    accentRed: '#FF3B30',
    accentCyan: '#32ADE6',
    accentOrange: '#FF9500',
    text: '#000000',
    subtext: '#64748B',
    tertiary: '#94A3B8',
    danger: '#FF3B30',
    ringTrackRed: '#FFDCE2',
    ringTrackGreen: '#DDFCE5',
    ringTrackCyan: '#D6F4FF',
  },
  SOLAR_LIGHT: {
    name: 'SOLAR_LIGHT',
    label: 'Solar Amber',
    isDark: false,
    bg: '#FDFBF7',
    card: '#FFFFFF',
    cardElevated: '#F6F1E8',
    border: '#E8DEC8',
    primary: '#F97316',
    primaryText: '#FFFFFF',
    accentRed: '#DC2626',
    accentCyan: '#0284C7',
    accentOrange: '#D97706',
    text: '#1C1917',
    subtext: '#78716C',
    tertiary: '#A8A29E',
    danger: '#EF4444',
    ringTrackRed: '#FEE2E2',
    ringTrackGreen: '#DCFCE7',
    ringTrackCyan: '#E0F2FE',
  },
  NORDIC_FROST: {
    name: 'NORDIC_FROST',
    label: 'Nordic Frost',
    isDark: false,
    bg: '#F8FAFC',
    card: '#FFFFFF',
    cardElevated: '#F1F5F9',
    border: '#CBD5E1',
    primary: '#0284C7',
    primaryText: '#FFFFFF',
    accentRed: '#E11D48',
    accentCyan: '#06B6D4',
    accentOrange: '#EA580C',
    text: '#0F172A',
    subtext: '#64748B',
    tertiary: '#94A3B8',
    danger: '#E11D48',
    ringTrackRed: '#FFE4E6',
    ringTrackGreen: '#DCFCE7',
    ringTrackCyan: '#CFFAFE',
  },
};

// Backward-compatibility alias for legacy persistence
(THEMES as any).APPLE_FITNESS = THEMES.APMED_PRO;

const ThemeContext = createContext<{
  theme: ThemePalette;
  setThemeMode: (mode: ThemeName) => void;
}>({
  theme: THEMES.MIDNIGHT_OLED,
  setThemeMode: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<ThemePalette>(THEMES.MIDNIGHT_OLED);

  useEffect(() => {
    try {
      const row = db.getFirstSync<{ theme_mode: string }>('SELECT theme_mode FROM user_settings WHERE id = 1');
      const rawMode = row?.theme_mode === 'APPLE_FITNESS' ? 'APMED_PRO' : row?.theme_mode;
      if (rawMode && THEMES[rawMode as ThemeName]) {
        setTheme(THEMES[rawMode as ThemeName]);
      } else {
        setTheme(THEMES.MIDNIGHT_OLED);
      }
    } catch {
      setTheme(THEMES.MIDNIGHT_OLED);
    }
  }, []);

  const setThemeMode = (mode: ThemeName) => {
    if (!THEMES[mode]) return;
    setTheme(THEMES[mode]);
    try {
      db.runSync('UPDATE user_settings SET theme_mode = ? WHERE id = 1', [mode]);
    } catch (e) {
      console.error('Failed to persist theme:', e);
    }
  };

  return <ThemeContext.Provider value={{ theme, setThemeMode }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);
