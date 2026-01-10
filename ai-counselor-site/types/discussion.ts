export type DiscussionRole = "debaterA" | "debaterB" | "moderator";

export interface DiscussionMessage {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorIconUrl?: string | null;
  role: DiscussionRole;
  createdAt: string;
}

export interface DiscussionParticipantOption {
  id: string;
  name: string;
  iconUrl?: string;
}

export interface DiscussionStyleOption {
  value: string;
  label: string;
  description: string;
  role?: "debater" | "moderator" | "both";
}
