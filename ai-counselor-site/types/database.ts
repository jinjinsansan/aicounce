export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      counselors: {
        Row: {
          created_at: string | null;
          description: string | null;
          icon_url: string | null;
          id: string;
          model_name: string;
          model_type: string;
          name: string;
          rag_enabled: boolean | null;
          rag_source_id: string | null;
          specialty: string;
          system_prompt: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          model_name: string;
          model_type: string;
          name: string;
          rag_enabled?: boolean | null;
          rag_source_id?: string | null;
          specialty: string;
          system_prompt: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          icon_url?: string | null;
          id?: string;
          model_name?: string;
          model_type?: string;
          name?: string;
          rag_enabled?: boolean | null;
          rag_source_id?: string | null;
          specialty?: string;
          system_prompt?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          counselor_id: string;
          created_at: string | null;
          id: string;
          is_archived: boolean | null;
          title: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          counselor_id: string;
          created_at?: string | null;
          id?: string;
          is_archived?: boolean | null;
          title?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          counselor_id?: string;
          created_at?: string | null;
          id?: string;
          is_archived?: boolean | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "conversations_counselor_id_fkey";
            columns: ["counselor_id"];
            referencedRelation: "counselors";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "conversations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      messages: {
        Row: {
          content: string;
          conversation_id: string;
          created_at: string | null;
          id: string;
          role: "user" | "assistant";
          tokens_used: number | null;
        };
        Insert: {
          content: string;
          conversation_id: string;
          created_at?: string | null;
          id?: string;
          role: "user" | "assistant";
          tokens_used?: number | null;
        };
        Update: {
          content?: string;
          conversation_id?: string;
          created_at?: string | null;
          id?: string;
          role?: "user" | "assistant";
          tokens_used?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey";
            columns: ["conversation_id"];
            referencedRelation: "conversations";
            referencedColumns: ["id"];
          }
        ];
      };
      rag_chunks: {
        Row: {
          chunk_index: number | null;
          chunk_text: string;
          created_at: string | null;
          document_id: string;
          embedding: number[] | null;
          id: string;
          metadata: Json | null;
          parent_chunk_id: string | null;
        };
        Insert: {
          chunk_index?: number | null;
          chunk_text: string;
          created_at?: string | null;
          document_id: string;
          embedding?: number[] | null;
          id?: string;
          metadata?: Json | null;
          parent_chunk_id?: string | null;
        };
        Update: {
          chunk_index?: number | null;
          chunk_text?: string;
          created_at?: string | null;
          document_id?: string;
          embedding?: number[] | null;
          id?: string;
          metadata?: Json | null;
          parent_chunk_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rag_chunks_document_id_fkey";
            columns: ["document_id"];
            referencedRelation: "rag_documents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "rag_chunks_parent_chunk_id_fkey";
            columns: ["parent_chunk_id"];
            referencedRelation: "rag_chunks";
            referencedColumns: ["id"];
          }
        ];
      };
      rag_documents: {
        Row: {
          content: string | null;
          counselor_id: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          source_id: string | null;
          source_type: string;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          content?: string | null;
          counselor_id: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          source_id?: string | null;
          source_type: string;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          content?: string | null;
          counselor_id?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          source_id?: string | null;
          source_type?: string;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "rag_documents_counselor_id_fkey";
            columns: ["counselor_id"];
            referencedRelation: "counselors";
            referencedColumns: ["id"];
          }
        ];
      };
      rag_search_logs: {
        Row: {
          created_at: string | null;
          id: string;
          message_id: string;
          query: string | null;
          relevance_scores: Json | null;
          retrieved_chunks: Json | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          message_id: string;
          query?: string | null;
          relevance_scores?: Json | null;
          retrieved_chunks?: Json | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          message_id?: string;
          query?: string | null;
          relevance_scores?: Json | null;
          retrieved_chunks?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "rag_search_logs_message_id_fkey";
            columns: ["message_id"];
            referencedRelation: "messages";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          is_active: boolean | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          is_active?: boolean | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          is_active?: boolean | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [];
      };
      llm_models: {
        Row: {
          cost_per_1k_input: number | null;
          cost_per_1k_output: number | null;
          created_at: string | null;
          description: string | null;
          display_name: string | null;
          id: string;
          is_active: boolean | null;
          max_tokens: number | null;
          model_name: string;
          provider: string;
          temperature: number | null;
        };
        Insert: {
          cost_per_1k_input?: number | null;
          cost_per_1k_output?: number | null;
          created_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_tokens?: number | null;
          model_name: string;
          provider: string;
          temperature?: number | null;
        };
        Update: {
          cost_per_1k_input?: number | null;
          cost_per_1k_output?: number | null;
          created_at?: string | null;
          description?: string | null;
          display_name?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_tokens?: number | null;
          model_name?: string;
          provider?: string;
          temperature?: number | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_rag_chunks: {
        Args: {
          query_embedding: unknown;
          counselor_id: string;
          match_count?: number;
        };
        Returns: {
          id: string;
          document_id: string;
          parent_chunk_id: string | null;
          chunk_text: string;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
