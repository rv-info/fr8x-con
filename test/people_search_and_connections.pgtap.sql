-- =============================================================================
-- FR8X pgTAP Test Suite: People Search & Connections System
-- Tests migration 20261015100000_people_search_and_connections.sql
-- =============================================================================

BEGIN;
SELECT plan(38);

-- 1. Extensions
SELECT has_extension('pg_trgm', 'pg_trgm extension should be installed');
SELECT has_extension('unaccent', 'unaccent extension should be installed');

-- 2. Tables Existence
SELECT has_table('public', 'profiles', 'public.profiles table must exist');
SELECT has_table('public', 'connection_requests', 'public.connection_requests table must exist');
SELECT has_table('public', 'accepted_connections', 'public.accepted_connections table must exist');
SELECT has_table('public', 'user_blocks', 'public.user_blocks table must exist');

-- 3. Profiles FTS Column
SELECT has_column('public', 'profiles', 'search_vector', 'profiles table must have search_vector tsvector column');

-- 4. Connection Requests Columns
SELECT columns_are(
  'public',
  'connection_requests',
  ARRAY['id', 'requester_id', 'recipient_id', 'status', 'message', 'created_at', 'updated_at'],
  'connection_requests must have the required architectural columns'
);

-- 5. Accepted Connections Columns
SELECT columns_are(
  'public',
  'accepted_connections',
  ARRAY['id', 'user_id', 'connected_to', 'request_id', 'connected_at'],
  'accepted_connections must have the required architectural columns'
);

-- 6. User Blocks Columns
SELECT columns_are(
  'public',
  'user_blocks',
  ARRAY['id', 'blocker_id', 'blocked_id', 'created_at'],
  'user_blocks must have the required architectural columns'
);

-- 7. Constraints
SELECT col_not_null('public', 'connection_requests', 'requester_id', 'requester_id cannot be null');
SELECT col_not_null('public', 'connection_requests', 'recipient_id', 'recipient_id cannot be null');
SELECT col_not_null('public', 'connection_requests', 'status', 'status cannot be null');
SELECT col_has_check('public', 'connection_requests', 'chk_no_self_request', 'Self connection requests must be rejected by check constraint');

SELECT col_not_null('public', 'accepted_connections', 'user_id', 'user_id cannot be null');
SELECT col_not_null('public', 'accepted_connections', 'connected_to', 'connected_to cannot be null');
SELECT col_has_check('public', 'accepted_connections', 'chk_no_self_connection', 'Self connections must be rejected by check constraint');

SELECT col_not_null('public', 'user_blocks', 'blocker_id', 'blocker_id cannot be null');
SELECT col_not_null('public', 'user_blocks', 'blocked_id', 'blocked_id cannot be null');
SELECT col_has_check('public', 'user_blocks', 'chk_no_self_block', 'Self blocking must be rejected by check constraint');

-- 8. Indexes
SELECT has_index('public', 'profiles', 'idx_profiles_search_vector', 'profiles must have GIN index on search_vector');
SELECT has_index('public', 'profiles', 'idx_profiles_display_name_trgm', 'profiles must have trigram index on display_name');
SELECT has_index('public', 'connection_requests', 'uidx_connection_requests_active', 'connection_requests must have unique partial index on active requests');
SELECT has_index('public', 'accepted_connections', 'uidx_accepted_connections_pair', 'accepted_connections must have unique index on user_id + connected_to');
SELECT has_index('public', 'user_blocks', 'uidx_user_blocks_pair', 'user_blocks must have unique index on blocker_id + blocked_id');

-- 9. Functions / RPCs
SELECT has_function('public', 'search_people', 'search_people RPC function must exist');
SELECT has_function('public', 'send_connection_request', 'send_connection_request RPC function must exist');
SELECT has_function('public', 'accept_connection_request', 'accept_connection_request RPC function must exist');
SELECT has_function('public', 'reject_connection_request', 'reject_connection_request RPC function must exist');
SELECT has_function('public', 'withdraw_connection_request', 'withdraw_connection_request RPC function must exist');
SELECT has_function('public', 'block_user', 'block_user RPC function must exist');
SELECT has_function('public', 'unblock_user', 'unblock_user RPC function must exist');
SELECT has_function('public', 'get_connection_status', 'get_connection_status RPC function must exist');

-- 10. Row Level Security (RLS)
SELECT row_level_security_is_active('public', 'connection_requests', 'connection_requests must have RLS active');
SELECT row_level_security_is_active('public', 'accepted_connections', 'accepted_connections must have RLS active');
SELECT row_level_security_is_active('public', 'user_blocks', 'user_blocks must have RLS active');

-- 11. Notifications idempotency index
SELECT has_index('public', 'notifications', 'uidx_notifications_related_id', 'notifications must have unique partial index on related_id');

SELECT * FROM finish();
ROLLBACK;
