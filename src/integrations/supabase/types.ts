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
      appointments: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          commission_amount: number
          created_at: string
          duration_minutes: number
          gross_amount: number
          id: string
          modality: Database["public"]["Enums"]["appointment_modality"]
          net_amount: number
          notes: string | null
          patient_id: string
          patient_notes: string | null
          payment_method: string | null
          payment_status: string
          price: number
          professional_id: string
          professional_notes: string | null
          scheduled_at: string
          service_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          commission_amount?: number
          created_at?: string
          duration_minutes?: number
          gross_amount?: number
          id?: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          net_amount?: number
          notes?: string | null
          patient_id: string
          patient_notes?: string | null
          payment_method?: string | null
          payment_status?: string
          price?: number
          professional_id: string
          professional_notes?: string | null
          scheduled_at: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          commission_amount?: number
          created_at?: string
          duration_minutes?: number
          gross_amount?: number
          id?: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          net_amount?: number
          notes?: string | null
          patient_id?: string
          patient_notes?: string | null
          payment_method?: string | null
          payment_status?: string
          price?: number
          professional_id?: string
          professional_notes?: string | null
          scheduled_at?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          slug: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
        }
        Relationships: []
      }
      companies: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          approved_at: string | null
          approved_by: string | null
          cnpj: string | null
          created_at: string
          description: string | null
          email: string | null
          id: string
          legal_name: string
          logo_url: string | null
          owner_id: string
          phone: string | null
          status: Database["public"]["Enums"]["professional_status"]
          trade_name: string | null
          type: Database["public"]["Enums"]["company_type"]
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          legal_name: string
          logo_url?: string | null
          owner_id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["professional_status"]
          trade_name?: string | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          approved_at?: string | null
          approved_by?: string | null
          cnpj?: string | null
          created_at?: string
          description?: string | null
          email?: string | null
          id?: string
          legal_name?: string
          logo_url?: string | null
          owner_id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["professional_status"]
          trade_name?: string | null
          type?: Database["public"]["Enums"]["company_type"]
          updated_at?: string
        }
        Relationships: []
      }
      company_members: {
        Row: {
          company_id: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["company_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_members_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          company_id: string | null
          created_at: string
          id: string
          patient_id: string
          professional_id: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          id?: string
          patient_id: string
          professional_id?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          professional_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "favorites_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "favorites_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      health_documents: {
        Row: {
          document_type: string
          file_url: string | null
          id: string
          notes: string | null
          patient_id: string
          title: string
          uploaded_at: string
        }
        Insert: {
          document_type?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          patient_id: string
          title: string
          uploaded_at?: string
        }
        Update: {
          document_type?: string
          file_url?: string | null
          id?: string
          notes?: string | null
          patient_id?: string
          title?: string
          uploaded_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          appointment_id: string
          content: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          appointment_id: string
          content: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          appointment_id?: string
          content?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string
          created_at: string
          id: string
          method: string | null
          paid_at: string | null
          patient_id: string
          status: Database["public"]["Enums"]["payment_status"]
        }
        Insert: {
          amount: number
          appointment_id: string
          created_at?: string
          id?: string
          method?: string | null
          paid_at?: string | null
          patient_id: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Update: {
          amount?: number
          appointment_id?: string
          created_at?: string
          id?: string
          method?: string | null
          paid_at?: string | null
          patient_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          paid_at: string | null
          provider_id: string
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          id?: string
          paid_at?: string | null
          provider_id: string
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          paid_at?: string | null
          provider_id?: string
          status?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          cancellation_window_hours: number
          commission_percent: number
          id: number
          refund_policy: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cancellation_window_hours?: number
          commission_percent?: number
          id?: number
          refund_policy?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cancellation_window_hours?: number
          commission_percent?: number
          id?: number
          refund_policy?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      professional_availability: {
        Row: {
          active: boolean
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          professional_id: string
          start_time: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          professional_id: string
          start_time: string
        }
        Update: {
          active?: boolean
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          professional_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_availability_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_blocked_slots: {
        Row: {
          created_at: string
          ends_at: string
          id: string
          professional_id: string
          reason: string | null
          starts_at: string
        }
        Insert: {
          created_at?: string
          ends_at: string
          id?: string
          professional_id: string
          reason?: string | null
          starts_at: string
        }
        Update: {
          created_at?: string
          ends_at?: string
          id?: string
          professional_id?: string
          reason?: string | null
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_blocked_slots_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          address_city: string | null
          address_state: string | null
          address_street: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          company_id: string | null
          consultation_price: number
          created_at: string
          id: string
          modality: Database["public"]["Enums"]["appointment_modality"]
          phone: string | null
          professional_registry: string
          rating_average: number
          rating_count: number
          specialty_id: string | null
          status: Database["public"]["Enums"]["professional_status"]
          total_appointments: number
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          consultation_price?: number
          created_at?: string
          id: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          phone?: string | null
          professional_registry: string
          rating_average?: number
          rating_count?: number
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["professional_status"]
          total_appointments?: number
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_state?: string | null
          address_street?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          company_id?: string | null
          consultation_price?: number
          created_at?: string
          id?: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          phone?: string | null
          professional_registry?: string
          rating_average?: number
          rating_count?: number
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["professional_status"]
          total_appointments?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professionals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          created_at: string
          date_of_birth: string | null
          email: string
          full_name: string
          gender: Database["public"]["Enums"]["gender_type"] | null
          id: string
          phone: string | null
          state: string | null
          suspended: boolean
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email: string
          full_name: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id: string
          phone?: string | null
          state?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          date_of_birth?: string | null
          email?: string
          full_name?: string
          gender?: Database["public"]["Enums"]["gender_type"] | null
          id?: string
          phone?: string | null
          state?: string | null
          suspended?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string
          comment: string | null
          created_at: string
          id: string
          patient_id: string
          professional_id: string
          rating: number
          status: Database["public"]["Enums"]["review_status"]
        }
        Insert: {
          appointment_id: string
          comment?: string | null
          created_at?: string
          id?: string
          patient_id: string
          professional_id: string
          rating: number
          status?: Database["public"]["Enums"]["review_status"]
        }
        Update: {
          appointment_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          patient_id?: string
          professional_id?: string
          rating?: number
          status?: Database["public"]["Enums"]["review_status"]
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category_id: string | null
          company_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          name: string
          price: number
          professional_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name: string
          price?: number
          professional_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          company_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          name?: string
          price?: number
          professional_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      specialties: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          icon: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          sender_id: string
          ticket_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sender_id: string
          ticket_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sender_id?: string
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          created_at: string
          id: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
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
      wallet_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["tx_kind"]
          payout_id: string | null
          provider_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: Database["public"]["Enums"]["tx_kind"]
          payout_id?: string | null
          provider_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["tx_kind"]
          payout_id?: string | null
          provider_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
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
      is_company_owner: {
        Args: { _company: string; _user: string }
        Returns: boolean
      }
      wallet_balance: { Args: { _provider: string }; Returns: number }
    }
    Enums: {
      app_role: "paciente" | "profissional" | "admin"
      appointment_modality: "presencial" | "telemedicina"
      appointment_status:
        | "agendada"
        | "confirmada"
        | "em_andamento"
        | "realizada"
        | "cancelada"
        | "nao_compareceu"
      company_role: "owner" | "admin" | "profissional"
      company_type:
        | "clinica"
        | "laboratorio"
        | "diagnostico"
        | "estetica"
        | "outros"
      gender_type: "feminino" | "masculino" | "outro" | "prefiro_nao_dizer"
      payment_status: "pendente" | "pago" | "reembolsado" | "falhou"
      professional_status: "pendente" | "aprovado" | "rejeitado" | "suspenso"
      review_status: "publicada" | "oculta" | "denunciada"
      ticket_status: "aberto" | "em_andamento" | "resolvido" | "fechado"
      tx_kind: "credito" | "comissao" | "repasse" | "reembolso" | "ajuste"
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
      app_role: ["paciente", "profissional", "admin"],
      appointment_modality: ["presencial", "telemedicina"],
      appointment_status: [
        "agendada",
        "confirmada",
        "em_andamento",
        "realizada",
        "cancelada",
        "nao_compareceu",
      ],
      company_role: ["owner", "admin", "profissional"],
      company_type: [
        "clinica",
        "laboratorio",
        "diagnostico",
        "estetica",
        "outros",
      ],
      gender_type: ["feminino", "masculino", "outro", "prefiro_nao_dizer"],
      payment_status: ["pendente", "pago", "reembolsado", "falhou"],
      professional_status: ["pendente", "aprovado", "rejeitado", "suspenso"],
      review_status: ["publicada", "oculta", "denunciada"],
      ticket_status: ["aberto", "em_andamento", "resolvido", "fechado"],
      tx_kind: ["credito", "comissao", "repasse", "reembolso", "ajuste"],
    },
  },
} as const
