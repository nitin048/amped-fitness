import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../theme/ThemeContext';

interface PlateConfig {
  weight: number;
  color: string;
  textColor: string;
  height: number;
  width: number;
}

const AVAILABLE_PLATES: PlateConfig[] = [
  { weight: 25, color: '#EF4444', textColor: '#FFFFFF', height: 44, width: 22 },
  { weight: 20, color: '#2563EB', textColor: '#FFFFFF', height: 40, width: 20 },
  { weight: 15, color: '#F59E0B', textColor: '#000000', height: 36, width: 18 },
  { weight: 10, color: '#10B981', textColor: '#FFFFFF', height: 32, width: 16 },
  { weight: 5, color: '#F1F5F9', textColor: '#0F172A', height: 28, width: 14 },
  { weight: 2.5, color: '#475569', textColor: '#FFFFFF', height: 24, width: 12 },
  { weight: 1.25, color: '#94A3B8', textColor: '#000000', height: 20, width: 11 },
];

interface Props {
  totalWeightKg: number;
  barWeightKg?: number;
  onBarWeightChange?: (newBarKg: number) => void;
}

export const OlympicPlateRack: React.FC<Props> = ({
  totalWeightKg,
  barWeightKg = 20,
  onBarWeightChange,
}) => {
  const { theme } = useTheme();
  const barWeight = barWeightKg;

  let sideWeight = barWeight > 0 ? (totalWeightKg - barWeight) / 2 : totalWeightKg / 2;
  const loadedPlates: PlateConfig[] = [];

  if (sideWeight > 0) {
    for (const plate of AVAILABLE_PLATES) {
      while (sideWeight >= plate.weight - 0.001) {
        loadedPlates.push(plate);
        sideWeight = Math.round((sideWeight - plate.weight) * 100) / 100;
      }
    }
  }

  const calculatedSideKg = barWeight > 0 ? Math.max(0, (totalWeightKg - barWeight) / 2) : totalWeightKg / 2;

  return (
    <View style={[styles.container, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.subLabel, { color: theme.subtext }]} numberOfLines={1}>
            BARBELL SLEEVE (PER SIDE)
          </Text>
          <Text style={[styles.sideKgText, { color: theme.primary }]} numberOfLines={1}>
            {totalWeightKg <= barWeight
              ? `Bar Only (${barWeight}kg)`
              : `${calculatedSideKg}kg / side (+${barWeight}kg bar)`}
          </Text>
        </View>

        {/* BAR WEIGHT SELECTOR */}
        {onBarWeightChange && (
          <View style={[styles.barSelectorRow, { backgroundColor: theme.card, borderColor: theme.border, flexShrink: 0 }]}>
            {[20, 15, 0].map((bKg) => {
              const active = barWeightKg === bKg;
              return (
                <TouchableOpacity
                  key={bKg}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onBarWeightChange(bKg);
                  }}
                  style={[
                    styles.barChip,
                    active && { backgroundColor: theme.primary },
                  ]}
                >
                  <Text
                    style={[
                      styles.barChipText,
                      { color: active ? theme.primaryText : theme.subtext },
                    ]}
                  >
                    {bKg === 0 ? 'DB' : `${bKg}kg`}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View style={[styles.rackRow, { backgroundColor: theme.isDark ? '#09090B' : '#E2E8F0' }]}>
        {/* BAR SLEEVE COLLAR */}
        <View style={[styles.collar, { backgroundColor: theme.isDark ? '#636366' : '#94A3B8' }]} />
        <View style={[styles.barSleeve, { backgroundColor: theme.isDark ? '#A1A1AA' : '#CBD5E1' }]} />

        {/* LOADED PLATES */}
        {totalWeightKg <= barWeight && barWeight > 0 ? (
          <View style={styles.noPlatesBox}>
            <Text style={[styles.noPlatesText, { color: theme.subtext }]}>
              No plates needed • Empty {barWeight}kg Olympic Bar
            </Text>
          </View>
        ) : loadedPlates.length === 0 ? (
          <View style={styles.noPlatesBox}>
            <Text style={[styles.noPlatesText, { color: theme.subtext }]}>Micro load or bodyweight</Text>
          </View>
        ) : (
          <View style={styles.platesContainer}>
            {loadedPlates.map((p, idx) => (
              <View
                key={`${p.weight}-${idx}`}
                style={[
                  styles.plateDisc,
                  {
                    backgroundColor: p.color,
                    height: p.height,
                    width: p.width,
                  },
                ]}
              >
                <Text style={[styles.plateWeightText, { color: p.textColor }]}>
                  {p.weight}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  subLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  sideKgText: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 1,
  },
  barSelectorRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    gap: 2,
  },
  barChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  barChipText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: 12,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  collar: {
    width: 8,
    height: 34,
    borderRadius: 2,
    marginRight: 2,
  },
  barSleeve: {
    width: 14,
    height: 12,
    borderRadius: 1,
    marginRight: 8,
  },
  platesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  plateDisc: {
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  plateWeightText: {
    fontSize: 9,
    fontWeight: '900',
  },
  noPlatesBox: {
    paddingLeft: 8,
  },
  noPlatesText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
