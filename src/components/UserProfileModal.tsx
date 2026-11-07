import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Image,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  X,
  Target,
  Flame,
  Dumbbell,
  Scale,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Palette,
  Key,
  Camera,
  Trash2,
  Image as ImageIcon,
  Clock,
  Droplets,
  Moon,
  Zap,
  Award,
  Activity,
  HeartPulse,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { ThemePalette, ThemeName, THEMES } from '../theme/ThemeContext';
import {
  UserProfile,
  getUserProfile,
  saveUserProfile,
  calculateAthleteMetrics,
  AthleteCalculatedMetrics,
} from '../db/database';

interface UserProfileModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onProfileUpdated: (updated: UserProfile) => void;
  onThemeChanged: (mode: ThemeName) => void;
  onReplayOnboarding?: () => void;
  onOpenPermissions?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type ProfileTab = 'BIO' | 'GOALS' | 'TARGETS' | 'PREFS';

const GOAL_OPTIONS = [
  'Hypertrophy & Muscle Building',
  'Strength & Powerlifting',
  'Fat Loss & Conditioning',
  'Body Recomposition',
  'Longevity & General Fitness',
];

const EXPERIENCE_OPTIONS = [
  { id: 'Beginner', label: 'Beginner (<1 yr)' },
  { id: 'Intermediate', label: 'Intermediate (1-3 yrs)' },
  { id: 'Advanced', label: 'Advanced (3-5 yrs)' },
  { id: 'Elite / Pro', label: 'Elite / Pro (5+ yrs)' },
];

const SPLIT_OPTIONS = [
  'Push / Pull / Legs (PPL)',
  'Upper / Lower',
  'Arnold Split (Chest/Back, Arms, Legs)',
  'Bro Split (Single Muscle/Day)',
  'Full Body (3x/week)',
];

const EQUIPMENT_OPTIONS = [
  'Commercial Gym',
  'Home Gym (Barbell + DBs)',
  'Dumbbells Only',
  'Bodyweight / Calisthenics',
];

const DURATION_OPTIONS = [30, 45, 60, 75, 90];
const REST_OPTIONS = [30, 60, 90, 120, 180];
const WEEKLY_DAYS_OPTIONS = [3, 4, 5, 6, 7];

const AI_PERSONA_OPTIONS = [
  { id: 'Evidence-Based Sports Scientist', desc: 'Hypertrophy biomechanics, RPE & optimal stimulus' },
  { id: 'Tough Love Drill Sergeant', desc: 'High discipline, zero excuses, uncompromising grit' },
  { id: 'Mindset & Longevity Mentor', desc: 'Sustainable habits, long-term joint health & recovery' },
];

