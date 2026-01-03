import { getServiceSupabase, hasServiceRole } from "@/lib/supabase-server";

export type ConversationSummary = {
  id: string;
  counselor_id: string;
  title: string | null;
  updated_at: string | null;
};

export async function getConversations(userId: string) {
  if (!hasServiceRole()) {
    return [];
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("conversations")
    .select("id, counselor_id, title, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to load conversations", error);
    return [];
  }

  return data ?? [];
}

export async function getMessages(conversationId: string) {
  if (!hasServiceRole()) {
    return [];
  }

  const supabase = getServiceSupabase();
  const { data, error } = await supabase
    .from("messages")
    .select("id, role, content, conversation_id, tokens_used, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Failed to load messages", error);
    return [];
  }

  return data ?? [];
}
