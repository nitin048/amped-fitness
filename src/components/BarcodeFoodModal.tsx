import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Barcode,
  Search,
  Check,
  X,
  Plus,
  Minus,
  Sparkles,
  Flame,
  Info,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import {
  fetchFoodByBarcode,
  logFoodFromOpenApi,
  FoodSearchResult,
  ATHLETE_PRESET_BARCODES,
} from '../services/openFoodApi';
import { MealLog } from '../db/database';

interface BarcodeFoodModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onFoodLogged?: (meal: MealLog) => void;
}

export const BarcodeFoodModal: React.FC<BarcodeFoodModalProps> = ({
  visible,
  theme,
  onClose,
  onFoodLogged,
}) => {
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [scannedFood, setScannedFood] = useState<FoodSearchResult | null>(null);
  const [servingGrams, setServingGrams] = useState<number>(100);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleLookup = async (code: string) => {
    const target = code.trim();
    if (target.length < 5) {
      setSearchError('Please enter a valid 8 to 14 digit barcode.');
      return;
    }

    setSearchError(null);
    setIsLoading(true);
    Haptics.selectionAsync();

    try {
      const result = await fetchFoodByBarcode(target);
      if (result) {
        setScannedFood(result);
        setServingGrams(100);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setSearchError('Product not found in Open Food Facts database. Try another barcode.');
      }
    } catch {
      setSearchError('Network error connecting to Open Food Facts API.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogMeal = () => {
    if (!scannedFood) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const meal = logFoodFromOpenApi(scannedFood, servingGrams);
    Alert.alert(
      'Logged Successfully!',
      `Added ${servingGrams}g of ${scannedFood.name} to today's nutrition diary.`
    );
    if (onFoodLogged) onFoodLogged(meal);
    onClose();
  };

  const factor = servingGrams / 100;
  const currentCals = scannedFood ? Math.round(scannedFood.caloriesPer100g * factor) : 0;
  const currentProtein = scannedFood ? Math.round(scannedFood.proteinPer100g * factor * 10) / 10 : 0;
  const currentCarbs = scannedFood ? Math.round(scannedFood.carbsPer100g * factor * 10) / 10 : 0;
  const currentFat = scannedFood ? Math.round(scannedFood.fatPer100g * factor * 10) / 10 : 0;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {/* HEADER */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.iconCircle, { backgroundColor: `${theme.primary}20` }]}>
                <Barcode size={20} color={theme.primary} />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Barcode Macro Scanner</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>
                  Powered by Open Food Facts (3M+ Global Foods)
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* BARCODE INPUT ROW */}
            <View style={[styles.inputContainer, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <Barcode size={18} color={theme.subtext} />
              <TextInput
                value={barcodeInput}
                onChangeText={(text) => {
                  setBarcodeInput(text);
                  setSearchError(null);
                }}
                placeholder="Type or paste EAN/UPC barcode..."
                placeholderTextColor={theme.subtext}
                keyboardType="numeric"
                style={[styles.textInput, { color: theme.text }]}
              />
              <TouchableOpacity
                onPress={() => handleLookup(barcodeInput)}
                disabled={isLoading}
                style={[styles.lookupBtn, { backgroundColor: theme.primary }]}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color={theme.primaryText} />
                ) : (
                  <Search size={16} color={theme.primaryText} />
                )}
              </TouchableOpacity>
            </View>

            {searchError && (
              <Text style={[styles.errorText, { color: theme.danger }]}>{searchError}</Text>
            )}

            {/* POPULAR FITNESS STAPLE CHIPS */}
            <View style={{ marginTop: 12 }}>
              <Text style={[styles.sectionLabel, { color: theme.subtext }]}>
                POPULAR FITNESS STAPLE PRESETS (1-TAP LOOKUP)
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
                {ATHLETE_PRESET_BARCODES.map((preset) => (
                  <TouchableOpacity
                    key={preset.barcode}
                    onPress={() => {
                      setBarcodeInput(preset.barcode);
                      handleLookup(preset.barcode);
                    }}
                    style={[
                      styles.presetChip,
                      {
                        backgroundColor: barcodeInput === preset.barcode ? `${theme.primary}25` : theme.cardElevated,
                        borderColor: barcodeInput === preset.barcode ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text style={[styles.presetChipTitle, { color: theme.text }]}>{preset.label}</Text>
                    <Text style={[styles.presetChipBrand, { color: theme.subtext }]}>{preset.brand}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* SCANNED PRODUCT PREVIEW */}
            {scannedFood && (
              <View style={[styles.productCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', gap: 12 }}>
                  {scannedFood.imageUrl ? (
                    <Image source={{ uri: scannedFood.imageUrl }} style={styles.productThumb} resizeMode="contain" />
                  ) : (
                    <View style={[styles.productThumbPlaceholder, { backgroundColor: `${theme.primary}15` }]}>
                      <Flame size={24} color={theme.primary} />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.productName, { color: theme.text }]} numberOfLines={2}>
                      {scannedFood.name}
                    </Text>
                    {scannedFood.brand && (
                      <Text style={[styles.productBrand, { color: theme.primary }]}>
                        {scannedFood.brand}
                      </Text>
                    )}
                    <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 4 }}>
                      Base 100g: {scannedFood.caloriesPer100g} kcal • P: {scannedFood.proteinPer100g}g • C: {scannedFood.carbsPer100g}g • F: {scannedFood.fatPer100g}g
                    </Text>
                  </View>
                </View>

                {/* SERVING SIZE SELECTOR */}
                <View style={[styles.servingBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <Text style={[styles.servingLabel, { color: theme.subtext }]}>PORTION SIZE</Text>
                  <View style={styles.servingStepperRow}>
                    <TouchableOpacity
                      onPress={() => {
                        setServingGrams((p) => Math.max(10, p - 10));
                        Haptics.selectionAsync();
                      }}
                      style={[styles.stepperBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                    >
                      <Minus size={16} color={theme.text} />
                    </TouchableOpacity>
                    <Text style={[styles.servingValText, { color: theme.text }]}>
                      {servingGrams} <Text style={{ fontSize: 12, color: theme.subtext }}>grams</Text>
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setServingGrams((p) => p + 10);
                        Haptics.selectionAsync();
                      }}
                      style={[styles.stepperBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                    >
                      <Plus size={16} color={theme.text} />
                    </TouchableOpacity>
                  </View>

                  {/* QUICK PORTION PILLS */}
                  <View style={styles.portionPillsRow}>
                    {[30, 50, 100, 150, 200].map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => {
                          setServingGrams(g);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.portionPill,
                          {
                            backgroundColor: servingGrams === g ? theme.primary : theme.cardElevated,
                            borderColor: servingGrams === g ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.portionPillText,
                            { color: servingGrams === g ? theme.primaryText : theme.subtext },
                          ]}
                        >
                          {g}g
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* CALCULATED MACRO SUMMARY */}
                <View style={styles.macroGrid}>
                  <View style={[styles.macroBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.macroLabel, { color: theme.subtext }]}>CALORIES</Text>
                    <Text style={[styles.macroVal, { color: theme.text }]}>{currentCals}</Text>
                    <Text style={{ fontSize: 10, color: theme.subtext }}>kcal</Text>
                  </View>
                  <View style={[styles.macroBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.macroLabel, { color: theme.subtext }]}>PROTEIN</Text>
                    <Text style={[styles.macroVal, { color: theme.primary }]}>{currentProtein}g</Text>
                  </View>
                  <View style={[styles.macroBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.macroLabel, { color: theme.subtext }]}>CARBS</Text>
                    <Text style={[styles.macroVal, { color: theme.accentCyan }]}>{currentCarbs}g</Text>
                  </View>
                  <View style={[styles.macroBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.macroLabel, { color: theme.subtext }]}>FAT</Text>
                    <Text style={[styles.macroVal, { color: theme.accentOrange }]}>{currentFat}g</Text>
                  </View>
                </View>

                {/* LOG TO DIARY BUTTON */}
                <TouchableOpacity
                  onPress={handleLogMeal}
                  style={[styles.logBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.logBtnText, { color: theme.primaryText }]}>
                    Log {servingGrams}g to Daily Macros
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  scrollContent: {
    padding: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
  },
  lookupBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  errorText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  presetChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  presetChipTitle: {
    fontSize: 12,
    fontWeight: '800',
  },
  presetChipBrand: {
    fontSize: 10,
    marginTop: 2,
  },
  productCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 16,
  },
  productThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
  },
  productThumbPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  productBrand: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  servingBox: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 14,
  },
  servingLabel: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  servingStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  stepperBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  servingValText: {
    fontSize: 18,
    fontWeight: '900',
  },
  portionPillsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
    justifyContent: 'space-between',
  },
  portionPill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  portionPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  macroBox: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '900',
  },
  macroVal: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 2,
  },
  logBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  logBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});

