import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import {
  ShieldCheck,
  X,
  Footprints,
  Camera,
  Image as ImageIcon,
  Cpu,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useHardwarePermissions } from '../hooks/useHardwarePermissions';
import { HardwareCapability } from '../services/hardwarePermissions';

interface HardwarePermissionsModalProps {
  visible: boolean;
  onClose: () => void;
  theme: any;
  targetFocus?: HardwareCapability;
}

export const HardwarePermissionsModal: React.FC<HardwarePermissionsModalProps> = ({
  visible,
  onClose,
  theme,
  targetFocus,
}) => {
  const {
    permissions,
    isLoading,
    allGranted,
    requestPermission,
    requestAll,
    refreshPermissions,
  } = useHardwarePermissions();

  const handleRequest = async (id: HardwareCapability) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const success = await requestPermission(id);
    if (success) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleGrantAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    await requestAll();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleOpenSettings = () => {
    Haptics.selectionAsync();
    Linking.openSettings();
  };

  const getIcon = (id: HardwareCapability) => {
    switch (id) {
      case 'motion':
        return <Footprints size={20} color={theme.primary} />;
      case 'camera':
        return <Camera size={20} color="#FF2D55" />;
      case 'mediaLibrary':
        return <ImageIcon size={20} color="#00F0FF" />;
      case 'sensors':
        return <Cpu size={20} color="#34C759" />;
      default:
        return <ShieldCheck size={20} color={theme.primary} />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          {/* HEADER */}
          <View style={[styles.headerRow, { borderBottomColor: theme.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View style={[styles.iconBox, { backgroundColor: `${theme.primary}20` }]}>
                <ShieldCheck size={20} color={theme.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Hardware & Sensor Permissions</Text>
                <Text style={[styles.headerSub, { color: theme.subtext }]}>
                  Privacy-first athlete consent for on-device tracking
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: theme.cardElevated, borderColor: theme.border }]}
            >
              <X size={18} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* PRIVACY GUARANTEE BANNER */}
            <View style={[styles.privacyCard, { backgroundColor: `${theme.primary}12`, borderColor: `${theme.primary}40` }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Lock size={15} color={theme.primary} />
                <Text style={[styles.privacyTitle, { color: theme.primary }]}>100% On-Device Privacy Architecture</Text>
              </View>
              <Text style={[styles.privacyDesc, { color: theme.subtext }]}>
                Amped processes all motion kinematics, step signals, and camera capillary optical waveforms strictly in memory on your physical smartphone. No video or raw motion logs are ever stored or uploaded off-device.
              </Text>
            </View>

            {/* PERMISSION CARDS LIST */}
            <View style={{ gap: 12 }}>
              {permissions.map((item) => {
                const isFocused = targetFocus === item.id;
                const isDenied = item.status === 'denied';
                const isGranted = item.isGranted;

                return (
                  <View
                    key={item.id}
                    style={[
                      styles.permissionCard,
                      {
                        backgroundColor: theme.cardElevated,
                        borderColor: isFocused
                          ? theme.primary
                          : isGranted
                          ? `${theme.border}`
                          : '#FF950060',
                      },
                    ]}
                  >
                    {/* Top Row: Icon + Title + Status Badge */}
                    <View style={styles.cardHeaderRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                        <View style={[styles.permIconBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                          {getIcon(item.id)}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.permTitle, { color: theme.text }]}>{item.title}</Text>
                          <Text style={[styles.permSub, { color: theme.subtext }]}>{item.subtitle}</Text>
                        </View>
                      </View>

                      {/* Status Badge */}
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isGranted
                              ? '#34C75920'
                              : isDenied
                              ? '#FF3B3020'
                              : '#FF950020',
                          },
                        ]}
                      >
                        {isGranted ? (
                          <CheckCircle2 size={12} color="#34C759" />
                        ) : (
                          <AlertCircle size={12} color={isDenied ? '#FF3B30' : '#FF9500'} />
                        )}
                        <Text
                          style={[
                            styles.statusBadgeText,
                            {
                              color: isGranted
                                ? '#34C759'
                                : isDenied
                                ? '#FF3B30'
                                : '#FF9500',
                            },
                          ]}
                        >
                          {isGranted ? 'GRANTED' : isDenied ? 'DENIED' : 'CONSENT REQUIRED'}
                        </Text>
                      </View>
                    </View>

                    {/* Detailed Rationale */}
                    <Text style={[styles.rationaleText, { color: theme.subtext }]}>
                      {item.detailedRationale}
                    </Text>

                    {/* Features Powered Tags (2-Column Pairs) */}
                    <View style={styles.tagsContainer}>
                      <Text style={[styles.tagsLabel, { color: theme.subtext }]}>POWERS IN AMPED:</Text>
                      <View style={{ gap: 6, marginTop: 4 }}>
                        {[0, 2].map((startIdx) => {
                          const tag1 = item.requiredFor[startIdx];
                          const tag2 = item.requiredFor[startIdx + 1];
                          if (!tag1) return null;
                          return (
                            <View key={startIdx} style={{ flexDirection: 'row', gap: 6 }}>
                              <View style={[styles.featureTag, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Text style={[styles.featureTagText, { color: theme.text }]} numberOfLines={1}>
                                  • {tag1}
                                </Text>
                              </View>
                              {tag2 ? (
                                <View style={[styles.featureTag, { flex: 1, backgroundColor: theme.card, borderColor: theme.border }]}>
                                  <Text style={[styles.featureTagText, { color: theme.text }]} numberOfLines={1}>
                                    • {tag2}
                                  </Text>
                                </View>
                              ) : (
                                <View style={{ flex: 1 }} />
                              )}
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Action Button */}
                    <View style={{ marginTop: 10 }}>
                      {isGranted ? (
                        <View style={[styles.actionRowGranted, { backgroundColor: `${theme.card}` }]}>
                          <CheckCircle2 size={15} color="#34C759" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#34C759' }}>
                            Hardware Sensor Active & Authorized
                          </Text>
                        </View>
                      ) : isDenied ? (
                        <TouchableOpacity
                          onPress={handleOpenSettings}
                          style={[styles.actionBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
                        >
                          <ExternalLink size={14} color={theme.text} />
                          <Text style={[styles.actionBtnText, { color: theme.text }]}>
                            Open Device Settings to Enable
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleRequest(item.id)}
                          style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                        >
                          <ShieldCheck size={14} color={theme.primaryText} />
                          <Text style={[styles.actionBtnText, { color: theme.primaryText }]}>
                            Grant {item.title} Access
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>

            {/* MASTER CTA: GRANT ALL OR STATUS */}
            {!allGranted && (
              <TouchableOpacity
                onPress={handleGrantAll}
                activeOpacity={0.85}
                style={[styles.grantAllBtn, { backgroundColor: theme.primary }]}
              >
                <Sparkles size={18} color={theme.primaryText} />
                <Text style={[styles.grantAllBtnText, { color: theme.primaryText }]}>
                  Enable All Sensor & Hardware Capabilities
                </Text>
              </TouchableOpacity>
            )}

            {allGranted && (
              <View style={[styles.allGrantedBox, { backgroundColor: '#34C75915', borderColor: '#34C75950' }]}>
                <CheckCircle2 size={18} color="#34C759" />
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#34C759' }}>
                  All 15+ Hardware & Sensor Pipelines Fully Authorized
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '92%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingTop: 18,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  privacyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  privacyDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  permissionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  permIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  permTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  permSub: {
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  rationaleText: {
    fontSize: 11.5,
    lineHeight: 17,
    marginTop: 10,
  },
  tagsContainer: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  tagsLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  featureTag: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  featureTagText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  actionRowGranted: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  grantAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 18,
  },
  grantAllBtnText: {
    fontSize: 14,
    fontWeight: '900',
  },
  allGrantedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 18,
  },
});

