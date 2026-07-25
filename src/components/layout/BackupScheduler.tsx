// FR8X-CON Background Backup Scheduler Trigger
// Checks today's backup status and runs the automated daily database backup at 12:00 AM IST.

"use client";

import { useEffect } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { hasBackupRunToday, runAutomatedBackup } from "@/lib/utils/backup";

export default function BackupScheduler() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.uid) return;

    async function checkAndTriggerBackup() {
      try {
        const alreadyRun = await hasBackupRunToday();
        if (!alreadyRun) {
          console.log("[Backup System] No active backup found for today. Triggering automated snapshot...");
          const res = await runAutomatedBackup(user?.uid || "");
          if (res.success) {
            console.log(`[Backup System] Daily automated backup finished: ${res.backupId}`);
          } else {
            console.warn("[Backup System] Daily automated backup failed:", res.error);
          }
        }
      } catch (err) {
        console.error("[Backup System] Failed to schedule automatic backup:", err);
      }
    }

    // Delay run by 5 seconds to not impact page load performance
    const timer = setTimeout(checkAndTriggerBackup, 5000);
    return () => clearTimeout(timer);
  }, [user?.uid]);

  return null; // Silent background trigger
}
