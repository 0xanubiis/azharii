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
      channels: {
        Row: {
          college_id: string | null
          created_at: string | null
          department_id: string | null
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          is_official: boolean | null
          location_id: string | null
          name_ar: string
          type: Database["public"]["Enums"]["channel_type"]
        }
        Insert: {
          college_id?: string | null
          created_at?: string | null
          department_id?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          is_official?: boolean | null
          location_id?: string | null
          name_ar: string
          type: Database["public"]["Enums"]["channel_type"]
        }
        Update: {
          college_id?: string | null
          created_at?: string | null
          department_id?: string | null
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          is_official?: boolean | null
          location_id?: string | null
          name_ar?: string
          type?: Database["public"]["Enums"]["channel_type"]
        }
        Relationships: [
          {
            foreignKeyName: "channels_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "channels_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "college_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      college_locations: {
        Row: {
          college_id: string
          created_at: string
          id: string
          name_ar: string
        }
        Insert: {
          college_id: string
          created_at?: string
          id?: string
          name_ar: string
        }
        Update: {
          college_id?: string
          created_at?: string
          id?: string
          name_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "college_locations_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      colleges: {
        Row: {
          created_at: string | null
          description_ar: string | null
          id: string
          name_ar: string
        }
        Insert: {
          created_at?: string | null
          description_ar?: string | null
          id?: string
          name_ar: string
        }
        Update: {
          created_at?: string | null
          description_ar?: string | null
          id?: string
          name_ar?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          college_id: string
          created_at: string | null
          id: string
          name_ar: string
        }
        Insert: {
          college_id: string
          created_at?: string | null
          id?: string
          name_ar: string
        }
        Update: {
          college_id?: string
          created_at?: string | null
          id?: string
          name_ar?: string
        }
        Relationships: [
          {
            foreignKeyName: "departments_college_id_fkey"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_channels: {
        Row: {
          created_at: string | null
          id: string
          user1_id: string
          user2_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          user1_id: string
          user2_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          user1_id?: string
          user2_id?: string
        }
        Relationships: []
      }
      dm_messages: {
        Row: {
          content: string | null
          created_at: string | null
          dm_channel_id: string
          file_type: string | null
          file_url: string | null
          id: string
          reply_to: string | null
          sender_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          dm_channel_id: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          reply_to?: string | null
          sender_id: string
        }
        Update: {
          content?: string | null
          created_at?: string | null
          dm_channel_id?: string
          file_type?: string | null
          file_url?: string | null
          id?: string
          reply_to?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_dm_channel_id_fkey"
            columns: ["dm_channel_id"]
            isOneToOne: false
            referencedRelation: "dm_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "dm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitations: {
        Row: {
          created_at: string | null
          id: string
          receiver_id: string
          sender_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          receiver_id: string
          sender_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          receiver_id?: string
          sender_id?: string
          status?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          channel_id: string
          content: string | null
          created_at: string | null
          file_type: string | null
          file_url: string | null
          id: string
          reply_to: string | null
          user_id: string
        }
        Insert: {
          channel_id: string
          content?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          reply_to?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string
          content?: string | null
          created_at?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          reply_to?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_fkey"
            columns: ["reply_to"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content_ar: string | null
          created_at: string | null
          id: string
          link: string | null
          read: boolean | null
          title_ar: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          content_ar?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title_ar: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          content_ar?: string | null
          created_at?: string | null
          id?: string
          link?: string | null
          read?: boolean | null
          title_ar?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      profile_moderation: {
        Row: {
          ban_reason: string | null
          banned_at: string | null
          created_at: string
          kicked_at: string | null
          timeout_until: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          kicked_at?: string | null
          timeout_until?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ban_reason?: string | null
          banned_at?: string | null
          created_at?: string
          kicked_at?: string | null
          timeout_until?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_moderation_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          college_id: string | null
          created_at: string | null
          department_id: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          last_name_change_at: string | null
          last_username_change_at: string | null
          location_id: string | null
          notify_dm: boolean
          notify_invitations: boolean
          onboarding_completed: boolean | null
          updated_at: string | null
          username: string
        }
        Insert: {
          avatar_url?: string | null
          college_id?: string | null
          created_at?: string | null
          department_id?: string | null
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          last_name_change_at?: string | null
          last_username_change_at?: string | null
          location_id?: string | null
          notify_dm?: boolean
          notify_invitations?: boolean
          onboarding_completed?: boolean | null
          updated_at?: string | null
          username: string
        }
        Update: {
          avatar_url?: string | null
          college_id?: string | null
          created_at?: string | null
          department_id?: string | null
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          last_name_change_at?: string | null
          last_username_change_at?: string | null
          location_id?: string | null
          notify_dm?: boolean
          notify_invitations?: boolean
          onboarding_completed?: boolean | null
          updated_at?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_college"
            columns: ["college_id"]
            isOneToOne: false
            referencedRelation: "colleges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_department"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "college_locations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
      admin_moderation_list: {
        Args: never
        Returns: {
          ban_reason: string
          banned_at: string
          kicked_at: string
          timeout_until: string
          user_id: string
        }[]
      }
      can_access_message_file: { Args: { _path: string }; Returns: boolean }
      can_user_post: { Args: { _user_id: string }; Returns: boolean }
      current_profile_scope: {
        Args: never
        Returns: {
          college_id: string
          department_id: string
          gender: string
          location_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_moderation_status: {
        Args: never
        Returns: {
          ban_reason: string
          banned_at: string
          kicked_at: string
          timeout_until: string
        }[]
      }
      users_same_gender: { Args: { _a: string; _b: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "publisher" | "user"
      channel_type: "text" | "voice" | "video"
      gender_type: "male" | "female"
      notification_type: "mention" | "news" | "invitation" | "file" | "reply"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "moderator", "publisher", "user"],
      channel_type: ["text", "voice", "video"],
      gender_type: ["male", "female"],
      notification_type: ["mention", "news", "invitation", "file", "reply"],
    },
  },
} as const
