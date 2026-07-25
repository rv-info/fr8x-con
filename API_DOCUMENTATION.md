# API & Component Interface Documentation

This file documents key Next.js page components, UI helpers, and helper functions added to the codebase.

---

## 1. UI Components

### `ImageUploadWithCrop`
Interactive file selector and canvas-based cropping manager.
* **Path**: `src/components/ui/ImageUploadWithCrop.tsx`
* **Props**:
  * `onUploadComplete`: `(url: string) => void` (called after crop is uploaded to Storage)
  * `onRemove`: `() => void` (optional callback when image is removed)
  * `currentImageUrl`: `string | null` (current preview thumbnail URL)
  * `storagePath`: `string` (target path in Storage bucket)
  * `aspectRatio`: `"square" | "banner"` (mask clipping aspect ratio)
  * `maxSizeMB`: `number` (size validation limit, default 2MB)
  * `label`: `string` (helper text)

---

## 2. Page Components

### `/profile/[userId]`
Public profile viewer that resolves raw UIDs and handle handles.
* **Resolving Handles**:
  Checks if parameter starts with `@`. If so, queries the `profiles` collection where `publicId == param`. Otherwise, fetches the profile document directly.
* **Match indicators**:
  * Industry Match %: overlap of `industryTags` between viewed and current user profiles.
  * Mutual connection count: intersection of friends lists.

### `/company/[companyId]`
Public company details viewer resolving IDs and handles (e.g. `@COMP-0001`). Displays credentials grid, company description, and employee roster.

### `/search`
Universal search dashboard with autocomplete, recent queries, tag links, and advanced filter sliders (Country, City, Company Name, Specialization).

---

## 3. Helper Functions

### `generatePublicId`
* **File**: `profile/page.tsx`
* **Signature**: `generatePublicId(name: string): string`
* **Usage**: Cleans name input, extracts the first 5 characters (uppercase), and appends a random 3-digit serial (e.g. `@RAJAT001`). Used to assign handles to profiles.

### `generateCompanyHandle`
* **File**: `company/page.tsx`
* **Signature**: `generateCompanyHandle(name: string): string`
* **Usage**: Generates company handle format (e.g. `@COMP-9283`).

---

## 4. Port & Location Search Autocomplete

### `LocationSearchInput`
* **File**: `src/components/ui/LocationSearchInput.tsx`
* **Props**:
  * `value`: `string` (Current selected Port Code value)
  * `onChange`: `(value: string, locationObj?: LocationDoc) => void` (Selected callback)
  * `placeholder`: `string`
  * `label`: `string`
  * `isPlaceOfReceiptOrDelivery`: `boolean` (Appends postal/PIN code to search label if true)

---

## 5. Security & Sanitization Services

### `sanitizeText`
* **File**: `src/lib/utils/security.ts`
* **Signature**: `sanitizeText(input: string): string`
* **Usage**: Scrubs and normalizes user input to prevent HTML/XSS, SQL, path relative traversals, and Excel formula injections.

### `validateFileSignature`
* **File**: `src/lib/utils/security.ts`
* **Signature**: `validateFileSignature(file: File): Promise<boolean>`
* **Usage**: Inspects magic numbers in file headers to authenticate actual binary MIME types (PNG, JPG, WEBP, PDF, ZIP), rejecting executables.

### `mockVirusScan`
* **File**: `src/lib/utils/security.ts`
* **Signature**: `mockVirusScan(file: File): Promise<{ safe: boolean; error?: string }>`
* **Usage**: Scans files for blacklisted script extensions and the standard EICAR antivirus test signature.

---

## 6. Snapshot Backups Utility

### `runAutomatedBackup`
* **File**: `src/lib/utils/backup.ts`
* **Signature**: `runAutomatedBackup(triggerUserId: string): Promise<{ success: boolean; backupId?: string }>`
* **Usage**: Runs daily snapshot backups, simulated compression, verifies integrity, saves records, logs audit details, and executes retention policies.

### `restoreBackupSnapshot`
* **File**: `src/lib/utils/backup.ts`
* **Signature**: `restoreBackupSnapshot(backupId: string, adminUserId: string, reason: string): Promise<{ success: boolean }>`
* **Usage**: Overwrites target Firestore collections using backup data, requiring GodMode authorization and logging restoration reasons.

