// Enhanced local database with better error handling and fallbacks
export interface LocalAttendanceEntry {
  id?: number;
  studentId: string;
  fullName: string;
  gradeLevel: string;
  strand: string;
  section: string;
  lrnNumber: string;
  timestamp: number;
  date: string;
  scannedBy: string;
  synced: boolean;
  convexId?: string;
}

export interface CachedStudent {
  _id: string;
  fullName: string;
  gradeLevel: string;
  strand: string;
  section: string;
  lrnNumber: string;
  cachedAt: number;
}

class LocalDatabase {
  private storageKey = 'tagsci_attendance_logs';
  private studentsKey = 'tagsci_students_cache';
  private initialized = false;

  // Always use localStorage for web compatibility
  async init(): Promise<void> {
    if (this.initialized) return;
    
    try {
      this.ensureStorage();
      console.log('Local database initialized with localStorage');
      this.initialized = true;
      
      // Clean old cache entries (older than 7 days)
      await this.cleanOldCache();
    } catch (error) {
      console.error('Failed to initialize local database:', error);
      throw error;
    }
  }

  private ensureStorage(): void {
    if (typeof window === 'undefined' || !window.localStorage) {
      throw new Error('localStorage not available');
    }
  }

  private async cleanOldCache(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.studentsKey) || '{}';
      const students = JSON.parse(stored);
      const weekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      
      let cleaned = false;
      for (const [lrn, student] of Object.entries(students)) {
        const cachedStudent = student as CachedStudent;
        if (cachedStudent.cachedAt && cachedStudent.cachedAt < weekAgo) {
          delete students[lrn];
          cleaned = true;
        }
      }
      
      if (cleaned) {
        localStorage.setItem(this.studentsKey, JSON.stringify(students));
        console.log('Cleaned old cached students');
      }
    } catch (error) {
      console.error('Failed to clean old cache:', error);
    }
  }

  async saveAttendanceLocally(entry: Omit<LocalAttendanceEntry, 'id' | 'synced'>): Promise<number> {
    await this.init();
    
    try {
      const stored = localStorage.getItem(this.storageKey) || '[]';
      const logs = JSON.parse(stored);
      const id = Date.now() + Math.random(); // Ensure unique ID
      
      const newEntry = { ...entry, id, synced: false };
      logs.push(newEntry);
      
      localStorage.setItem(this.storageKey, JSON.stringify(logs));
      console.log('Saved attendance locally:', newEntry);
      
      return id;
    } catch (error) {
      console.error('Failed to save attendance locally:', error);
      throw error;
    }
  }

  async getUnsyncedEntries(): Promise<LocalAttendanceEntry[]> {
    await this.init();
    
    try {
      const stored = localStorage.getItem(this.storageKey) || '[]';
      const logs = JSON.parse(stored);
      
      return logs.filter((log: LocalAttendanceEntry) => !log.synced);
    } catch (error) {
      console.error('Failed to get unsynced entries:', error);
      return [];
    }
  }

  async markAsSynced(localId: number, convexId: string): Promise<void> {
    await this.init();
    
    try {
      const stored = localStorage.getItem(this.storageKey) || '[]';
      const logs = JSON.parse(stored);
      
      const updated = logs.map((log: LocalAttendanceEntry) => 
        log.id === localId ? { ...log, synced: true, convexId } : log
      );
      
      localStorage.setItem(this.storageKey, JSON.stringify(updated));
      console.log('Marked as synced:', localId, convexId);
    } catch (error) {
      console.error('Failed to mark as synced:', error);
      throw error;
    }
  }

  async getTodayAttendanceLocally(): Promise<LocalAttendanceEntry[]> {
    await this.init();
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem(this.storageKey) || '[]';
      const logs = JSON.parse(stored);
      
      return logs
        .filter((log: LocalAttendanceEntry) => log.date === today)
        .sort((a: LocalAttendanceEntry, b: LocalAttendanceEntry) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get today attendance locally:', error);
      return [];
    }
  }

  async getAllLocalAttendance(): Promise<LocalAttendanceEntry[]> {
    await this.init();
    
    try {
      const stored = localStorage.getItem(this.storageKey) || '[]';
      const logs = JSON.parse(stored);
      
      return logs.sort((a: LocalAttendanceEntry, b: LocalAttendanceEntry) => b.timestamp - a.timestamp);
    } catch (error) {
      console.error('Failed to get all local attendance:', error);
      return [];
    }
  }

  async checkDuplicateAttendance(studentId: string, date: string): Promise<boolean> {
    await this.init();
    
    try {
      const stored = localStorage.getItem(this.storageKey) || '[]';
      const logs = JSON.parse(stored);
      
      return logs.some((log: LocalAttendanceEntry) => 
        log.studentId === studentId && log.date === date
      );
    } catch (error) {
      console.error('Failed to check duplicate attendance:', error);
      return false;
    }
  }

  // Cache students for offline access
  async cacheStudent(student: any): Promise<void> {
    await this.init();
    
    try {
      const stored = localStorage.getItem(this.studentsKey) || '{}';
      const students = JSON.parse(stored);
      
      const cachedStudent: CachedStudent = {
        ...student,
        cachedAt: Date.now(),
      };
      
      students[student.lrnNumber] = cachedStudent;
      localStorage.setItem(this.studentsKey, JSON.stringify(students));
      console.log('Cached student:', student.lrnNumber);
    } catch (error) {
      console.error('Failed to cache student:', error);
    }
  }

  async getCachedStudent(lrnNumber: string): Promise<CachedStudent | null> {
    await this.init();
    
    try {
      const stored = localStorage.getItem(this.studentsKey) || '{}';
      const students = JSON.parse(stored);
      
      return students[lrnNumber] || null;
    } catch (error) {
      console.error('Failed to get cached student:', error);
      return null;
    }
  }

  async getAllCachedStudents(): Promise<CachedStudent[]> {
    await this.init();
    
    try {
      const stored = localStorage.getItem(this.studentsKey) || '{}';
      const students = JSON.parse(stored);
      
      return Object.values(students) as CachedStudent[];
    } catch (error) {
      console.error('Failed to get all cached students:', error);
      return [];
    }
  }

  async clearAllData(): Promise<void> {
    await this.init();
    
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.studentsKey);
      console.log('Cleared all local data');
    } catch (error) {
      console.error('Failed to clear local data:', error);
      throw error;
    }
  }

  async getStorageStats(): Promise<{ attendanceCount: number; studentsCount: number; syncedCount: number }> {
    await this.init();
    
    try {
      const attendanceLogs = JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      const students = JSON.parse(localStorage.getItem(this.studentsKey) || '{}');
      
      const syncedCount = attendanceLogs.filter((log: LocalAttendanceEntry) => log.synced).length;
      
      return {
        attendanceCount: attendanceLogs.length,
        studentsCount: Object.keys(students).length,
        syncedCount,
      };
    } catch (error) {
      console.error('Failed to get storage stats:', error);
      return { attendanceCount: 0, studentsCount: 0, syncedCount: 0 };
    }
  }
}

export const localDB = new LocalDatabase();
