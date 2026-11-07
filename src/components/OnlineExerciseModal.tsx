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
import * as Haptics from 'expo-haptics';
import { Search, X, Check, Globe, Dumbbell, ChevronRight, Sparkles } from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import {
  OnlineExercise,
  searchOnlineExercises,
  importExerciseToLocalDb,
  getExerciseImageUrl,
  mapToCoreMuscle,
} from '../services/freeExerciseApi';
import { Exercise } from '../db/database';
import { sanitizeText } from '../utils/inputValidation';

interface OnlineExerciseModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onExerciseImported: (newEx: Exercise) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OnlineExerciseModal: React.FC<OnlineExerciseModalProps> = ({
  visible,
  theme,
  onClose,
  onExerciseImported,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('ALL');
  const [results, setResults] = useState<OnlineExercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedOnlineEx, setSelectedOnlineEx] = useState<OnlineExercise | null>(null);
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());

  const muscleOptions = ['ALL', 'CHEST', 'BACK', 'LEGS', 'SHOULDERS', 'ARMS', 'CORE'];

  useEffect(() => {
    if (!visible) return;
    performSearch();
  }, [visible, selectedMuscle]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const items = await searchOnlineExercises(searchQuery, selectedMuscle);
      setResults(items.slice(0, 50)); // display top 50 results
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = (item: OnlineExercise) => {
    const imported = importExerciseToLocalDb(item);
    setImportedIds((prev) => new Set(prev).add(item.id));
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onExerciseImported(imported);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
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
                  Global Exercise Library (800+ Moves)
                </Text>
                <Text style={[styles.modalSubtitle, { color: theme.subtext }]} numberOfLines={1}>
                  Verified Athletic Database & Motion Guides
                </Text>
              </View>
            </View>

            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={theme.subtext} />
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View style={[styles.searchBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
            <Search size={18} color={theme.subtext} />
            <TextInput
              placeholder="Search by name (e.g. Hack Squat, Spider Curl)..."
              placeholderTextColor={theme.subtext}
              value={searchQuery}
              onChangeText={(t) => setSearchQuery(sanitizeText(t, 60))}
              maxLength={60}
              onSubmitEditing={performSearch}
              returnKeyType="search"
              style={[styles.searchInput, { color: theme.text }]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Text style={{ color: theme.subtext, fontSize: 12, fontWeight: '700' }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* MUSCLE FILTER CHIPS */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 10, maxHeight: 38 }}>
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
          {selectedOnlineEx ? (
            /* DETAIL PREVIEW OF SELECTED ONLINE EXERCISE */
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1, paddingVertical: 10 }}>
              <TouchableOpacity
                onPress={() => setSelectedOnlineEx(null)}
                style={[styles.backRow, { borderColor: theme.border }]}
              >
                <Text style={{ color: theme.primary, fontWeight: '800', fontSize: 13 }}>
                  &larr; Back to Exercises List
                </Text>
              </TouchableOpacity>

              <Text style={[styles.detailTitle, { color: theme.text }]}>{selectedOnlineEx.name}</Text>
              <Text style={[styles.detailMeta, { color: theme.primary }]}>
                {selectedOnlineEx.primaryMuscles.join(', ').toUpperCase()} • {selectedOnlineEx.equipment?.toUpperCase() || 'BODYWEIGHT'}
              </Text>

              {/* IMAGES PREVIEW */}
              {selectedOnlineEx.images && selectedOnlineEx.images.length > 0 && (
                <View style={styles.imageGalleryRow}>
                  {selectedOnlineEx.images.slice(0, 2).map((img, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: getExerciseImageUrl(img)! }}
                      style={styles.exerciseImagePreview}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}

              {/* INSTRUCTIONS */}
              <Text style={[styles.instructionsHeader, { color: theme.subtext }]}>FORM INSTRUCTIONS:</Text>
              {selectedOnlineEx.instructions.map((inst, i) => (
                <View key={i} style={styles.instructionItemRow}>
                  <Text style={[styles.stepNumber, { color: theme.primary }]}>{i + 1}.</Text>
                  <Text style={[styles.instructionStepText, { color: theme.text }]}>{inst}</Text>
                </View>
              ))}

              {/* IMPORT BUTTON */}
              <TouchableOpacity
                onPress={() => handleImport(selectedOnlineEx)}
                style={[styles.importBtn, { backgroundColor: theme.primary }]}
              >
                <Check size={18} color={theme.primaryText} />
                <Text style={[styles.importBtnText, { color: theme.primaryText }]}>
                  {importedIds.has(selectedOnlineEx.id) ? 'Saved to Your App ✓' : 'Add to My Exercises & Lift'}
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
                    Searching 876 exercises online...
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
                  const firstImg = item.images && item.images.length > 0 ? getExerciseImageUrl(item.images[0]) : null;

                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => {
                        setSelectedOnlineEx(item);
                        Haptics.selectionAsync();
                      }}
                      style={[styles.resultItemCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                    >
                      {firstImg && (
                        <Image source={{ uri: firstImg }} style={styles.thumbnailImg} resizeMode="cover" />
                      )}

                      <View style={{ flex: 1, marginLeft: firstImg ? 12 : 0, paddingRight: 6 }}>
                        <Text style={[styles.resultTitle, { color: theme.text }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.resultMeta, { color: theme.subtext }]} numberOfLines={1}>
                          {mapToCoreMuscle(item.primaryMuscles[0] || '')} • {item.equipment || 'Bodyweight'}
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
      </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
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
    fontSize: 13,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  resultItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
  },
  thumbnailImg: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: '#000000',
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  resultMeta: {
    fontSize: 11,
  },
  quickAddBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickAddBtnText: {
    fontSize: 12,
    fontWeight: '900',
  },
  /* DETAIL VIEW */
  backRow: {
    paddingVertical: 8,
    marginBottom: 8,
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  detailMeta: {
    fontSize: 13,
    fontWeight: '800',
    marginTop: 4,
    marginBottom: 14,
  },
  imageGalleryRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  exerciseImagePreview: {
    flex: 1,
    height: 180,
    borderRadius: 16,
    backgroundColor: '#000000',
  },
  instructionsHeader: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 8,
  },
  instructionItemRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 10,
  },
  stepNumber: {
    fontWeight: '900',
    fontSize: 13,
    width: 22,
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
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 18,
    marginBottom: 30,
  },
  importBtnText: {
    fontSize: 15,
    fontWeight: '900',
  },
});

