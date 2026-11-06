import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Barometer } from 'expo-sensors';
import * as Haptics from 'expo-haptics';
import {
  Thermometer,
  CloudSun,
  Droplets,
  Gauge,
  Activity,
  Heart,
  Footprints,
  Sparkles,
  CheckCircle2,
  X,
  Plus,
  Minus,
  TrendingUp,
  AlertTriangle,
  Flame,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import {
  saveEnvironmentalReading,
  getLatestEnvironmentalReading,
  getRecoveryTrends,
  EnvironmentalLog,
  RecoveryTrendPoint,
} from '../db/database';
import {
  fetchOpenMeteoClimate,
  getAthleteClimateAdvice,
  ClimateReading,
} from '../services/weatherService';

interface EnvironmentalRecoveryModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onReadingSaved?: (reading: EnvironmentalLog) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const EnvironmentalRecoveryModal: React.FC<EnvironmentalRecoveryModalProps> = ({
  visible,
  theme,
  onClose,
  onReadingSaved,
}) => {
  const [tempUnit, setTempUnit] = useState<'C' | 'F'>('C');
  const [ambientTempC, setAmbientTempC] = useState<number>(22.0);
  const [humidityPct, setHumidityPct] = useState<number>(50);
  const [pressureHpa, setPressureHpa] = useState<number>(1013.2);
  const [isBarometerLive, setIsBarometerLive] = useState<boolean>(false);
  const [trends, setTrends] = useState<RecoveryTrendPoint[]>([]);
  const [isFetchingClimate, setIsFetchingClimate] = useState<boolean>(false);
  const [climateSource, setClimateSource] = useState<string>('Standard Hardware Baseline');
  const [aqiVal, setAqiVal] = useState<number>(35);

  const handleAutoFetchOpenMeteo = async () => {
    setIsFetchingClimate(true);
    Haptics.selectionAsync();
    try {
      const climate = await fetchOpenMeteoClimate();
      setAmbientTempC(climate.tempC);
      setHumidityPct(climate.humidityPct);
      setPressureHpa(climate.pressureHpa);
      setAqiVal(climate.aqi);
      setClimateSource(climate.source);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      console.warn('Climate fetch error:', e);
    } finally {
      setIsFetchingClimate(false);
    }
  };

  // Load trends & hardware sensors
  useEffect(() => {
    if (!visible) return;

    setTrends(getRecoveryTrends(7));

    const latest = getLatestEnvironmentalReading();
    if (latest) {
      setAmbientTempC(latest.tempC);
      setHumidityPct(latest.humidityPct);
      setPressureHpa(latest.pressureHpa);
    }

    // Hardware Barometer
    let barometerSub: { remove: () => void } | null = null;
    Barometer.isAvailableAsync()
      .then((avail) => {
        setIsBarometerLive(avail);
        if (avail) {
          barometerSub = Barometer.addListener(({ pressure }) => {
            setPressureHpa(Number(pressure.toFixed(1)));
          });
        }
      })
      .catch((e) => console.warn('Barometer error:', e));

    return () => {
      if (barometerSub) barometerSub.remove();
    };
  }, [visible]);

  // Heat Index calculation (Steadman formula approximation)
  const computeHeatIndex = (tempC: number, rh: number): number => {
    if (tempC < 20) return tempC;
    const tempF = (tempC * 9) / 5 + 32;
    const hiF =
      0.5 *
      (tempF +
        61.0 +
        (tempF - 68.0) * 1.2 +
        rh * 0.094);
    const hiC = ((hiF - 32) * 5) / 9;
    return Number(hiC.toFixed(1));
  };

  const heatIndexC = computeHeatIndex(ambientTempC, humidityPct);

  // Environmental thermal assessment
  const getThermalStatus = () => {
    if (ambientTempC < 16) {
      return {
        label: 'Cool / Joint Stiffness Potential',
        color: '#00F0FF',
        impact: 82,
        advice: 'Low core thermal strain, but joint synovial fluid is cooler. Add 5 min to your dynamic warm-up.',
      };
    }
    if (ambientTempC <= 23) {
      return {
        label: 'Optimal Athletic Recovery Envelope',
        color: '#34C759',
        impact: 95,
        advice: 'Ideal thermodynamic zone for parasympathetic recovery, deep cellular rest, and minimal cardiac drift.',
      };
    }
    if (ambientTempC <= 28) {
      return {
        label: 'Mild Thermal Strain / Increased Sweat Rate',
        color: '#FF9500',
        impact: 80,
        advice: 'Elevated ambient heat. Heart rate will drift +4-8 BPM during cardio. Increase water intake by +400ml.',
      };
    }
    return {
      label: 'High Heat Strain / Dehydration Warning',
      color: '#FF2D55',
      impact: 64,
      advice: 'Significant cardiovascular load. Electrolyte replenishment mandatory. Extended rest between heavy sets required.',
    };
  };

  const thermalStatus = getThermalStatus();

  const handleAdjustTemp = (delta: number) => {
    const next = Math.max(10, Math.min(45, +(ambientTempC + delta).toFixed(1)));
    setAmbientTempC(next);
    Haptics.selectionAsync();
  };

  const handleAdjustHumidity = (delta: number) => {
    const next = Math.max(15, Math.min(95, humidityPct + delta));
    setHumidityPct(next);
    Haptics.selectionAsync();
  };

  const handleSaveLog = () => {
    const saved = saveEnvironmentalReading({
      tempC: ambientTempC,
      humidityPct,
      pressureHpa,
      heatIndexC,
      thermalStatus: thermalStatus.label,
      recoveryImpactScore: thermalStatus.impact,
      notes: 'Environmental recovery sensor telemetry log',
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTrends(getRecoveryTrends(7));
    if (onReadingSaved) {
      onReadingSaved(saved);
    }
  };

  const displayedTemp = tempUnit === 'C' ? ambientTempC : Number(((ambientTempC * 9) / 5 + 32).toFixed(1));
  const displayedHeatIndex = tempUnit === 'C' ? heatIndexC : Number(((heatIndexC * 9) / 5 + 32).toFixed(1));

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {/* HEADER */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconBox, { backgroundColor: `${thermalStatus.color}20` }]}>
                <Thermometer size={20} color={thermalStatus.color} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Environmental & Thermal Hub</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>
                  Barometer, Ambient Thermal Load & Recovery
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* HERO THERMAL CARD */}
            <View style={[styles.heroCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.heroTopRow}>
                <View>
                  <Text style={[styles.heroEyebrow, { color: theme.subtext }]}>AMBIENT ENVIRONMENT</Text>
                  <Text style={[styles.heroTitle, { color: thermalStatus.color }]}>{thermalStatus.label}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setTempUnit((p) => (p === 'C' ? 'F' : 'C'))}
                  style={[styles.unitTogglePill, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <Text style={[styles.unitToggleText, { color: theme.primary }]}>°{tempUnit}</Text>
                </TouchableOpacity>
              </View>

              {/* OPEN-METEO LIVE CLIMATE AUTO-FETCH */}
              <TouchableOpacity
                onPress={handleAutoFetchOpenMeteo}
                disabled={isFetchingClimate}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  backgroundColor: `${theme.primary}18`,
                  borderWidth: 1,
                  borderColor: `${theme.primary}50`,
                  marginTop: 10,
                }}
                activeOpacity={0.8}
              >
                <Sparkles size={14} color={theme.primary} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: theme.primary }}>
                  {isFetchingClimate ? 'Syncing Open-Meteo Global API...' : '⚡ Auto-Fetch Live Climate (Open-Meteo)'}
                </Text>
              </TouchableOpacity>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                <Text style={{ fontSize: 10, color: theme.subtext, fontWeight: '600' }}>
                  Source: {climateSource}
                </Text>
                <Text style={{ fontSize: 10, color: aqiVal > 50 ? '#FF9500' : '#34C759', fontWeight: '800' }}>
                  AQI: {aqiVal} (Air Quality)
                </Text>
              </View>

              {/* Main Gauges in Strict 2-Column Grid */}
              <View style={{ gap: 10, marginVertical: 12 }}>
                {/* ROW 1: TEMPERATURE & HUMIDITY */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Temp */}
                  <View style={[styles.gaugeBox, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.gaugeLabel, { color: theme.subtext }]}>TEMPERATURE</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginVertical: 4 }}>
                      <Text style={[styles.gaugeVal, { color: theme.text, fontSize: 22 }]}>{displayedTemp}</Text>
                      <Text style={[styles.gaugeUnit, { color: theme.subtext }]}>°{tempUnit}</Text>
                    </View>
                    <View style={styles.miniStepperRow}>
                      <TouchableOpacity onPress={() => handleAdjustTemp(-0.5)} style={styles.miniStepperBtn}>
                        <Minus size={12} color={theme.text} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleAdjustTemp(0.5)} style={styles.miniStepperBtn}>
                        <Plus size={12} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Humidity */}
                  <View style={[styles.gaugeBox, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.gaugeLabel, { color: theme.subtext }]}>HUMIDITY</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginVertical: 4 }}>
                      <Text style={[styles.gaugeVal, { color: '#00F0FF', fontSize: 22 }]}>{humidityPct}</Text>
                      <Text style={[styles.gaugeUnit, { color: theme.subtext }]}>%</Text>
                    </View>
                    <View style={styles.miniStepperRow}>
                      <TouchableOpacity onPress={() => handleAdjustHumidity(-5)} style={styles.miniStepperBtn}>
                        <Minus size={12} color={theme.text} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => handleAdjustHumidity(5)} style={styles.miniStepperBtn}>
                        <Plus size={12} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* ROW 2: BAROMETER & HEAT INDEX */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Barometer */}
                  <View style={[styles.gaugeBox, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.gaugeLabel, { color: theme.subtext }]}>PRESSURE</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginVertical: 4 }}>
                      <Text style={[styles.gaugeVal, { color: '#34C759', fontSize: 20 }]}>{pressureHpa}</Text>
                      <Text style={[styles.gaugeUnit, { color: theme.subtext }]}>hPa</Text>
                    </View>
                    <Text style={[styles.sensorTag, { color: isBarometerLive ? '#34C759' : theme.subtext, marginTop: 4 }]}>
                      {isBarometerLive ? 'Live Sensor' : 'Standard ATM'}
                    </Text>
                  </View>

                  {/* Heat Index */}
                  <View style={[styles.gaugeBox, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.gaugeLabel, { color: theme.subtext }]}>HEAT INDEX</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 2, marginVertical: 4 }}>
                      <Text style={[styles.gaugeVal, { color: thermalStatus.color, fontSize: 20 }]}>
                        {tempUnit === 'C' ? heatIndexC : ((heatIndexC * 9) / 5 + 32).toFixed(1)}
                      </Text>
                      <Text style={[styles.gaugeUnit, { color: theme.subtext }]}>°{tempUnit}</Text>
                    </View>
                    <Text style={[styles.sensorTag, { color: thermalStatus.color, marginTop: 4 }]}>
                      Steadman Apparent
                    </Text>
                  </View>
                </View>
              </View>

              {/* Thermal Advice Alert */}
              <View style={[styles.adviceBox, { backgroundColor: `${thermalStatus.color}12`, borderColor: `${thermalStatus.color}35` }]}>
                <Flame size={15} color={thermalStatus.color} />
                <Text style={[styles.adviceText, { color: theme.text }]}>
                  {thermalStatus.advice}
                </Text>
              </View>
            </View>

            {/* MULTI-VARIABLE RECOVERY TRENDS (7 DAYS) */}
            <View style={[styles.trendsCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={styles.trendsHeaderRow}>
                <View>
                  <Text style={[styles.heroEyebrow, { color: theme.subtext }]}>CHRONIC BIOMETRIC TRENDS</Text>
                  <Text style={[styles.cardTitle, { color: theme.text }]}>7-Day Recovery Correlation</Text>
                </View>
                <View style={[styles.legendPill, { backgroundColor: `${theme.primary}15` }]}>
                  <Activity size={12} color={theme.primary} />
                  <Text style={[styles.legendPillText, { color: theme.primary }]}>SYNTHESIZED</Text>
                </View>
              </View>

              <Text style={{ fontSize: 11, color: theme.subtext, marginBottom: 12 }}>
                Correlating muscular readiness, resting heart rate, and environmental temperature load.
              </Text>

              {/* Multi-Day Bars */}
              <View style={styles.trendBarsRow}>
                {trends.map((item, idx) => {
                  return (
                    <View key={item.dateStr || idx} style={styles.trendDayCol}>
                      <Text style={[styles.trendBarVal, { color: theme.primary }]}>
                        {item.recoveryPct}%
                      </Text>
                      <View style={styles.trendBarTrack}>
                        <View
                          style={[
                            styles.trendBarFill,
                            {
                              height: `${item.recoveryPct}%`,
                              backgroundColor: item.isPeak ? theme.primary : `${theme.primary}70`,
                            },
                          ]}
                        />
                      </View>
                      <Text style={[styles.trendDayLabel, { color: item.isPeak ? theme.text : theme.subtext }]}>
                        {item.dayLabel}
                      </Text>
                      {/* Vitals sub-data */}
                      <Text style={[styles.trendSubData, { color: '#FF2D55' }]}>{item.restingHr}b</Text>
                      <Text style={[styles.trendSubData, { color: '#00F0FF' }]}>{item.tempC}°</Text>
                    </View>
                  );
                })}
              </View>

              {/* Legend */}
              <View style={styles.trendLegendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: theme.primary }]} />
                  <Text style={[styles.legendDesc, { color: theme.subtext }]}>Recovery %</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#FF2D55' }] } />
                  <Text style={[styles.legendDesc, { color: theme.subtext }]}>Resting HR (BPM)</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#00F0FF' }]} />
                  <Text style={[styles.legendDesc, { color: theme.subtext }]}>Ambient Temp (°C)</Text>
                </View>
              </View>
            </View>

            {/* SAVE LOG BUTTON */}
            <TouchableOpacity
              onPress={handleSaveLog}
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <CheckCircle2 size={18} color={theme.primaryText} />
              <Text style={[styles.saveBtnText, { color: theme.primaryText }]}>
                Record Environmental Recovery Snapshot
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    gap: 14,
    paddingBottom: 40,
  },
  heroCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  unitTogglePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  unitToggleText: {
    fontSize: 11,
    fontWeight: '800',
  },
  gaugeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  gaugeBox: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
  },
  gaugeLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  gaugeVal: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  gaugeUnit: {
    fontSize: 10,
    fontWeight: '700',
  },
  miniStepperRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  miniStepperBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sensorTag: {
    fontSize: 8,
    fontWeight: '700',
    marginTop: 6,
  },
  adviceBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  adviceText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  trendsCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  trendsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  legendPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  legendPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  trendBarsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 120,
    paddingTop: 10,
    marginBottom: 10,
  },
  trendDayCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
  },
  trendBarVal: {
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 4,
  },
  trendBarTrack: {
    width: 14,
    height: 65,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 7,
  },
  trendDayLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 6,
  },
  trendSubData: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 1,
  },
  trendLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
    paddingTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendDesc: {
    fontSize: 10,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 4,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
});

