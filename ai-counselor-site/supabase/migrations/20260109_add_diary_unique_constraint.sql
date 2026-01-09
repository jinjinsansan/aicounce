DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'diary_entries_author_date_key'
  ) THEN
    ALTER TABLE public.diary_entries
      ADD CONSTRAINT diary_entries_author_date_key
      UNIQUE (author_id, journal_date);
  END IF;
END;
$$;
