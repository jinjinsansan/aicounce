# Nazare Counselor Chat Fix

## Problem Summary

The Nazare counselor chat (and potentially other counselors like Adam, Gemini, Claude, Deep) was not working due to a database schema mismatch:

1. **Database Schema**: The `conversations` table has `counselor_id` defined as `UUID` type
2. **Application Code**: Counselors use string IDs like "nazare", "michele", "adam", etc.
3. **Error**: When trying to create a conversation with `counselor_id: "nazare"`, PostgreSQL fails with error: `invalid input syntax for type uuid: "nazare"`

## Root Cause

In `supabase/schema.sql`:
```sql
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  counselor_id uuid not null,  -- ❌ This should be TEXT, not UUID
  ...
);

create table if not exists public.counselors (
  id uuid primary key default gen_random_uuid(),  -- ❌ This should be TEXT
  ...
);
```

But in `lib/constants/counselors.ts`:
```typescript
{
  id: "nazare",  // ✅ String ID, not UUID
  name: "ナザレ",
  ...
}
```

## Files Changed

1. **Created Migration**: `/supabase/migrations/20260106_fix_counselor_id_type.sql`
   - Changes `counselors.id` from UUID to TEXT
   - Changes `conversations.counselor_id` from UUID to TEXT
   - Changes `rag_documents.counselor_id` from UUID to TEXT
   - Removes foreign key constraints (not needed for TEXT IDs)
   - Updates the `match_rag_chunks` function to accept TEXT parameter

2. **Updated RAG Library**: `lib/rag.ts`
   - Removed the UUID validation check that was blocking non-UUID counselor IDs
   - This was causing the warning: `[RAG] Skipping lookup for non-UUID counselor id: nazare`

## How to Apply the Fix

### Option 1: Using Supabase CLI (Recommended)

1. Make sure you have Supabase CLI installed and configured
2. Run the migration:
   ```bash
   cd ai-counselor-site
   npx supabase db push
   ```

### Option 2: Manual SQL Execution

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy the contents of `/supabase/migrations/20260106_fix_counselor_id_type.sql`
4. Paste and execute the SQL

### Option 3: Using psql (if you have direct database access)

```bash
psql $DATABASE_URL < supabase/migrations/20260106_fix_counselor_id_type.sql
```

## Testing the Fix

After applying the migration:

1. **Test Nazare Chat**:
   - Go to https://www.mentalai.team/counselor/chat/nazare
   - Send a message
   - Verify the conversation is created and messages are saved
   - Check that RAG search works (no more UUID warnings in logs)

2. **Test Other Counselors**:
   - Test Adam: /counselor/chat/adam
   - Test Gemini: /counselor/chat/gemini  
   - Test Claude: /counselor/chat/claude
   - Test Deep: /counselor/chat/deep

3. **Test Michele and Sato** (they use custom clients but should still work):
   - Michele: /counselor/chat/michele
   - Sato: /counselor/chat/sato

## Expected Behavior After Fix

1. ✅ Nazare chat loads without errors
2. ✅ Messages are sent and received successfully
3. ✅ Conversation history is saved to database
4. ✅ RAG search works for counselors with RAG enabled
5. ✅ No more "invalid input syntax for type uuid" errors
6. ✅ No more "[RAG] Skipping lookup for non-UUID counselor id" warnings

## Rollback Plan

If something goes wrong, you can rollback by:

1. Recreate the tables with UUID types
2. However, this will require re-importing all data
3. **Better approach**: Fix any new issues rather than rollback

## Notes

- Michele and Sato counselors work differently (they use separate tables: `michelle_sessions` and `clinical_sessions`)
- The standard counselors (nazare, adam, gemini, claude, deep) all use the `conversations` table
- This fix makes the schema consistent with the application code
