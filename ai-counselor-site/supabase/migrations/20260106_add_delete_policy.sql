-- Add DELETE and UPDATE policies for conversations table
-- Without these policies, users cannot delete or update their own conversations

-- Drop existing policies if they exist
drop policy if exists "Users can delete their own conversations" on public.conversations;
drop policy if exists "Users can update their own conversations" on public.conversations;

-- Allow users to delete their own conversations
create policy "Users can delete their own conversations"
  on public.conversations
  for delete
  using (auth.uid() = user_id);

-- Allow users to update their own conversations (for title updates, etc.)
create policy "Users can update their own conversations"
  on public.conversations
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Add DELETE policy for messages (allow deleting messages in own conversations)
drop policy if exists "Users can delete messages in their conversations" on public.messages;
create policy "Users can delete messages in their conversations"
  on public.messages
  for delete
  using (
    exists (
      select 1
      from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
