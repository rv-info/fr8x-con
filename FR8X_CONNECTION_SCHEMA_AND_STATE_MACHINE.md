# FR8X CONNECTION SCHEMA AND STATE MACHINE SPECIFICATION

**Project:** FR8X B2B Freight Logistics & Networking Platform  
**Repository:** `D:\fr8x-con`  
**Database:** PostgreSQL 15+ (Supabase)  
**Specification Version:** 2.1 (Hardened)  
**Date:** October 18, 2026  

---

## 1. Canonical Schema Architecture

The FR8X Connection Architecture separates **in-flight invitation lifecycle states** (`public.connection_requests`) from **active mutual relationships** (`public.accepted_connections` / `public.connections`).

### A. Table: `public.connection_requests`

| Column | Type | Constraints / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Authoritative request identifier. |
| `requester_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Authenticated initiating user. |
| `recipient_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Targeted recipient user. |
| `status` | `TEXT` | `NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'declined', 'cancelled', 'withdrawn', 'expired'))` | Current lifecycle state. |
| `message` | `TEXT` | `NULL CHECK (char_length(message) <= 500)` | Optional introductory business note. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Initial submission timestamp. |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Latest state transition timestamp. |
| `responded_at` | `TIMESTAMPTZ` | `NULL` | Timestamp when recipient accepted or rejected. |
| `withdrawn_at` | `TIMESTAMPTZ` | `NULL` | Timestamp when sender withdrew request. |

#### Database Indexes & Constraints:
1. **Self-Request Prevention Check:**
   ```sql
   CONSTRAINT check_no_self_requests CHECK (requester_id <> recipient_id)
   ```
2. **Directed Uniqueness Constraint for Active Requests:**
   ```sql
   CREATE UNIQUE INDEX IF NOT EXISTS uq_active_pending_request
     ON public.connection_requests(requester_id, recipient_id)
     WHERE status = 'pending';
   ```
   *Guarantees that at most ONE pending request can exist from User A to User B at any given moment.*

3. **Performance B-Tree Indexes:**
   ```sql
   CREATE INDEX IF NOT EXISTS idx_conn_req_requester ON public.connection_requests(requester_id, status);
   CREATE INDEX IF NOT EXISTS idx_conn_req_recipient ON public.connection_requests(recipient_id, status);
   CREATE INDEX IF NOT EXISTS idx_conn_req_updated ON public.connection_requests(updated_at DESC);
   ```

---

### B. Table: `public.accepted_connections`

Once accepted, a mutual business connection is persisted as a canonical relationship between two accounts.

| Column | Type | Constraints / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID` | `PRIMARY KEY DEFAULT gen_random_uuid()` | Relationship record ID. |
| `user_a` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | First connected member (ordered `user_a < user_b`). |
| `user_b` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Second connected member. |
| `request_id` | `UUID` | `NULL REFERENCES public.connection_requests(id) ON DELETE SET NULL` | Originating request reference. |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Connection establishment timestamp. |

#### Canonical Ordering Invariant:
```sql
CONSTRAINT check_canonical_order CHECK (user_a < user_b)
```
*Prevents duplicate directional pairs (e.g., prevents having both `(A, B)` and `(B, A)` in separate rows).*

---

### C. Table: `public.notifications` (Network Category)

| Column | Type | Constraints / Default | Description |
| :--- | :--- | :--- | :--- |
| `id` | `TEXT` | `PRIMARY KEY` | Notification identifier. |
| `user_id` | `UUID` | `NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | Intended recipient of the alert. |
| `type` | `TEXT` | `NOT NULL DEFAULT 'connection_request'` | Event type indicator. |
| `category` | `TEXT` | `NOT NULL DEFAULT 'network'` | Filtering classification (`network`, `system`, etc.). |
| `title` | `TEXT` | `NOT NULL` | Human-readable title (`"Aarav sent you a connection request"`). |
| `description`| `TEXT` | `NOT NULL` | Message excerpt or status explanation. |
| `target_url` | `TEXT` | `NOT NULL DEFAULT '/connections?tab=incoming'` | In-app navigation destination. |
| `related_id` | `TEXT` | `NULL` | ID of the connection request row. |
| `read` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Read status controlling notification badge count. |
| `metadata` | `JSONB` | `NOT NULL DEFAULT '{}'::jsonb` | Hydration details: `{ requester_id, requester_name, requester_company, ... }` |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL DEFAULT NOW()` | Alert creation timestamp. |

---

## 2. Formal State Machine

```
                   ┌──────────────────────────────────────┐
                   │               [INIT]                 │
                   └──────────────────┬───────────────────┘
                                      │
                                      ▼  User A calls 'send'
                       ┌──────────────────────────────┐
                       │           PENDING            │
                       └──────┬──────────┬─────────┬──┘
                              │          │         │
          User A calls        │          │         │  User B calls
          'cancel' (Withdraw) │          │         │  'reject' / 'decline'
                              │          │         │
                              ▼          │         ▼
                     ┌─────────────┐     │   ┌──────────────┐
                     │  WITHDRAWN  │     │   │   REJECTED   │
                     │ (cancelled) │     │   │  (declined)  │
                     └──────┬──────┘     │   └──────┬───────┘
                            │            │          │
                            │            │ User B   │
                            │            │ calls    │
                            │            │ 'accept' │
                            │            ▼          │
                            │     ┌──────────────┐  │
                            │     │   ACCEPTED   │  │
                            │     │ (connected)  │  │
                            │     └──────────────┘  │
                            │                       │
                            └───────────┬───────────┘
                                        │
                                        ▼  Allowed after cooldown
                                 Re-send Allowed
