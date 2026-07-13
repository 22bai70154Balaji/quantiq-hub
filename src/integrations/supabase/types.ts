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
      ai_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      favorite_currencies: {
        Row: {
          base: string
          created_at: string
          id: string
          quote: string
          user_id: string
        }
        Insert: {
          base: string
          created_at?: string
          id?: string
          quote: string
          user_id: string
        }
        Update: {
          base?: string
          created_at?: string
          id?: string
          quote?: string
          user_id?: string
        }
        Relationships: []
      }
      holding_prices: {
        Row: {
          asset_class: Database["public"]["Enums"]["asset_class"]
          currency: string
          fetched_at: string
          price: number
          symbol: string
        }
        Insert: {
          asset_class: Database["public"]["Enums"]["asset_class"]
          currency?: string
          fetched_at?: string
          price: number
          symbol: string
        }
        Update: {
          asset_class?: Database["public"]["Enums"]["asset_class"]
          currency?: string
          fetched_at?: string
          price?: number
          symbol?: string
        }
        Relationships: []
      }
      holdings: {
        Row: {
          asset_class: Database["public"]["Enums"]["asset_class"]
          avg_cost: number
          created_at: string
          currency: string
          id: string
          manual_price: number | null
          name: string
          notes: string | null
          purchase_date: string | null
          quantity: number
          symbol: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_class: Database["public"]["Enums"]["asset_class"]
          avg_cost?: number
          created_at?: string
          currency?: string
          id?: string
          manual_price?: number | null
          name: string
          notes?: string | null
          purchase_date?: string | null
          quantity?: number
          symbol?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_class?: Database["public"]["Enums"]["asset_class"]
          avg_cost?: number
          created_at?: string
          currency?: string
          id?: string
          manual_price?: number | null
          name?: string
          notes?: string | null
          purchase_date?: string | null
          quantity?: number
          symbol?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      net_worth_entries: {
        Row: {
          amount: number
          as_of: string
          category: Database["public"]["Enums"]["nw_category"]
          created_at: string
          currency: string
          id: string
          kind: Database["public"]["Enums"]["nw_kind"]
          label: string
          notes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          as_of?: string
          category: Database["public"]["Enums"]["nw_category"]
          created_at?: string
          currency?: string
          id?: string
          kind: Database["public"]["Enums"]["nw_kind"]
          label: string
          notes?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          as_of?: string
          category?: Database["public"]["Enums"]["nw_category"]
          created_at?: string
          currency?: string
          id?: string
          kind?: Database["public"]["Enums"]["nw_kind"]
          label?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country: string
          created_at: string
          currency: string
          display_name: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          country?: string
          created_at?: string
          currency?: string
          display_name?: string | null
          email?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          country?: string
          created_at?: string
          currency?: string
          display_name?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      saved_calculations: {
        Row: {
          ai_insights: Json | null
          calculator_type: string
          country: string | null
          created_at: string
          id: string
          inputs: Json
          is_public: boolean
          name: string
          report_id: string | null
          results: Json
          share_slug: string | null
          summary: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_insights?: Json | null
          calculator_type: string
          country?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          is_public?: boolean
          name: string
          report_id?: string | null
          results?: Json
          share_slug?: string | null
          summary?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_insights?: Json | null
          calculator_type?: string
          country?: string | null
          created_at?: string
          id?: string
          inputs?: Json
          is_public?: boolean
          name?: string
          report_id?: string | null
          results?: Json
          share_slug?: string | null
          summary?: Json
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
          role: Database["public"]["Enums"]["app_role"]
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
      app_role: "admin" | "user"
      asset_class:
        | "stock"
        | "etf"
        | "mutual_fund"
        | "crypto"
        | "gold"
        | "fd"
        | "bond"
        | "epf"
        | "ppf"
        | "nps"
      nw_category:
        | "cash"
        | "investments"
        | "real_estate"
        | "other_asset"
        | "loan"
        | "credit_card"
        | "other_liability"
      nw_kind: "asset" | "liability"
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
      app_role: ["admin", "user"],
      asset_class: [
        "stock",
        "etf",
        "mutual_fund",
        "crypto",
        "gold",
        "fd",
        "bond",
        "epf",
        "ppf",
        "nps",
      ],
      nw_category: [
        "cash",
        "investments",
        "real_estate",
        "other_asset",
        "loan",
        "credit_card",
        "other_liability",
      ],
      nw_kind: ["asset", "liability"],
    },
  },
} as const
