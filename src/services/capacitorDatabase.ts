// Capacitor-specific database implementation for mobile builds
import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';
import { LocalAttendanceEntry } from './database';

class CapacitorDatabase {
  private sqlite: SQLiteConnection;
  private db: SQLiteDBConnection | null = null;
  private isInitialized = false;

  constructor() {
    this.sqlite = new SQLiteConnection(CapacitorSQLite);
  }

  async init(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        // Initialize for native platforms (iOS/Android)
        const ret = await this.sqlite.checkConnectionsConsistency();
        const isConn = (await this.sqlite.isConnection("attendance", false)).result;
        
        if (ret.result && isConn) {
          this.db = await this.sqlite.retrieveConnection("attendance", false);
        } else {
          this.db = await this.sqlite.createConnection("attendance", false, "no-encryption", 1, false);
        }
        
        await this.db.open();
        await this.createTables();
        this.isInitialized = true;
      }
    } catch (error) {
      console.error('Failed to initialize Capacitor SQLite:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) return;

    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS attendance_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        studentId TEXT NOT NULL,
        fullName TEXT NOT NULL,
        gradeLevel TEXT NOT NULL,
        strand TEXT NOT NULL,
        section TEXT NOT NULL,
        lrnNumber TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        date TEXT NOT NULL,
        scannedBy TEXT NOT NULL,
        synced INTEGER DEFAULT 0,
        convexId TEXT,
        UNIQUE(studentId, date)
      );
    `;

    await this.db.execute(createTableQuery);
  }

  async saveAttendanceLocally(entry: Omit<LocalAttendanceEntry, 'id' | 'synced'>): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO attendance_logs 
      (studentId, fullName, gradeLevel, strand, section, lrnNumber, timestamp, date, scannedBy, synced) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    const result = await this.db.run(query, [
      entry.studentId,
      entry.fullName,
      entry.gradeLevel,
      entry.strand,
      entry.section,
      entry.lrnNumber,
      entry.timestamp,
      entry.date,
      entry.scannedBy
    ]);

    return result.changes?.lastId || 0;
  }

  async getUnsyncedEntries(): Promise<LocalAttendanceEntry[]> {
    if (!this.db) return [];

    const result = await this.db.query('SELECT * FROM attendance_logs WHERE synced = 0 ORDER BY timestamp ASC');
    return result.values || [];
  }

  async markAsSynced(localId: number, convexId: string): Promise<void> {
    if (!this.db) return;

    await this.db.run(
      'UPDATE attendance_logs SET synced = 1, convexId = ? WHERE id = ?',
      [convexId, localId]
    );
  }

  async getTodayAttendanceLocally(): Promise<LocalAttendanceEntry[]> {
    if (!this.db) return [];

    const today = new Date().toISOString().split('T')[0];
    const result = await this.db.query(
      'SELECT * FROM attendance_logs WHERE date = ? ORDER BY timestamp DESC',
      [today]
    );

    return result.values || [];
  }

  async checkDuplicateAttendance(studentId: string, date: string): Promise<boolean> {
    if (!this.db) return false;

    const result = await this.db.query(
      'SELECT id FROM attendance_logs WHERE studentId = ? AND date = ?',
      [studentId, date]
    );

    return (result.values?.length || 0) > 0;
  }

  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.isInitialized = false;
    }
  }
}

export const capacitorDB = new CapacitorDatabase();
