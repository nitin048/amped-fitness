import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useAudioPlayer } from 'expo-audio';
import { Bell, Flame, Clock, X, Play } from 'lucide-react-native';
import { ThemePalette } from '../theme/ThemeContext';
import { WorkoutAlarm } from '../db/database';

interface AlarmRingingModalProps {
  alarm: WorkoutAlarm | null;
  theme: ThemePalette;
  onDismiss: () => void;
  onSnooze: (minutes?: number) => void;
  onStartWorkout: (alarmTitle: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const AlarmRingingModal: React.FC<AlarmRingingModalProps> = ({
  alarm,
  theme,
  onDismiss,
  onSnooze,
  onStartWorkout,
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rippleAnim = useRef(new Animated.Value(0.8)).current;

  // Native audio player (expo-audio)
  let audioPlayer: ReturnType<typeof useAudioPlayer> | null = null;
  try {
    audioPlayer = useAudioPlayer(require('../../assets/alarm_beep.wav'));
  } catch (e) {
    // fallback if native module loading is deferred
  }

  // Animation & Audio playback management
  useEffect(() => {
    if (!alarm) {
      if (audioPlayer) {
        try {
          audioPlayer.pause();
        } catch {
          // ignore
        }
      }
      return;
    }

    // Start native audio if available
    if (audioPlayer) {
      try {
        audioPlayer.loop = true;
        audioPlayer.volume = 1.0;
        audioPlayer.play();
      } catch (e) {
        console.warn('Native audio play error:', e);
      }
    }

    // Pulsing and ripple loop animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.18,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnim, {
            toValue: 1.5,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(rippleAnim, {
            toValue: 0.8,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    pulseLoop.start();

    return () => {
      pulseLoop.stop();
      if (audioPlayer) {
        try {
          audioPlayer.pause();
        } catch {
          // ignore
        }
      }
    };
  }, [alarm, audioPlayer]);

  if (!alarm) return null;

  return (
    <Modal visible={!!alarm} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* LOUD WEB AUDIO SYNTHESIZER SIREN GENERATOR (0ms LATENCY GUARANTEED SPEAKER SOUND) */}
        <View style={styles.hiddenAudioContainer} pointerEvents="none">
          <WebView
            originWhitelist={['*']}
            source={{
              html: `
                <!DOCTYPE html>
                <html>
                <head><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
                <body>
                <script>
                  let ctx = null;
                  let loopTimer = null;

                  function getAudioContext() {
                    if (!ctx) {
                      const AudioCtx = window.AudioContext || window.webkitAudioContext;
                      ctx = new AudioCtx();
                    }
                    if (ctx.state === 'suspended') {
                      ctx.resume();
                    }
                    return ctx;
                  }

                  function beep(freq, duration, delay) {
                    setTimeout(() => {
                      try {
                        const c = getAudioContext();
                        const osc = c.createOscillator();
                        const gain = c.createGain();
                        osc.type = 'sawtooth';
                        osc.frequency.setValueAtTime(freq, c.currentTime);
                        gain.gain.setValueAtTime(0.5, c.currentTime);
                        gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);
                        osc.connect(gain);
                        gain.connect(c.destination);
                        osc.start();
                        osc.stop(c.currentTime + duration);
                      } catch(e) {}
                    }, delay);
                  }

                  function triggerChirpPattern() {
                    // Loud rhythmic athletic alarm tone (A5 880Hz & C6 1046Hz)
                    beep(880, 0.14, 0);
                    beep(1046, 0.14, 180);
                    beep(880, 0.14, 360);
                    beep(1046, 0.22, 540);
                  }

                  // Auto-start immediately
                  triggerChirpPattern();
                  loopTimer = setInterval(triggerChirpPattern, 1100);
                </script>
                </body>
                </html>
              `,
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
          />
        </View>

        <View style={[styles.card, { backgroundColor: theme.cardElevated, borderColor: '#FF2D55' }]}>
          {/* TOP TAG */}
          <View style={styles.topBadgeRow}>
            <View style={styles.alarmBadge}>
              <Flame size={14} color="#FF2D55" />
              <Text style={styles.alarmBadgeText}>SCHEDULED WORKOUT ALARM</Text>
            </View>
          </View>

          {/* PULSING BELL ICON */}
          <View style={styles.iconContainer}>
            <Animated.View
              style={[
                styles.rippleRing,
                {
                  transform: [{ scale: rippleAnim }],
                  opacity: pulseAnim.interpolate({
                    inputRange: [1, 1.18],
                    outputRange: [0.6, 0.15],
                  }),
                },
              ]}
            />
            <Animated.View
              style={[
                styles.bellCircle,
                {
                  backgroundColor: '#FF2D55',
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Bell size={42} color="#FFFFFF" />
            </Animated.View>
          </View>

          {/* TIME DISPLAY */}
          <View style={styles.timeRow}>
            <Text style={[styles.timeDigits, { color: theme.text }]}>
              {alarm.timeStr}
            </Text>
            <Text style={styles.timePeriod}>{alarm.period}</Text>
          </View>

          {/* ALARM TITLE & SUBTEXT */}
          <Text style={[styles.alarmTitle, { color: theme.text }]} numberOfLines={2}>
            {alarm.title}
          </Text>
          <Text style={[styles.alarmSubtitle, { color: theme.subtext }]}>
            It's time for your scheduled training session. Stay disciplined and hit your targets today!
          </Text>

          {/* ACTIONS */}
          <View style={styles.actionsContainer}>
            {/* 1. START WORKOUT NOW */}
            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onStartWorkout(alarm.title);
              }}
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.85}
            >
              <Play size={18} color={theme.primaryText} fill={theme.primaryText} />
              <Text style={[styles.primaryActionBtnText, { color: theme.primaryText }]}>
                Start Workout Now
              </Text>
            </TouchableOpacity>

            {/* 2. SNOOZE & DISMISS ROW (TWO COLUMNS) */}
            <View style={styles.secondaryActionsRow}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  onSnooze(5);
                }}
                style={[styles.secondaryActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Clock size={16} color={theme.text} />
                <Text style={[styles.secondaryActionBtnText, { color: theme.text }]}>
                  Snooze 5 Min
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  onDismiss();
                }}
                style={[styles.secondaryActionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <X size={16} color="#FF2D55" />
                <Text style={[styles.secondaryActionBtnText, { color: '#FF2D55' }]}>
                  Dismiss
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  hiddenAudioContainer: {
    width: 0,
    height: 0,
    opacity: 0,
    position: 'absolute',
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    borderWidth: 2,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 20,
  },
  topBadgeRow: {
    marginBottom: 20,
  },
  alarmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FF2D5520',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF2D5540',
  },
  alarmBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#FF2D55',
    letterSpacing: 0.8,
  },
  iconContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  rippleRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF2D55',
  },
  bellCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF2D55',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 10,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  timeDigits: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
  },
  timePeriod: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FF2D55',
  },
  alarmTitle: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  alarmSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
    marginBottom: 24,
  },
  actionsContainer: {
    width: '100%',
    gap: 12,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 16,
    width: '100%',
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
