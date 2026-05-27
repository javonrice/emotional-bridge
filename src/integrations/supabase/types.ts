export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_feedback: {
        Row: {
          answers_snapshot: Json | null
          comment: string | null
          created_at: string
          id: string
          model: string | null
          prompt_version: string | null
          rating: Database["public"]["Enums"]["ai_rating"]
          reason: Database["public"]["Enums"]["ai_feedback_reason"] | null
          source_id: string
          surface: Database["public"]["Enums"]["ai_surface"]
          user_id: string
        }
        Insert: {
          answers_snapshot?: Json | null
          comment?: string | null
          created_at?: string
          id?: string
          model?: string | null
          prompt_version?: string | null
          rating: Database["public"]["Enums"]["ai_rating"]
          reason?: Database["public"]["Enums"]["ai_feedback_reason"] | null
          source_id: string
          surface: Database["public"]["Enums"]["ai_surface"]
          user_id: string
        }
        Update: {
          answers_snapshot?: Json | null
          comment?: string | null
          created_at?: string
          id?: string
          model?: string | null
          prompt_version?: string | null
          rating?: Database["public"]["Enums"]["ai_rating"]
          reason?: Database["public"]["Enums"]["ai_feedback_reason"] | null
          source_id?: string
          surface?: Database["public"]["Enums"]["ai_surface"]
          user_id?: string
        }
        Relationships: []
      }
      checkins: {
        Row: {
          activity: string
          created_at: string
          emotion: string
          energy: string
          id: string
          user_id: string
        }
        Insert: {
          activity: string
          created_at?: string
          emotion: string
          energy: string
          id?: string
          user_id: string
        }
        Update: {
          activity?: string
          created_at?: string
          emotion?: string
          energy?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      debriefs: {
        Row: {
          created_at: string
          id: string
          input_text: string
          micro_action: string | null
          model: string | null
          pattern: string | null
          prompt_version: string | null
          reframe: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_text: string
          micro_action?: string | null
          model?: string | null
          pattern?: string | null
          prompt_version?: string | null
          reframe?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_text?: string
          micro_action?: string | null
          model?: string | null
          pattern?: string | null
          prompt_version?: string | null
          reframe?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ios_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      loops: {
        Row: {
          answers_snapshot: Json | null
          created_at: string
          id: string
          is_current: boolean
          model: string | null
          name: string
          prompt_version: string | null
          summary: string
          trigger_chain: Json
          user_id: string
        }
        Insert: {
          answers_snapshot?: Json | null
          created_at?: string
          id?: string
          is_current?: boolean
          model?: string | null
          name: string
          prompt_version?: string | null
          summary: string
          trigger_chain?: Json
          user_id: string
        }
        Update: {
          answers_snapshot?: Json | null
          created_at?: string
          id?: string
          is_current?: boolean
          model?: string | null
          name?: string
          prompt_version?: string | null
          summary?: string
          trigger_chain?: Json
          user_id?: string
        }
        Relationships: []
      }
      onboarding_answers: {
        Row: {
          age: string | null
          apps: Json | null
          completed_at: string | null
          control: number | null
          created_at: string
          duration: string | null
          feeling: string | null
          story: string | null
          timing: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: string | null
          apps?: Json | null
          completed_at?: string | null
          control?: number | null
          created_at?: string
          duration?: string | null
          feeling?: string | null
          story?: string | null
          timing?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: string | null
          apps?: Json | null
          completed_at?: string | null
          control?: number | null
          created_at?: string
          duration?: string | null
          feeling?: string | null
          story?: string | null
          timing?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          plan: string | null
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_end: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          plan?: string | null
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_end?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_feedback_reason:
        | "generic"
        | "inaccurate"
        | "tone_off"
        | "too_long"
        | "other"
      ai_rating: "up" | "down"
      ai_surface: "loop_card" | "debrief_card" | "monthly_report"
      app_role: "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ai_feedback_reason: [
        "generic",
        "inaccurate",
        "tone_off",
        "too_long",
        "other",
      ],
      ai_rating: ["up", "down"],
      ai_surface: ["loop_card", "debrief_card", "monthly_report"],
      app_role: ["admin", "user"],
    },
  },
} as const
