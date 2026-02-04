import { useState, useEffect, useCallback } from "react";
import { localDB, LocalAttendanceEntry } from "../services/database";
import { syncService } from "../services/syncService";
import { connectionMonitor } from "../services/connectionMonitor";
import { toast } from "sonner";

export function useOfflineAttendance() {
  const [isOnline, setIsOnline] = useState(connectionMonitor.getStatus());
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let mounted = true;

    const initializeOfflineSystem = async () => {
      try {
        // Initialize local database
        await localDB.init();

        if (mounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("Failed to initialize offline system:", error);
        if (mounted) {
          toast.error("Failed to initialize offline storage");
        }
      }
    };

    initializeOfflineSystem();

    // Monitor connection status
    const handleConnectionChange = (online: boolean) => {
      if (!mounted) return;

      setIsOnline(online);
      if (online) {
        toast.success("Connection restored - syncing data...");
        syncService.forceSync().catch(console.error);
      } else {
        toast.info(
          "Working offline - data will sync when connection is restored",
        );
      }
    };

    connectionMonitor.addListener(handleConnectionChange);

    // Check pending sync count periodically
    const checkPendingSync = async () => {
      if (!mounted) return;

      try {
        const unsynced = await localDB.getUnsyncedEntries();
        if (mounted) {
          setPendingSyncCount(unsynced.length);
        }
      } catch (error) {
        console.error("Failed to check pending sync:", error);
      }
    };

    const interval = setInterval(checkPendingSync, 5000);
    checkPendingSync(); // Initial check

    return () => {
      mounted = false;
      connectionMonitor.removeListener(handleConnectionChange);
      clearInterval(interval);
    };
  }, []);

  const logAttendanceOffline = async (attendanceData: {
    studentId: string;
    fullName: string;
    gradeLevel: string;
    strand: string;
    section: string;
    lrnNumber: string;
    scannedBy: string;
  }): Promise<void> => {
    if (!isInitialized) {
      throw new Error("Offline system not initialized");
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Check for duplicate in local database first
    const isDuplicate = await localDB.checkDuplicateAttendance(
      attendanceData.studentId,
      today,
    );
    if (isDuplicate) {
      throw new Error("Attendance already recorded for this student today");
    }

    // Save to local database
    const localEntry = {
      ...attendanceData,
      timestamp: now.getTime(),
      date: today,
    };

    await localDB.saveAttendanceLocally(localEntry);

    // Try to sync immediately if online
    if (isOnline) {
      try {
        await syncService.forceSync();
      } catch (error) {
        console.log("Immediate sync failed, will retry later");
      }
    }
  };

  const getTodayAttendanceOffline = useCallback(async (): Promise<
    LocalAttendanceEntry[]
  > => {
    if (!isInitialized) {
      return [];
    }

    try {
      return await localDB.getTodayAttendanceLocally();
    } catch (error) {
      console.error("Failed to get today attendance offline:", error);
      return [];
    }
  }, [isInitialized]);

  const getAllLocalAttendance = async (): Promise<LocalAttendanceEntry[]> => {
    if (!isInitialized) {
      return [];
    }

    try {
      return await localDB.getAllLocalAttendance();
    } catch (error) {
      console.error("Failed to get all local attendance:", error);
      return [];
    }
  };

  const forceSync = async (): Promise<void> => {
    if (isOnline) {
      await syncService.forceSync();
    } else {
      toast.error("Cannot sync while offline");
    }
  };

  const clearLocalData = async (): Promise<void> => {
    try {
      await localDB.clearAllData();
      setPendingSyncCount(0);
      toast.success("Local data cleared");
    } catch (error) {
      console.error("Failed to clear local data:", error);
      toast.error("Failed to clear local data");
    }
  };

  return {
    isOnline,
    pendingSyncCount,
    isInitialized,
    logAttendanceOffline,
    getTodayAttendanceOffline,
    getAllLocalAttendance,
    forceSync,
    clearLocalData,
  };
}
