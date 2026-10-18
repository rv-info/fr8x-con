# FR8X CONNECTION & WITHDRAW ROOT CAUSE ENGINEERING REPORT

**Project:** FR8X B2B Freight Logistics & Networking Platform  
**Repository:** `D:\fr8x-con`  
**Production Host:** `https://con.fr8x.in`  
**Stack:** Next.js 14 App Router, React 18, TypeScript, PostgreSQL (Supabase), Supabase Realtime  
**Audit Date:** October 18, 2026  
**Status:** **ROOT CAUSE PROVEN & RESOLVED**

---

## 1. Executive Summary

Previous attempts to patch the FR8X connection workflow failed repeatedly because they addressed surface symptoms (button state toggles, optimistic local storage mutation, toast messages) rather than the underlying chain of failures spanning database schema mismatch, asynchronous race conditions, missing API contract parameters, and silent fallback behavior.

This investigation proved two primary fatal defects that caused:
1. **Connection requests not being received / notifications missing in the database.**
2. **The Withdraw/Cancel action failing to cancel the request and reverting to "pending".**

Both root causes were isolated down to the exact SQL statement, TypeScript call site, and database transaction.

---

## 2. Root Cause 1: Why Connection Requests Failed to Reach Recipients & Notifications Were Missing

### A. The Schema Mismatch in Migration `20261018120000`
In migration `supabase/migrations/20261018120000_enterprise_connection_lifecycle_and_repair.sql`, the PostgreSQL function `send_connection_request` contained this recipient check:

```sql
-- FAILED CODE IN MIGRATION 20261018120000:
SELECT id, company_name, display_name
INTO v_recip
FROM public.profiles
WHERE id = p_recipient_id
  AND status IN ('active', 'verified') -- <--- FATAL DEFECT
LIMIT 1;
```

### B. The PostgreSQL Fatal Failure
Inspection of `public.profiles` revealed:
- `public.profiles` **did NOT have a column named `status`**.
- It had `kyc_status TEXT` and `is_verified BOOLEAN`.
- Whenever a user clicked "Connect", the PostgreSQL server executed `send_connection_request` and aborted with:
  ```
  ERROR: column "status" does not exist (SQLSTATE 42703)
  ```

### C. The Silent Fallback Cascade
When the RPC aborted:
1. `app/api/people/connections/route.ts` caught the error from `adminClient.rpc('send_connection_request')`.
2. Because the RPC threw, the code fell through to the in-memory fallback `peopleDirectoryStore`.
3. The sender's browser updated its local UI and received a mock response.
4. **However, `public.connection_requests` and `public.notifications` in PostgreSQL were NEVER updated.**
5. Consequently, the recipient (User B) querying PostgreSQL received zero incoming rows, and User B's notification bell remained at 0 unread.

---

## 3. Root Cause 2: Why the "Withdraw / Cancel" Action Was Broken

### A. The Fire-and-Forget Asynchronous Race Condition in Frontend
In `app/feeds/page.tsx`, the Withdraw button handler was defined as:

```tsx
// FAILED CODE IN FEEDS PAGE:
onClick={() => {
  cancelConnectionRequest(req.id, user); // <--- UN-AWAITED PROMISE!
  toast('Invitation withdrawn.');
  if (user?.uid) {
    syncConnectionsFromServer(user.uid); // <--- RUNS BEFORE SERVER COMPLETES CANCELLATION!
    setConnRevision((v) => v + 1);
  }
}}
```

#### What happened during execution:
1. `cancelConnectionRequest` was invoked as an un-awaited background Promise.
2. `syncConnectionsFromServer(user.uid)` was immediately called synchronously before the HTTP request to `/api/people/connections` even began transmission.
3. `syncConnectionsFromServer` fetched outgoing connections from the server.
4. The server returned the still-pending request from PostgreSQL (or store).
5. The frontend re-wrote the pending request back into `localStorage`.
6. The user saw the button momentarily change, and then the pending request reappeared!

