import type { Tables } from "./database";

export type CounselorRow = Tables<"counselors">;

export interface Counselor {
  id: string;
  name: string;
  specialty: string;
  description: string;
  iconUrl?: string;
  modelType?: string;
  modelName?: string;
  ragEnabled?: boolean;
  ragSourceId?: string | null;
  responseTime?: string;
  sessionCount?: number;
  tags?: string[];
  highlight?: string;
}

export interface FeatureHighlight {
  title: string;
  description: string;
  icon: string;
  detail: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ConversationSummary {
  id: string;
  counselorId: string;
  title: string;
  updatedAt: string;
  messageCount: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  tokensUsed?: number;
}
