-- Ensure increment_counselor_session works with TEXT counselor IDs
-- Drop any legacy versions that expect UUID inputs to avoid 22P02 errors

-- Drop both UUID and TEXT variants so we can recreate a single canonical version
DROP FUNCTION IF EXISTS public.increment_counselor_session(uuid);
DROP FUNCTION IF EXISTS public.increment_counselor_session(text);

-- Recreate the function with TEXT parameter
CREATE FUNCTION public.increment_counselor_session(target_counselor text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF target_counselor IS NULL OR length(trim(target_counselor)) = 0 THEN
    RAISE NOTICE 'increment_counselor_session called with empty counselor id';
    RETURN;
  END IF;

  INSERT INTO public.counselor_stats (counselor_id, session_count)
  VALUES (target_counselor, 1)
  ON CONFLICT (counselor_id)
  DO UPDATE SET
    session_count = public.counselor_stats.session_count + 1,
    updated_at = timezone('utc', now());
END;
$$;

-- Double-check that counselor_stats.counselor_id column is TEXT
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'counselor_stats'
      AND column_name = 'counselor_id'
      AND data_type <> 'text'
  ) THEN
    ALTER TABLE public.counselor_stats
      ALTER COLUMN counselor_id TYPE TEXT USING counselor_id::text;
  END IF;
END$$;
