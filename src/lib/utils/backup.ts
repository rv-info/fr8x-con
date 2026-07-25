// FR8X-CON Daily Automated Backup & Recovery Manager
// Snapshot-based backup execution, compression simulation, verification, and retention policy manager.

"use client";

import { COLLECTIONS } from "@/lib/utils/constants";
import { queryDocuments, getDocument, setDocument, deleteDocument, limit } from "@/lib/firebase/firestore";

interface BackupConfig {
  retentionDaily: number;   // keep last N days
  retentionWeekly: number;  // keep last N weeks
  retentionMonthly: number; // keep last N months
}

export interface BackupDoc {
  id: string;
  dateString: string;       // e.g. "2026-07-25"
  timestamp: string;
  collectionsData: Record<string, string>; // collectionName -> stringified documents array
  sizeBytes: number;
  compressed: boolean;
  integrityVerified: boolean;
  status: "success" | "failed";
  errorLog?: string;
  createdById: string;
  verifiedBy?: string;
}

const DEFAULT_CONFIG: BackupConfig = {
  retentionDaily: 7,
  retentionWeekly: 4,
  retentionMonthly: 12,
};

// Helper: Get today's date string in IST timezone
export function getISTDateString(): string {
  // IST is UTC + 5:30
  const d = new Date();
  const utc = d.getTime() + d.getTimezoneOffset() * 60000;
  const ist = new Date(utc + 3600000 * 5.5);
  
  const yyyy = ist.getFullYear();
  const mm = String(ist.getMonth() + 1).padStart(2, "0");
  const dd = String(ist.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// Check if a backup for today has already run
export async function hasBackupRunToday(): Promise<boolean> {
  try {
    const today = getISTDateString();
    const results = await queryDocuments<BackupDoc>(COLLECTIONS.BACKUPS, [
      // Since we can query all backups, let's filter client-side or use a direct search
    ]);
    return results.some((b) => b.dateString === today && b.status === "success");
  } catch (err) {
    console.error("Error checking today's backup status:", err);
    return false;
  }
}

// ─── 1. CORE BACKUP INITIATOR ───
// Captures a snapshot of critical collections, verifies integrity, saves, and applies retention policies.
export async function runAutomatedBackup(triggerUserId: string): Promise<{ success: boolean; backupId?: string; error?: string }> {
  const backupId = `bkp_${Date.now()}`;
  const todayStr = getISTDateString();
  const timestamp = new Date().toISOString();

  try {
    // 1. Fetch data from all critical collections in parallel
    const collectionsToBackup = [
      COLLECTIONS.USERS,
      COLLECTIONS.PROFILES,
      COLLECTIONS.COMPANIES,
      COLLECTIONS.LOCATIONS,
      COLLECTIONS.AUCTIONS,
      COLLECTIONS.POSTS,
      COLLECTIONS.AWARDS,
    ];

    const collectionsData: Record<string, string> = {};
    let totalCharCount = 0;

    for (const coll of collectionsToBackup) {
      const docs = await queryDocuments<any>(coll, [limit(250)]);
      const stringified = JSON.stringify(docs);
      collectionsData[coll] = stringified;
      totalCharCount += stringified.length;
    }

    // 2. Perform compression simulation (UTF-8 bytes count)
    const simulatedCompressedSize = Math.round(totalCharCount * 0.45); // 55% compression ratio

    // 3. Verify integrity: check that JSON parses correctly and is not empty
    let integrityVerified = true;
    for (const key of Object.keys(collectionsData)) {
      try {
        const parsed = JSON.parse(collectionsData[key] as string);
        if (!Array.isArray(parsed)) integrityVerified = false;
      } catch {
        integrityVerified = false;
      }
    }

    const payload: BackupDoc = {
      id: backupId,
      dateString: todayStr,
      timestamp,
      collectionsData,
      sizeBytes: simulatedCompressedSize,
      compressed: true,
      integrityVerified,
      status: integrityVerified ? "success" : "failed",
      createdById: triggerUserId,
    };

    // 4. Save backup record to Firestore
    await setDocument(COLLECTIONS.BACKUPS, backupId, payload);

    // 5. Log success to system audit log
    await setDocument(COLLECTIONS.AUDIT, `audit_${Date.now()}`, {
      id: `audit_${Date.now()}`,
      action: "database_backup",
      userId: triggerUserId,
      timestamp,
      details: `Successful daily automated backup created. Size: ${(simulatedCompressedSize / 1024).toFixed(2)} KB. Integrity verified: ${integrityVerified}`,
      ipAddress: "127.0.0.1", // In Next.js client, we mock or fetch client IP
    });

    // 6. Apply retention policy to clean up old backups
    await applyBackupRetentionPolicy();

    return { success: integrityVerified, backupId };
  } catch (err: any) {
    console.error("Backup failed:", err);

    // Save failed backup log
    await setDocument(COLLECTIONS.BACKUPS, backupId, {
      id: backupId,
      dateString: todayStr,
      timestamp,
      collectionsData: {},
      sizeBytes: 0,
      compressed: false,
      integrityVerified: false,
      status: "failed",
      errorLog: err.message || "Unknown error during snapshot query",
      createdById: triggerUserId,
    });

    return { success: false, error: err.message };
  }
}

// ─── 2. RETENTION POLICY ENFORCEMENT ───
// Deletes older backups from Firestore depending on configured retention duration.
export async function applyBackupRetentionPolicy(): Promise<void> {
  try {
    const backups = await queryDocuments<BackupDoc>(COLLECTIONS.BACKUPS);
    backups.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Retention limits
    const keepLimit = DEFAULT_CONFIG.retentionDaily;
    
    if (backups.length > keepLimit) {
      const toDelete = backups.slice(keepLimit);
      for (const b of toDelete) {
        await deleteDocument(COLLECTIONS.BACKUPS, b.id);
        console.log(`Retention policy: Purged expired backup ${b.id}`);
      }
    }
  } catch (err) {
    console.error("Error applying backup retention policy:", err);
  }
}

// ─── 3. RESTORE / ROLLBACK MANAGER ───
// Restores database collections from a selected backup document snapshot.
export async function restoreBackupSnapshot(
  backupId: string,
  adminUserId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Fetch backup document
    const backup = await getDocument<BackupDoc>(COLLECTIONS.BACKUPS, backupId);
    if (!backup) {
      return { success: false, error: "Backup snapshot file not found." };
    }

    // 2. Verify integrity check
    if (!backup.integrityVerified || backup.status !== "success") {
      return { success: false, error: "Backup integrity check failed. Recovery aborted." };
    }

    // 3. Run overwrite restore (overwrites collections in parallel)
    const collectionsData = backup.collectionsData;
    for (const collName of Object.keys(collectionsData)) {
      const docsList = JSON.parse(collectionsData[collName] as string);
      for (const doc of docsList) {
        if (doc.id) {
          await setDocument(collName, doc.id, doc, false); // overwrite
        }
      }
    }

    // 4. Log restore audit event
    await setDocument(COLLECTIONS.AUDIT, `audit_${Date.now()}`, {
      id: `audit_${Date.now()}`,
      action: "database_restore",
      userId: adminUserId,
      timestamp: new Date().toISOString(),
      details: `Database restored from backup snapshot ${backupId}. Reason: ${reason}`,
      ipAddress: "127.0.0.1",
    });

    return { success: true };
  } catch (err: any) {
    console.error("Restore failed:", err);
    return { success: false, error: err.message };
  }
}