const AVATAR_COLORS = ['#30D158', '#00F0FF', '#FF2A54', '#CCFF00', '#FF9F0A', '#A855F7', '#3B82F6'];

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  visible,
  theme,
  onClose,
  onProfileUpdated,
  onThemeChanged,
  onReplayOnboarding,
  onOpenPermissions,
}) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('BIO');

  // Bio & Identity
  const [name, setName] = useState<string>('Alex Carter');
  const [nickname, setNickname] = useState<string>('Apex Lifter');
  const [gender, setGender] = useState<string>('Male');
  const [age, setAge] = useState<string>('26');
  const [weightKg, setWeightKg] = useState<string>('75');
  const [heightCm, setHeightCm] = useState<string>('178');
  const [bodyFatPct, setBodyFatPct] = useState<string>('15');
  const [weightUnit, setWeightUnit] = useState<string>('KG');
  const [heightUnit, setHeightUnit] = useState<string>('CM');
  const [avatarColor, setAvatarColor] = useState<string>('#30D158');
  const [imageUri, setImageUri] = useState<string | null>(null);

  // Training & Goals
  const [selectedGoal, setSelectedGoal] = useState<string>('Hypertrophy & Muscle Building');
  const [selectedExp, setSelectedExp] = useState<string>('Intermediate');
  const [weeklyDays, setWeeklyDays] = useState<number>(5);
  const [preferredSplit, setPreferredSplit] = useState<string>('Push / Pull / Legs (PPL)');
  const [availableEquipment, setAvailableEquipment] = useState<string>('Commercial Gym');
  const [workoutDuration, setWorkoutDuration] = useState<number>(60);

  // Daily Targets
  const [targetVolume, setTargetVolume] = useState<string>('5000');
  const [targetSets, setTargetSets] = useState<string>('20');
  const [targetCalories, setTargetCalories] = useState<string>('2400');
  const [targetProtein, setTargetProtein] = useState<string>('160');
  const [targetCarbs, setTargetCarbs] = useState<string>('250');
  const [targetFat, setTargetFat] = useState<string>('70');
  const [targetWater, setTargetWater] = useState<string>('3000');
  const [targetSleep, setTargetSleep] = useState<string>('8.0');

  // Preferences & AI
  const [defaultRest, setDefaultRest] = useState<number>(90);
  const [autoRestTimer, setAutoRestTimer] = useState<boolean>(true);
  const [hapticFeedback, setHapticFeedback] = useState<boolean>(true);
  const [soundAlerts, setSoundAlerts] = useState<boolean>(true);
  const [barWeight, setBarWeight] = useState<string>('20');
  const [aiCoachPersona, setAiCoachPersona] = useState<string>('Evidence-Based Sports Scientist');
  const [geminiKey, setGeminiKey] = useState<string>('');
  const [showAdvancedKey, setShowAdvancedKey] = useState<boolean>(false);
  const [showPhotoModal, setShowPhotoModal] = useState<boolean>(false);
  const [isThemeAccordionOpen, setIsThemeAccordionOpen] = useState<boolean>(false);

  useEffect(() => {
    if (visible) {
      const p = getUserProfile();
      setName(p.userName || 'Alex Carter');
      setNickname(p.athleteNickname || 'Apex Lifter');
      setGender(p.gender || 'Male');
      setAge(String(p.ageYears || 26));
      setWeightKg(String(p.bodyWeightKg || 75));
      setHeightCm(String(p.heightCm || 178));
      setBodyFatPct(String(p.bodyFatPct || 15));
      setWeightUnit(p.weightUnit || 'KG');
      setHeightUnit(p.heightUnit || 'CM');
      setAvatarColor(p.avatarColor || '#30D158');
      setImageUri(p.profileImageUri || null);

      setSelectedGoal(p.fitnessGoal || 'Hypertrophy & Muscle Building');
      setSelectedExp(p.experienceLevel || 'Intermediate');
      setWeeklyDays(p.weeklyWorkoutDaysTarget || 5);
      setPreferredSplit(p.preferredSplit || 'Push / Pull / Legs (PPL)');
      setAvailableEquipment(p.availableEquipment || 'Commercial Gym');
      setWorkoutDuration(p.targetWorkoutDurationMin || 60);

      setTargetVolume(String(p.targetVolumeKg || 5000));
      setTargetSets(String(p.targetSets || 20));
      setTargetCalories(String(p.targetCalories || 2400));
      setTargetProtein(String(p.targetProtein || 160));
      setTargetCarbs(String(p.targetCarbs || 250));
      setTargetFat(String(p.targetFat || 70));
      setTargetWater(String(p.targetWaterMl || 3000));
      setTargetSleep(String(p.targetSleepHours || 8.0));

      setDefaultRest(p.defaultRestSeconds || 90);
      setAutoRestTimer(p.autoRestTimer !== false);
      setHapticFeedback(p.hapticFeedback !== false);
      setSoundAlerts(p.soundAlerts !== false);
      setBarWeight(String(p.barWeightKg || 20));
      setAiCoachPersona(p.aiCoachPersona || 'Evidence-Based Sports Scientist');
      setGeminiKey(p.geminiApiKey || '');
    }
  }, [visible]);

  // Real-time science metrics based on athlete biometrics
  const calculatedMetrics: AthleteCalculatedMetrics = useMemo(() => {
    return calculateAthleteMetrics({
      bodyWeightKg: parseFloat(weightKg) || 75,
      heightCm: parseFloat(heightCm) || 178,
      ageYears: parseInt(age, 10) || 26,
      gender,
      fitnessGoal: selectedGoal,
      experienceLevel: selectedExp,
      weeklyWorkoutDaysTarget: weeklyDays,
    });
  }, [weightKg, heightCm, age, gender, selectedGoal, selectedExp, weeklyDays]);

  const handleApplyScienceTargets = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTargetCalories(String(calculatedMetrics.suggestedCalories));
    setTargetProtein(String(calculatedMetrics.suggestedProtein));
    setTargetCarbs(String(calculatedMetrics.suggestedCarbs));
    setTargetFat(String(calculatedMetrics.suggestedFat));
    setTargetVolume(String(calculatedMetrics.suggestedVolumeKg));
    setTargetSets(String(calculatedMetrics.suggestedSets));
    setTargetWater(String(calculatedMetrics.suggestedWaterMl));
  };

  const handlePickFromLibrary = async () => {
    setShowPhotoModal(false);
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets[0].uri) {
        setImageUri(res.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
  };

  const handleTakePhoto = async () => {
    setShowPhotoModal(false);
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      const res = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (!res.canceled && res.assets && res.assets[0].uri) {
        setImageUri(res.assets[0].uri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {}
  };

  const handleRemovePhoto = () => {
    setShowPhotoModal(false);
    setImageUri(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSave = () => {
    const updated: Partial<UserProfile> = {
      userName: name.trim() || 'Alex Carter',
      athleteNickname: nickname.trim() || 'Apex Lifter',
      gender,
      ageYears: Math.max(12, Math.min(100, parseInt(age, 10) || 26)),
      bodyWeightKg: Math.max(30, Math.min(300, parseFloat(weightKg) || 75.0)),
      heightCm: Math.max(100, Math.min(250, parseFloat(heightCm) || 178.0)),
      bodyFatPct: Math.max(3, Math.min(60, parseFloat(bodyFatPct) || 15.0)),
      weightUnit,
      heightUnit,
      fitnessGoal: selectedGoal,
      experienceLevel: selectedExp,
      weeklyWorkoutDaysTarget: weeklyDays,
      preferredSplit,
      availableEquipment,
      targetWorkoutDurationMin: workoutDuration,
      targetVolumeKg: Math.max(500, parseInt(targetVolume, 10) || 5000),
      targetSets: Math.max(1, parseInt(targetSets, 10) || 20),
      targetCalories: Math.max(500, parseInt(targetCalories, 10) || 2400),
      targetProtein: Math.max(20, parseInt(targetProtein, 10) || 160),
      targetCarbs: Math.max(20, parseInt(targetCarbs, 10) || 250),
      targetFat: Math.max(10, parseInt(targetFat, 10) || 70),
      targetWaterMl: Math.max(500, parseInt(targetWater, 10) || 3000),
      targetSleepHours: Math.max(4, Math.min(14, parseFloat(targetSleep) || 8.0)),
      defaultRestSeconds: defaultRest,
      autoRestTimer,
      soundAlerts,
      hapticFeedback,
      barWeightKg: parseFloat(barWeight) || 20,
      aiCoachPersona,
      geminiApiKey: geminiKey.trim(),
      avatarColor,
      profileImageUri: imageUri,
    };

    saveUserProfile(updated);
    const full = getUserProfile();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onProfileUpdated(full);
    onClose();
  };

  const getInitials = (n: string) => {
    if (!n.trim()) return 'AC';
    const parts = n.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
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
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.profileIconBadge, { backgroundColor: `${theme.primary}20` }]}>
                <Award size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                  Athlete Profile & Goals
                </Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]} numberOfLines={1}>
                  {calculatedMetrics.tdee} kcal TDEE • {calculatedMetrics.bmi} BMI ({calculatedMetrics.bmiCategory})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          {/* 4 SEGMENT TABS */}
          <View style={[styles.segmentContainer, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
            <TouchableOpacity
              onPress={() => {
                setActiveTab('BIO');
                Haptics.selectionAsync();
              }}
              style={[
                styles.segmentTab,
                activeTab === 'BIO' && { backgroundColor: theme.primary },
              ]}
            >
              <User size={13} color={activeTab === 'BIO' ? theme.primaryText : theme.subtext} />
              <Text
                style={[
                  styles.segmentTabText,
                  { color: activeTab === 'BIO' ? theme.primaryText : theme.subtext },
                ]}
              >
                Bio
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('GOALS');
                Haptics.selectionAsync();
              }}
              style={[
                styles.segmentTab,
                activeTab === 'GOALS' && { backgroundColor: theme.primary },
              ]}
            >
              <Dumbbell size={13} color={activeTab === 'GOALS' ? theme.primaryText : theme.subtext} />
              <Text
                style={[
                  styles.segmentTabText,
                  { color: activeTab === 'GOALS' ? theme.primaryText : theme.subtext },
                ]}
              >
                Goals
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('TARGETS');
                Haptics.selectionAsync();
              }}
              style={[
                styles.segmentTab,
                activeTab === 'TARGETS' && { backgroundColor: theme.primary },
              ]}
            >
              <Target size={13} color={activeTab === 'TARGETS' ? theme.primaryText : theme.subtext} />
              <Text
                style={[
                  styles.segmentTabText,
                  { color: activeTab === 'TARGETS' ? theme.primaryText : theme.subtext },
                ]}
              >
                Targets
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setActiveTab('PREFS');
                Haptics.selectionAsync();
              }}
              style={[
                styles.segmentTab,
                activeTab === 'PREFS' && { backgroundColor: theme.primary },
              ]}
            >
              <Sparkles size={13} color={activeTab === 'PREFS' ? theme.primaryText : theme.subtext} />
              <Text
                style={[
                  styles.segmentTabText,
                  { color: activeTab === 'PREFS' ? theme.primaryText : theme.subtext },
                ]}
              >
                Preferences
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* ================= TAB 1: BIO & IDENTITY ================= */}
            {activeTab === 'BIO' && (
              <View style={{ gap: 14, paddingTop: 4 }}>
                {/* AVATAR & NAME CARD */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPhotoModal(true);
                      Haptics.selectionAsync();
                    }}
                    style={[styles.bigAvatar, { backgroundColor: avatarColor }]}
                  >
                    {imageUri ? (
                      <Image source={{ uri: imageUri }} style={styles.avatarImage} />
                    ) : (
                      <Text style={styles.avatarInitialsText}>{getInitials(name)}</Text>
                    )}
                    <View style={[styles.cameraBadge, { backgroundColor: theme.primary }]}>
                      <Camera size={11} color={theme.primaryText} />
                    </View>
                  </TouchableOpacity>

                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={[styles.fieldLabel, { color: theme.subtext }]}>ATHLETE FULL NAME</Text>
                    <TextInput
                      value={name}
                      onChangeText={setName}
                      placeholder="Alex Carter"
                      placeholderTextColor={theme.subtext}
                      style={[styles.nameInput, { color: theme.text, borderBottomColor: theme.border }]}
                    />

                    <Text style={[styles.fieldLabel, { color: theme.subtext, marginTop: 10 }]}>ATHLETE NICKNAME / TITLE</Text>
                    <TextInput
                      value={nickname}
                      onChangeText={setNickname}
                      placeholder="Apex Lifter"
                      placeholderTextColor={theme.subtext}
                      style={[styles.nameInput, { color: theme.text, borderBottomColor: theme.border }]}
                    />
                  </View>
                </View>

                {/* AVATAR COLOR PALETTE */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext }]}>AVATAR ACCENT COLOR</Text>
                  <View style={styles.colorsRow}>
                    {AVATAR_COLORS.map((c) => (
                      <TouchableOpacity
                        key={c}
                        onPress={() => {
                          setAvatarColor(c);
                          Haptics.selectionAsync();
                        }}
                        style={[
                          styles.colorDot,
                          { backgroundColor: c },
                          avatarColor === c && { borderWidth: 3, borderColor: '#FFFFFF', transform: [{ scale: 1.1 }] },
                        ]}
                      />
                    ))}
                  </View>
                </View>

                {/* GENDER & AGE */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.cardBox, { flex: 1.4, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.fieldLabel, { color: theme.subtext }]}>BIOLOGICAL SEX</Text>
                    <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
                      {['Male', 'Female', 'Other'].map((g) => {
                        const isSel = gender === g;
                        return (
                          <TouchableOpacity
                            key={g}
                            onPress={() => {
                              setGender(g);
                              Haptics.selectionAsync();
                            }}
                            style={[
                              styles.miniChip,
                              {
                                backgroundColor: isSel ? theme.primary : theme.card,
                                borderColor: isSel ? theme.primary : theme.border,
                              },
                            ]}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: '700',
                                color: isSel ? theme.primaryText : theme.text,
                              }}
                            >
                              {g}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={[styles.cardBox, { flex: 0.9, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.fieldLabel, { color: theme.subtext }]}>AGE</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                      <TextInput
                        value={age}
                        onChangeText={setAge}
                        keyboardType="numeric"
                        style={[styles.bigStatInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>YRS</Text>
                    </View>
                  </View>
                </View>

                {/* WEIGHT & HEIGHT */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Weight */}
                  <View style={[styles.cardBox, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.fieldLabel, { color: theme.subtext }]}>BODY WEIGHT</Text>
                      <TouchableOpacity
                        onPress={() => {
                          const next = weightUnit === 'KG' ? 'LBS' : 'KG';
                          setWeightUnit(next);
                          Haptics.selectionAsync();
                        }}
                        style={[styles.unitBadge, { borderColor: theme.border, backgroundColor: theme.card }]}
                      >
                        <Text style={[styles.unitBadgeText, { color: theme.primary }]}>{weightUnit}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={weightKg}
                        onChangeText={setWeightKg}
                        keyboardType="numeric"
                        style={[styles.bigStatInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>{weightUnit}</Text>
                    </View>
                  </View>

                  {/* Height */}
                  <View style={[styles.cardBox, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.fieldLabel, { color: theme.subtext }]}>HEIGHT</Text>
                      <TouchableOpacity
                        onPress={() => {
                          const next = heightUnit === 'CM' ? 'FT' : 'CM';
                          setHeightUnit(next);
                          Haptics.selectionAsync();
                        }}
                        style={[styles.unitBadge, { borderColor: theme.border, backgroundColor: theme.card }]}
                      >
                        <Text style={[styles.unitBadgeText, { color: theme.primary }]}>{heightUnit}</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={heightCm}
                        onChangeText={setHeightCm}
                        keyboardType="numeric"
                        style={[styles.bigStatInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>{heightUnit}</Text>
                    </View>
                  </View>
                </View>

                {/* BODY FAT & LIVE BMI CARD */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={[styles.fieldLabel, { color: theme.subtext }]}>ESTIMATED BODY FAT (OPTIONAL)</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                        <TextInput
                          value={bodyFatPct}
                          onChangeText={setBodyFatPct}
                          keyboardType="numeric"
                          placeholder="15"
                          placeholderTextColor={theme.subtext}
                          style={[styles.bigStatInput, { color: theme.text }]}
                        />
                        <Text style={[styles.statUnitText, { color: theme.subtext }]}>%</Text>
                      </View>
                    </View>

                    <View style={[styles.bmiPillBox, { backgroundColor: `${theme.primary}15`, borderColor: theme.primary }]}>
                      <Text style={[styles.bmiPillLabel, { color: theme.subtext }]}>COMPOSITION</Text>
                      <Text style={[styles.bmiPillValue, { color: theme.primary }]}>
                        {calculatedMetrics.bmi} BMI
                      </Text>
                      <Text style={[styles.bmiPillSub, { color: theme.text }]}>
                        {calculatedMetrics.bmiCategory}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ================= TAB 2: GOALS & SPLIT ================= */}
            {activeTab === 'GOALS' && (
              <View style={{ gap: 14, paddingTop: 4 }}>
                {/* PRIMARY FITNESS GOAL */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 8 }]}>PRIMARY FITNESS GOAL</Text>
                  <View style={{ gap: 6 }}>
                    {GOAL_OPTIONS.map((g) => {
                      const isSel = selectedGoal === g;
                      return (
                        <TouchableOpacity
                          key={g}
                          onPress={() => {
                            setSelectedGoal(g);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.radioRow,
                            {
                              backgroundColor: isSel ? `${theme.primary}20` : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                            <Flame size={15} color={isSel ? theme.primary : theme.subtext} />
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: isSel ? '800' : '600',
                                color: isSel ? theme.primary : theme.text,
                              }}
                            >
                              {g}
                            </Text>
                          </View>
                          {isSel && <Check size={16} color={theme.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* EXPERIENCE LEVEL */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 8 }]}>TRAINING EXPERIENCE</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {EXPERIENCE_OPTIONS.map((e) => {
                      const isSel = selectedExp === e.id;
                      return (
                        <TouchableOpacity
                          key={e.id}
                          onPress={() => {
                            setSelectedExp(e.id);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.chipBtn,
                            {
                              backgroundColor: isSel ? theme.primary : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isSel ? '800' : '600',
                              color: isSel ? theme.primaryText : theme.text,
                            }}
                          >
                            {e.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* WEEKLY WORKOUT DAYS TARGET */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.fieldLabel, { color: theme.subtext }]}>WEEKLY WORKOUT TARGET</Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.primary }}>
                      {weeklyDays} Days / Week
                    </Text>
                  </View>
                  <Text style={[styles.fieldHint, { color: theme.subtext, marginTop: 2, marginBottom: 8 }]}>
                    Powers your Weekly Consistency Ring & streak tracker
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {WEEKLY_DAYS_OPTIONS.map((days) => {
                      const isSel = weeklyDays === days;
                      return (
                        <TouchableOpacity
                          key={days}
                          onPress={() => {
                            setWeeklyDays(days);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.miniChip,
                            {
                              flex: 1,
                              backgroundColor: isSel ? theme.primary : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '800',
                              color: isSel ? theme.primaryText : theme.text,
                            }}
                          >
                            {days}d
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* PREFERRED TRAINING SPLIT */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 8 }]}>PREFERRED TRAINING SPLIT</Text>
                  <View style={{ gap: 6 }}>
                    {SPLIT_OPTIONS.map((s) => {
                      const isSel = preferredSplit === s;
                      return (
                        <TouchableOpacity
                          key={s}
                          onPress={() => {
                            setPreferredSplit(s);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.radioRow,
                            {
                              backgroundColor: isSel ? `${theme.primary}20` : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isSel ? '800' : '600',
                              color: isSel ? theme.primary : theme.text,
                            }}
                          >
                            {s}
                          </Text>
                          {isSel && <Check size={14} color={theme.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* AVAILABLE EQUIPMENT */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 8 }]}>AVAILABLE GYM EQUIPMENT</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {EQUIPMENT_OPTIONS.map((eq) => {
                      const isSel = availableEquipment === eq;
                      return (
                        <TouchableOpacity
                          key={eq}
                          onPress={() => {
                            setAvailableEquipment(eq);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.chipBtn,
                            {
                              backgroundColor: isSel ? theme.primary : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: isSel ? '800' : '600',
                              color: isSel ? theme.primaryText : theme.text,
                            }}
                          >
                            {eq}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* TARGET WORKOUT DURATION */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={[styles.fieldLabel, { color: theme.subtext }]}>SESSION DURATION GOAL</Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.primary }}>
                      {workoutDuration} Minutes
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {DURATION_OPTIONS.map((dur) => {
                      const isSel = workoutDuration === dur;
                      return (
                        <TouchableOpacity
                          key={dur}
                          onPress={() => {
                            setWorkoutDuration(dur);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.miniChip,
                            {
                              flex: 1,
                              backgroundColor: isSel ? theme.primary : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '800',
                              color: isSel ? theme.primaryText : theme.text,
                            }}
                          >
                            {dur}m
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            )}

            {/* ================= TAB 3: SMART TARGETS & SCIENCE ================= */}
            {activeTab === 'TARGETS' && (
              <View style={{ gap: 14, paddingTop: 4 }}>
                {/* SMART SCIENCE AUTO-CALCULATE CARD */}
                <View style={[styles.scienceCard, { backgroundColor: `${theme.primary}12`, borderColor: theme.primary }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Zap size={18} color={theme.primary} />
                    <Text style={[styles.scienceCardTitle, { color: theme.text }]}>
                      Science-Backed Smart Targets
                    </Text>
                  </View>
                  <Text style={[styles.scienceCardDesc, { color: theme.subtext }]}>
                    Calculated using Mifflin-St Jeor formula adapted for your {weightKg}kg body weight, {age}yo age, and {selectedGoal}.
                  </Text>

                  <View style={styles.metricsSummaryGrid}>
                    <View style={styles.metricSummaryItem}>
                      <Text style={[styles.metricSummaryLabel, { color: theme.subtext }]}>BMR (BASE)</Text>
                      <Text style={[styles.metricSummaryValue, { color: theme.text }]}>{calculatedMetrics.bmr} kcal</Text>
                    </View>
                    <View style={styles.metricSummaryItem}>
                      <Text style={[styles.metricSummaryLabel, { color: theme.subtext }]}>TDEE (BURN)</Text>
                      <Text style={[styles.metricSummaryValue, { color: theme.accentOrange }]}>{calculatedMetrics.tdee} kcal</Text>
                    </View>
                    <View style={styles.metricSummaryItem}>
                      <Text style={[styles.metricSummaryLabel, { color: theme.subtext }]}>TARGET KCAL</Text>
                      <Text style={[styles.metricSummaryValue, { color: theme.primary }]}>{calculatedMetrics.suggestedCalories} kcal</Text>
                    </View>
                    <View style={styles.metricSummaryItem}>
                      <Text style={[styles.metricSummaryLabel, { color: theme.subtext }]}>PROTEIN</Text>
                      <Text style={[styles.metricSummaryValue, { color: theme.accentCyan }]}>{calculatedMetrics.suggestedProtein}g</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    onPress={handleApplyScienceTargets}
                    style={[styles.applyScienceBtn, { backgroundColor: theme.primary }]}
                    activeOpacity={0.8}
                  >
                    <Zap size={15} color={theme.primaryText} />
                    <Text style={[styles.applyScienceBtnText, { color: theme.primaryText }]}>
                      Apply Recommended Science Targets
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* ACTIVITY RINGS TARGETS */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Volume Target (Move Ring) */}
                  <View style={[styles.targetCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View style={[styles.ringIndicatorDot, { backgroundColor: theme.accentRed }]} />
                      <Text style={[styles.targetRingName, { color: theme.accentRed }]}>MOVE RING</Text>
                    </View>
                    <Text style={[styles.targetDesc, { color: theme.subtext }]}>Daily Volume (KG)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={targetVolume}
                        onChangeText={setTargetVolume}
                        keyboardType="numeric"
                        style={[styles.targetInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>KG</Text>
                    </View>
                  </View>

                  {/* Sets Target (Exercise Ring) */}
                  <View style={[styles.targetCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <View style={[styles.ringIndicatorDot, { backgroundColor: theme.primary }]} />
                      <Text style={[styles.targetRingName, { color: theme.primary }]}>EXERCISE RING</Text>
                    </View>
                    <Text style={[styles.targetDesc, { color: theme.subtext }]}>Working Sets</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={targetSets}
                        onChangeText={setTargetSets}
                        keyboardType="numeric"
                        style={[styles.targetInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>SETS</Text>
                    </View>
                  </View>
                </View>

                {/* NUTRITION & ENERGY TARGETS */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.targetCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.targetRingName, { color: theme.accentOrange }]}>CALORIE GOAL</Text>
                    <Text style={[styles.targetDesc, { color: theme.subtext }]}>Daily Intake</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={targetCalories}
                        onChangeText={setTargetCalories}
                        keyboardType="numeric"
                        style={[styles.targetInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>KCAL</Text>
                    </View>
                  </View>

                  <View style={[styles.targetCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.targetRingName, { color: theme.accentCyan }]}>PROTEIN GOAL</Text>
                    <Text style={[styles.targetDesc, { color: theme.subtext }]}>Muscle Recovery</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={targetProtein}
                        onChangeText={setTargetProtein}
                        keyboardType="numeric"
                        style={[styles.targetInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>G</Text>
                    </View>
                  </View>
                </View>

                {/* CARBS & FAT TARGETS */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.targetCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.targetRingName, { color: '#FFD60A' }]}>CARBS GOAL</Text>
                    <Text style={[styles.targetDesc, { color: theme.subtext }]}>Glycogen & Energy</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={targetCarbs}
                        onChangeText={setTargetCarbs}
                        keyboardType="numeric"
                        style={[styles.targetInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>G</Text>
                    </View>
                  </View>

                  <View style={[styles.targetCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.targetRingName, { color: '#BF5AF2' }]}>FAT GOAL</Text>
                    <Text style={[styles.targetDesc, { color: theme.subtext }]}>Hormones & Joints</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={targetFat}
                        onChangeText={setTargetFat}
                        keyboardType="numeric"
                        style={[styles.targetInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>G</Text>
                    </View>
                  </View>
                </View>

                {/* HYDRATION & RECOVERY TARGETS */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.targetCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Droplets size={12} color="#00F0FF" />
                      <Text style={[styles.targetRingName, { color: '#00F0FF' }]}>HYDRATION</Text>
                    </View>
                    <Text style={[styles.targetDesc, { color: theme.subtext }]}>Daily Water</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={targetWater}
                        onChangeText={setTargetWater}
                        keyboardType="numeric"
                        style={[styles.targetInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>ML</Text>
                    </View>
                  </View>

                  <View style={[styles.targetCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Moon size={12} color="#5E5CE6" />
                      <Text style={[styles.targetRingName, { color: '#5E5CE6' }]}>SLEEP & RECOVERY</Text>
                    </View>
                    <Text style={[styles.targetDesc, { color: theme.subtext }]}>Nightly Sleep</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, marginTop: 6 }}>
                      <TextInput
                        value={targetSleep}
                        onChangeText={setTargetSleep}
                        keyboardType="numeric"
                        style={[styles.targetInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>HRS</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}

            {/* ================= TAB 4: PREFERENCES & AI COACH ================= */}
            {activeTab === 'PREFS' && (
              <View style={{ gap: 14, paddingTop: 4 }}>
                {/* REST & TIMERS */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Clock size={16} color={theme.primary} />
                    <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 0 }]}>DEFAULT REST INTERVAL</Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {REST_OPTIONS.map((sec) => {
                      const isSel = defaultRest === sec;
                      return (
                        <TouchableOpacity
                          key={sec}
                          onPress={() => {
                            setDefaultRest(sec);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.miniChip,
                            {
                              flex: 1,
                              backgroundColor: isSel ? theme.primary : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontWeight: '800',
                              color: isSel ? theme.primaryText : theme.text,
                            }}
                          >
                            {sec}s
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Olympic Bar Weight */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                    <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 0 }]}>OLYMPIC BAR WEIGHT (KG)</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4 }}>
                      <TextInput
                        value={barWeight}
                        onChangeText={setBarWeight}
                        keyboardType="numeric"
                        style={[styles.targetInput, { width: 50, textAlign: 'center', color: theme.text }]}
                      />
                      <Text style={[styles.statUnitText, { color: theme.subtext }]}>KG</Text>
                    </View>
                  </View>
                </View>

                {/* SENSORS & FEEDBACK TOGGLES */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 10 }]}>SENSORS & COACHING CUES</Text>

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={[styles.toggleTitle, { color: theme.text }]}>Auto-Start Rest Timer</Text>
                      <Text style={[styles.toggleSub, { color: theme.subtext }]}>Trigger rest stopwatch immediately upon logging a set</Text>
                    </View>
                    <Switch
                      value={autoRestTimer}
                      onValueChange={(val) => {
                        setAutoRestTimer(val);
                        Haptics.selectionAsync();
                      }}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.toggleDivider, { backgroundColor: theme.border }]} />

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={[styles.toggleTitle, { color: theme.text }]}>Haptic Sensor Feedback</Text>
                      <Text style={[styles.toggleSub, { color: theme.subtext }]}>Haptic vibrations on PR milestones & stopwatch completion</Text>
                    </View>
                    <Switch
                      value={hapticFeedback}
                      onValueChange={(val) => {
                        setHapticFeedback(val);
                        Haptics.selectionAsync();
                      }}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.toggleDivider, { backgroundColor: theme.border }]} />

                  <View style={styles.toggleRow}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={[styles.toggleTitle, { color: theme.text }]}>Audio Feedback Cues</Text>
                      <Text style={[styles.toggleSub, { color: theme.subtext }]}>Sound notifications when resting finishes</Text>
                    </View>
                    <Switch
                      value={soundAlerts}
                      onValueChange={(val) => {
                        setSoundAlerts(val);
                        Haptics.selectionAsync();
                      }}
                      trackColor={{ false: theme.border, true: theme.primary }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={[styles.toggleDivider, { backgroundColor: theme.border }]} />

                  {/* HARDWARE & SENSOR PERMISSIONS ROW */}
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      if (onOpenPermissions) onOpenPermissions();
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingVertical: 8,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, paddingRight: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: `${theme.primary}20`, alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={16} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.toggleTitle, { color: theme.text }]}>Hardware & Sensor Permissions</Text>
                        <Text style={[styles.toggleSub, { color: theme.subtext }]}>Review on-device motion, camera & IMU permissions</Text>
                      </View>
                    </View>
                    <ChevronRight size={16} color={theme.subtext} />
                  </TouchableOpacity>
                </View>

                {/* AI COACH PERSONA */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <Sparkles size={16} color={theme.primary} />
                    <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 0 }]}>AI COACH PERSONA</Text>
                  </View>
                  <View style={{ gap: 6 }}>
                    {AI_PERSONA_OPTIONS.map((item) => {
                      const isSel = aiCoachPersona === item.id;
                      return (
                        <TouchableOpacity
                          key={item.id}
                          onPress={() => {
                            setAiCoachPersona(item.id);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.radioRow,
                            {
                              backgroundColor: isSel ? `${theme.primary}20` : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: isSel ? '800' : '600',
                                color: isSel ? theme.primary : theme.text,
                              }}
                            >
                              {item.id}
                            </Text>
                            <Text style={{ fontSize: 11, color: theme.subtext, marginTop: 2 }}>
                              {item.desc}
                            </Text>
                          </View>
                          {isSel && <Check size={16} color={theme.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* THEMES & COLOR APPEARANCE (ACCORDION) */}
                <View style={[styles.accordionContainer, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <TouchableOpacity
                    onPress={() => {
                      setIsThemeAccordionOpen(!isThemeAccordionOpen);
                      Haptics.selectionAsync();
                    }}
                    activeOpacity={0.7}
                    style={styles.accordionHeaderRow}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                      <View style={[styles.accordionIconCircle, { backgroundColor: `${theme.primary}20` }]}>
                        <Palette size={16} color={theme.primary} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.accordionTitle, { color: theme.text }]}>
                          APP THEME & STYLING
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                          <View style={[styles.themeMiniDot, { backgroundColor: theme.primary }]} />
                          <Text style={[styles.accordionSub, { color: theme.subtext }]} numberOfLines={1}>
                            {theme.label} (Tap to change)
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={[styles.accordionChevronBadge, { borderColor: theme.border, backgroundColor: theme.card }]}>
                      {isThemeAccordionOpen ? (
                        <ChevronUp size={16} color={theme.text} />
                      ) : (
                        <ChevronDown size={16} color={theme.text} />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* EXPANDED THEME GRID */}
                  {isThemeAccordionOpen && (
                    <View style={styles.accordionContent}>
                      <View style={styles.themesGrid}>
                        {(Object.keys(THEMES) as ThemeName[]).map((tKey) => {
                          const item = THEMES[tKey];
                          const isSelected = theme.name === tKey;
                          return (
                            <TouchableOpacity
                              key={tKey}
                              onPress={() => {
                                onThemeChanged(tKey);
                                Haptics.selectionAsync();
                              }}
                              style={[
                                styles.themeCardItem,
                                {
                                  backgroundColor: isSelected ? `${theme.primary}15` : theme.card,
                                  borderColor: isSelected ? theme.primary : theme.border,
                                },
                              ]}
                            >
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <View style={[styles.themeColorPill, { backgroundColor: item.primary }]} />
                                <Text
                                  style={[
                                    styles.themeCardLabel,
                                    {
                                      color: isSelected ? theme.primary : theme.text,
                                      fontWeight: isSelected ? '900' : '700',
                                    },
                                  ]}
                                  numberOfLines={1}
                                >
                                  {item.label}
                                </Text>
                              </View>
                              {isSelected && <Text style={{ color: theme.primary, fontWeight: '900' }}>✓</Text>}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>

                {/* ONBOARDING & WELCOME EXPERIENCE REPLAY */}
                {onReplayOnboarding && (
                  <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Sparkles size={15} color={theme.primary} />
                      <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 0 }]}>
                        WELCOME & ONBOARDING CALIBRATION
                      </Text>
                    </View>
                    <Text style={{ fontSize: 12, color: theme.subtext, lineHeight: 17, marginBottom: 12 }}>
                      Review the 4-step athlete setup, archetype chooser, live BMI index, and scientific target preview.
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onReplayOnboarding();
                      }}
                      activeOpacity={0.8}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        paddingVertical: 12,
                        paddingHorizontal: 16,
                        borderRadius: 12,
                        backgroundColor: `${theme.primary}18`,
                        borderWidth: 1,
                        borderColor: theme.primary,
                      }}
                    >
                      <Sparkles size={15} color={theme.primary} />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: theme.primary }}>
                        Replay Welcome & Onboarding
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* GEMINI AI API KEY */}
                <View style={[styles.cardBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <TouchableOpacity
                    onPress={() => setShowAdvancedKey(!showAdvancedKey)}
                    style={styles.advancedToggleRow}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                      <Key size={14} color={theme.primary} />
                      <Text style={[styles.fieldLabel, { color: theme.text, marginBottom: 0 }]}>
                        Custom Gemini AI Key (Optional)
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primary }}>
                      {showAdvancedKey ? 'Hide' : 'Configure'}
                    </Text>
                  </TouchableOpacity>

                  {showAdvancedKey && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.fieldHint, { color: theme.subtext, marginBottom: 8 }]}>
                        Use your own Gemini key for lightning-fast AI routine generation & meal vision analysis.
                      </Text>
                      <TextInput
                        value={geminiKey}
                        onChangeText={setGeminiKey}
                        placeholder="AIzaSy..."
                        placeholderTextColor={theme.subtext}
                        secureTextEntry
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={[
                          styles.targetInput,
                          {
                            color: theme.text,
                            backgroundColor: theme.card,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                            fontSize: 12,
                          },
                        ]}
                      />
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* STICKY FOOTER SAVE BUTTON */}
          <View style={[styles.footerContainer, { borderTopColor: theme.border, backgroundColor: theme.card }]}>
            <TouchableOpacity
              onPress={handleSave}
              style={[styles.saveBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Check size={18} color={theme.primaryText} />
              <Text style={[styles.saveBtnText, { color: theme.primaryText }]}>
                Save Athlete Profile & Targets
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PHOTO PICKER MODAL */}
        <Modal visible={showPhotoModal} transparent animationType="fade">
          <View style={styles.photoModalOverlay}>
            <View style={[styles.photoModalBox, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Text style={[styles.photoModalTitle, { color: theme.text }]}>Profile Photo</Text>
                <TouchableOpacity onPress={() => setShowPhotoModal(false)} style={styles.photoCloseBtn}>
                  <X size={18} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 10 }}>
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  style={[styles.photoOptionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <Camera size={18} color={theme.primary} />
                  <Text style={[styles.photoOptionText, { color: theme.text }]}>Take Photo with Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handlePickFromLibrary}
                  style={[styles.photoOptionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                >
                  <ImageIcon size={18} color={theme.primary} />
                  <Text style={[styles.photoOptionText, { color: theme.text }]}>Choose from Photo Library</Text>
                </TouchableOpacity>

                {imageUri && (
                  <TouchableOpacity
                    onPress={handleRemovePhoto}
                    style={[styles.photoOptionBtn, { backgroundColor: `${theme.accentRed}15`, borderColor: theme.accentRed }]}
                  >
                    <Trash2 size={18} color={theme.accentRed} />
                    <Text style={[styles.photoOptionText, { color: theme.accentRed }]}>Remove Current Photo</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 18,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  profileIconBadge: {
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
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  segmentContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  segmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 9,
  },
  segmentTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  cardBox: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  bigAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarInitialsText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#000000',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 11,
  },
  nameInput: {
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  colorsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  miniChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipBtn: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStatInput: {
    fontSize: 22,
    fontWeight: '900',
    minWidth: 40,
    padding: 0,
  },
  statUnitText: {
    fontSize: 11,
    fontWeight: '700',
  },
  unitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  unitBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  bmiPillBox: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  bmiPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bmiPillValue: {
    fontSize: 14,
    fontWeight: '900',
    marginTop: 1,
  },
  bmiPillSub: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 1,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  scienceCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  scienceCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  scienceCardDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  metricsSummaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricSummaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(0,0,0,0.25)',
    padding: 8,
    borderRadius: 10,
  },
  metricSummaryLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricSummaryValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  applyScienceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
  },
  applyScienceBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  targetCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  ringIndicatorDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  targetRingName: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  targetDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  targetInput: {
    fontSize: 18,
    fontWeight: '900',
    minWidth: 40,
    padding: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  toggleTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  toggleSub: {
    fontSize: 11,
    marginTop: 2,
  },
  toggleDivider: {
    height: 1,
    marginVertical: 10,
  },
  accordionContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accordionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  accordionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  accordionSub: {
    fontSize: 11,
    fontWeight: '600',
  },
  themeMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accordionChevronBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionContent: {
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  themesGrid: {
    gap: 8,
  },
  themeCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  themeColorPill: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  themeCardLabel: {
    fontSize: 12,
  },
  advancedToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerContainer: {
    paddingTop: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  photoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  photoModalBox: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    padding: 18,
  },
  photoModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  photoCloseBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  photoOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
