# FR8X CONNECTION ARCHITECTURE & STATE MACHINE SPECIFICATION
**Standard:** FR8X Enterprise Data Model & Realtime Event Synchronization  
**Version:** 3.0.0 (Production Release)  
**Date:** October 18, 2026  
**Status:** Approved & Enforced  

---

## 1. Logical Data Architecture & Schema Definition

The FR8X connection system maintains a single canonical relationship model across PostgreSQL, Supabase Realtime, and Next.js frontend state.

```
                      ┌──────────────────────┐
                      │   public.profiles    │
                      └──────────┬───────────┘
                                 │ 1:N
           ┌─────────────────────┴─────────────────────┐
           │                                           │
           ▼                                           ▼
┌───────────────────────────────┐       ┌───────────────────────────────┐
│  public.connection_requests   │       │  public.accepted_connections  │
├───────────────────────────────┤       ├───────────────────────────────┤
│ id: UUID (PK)                 │       │ id: UUID (PK)                 │
│ requester_id: UUID (FK prof)  │       │ user_id: UUID (FK profiles)   │
│ recipient_id: UUID (FK prof)  │       │ connected_to: UUID (FK prof)  │
│ message: TEXT                 │       │ connected_at: TIMESTAMPTZ     │
│ status: request_status        │       │ source_request_id: UUID (FK)  │
│ created_at: TIMESTAMPTZ       │       └───────────────────────────────┘
│ updated_at: TIMESTAMPTZ       │                      ▲
└──────────────┬────────────────┘                      │
               │ Triggers / Writes                     │ Reciprocal (A->B & B->A)
               ▼                                       │ on acceptance
┌───────────────────────────────┐                      │
│     public.notifications      │                      │
├───────────────────────────────┤                      │
│ id: TEXT / UUID (PK)          │                      │
│ user_id: TEXT (Recipient UID) │                      │
│ type: 'connection_request'    │                      │
│ category: 'network'           │                      │
│ title: TEXT                   │                      │
│ description: TEXT             │                      │
│ target_url: TEXT              │                      │
│ related_id: TEXT (Request ID) ├──────────────────────┘
│ read: BOOLEAN (DEFAULT FALSE) │
│ metadata: JSONB               │
│ created_at: TIMESTAMPTZ       │
└───────────────────────────────┘
```

---

## 2. Definitive Connection State Machine

### 2.1 State Transition Matrix

| Initial State | Actor | Action | Next State | Persisted Database Effects | Notification Outcome |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **None / Disconnected** | Requester | `send` | `pending` | Row inserted into `connection_requests` (`status = 'pending'`). Audit logged. | Recipient receives new notification (`category: 'network'`, `read: false`). |
| **Pending** | Requester | `cancel` / `withdraw` | `cancelled` | Row updated to `status = 'cancelled'`, `updated_at = NOW()`. Audit logged. | Recipient notification reconciled (`read = true` / dismissed). |
| **Pending** | Recipient | `accept` | `accepted` | Row updated to `status = 'accepted'`. Reciprocal rows inserted into `accepted_connections`. | Requester receives notification: `"[Recipient] accepted your connection request"`. |
| **Pending** | Recipient | `decline` / `reject` | `declined` | Row updated to `status = 'declined'`, `updated_at = NOW()`. Audit logged. | Recipient notification marked read. |
| **Accepted** | Either User | `remove` | `None` | Reciprocal rows deleted from `accepted_connections`. | None. |
| **Any State** | Either User | `block` | `blocked` | Pending requests cancelled. Connections severed. Row inserted into `user_blocks`. | Notifications dismissed. |

### 2.2 Invariant Guarantees
1. **Self-Connections Forbidden:** `requester_id <> recipient_id` enforced by table check constraints and RPC validation.
2. **Directed Uniqueness:** Partial unique index on `(requester_id, recipient_id) WHERE status = 'pending'` prevents duplicate pending requests.
3. **Opposing Request Resolution:** If User B attempts to send a request to User A while a pending request from A to B exists, the system automatically resolves the conflict by calling `accept_connection_request(User B, Request A->B)`, connecting both users immediately without error.
4. **Reciprocal Connection Integrity:** Upon acceptance, two reciprocal rows are committed in a single atomic PostgreSQL transaction (`(user_id=A, connected_to=B)` and `(user_id=B, connected_to=A)`), ensuring identical relationship state whether queried from User A or User B.

---

## 3. Row-Level Security (RLS) Policies

### 3.1 `public.connection_requests`
```sql
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view incoming and outgoing requests"
  ON public.connection_requests FOR SELECT TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can insert own requests"
  ON public.connection_requests FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Users can update relevant requests"
  ON public.connection_requests FOR UPDATE TO authenticated
  USING (auth.uid() = requester_id OR auth.uid() = recipient_id)
  WITH CHECK (auth.uid() = requester_id OR auth.uid() = recipient_id);
```

### 3.2 `public.notifications`
```sql
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view and manage own notifications"
  ON public.notifications FOR ALL TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);
```

### 3.3 `public.accepted_connections`
```sql
ALTER TABLE public.accepted_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own accepted connections"
  ON public.accepted_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
```

---

## 4. Supabase Realtime Publication & Event Protocol

To ensure instant multi-device and cross-account synchronization without manual refresh:
1. Tables are registered in the `supabase_realtime` publication:
   ```sql
   ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
   ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
   ALTER PUBLICATION supabase_realtime ADD TABLE public.accepted_connections;
   ```
2. `REPLICA IDENTITY FULL` is configured for `public.connection_requests` and `public.notifications` to deliver old and new records in WebSocket payloads.
3. Client subscriptions listen to private channels scoped to `user_networking:${userId}` and `notifications:${userId}`.
4. If Realtime encounters a disconnect or jitter, an 8-second bounded interval fallback ensures that incoming requests and notification badge counts self-heal automatically.