```

### Valid Transitions:
1. `NONE -> PENDING`: Initiated by authenticated User A directed to User B.
2. `PENDING -> ACCEPTED`: Executed **only** by authenticated User B (Recipient). Atomically inserts row into `public.accepted_connections` and marks request `status = 'accepted'`.
3. `PENDING -> REJECTED / DECLINED`: Executed **only** by authenticated User B (Recipient). Sets `status = 'rejected'`, records `responded_at = NOW()`.
4. `PENDING -> WITHDRAWN / CANCELLED`: Executed **only** by authenticated User A (Requester). Sets `status = 'cancelled'`, records `withdrawn_at = NOW()`, and reconciles recipient notification.

### Invalid / Rejected Transitions:
- `ACCEPTED -> WITHDRAWN`: Once accepted, a request cannot be withdrawn. (Removing a connection must use the `remove` action on `accepted_connections`).
- `REJECTED -> ACCEPTED`: A rejected request is terminal.
- `WITHDRAWN -> ACCEPTED`: A withdrawn request cannot be accepted by the recipient.
- `PENDING -> PENDING (Duplicate)`: Rejected with `CONFLICT (HTTP 409)` by unique index `uq_active_pending_request`.

### Re-sending Policy:
If a previous request has reached a terminal state (`cancelled`, `withdrawn`, or `rejected`), the unique partial index `WHERE status = 'pending'` is not violated. Therefore, User A is permitted to send a fresh request to User B.

---

## 3. Database Security & Row Level Security (RLS)

All tables enforce strict Row Level Security policies:

```sql
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accepted_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
```

### Policy Rules for `public.connection_requests`:
1. **SELECT (Read):**
   ```sql
   CREATE POLICY "Users can view their incoming and outgoing requests"
     ON public.connection_requests FOR SELECT
     USING (auth.uid() = requester_id OR auth.uid() = recipient_id);
   ```
2. **INSERT (Create):**
   ```sql
   CREATE POLICY "Users can create outgoing requests"
     ON public.connection_requests FOR INSERT
     WITH CHECK (auth.uid() = requester_id AND requester_id <> recipient_id);
   ```
3. **UPDATE (Withdraw):**
   ```sql
   CREATE POLICY "Requesters can withdraw their own pending requests"
     ON public.connection_requests FOR UPDATE
     USING (auth.uid() = requester_id AND status = 'pending')
     WITH CHECK (auth.uid() = requester_id AND status IN ('cancelled', 'withdrawn'));
   ```
4. **UPDATE (Accept/Reject):**
   ```sql
   CREATE POLICY "Recipients can respond to requests addressed to them"
     ON public.connection_requests FOR UPDATE
     USING (auth.uid() = recipient_id AND status = 'pending')
     WITH CHECK (auth.uid() = recipient_id AND status IN ('accepted', 'rejected', 'declined'));
   ```

---

## 4. Supabase Realtime Synchronization Topology

Realtime publication includes `public.connection_requests` and `public.notifications`:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
```

### Event Handling in Frontend:
- On `INSERT` into `connection_requests` where `recipient_id === activeUser`:
  - Recipient's `CONNECTION REQUEST RECEIVED` counter and list update.
  - Notification bell receives live alert.
- On `UPDATE` where `status IN ('cancelled', 'withdrawn')`:
  - Recipient's incoming list automatically removes the card.
  - Recipient's notification bell reconciles unread count.
  - Sender's `Sent Requests` tab removes the card or transitions to inactive.
- On `UPDATE` where `status = 'accepted'`:
  - Both Sender and Recipient transition card status to `CONNECTED`.
  - Recipient moves member from `CONNECTION REQUEST RECEIVED` to `Connected Contacts`.
