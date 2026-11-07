import { Pedometer, Accelerometer, Gyroscope, Barometer } from 'expo-sensors';
import * as ImagePicker from 'expo-image-picker';
import { Camera } from 'expo-camera';
import { Platform } from 'react-native';

export type HardwareCapability = 'motion' | 'camera' | 'mediaLibrary' | 'sensors';
export type HardwarePermissionStatus = 'granted' | 'denied' | 'undetermined' | 'unavailable';

export interface HardwarePermissionDescriptor {
  id: HardwareCapability;
  title: string;
  subtitle: string;
  detailedRationale: string;
  category: 'Motion & Locomotion' | 'Optical & Vision' | 'Storage & Assets' | 'Motion Kinematics';
  status: HardwarePermissionStatus;
  isGranted: boolean;
  isHardwareAvailable: boolean;
  requiredFor: string[];
}

/**
 * Check Motion & Step Pedometer permission
 */
export const checkMotionPermission = async (): Promise<HardwarePermissionStatus> => {
  try {
    const isAvail = await Pedometer.isAvailableAsync();
    if (!isAvail) return 'unavailable';

    const res = await Pedometer.getPermissionsAsync();
    if (res.granted || res.status === 'granted') return 'granted';
    if (res.status === 'denied') return 'denied';
    return 'undetermined';
  } catch (error) {
    console.warn('[HardwarePermissions] Motion check failed:', error);
    return 'undetermined';
  }
};

/**
 * Request Motion & Step Pedometer permission from OS
 */
export const requestMotionPermission = async (): Promise<boolean> => {
  try {
    const isAvail = await Pedometer.isAvailableAsync();
    if (!isAvail) return false;

    const res = await Pedometer.requestPermissionsAsync();
    return res.granted || res.status === 'granted';
  } catch (error) {
    console.warn('[HardwarePermissions] Motion request error:', error);
    return false;
  }
};

/**
 * Check Camera permission (Optical PPG & AI Food Scanner)
 */
export const checkCameraPermission = async (): Promise<HardwarePermissionStatus> => {
  try {
    const res = await Camera.getCameraPermissionsAsync();
    if (res.granted || res.status === 'granted') return 'granted';
    if (res.status === 'denied') return 'denied';
    return 'undetermined';
  } catch (error) {
    try {
      const res = await ImagePicker.getCameraPermissionsAsync();
      if (res.granted || res.status === 'granted') return 'granted';
      if (res.status === 'denied') return 'denied';
    } catch {}
    return 'undetermined';
  }
};

/**
 * Request Camera permission
 */
export const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const res = await Camera.requestCameraPermissionsAsync();
    if (res.granted || res.status === 'granted') return true;
    const res2 = await ImagePicker.requestCameraPermissionsAsync();
    return res2.granted || res2.status === 'granted';
  } catch (error) {
    try {
      const res = await ImagePicker.requestCameraPermissionsAsync();
      return res.granted || res.status === 'granted';
    } catch {}
    return false;
  }
};

/**
 * Check Media Library / Photo Gallery permission
 */
export const checkMediaLibraryPermission = async (): Promise<HardwarePermissionStatus> => {
  try {
    const res = await ImagePicker.getMediaLibraryPermissionsAsync();
    if (res.granted || res.status === 'granted') return 'granted';
    if (res.status === 'denied') return 'denied';
    return 'undetermined';
  } catch (error) {
    console.warn('[HardwarePermissions] Media library check failed:', error);
    return 'undetermined';
  }
};

/**
 * Request Media Library permission
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  try {
    const res = await ImagePicker.requestMediaLibraryPermissionsAsync();
    return res.granted || res.status === 'granted';
  } catch (error) {
    console.warn('[HardwarePermissions] Media library request error:', error);
    return false;
  }
};

/**
 * Check Hardware Sensor availability (Accelerometer, Gyroscope, Barometer)
 */
export const checkSensorsAvailability = async (): Promise<{
  accelerometer: boolean;
  gyroscope: boolean;
  barometer: boolean;
}> => {
  try {
    const [accel, gyro, baro] = await Promise.all([
      Accelerometer.isAvailableAsync().catch(() => false),
      Gyroscope.isAvailableAsync().catch(() => false),
      Barometer.isAvailableAsync().catch(() => false),
    ]);
    return { accelerometer: accel, gyroscope: gyro, barometer: baro };
  } catch (e) {
    return { accelerometer: true, gyroscope: true, barometer: false };
  }
};

/**
 * Master query: returns full descriptors for all hardware features
 */
export const getAllHardwarePermissions = async (): Promise<HardwarePermissionDescriptor[]> => {
  const [motionStatus, cameraStatus, mediaStatus, sensorAvail] = await Promise.all([
    checkMotionPermission(),
    checkCameraPermission(),
    checkMediaLibraryPermission(),
    checkSensorsAvailability(),
  ]);

  return [
    {
      id: 'motion',
      title: 'Motion & Pedometer',
      subtitle: 'Hardware step detector & stride cadence',
      detailedRationale:
        'Apmed uses your device motion coprocessor to count daily steps, track stride cadence (SPM), and calibrate distance without GPS battery drain.',
      category: 'Motion & Locomotion',
      status: motionStatus,
      isGranted: motionStatus === 'granted',
      isHardwareAvailable: motionStatus !== 'unavailable',
      requiredFor: ['Step Telemetry', 'Cadence SPM', 'Active Burn Tracker', 'Activity Rings'],
    },
    {
      id: 'camera',
      title: 'Camera & Optical Sensor',
      subtitle: 'AI Food Scanner & Optical PPG',
      detailedRationale:
        'Used for AI meal macro-scanning and optical photoplethysmography (PPG) to measure micro-capillary blood pulsation at your fingertip for resting heart rate & HRV. Processed purely in memory.',
      category: 'Optical & Vision',
      status: cameraStatus,
      isGranted: cameraStatus === 'granted',
      isHardwareAvailable: true,
      requiredFor: ['Camera PPG Heart Rate', 'Autonomic HRV', 'AI Macro Food Scanner', 'Avatar Capture'],
    },
    {
      id: 'mediaLibrary',
      title: 'Photo Library',
      subtitle: 'Meal photo import & athlete profile',
      detailedRationale:
        'Allows selecting previously saved meal pictures from your photo gallery for nutrition analysis and setting your profile photo.',
      category: 'Storage & Assets',
      status: mediaStatus,
      isGranted: mediaStatus === 'granted',
      isHardwareAvailable: true,
      requiredFor: ['Meal Photo Import', 'Profile Photo Upload'],
    },
    {
      id: 'sensors',
      title: 'IMU Motion Kinematics',
      subtitle: '3-Axis Accelerometer & Gyroscope',
      detailedRationale:
        'Provides real-time barbell tilt angle detection (Lopsided bar warning), Velocity-Based Training (VBT m/s), and physical shake gestures. Always active via device hardware.',
      category: 'Motion Kinematics',
      status: 'granted',
      isGranted: true,
      isHardwareAvailable: sensorAvail.accelerometer || sensorAvail.gyroscope,
      requiredFor: ['Barbell Tilt Balance', 'VBT Velocity (m/s)', 'Rep Motion Counting', 'Shake to Undo'],
    },
  ];
};

/**
 * Request all permissions sequentially with user consent
 */
export const requestAllHardwarePermissions = async (): Promise<{
  motion: boolean;
  camera: boolean;
  mediaLibrary: boolean;
}> => {
  const motion = await requestMotionPermission();
  const camera = await requestCameraPermission();
  const mediaLibrary = await requestMediaLibraryPermission();

  return { motion, camera, mediaLibrary };
};

