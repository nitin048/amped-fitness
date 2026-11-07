import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import {
  Flame,
  Award,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  Check,
  Zap,
  Target,
  Dumbbell,
  User,
  Activity,
  Sparkles,
  Scale,
  Clock,
  Droplets,
  HeartPulse,
  Plus,
  Minus,
  CheckCircle2,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import {
  UserProfile,
  completeOnboarding,
  calculateAthleteMetrics,
  AthleteCalculatedMetrics,
} from '../db/database';
import {
  heightToCm,
  cmToDisplayHeight,
  weightToKg,
  kgToDisplayWeight,
  stepHeight,
  stepWeight,
} from '../utils/unitConversions';
import {
  sanitizeText,
  sanitizeInteger,
  sanitizeHeightInput,
  sanitizeWeightInput,
  validateAthleteName,
  validateAge,
  validateHeight,
  validateWeight,
} from '../utils/inputValidation';
import { AmpedBrandLogo } from './AmpedBrandLogo';

interface OnboardingModalProps {
  visible: boolean;
  theme: ThemePalette;
  onOnboardingComplete: (profile: UserProfile) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 4 Signature Athlete Archetypes for 1-Tap Intuitive Onboarding
interface AthleteArchetype {
  id: string;
  title: string;
  subtitle: string;
  icon: typeof Dumbbell;
  goal: string;
  split: string;
  days: number;
  exp: string;
  color: string;
  badge: string;
}

const ATHLETE_ARCHETYPES: AthleteArchetype[] = [
  {
    id: 'hypertrophy',
    title: 'Muscle & Mass',
    subtitle: 'Optimal hypertrophy & progressive volume',
    icon: Dumbbell,
    goal: 'Hypertrophy & Muscle Building',
    split: 'Push / Pull / Legs (PPL)',
    days: 5,
    exp: 'Intermediate',
    color: '#00F0FF',
    badge: 'POPULAR',
  },
  {
    id: 'strength',
    title: 'Strength & PRs',
    subtitle: 'Heavy compound loads & maximum force',
    icon: Flame,
    goal: 'Strength & Powerlifting',
    split: 'Upper / Lower',
    days: 4,
    exp: 'Intermediate',
    color: '#FF2D55',
    badge: 'POWER',
  },
  {
    id: 'shred',
    title: 'Lean Shred',
    subtitle: 'Metabolic deficit & sharp conditioning',
    icon: Zap,
    goal: 'Fat Loss & Conditioning',
    split: 'Push / Pull / Legs (PPL)',
    days: 5,
    exp: 'Intermediate',
    color: '#FF9500',
    badge: 'LEAN',
  },
  {
    id: 'athletic',
    title: 'Peak Longevity',
    subtitle: 'Full-body functional strength & mobility',
    icon: Activity,
    goal: 'Longevity & General Fitness',
    split: 'Full Body (3x/week)',
    days: 3,
    exp: 'Beginner',
    color: '#34C759',
    badge: 'SUSTAINABLE',
  },
];

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
  'Arnold Split',
  'Bro Split',
  'Full Body (3x/week)',
];

const WEEKLY_DAYS_OPTIONS = [3, 4, 5, 6, 7];

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  visible,
  theme,
  onOnboardingComplete,
}) => {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<number>(1); // 1 = Welcome, 2 = Biometrics, 3 = Goals, 4 = Review

  // Archetype selection on Step 1
  const [selectedArchetype, setSelectedArchetype] = useState<string>('hypertrophy');

  // Step 2: Biometrics
  const [name, setName] = useState<string>('Alex Carter');
  const [nickname, setNickname] = useState<string>('Apex Lifter');
  const [gender, setGender] = useState<string>('Male');
  const [age, setAge] = useState<string>('26');
  const [weightKg, setWeightKg] = useState<string>('75');
  const [heightCm, setHeightCm] = useState<string>('178');
  const [weightUnit, setWeightUnit] = useState<string>('KG');
  const [heightUnit, setHeightUnit] = useState<string>('CM');

  // Step 3: Goals
  const [selectedGoal, setSelectedGoal] = useState<string>('Hypertrophy & Muscle Building');
  const [selectedExp, setSelectedExp] = useState<string>('Intermediate');
  const [weeklyDays, setWeeklyDays] = useState<number>(5);
  const [preferredSplit, setPreferredSplit] = useState<string>('Push / Pull / Legs (PPL)');

  // Handle archetype pick
  const handleSelectArchetype = (archetype: AthleteArchetype) => {
    setSelectedArchetype(archetype.id);
    setSelectedGoal(archetype.goal);
    setPreferredSplit(archetype.split);
    setWeeklyDays(archetype.days);
    setSelectedExp(archetype.exp);
    Haptics.selectionAsync();
  };

  // Step 2 live BMI & BMR preview
  const trueWeightKg = useMemo(() => weightToKg(weightKg, weightUnit), [weightKg, weightUnit]);
  const trueHeightCm = useMemo(() => heightToCm(heightCm, heightUnit), [heightCm, heightUnit]);
  const parsedAge = parseInt(age, 10) || 26;

  const bmi = useMemo(() => {
    const hM = trueHeightCm / 100;
    if (hM <= 0) return 0;
    return +(trueWeightKg / (hM * hM)).toFixed(1);
  }, [trueWeightKg, trueHeightCm]);

  const bmiCategory = useMemo(() => {
    if (bmi < 18.5) return { label: 'Underweight', color: '#00F0FF' };
    if (bmi < 25) return { label: 'Optimal Athletic Range', color: '#34C759' };
    if (bmi < 30) return { label: 'Hypertrophy / Mass Phase', color: '#FF9500' };
    return { label: 'High Body Mass', color: '#FF2D55' };
  }, [bmi]);

  // Stepper helpers
  const adjustAge = (delta: number) => {
    const next = Math.max(14, Math.min(99, parsedAge + delta));
    setAge(String(next));
    Haptics.selectionAsync();
  };

  const adjustWeight = (delta: number) => {
    setWeightKg(stepWeight(weightKg, weightUnit, delta));
    Haptics.selectionAsync();
  };

  const adjustHeight = (delta: number) => {
    setHeightCm(stepHeight(heightCm, heightUnit, delta));
    Haptics.selectionAsync();
  };

  // Science metrics calculation
  const calculatedMetrics: AthleteCalculatedMetrics = useMemo(() => {
    return calculateAthleteMetrics({
      bodyWeightKg: trueWeightKg,
      heightCm: trueHeightCm,
      ageYears: parsedAge,
      gender,
      fitnessGoal: selectedGoal,
      experienceLevel: selectedExp,
      weeklyWorkoutDaysTarget: weeklyDays,
    });
  }, [trueWeightKg, trueHeightCm, parsedAge, gender, selectedGoal, selectedExp, weeklyDays]);

  const handleNextStep = () => {
    if (step === 2) {
      const nameVal = validateAthleteName(name);
      if (!nameVal.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Invalid Name', nameVal.error || 'Please enter a valid athlete name.');
        return;
      }
      const ageVal = validateAge(age);
      if (!ageVal.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Invalid Age', ageVal.error || 'Please enter an age between 12 and 100.');
        return;
      }
      const weightVal = validateWeight(weightKg, weightUnit);
      if (!weightVal.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Invalid Weight', weightVal.error || 'Please enter a valid weight.');
        return;
      }
      const heightVal = validateHeight(heightCm, heightUnit);
      if (!heightVal.isValid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert('Invalid Height', heightVal.error || 'Please enter a valid height.');
        return;
      }
    }
    Haptics.selectionAsync();
    setStep((prev) => Math.min(4, prev + 1));
  };

  const handlePrevStep = () => {
    Haptics.selectionAsync();
    setStep((prev) => Math.max(1, prev - 1));
  };

  const handleFinishOnboarding = () => {
    const nameVal = validateAthleteName(name);
    const validName = nameVal.isValid ? name.trim() : 'Alex Carter';

    const updatedProfile: Partial<UserProfile> = {
      userName: validName,
      athleteNickname: nickname.trim() || 'Apex Lifter',
      gender,
      ageYears: parsedAge,
      bodyWeightKg: trueWeightKg,
      heightCm: trueHeightCm,
      weightUnit,
      heightUnit,
      fitnessGoal: selectedGoal,
      experienceLevel: selectedExp,
      weeklyWorkoutDaysTarget: weeklyDays,
      preferredSplit,
      targetVolumeKg: calculatedMetrics.suggestedVolumeKg,
      targetSets: calculatedMetrics.suggestedSets,
      targetCalories: calculatedMetrics.suggestedCalories,
      targetProtein: calculatedMetrics.suggestedProtein,
      targetCarbs: calculatedMetrics.suggestedCarbs,
      targetFat: calculatedMetrics.suggestedFat,
      targetWaterMl: calculatedMetrics.suggestedWaterMl,
    };

    const finished = completeOnboarding(updatedProfile);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onOnboardingComplete(finished);
  };

  const stepTitles = [
    'Welcome',
    'Biometrics',
    'Goals & Split',
    'Calibrated OS',
  ];

  return (
    <Modal visible={visible} animationType="fade" transparent={false}>
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.bg,
            paddingTop: Math.max(34, insets.top + 10),
            paddingBottom: Math.max(16, insets.bottom + 8),
          },
        ]}
      >
        {/* TOP STEP PROGRESS BAR & LABELS */}
        <View style={styles.topProgressSection}>
          <View style={styles.topProgressRow}>
            {[1, 2, 3, 4].map((s) => {
              const isPast = step > s;
              const isCurrent = step === s;
              return (
                <View
                  key={s}
                  style={[
                    styles.stepProgressBar,
                    {
                      backgroundColor: isPast || isCurrent ? theme.primary : `${theme.primary}25`,
                    },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.stepLabelsRow}>
            <Text style={[styles.stepCurrentLabel, { color: theme.primary }]}>
              STEP {step} OF 4: {stepTitles[step - 1].toUpperCase()}
            </Text>
            {step > 1 && (
              <TouchableOpacity onPress={() => setStep(1)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.stepResetLink, { color: theme.subtext }]}>Restart</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ================= STEP 1: WELCOME SCREEN ================= */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              {/* BRAND HERO SECTION */}
              <View style={styles.brandHeroCenter}>
                <View style={[styles.versionBadge, { backgroundColor: `${theme.primary}18`, borderColor: `${theme.primary}40` }]}>
                  <Sparkles size={11} color={theme.primary} />
                  <Text style={[styles.versionBadgeText, { color: theme.primary }]}>
                    ATHLETIC OPERATING SYSTEM • V2.0
                  </Text>
                </View>

                <View style={styles.logoWrapper}>
                  <View style={[styles.logoGlowCircle, { backgroundColor: `${theme.primary}12` }]} />
                  <AmpedBrandLogo theme={theme} size={68} />
                </View>

                <Text style={[styles.welcomeHeadline, { color: theme.text }]}>
                  WELCOME TO AMPED
                </Text>
                <Text style={[styles.welcomeSubhead, { color: theme.subtext }]}>
                  Engineered for serious lifters. 100% offline, privacy-first biometric telemetry and scientific strength adaptation.
                </Text>
              </View>

              {/* ARCHETYPE SELECTOR (INTERACTIVE & INTUITIVE) */}
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionHeading, { color: theme.text }]}>
                  Choose Your Athletic Focus
                </Text>
                <Text style={[styles.sectionSubhint, { color: theme.subtext }]}>
                  Tap to pre-calibrate your program
                </Text>
              </View>

              <View style={styles.archetypeGrid}>
                {ATHLETE_ARCHETYPES.map((arch) => {
                  const isSelected = selectedArchetype === arch.id;
                  const IconComp = arch.icon;
                  return (
                    <TouchableOpacity
                      key={arch.id}
                      onPress={() => handleSelectArchetype(arch)}
                      activeOpacity={0.8}
                      style={[
                        styles.archetypeCard,
                        {
                          backgroundColor: isSelected ? `${arch.color}14` : theme.cardElevated,
                          borderColor: isSelected ? arch.color : theme.border,
                        },
                      ]}
                    >
                      <View style={styles.archetypeCardTop}>
                        <View
                          style={[
                            styles.archetypeIconBox,
                            { backgroundColor: `${arch.color}22` },
                          ]}
                        >
                          <IconComp size={18} color={arch.color} />
                        </View>
                        <View
                          style={[
                            styles.archetypeBadge,
                            {
                              backgroundColor: isSelected ? arch.color : `${theme.text}10`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.archetypeBadgeText,
                              { color: isSelected ? '#000000' : theme.subtext },
                            ]}
                          >
                            {arch.badge}
                          </Text>
                        </View>
                      </View>

                      <Text style={[styles.archetypeTitle, { color: theme.text }]}>
                        {arch.title}
                      </Text>
                      <Text style={[styles.archetypeSubtitle, { color: theme.subtext }]} numberOfLines={2}>
                        {arch.subtitle}
                      </Text>

                      <View style={styles.archetypeFooter}>
                        <Text style={[styles.archetypeMeta, { color: isSelected ? arch.color : theme.subtext }]}>
                          {arch.days}d/week • {arch.split.split(' ')[0]}
                        </Text>
                        {isSelected && (
                          <CheckCircle2 size={15} color={arch.color} />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* VALUE PILLARS STRIP */}
              <View style={[styles.pillarsStrip, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.pillarItem}>
                  <ShieldCheck size={16} color={theme.primary} />
                  <Text style={[styles.pillarText, { color: theme.text }]}>100% Offline SQLite</Text>
                </View>
                <View style={styles.pillarDivider} />
                <View style={styles.pillarItem}>
                  <Scale size={16} color="#FF9500" />
                  <Text style={[styles.pillarText, { color: theme.text }]}>Mifflin-St Jeor TDEE</Text>
                </View>
                <View style={styles.pillarDivider} />
                <View style={styles.pillarItem}>
                  <Activity size={16} color="#00F0FF" />
                  <Text style={[styles.pillarText, { color: theme.text }]}>Activity Rings</Text>
                </View>
              </View>

              {/* ACTION BUTTON */}
              <TouchableOpacity
                onPress={handleNextStep}
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
              >
                <Text style={[styles.primaryActionBtnText, { color: theme.primaryText }]}>
                  Continue to Biometrics
                </Text>
                <ChevronRight size={18} color={theme.primaryText} />
              </TouchableOpacity>
            </View>
          )}

          {/* ================= STEP 2: BIOMETRICS ================= */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeaderBox}>
                <View style={[styles.stepBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <User size={14} color={theme.primary} />
                  <Text style={[styles.stepBadgeText, { color: theme.primary }]}>BIOMETRIC CALIBRATION</Text>
                </View>
                <Text style={[styles.stepMainTitle, { color: theme.text }]}>Your Physical Profile</Text>
                <Text style={[styles.stepSubDesc, { color: theme.subtext }]}>
                  Used by our offline engine to compute your Basal Metabolic Rate (BMR) and progressive volume threshold.
                </Text>
              </View>

              {/* LIVE BODY METRIC SUMMARY PILL */}
              <View
                style={[
                  styles.liveBmiBanner,
                  { backgroundColor: `${bmiCategory.color}14`, borderColor: `${bmiCategory.color}40` },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <HeartPulse size={16} color={bmiCategory.color} />
                  <Text style={[styles.liveBmiVal, { color: bmiCategory.color }]}>
                    BMI {bmi}
                  </Text>
                  <Text style={[styles.liveBmiCategory, { color: theme.text }]}>
                    • {bmiCategory.label}
                  </Text>
                </View>
                <Text style={[styles.liveBmrSub, { color: theme.subtext }]}>
                  Estimated BMR: ~{calculatedMetrics.bmr} kcal/day
                </Text>
              </View>

              <View style={{ gap: 12, marginVertical: 14 }}>
                {/* Full Name & Callsign */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={[styles.inputBoxCard, { flex: 1.1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.fieldLabel, { color: theme.subtext }]}>FULL NAME</Text>
                    <TextInput
                      value={name}
                      onChangeText={(t) => setName(sanitizeText(t, 40))}
                      maxLength={40}
                      placeholder="Alex Carter"
                      placeholderTextColor={theme.subtext}
                      style={[styles.textInputMain, { color: theme.text, borderBottomColor: theme.border }]}
                    />
                  </View>

                  <View style={[styles.inputBoxCard, { flex: 0.9, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <Text style={[styles.fieldLabel, { color: theme.subtext }]}>CALLSIGN / NICK</Text>
                    <TextInput
                      value={nickname}
                      onChangeText={(t) => setNickname(sanitizeText(t, 30))}
                      maxLength={30}
                      placeholder="Apex Lifter"
                      placeholderTextColor={theme.subtext}
                      style={[styles.textInputMain, { color: theme.text, borderBottomColor: theme.border }]}
                    />
                  </View>
                </View>

                {/* Sex Selector */}
                <View style={[styles.inputBoxCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext }]}>BIOLOGICAL SEX (FOR BMR)</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
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
                              flex: 1,
                              backgroundColor: isSel ? theme.primary : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 13, fontWeight: isSel ? '800' : '600', color: isSel ? theme.primaryText : theme.text }}>
                            {g}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Age with Steppers */}
                <View style={[styles.inputBoxCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext }]}>AGE (YEARS)</Text>
                  <View style={styles.stepperContainer}>
                    <TouchableOpacity
                      onPress={() => adjustAge(-1)}
                      style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <Minus size={16} color={theme.text} />
                    </TouchableOpacity>

                    <View style={styles.stepperValueBox}>
                      <TextInput
                        value={age}
                        onChangeText={(t) => setAge(sanitizeInteger(t, 3))}
                        keyboardType="numeric"
                        maxLength={3}
                        style={[styles.bigStatInput, { color: theme.text }]}
                      />
                      <Text style={[styles.statUnit, { color: theme.subtext }]}>YEARS OLD</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => adjustAge(1)}
                      style={[styles.stepperBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <Plus size={16} color={theme.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Weight & Height Side-by-Side with Steppers */}
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  {/* Weight */}
                  <View style={[styles.inputBoxCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.fieldLabel, { color: theme.subtext }]}>BODY WEIGHT</Text>
                      <TouchableOpacity
                        onPress={() => {
                          const next = weightUnit === 'KG' ? 'LBS' : 'KG';
                          const currentKg = weightToKg(weightKg, weightUnit);
                          setWeightUnit(next);
                          setWeightKg(kgToDisplayWeight(currentKg, next));
                          Haptics.selectionAsync();
                        }}
                        style={[styles.unitToggleBadge, { borderColor: theme.border, backgroundColor: theme.card }]}
                      >
                        <Text style={[styles.unitToggleText, { color: theme.primary }]}>{weightUnit}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        onPress={() => adjustWeight(weightUnit === 'LBS' ? -1 : -0.5)}
                        style={[styles.stepperBtnMini, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Minus size={14} color={theme.text} />
                      </TouchableOpacity>

                      <View style={{ alignItems: 'center' }}>
                        <TextInput
                          value={weightKg}
                          onChangeText={(t) => setWeightKg(sanitizeWeightInput(t))}
                          keyboardType="numeric"
                          maxLength={6}
                          placeholder={weightUnit === 'LBS' ? '165' : '75'}
                          placeholderTextColor={theme.subtext}
                          style={[styles.bigStatInput, { color: theme.text }]}
                        />
                        <Text style={[styles.statUnit, { color: theme.subtext }]}>{weightUnit}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => adjustWeight(weightUnit === 'LBS' ? 1 : 0.5)}
                        style={[styles.stepperBtnMini, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Plus size={14} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Height */}
                  <View style={[styles.inputBoxCard, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.fieldLabel, { color: theme.subtext }]}>HEIGHT</Text>
                      <TouchableOpacity
                        onPress={() => {
                          const next = heightUnit === 'CM' ? 'FT' : 'CM';
                          const currentCm = heightToCm(heightCm, heightUnit);
                          setHeightUnit(next);
                          setHeightCm(cmToDisplayHeight(currentCm, next));
                          Haptics.selectionAsync();
                        }}
                        style={[styles.unitToggleBadge, { borderColor: theme.border, backgroundColor: theme.card }]}
                      >
                        <Text style={[styles.unitToggleText, { color: theme.primary }]}>{heightUnit}</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        onPress={() => adjustHeight(-1)}
                        style={[styles.stepperBtnMini, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Minus size={14} color={theme.text} />
                      </TouchableOpacity>

                      <View style={{ alignItems: 'center' }}>
                        <TextInput
                          value={heightCm}
                          onChangeText={(t) => setHeightCm(sanitizeHeightInput(t, heightUnit))}
                          keyboardType="numeric"
                          maxLength={heightUnit === 'FT' ? 5 : 3}
                          placeholder={heightUnit === 'FT' ? '5.8' : '178'}
                          placeholderTextColor={theme.subtext}
                          style={[styles.bigStatInput, { color: theme.text }]}
                        />
                        <Text style={[styles.statUnit, { color: theme.subtext }]}>{heightUnit}</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => adjustHeight(1)}
                        style={[styles.stepperBtnMini, { backgroundColor: theme.card, borderColor: theme.border }]}
                      >
                        <Plus size={14} color={theme.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>

              {/* NAVIGATION BUTTONS */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={handlePrevStep}
                  style={[styles.navBackBtn, { borderColor: theme.border, backgroundColor: theme.cardElevated }]}
                >
                  <ChevronLeft size={18} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleNextStep}
                  style={[styles.primaryActionBtn, { flex: 1, backgroundColor: theme.primary, marginTop: 0 }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryActionBtnText, { color: theme.primaryText }]}>
                    Continue to Training Goals
                  </Text>
                  <ChevronRight size={18} color={theme.primaryText} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================= STEP 3: GOALS & SPLIT ================= */}
          {step === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeaderBox}>
                <View style={[styles.stepBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <Target size={14} color={theme.primary} />
                  <Text style={[styles.stepBadgeText, { color: theme.primary }]}>PROGRAMMING CALIBRATION</Text>
                </View>
                <Text style={[styles.stepMainTitle, { color: theme.text }]}>Training Architecture</Text>
                <Text style={[styles.stepSubDesc, { color: theme.subtext }]}>
                  Choose your targeted outcome, training frequency, and workout structure.
                </Text>
              </View>

              <View style={{ gap: 12, marginVertical: 14 }}>
                {/* Primary Fitness Goal */}
                <View style={[styles.inputBoxCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 8 }]}>PRIMARY ATHLETIC GOAL</Text>
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
                              backgroundColor: isSel ? `${theme.primary}18` : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 13, fontWeight: isSel ? '800' : '600', color: isSel ? theme.primary : theme.text }}>
                            {g}
                          </Text>
                          {isSel && <Check size={16} color={theme.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Experience Level */}
                <View style={[styles.inputBoxCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 8 }]}>EXPERIENCE LEVEL</Text>
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
                          <Text style={{ fontSize: 12, fontWeight: isSel ? '800' : '600', color: isSel ? theme.primaryText : theme.text }}>
                            {e.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Weekly Target Days */}
                <View style={[styles.inputBoxCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.fieldLabel, { color: theme.subtext }]}>WEEKLY WORKOUT FREQUENCY</Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: theme.primary }}>
                      {weeklyDays} Days / Week ({7 - weeklyDays} Rest)
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 8 }}>
                    {WEEKLY_DAYS_OPTIONS.map((d) => {
                      const isSel = weeklyDays === d;
                      return (
                        <TouchableOpacity
                          key={d}
                          onPress={() => {
                            setWeeklyDays(d);
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
                          <Text style={{ fontSize: 13, fontWeight: '800', color: isSel ? theme.primaryText : theme.text }}>
                            {d}d
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Preferred Split */}
                <View style={[styles.inputBoxCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                  <Text style={[styles.fieldLabel, { color: theme.subtext, marginBottom: 8 }]}>PREFERRED SPLIT</Text>
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
                              backgroundColor: isSel ? `${theme.primary}18` : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text style={{ fontSize: 12, fontWeight: isSel ? '800' : '600', color: isSel ? theme.primary : theme.text }}>
                            {s}
                          </Text>
                          {isSel && <Check size={14} color={theme.primary} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* NAVIGATION BUTTONS */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={handlePrevStep}
                  style={[styles.navBackBtn, { borderColor: theme.border, backgroundColor: theme.cardElevated }]}
                >
                  <ChevronLeft size={18} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleNextStep}
                  style={[styles.primaryActionBtn, { flex: 1, backgroundColor: theme.primary, marginTop: 0 }]}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.primaryActionBtnText, { color: theme.primaryText }]}>
                    Review Calibrated OS
                  </Text>
                  <ChevronRight size={18} color={theme.primaryText} />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================= STEP 4: REVIEW & LAUNCH ================= */}
          {step === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepHeaderBox}>
                <View style={[styles.stepBadge, { backgroundColor: `${theme.primary}20` }]}>
                  <Sparkles size={14} color={theme.primary} />
                  <Text style={[styles.stepBadgeText, { color: theme.primary }]}>FINAL CALIBRATION READY</Text>
                </View>
                <Text style={[styles.stepMainTitle, { color: theme.text }]}>
                  Welcome, {nickname || name}!
                </Text>
                <Text style={[styles.stepSubDesc, { color: theme.subtext }]}>
                  Your biometric model is synthesized. These scientific targets will calibrate your Activity Rings and coaching.
                </Text>
              </View>

              {/* ENERGY METABOLISM HERO CARD */}
              <View style={[styles.metabolicHeroCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={styles.metabolicHeroHeader}>
                  <View>
                    <Text style={[styles.metabolicHeroEyebrow, { color: theme.subtext }]}>ENERGY EXPENDITURE MODEL</Text>
                    <Text style={[styles.metabolicHeroTitle, { color: theme.text }]}>Mifflin-St Jeor TDEE</Text>
                  </View>
                  <View style={[styles.burnBadge, { backgroundColor: `${theme.accentOrange}20` }]}>
                    <Flame size={14} color={theme.accentOrange} />
                    <Text style={[styles.burnBadgeText, { color: theme.accentOrange }]}>
                      {calculatedMetrics.tdee} kcal/day
                    </Text>
                  </View>
                </View>

                {/* Energy balance visualization */}
                <View style={styles.energyBarTrack}>
                  <View style={[styles.energyBarBmr, { backgroundColor: theme.primary }]} />
                  <View style={[styles.energyBarActivity, { backgroundColor: theme.accentOrange }]} />
                </View>
                <View style={styles.energyBarLegend}>
                  <Text style={[styles.legendText, { color: theme.subtext }]}>
                    <Text style={{ color: theme.primary, fontWeight: '800' }}>■</Text> BMR: {calculatedMetrics.bmr} kcal
                  </Text>
                  <Text style={[styles.legendText, { color: theme.subtext }]}>
                    <Text style={{ color: theme.accentOrange, fontWeight: '800' }}>■</Text> Activity: +{calculatedMetrics.tdee - calculatedMetrics.bmr} kcal
                  </Text>
                </View>
              </View>

              {/* TARGETS SUMMARY CARDS */}
              <View style={{ gap: 8, marginVertical: 12 }}>
                {/* Volume & Sets */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.metricTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={[styles.metricDotBadge, { backgroundColor: theme.accentRed }]} />
                      <Text style={[styles.metricLabel, { color: theme.subtext }]}>MOVE RING</Text>
                    </View>
                    <Text style={[styles.metricTileVal, { color: theme.accentRed }]}>
                      {calculatedMetrics.suggestedVolumeKg.toLocaleString()} <Text style={{ fontSize: 11, color: theme.subtext }}>KG</Text>
                    </Text>
                    <Text style={[styles.metricTileSub, { color: theme.subtext }]}>Daily Mechanical Work</Text>
                  </View>

                  <View style={[styles.metricTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={[styles.metricDotBadge, { backgroundColor: theme.primary }]} />
                      <Text style={[styles.metricLabel, { color: theme.subtext }]}>EXERCISE RING</Text>
                    </View>
                    <Text style={[styles.metricTileVal, { color: theme.primary }]}>
                      {calculatedMetrics.suggestedSets} <Text style={{ fontSize: 11, color: theme.subtext }}>Sets</Text>
                    </Text>
                    <Text style={[styles.metricTileSub, { color: theme.subtext }]}>Direct Stimulus Sets</Text>
                  </View>
                </View>

                {/* Calories & Protein */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.metricTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={[styles.metricDotBadge, { backgroundColor: theme.accentOrange }]} />
                      <Text style={[styles.metricLabel, { color: theme.subtext }]}>CALORIE GOAL</Text>
                    </View>
                    <Text style={[styles.metricTileVal, { color: theme.accentOrange }]}>
                      {calculatedMetrics.suggestedCalories} <Text style={{ fontSize: 11, color: theme.subtext }}>kcal</Text>
                    </Text>
                    <Text style={[styles.metricTileSub, { color: theme.subtext }]}>Calibrated Intake</Text>
                  </View>

                  <View style={[styles.metricTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <View style={[styles.metricDotBadge, { backgroundColor: theme.accentCyan }]} />
                      <Text style={[styles.metricLabel, { color: theme.subtext }]}>PROTEIN (MPS)</Text>
                    </View>
                    <Text style={[styles.metricTileVal, { color: theme.accentCyan }]}>
                      {calculatedMetrics.suggestedProtein}g
                    </Text>
                    <Text style={[styles.metricTileSub, { color: theme.subtext }]}>Muscle Synthesis</Text>
                  </View>
                </View>

                {/* Hydration & Rest */}
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <View style={[styles.metricTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Droplets size={12} color="#00F0FF" />
                      <Text style={[styles.metricLabel, { color: theme.subtext }]}>HYDRATION</Text>
                    </View>
                    <Text style={[styles.metricTileVal, { color: '#00F0FF' }]}>
                      {(calculatedMetrics.suggestedWaterMl / 1000).toFixed(1)}L
                    </Text>
                    <Text style={[styles.metricTileSub, { color: theme.subtext }]}>{calculatedMetrics.suggestedWaterMl} ml/day</Text>
                  </View>

                  <View style={[styles.metricTile, { flex: 1, backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Clock size={12} color="#34C759" />
                      <Text style={[styles.metricLabel, { color: theme.subtext }]}>REST INTERVAL</Text>
                    </View>
                    <Text style={[styles.metricTileVal, { color: '#34C759' }]}>
                      90s
                    </Text>
                    <Text style={[styles.metricTileSub, { color: theme.subtext }]}>ATP Resynthesis</Text>
                  </View>
                </View>
              </View>

              {/* NAVIGATION BUTTONS */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <TouchableOpacity
                  onPress={handlePrevStep}
                  style={[styles.navBackBtn, { borderColor: theme.border, backgroundColor: theme.cardElevated }]}
                >
                  <ChevronLeft size={18} color={theme.text} />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleFinishOnboarding}
                  style={[styles.primaryActionBtn, { flex: 1, backgroundColor: theme.primary, marginTop: 0 }]}
                  activeOpacity={0.85}
                >
                  <Zap size={18} color={theme.primaryText} />
                  <Text style={[styles.primaryActionBtnText, { color: theme.primaryText }]}>
                    Enter AMPED OS
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  topProgressSection: {
    marginBottom: 16,
  },
  topProgressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  stepProgressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepCurrentLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  stepResetLink: {
    fontSize: 11,
    fontWeight: '600',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {
    flex: 1,
  },
  brandHeroCenter: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  versionBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 4,
  },
  logoGlowCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  welcomeHeadline: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.6,
    marginTop: 14,
    textAlign: 'center',
  },
  welcomeSubhead: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 12,
  },
  sectionHeaderRow: {
    marginTop: 10,
    marginBottom: 10,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  sectionSubhint: {
    fontSize: 11,
    marginTop: 2,
  },
  archetypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  archetypeCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  archetypeCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  archetypeIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archetypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  archetypeBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  archetypeTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 2,
  },
  archetypeSubtitle: {
    fontSize: 10,
    lineHeight: 14,
    minHeight: 28,
  },
  archetypeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  archetypeMeta: {
    fontSize: 10,
    fontWeight: '700',
  },
  pillarsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  pillarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillarText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pillarDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 16,
    marginTop: 6,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  navBackBtn: {
    width: 50,
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepHeaderBox: {
    marginTop: 4,
    marginBottom: 12,
  },
  stepBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 6,
  },
  stepBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stepMainTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  stepSubDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  liveBmiBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  liveBmiVal: {
    fontSize: 13,
    fontWeight: '900',
  },
  liveBmiCategory: {
    fontSize: 11,
    fontWeight: '600',
  },
  liveBmrSub: {
    fontSize: 10,
    fontWeight: '700',
  },
  inputBoxCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  fieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  textInputMain: {
    fontSize: 15,
    fontWeight: '700',
    paddingVertical: 4,
    borderBottomWidth: 1,
  },
  miniChip: {
    paddingVertical: 8,
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
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  stepperBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnMini: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueBox: {
    alignItems: 'center',
  },
  bigStatInput: {
    fontSize: 22,
    fontWeight: '900',
    minWidth: 40,
    padding: 0,
    textAlign: 'center',
  },
  statUnit: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 1,
  },
  unitToggleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  unitToggleText: {
    fontSize: 10,
    fontWeight: '800',
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
  metabolicHeroCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  metabolicHeroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  metabolicHeroEyebrow: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metabolicHeroTitle: {
    fontSize: 15,
    fontWeight: '900',
    marginTop: 1,
  },
  burnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  burnBadgeText: {
    fontSize: 11,
    fontWeight: '900',
  },
  energyBarTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: 6,
  },
  energyBarBmr: {
    flex: 0.7,
    height: 6,
  },
  energyBarActivity: {
    flex: 0.3,
    height: 6,
  },
  energyBarLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendText: {
    fontSize: 10,
  },
  metricTile: {
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricDotBadge: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  metricLabel: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricTileVal: {
    fontSize: 16,
    fontWeight: '900',
  },
  metricTileSub: {
    fontSize: 9,
    marginTop: 2,
  },
});
