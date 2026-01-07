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
      clinical_sessions: {
        Row: {
          auth_user_id: string;
          created_at: string;
          id: string;
          openai_thread_id: string | null;
          title: string | null;
          total_tokens: number;
          updated_at: string;
        };
        Insert: {
          auth_user_id: string;
          created_at?: string;
          id?: string;
          openai_thread_id?: string | null;
          title?: string | null;
          total_tokens?: number;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          created_at?: string;
          id?: string;
          openai_thread_id?: string | null;
          title?: string | null;
          total_tokens?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_sessions_auth_user_id_fkey";
            columns: ["auth_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      clinical_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["clinical_message_role"];
          session_id: string;
          tokens_used: number;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["clinical_message_role"];
          session_id: string;
          tokens_used?: number;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["clinical_message_role"];
          session_id?: string;
          tokens_used?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_messages_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "clinical_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      clinical_knowledge_parents: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          parent_index: number;
          source: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          parent_index: number;
          source: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          parent_index?: number;
          source?: string;
        };
        Relationships: [];
      };
      counselor_stats: {
        Row: {
          counselor_id: string;
          session_count: number;
          updated_at: string | null;
        };
        Insert: {
          counselor_id: string;
          session_count?: number;
          updated_at?: string | null;
        };
        Update: {
          counselor_id?: string;
          session_count?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      clinical_knowledge_children: {
        Row: {
          child_index: number;
          content: string;
          created_at: string;
          embedding: number[] | null;
          id: string;
          metadata: Json | null;
          parent_id: string;
        };
        Insert: {
          child_index: number;
          content: string;
          created_at?: string;
          embedding?: number[] | null;
          id?: string;
          metadata?: Json | null;
          parent_id: string;
        };
        Update: {
          child_index?: number;
          content?: string;
          created_at?: string;
          embedding?: number[] | null;
          id?: string;
          metadata?: Json | null;
          parent_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "clinical_knowledge_children_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "clinical_knowledge_parents";
            referencedColumns: ["id"];
          }
        ];
      };
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
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null;
          created_at: string | null;
          email: string;
          id: string;
          metadata: Json | null;
          source: string | null;
        };
        Insert: {
          confirmed_at?: string | null;
          created_at?: string | null;
          email: string;
          id?: string;
          metadata?: Json | null;
          source?: string | null;
        };
        Update: {
          confirmed_at?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          metadata?: Json | null;
          source?: string | null;
        };
        Relationships: [];
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
      michelle_sessions: {
        Row: {
          auth_user_id: string;
          category: Database["public"]["Enums"]["michelle_session_category"];
          created_at: string;
          id: string;
          openai_thread_id: string | null;
          title: string | null;
          total_tokens: number;
          updated_at: string;
        };
        Insert: {
          auth_user_id: string;
          category?: Database["public"]["Enums"]["michelle_session_category"];
          created_at?: string;
          id?: string;
          openai_thread_id?: string | null;
          title?: string | null;
          total_tokens?: number;
          updated_at?: string;
        };
        Update: {
          auth_user_id?: string;
          category?: Database["public"]["Enums"]["michelle_session_category"];
          created_at?: string;
          id?: string;
          openai_thread_id?: string | null;
          title?: string | null;
          total_tokens?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "michelle_sessions_auth_user_id_fkey";
            columns: ["auth_user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      michelle_messages: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["michelle_message_role"];
          session_id: string;
          tokens_used: number;
          updated_at: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["michelle_message_role"];
          session_id: string;
          tokens_used?: number;
          updated_at?: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["michelle_message_role"];
          session_id?: string;
          tokens_used?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "michelle_messages_session_id_fkey";
            columns: ["session_id"];
            referencedRelation: "michelle_sessions";
            referencedColumns: ["id"];
          }
        ];
      };
      michelle_knowledge: {
        Row: {
          content: string;
          created_at: string;
          embedding: number[] | null;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          content: string;
          created_at?: string;
          embedding?: number[] | null;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          content?: string;
          created_at?: string;
          embedding?: number[] | null;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      michelle_knowledge_parents: {
        Row: {
          content: string;
          created_at: string;
          id: string;
          metadata: Json | null;
          parent_index: number;
          source: string;
        };
        Insert: {
          content: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          parent_index: number;
          source: string;
        };
        Update: {
          content?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
          parent_index?: number;
          source?: string;
        };
        Relationships: [];
      };
      michelle_knowledge_children: {
        Row: {
          child_index: number;
          content: string;
          created_at: string;
          embedding: number[] | null;
          id: string;
          metadata: Json | null;
          parent_id: string;
        };
        Insert: {
          child_index: number;
          content: string;
          created_at?: string;
          embedding?: number[] | null;
          id?: string;
          metadata?: Json | null;
          parent_id: string;
        };
        Update: {
          child_index?: number;
          content?: string;
          created_at?: string;
          embedding?: number[] | null;
          id?: string;
          metadata?: Json | null;
          parent_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "michelle_knowledge_children_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "michelle_knowledge_parents";
            referencedColumns: ["id"];
          }
        ];
      };
      users: {
        Row: {
          created_at: string | null;
          email: string;
          id: string;
          last_login_at: string | null;
          line_linked_at: string | null;
          official_line_id: string | null;
          paypal_payer_id: string | null;
          receive_announcements: boolean;
          terms_accepted_at: string | null;
          is_active: boolean | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          id?: string;
          last_login_at?: string | null;
          line_linked_at?: string | null;
          official_line_id?: string | null;
          paypal_payer_id?: string | null;
          receive_announcements?: boolean;
          terms_accepted_at?: string | null;
          is_active?: boolean | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          id?: string;
          last_login_at?: string | null;
          line_linked_at?: string | null;
          official_line_id?: string | null;
          paypal_payer_id?: string | null;
          receive_announcements?: boolean;
          terms_accepted_at?: string | null;
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
      billing_plans: {
        Row: {
          created_at: string | null;
          currency: string;
          description: string | null;
          id: string;
          is_active: boolean;
          name: string;
          paypal_plan_id: string | null;
          price_cents: number;
          tier: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          id: string;
          is_active?: boolean;
          name: string;
          paypal_plan_id?: string | null;
          price_cents: number;
          tier: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          paypal_plan_id?: string | null;
          price_cents?: number;
          tier?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_period_end: string | null;
          id: string;
          metadata: Json | null;
          paypal_order_id: string | null;
          paypal_subscription_id: string | null;
          plan_id: string;
          status: string;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          id?: string;
          metadata?: Json | null;
          paypal_order_id?: string | null;
          paypal_subscription_id?: string | null;
          plan_id: string;
          status: string;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_period_end?: string | null;
          id?: string;
          metadata?: Json | null;
          paypal_order_id?: string | null;
          paypal_subscription_id?: string | null;
          plan_id?: string;
          status?: string;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_plan_id_fkey";
            columns: ["plan_id"];
            referencedRelation: "billing_plans";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_subscriptions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      user_trials: {
        Row: {
          created_at: string | null;
          id: string;
          line_linked: boolean;
          metadata: Json | null;
          source: string;
          trial_expires_at: string | null;
          trial_started_at: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          line_linked?: boolean;
          metadata?: Json | null;
          source: string;
          trial_expires_at?: string | null;
          trial_started_at?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          line_linked?: boolean;
          metadata?: Json | null;
          source?: string;
          trial_expires_at?: string | null;
          trial_started_at?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_trials_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          body: string;
          channel: string;
          id: string;
          read_at: string | null;
          sent_at: string;
          title: string;
          user_id: string;
        };
        Insert: {
          body: string;
          channel?: string;
          id?: string;
          read_at?: string | null;
          sent_at?: string;
          title: string;
          user_id: string;
        };
        Update: {
          body?: string;
          channel?: string;
          id?: string;
          read_at?: string | null;
          sent_at?: string;
          title?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      newsletter_campaigns: {
        Row: {
          audience: string;
          body: string;
          created_at: string | null;
          created_by: string | null;
          delivered_count: number | null;
          id: string;
          metadata: Json | null;
          sent_at: string | null;
          target_count: number | null;
          title: string;
        };
        Insert: {
          audience: string;
          body: string;
          created_at?: string | null;
          created_by?: string | null;
          delivered_count?: number | null;
          id?: string;
          metadata?: Json | null;
          sent_at?: string | null;
          target_count?: number | null;
          title: string;
        };
        Update: {
          audience?: string;
          body?: string;
          created_at?: string | null;
          created_by?: string | null;
          delivered_count?: number | null;
          id?: string;
          metadata?: Json | null;
          sent_at?: string | null;
          target_count?: number | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "newsletter_campaigns_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      newsletter_campaign_recipients: {
        Row: {
          campaign_id: string;
          delivered_at: string | null;
          email: string;
          id: string;
          metadata: Json | null;
          status: string;
          user_id: string | null;
        };
        Insert: {
          campaign_id: string;
          delivered_at?: string | null;
          email: string;
          id?: string;
          metadata?: Json | null;
          status?: string;
          user_id?: string | null;
        };
        Update: {
          campaign_id?: string;
          delivered_at?: string | null;
          email?: string;
          id?: string;
          metadata?: Json | null;
          status?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "newsletter_campaign_recipients_campaign_id_fkey";
            columns: ["campaign_id"];
            referencedRelation: "newsletter_campaigns";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "newsletter_campaign_recipients_user_id_fkey";
      campaign_codes: {
        Row: {
          created_at: string | null;
          description: string | null;
          duration_days: number;
          id: string;
      campaign_codes: {
        Row: {
          created_at: string | null;
          description: string | null;
          duration_days: number;
          id: string;
          is_active: boolean;
          code: string;
          updated_at: string | null;
          usage_count: number;
          usage_limit: number | null;
          valid_from: string | null;
          valid_to: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          duration_days: number;
          id?: string;
          is_active?: boolean;
          code: string;
          updated_at?: string | null;
          usage_count?: number;
          usage_limit?: number | null;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          duration_days?: number;
          id?: string;
          is_active?: boolean;
          code?: string;
          updated_at?: string | null;
          usage_count?: number;
          usage_limit?: number | null;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Relationships: [];
      };
      campaign_redemptions: {
        Row: {
          campaign_code_id: string;
          expires_at: string;
          id: string;
          redeemed_at: string;
          user_id: string;
        };
        Insert: {
          campaign_code_id: string;
          expires_at: string;
          id?: string;
          redeemed_at?: string;
          user_id: string;
        };
        Update: {
          campaign_code_id?: string;
          expires_at?: string;
          id?: string;
          redeemed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_redemptions_campaign_code_id_fkey";
            columns: ["campaign_code_id"];
            referencedRelation: "campaign_codes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_redemptions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
          is_active: boolean;
          code: string;
          updated_at: string | null;
          usage_count: number;
          usage_limit: number | null;
          valid_from: string | null;
          valid_to: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          duration_days: number;
          id?: string;
          is_active?: boolean;
          code: string;
          updated_at?: string | null;
          usage_count?: number;
          usage_limit?: number | null;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          duration_days?: number;
          id?: string;
          is_active?: boolean;
          code?: string;
          updated_at?: string | null;
          usage_count?: number;
          usage_limit?: number | null;
          valid_from?: string | null;
          valid_to?: string | null;
        };
        Relationships: [];
      };
      campaign_redemptions: {
        Row: {
          campaign_code_id: string;
          expires_at: string;
          id: string;
          redeemed_at: string;
          user_id: string;
        };
        Insert: {
          campaign_code_id: string;
          expires_at: string;
          id?: string;
          redeemed_at?: string;
          user_id: string;
        };
        Update: {
          campaign_code_id?: string;
          expires_at?: string;
          id?: string;
          redeemed_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "campaign_redemptions_campaign_code_id_fkey";
            columns: ["campaign_code_id"];
            referencedRelation: "campaign_codes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "campaign_redemptions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      admin_audit_logs: {
        Row: {
          action: string;
          admin_email: string;
          created_at: string;
          id: string;
          metadata: Json | null;
        };
        Insert: {
          action: string;
          admin_email: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
        };
        Update: {
          action?: string;
          admin_email?: string;
          created_at?: string;
          id?: string;
          metadata?: Json | null;
        };
        Relationships: [];
      };
      diary_entries: {
        Row: {
          author_avatar_url: string | null;
          author_id: string;
          author_name: string;
          content: string;
          created_at: string;
          deleted_at: string | null;
          id: string;
          is_shareable: boolean;
          journal_date: string;
          metadata: Json | null;
          published_at: string;
          share_count: number;
          title: string | null;
          updated_at: string;
        };
        Insert: {
          author_avatar_url?: string | null;
          author_id: string;
          author_name: string;
          content: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_shareable?: boolean;
          journal_date: string;
          metadata?: Json | null;
          published_at?: string;
          share_count?: number;
          title?: string | null;
          updated_at?: string;
        };
        Update: {
          author_avatar_url?: string | null;
          author_id?: string;
          author_name?: string;
          content?: string;
          created_at?: string;
          deleted_at?: string | null;
          id?: string;
          is_shareable?: boolean;
          journal_date?: string;
          metadata?: Json | null;
          published_at?: string;
          share_count?: number;
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      diary_state: {
        Row: {
          counselor_id: string;
          id: string;
          last_chunk_path: string | null;
          last_index: number | null;
          last_journal_date: string | null;
          updated_at: string;
        };
        Insert: {
          counselor_id: string;
          id?: string;
          last_chunk_path?: string | null;
          last_index?: number | null;
          last_journal_date?: string | null;
          updated_at?: string;
        };
        Update: {
          counselor_id?: string;
          id?: string;
          last_chunk_path?: string | null;
          last_index?: number | null;
          last_journal_date?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      increment_diary_share_count: {
        Args: {
          target_entry_id: string;
        };
        Returns: number;
      };
      increment_counselor_session: {
        Args: {
          target_counselor: string;
        };
        Returns: void;
      };
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
      match_michelle_knowledge: {
        Args: {
          query_embedding: unknown;
          match_count?: number;
          similarity_threshold?: number;
        };
        Returns: {
          id: string;
          content: string;
          metadata: Json | null;
          similarity: number;
        }[];
      };
      match_michelle_knowledge_sinr: {
        Args: {
          query_embedding: unknown;
          match_count?: number;
          similarity_threshold?: number;
        };
        Returns: {
          parent_id: string;
          parent_content: string;
          parent_metadata: Json | null;
          parent_source: string;
          child_similarity: number;
        }[];
      };
      match_clinical_knowledge_sinr: {
        Args: {
          query_embedding: unknown;
          match_count?: number;
          similarity_threshold?: number;
        };
        Returns: {
          parent_id: string;
          parent_content: string;
          parent_metadata: Json | null;
          parent_source: string;
          child_similarity: number;
        }[];
      };
    };
    Enums: {
      michelle_message_role: "user" | "assistant" | "system";
      michelle_session_category: "love" | "life" | "relationship";
      clinical_message_role: "user" | "assistant" | "system";
    };
    CompositeTypes: Record<string, never>;
  };
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
