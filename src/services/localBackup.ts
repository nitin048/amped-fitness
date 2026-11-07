import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '../db/database';

export const exportDatabaseBackup = async (): Promise<boolean> => {
  try {
    const dbDir = `${FileSystem.documentDirectory}SQLite/`;
    const dbPath = `${dbDir}amped.db`;

    const info = await FileSystem.getInfoAsync(dbPath);
    if (!info.exists) {
      // Check root documentDirectory just in case
      const rootDbPath = `${FileSystem.documentDirectory}amped.db`;
      const rootInfo = await FileSystem.getInfoAsync(rootDbPath);
      if (!rootInfo.exists) {
        throw new Error('Database file not found');
      }
      return await shareFile(rootDbPath);
    }

    return await shareFile(dbPath);
  } catch (error) {
    console.error('Failed to export backup:', error);
    return false;
  }
};

const shareFile = async (filePath: string): Promise<boolean> => {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('Sharing not available on this device');
  }
  const backupPath = `${FileSystem.cacheDirectory}amped_backup_${Date.now()}.ampedbackup`;
  await FileSystem.copyAsync({ from: filePath, to: backupPath });
  await Sharing.shareAsync(backupPath, {
    mimeType: 'application/octet-stream',
    dialogTitle: 'Export Apmed Workout & Nutrition Backup',
    UTI: 'public.database',
  });
  return true;
};

export const importDatabaseBackup = async (): Promise<boolean> => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      type: '*/*',
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return false;
    }

    const selectedFile = result.assets[0];
    const targetDir = `${FileSystem.documentDirectory}SQLite/`;
    const targetDbPath = `${targetDir}amped.db`;

    const dirInfo = await FileSystem.getInfoAsync(targetDir);
    if (!dirInfo.exists) {
      await FileSystem.makeDirectoryAsync(targetDir, { intermediates: true });
    }

    await FileSystem.copyAsync({
      from: selectedFile.uri,
      to: targetDbPath,
    });

    // Check PRAGMA integrity
    db.execSync('PRAGMA integrity_check;');
    return true;
  } catch (error) {
    console.error('Failed to import backup:', error);
    return false;
  }
};

