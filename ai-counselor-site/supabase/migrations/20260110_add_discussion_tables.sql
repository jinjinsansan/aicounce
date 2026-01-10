-- Create discussion_sessions table
CREATE TABLE IF NOT EXISTS public.discussion_sessions (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  topic text NOT NULL,
  debater_a_id text NOT NULL,
  debater_b_id text NOT NULL,
  moderator_id text,
  debater_a_style text NOT NULL DEFAULT 'balanced',
  debater_b_style text NOT NULL DEFAULT 'contrarian',
  moderator_style text DEFAULT 'moderator_calm',
  rounds integer NOT NULL DEFAULT 3,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create discussion_messages table
CREATE TABLE IF NOT EXISTS public.discussion_messages (
  id uuid DEFAULT gen_random_uuid() NOT NULL PRIMARY KEY,
  session_id uuid NOT NULL REFERENCES public.discussion_sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('debaterA', 'debaterB', 'moderator')),
  author_id text NOT NULL,
  author_name text NOT NULL,
  author_icon_url text,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discussion_sessions_user_id ON public.discussion_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_sessions_updated_at ON public.discussion_sessions(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_session_id ON public.discussion_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_discussion_messages_created_at ON public.discussion_messages(created_at);

-- Enable Row Level Security
ALTER TABLE public.discussion_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discussion_sessions
CREATE POLICY "Users can view their own discussion sessions"
  ON public.discussion_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own discussion sessions"
  ON public.discussion_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discussion sessions"
  ON public.discussion_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discussion sessions"
  ON public.discussion_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for discussion_messages
CREATE POLICY "Users can view messages from their own discussion sessions"
  ON public.discussion_messages
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.discussion_sessions
      WHERE id = discussion_messages.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in their own discussion sessions"
  ON public.discussion_messages
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.discussion_sessions
      WHERE id = discussion_messages.session_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from their own discussion sessions"
  ON public.discussion_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.discussion_sessions
      WHERE id = discussion_messages.session_id
      AND user_id = auth.uid()
    )
  );
