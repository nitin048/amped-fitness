import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Search, X, Check, Globe, Dumbbell, ChevronRight, Sparkles, Database } from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import {
  OnlineExercise,
  searchOnlineExercises,
  importExerciseToLocalDb,
  getExerciseImageUrl,
  mapToCoreMuscle,
} from '../services/freeExerciseApi';
import {
  WgerExercise,
  searchWgerExercises,
  importWgerExerciseToLocalDb,
  mapWgerMuscleToCore,
} from '../services/wgerApi';
import { Exercise } from '../db/database';
import { sanitizeText } from '../utils/inputValidation';

interface OnlineExerciseModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onExerciseImported: (newEx: Exercise) => void;
}

type ApiSource = 'FREE_EXERCISE_DB' | 'WGER_API';

interface UnifiedExerciseDisplay {
  id: string;
  source: ApiSource;
  name: string;
  primaryMuscle: string;
  equipment: string;
  instructions: string[];
  images: string[];
  licenseAuthor?: string;
  rawItem: OnlineExercise | WgerExercise;
}

export const OnlineExerciseModal: React.FC<OnlineExerciseModalProps> = ({
  visible,
  theme,
  onClose,
  onExerciseImported,
}) => {
  const insets = useSafeAreaInsets();
  const [selectedSource, setSelectedSource] = useState<ApiSource>('FREE_EXERCISE_DB');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('ALL');
  const [results, setResults] = useState<UnifiedExerciseDisplay[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedEx, setSelectedEx] = useState<UnifiedExerciseDisplay | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const muscleOptions = ['ALL', 'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE'];

  useEffect(() => {
    if (!visible) return;
    performSearch();
  }, [visible, selectedSource, selectedMuscle]);

  const performSearch = async () => {
    setLoading(true);
    try {
      if (selectedSource === 'FREE_EXERCISE_DB') {
        const items = await searchOnlineExercises(searchQuery, selectedMuscle);
        const mapped: UnifiedExerciseDisplay[] = items.slice(0, 50).map((item) => ({
          id: `fed_${item.id}`,
          source: 'FREE_EXERCISE_DB',
          name: item.name,
          primaryMuscle: mapToCoreMuscle(item.primaryMuscles[0] || 'CHEST'),
          equipment: item.equipment || 'Free Weights',
          instructions: item.instructions || [],
          images: item.images.map((img) => getExerciseImageUrl(img) || '').filter(Boolean),
          licenseAuthor: 'Free Exercise DB (Open Source)',
          rawItem: item,
        }));
        setResults(mapped);
      } else {
        const items = await searchWgerExercises(searchQuery, selectedMuscle);
        const mapped: UnifiedExerciseDisplay[] = items.map((item) => ({
          id: `wger_${item.id}`,
          source: 'WGER_API',
          name: item.name,
          primaryMuscle: item.primaryMuscles.length > 0
            ? mapWgerMuscleToCore(item.primaryMuscles[0])
            : mapWgerMuscleToCore(item.category),
          equipment: item.equipment.join(', ') || 'Free Weights',
          instructions: item.description ? [item.description] : ['Execute movement with controlled cadence.'],
          images: item.images,
          licenseAuthor: item.licenseAuthor || 'wger Workout Manager Community',
          rawItem: item,
        }));
        setResults(mapped);
      }
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (item: UnifiedExerciseDisplay) => {
    let imported: Exercise;
    if (item.source === 'FREE_EXERCISE_DB') {
      imported = importExerciseToLocalDb(item.rawItem as OnlineExercise);
    } else {
      imported = importWgerExerciseToLocalDb(item.rawItem as WgerExercise);
    }
    setImportedIds((prev) => new Set(prev).add(item.id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onExerciseImported(imported);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
                paddingBottom: Math.max(16, insets.bottom),
              },
            ]}
          >
            {/* HEADER */}
            <View style={styles.headerRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1, paddingRight: 8 }}>
                <View style={[styles.globeBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <Globe size={18} color={theme.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[styles.modalTitle, { color: theme.text }]}
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                  >
                    Open Fitness API Library
                  </Text>
                  <Text style={[styles.modalSubtitle, { color: theme.subtext }]} numberOfLines={1}>
                    Free Exercise DB & wger Open Workout Manager
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <X size={20} color={theme.subtext} />
              </TouchableOpacity>
            </View>

            {/* SOURCE SELECTOR TABS */}
            <View style={[styles.sourceTabRow, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedSource('FREE_EXERCISE_DB');
                  setSelectedEx(null);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.sourceTab,
                  selectedSource === 'FREE_EXERCISE_DB' && { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.sourceTabText,
                    {
                      color: selectedSource === 'FREE_EXERCISE_DB' ? theme.primaryText : theme.subtext,
                      fontWeight: selectedSource === 'FREE_EXERCISE_DB' ? '900' : '600',
                    },
                  ]}
                >
                  Free Exercise DB (800+)
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setSelectedSource('WGER_API');
                  setSelectedEx(null);
                  Haptics.selectionAsync();
                }}
                style={[
                  styles.sourceTab,
                  selectedSource === 'WGER_API' && { backgroundColor: theme.primary },
                ]}
              >
                <Text
                  style={[
                    styles.sourceTabText,
                    {
                      color: selectedSource === 'WGER_API' ? theme.primaryText : theme.subtext,
                      fontWeight: selectedSource === 'WGER_API' ? '900' : '600',
                    },
                  ]}
                >
                  wger API (Community)
                </Text>
              </TouchableOpacity>
            </View>

            {/* SEARCH BAR */}
            <View style={[styles.searchBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <Search size={18} color={theme.subtext} />
              <TextInput
                placeholder="Search exercise by movement (Squat, Press, Row)..."
                placeholderTextColor={theme.subtext}
                value={searchQuery}
                onChangeText={(t) => setSearchQuery(sanitizeText(t, 60))}
                maxLength={60}
                onSubmitEditing={performSearch}
                returnKeyType="search"
                style={[styles.searchInput, { color: theme.text }]}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '700' }}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* MUSCLE FILTER CHIPS */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginVertical: 10, maxHeight: 38 }}
            >
              {muscleOptions.map((m) => {
                const active = selectedMuscle === m;
                return (
                  <TouchableOpacity
                    key={m}
                    onPress={() => {
                      setSelectedMuscle(m);
                      Haptics.selectionAsync();
                    }}
                    style={[
                      styles.muscleChip,
                      {
                        backgroundColor: active ? theme.primary : theme.cardElevated,
                        borderColor: active ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.muscleChipText,
                        { color: active ? theme.primaryText : theme.subtext, fontWeight: active ? '800' : '600' },
                      ]}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* RESULTS LIST OR DETAIL VIEW */}
            {selectedEx ? (
              /* DETAIL PREVIEW OF SELECTED EXERCISE */
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingVertical: 10 }}>
                <TouchableOpacity
                  onPress={() => setSelectedEx(null)}
                  style={[styles.backRow, { borderColor: theme.border }]}
                >
                  <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>
                    &larr; Back to Exercises List
                  </Text>
                </TouchableOpacity>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View style={[styles.sourceBadge, { backgroundColor: `${theme.primary}20` }]}>
                    <Text style={[styles.sourceBadgeText, { color: theme.primary }]}>
                      {selectedEx.source === 'FREE_EXERCISE_DB' ? 'FREE EXERCISE DB' : 'WGER REST API'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 11, color: theme.subtext }}>
                    {selectedEx.licenseAuthor}
                  </Text>
                </View>

                <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedEx.name}</Text>
                <Text style={[styles.detailMeta, { color: theme.primary }]}>
                  {selectedEx.primaryMuscle.toUpperCase()} • {selectedEx.equipment.toUpperCase()}
                </Text>

                {/* IMAGES PREVIEW */}
                {selectedEx.images && selectedEx.images.length > 0 && (
                  <View style={styles.imageGalleryRow}>
                    {selectedEx.images.slice(0, 2).map((img, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: img }}
                        style={styles.exerciseImagePreview}
                        resizeMode="cover"
                      />
                    ))}
                  </View>
                )}

                {/* INSTRUCTIONS */}
                <Text style={[styles.instructionsHeader, { color: theme.subtext }]}>FORM INSTRUCTIONS:</Text>
                {selectedEx.instructions.map((inst, i) => (
                  <View key={i} style={styles.instructionItemRow}>
                    <Text style={[styles.stepNumber, { color: theme.primary }]}>{i + 1}.</Text>
                    <Text style={[styles.instructionStepText, { color: theme.text }]}>{inst}</Text>
                  </View>
                ))}

                {/* IMPORT BUTTON */}
                <TouchableOpacity
                  onPress={() => handleImport(selectedEx)}
                  style={[styles.importBtn, { backgroundColor: theme.primary }]}
                >
                  <Check size={18} color={theme.primaryText} />
                  <Text style={[styles.importBtnText, { color: theme.primaryText }]}>
                    {importedIds.has(selectedEx.id) ? 'Saved to Your App' : 'Add to My Exercises & Lift'}
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              /* RESULTS LIST */
              <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.subtext }]}>
                      Loading from {selectedSource === 'FREE_EXERCISE_DB' ? 'Free Exercise DB' : 'wger Workout Manager'}...
                    </Text>
                  </View>
                ) : results.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Dumbbell size={36} color={theme.border} />
                    <Text style={[styles.emptyTitle, { color: theme.text }]}>No exercises found</Text>
                    <Text style={[styles.emptySub, { color: theme.subtext }]}>
                      Try searching for another keyword like "squat", "press", "curl", or "row".
                    </Text>
                  </View>
                ) : (
                  results.map((item) => {
                    const isImported = importedIds.has(item.id);
                    const firstImg = item.images && item.images.length > 0 ? item.images[0] : null;

                    return (
                      <TouchableOpacity
                        key={item.id}
                        onPress={() => {
                          setSelectedEx(item);
                          Haptics.selectionAsync();
                        }}
                        style={[styles.resultItemCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                      >
                        {firstImg ? (
                          <Image source={{ uri: firstImg }} style={styles.thumbnailImg} resizeMode="cover" />
                        ) : (
                          <View style={[styles.placeholderThumb, { backgroundColor: `${theme.primary}15` }]}>
                            <Dumbbell size={18} color={theme.primary} />
                          </View>
                        )}

                        <View style={{ flex: 1, marginLeft: 12, paddingRight: 6 }}>
                          <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={1}>
                            {item.name}
                          </Text>
                          <Text style={[styles.resultMeta, { color: theme.subtext }]} numberOfLines={1}>
                            {item.primaryMuscle} • {item.equipment}
                          </Text>
                        </View>

                        <TouchableOpacity
                          onPress={() => handleImport(item)}
                          style={[
                            styles.quickAddBtn,
                            {
                              backgroundColor: isImported ? `${theme.primary}25` : theme.primary,
                              borderColor: theme.primary,
                              flexShrink: 0,
                            },
                          ]}
                        >
                          {isImported ? (
                            <Check size={14} color={theme.primary} />
                          ) : (
                            <Text style={[styles.quickAddBtnText, { color: theme.primaryText }]}>+ Add</Text>
                          )}
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
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
  keyboardContainer: {
    width: '100%',
    height: '92%',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    height: '100%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 20,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  globeBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  sourceTabRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginBottom: 10,
    borderWidth: 1,
  },
  sourceTab: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  sourceTabText: {
    fontSize: 11,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  muscleChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    justifyContent: 'center',
  },
  muscleChipText: {
    fontSize: 11,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 12,
  },
  emptyContainer: {
    paddingVertical: 50,
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  resultItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
  },
  thumbnailImg: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  placeholderThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  resultMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  quickAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  quickAddBtnText: {
    fontSize: 11,
    fontWeight: '900',
  },
  backRow: {
    paddingBottom: 8,
    marginBottom: 10,
    borderBottomWidth: 1,
  },
  sourceBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sourceBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  detailMeta: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 14,
  },
  imageGalleryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  exerciseImagePreview: {
    flex: 1,
    height: 140,
    borderRadius: 14,
  },
  instructionsHeader: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  instructionItemRow: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '900',
  },
  instructionStepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  importBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 18,
    marginBottom: 24,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: '800',
  },
});