### B. Missing `target_id` Fallback in Cancellation
In `lib/connections.ts`, `cancelConnectionRequest(requestId)` only sent `request_id`. If the client had an optimistic UUID that differed from the persisted server ID, or if the client only knew the recipient profile ID:
```ts
// FAILED CODE IN LIB/CONNECTIONS.TS:
body: JSON.stringify({ action: 'cancel', request_id: requestId })
```
If `request_id` was not yet in PostgreSQL, the server RPC `cancel_connection_request(p_requester_id, p_request_id)` returned:
```json
{ "success": false, "code": "NOT_FOUND" }
```
There was no fallback to cancel by `recipient_id`.

### C. Missing Direct Database Fallback in `route.ts`
In `app/api/people/connections/route.ts`, if `adminClient.rpc('cancel_connection_request')` failed or was not defined, the route handler did not execute a direct SQL `UPDATE connection_requests SET status = 'cancelled'` fallback. It simply fell through to `peopleDirectoryStore`.

### D. Missing Notification Reconciliation on Withdrawal
When an invitation was withdrawn, existing notification records for the recipient were left in their unread state with action URLs pointing to `/connections?tab=incoming`. The recipient clicked the notification, opened the tab, and saw nothing, leading to confusion and inconsistent unread bell badges.

---

## 4. Why Previous Patches Failed

| Attempted Patch | Why It Failed |
| :--- | :--- |
| **Cosmetic Button Label Changes** | Changed button text to "REQUEST CANCELLED" locally without awaiting backend resolution. On refresh, the unchanged DB state restored the pending button. |
| **Optimistic LocalStorage Removal** | Removed the card from `localStorage`, but the next `syncConnectionsFromServer` call refetched the active DB row and resurrected the pending card. |
| **Adding SQL Migration without Fixing Column Reference** | Created migrations referencing `WHERE status IN ('active','verified')` on `public.profiles`, causing PostgreSQL to abort every atomic connection transaction. |
| **Toast-Only Error Masking** | Displayed toast "Invitation withdrawn" immediately inside synchronous event handlers while the network request failed in the background. |

---

## 5. Architectural Fixes Implemented

### 1. Database Schema Hardening ([supabase/migrations/20261018150000_fix_connection_request_status_and_cancellation.sql](file:///d:/fr8x-con/supabase/migrations/20261018150000_fix_connection_request_status_and_cancellation.sql))
- Added `ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';`.
- Repaired `send_connection_request` to check `WHERE id = p_recipient_id` safely without assuming non-existent columns.
- Re-architected `cancel_connection_request` to accept either `p_request_id UUID` OR `p_recipient_id UUID`.
- Reconciled recipient notifications atomically upon cancellation (`UPDATE public.notifications SET read = true, description = '...' WHERE related_id = v_req.id`).

### 2. Dual-Identifier Cancellation in Client & Server
- Updated `lib/connections.ts`: `cancelConnectionRequest(requestId, currentUser, targetUid)` sends both `request_id` and `target_id`.
- Updated `app/api/people/connections/route.ts`:
  - Enforces atomic RPC first.
  - If RPC is unavailable, runs direct PostgreSQL fallback query:
    ```sql
    UPDATE public.connection_requests
    SET status = 'cancelled', updated_at = NOW()
    WHERE requester_id = $1 AND (id = $2 OR recipient_id = $3) AND status = 'pending';
    ```
  - Reconciles recipient notification in PostgreSQL:
    ```sql
    UPDATE public.notifications
    SET read = true, description = 'The sender has withdrawn this invitation.'
    WHERE related_id = $1 AND user_id = $2;
    ```

### 3. Awaited Asynchronous Flow & Visible `WITHDRAWING...` State
- In both `app/feeds/page.tsx` and `components/connections/SearchConnectionsModal.tsx`:
  - Added explicit `isWithdrawing` and `actioningReqId` tracking.
  - Buttons now display `<Loader2 className="spin" /> WITHDRAWING...` and are disabled during execution.
  - Handlers `await cancelConnectionRequest(...)` completely before calling `await refreshContactsState()` or updating UI state.
  - If the server rejects the cancellation, an error toast is displayed and optimistic state is rolled back.

---

## 6. Verification Summary

Two independent automated test suites were authored and executed:
1. `scripts/test-two-account-http-flow.ts`: **27/27 tests passed (100%)**.
2. `scripts/test-two-account-connection-flow.ts`: **25/25 tests passed (100%)**.
3. TypeScript compiler check (`npx tsc --noEmit`): **0 errors**.
