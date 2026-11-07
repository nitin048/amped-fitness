import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Bell,
  X,
  Plus,
  Trash2,
  Clock,
  Check,
  Calendar,
  Volume2,
  Sparkles,
  Pencil,
  Play,
  RotateCcw,
} from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import {
  WorkoutAlarm,
  getWorkoutAlarms,
  addWorkoutAlarm,
  updateWorkoutAlarm,
  toggleWorkoutAlarm,
  deleteWorkoutAlarm,
} from '../db/database';

interface WorkoutAlarmsModalProps {
  visible: boolean;
  theme: ThemePalette;
  onClose: () => void;
  onAlarmsChanged?: () => void;
  onTestTrigger?: () => void;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const WorkoutAlarmsModal: React.FC<WorkoutAlarmsModalProps> = ({
  visible,
  theme,
  onClose,
  onAlarmsChanged,
  onTestTrigger,
}) => {
  const [alarms, setAlarms] = useState<WorkoutAlarm[]>([]);
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [editingAlarmId, setEditingAlarmId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState<string>('Morning Workout Session');
  const [hour, setHour] = useState<number>(6);
  const [minute, setMinute] = useState<number>(30);
  const [period, setPeriod] = useState<'AM' | 'PM'>('AM');
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 2, 4]); // Mon, Wed, Fri
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  useEffect(() => {
    if (visible) {
      loadAlarms();
      setShowAddForm(false);
      setEditingAlarmId(null);
    }
  }, [visible]);

  const loadAlarms = () => {
    const list = getWorkoutAlarms();
    setAlarms(list);
  };

  const handleToggleAlarm = (id: number, currentActive: boolean) => {
    Haptics.selectionAsync();
    const updated = toggleWorkoutAlarm(id, !currentActive);
    setAlarms(updated);
    if (onAlarmsChanged) onAlarmsChanged();
  };

