import { localDB, LocalAttendanceEntry } from './database';
import { api } from '../../convex/_generated/api';
import { ConvexReactClient } from 'convex/react';

class SyncService {
  private convexClient: ConvexReactClient | null = null;
  private syncInProgress = false;
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 2000;
  private syncInterval: NodeJS.Timeout | null = null;

  setConvexClient(client: ConvexReactClient) {
    this.convexClient = client;
    console.log('Sync service initialized with Convex client');
  }

  async syncToConvex(): Promise<void> {
    if (this.syncInProgress || !this.convexClient) {
      return;
    }

    this.syncInProgress = true;
    
    try {
      const unsyncedEntries = await localDB.getUnsyncedEntries();
      
      if (unsyncedEntries.length === 0) {
        this.syncInProgress = false;
        return;
      }

      console.log(`Syncing ${unsyncedEntries.length} entries to Convex...`);

      for (const entry of unsyncedEntries) {
        try {
          // First, try to find or create the student
          let student = await this.convexClient.query(api.students.getStudentByLrn, {
            lrnNumber: entry.lrnNumber
          });

          if (!student) {
            // Create student if not exists
            const studentId = await this.convexClient.mutation(api.students.createStudent, {
              fullName: entry.fullName,
              gradeLevel: entry.gradeLevel,
              strand: entry.strand,
              section: entry.section,
              lrnNumber: entry.lrnNumber,
            });
            
            // Get the created student
            student = await this.convexClient.query(api.students.getStudentByLrn, {
              lrnNumber: entry.lrnNumber
            });
          }

          if (!student) {
            throw new Error('Failed to create or find student');
          }

          // Log attendance
          const convexId = await this.convexClient.mutation(api.attendance.logAttendance, {
            studentId: student._id,
            fullName: entry.fullName,
            gradeLevel: entry.gradeLevel,
            strand: entry.strand,
            section: entry.section,
            lrnNumber: entry.lrnNumber,
          });
          
          if (entry.id) {
            await localDB.markAsSynced(entry.id, convexId);
          }
          
          console.log(`Synced entry for ${entry.fullName}`);
        } catch (error: any) {
          console.error(`Failed to sync entry for ${entry.fullName}:`, error);
          
          // If it's a duplicate error, mark as synced anyway
          if (error.message?.includes('already recorded')) {
            if (entry.id) {
              await localDB.markAsSynced(entry.id, 'duplicate');
            }
          } else {
            throw error;
          }
        }
      }

      this.retryCount = 0;
      console.log('Sync completed successfully');
      
    } catch (error) {
      console.error('Sync failed:', error);
      await this.handleSyncError();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async handleSyncError(): Promise<void> {
    this.retryCount++;
    
    if (this.retryCount < this.maxRetries) {
      console.log(`Retrying sync in ${this.retryDelay}ms (attempt ${this.retryCount}/${this.maxRetries})`);
      setTimeout(() => {
        this.syncToConvex();
      }, this.retryDelay);
      
      this.retryDelay *= 2;
    } else {
      console.log('Max retry attempts reached. Will try again later.');
      this.retryCount = 0;
      this.retryDelay = 2000;
    }
  }

  async startPeriodicSync(): Promise<void> {
    // Clear any existing interval
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    // Sync every 30 seconds when online
    this.syncInterval = setInterval(async () => {
      if (this.isOnline()) {
        await this.syncToConvex();
      }
    }, 30000);

    // Also sync when coming back online
    if (typeof window !== 'undefined') {
      const handleOnline = () => {
        console.log('Device came online, starting sync...');
        setTimeout(() => this.syncToConvex(), 1000);
      };

      // Remove existing listener if any
      window.removeEventListener('online', handleOnline);
      window.addEventListener('online', handleOnline);
    }
  }

  stopPeriodicSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  private isOnline(): boolean {
    if (typeof navigator !== 'undefined' && navigator.onLine !== undefined) {
      return navigator.onLine;
    }
    return true;
  }

  async forceSync(): Promise<void> {
    await this.syncToConvex();
  }

  getSyncStatus(): { inProgress: boolean; retryCount: number } {
    return {
      inProgress: this.syncInProgress,
      retryCount: this.retryCount,
    };
  }
}

export const syncService = new SyncService();
