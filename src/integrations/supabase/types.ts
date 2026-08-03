export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.15";
  };
  public: {
    Tables: {
      audits: {
        Row: {
          completed_at: string | null;
          created_at: string;
          critical_count: number;
          error_message: string | null;
          file_count: number;
          filename: string | null;
          health_score: number | null;
          high_count: number;
          id: string;
          language: string | null;
          line_count: number;
          low_count: number;
          medium_count: number;
          name: string;
          progress: number;
          progress_label: string | null;
          repo_branch: string | null;
          repo_full_name: string | null;
          share_token: string | null;
          source_type: string;
          started_at: string;
          status: string;
          user_id: string;
          verdict: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          critical_count?: number;
          error_message?: string | null;
          file_count?: number;
          filename?: string | null;
          health_score?: number | null;
          high_count?: number;
          id?: string;
          language?: string | null;
          line_count?: number;
          low_count?: number;
          medium_count?: number;
          name: string;
          progress?: number;
          progress_label?: string | null;
          repo_branch?: string | null;
          repo_full_name?: string | null;
          share_token?: string | null;
          source_type?: string;
          started_at?: string;
          status?: string;
          user_id: string;
          verdict?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          critical_count?: number;
          error_message?: string | null;
          file_count?: number;
          filename?: string | null;
          health_score?: number | null;
          high_count?: number;
          id?: string;
          language?: string | null;
          line_count?: number;
          low_count?: number;
          medium_count?: number;
          name?: string;
          progress?: number;
          progress_label?: string | null;
          repo_branch?: string | null;
          repo_full_name?: string | null;
          share_token?: string | null;
          source_type?: string;
          started_at?: string;
          status?: string;
          user_id?: string;
          verdict?: string | null;
        };
        Relationships: [];
      };
      github_connections: {
        Row: {
          access_token: string;
          auth_kind: string;
          created_at: string;
          github_login: string | null;
          scope: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          access_token: string;
          auth_kind?: string;
          created_at?: string;
          github_login?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          access_token?: string;
          auth_kind?: string;
          created_at?: string;
          github_login?: string | null;
          scope?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      issues: {
        Row: {
          audit_id: string;
          code_snippet: string | null;
          created_at: string;
          description: string | null;
          file_path: string | null;
          fix_code_after: string | null;
          fix_code_before: string | null;
          id: string;
          impact_description: string | null;
          line_number: number | null;
          recommendation: string | null;
          severity: string;
          status: string;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          audit_id: string;
          code_snippet?: string | null;
          created_at?: string;
          description?: string | null;
          file_path?: string | null;
          fix_code_after?: string | null;
          fix_code_before?: string | null;
          id?: string;
          impact_description?: string | null;
          line_number?: number | null;
          recommendation?: string | null;
          severity: string;
          status?: string;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          audit_id?: string;
          code_snippet?: string | null;
          created_at?: string;
          description?: string | null;
          file_path?: string | null;
          fix_code_after?: string | null;
          fix_code_before?: string | null;
          id?: string;
          impact_description?: string | null;
          line_number?: number | null;
          recommendation?: string | null;
          severity?: string;
          status?: string;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "issues_audit_id_fkey";
            columns: ["audit_id"];
            isOneToOne: false;
            referencedRelation: "audits";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string | null;
          id: string;
          updated_at: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id: string;
          updated_at?: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subscriptions: {
        Row: {
          audits_per_month: number;
          audits_used_this_month: number;
          created_at: string;
          id: string;
          period_start: string;
          plan_id: string;
          status: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          audits_per_month?: number;
          audits_used_this_month?: number;
          created_at?: string;
          id?: string;
          period_start?: string;
          plan_id?: string;
          status?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          audits_per_month?: number;
          audits_used_this_month?: number;
          created_at?: string;
          id?: string;
          period_start?: string;
          plan_id?: string;
          status?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
