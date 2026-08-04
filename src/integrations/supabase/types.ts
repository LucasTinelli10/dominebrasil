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
      archived_conversations: {
        Row: {
          archived_at: string
          id: string
          participant_id: string
          user_id: string
        }
        Insert: {
          archived_at?: string
          id?: string
          participant_id: string
          user_id: string
        }
        Update: {
          archived_at?: string
          id?: string
          participant_id?: string
          user_id?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          car_id: string | null
          created_at: string | null
          date: string
          id: string
          instructor_id: string | null
          notes: string | null
          status: Database["public"]["Enums"]["booking_status"] | null
          student_id: string | null
          time_slot: string
          total_price: number
          updated_at: string | null
        }
        Insert: {
          car_id?: string | null
          created_at?: string | null
          date: string
          id?: string
          instructor_id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          student_id?: string | null
          time_slot: string
          total_price: number
          updated_at?: string | null
        }
        Update: {
          car_id?: string | null
          created_at?: string | null
          date?: string
          id?: string
          instructor_id?: string | null
          notes?: string | null
          status?: Database["public"]["Enums"]["booking_status"] | null
          student_id?: string | null
          time_slot?: string
          total_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      car_maintenance: {
        Row: {
          car_id: string
          cost: number
          created_at: string
          date: string
          description: string | null
          id: string
          km: number | null
          next_date: string | null
          next_km: number | null
          owner_id: string
          type: string
          updated_at: string
        }
        Insert: {
          car_id: string
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          km?: number | null
          next_date?: string | null
          next_km?: number | null
          owner_id: string
          type: string
          updated_at?: string
        }
        Update: {
          car_id?: string
          cost?: number
          created_at?: string
          date?: string
          description?: string | null
          id?: string
          km?: number | null
          next_date?: string | null
          next_km?: number | null
          owner_id?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "car_maintenance_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_maintenance_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      car_rentals: {
        Row: {
          car_id: string
          created_at: string | null
          date: string
          id: string
          instructor_id: string
          status: Database["public"]["Enums"]["car_rental_status"] | null
          time_slot: string
          updated_at: string | null
        }
        Insert: {
          car_id: string
          created_at?: string | null
          date: string
          id?: string
          instructor_id: string
          status?: Database["public"]["Enums"]["car_rental_status"] | null
          time_slot: string
          updated_at?: string | null
        }
        Update: {
          car_id?: string
          created_at?: string | null
          date?: string
          id?: string
          instructor_id?: string
          status?: Database["public"]["Enums"]["car_rental_status"] | null
          time_slot?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "car_rentals_car_id_fkey"
            columns: ["car_id"]
            isOneToOne: false
            referencedRelation: "cars"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "car_rentals_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cars: {
        Row: {
          ai_analysis_report: Json | null
          available: boolean | null
          created_at: string | null
          crlv_url: string | null
          id: string
          image_url: string | null
          location_hub: string | null
          model: string
          owner_id: string | null
          photo_exterior_front: string | null
          photo_exterior_side: string | null
          photo_interior_passenger: string | null
          plate: string
          price_per_hour: number | null
          transmission: Database["public"]["Enums"]["transmission_type"] | null
          verification_status: string | null
        }
        Insert: {
          ai_analysis_report?: Json | null
          available?: boolean | null
          created_at?: string | null
          crlv_url?: string | null
          id?: string
          image_url?: string | null
          location_hub?: string | null
          model: string
          owner_id?: string | null
          photo_exterior_front?: string | null
          photo_exterior_side?: string | null
          photo_interior_passenger?: string | null
          plate: string
          price_per_hour?: number | null
          transmission?: Database["public"]["Enums"]["transmission_type"] | null
          verification_status?: string | null
        }
        Update: {
          ai_analysis_report?: Json | null
          available?: boolean | null
          created_at?: string | null
          crlv_url?: string | null
          id?: string
          image_url?: string | null
          location_hub?: string | null
          model?: string
          owner_id?: string | null
          photo_exterior_front?: string | null
          photo_exterior_side?: string | null
          photo_interior_passenger?: string | null
          plate?: string
          price_per_hour?: number | null
          transmission?: Database["public"]["Enums"]["transmission_type"] | null
          verification_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cars_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_packages: {
        Row: {
          active: boolean
          created_at: string
          id: string
          includes_exam: boolean
          instructor_id: string
          lesson_count: number
          name: string
          price: number
          updated_at: string
          use_own_car: boolean
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          includes_exam?: boolean
          instructor_id: string
          lesson_count: number
          name: string
          price: number
          updated_at?: string
          use_own_car?: boolean
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          includes_exam?: boolean
          instructor_id?: string
          lesson_count?: number
          name?: string
          price?: number
          updated_at?: string
          use_own_car?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "instructor_packages_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      instructor_schedule_blocks: {
        Row: {
          created_at: string
          date: string
          id: string
          instructor_id: string
          reason: string | null
          time_slot: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          instructor_id: string
          reason?: string | null
          time_slot: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          instructor_id?: string
          reason?: string | null
          time_slot?: string
        }
        Relationships: []
      }
      instructors_details: {
        Row: {
          background_check_status: string | null
          badges: string[] | null
          bio: string | null
          cnh_category: string | null
          cnh_expiry_date: string | null
          cnh_number: string | null
          cnh_qrcode_raw: string | null
          created_at: string | null
          credential_expiry: string | null
          credential_number: string | null
          documents_url: Json | null
          id: string
          is_vehicle_owner: boolean
          price_per_hour: number | null
          profile_id: string | null
          rating: number | null
          total_lessons: number | null
          years_experience: number | null
        }
        Insert: {
          background_check_status?: string | null
          badges?: string[] | null
          bio?: string | null
          cnh_category?: string | null
          cnh_expiry_date?: string | null
          cnh_number?: string | null
          cnh_qrcode_raw?: string | null
          created_at?: string | null
          credential_expiry?: string | null
          credential_number?: string | null
          documents_url?: Json | null
          id?: string
          is_vehicle_owner?: boolean
          price_per_hour?: number | null
          profile_id?: string | null
          rating?: number | null
          total_lessons?: number | null
          years_experience?: number | null
        }
        Update: {
          background_check_status?: string | null
          badges?: string[] | null
          bio?: string | null
          cnh_category?: string | null
          cnh_expiry_date?: string | null
          cnh_number?: string | null
          cnh_qrcode_raw?: string | null
          created_at?: string | null
          credential_expiry?: string | null
          credential_number?: string | null
          documents_url?: Json | null
          id?: string
          is_vehicle_owner?: boolean
          price_per_hour?: number | null
          profile_id?: string | null
          rating?: number | null
          total_lessons?: number | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "instructors_details_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_feedback: {
        Row: {
          areas_to_improve: string[] | null
          booking_id: string
          created_at: string
          feedback: string | null
          id: string
          instructor_id: string
          rating: number | null
          strengths: string[] | null
          student_id: string
        }
        Insert: {
          areas_to_improve?: string[] | null
          booking_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          instructor_id: string
          rating?: number | null
          strengths?: string[] | null
          student_id: string
        }
        Update: {
          areas_to_improve?: string[] | null
          booking_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          instructor_id?: string
          rating?: number | null
          strengths?: string[] | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_feedback_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_verifications: {
        Row: {
          blocked_until: string | null
          booking_id: string
          code: string
          created_at: string | null
          distance_meters: number | null
          expires_at: string
          failed_attempts: number | null
          id: string
          instructor_lat: number | null
          instructor_lng: number | null
          student_lat: number | null
          student_lng: number | null
          type: string
          verified: boolean | null
        }
        Insert: {
          blocked_until?: string | null
          booking_id: string
          code: string
          created_at?: string | null
          distance_meters?: number | null
          expires_at: string
          failed_attempts?: number | null
          id?: string
          instructor_lat?: number | null
          instructor_lng?: number | null
          student_lat?: number | null
          student_lng?: number | null
          type: string
          verified?: boolean | null
        }
        Update: {
          blocked_until?: string | null
          booking_id?: string
          code?: string
          created_at?: string | null
          distance_meters?: number | null
          expires_at?: string
          failed_attempts?: number | null
          id?: string
          instructor_lat?: number | null
          instructor_lng?: number | null
          student_lat?: number | null
          student_lng?: number | null
          type?: string
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_verifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          booking_id: string | null
          content: string
          created_at: string
          id: string
          read: boolean | null
          receiver_id: string
          sender_id: string
        }
        Insert: {
          booking_id?: string | null
          content: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id: string
          sender_id: string
        }
        Update: {
          booking_id?: string | null
          content?: string
          created_at?: string
          id?: string
          read?: boolean | null
          receiver_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          balance: number | null
          balance_pending: number | null
          city: string | null
          cpf: string | null
          created_at: string | null
          fraud_score: number | null
          full_name: string | null
          id: string
          neighborhood: string | null
          phone: string | null
          pix_key: string | null
          status: Database["public"]["Enums"]["profile_status"] | null
          total_withdrawn: number | null
          updated_at: string | null
          verification_reason: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Insert: {
          avatar_url?: string | null
          balance?: number | null
          balance_pending?: number | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          fraud_score?: number | null
          full_name?: string | null
          id: string
          neighborhood?: string | null
          phone?: string | null
          pix_key?: string | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          total_withdrawn?: number | null
          updated_at?: string | null
          verification_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Update: {
          avatar_url?: string | null
          balance?: number | null
          balance_pending?: number | null
          city?: string | null
          cpf?: string | null
          created_at?: string | null
          fraud_score?: number | null
          full_name?: string | null
          id?: string
          neighborhood?: string | null
          phone?: string | null
          pix_key?: string | null
          status?: Database["public"]["Enums"]["profile_status"] | null
          total_withdrawn?: number | null
          updated_at?: string | null
          verification_reason?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          reference_id: string | null
          status: string | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          reference_id?: string | null
          status?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          fee: number | null
          id: string
          instructor_id: string
          net_amount: number
          pix_key: string
          processed_at: string | null
          status: string | null
          type: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          fee?: number | null
          id?: string
          instructor_id: string
          net_amount: number
          pix_key: string
          processed_at?: string | null
          status?: string | null
          type?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          fee?: number | null
          id?: string
          instructor_id?: string
          net_amount?: number
          pix_key?: string
          processed_at?: string | null
          status?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_instructor_id_fkey"
            columns: ["instructor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_approve_instructor: {
        Args: { instructor_id: string }
        Returns: undefined
      }
      admin_approve_user: { Args: { user_id: string }; Returns: undefined }
      admin_list_instructor_verifications: {
        Args: never
        Returns: {
          background_check_status: string
          cnh_category: string
          cnh_number: string
          created_at: string
          credential_number: string
          fraud_score: number
          full_name: string
          id: string
          verification_reason: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      admin_list_pending_approvals: {
        Args: never
        Returns: {
          avatar_url: string
          background_check_status: string
          cnh_category: string
          cnh_number: string
          created_at: string
          credential_number: string
          documents_url: Json
          email: string
          fraud_score: number
          full_name: string
          id: string
          phone: string
          role: string
          verification_reason: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      admin_reject_instructor: {
        Args: { instructor_id: string }
        Returns: undefined
      }
      admin_reject_user_with_reason: {
        Args: { reason: string; user_id: string }
        Returns: undefined
      }
      check_availability: {
        Args: { check_date: string; check_time: string; instr_id: string }
        Returns: boolean
      }
      complete_lesson: {
        Args: {
          p_areas_to_improve?: string[]
          p_booking_id: string
          p_code?: string
          p_feedback?: string
          p_lat?: number
          p_lng?: number
          p_rating?: number
          p_strengths?: string[]
        }
        Returns: undefined
      }
      generate_lesson_code: {
        Args: {
          p_booking_id: string
          p_lat?: number
          p_lng?: number
          p_type: string
        }
        Returns: string
      }
      get_all_approved_instructors: {
        Args: never
        Returns: {
          avatar_url: string
          badges: string[]
          bio: string
          city: string
          full_name: string
          instructor_id: string
          price_per_hour: number
          rating: number
          total_lessons: number
          years_experience: number
        }[]
      }
      get_approved_instructors: {
        Args: never
        Returns: {
          avatar_url: string
          city: string
          full_name: string
          id: string
        }[]
      }
      get_available_cars: {
        Args: never
        Returns: {
          available: boolean
          id: string
          image_url: string
          location_hub: string
          model: string
          photo_exterior_front: string
          photo_exterior_side: string
          plate: string
          price_per_hour: number
          transmission: Database["public"]["Enums"]["transmission_type"]
        }[]
      }
      get_car_public_details: {
        Args: { car_id: string }
        Returns: {
          available: boolean
          id: string
          image_url: string
          location_hub: string
          model: string
          photo_exterior_front: string
          photo_exterior_side: string
          plate: string
          price_per_hour: number
          transmission: Database["public"]["Enums"]["transmission_type"]
        }[]
      }
      get_instructor_packages: {
        Args: { p_instructor_id: string }
        Returns: {
          active: boolean
          id: string
          includes_exam: boolean
          instructor_id: string
          lesson_count: number
          name: string
          price: number
        }[]
      }
      get_public_instructor_details: {
        Args: { instructor_id: string }
        Returns: {
          badges: string[]
          bio: string
          id: string
          price_per_hour: number
          profile_id: string
          rating: number
          total_lessons: number
          years_experience: number
        }[]
      }
      get_public_instructor_profile: {
        Args: { instructor_id: string }
        Returns: {
          avatar_url: string
          city: string
          full_name: string
          id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      resolve_instructor_profile_id: {
        Args: { instructor_ref: string }
        Returns: string
      }
      start_lesson:
        | { Args: { p_booking_id: string }; Returns: undefined }
        | {
            Args: {
              p_booking_id: string
              p_code?: string
              p_lat?: number
              p_lng?: number
            }
            Returns: undefined
          }
      verify_lesson_code: {
        Args: { p_booking_id: string; p_code: string; p_type: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "instructor" | "investor" | "admin"
      booking_status:
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
      car_rental_status: "pending" | "confirmed" | "completed" | "cancelled"
      profile_status: "pending" | "approved"
      transmission_type: "manual" | "auto"
      verification_status: "pending" | "analyzing" | "approved" | "rejected"
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
      app_role: ["student", "instructor", "investor", "admin"],
      booking_status: [
        "pending",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
      ],
      car_rental_status: ["pending", "confirmed", "completed", "cancelled"],
      profile_status: ["pending", "approved"],
      transmission_type: ["manual", "auto"],
      verification_status: ["pending", "analyzing", "approved", "rejected"],
    },
  },
} as const
