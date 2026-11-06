import { useState, useEffect, useRef, useCallback } from 'react';
import * as Haptics from 'expo-haptics';
import { WorkoutAlarm, getWorkoutAlarms } from '../db/database';

export interface SnoozedAlarm {
  alarm: WorkoutAlarm;
  triggerTime: number;
}

export const useWorkoutAlarmEngine = () => {
  const [alarms, setAlarms] = useState<WorkoutAlarm[]>(() => getWorkoutAlarms());
  const [ringingAlarm, setRingingAlarm] = useState<WorkoutAlarm | null>(null);
  const snoozedListRef = useRef<SnoozedAlarm[]>([]);
  const lastFiredKeysRef = useRef<Set<string>>(new Set());

  // Reload alarms from database
  const refreshAlarms = useCallback(() => {
    const list = getWorkoutAlarms();
    setAlarms(list);
    // Dismiss ringing alarm if it was deleted
    setRingingAlarm((curr) => {
      if (curr && !list.some((a) => a.id === curr.id)) {
        return null;
      }
      return curr;
    });
    // Remove any snoozed alarm whose id was deleted
    snoozedListRef.current = snoozedListRef.current.filter((s) =>
      list.some((a) => a.id === s.alarm.id)
    );
  }, []);

  // Dismiss the ringing alarm
  const dismissRingingAlarm = useCallback(() => {
    setRingingAlarm(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  // Snooze the alarm for given minutes (default 5 min)
  const snoozeRingingAlarm = useCallback((minutes = 5) => {
    if (!ringingAlarm) return;
    const triggerTime = Date.now() + minutes * 60 * 1000;
    snoozedListRef.current.push({
      alarm: ringingAlarm,
      triggerTime,
    });
    setRingingAlarm(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, [ringingAlarm]);

  // Test trigger for instant preview & diagnostics
  const testTriggerAlarm = useCallback((customAlarm?: WorkoutAlarm) => {
    const target = customAlarm || alarms.find((a) => a.isActive) || {
      id: 9999,
      title: 'Leg Day & Hypertrophy Training',
      timeStr: '06:30',
      period: 'AM' as const,
      days: [0, 1, 2, 3, 4, 5, 6],
      isActive: true,
      soundEnabled: true,
      createdAt: Date.now(),
    };
    setRingingAlarm(target);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, [alarms]);

  // Haptic pulse engine during active ringing
  useEffect(() => {
    if (!ringingAlarm) return;

    // Urgent haptic pulse loop
    const hapticInterval = setInterval(() => {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {
        // ignore
      }
    }, 1200);

    return () => {
      clearInterval(hapticInterval);
    };
  }, [ringingAlarm]);

  // Background monitor: checks every 3 seconds for scheduled alarms & snoozed alarms
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const nowMs = now.getTime();

      // Check snoozed alarms
      if (snoozedListRef.current.length > 0) {
        const dueIndex = snoozedListRef.current.findIndex((s) => s.triggerTime <= nowMs);
        if (dueIndex !== -1) {
          const due = snoozedListRef.current[dueIndex];
          snoozedListRef.current.splice(dueIndex, 1);
          setRingingAlarm(due.alarm);
          return;
        }
      }

      // Convert JS Sunday=0..Saturday=6 to Mon=0..Sun=6
      const jsDay = now.getDay();
      const currentDayIdx = jsDay === 0 ? 6 : jsDay - 1;

      let hours24 = now.getHours();
      const currentPeriod: 'AM' | 'PM' = hours24 >= 12 ? 'PM' : 'AM';
      let hours12 = hours24 % 12;
      if (hours12 === 0) hours12 = 12;
      const hourStr = hours12.toString().padStart(2, '0');
      const minStr = now.getMinutes().toString().padStart(2, '0');
      const currentTimeStr = `${hourStr}:${minStr}`;

      const activeAlarms = alarms.filter((a) => a.isActive);

      for (const alarm of activeAlarms) {
        // Normalize stored time string (e.g. "6:30" vs "06:30")
        const [aHour, aMin] = (alarm.timeStr || '').split(':');
        const normalizedAlarmTime = `${(parseInt(aHour, 10) || 0).toString().padStart(2, '0')}:${(parseInt(aMin, 10) || 0).toString().padStart(2, '0')}`;

        if (
          normalizedAlarmTime === currentTimeStr &&
          alarm.period === currentPeriod &&
          alarm.days.includes(currentDayIdx)
        ) {
          const fireKey = `${alarm.id}_${now.toDateString()}_${currentTimeStr}_${currentPeriod}`;
          if (!lastFiredKeysRef.current.has(fireKey)) {
            lastFiredKeysRef.current.add(fireKey);
            setRingingAlarm(alarm);
            break;
          }
        }
      }

      // Clean up old fire keys if set grows large
      if (lastFiredKeysRef.current.size > 200) {
        lastFiredKeysRef.current.clear();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [alarms]);

  return {
    alarms,
    ringingAlarm,
    dismissRingingAlarm,
    snoozeRingingAlarm,
    testTriggerAlarm,
    refreshAlarms,
  };
};

