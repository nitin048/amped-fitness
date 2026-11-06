import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Utensils,
  Check,
  X,
  Sparkles,
  Flame,
  Scale,
  RotateCcw,
  Plus,
  Minus,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import {
  AnalyzedFoodItem,
  GYM_FOOD_DATABASE,
  saveConfirmedMeal,
} from '../services/aiFoodScanner';
import { MealLog } from '../db/database';

interface FoodScanConfirmModalProps {
  visible: boolean;
  theme: ThemePalette;
  analyzedItem: AnalyzedFoodItem | null;
  loading: boolean;
  onClose: () => void;
  onMealSaved: (saved: MealLog) => void;
}

const PORTION_CHIPS = [100, 150, 200, 250, 300];

export const FoodScanConfirmModal: React.FC<FoodScanConfirmModalProps> = ({
  visible,
  theme,
  analyzedItem,
  loading,
  onClose,
  onMealSaved,
}) => {
  const [foodName, setFoodName] = useState<string>('');
  const [portionGrams, setPortionGrams] = useState<number>(150);
  const [baseRatio, setBaseRatio] = useState<{
    calPerG: number;
    proPerG: number;
    carbPerG: number;
    fatPerG: number;
  }>({ calPerG: 1.5, proPerG: 0.15, carbPerG: 0.15, fatPerG: 0.05 });

  useEffect(() => {
    if (analyzedItem) {
      setFoodName(analyzedItem.foodName);
      const grams = Math.max(20, analyzedItem.servingGrams || 150);
      setPortionGrams(grams);

      setBaseRatio({
        calPerG: analyzedItem.calories / grams,
        proPerG: analyzedItem.proteinG / grams,
        carbPerG: analyzedItem.carbsG / grams,
        fatPerG: analyzedItem.fatG / grams,
      });
    }
  }, [analyzedItem]);

  const currentCalories = Math.round(baseRatio.calPerG * portionGrams);
  const currentProtein = Math.round(baseRatio.proPerG * portionGrams);
  const currentCarbs = Math.round(baseRatio.carbPerG * portionGrams);
  const currentFat = Math.round(baseRatio.fatPerG * portionGrams);

  const handleAdjustPortion = (delta: number) => {
    setPortionGrams((prev) => Math.max(25, prev + delta));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSelectQuickFood = (food: typeof GYM_FOOD_DATABASE[0]) => {
    setFoodName(food.name);
    setPortionGrams(food.defaultGrams);
    setBaseRatio({
      calPerG: food.calPer100g / 100,
      proPerG: food.proPer100g / 100,
      carbPerG: food.carbPer100g / 100,
      fatPerG: food.fatPer100g / 100,
    });
    Haptics.selectionAsync();
  };

  const handleConfirm = () => {
    if (!analyzedItem) return;

    const saved = saveConfirmedMeal({
      foodName: foodName.trim() || 'Logged Meal',
      servingGrams: portionGrams,
      calories: currentCalories,
      proteinG: currentProtein,
      carbsG: currentCarbs,
      fatG: currentFat,
      localImageUri: analyzedItem.imageUri,
      microsJson: JSON.stringify(analyzedItem.micros),
    });

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onMealSaved(saved);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <View style={[styles.badgeCircle, { backgroundColor: `${theme.primary}20` }]}>
                <Utensils size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                  {loading ? 'Analyzing Food Photo...' : 'Confirm Meal & Macros'}
                </Text>
                <Text style={[styles.modalSub, { color: theme.subtext }]} numberOfLines={1}>
                  {analyzedItem?.source === 'ai_vision' ? '✨ Gemini Vision Recognized' : 'Smart Nutritional Estimate'}
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.primary} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Scanning ingredients & estimating portion...
              </Text>
            </View>
          ) : analyzedItem ? (
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* PHOTO PREVIEW */}
              {analyzedItem.imageUri && (
                <View style={[styles.photoContainer, { borderColor: theme.border }]}>
                  <Image source={{ uri: analyzedItem.imageUri }} style={styles.photoImg} resizeMode="cover" />
                  <View style={[styles.sourceBadge, { backgroundColor: `${theme.cardElevated}EE` }]}>
                    <Sparkles size={12} color={theme.primary} />
                    <Text style={[styles.sourceBadgeText, { color: theme.text }]}>
                      {analyzedItem.source === 'ai_vision' ? 'AI Vision' : 'Smart Match'}
                    </Text>
                  </View>
                </View>
              )}

              {/* EDITABLE FOOD NAME */}
              <View style={{ marginVertical: 10 }}>
                <Text style={[styles.fieldLabel, { color: theme.subtext }]}>DETECTED MEAL</Text>
                <TextInput
                  value={foodName}
                  onChangeText={setFoodName}
                  style={[styles.foodNameInput, { backgroundColor: theme.cardElevated, color: theme.text, borderColor: theme.border }]}
                />
              </View>

              {/* QUICK SWAP POPULAR FOODS */}
              <View style={{ marginVertical: 4 }}>
                <Text style={[styles.fieldLabel, { color: theme.subtext }]}>OR TAP TO MATCH:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                  {GYM_FOOD_DATABASE.slice(0, 7).map((f) => (
                    <TouchableOpacity
                      key={f.name}
                      onPress={() => handleSelectQuickFood(f)}
                      style={[
                        styles.quickFoodChip,
                        {
                          backgroundColor: foodName === f.name ? theme.primary : theme.cardElevated,
                          borderColor: foodName === f.name ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickFoodChipText,
                          { color: foodName === f.name ? theme.primaryText : theme.text, fontWeight: foodName === f.name ? '800' : '600' },
                        ]}
                      >
                        {f.name.split('/')[0].trim()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* PORTION ADJUSTER */}
              <View style={[styles.portionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.portionLabel, { color: theme.subtext }]}>PORTION / SERVING SIZE</Text>
                  <Text style={[styles.portionGramsDisplay, { color: theme.primary }]}>{portionGrams}g</Text>
                </View>

                {/* STEPPER BUTTONS */}
                <View style={styles.portionStepperRow}>
                  <TouchableOpacity
                    onPress={() => handleAdjustPortion(-25)}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Minus size={18} color={theme.text} />
                  </TouchableOpacity>

                  {/* QUICK PORTION CHIPS */}
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {PORTION_CHIPS.map((g) => (
                      <TouchableOpacity
                        key={g}
                        onPress={() => {
                          setPortionGrams(g);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.gramChip,
                          {
                            backgroundColor: portionGrams === g ? theme.primary : theme.card,
                            borderColor: portionGrams === g ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.gramChipText,
                            { color: portionGrams === g ? theme.primaryText : theme.subtext },
                          ]}
                        >
                          {g}g
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    onPress={() => handleAdjustPortion(25)}
                    style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Plus size={18} color={theme.text} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* CALCULATED MACROS 4-GRID */}
              <View style={[styles.macrosCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.macroBox}>
                  <Text style={[styles.macroLabel, { color: theme.subtext }]}>ENERGY</Text>
                  <Text style={[styles.macroValue, { color: theme.accentOrange }]}>{currentCalories}</Text>
                  <Text style={[styles.macroUnit, { color: theme.subtext }]}>KCAL</Text>
                </View>

                <View style={styles.macroBox}>
                  <Text style={[styles.macroLabel, { color: theme.subtext }]}>PROTEIN</Text>
                  <Text style={[styles.macroValue, { color: theme.primary }]}>{currentProtein}g</Text>
                  <Text style={[styles.macroUnit, { color: theme.subtext }]}>Muscle</Text>
                </View>

                <View style={styles.macroBox}>
                  <Text style={[styles.macroLabel, { color: theme.subtext }]}>CARBS</Text>
                  <Text style={[styles.macroValue, { color: '#FFD60A' }]}>{currentCarbs}g</Text>
                  <Text style={[styles.macroUnit, { color: theme.subtext }]}>Fuel</Text>
                </View>

                <View style={styles.macroBox}>
                  <Text style={[styles.macroLabel, { color: theme.subtext }]}>FAT</Text>
                  <Text style={[styles.macroValue, { color: theme.accentCyan }]}>{currentFat}g</Text>
                  <Text style={[styles.macroUnit, { color: theme.subtext }]}>Hormones</Text>
                </View>
              </View>

              {/* CONFIRM BUTTON */}
              <TouchableOpacity
                onPress={handleConfirm}
                style={[styles.confirmBtn, { backgroundColor: theme.primary }]}
              >
                <Check size={18} color={theme.primaryText} />
                <Text style={[styles.confirmBtnText, { color: theme.primaryText }]}>
                  Log {currentCalories} kcal to Today's Nutrition
                </Text>
              </TouchableOpacity>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    height: '90%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  loadingBox: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  photoContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 190,
    borderWidth: 1,
    marginBottom: 12,
  },
  photoImg: {
    width: '100%',
    height: '100%',
  },
  sourceBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  foodNameInput: {
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '800',
    borderWidth: 1,
  },
  quickFoodChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    marginRight: 8,
    borderWidth: 1,
  },
  quickFoodChipText: {
    fontSize: 12,
  },
  portionCard: {
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    marginTop: 8,
  },
  portionLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  portionGramsDisplay: {
    fontSize: 16,
    fontWeight: '900',
  },
  portionStepperRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  gramChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  gramChipText: {
    fontSize: 11,
    fontWeight: '800',
  },
  macrosCard: {
    flexDirection: 'row',
    borderRadius: 18,
    paddingVertical: 14,
    borderWidth: 1,
    marginTop: 12,
  },
  macroBox: {
    flex: 1,
    alignItems: 'center',
  },
  macroLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 17,
    fontWeight: '900',
  },
  macroUnit: {
    fontSize: 10,
    marginTop: 1,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
    paddingVertical: 16,
    marginTop: 16,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

