import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  HardwareCapability,
  HardwarePermissionDescriptor,
  getAllHardwarePermissions,
  requestMotionPermission,
  requestCameraPermission,
  requestMediaLibraryPermission,
  requestAllHardwarePermissions,
} from '../services/hardwarePermissions';

export interface UseHardwarePermissionsResult {
  permissions: HardwarePermissionDescriptor[];
  isLoading: boolean;
  isMotionGranted: boolean;
  isCameraGranted: boolean;
  isMediaLibraryGranted: boolean;
  allGranted: boolean;
  refreshPermissions: () => Promise<void>;
  requestPermission: (id: HardwareCapability) => Promise<boolean>;
  requestAll: () => Promise<void>;
}

export const useHardwarePermissions = (): UseHardwarePermissionsResult => {
  const [permissions, setPermissions] = useState<HardwarePermissionDescriptor[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadPermissions = useCallback(async () => {
    try {
      const data = await getAllHardwarePermissions();
      setPermissions(data);
    } catch (e) {
      console.warn('[useHardwarePermissions] load error:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPermissions();

    // Re-check permissions when athlete returns from OS Settings
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        loadPermissions();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [loadPermissions]);

  const requestPermission = useCallback(
    async (id: HardwareCapability): Promise<boolean> => {
      let result = false;
      if (id === 'motion') {
        result = await requestMotionPermission();
      } else if (id === 'camera') {
        result = await requestCameraPermission();
      } else if (id === 'mediaLibrary') {
        result = await requestMediaLibraryPermission();
      } else if (id === 'sensors') {
        result = true;
      }
      await loadPermissions();
      return result;
    },
    [loadPermissions]
  );

  const requestAll = useCallback(async () => {
    setIsLoading(true);
    await requestAllHardwarePermissions();
    await loadPermissions();
  }, [loadPermissions]);

  const isMotionGranted = permissions.find((p) => p.id === 'motion')?.isGranted ?? false;
  const isCameraGranted = permissions.find((p) => p.id === 'camera')?.isGranted ?? false;
  const isMediaLibraryGranted = permissions.find((p) => p.id === 'mediaLibrary')?.isGranted ?? false;
  const allGranted = isMotionGranted && isCameraGranted && isMediaLibraryGranted;

  return {
    permissions,
    isLoading,
    isMotionGranted,
    isCameraGranted,
    isMediaLibraryGranted,
    allGranted,
    refreshPermissions: loadPermissions,
    requestPermission,
    requestAll,
  };
};

