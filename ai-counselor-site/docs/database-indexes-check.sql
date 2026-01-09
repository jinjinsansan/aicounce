-- Database Index Verification SQL
-- Run this in Supabase SQL Editor to check existing indexes and recommendations

-- ============================================================================
-- 1. Check existing indexes on critical tables
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'conversations',
    'messages',
    'team_sessions',
    'team_messages',
    'counselor_stats',
    'user_subscriptions'
  )
ORDER BY tablename, indexname;

-- ============================================================================
-- 2. Check table sizes and row counts
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) AS table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) AS indexes_size,
  (SELECT COUNT(*) FROM (SELECT 1 FROM information_schema.tables WHERE table_schema = schemaname AND table_name = tablename LIMIT 1) s) as exists
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'conversations',
    'messages',
    'team_sessions',
    'team_messages',
    'counselor_stats',
    'user_subscriptions'
  )
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================================================
-- 3. Recommended indexes (uncomment to create)
-- ============================================================================

-- Users table indexes
-- CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
-- CREATE INDEX IF NOT EXISTS idx_users_official_line_id ON users(official_line_id) WHERE official_line_id IS NOT NULL;
-- CREATE INDEX IF NOT EXISTS idx_users_last_login_at ON users(last_login_at DESC) WHERE last_login_at IS NOT NULL;

-- Conversations table indexes
-- CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
-- CREATE INDEX IF NOT EXISTS idx_conversations_counselor_id ON conversations(counselor_id);
-- CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_conversations_user_updated ON conversations(user_id, updated_at DESC);

-- Messages table indexes
-- CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
-- CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at ASC);

-- Team sessions table indexes
-- CREATE INDEX IF NOT EXISTS idx_team_sessions_auth_user_id ON team_sessions(auth_user_id);
-- CREATE INDEX IF NOT EXISTS idx_team_sessions_updated_at ON team_sessions(updated_at DESC);
-- CREATE INDEX IF NOT EXISTS idx_team_sessions_user_updated ON team_sessions(auth_user_id, updated_at DESC);

-- Team messages table indexes
-- CREATE INDEX IF NOT EXISTS idx_team_messages_session_id ON team_messages(team_session_id);
-- CREATE INDEX IF NOT EXISTS idx_team_messages_created_at ON team_messages(created_at ASC);
-- CREATE INDEX IF NOT EXISTS idx_team_messages_session_created ON team_messages(team_session_id, created_at ASC);

-- User subscriptions table indexes
-- CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
-- CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status) WHERE status IN ('active', 'trialing');

-- Counselor stats table indexes
-- CREATE INDEX IF NOT EXISTS idx_counselor_stats_counselor_id ON counselor_stats(counselor_id);
-- CREATE INDEX IF NOT EXISTS idx_counselor_stats_session_count ON counselor_stats(session_count DESC);

-- ============================================================================
-- 4. Check for missing indexes (queries without indexes)
-- ============================================================================

-- This query shows tables that might benefit from indexes
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch,
  CASE 
    WHEN seq_scan > 0 THEN ROUND((100.0 * idx_scan / (seq_scan + idx_scan))::numeric, 2)
    ELSE 0
  END AS index_usage_percent
FROM pg_stat_user_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'users',
    'conversations',
    'messages',
    'team_sessions',
    'team_messages',
    'counselor_stats',
    'user_subscriptions'
  )
ORDER BY seq_scan DESC;

-- ============================================================================
-- 5. Check for unused indexes (candidates for removal)
-- ============================================================================

SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch,
  pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
  AND indexrelname NOT LIKE '%_pkey'
ORDER BY pg_relation_size(indexrelid) DESC;