  const handleDeleteAlarm = (id: number) => {
    const performDelete = () => {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
      const updated = deleteWorkoutAlarm(id);
      setAlarms(updated);
      if (editingAlarmId === id) {
        setEditingAlarmId(null);
        setShowAddForm(false);
      }
      if (onAlarmsChanged) onAlarmsChanged();
    };

    if (Platform.OS === 'web') {
      const confirmed =
        typeof window !== 'undefined' && typeof window.confirm === 'function'
          ? window.confirm('Are you sure you want to delete this workout alarm?')
          : true;
      if (confirmed) {
        performDelete();
      }
      return;
    }

    Alert.alert(
      'Delete Alarm',
      'Are you sure you want to delete this workout alarm?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  const handleStartEdit = (alarm: WorkoutAlarm) => {
    Haptics.selectionAsync();
    setEditingAlarmId(alarm.id);
    setTitle(alarm.title);
    const [hStr, mStr] = (alarm.timeStr || '06:30').split(':');
    setHour(parseInt(hStr, 10) || 6);
    setMinute(parseInt(mStr, 10) || 30);
    setPeriod(alarm.period || 'AM');
    setSelectedDays([...alarm.days]);
    setSoundEnabled(alarm.soundEnabled !== false);
    setShowAddForm(true);
  };

  const handleStartCreate = () => {
    Haptics.selectionAsync();
    setEditingAlarmId(null);
    setTitle('Morning Workout Session');
    setHour(6);
    setMinute(30);
    setPeriod('AM');
    setSelectedDays([0, 2, 4]); // Mon, Wed, Fri
    setSoundEnabled(true);
    setShowAddForm(true);
  };

  const handleCancelForm = () => {
    setShowAddForm(false);
    setEditingAlarmId(null);
    Haptics.selectionAsync();
  };

  const handleToggleDay = (dayIdx: number) => {
    Haptics.selectionAsync();
    setSelectedDays((prev) =>
      prev.includes(dayIdx) ? prev.filter((d) => d !== dayIdx) : [...prev, dayIdx].sort()
    );
  };

  const handleSaveAlarm = () => {
    if (selectedDays.length === 0) {
      Alert.alert('Select Days', 'Please select at least one day for your workout reminder.');
      return;
    }

    const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;

    let updatedList: WorkoutAlarm[];
    if (editingAlarmId !== null) {
      updatedList = updateWorkoutAlarm(editingAlarmId, {
        title: title.trim() || 'Gym Training Session',
        timeStr,
        period,
        days: selectedDays,
        soundEnabled,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      updatedList = addWorkoutAlarm({
        title: title.trim() || 'Gym Training Session',
        timeStr,
        period,
        days: selectedDays,
        soundEnabled,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setAlarms(updatedList);
    setShowAddForm(false);
    setEditingAlarmId(null);
    if (onAlarmsChanged) onAlarmsChanged();
  };

  const activeCount = alarms.filter((a) => a.isActive).length;

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
              <View style={[styles.bellBadge, { backgroundColor: `${theme.primary}20` }]}>
                <Bell size={18} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.text }]} numberOfLines={1}>
                  Workout Alarms & Reminders
                </Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]} numberOfLines={1}>
                  Discipline cues & live ringing alerts on training days
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* UPCOMING BANNER + QUICK TEST TRIGGER BUTTON */}
            <View style={[styles.upcomingCard, { backgroundColor: `${theme.primary}12`, borderColor: theme.primary }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Clock size={16} color={theme.primary} />
                  <Text style={[styles.upcomingTitle, { color: theme.primary }]}>
                    {activeCount} Active Training {activeCount === 1 ? 'Alarm' : 'Alarms'}
                  </Text>
                </View>

                {onTestTrigger && (
                  <TouchableOpacity
                    onPress={() => {
                      Haptics.selectionAsync();
                      onTestTrigger();
                    }}
                    style={[styles.testAlarmPill, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                  >
                    <Play size={11} color={theme.primary} fill={theme.primary} />
                    <Text style={[styles.testAlarmPillText, { color: theme.primary }]}>Test Alarm Ring</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={[styles.upcomingDesc, { color: theme.subtext }]}>
                Real-time alarm daemon actively monitors scheduled splits and rings with dual-layer audible chimes and urgent vibration when workout time arrives.
              </Text>
            </View>

            {/* ALARMS LIST */}
            <View style={{ gap: 10, marginVertical: 14 }}>
              {alarms.length === 0 ? (
                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                  <Bell size={28} color={theme.subtext} />
                  <Text style={[styles.emptyText, { color: theme.text }]}>No alarms scheduled</Text>
                  <Text style={[styles.emptySub, { color: theme.subtext }]}>
                    Tap "+ Add New Workout Alarm" below to set your morning or evening gym reminders.
                  </Text>
                </View>
              ) : (
                alarms.map((item) => (
                  <View
                    key={item.id}
                    style={[
                      styles.alarmCard,
                      {
                        backgroundColor: theme.cardElevated,
                        borderColor: item.isActive ? theme.primary : theme.border,
                        opacity: item.isActive ? 1 : 0.65,
                      },
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => handleStartEdit(item)}
                      style={{ flex: 1, paddingRight: 8 }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                        <Text style={[styles.alarmTimeDigits, { color: item.isActive ? theme.text : theme.subtext }]}>
                          {item.timeStr}
                        </Text>
                        <Text style={[styles.alarmPeriodText, { color: item.isActive ? theme.primary : theme.subtext }]}>
                          {item.period}
                        </Text>
                      </View>

                      <Text style={[styles.alarmTitleText, { color: theme.text }]} numberOfLines={1}>
                        {item.title}
                      </Text>

                      {/* Day chips */}
                      <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
                        {DAY_LABELS.map((label, idx) => {
                          const isDayActive = item.days.includes(idx);
                          return (
                            <View
                              key={label}
                              style={[
                                styles.miniDayPill,
                                {
                                  backgroundColor: isDayActive && item.isActive ? theme.primary : theme.card,
                                  borderColor: isDayActive && item.isActive ? theme.primary : theme.border,
                                },
                              ]}
                            >
                              <Text
                                style={{
                                  fontSize: 9,
                                  fontWeight: '800',
                                  color: isDayActive && item.isActive ? theme.primaryText : theme.subtext,
                                }}
                              >
                                {label[0]}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    </TouchableOpacity>

                    {/* Actions: Edit, Toggle, Delete */}
                    <View style={{ alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 }}>
                      <Switch
                        value={item.isActive}
                        onValueChange={() => handleToggleAlarm(item.id, item.isActive)}
                        trackColor={{ false: theme.border, true: theme.primary }}
                        thumbColor="#FFFFFF"
                      />

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 14 }}>
                        <TouchableOpacity
                          onPress={() => handleStartEdit(item)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={[styles.miniActionIconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                        >
                          <Pencil size={13} color={theme.text} />
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleDeleteAlarm(item.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                          style={[styles.miniActionIconBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                        >
                          <Trash2 size={13} color="#FF2D55" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* ADD / EDIT ALARM INLINE CARD */}
            {!showAddForm ? (
              <TouchableOpacity
                onPress={handleStartCreate}
                style={[styles.addAlarmBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
                activeOpacity={0.85}
              >
                <Plus size={16} color={theme.primary} />
                <Text style={[styles.addAlarmBtnText, { color: theme.text }]}>Add New Workout Alarm</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.addFormCard, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    {editingAlarmId !== null ? (
                      <Pencil size={16} color={theme.primary} />
                    ) : (
                      <Plus size={16} color={theme.primary} />
                    )}
                    <Text style={[styles.addFormHeader, { color: theme.text }]}>
                      {editingAlarmId !== null ? 'Edit Workout Alarm' : 'Configure New Alarm'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={handleCancelForm} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <X size={16} color={theme.subtext} />
                  </TouchableOpacity>
                </View>

                {/* Alarm Title */}
                <Text style={[styles.fieldLabel, { color: theme.subtext }]}>ALARM TITLE</Text>
                <TextInput
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g. Leg Day Destroyer, Morning HIIT"
                  placeholderTextColor={theme.subtext}
                  style={[styles.formInput, { color: theme.text, backgroundColor: theme.card, borderColor: theme.border }]}
                />

                {/* Time Steppers & AM/PM */}
                <Text style={[styles.fieldLabel, { color: theme.subtext, marginTop: 14 }]}>ALARM TIME</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  {/* Hour */}
                  <View style={[styles.timeBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TouchableOpacity onPress={() => setHour((h) => (h >= 12 ? 1 : h + 1))}>
                      <Text style={[styles.timeArrow, { color: theme.subtext }]}>▲</Text>
                    </TouchableOpacity>
                    <Text style={[styles.timeDigits, { color: theme.text }]}>
                      {hour.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity onPress={() => setHour((h) => (h <= 1 ? 12 : h - 1))}>
                      <Text style={[styles.timeArrow, { color: theme.subtext }]}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={{ fontSize: 24, fontWeight: '900', color: theme.subtext }}>:</Text>

                  {/* Minute */}
                  <View style={[styles.timeBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <TouchableOpacity onPress={() => setMinute((m) => (m >= 59 ? 0 : m + 1))}>
                      <Text style={[styles.timeArrow, { color: theme.subtext }]}>▲</Text>
                    </TouchableOpacity>
                    <Text style={[styles.timeDigits, { color: theme.text }]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                    <TouchableOpacity onPress={() => setMinute((m) => (m <= 0 ? 59 : m - 1))}>
                      <Text style={[styles.timeArrow, { color: theme.subtext }]}>▼</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Quick Minute Shifters */}
                  <View style={{ flexDirection: 'column', gap: 4 }}>
                    <TouchableOpacity
                      onPress={() => setMinute((m) => (m + 5) % 60)}
                      style={[styles.quickMinBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <Text style={[styles.quickMinText, { color: theme.text }]}>+5m</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setMinute((m) => (m - 5 < 0 ? 55 : m - 5))}
                      style={[styles.quickMinBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                    >
                      <Text style={[styles.quickMinText, { color: theme.text }]}>-5m</Text>
                    </TouchableOpacity>
                  </View>

                  {/* AM/PM Toggle */}
                  <View style={{ flexDirection: 'row', gap: 6, marginLeft: 'auto' }}>
                    {(['AM', 'PM'] as const).map((p) => {
                      const isSel = period === p;
                      return (
                        <TouchableOpacity
                          key={p}
                          onPress={() => {
                            setPeriod(p);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.periodBtn,
                            {
                              backgroundColor: isSel ? theme.primary : theme.card,
                              borderColor: isSel ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: '900',
                              color: isSel ? theme.primaryText : theme.text,
                            }}
                          >
                            {p}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Days Selector */}
                <Text style={[styles.fieldLabel, { color: theme.subtext, marginTop: 14 }]}>REPEAT DAYS</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                  {DAY_LABELS.map((label, idx) => {
                    const isSel = selectedDays.includes(idx);
                    return (
                      <TouchableOpacity
                        key={label}
                        onPress={() => handleToggleDay(idx)}
                        style={[
                          styles.daySelectChip,
                          {
                            backgroundColor: isSel ? theme.primary : theme.card,
                            borderColor: isSel ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '800',
                            color: isSel ? theme.primaryText : theme.text,
                          }}
                        >
                          {label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Sound & Vibration Toggle */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Volume2 size={16} color={theme.primary} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: theme.text }}>Vibration & Alert Cues</Text>
                  </View>
                  <Switch
                    value={soundEnabled}
                    onValueChange={(val) => {
                      setSoundEnabled(val);
                      Haptics.selectionAsync();
                    }}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {/* SAVE / UPDATE BUTTONS */}
                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <TouchableOpacity
                    onPress={handleCancelForm}
                    style={[styles.cancelBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    <Text style={[styles.cancelBtnText, { color: theme.subtext }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleSaveAlarm}
                    style={[styles.saveAlarmBtn, { backgroundColor: theme.primary }]}
                    activeOpacity={0.85}
                  >
                    <Check size={16} color={theme.primaryText} />
                    <Text style={[styles.saveAlarmBtnText, { color: theme.primaryText }]}>
                      {editingAlarmId !== null ? 'Update Alarm' : 'Save Alarm'}
                    </Text>
                  </TouchableOpacity>
                </View>
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
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    maxHeight: '90%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  bellBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  upcomingCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 4,
  },
  upcomingTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  upcomingDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  testAlarmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  testAlarmPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  emptyBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  alarmCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  alarmTimeDigits: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  alarmPeriodText: {
    fontSize: 15,
    fontWeight: '800',
  },
  alarmTitleText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  miniDayPill: {
    width: 20,
    height: 20,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  miniActionIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  addAlarmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  addAlarmBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  addFormCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  addFormHeader: {
    fontSize: 14,
    fontWeight: '800',
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  formInput: {
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginTop: 4,
  },
  timeBox: {
    width: 60,
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  timeArrow: {
    fontSize: 11,
    fontWeight: '800',
  },
  timeDigits: {
    fontSize: 22,
    fontWeight: '900',
  },
  quickMinBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickMinText: {
    fontSize: 10,
    fontWeight: '800',
  },
  periodBtn: {
    width: 44,
    height: 70,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  daySelectChip: {
    flex: 1,
    marginHorizontal: 2,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveAlarmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  saveAlarmBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
});
