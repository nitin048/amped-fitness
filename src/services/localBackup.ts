import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { db } from '../db/database';

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const len = bytes.byteLength;
  const chunkSize = 8192;
  for (let i = 0; i < len; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, len));
    for (let j = 0; j < chunk.length; j++) {
      binary += String.fromCharCode(chunk[j]);
    }
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  const globalBuf = (globalThis as any).Buffer;
  if (globalBuf && typeof globalBuf.from === 'function') {
    return globalBuf.from(binary, 'binary').toString('base64');
  }
  return '';
}

export const exportDatabaseBackup = async (): Promise<boolean> => {
  try {
    // 1. Flush any pending transactions from SQLite WAL into database
    try {
      db.execSync('PRAGMA wal_checkpoint(FULL);');
    } catch (e) {
      console.warn('[Apmed Backup] WAL checkpoint notice:', e);
    }

    // 2. Strategy 1 (Preferred): Native SQLite database serialization
    if (typeof (db as any).serializeAsync === 'function') {
      try {
        const bytes: Uint8Array = await (db as any).serializeAsync('main');
        if (bytes && bytes.byteLength > 0) {
          const backupPath = `${FileSystem.cacheDirectory}apmed_backup_${Date.now()}.ampedbackup`;
          const base64Data = uint8ArrayToBase64(bytes);
          await FileSystem.writeAsStringAsync(backupPath, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
          return await shareFile(backupPath);
        }
      } catch (serializeErr) {
        console.warn('[Apmed Backup] serializeAsync unavailable or failed, trying file copy:', serializeErr);
      }
    }

    // 3. Strategy 2: File-level copy from candidate database paths
    const candidates = [
      (db as any).databasePath,
      (db as any).databasePath ? `file://${(db as any).databasePath}` : null,
      `${FileSystem.documentDirectory}SQLite/amped.db`,
      `${FileSystem.documentDirectory}amped.db`,
    ].filter(Boolean) as string[];

    for (const candidate of candidates) {
      try {
        const info = await FileSystem.getInfoAsync(candidate);
        if (info.exists && !info.isDirectory) {
          const backupPath = `${FileSystem.cacheDirectory}apmed_backup_${Date.now()}.ampedbackup`;
          await FileSystem.copyAsync({ from: candidate, to: backupPath });
          return await shareFile(backupPath);
        }
      } catch {
        // Try next candidate
      }
    }

    // 4. Strategy 3 (Resilient Fallback): Complete structured JSON serialization of all tables
    const tableNames = [
      'exercises',
      'workout_sets',
      'workout_sessions',
      'meal_logs',
      'daily_water',
      'user_profile',
      'muscle_recovery',
      'workout_alarms',
    ];
    const backupTables: Record<string, any[]> = {};
    for (const t of tableNames) {
      try {
        backupTables[t] = db.getAllSync(`SELECT * FROM ${t}`);
      } catch {
        backupTables[t] = [];
      }
    }

    const payload = JSON.stringify(
      {
        brand: 'Apmed',
        schema_version: 1,
        exported_at: new Date().toISOString(),
        timestamp: Date.now(),
        tables: backupTables,
      },
      null,
      2
    );

    const backupPath = `${FileSystem.cacheDirectory}apmed_backup_${Date.now()}.ampedbackup`;
    await FileSystem.writeAsStringAsync(backupPath, payload, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return await shareFile(backupPath);
  } catch (error) {
    console.error('Failed to export backup:', error);
    return false;
  }
};

const shareFile = async (filePath: string): Promise<boolean> => {
  const isAvailable = await Sharing.isAvailableAsync();
  if (isAvailable) {
    await Sharing.shareAsync(filePath, {
      mimeType: 'application/octet-stream',
      dialogTitle: 'Export Apmed Workout & Nutrition Backup',
      UTI: 'public.database',
    });
    return true;
  }

  // Web fallback: trigger browser download
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const content = await FileSystem.readAsStringAsync(filePath, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    const blob = new Blob([content], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apmed_backup_${Date.now()}.ampedbackup`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  throw new Error('Sharing is not available on this device');
};

function restoreJsonBackup(tables: Record<string, any[]>): void {
  db.execSync('BEGIN TRANSACTION;');
  try {
    for (const [tableName, rows] of Object.entries(tables)) {
      if (!Array.isArray(rows)) continue;
      db.runSync(`DELETE FROM ${tableName}`);
      for (const row of rows) {
        const columns = Object.keys(row);
        if (columns.length === 0) continue;
        const placeholders = columns.map(() => '?').join(', ');
        const values = Object.values(row);
        db.runSync(
          `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders})`,
          values as any
        );
      }
    }
    db.execSync('COMMIT;');
  } catch (err) {
    db.execSync('ROLLBACK;');
    throw err;
  }
}

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

    // Check if JSON serialized backup
    try {
      const text = await FileSystem.readAsStringAsync(selectedFile.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      if (text.trim().startsWith('{')) {
        const parsed = JSON.parse(text);
        if (parsed.tables && typeof parsed.tables === 'object') {
          restoreJsonBackup(parsed.tables);
          return true;
        }
      }
    } catch {
      // Not JSON or parse failed, proceed with binary SQLite file restore
    }

    // Binary SQLite file restoration
    const targetDir = `${FileSystem.documentDirectory}SQLite/`;
    const targetDbPath = (db as any).databasePath || `${targetDir}amped.db`;

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
