import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Easing,
  ActivityIndicator,
  Dimensions,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { YouTubeEmbedPlayer } from './YouTubeEmbedPlayer';
import {
  Scan,
  Camera,
  X,
  Sparkles,
  Target,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Play,
  RotateCcw,
  Sliders,
  Dumbbell,
  Info,
  Video,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import {
  AnalyzedEquipment,
  GYM_EQUIPMENT_DATABASE,
  getEquipmentDiagnosticById,
} from '../services/aiEquipmentScanner';

interface GymEquipmentScannerModalProps {
  visible: boolean;
  theme: ThemePalette;
  item: AnalyzedEquipment | null;
  loading: boolean;
  onClose: () => void;
  onStartExercise: (exerciseName: string, primaryMuscle: string, coachingCue?: string, youtubeVideoId?: string) => void;
  onRetake: (source: 'camera' | 'library') => void;
  onSelectDatabaseItem?: (id: string) => void;
}

const SCAN_MESSAGES = [
  'Detecting frame geometry & pulley track...',
  'Analyzing mechanical lever arms & resistance curve...',
  'Synthesizing primary muscle isolation vectors...',
  'Extracting seat height & safety catch protocols...',
  'Compiling athlete execution cues & form rules...',
];

type EquipmentTab = 'OVERVIEW' | 'SETUP' | 'VIDEO' | 'EXERCISES';

export const GymEquipmentScannerModal: React.FC<GymEquipmentScannerModalProps> = ({
  visible,
  theme,
  item,
  loading,
  onClose,
  onStartExercise,
  onRetake,
  onSelectDatabaseItem,
}) => {
  const [scanMessageIndex, setScanMessageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<EquipmentTab>('OVERVIEW');
  const [isPlayingVideo, setIsPlayingVideo] = useState(false);

  // Scanner Laser Animation
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(scanAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      ).start();

      const timer = setInterval(() => {
        setScanMessageIndex((prev) => (prev + 1) % SCAN_MESSAGES.length);
      }, 2000);

      return () => {
        clearInterval(timer);
        scanAnim.stopAnimation();
      };
    } else {
      scanAnim.setValue(0);
    }
  }, [loading]);

  // Reset tab when modal is closed
  useEffect(() => {
    if (!visible) {
      setActiveTab('OVERVIEW');
    }
  }, [visible]);

  const currentDisplayItem = item || getEquipmentDiagnosticById('leg_press');

  const handleOpenYouTubeDirect = async (videoId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const appUrl = `vnd.youtube://${videoId}`;
    const webUrl = `https://www.youtube.com/watch?v=${videoId}`;
    try {
      const canOpen = await Linking.canOpenURL(appUrl);
      if (canOpen) {
        await Linking.openURL(appUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const laserTranslateY = scanAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 210],
  });

  const handleStartExercisePress = (exName: string, muscle: string, cue?: string) => {
    setIsPlayingVideo(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onStartExercise(exName, muscle, cue, currentDisplayItem.youtubeVideoId);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.sheetContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* HEADER */}
          <View style={styles.headerRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.headerIconBox, { backgroundColor: `${theme.primary}20` }]}>
                <Scan size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.headerTitle, { color: theme.text }]}>Equipment Scanner</Text>
                  <View style={[styles.aiPill, { backgroundColor: `${theme.primary}18` }]}>
                    <Sparkles size={11} color={theme.primary} />
                    <Text style={[styles.aiPillText, { color: theme.primary }]}>PRO VISION</Text>
                  </View>
                </View>
                <Text style={[styles.headerSub, { color: theme.subtext }]} numberOfLines={1}>
                  Biomechanics, seat setup & execution guide
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => {
                setIsPlayingVideo(false);
                onClose();
              }}
              style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* EXPLORE COMMON MACHINES SELECTOR BAR */}
          <View style={styles.chipBarContainer}>
            <Text style={[styles.chipBarLabel, { color: theme.subtext }]}>EXPLORE MACHINES:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipBarScroll}>
              {GYM_EQUIPMENT_DATABASE.map((eq) => {
                const isSelected = currentDisplayItem.name === eq.name;
                return (
                  <TouchableOpacity
                    key={eq.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setIsPlayingVideo(false);
                      if (onSelectDatabaseItem) {
                        onSelectDatabaseItem(eq.id);
                      }
                    }}
                    style={[
                      styles.machineChip,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.cardElevated,
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.machineChipText,
                        { color: isSelected ? theme.primaryText : theme.text, fontWeight: isSelected ? '700' : '500' },
                      ]}
                      numberOfLines={1}
                    >
                      {eq.name.split(' ')[0]} {eq.name.split(' ')[1] || ''}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* MAIN CONTENT AREA */}
          {loading ? (
            /* SCANNING / ANALYZING STATE */
            <View style={styles.loadingContainer}>
              <View style={[styles.scanFrame, { borderColor: theme.primary, backgroundColor: `${theme.cardElevated}90` }]}>
                {item?.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.previewImage} resizeMode="cover" />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <Dumbbell size={64} color={`${theme.primary}60`} />
                  </View>
                )}

                {/* ANIMATED SCANNING LASER */}
                <Animated.View
                  style={[
                    styles.scanLaser,
                    {
                      backgroundColor: theme.primary,
                      shadowColor: theme.primary,
                      transform: [{ translateY: laserTranslateY }],
                    },
                  ]}
                />

                {/* TARGET RETICLE OVERLAY */}
                <View style={styles.reticleCornerTL} />
                <View style={styles.reticleCornerTR} />
                <View style={styles.reticleCornerBL} />
                <View style={styles.reticleCornerBR} />
              </View>

              <View style={styles.loadingInfoBox}>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.loadingTitle, { color: theme.text }]}>Scanning Gym Equipment...</Text>
                <Text style={[styles.loadingMessage, { color: theme.subtext }]}>
                  {SCAN_MESSAGES[scanMessageIndex]}
                </Text>
              </View>
            </View>
          ) : (
            /* ANALYZED DIAGNOSTICS VIEW */
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              nestedScrollEnabled
            >
              {/* HERO CARD WITH IMAGE / BADGE */}
              <View style={[styles.heroCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                {currentDisplayItem.imageUri ? (
                  <View style={styles.heroImageWrapper}>
                    <Image
                      source={{ uri: currentDisplayItem.imageUri }}
                      style={styles.heroImage}
                      resizeMode="cover"
                    />
                    <View style={styles.heroOverlayBadgeRow}>
                      <View style={[styles.categoryBadge, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
                        <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>
                          {currentDisplayItem.category}
                        </Text>
                      </View>
                      <View style={[styles.sourceBadge, { backgroundColor: 'rgba(0,0,0,0.75)' }]}>
                        <Sparkles size={11} color="#00F0FF" />
                        <Text style={[styles.sourceBadgeText, { color: '#00F0FF' }]}>
                          {currentDisplayItem.source === 'ai_vision' ? 'Biomechanical Vision' : 'Form Atlas'}
                        </Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.categoryHeaderOnly}>
                    <View style={[styles.categoryBadge, { backgroundColor: `${theme.primary}20` }]}>
                      <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>
                        {currentDisplayItem.category}
                      </Text>
                    </View>
                    <View style={[styles.sourceBadge, { backgroundColor: `${theme.border}40` }]}>
                      <Sparkles size={11} color="#00F0FF" />
                      <Text style={[styles.sourceBadgeText, { color: '#00F0FF' }]}>
                        {currentDisplayItem.source === 'ai_vision' ? 'Biomechanical Vision' : 'Form Atlas'}
                      </Text>
                    </View>
                  </View>
                )}

                <View style={styles.heroInfoContent}>
                  <Text style={[styles.equipmentTitle, { color: theme.text }]}>
                    {currentDisplayItem.name}
                  </Text>

                  {/* MUSCLE GROUP CHIPS */}
                  <View style={styles.muscleRow}>
                    <View style={styles.muscleSection}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <Target size={13} color={theme.primary} />
                        <Text style={[styles.muscleSectionLabel, { color: theme.subtext }]}>PRIMARY</Text>
                      </View>
                      <View style={styles.muscleChips}>
                        {currentDisplayItem.primaryMuscles.map((m, idx) => (
                          <View
                            key={idx}
                            style={[styles.primaryMusclePill, { backgroundColor: `${theme.primary}20`, borderColor: theme.primary }]}
                          >
                            <Text style={[styles.primaryMuscleText, { color: theme.primary }]}>{m}</Text>
                          </View>
                        ))}
                      </View>
                    </View>

                    {currentDisplayItem.secondaryMuscles.length > 0 && (
                      <View style={styles.muscleSection}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                          <Layers size={13} color={theme.subtext} />
                          <Text style={[styles.muscleSectionLabel, { color: theme.subtext }]}>ASSISTING</Text>
                        </View>
                        <View style={styles.muscleChips}>
                          {currentDisplayItem.secondaryMuscles.map((m, idx) => (
                            <View
                              key={idx}
                              style={[styles.secondaryMusclePill, { backgroundColor: theme.card, borderColor: theme.border }]}
                            >
                              <Text style={[styles.secondaryMuscleText, { color: theme.subtext }]}>{m}</Text>
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                </View>
              </View>

              {/* ATHLETIC TAB SELECTOR */}
              <View style={[styles.tabBar, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab('OVERVIEW');
                  }}
                  style={[
                    styles.tabButton,
                    activeTab === 'OVERVIEW' && [styles.tabButtonActive, { backgroundColor: theme.card }],
                  ]}
                >
                  <Info size={13} color={activeTab === 'OVERVIEW' ? theme.primary : theme.subtext} />
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === 'OVERVIEW' ? theme.primary : theme.subtext, fontWeight: activeTab === 'OVERVIEW' ? '700' : '500' },
                    ]}
                  >
                    Overview
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab('SETUP');
                  }}
                  style={[
                    styles.tabButton,
                    activeTab === 'SETUP' && [styles.tabButtonActive, { backgroundColor: theme.card }],
                  ]}
                >
                  <Sliders size={13} color={activeTab === 'SETUP' ? theme.primary : theme.subtext} />
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === 'SETUP' ? theme.primary : theme.subtext, fontWeight: activeTab === 'SETUP' ? '700' : '500' },
                    ]}
                  >
                    Setup
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab('VIDEO');
                    setIsPlayingVideo(true);
                  }}
                  style={[
                    styles.tabButton,
                    activeTab === 'VIDEO' && [styles.tabButtonActive, { backgroundColor: theme.card }],
                  ]}
                >
                  <Video size={13} color={activeTab === 'VIDEO' ? '#FF0000' : theme.subtext} />
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === 'VIDEO' ? '#FF0000' : theme.subtext, fontWeight: activeTab === 'VIDEO' ? '800' : '500' },
                    ]}
                  >
                    Video Guide
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab('EXERCISES');
                  }}
                  style={[
                    styles.tabButton,
                    activeTab === 'EXERCISES' && [styles.tabButtonActive, { backgroundColor: theme.card }],
                  ]}
                >
                  <Dumbbell size={13} color={activeTab === 'EXERCISES' ? theme.primary : theme.subtext} />
                  <Text
                    style={[
                      styles.tabText,
                      { color: activeTab === 'EXERCISES' ? theme.primary : theme.subtext, fontWeight: activeTab === 'EXERCISES' ? '700' : '500' },
                    ]}
                  >
                    Exercises
                  </Text>
                </TouchableOpacity>
              </View>

              {/* TAB 1: OVERVIEW & PURPOSE */}
              {activeTab === 'OVERVIEW' && (
                <View style={{ gap: 12 }}>
                  {/* VIDEO BANNER CALLOUT */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveTab('VIDEO');
                      setIsPlayingVideo(true);
                    }}
                    style={[styles.videoBannerCallout, { backgroundColor: '#FF000016', borderColor: '#FF000045' }]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.youtubeIconBadge, { backgroundColor: '#FF0000' }]}>
                      <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.videoBannerTitle, { color: theme.text }]}>
                          Watch Video Tutorial
                        </Text>
                        <View style={styles.hdBadge}>
                          <Text style={styles.hdBadgeText}>YOUTUBE</Text>
                        </View>
                      </View>
                      <Text style={[styles.videoBannerSub, { color: theme.subtext }]} numberOfLines={1}>
                        Watch how to set up pins, seat & execute proper form
                      </Text>
                    </View>
                    <ChevronRight size={18} color={theme.subtext} />
                  </TouchableOpacity>

                  {/* BIOMECHANICAL PURPOSE */}
                  <View style={[styles.sectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={[styles.sectionIconBadge, { backgroundColor: `${theme.primary}20` }]}>
                        <Target size={16} color={theme.primary} />
                      </View>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Biomechanical Purpose & Utility
                      </Text>
                    </View>
                    <Text style={[styles.purposeText, { color: theme.text }]}>
                      {currentDisplayItem.purpose}
                    </Text>
                  </View>

                  {/* EXECUTION & FORM CUES */}
                  <View style={[styles.sectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={[styles.sectionIconBadge, { backgroundColor: '#34C75920' }]}>
                        <CheckCircle2 size={16} color="#34C759" />
                      </View>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>Form & Execution Cues</Text>
                    </View>
                    <View style={{ gap: 8 }}>
                      {currentDisplayItem.executionCues.map((cue, idx) => (
                        <View key={idx} style={styles.cueRow}>
                          <View style={[styles.cueDot, { backgroundColor: '#34C759' }]} />
                          <Text style={[styles.cueText, { color: theme.text }]}>{cue}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* COMMON MISTAKES TO AVOID */}
                  <View style={[styles.sectionCard, { backgroundColor: '#FF3B3012', borderColor: '#FF3B3035' }]}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={[styles.sectionIconBadge, { backgroundColor: '#FF3B3025' }]}>
                        <AlertTriangle size={16} color="#FF3B30" />
                      </View>
                      <Text style={[styles.sectionTitle, { color: '#FF453A' }]}>Common Mistakes to Avoid</Text>
                    </View>
                    <View style={{ gap: 8 }}>
                      {currentDisplayItem.commonMistakes.map((mistake, idx) => (
                        <View key={idx} style={styles.cueRow}>
                          <Text style={{ color: '#FF453A', fontSize: 13, fontWeight: '700' }}>✕</Text>
                          <Text style={[styles.cueText, { color: theme.text }]}>{mistake}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* SAFETY TIP */}
                  <View style={[styles.safetyCard, { backgroundColor: '#FF9F0A15', borderColor: '#FF9F0A35' }]}>
                    <Shield size={18} color="#FF9F0A" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.safetyTitle, { color: '#FF9F0A' }]}>CRITICAL SAFETY CUE</Text>
                      <Text style={[styles.safetyText, { color: theme.text }]}>
                        {currentDisplayItem.safetyTip}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* TAB 2: SETUP & PIN ADJUSTMENT GUIDE */}
              {activeTab === 'SETUP' && (
                <View style={{ gap: 12 }}>
                  {/* VIDEO BANNER CALLOUT */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      setActiveTab('VIDEO');
                      setIsPlayingVideo(true);
                    }}
                    style={[styles.videoBannerCallout, { backgroundColor: '#FF000016', borderColor: '#FF000045' }]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.youtubeIconBadge, { backgroundColor: '#FF0000' }]}>
                      <Play size={13} color="#FFFFFF" fill="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.videoBannerTitle, { color: theme.text }]}>
                          Watch Setup Video Guide
                        </Text>
                        <View style={styles.hdBadge}>
                          <Text style={styles.hdBadgeText}>TUTORIAL</Text>
                        </View>
                      </View>
                      <Text style={[styles.videoBannerSub, { color: theme.subtext }]} numberOfLines={1}>
                        Step-by-step visual walkthrough of machine setup
                      </Text>
                    </View>
                    <ChevronRight size={18} color={theme.subtext} />
                  </TouchableOpacity>

                  <View style={[styles.sectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={[styles.sectionIconBadge, { backgroundColor: `${theme.primary}20` }]}>
                        <Sliders size={16} color={theme.primary} />
                      </View>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        Step-by-Step Pin & Seat Setup
                      </Text>
                    </View>
                    <Text style={[styles.setupIntro, { color: theme.subtext }]}>
                      Proper machine adjustment ensures optimal resistance curve alignment and prevents joint strain.
                    </Text>

                    <View style={{ gap: 10, marginTop: 8 }}>
                      {currentDisplayItem.setupGuide.map((step, idx) => (
                        <View key={idx} style={styles.setupStepRow}>
                          <View style={[styles.stepNumberBadge, { backgroundColor: theme.primary }]}>
                            <Text style={[styles.stepNumberText, { color: theme.primaryText }]}>
                              {idx + 1}
                            </Text>
                          </View>
                          <Text style={[styles.stepText, { color: theme.text }]}>{step}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={[styles.safetyCard, { backgroundColor: '#FF9F0A15', borderColor: '#FF9F0A35' }]}>
                    <Shield size={18} color="#FF9F0A" style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.safetyTitle, { color: '#FF9F0A' }]}>SAFETY CATCH ENGAGEMENT</Text>
                      <Text style={[styles.safetyText, { color: theme.text }]}>
                        {currentDisplayItem.safetyTip}
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {/* TAB 3: VIDEO GUIDE & HOW TO USE */}
              {activeTab === 'VIDEO' && (
                <View style={{ gap: 12 }}>
                  {/* EMBEDDED YOUTUBE PLAYER CARD */}
                  <View
                    style={[
                      styles.sectionCard,
                      { backgroundColor: theme.cardElevated, borderColor: '#FF000045', padding: 0, overflow: 'hidden' },
                    ]}
                  >
                    {/* VIDEO TITLE BAR */}
                    <View style={styles.videoPlayerHeader}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                        <View style={[styles.youtubeIconBadge, { backgroundColor: '#FF0000' }]}>
                          <Play size={12} color="#FFFFFF" fill="#FFFFFF" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.videoTitleText, { color: theme.text }]} numberOfLines={1}>
                            {currentDisplayItem.name} Form Guide
                          </Text>
                          <Text style={[styles.videoSubText, { color: theme.subtext }]}>
                            Official Biomechanical YouTube Tutorial
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleOpenYouTubeDirect(currentDisplayItem.youtubeVideoId)}
                        style={[styles.openDirectBtn, { backgroundColor: '#FF000020', borderColor: '#FF000045' }]}
                        activeOpacity={0.8}
                      >
                        <ExternalLink size={12} color="#FF453A" />
                        <Text style={[styles.openDirectText, { color: '#FF453A' }]}>Open App</Text>
                      </TouchableOpacity>
                    </View>

                    {/* YOUTUBE EMBED CONTAINER */}
                    <YouTubeEmbedPlayer
                      videoId={currentDisplayItem.youtubeVideoId}
                      height={215}
                      theme={theme}
                      title={currentDisplayItem.name}
                      onOpenDirect={() => handleOpenYouTubeDirect(currentDisplayItem.youtubeVideoId)}
                    />

                    {/* VIDEO ACTIONS BAR */}
                    <View style={[styles.videoControlsBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' }} />
                        <Text style={[styles.videoSubText, { color: theme.subtext, marginTop: 0 }]}>
                          HD Video Tutorial Ready
                        </Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => handleOpenYouTubeDirect(currentDisplayItem.youtubeVideoId)}
                        style={[styles.openYtLinkBtn, { backgroundColor: '#FF000020', borderColor: '#FF000055' }]}
                        activeOpacity={0.8}
                      >
                        <ExternalLink size={12} color="#FF453A" />
                        <Text style={[styles.openYtLinkText, { color: '#FF453A', fontWeight: '800' }]}>
                          Watch on YouTube App
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* ESSENTIAL VIDEO COACHING POINTS */}
                  <View style={[styles.sectionCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={styles.sectionHeaderRow}>
                      <View style={[styles.sectionIconBadge, { backgroundColor: `${theme.primary}20` }]}>
                        <Target size={16} color={theme.primary} />
                      </View>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>
                        3 Critical Video Form Checkpoints
                      </Text>
                    </View>

                    <View style={{ gap: 10, marginTop: 4 }}>
                      <View style={styles.checkpointRow}>
                        <View style={[styles.stepNumberBadge, { backgroundColor: theme.primary }]}>
                          <Text style={[styles.stepNumberText, { color: theme.primaryText }]}>1</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.videoPointHeading, { color: theme.text }]}>Joint Axis Alignment</Text>
                          <Text style={[styles.cueText, { color: theme.subtext }]}>
                            Always line up your body's joint rotational axis (knees or shoulders) with the machine's red/yellow rotational pivot point.
                          </Text>
                        </View>
                      </View>

                      <View style={styles.checkpointRow}>
                        <View style={[styles.stepNumberBadge, { backgroundColor: '#34C759' }]}>
                          <Text style={[styles.stepNumberText, { color: '#000000' }]}>2</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.videoPointHeading, { color: theme.text }]}>Safe Pin Engagement</Text>
                          <Text style={[styles.cueText, { color: theme.subtext }]}>
                            Ensure the selector weight pin is fully clicked horizontally into the center of the stack before lifting.
                          </Text>
                        </View>
                      </View>

                      <View style={styles.checkpointRow}>
                        <View style={[styles.stepNumberBadge, { backgroundColor: '#00F0FF' }]}>
                          <Text style={[styles.stepNumberText, { color: '#000000' }]}>3</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.videoPointHeading, { color: theme.text }]}>Continuous Hypertrophy Tension</Text>
                          <Text style={[styles.cueText, { color: theme.subtext }]}>
                            Do not let weight plates slam down at the bottom. Stop 1 inch shy of the stack to keep continuous mechanical tension.
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              )}

              {/* TAB 4: RECOMMENDED EXERCISES */}
              {activeTab === 'EXERCISES' && (
                <View style={{ gap: 12 }}>
                  <Text style={[styles.sectionIntroText, { color: theme.subtext }]}>
                    Select any exercise to immediately load it into your workout tracker:
                  </Text>

                  {currentDisplayItem.recommendedExercises.map((ex, idx) => (
                    <View
                      key={idx}
                      style={[styles.exerciseCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                    >
                      <View style={styles.exerciseCardHeader}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={[styles.exerciseName, { color: theme.text }]}>{ex.name}</Text>
                          <View style={styles.exerciseMetaRow}>
                            <View style={[styles.repPill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                              <Text style={[styles.repPillText, { color: theme.primary }]}>
                                {ex.targetSets} Sets • {ex.targetReps} Reps
                              </Text>
                            </View>
                            <View style={[styles.musclePill, { backgroundColor: theme.card, borderColor: theme.border }]}>
                              <Text style={[styles.musclePillText, { color: theme.subtext }]}>
                                {ex.primaryMuscle}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <TouchableOpacity
                          onPress={() =>
                            handleStartExercisePress(
                              ex.name,
                              ex.primaryMuscle,
                              `Perform on ${currentDisplayItem.name}. ${currentDisplayItem.executionCues[0] || ''}`
                            )
                          }
                          style={[styles.startExBtn, { backgroundColor: theme.primary }]}
                        >
                          <Play size={13} color={theme.primaryText} fill={theme.primaryText} />
                          <Text style={[styles.startExBtnText, { color: theme.primaryText }]}>Train</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          )}

          {/* BOTTOM ACTIONS BAR */}
          <View style={[styles.bottomBar, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* RETAKE / SCAN ANOTHER BUTTON */}
            <TouchableOpacity
              onPress={() => {
                setIsPlayingVideo(false);
                onRetake('camera');
              }}
              style={[styles.retakeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
            >
              <Camera size={16} color={theme.text} />
              <Text style={[styles.retakeBtnText, { color: theme.text }]}>Snap New</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setIsPlayingVideo(false);
                onRetake('library');
              }}
              style={[styles.retakeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
            >
              <RotateCcw size={16} color={theme.text} />
              <Text style={[styles.retakeBtnText, { color: theme.text }]}>Gallery</Text>
            </TouchableOpacity>

            {/* PRIMARY TRAIN BUTTON */}
            <TouchableOpacity
              onPress={() => {
                const firstEx = currentDisplayItem.recommendedExercises[0];
                const exName = firstEx ? firstEx.name : currentDisplayItem.name;
                const muscle = firstEx ? firstEx.primaryMuscle : currentDisplayItem.primaryMuscles[0] || 'Full Body';
                handleStartExercisePress(
                  exName,
                  muscle,
                  `Perform on ${currentDisplayItem.name}. ${currentDisplayItem.executionCues[0] || ''}`
                );
              }}
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
            >
              <Play size={15} color={theme.primaryText} fill={theme.primaryText} />
              <Text style={[styles.primaryActionText, { color: theme.primaryText }]}>
                Start Training
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    width: '100%',
    maxHeight: '93%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 16,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 12,
    marginTop: 1,
  },
  aiPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  aiPillText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  chipBarLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 6,
  },
  chipBarScroll: {
    gap: 6,
  },
  machineChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  machineChipText: {
    fontSize: 12,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    minHeight: 340,
  },
  scanFrame: {
    width: width - 48,
    height: 220,
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#121212',
  },
  scanLaser: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  reticleCornerTL: {
    position: 'absolute',
    top: 10,
    left: 10,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00F0FF',
  },
  reticleCornerTR: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00F0FF',
  },
  reticleCornerBL: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: '#00F0FF',
  },
  reticleCornerBR: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: '#00F0FF',
  },
  loadingInfoBox: {
    alignItems: 'center',
    marginTop: 18,
    gap: 6,
  },
  loadingTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  loadingMessage: {
    fontSize: 13,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
    gap: 12,
  },
  heroCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  heroImageWrapper: {
    width: '100%',
    height: 180,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlayBadgeRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryHeaderOnly: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 0,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sourceBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  heroInfoContent: {
    padding: 14,
  },
  equipmentTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
    marginBottom: 10,
  },
  muscleRow: {
    gap: 10,
  },
  muscleSection: {},
  muscleSectionLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  muscleChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  primaryMusclePill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  primaryMuscleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryMusclePill: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryMuscleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 3,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tabButtonActive: {},
  tabText: {
    fontSize: 11,
  },
  videoBannerCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  youtubeIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  hdBadge: {
    backgroundColor: '#FF0000',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  hdBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  videoBannerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 10,
  },
  openDirectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  openDirectText: {
    fontSize: 10,
    fontWeight: '800',
  },
  videoTitleText: {
    fontSize: 14,
    fontWeight: '800',
  },
  videoSubText: {
    fontSize: 11,
    marginTop: 1,
  },
  youtubeContainer: {
    width: '100%',
    backgroundColor: '#000000',
  },
  videoControlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  playToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  playToggleText: {
    fontSize: 12,
    fontWeight: '800',
  },
  openYtLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  openYtLinkText: {
    fontSize: 11,
    fontWeight: '700',
  },
  videoErrorBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 10,
    minHeight: 200,
  },
  videoErrorTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  videoErrorSub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  watchOnYtBigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 6,
  },
  watchOnYtBigBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  videoQualityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  videoQualityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  checkpointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  videoPointHeading: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  purposeText: {
    fontSize: 13,
    lineHeight: 19,
  },
  setupIntro: {
    fontSize: 12,
    lineHeight: 17,
  },
  setupStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  cueRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  cueDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
  },
  cueText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  safetyTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  safetyText: {
    fontSize: 12,
    lineHeight: 17,
  },
  sectionIntroText: {
    fontSize: 12,
    marginBottom: 2,
  },
  exerciseCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
  },
  exerciseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  exerciseName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 6,
  },
  exerciseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  repPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  repPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  musclePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  musclePillText: {
    fontSize: 11,
    fontWeight: '500',
  },
  startExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  startExBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  retakeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  retakeBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 12,
  },
  primaryActionText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
