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
      ad_impressions: {
        Row: {
          company_id: string | null
          context: Json | null
          id: number
          kind: Database["public"]["Enums"]["ad_event_kind"]
          occurred_at: string
          professional_id: string | null
          subscription_id: string | null
          target_type: Database["public"]["Enums"]["ad_target_type"]
          viewer_id: string | null
        }
        Insert: {
          company_id?: string | null
          context?: Json | null
          id?: number
          kind: Database["public"]["Enums"]["ad_event_kind"]
          occurred_at?: string
          professional_id?: string | null
          subscription_id?: string | null
          target_type: Database["public"]["Enums"]["ad_target_type"]
          viewer_id?: string | null
        }
        Update: {
          company_id?: string | null
          context?: Json | null
          id?: number
          kind?: Database["public"]["Enums"]["ad_event_kind"]
          occurred_at?: string
          professional_id?: string | null
          subscription_id?: string | null
          target_type?: Database["public"]["Enums"]["ad_target_type"]
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_impressions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "featured_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          cancelled_at: string | null
          cancelled_by: string | null
          commission_amount: number
          completed_at: string | null
          coupon_code: string | null
          created_at: string
          discount_amount: number
          duration_minutes: number
          financial_status: Database["public"]["Enums"]["financial_status"]
          gross_amount: number
          id: string
          modality: Database["public"]["Enums"]["appointment_modality"]
          net_amount: number
          notes: string | null
          package_purchase_id: string | null
          patient_id: string
          patient_notes: string | null
          payment_method: string | null
          payment_status: string
          payout_item_id: string | null
          price: number
          professional_id: string
          professional_notes: string | null
          released_at: string | null
          resource_id: string | null
          scheduled_at: string
          service_id: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          commission_amount?: number
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number
          duration_minutes?: number
          financial_status?: Database["public"]["Enums"]["financial_status"]
          gross_amount?: number
          id?: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          net_amount?: number
          notes?: string | null
          package_purchase_id?: string | null
          patient_id: string
          patient_notes?: string | null
          payment_method?: string | null
          payment_status?: string
          payout_item_id?: string | null
          price?: number
          professional_id: string
          professional_notes?: string | null
          released_at?: string | null
          resource_id?: string | null
          scheduled_at: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          cancelled_by?: string | null
          commission_amount?: number
          completed_at?: string | null
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number
          duration_minutes?: number
          financial_status?: Database["public"]["Enums"]["financial_status"]
          gross_amount?: number
          id?: string
          modality?: Database["public"]["Enums"]["appointment_modality"]
          net_amount?: number
          notes?: string | null
          package_purchase_id?: string | null
          patient_id?: string
          patient_notes?: string | null
          payment_method?: string | null
          payment_status?: string
          payout_item_id?: string | null
          price?: number
          professional_id?: string
          professional_notes?: string | null
          released_at?: string | null
          resource_id?: string | null
          scheduled_at?: string
          service_id?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          unit_id?: string | null
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
          {
            foreignKeyName: "fk_appt_package"
            columns: ["package_purchase_id"]
            isOneToOne: false
            referencedRelation: "package_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appt_payout_item"
            columns: ["payout_item_id"]
            isOneToOne: false
            referencedRelation: "payout_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appt_resource"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_appt_unit"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          name: string
          rules: Json
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          name: string
          rules?: Json
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          name?: string
          rules?: Json
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cancellation_policies: {
        Row: {
          created_at: string
          hours_before_full_refund: number
          hours_before_partial_refund: number
          id: string
          is_default: boolean
          name: string
          non_refundable_after_confirmation: boolean
          partial_refund_percent: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          hours_before_full_refund?: number
          hours_before_partial_refund?: number
          id?: string
          is_default?: boolean
          name: string
          non_refundable_after_confirmation?: boolean
          partial_refund_percent?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          hours_before_full_refund?: number
          hours_before_partial_refund?: number
          id?: string
          is_default?: boolean
          name?: string
          non_refundable_after_confirmation?: boolean
          partial_refund_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      cashback_balances: {
        Row: {
          balance: number
          patient_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          patient_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          patient_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      cashback_rules: {
        Row: {
          active: boolean
          company_id: string | null
          created_at: string
          id: string
          min_amount: number | null
          name: string
          percent: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          min_amount?: number | null
          name: string
          percent: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          company_id?: string | null
          created_at?: string
          id?: string
          min_amount?: number | null
          name?: string
          percent?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashback_rules_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      cashback_transactions: {
        Row: {
          amount: number
          appointment_id: string | null
          created_at: string
          description: string | null
          id: string
          kind: string
          patient_id: string
        }
        Insert: {
          amount: number
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind: string
          patient_id: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          kind?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cashback_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
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
          cancellation_policy_id: string | null
          cnpj: string | null
          commission_percent_override: number | null
          created_at: string
          default_country: string
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
          cancellation_policy_id?: string | null
          cnpj?: string | null
          commission_percent_override?: number | null
          created_at?: string
          default_country?: string
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
          cancellation_policy_id?: string | null
          cnpj?: string | null
          commission_percent_override?: number | null
          created_at?: string
          default_country?: string
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
        Relationships: [
          {
            foreignKeyName: "companies_cancellation_policy_id_fkey"
            columns: ["cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policies"
            referencedColumns: ["id"]
          },
        ]
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
      company_units: {
        Row: {
          active: boolean
          address_city: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          business_hours: Json
          company_id: string
          country: string
          created_at: string
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          address_city?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          business_hours?: Json
          company_id: string
          country?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          address_city?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          business_hours?: Json
          company_id?: string
          country?: string
          created_at?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_units_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          amount_discounted: number
          appointment_id: string | null
          coupon_id: string
          created_at: string
          id: string
          patient_id: string
        }
        Insert: {
          amount_discounted: number
          appointment_id?: string | null
          coupon_id: string
          created_at?: string
          id?: string
          patient_id: string
        }
        Update: {
          amount_discounted?: number
          appointment_id?: string | null
          coupon_id?: string
          created_at?: string
          id?: string
          patient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          active: boolean
          campaign_id: string | null
          code: string
          company_id: string | null
          created_at: string
          description: string | null
          id: string
          max_uses: number | null
          min_amount: number | null
          service_id: string | null
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          uses_count: number
          valid_from: string | null
          valid_until: string | null
          value: number
        }
        Insert: {
          active?: boolean
          campaign_id?: string | null
          code: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_uses?: number | null
          min_amount?: number | null
          service_id?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          uses_count?: number
          valid_from?: string | null
          valid_until?: string | null
          value: number
        }
        Update: {
          active?: boolean
          campaign_id?: string | null
          code?: string
          company_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          max_uses?: number | null
          min_amount?: number | null
          service_id?: string | null
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          uses_count?: number
          valid_from?: string | null
          valid_until?: string | null
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_coupon_campaign"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
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
      featured_categories: {
        Row: {
          company_type: Database["public"]["Enums"]["company_type"] | null
          created_at: string
          id: string
          specialty_id: string | null
          subscription_id: string
        }
        Insert: {
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          id?: string
          specialty_id?: string | null
          subscription_id: string
        }
        Update: {
          company_type?: Database["public"]["Enums"]["company_type"] | null
          created_at?: string
          id?: string
          specialty_id?: string | null
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_categories_specialty_id_fkey"
            columns: ["specialty_id"]
            isOneToOne: false
            referencedRelation: "specialties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_categories_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "featured_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_plans: {
        Row: {
          active: boolean
          code: string
          created_at: string
          description: string | null
          duration_days: number
          id: string
          kind: Database["public"]["Enums"]["featured_kind"]
          name: string
          perks: Json
          price_cents: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          description?: string | null
          duration_days: number
          id?: string
          kind: Database["public"]["Enums"]["featured_kind"]
          name: string
          perks?: Json
          price_cents: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          description?: string | null
          duration_days?: number
          id?: string
          kind?: Database["public"]["Enums"]["featured_kind"]
          name?: string
          perks?: Json
          price_cents?: number
          updated_at?: string
        }
        Relationships: []
      }
      featured_regions: {
        Row: {
          city: string | null
          created_at: string
          district: string | null
          id: string
          state: string
          subscription_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          state: string
          subscription_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          district?: string | null
          id?: string
          state?: string
          subscription_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_regions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "featured_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      featured_subscriptions: {
        Row: {
          amount_paid_cents: number
          auto_renew: boolean
          company_id: string | null
          created_at: string
          created_by: string
          ends_at: string
          id: string
          payment_ref: string | null
          plan_id: string
          professional_id: string | null
          starts_at: string
          status: Database["public"]["Enums"]["featured_status"]
          target_type: Database["public"]["Enums"]["ad_target_type"]
          updated_at: string
        }
        Insert: {
          amount_paid_cents?: number
          auto_renew?: boolean
          company_id?: string | null
          created_at?: string
          created_by: string
          ends_at: string
          id?: string
          payment_ref?: string | null
          plan_id: string
          professional_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["featured_status"]
          target_type: Database["public"]["Enums"]["ad_target_type"]
          updated_at?: string
        }
        Update: {
          amount_paid_cents?: number
          auto_renew?: boolean
          company_id?: string | null
          created_at?: string
          created_by?: string
          ends_at?: string
          id?: string
          payment_ref?: string | null
          plan_id?: string
          professional_id?: string | null
          starts_at?: string
          status?: Database["public"]["Enums"]["featured_status"]
          target_type?: Database["public"]["Enums"]["ad_target_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "featured_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "featured_subscriptions_professional_id_fkey"
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
      package_purchases: {
        Row: {
          amount_paid: number
          company_id: string | null
          created_at: string
          expires_at: string
          id: string
          patient_id: string
          professional_id: string | null
          service_id: string
          sessions_total: number
          sessions_used: number
        }
        Insert: {
          amount_paid: number
          company_id?: string | null
          created_at?: string
          expires_at: string
          id?: string
          patient_id: string
          professional_id?: string | null
          service_id: string
          sessions_total: number
          sessions_used?: number
        }
        Update: {
          amount_paid?: number
          company_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          patient_id?: string
          professional_id?: string | null
          service_id?: string
          sessions_total?: number
          sessions_used?: number
        }
        Relationships: [
          {
            foreignKeyName: "package_purchases_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_purchases_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
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
      payout_batches: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          paid_at: string | null
          provider_id: string
          reference: string | null
          status: Database["public"]["Enums"]["payout_batch_status"]
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          paid_at?: string | null
          provider_id: string
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_batch_status"]
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          paid_at?: string | null
          provider_id?: string
          reference?: string | null
          status?: Database["public"]["Enums"]["payout_batch_status"]
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      payout_items: {
        Row: {
          amount: number
          appointment_id: string
          batch_id: string
          created_at: string
          id: string
        }
        Insert: {
          amount: number
          appointment_id: string
          batch_id: string
          created_at?: string
          id?: string
        }
        Update: {
          amount?: number
          appointment_id?: string
          batch_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payout_items_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payout_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "payout_batches"
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
          default_cancellation_policy_id: string | null
          id: number
          refund_policy: string
          release_after_days: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cancellation_window_hours?: number
          commission_percent?: number
          default_cancellation_policy_id?: string | null
          id?: number
          refund_policy?: string
          release_after_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cancellation_window_hours?: number
          commission_percent?: number
          default_cancellation_policy_id?: string | null
          id?: number
          refund_policy?: string
          release_after_days?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_settings_default_cancellation_policy_id_fkey"
            columns: ["default_cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policies"
            referencedColumns: ["id"]
          },
        ]
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
      professional_business_hours: {
        Row: {
          closed: boolean
          closes_at: string | null
          created_at: string
          id: string
          lunch_end: string | null
          lunch_start: string | null
          opens_at: string | null
          professional_id: string
          updated_at: string
          weekday: number
        }
        Insert: {
          closed?: boolean
          closes_at?: string | null
          created_at?: string
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          opens_at?: string | null
          professional_id: string
          updated_at?: string
          weekday: number
        }
        Update: {
          closed?: boolean
          closes_at?: string | null
          created_at?: string
          id?: string
          lunch_end?: string | null
          lunch_start?: string | null
          opens_at?: string | null
          professional_id?: string
          updated_at?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "professional_business_hours_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_documents: {
        Row: {
          created_at: string
          file_url: string
          id: string
          kind: Database["public"]["Enums"]["provider_document_kind"]
          professional_id: string
          reviewer_notes: string | null
          status: Database["public"]["Enums"]["provider_document_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          file_url: string
          id?: string
          kind: Database["public"]["Enums"]["provider_document_kind"]
          professional_id: string
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["provider_document_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          file_url?: string
          id?: string
          kind?: Database["public"]["Enums"]["provider_document_kind"]
          professional_id?: string
          reviewer_notes?: string | null
          status?: Database["public"]["Enums"]["provider_document_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_documents_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          academic_formation: string | null
          address_city: string | null
          address_complement: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          cancellation_policy_id: string | null
          certifications: string[]
          commission_percent_override: number | null
          company_id: string | null
          consultation_price: number
          cover_url: string | null
          cpf_cnpj: string | null
          created_at: string
          default_unit_id: string | null
          display_name: string | null
          id: string
          instagram: string | null
          languages: string[]
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          modality: Database["public"]["Enums"]["appointment_modality"]
          onboarding_completed_at: string | null
          onboarding_step: number
          phone: string | null
          postgrad: string | null
          professional_email: string | null
          professional_registry: string
          rating_average: number
          rating_count: number
          secondary_specialties: string[]
          specialty_id: string | null
          status: Database["public"]["Enums"]["professional_status"]
          total_appointments: number
          updated_at: string
          website: string | null
          whatsapp: string | null
          years_experience: number | null
          zero_commission_end: string | null
          zero_commission_start: string | null
        }
        Insert: {
          academic_formation?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          cancellation_policy_id?: string | null
          certifications?: string[]
          commission_percent_override?: number | null
          company_id?: string | null
          consultation_price?: number
          cover_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          default_unit_id?: string | null
          display_name?: string | null
          id: string
          instagram?: string | null
          languages?: string[]
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          modality?: Database["public"]["Enums"]["appointment_modality"]
          onboarding_completed_at?: string | null
          onboarding_step?: number
          phone?: string | null
          postgrad?: string | null
          professional_email?: string | null
          professional_registry: string
          rating_average?: number
          rating_count?: number
          secondary_specialties?: string[]
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["professional_status"]
          total_appointments?: number
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          years_experience?: number | null
          zero_commission_end?: string | null
          zero_commission_start?: string | null
        }
        Update: {
          academic_formation?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_district?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          approved_at?: string | null
          approved_by?: string | null
          avatar_url?: string | null
          bio?: string | null
          cancellation_policy_id?: string | null
          certifications?: string[]
          commission_percent_override?: number | null
          company_id?: string | null
          consultation_price?: number
          cover_url?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          default_unit_id?: string | null
          display_name?: string | null
          id?: string
          instagram?: string | null
          languages?: string[]
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          modality?: Database["public"]["Enums"]["appointment_modality"]
          onboarding_completed_at?: string | null
          onboarding_step?: number
          phone?: string | null
          postgrad?: string | null
          professional_email?: string | null
          professional_registry?: string
          rating_average?: number
          rating_count?: number
          secondary_specialties?: string[]
          specialty_id?: string | null
          status?: Database["public"]["Enums"]["professional_status"]
          total_appointments?: number
          updated_at?: string
          website?: string | null
          whatsapp?: string | null
          years_experience?: number | null
          zero_commission_end?: string | null
          zero_commission_start?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_cancellation_policy_id_fkey"
            columns: ["cancellation_policy_id"]
            isOneToOne: false
            referencedRelation: "cancellation_policies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_default_unit_id_fkey"
            columns: ["default_unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
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
      profiles_premium_assets: {
        Row: {
          company_id: string | null
          created_at: string
          extra_photos: string[]
          highlight_cta_text: string | null
          id: string
          professional_id: string | null
          target_type: Database["public"]["Enums"]["ad_target_type"]
          updated_at: string
          video_url: string | null
        }
        Insert: {
          company_id?: string | null
          created_at?: string
          extra_photos?: string[]
          highlight_cta_text?: string | null
          id?: string
          professional_id?: string | null
          target_type: Database["public"]["Enums"]["ad_target_type"]
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          company_id?: string | null
          created_at?: string
          extra_photos?: string[]
          highlight_cta_text?: string | null
          id?: string
          professional_id?: string | null
          target_type?: Database["public"]["Enums"]["ad_target_type"]
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_premium_assets_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_premium_assets_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: true
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_payout_accounts: {
        Row: {
          bank_account: string | null
          bank_account_type: string | null
          bank_agency: string | null
          bank_name: string | null
          created_at: string
          holder_document: string | null
          holder_name: string | null
          method: string
          pix_key: string | null
          provider_id: string
          updated_at: string
        }
        Insert: {
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          holder_document?: string | null
          holder_name?: string | null
          method?: string
          pix_key?: string | null
          provider_id: string
          updated_at?: string
        }
        Update: {
          bank_account?: string | null
          bank_account_type?: string | null
          bank_agency?: string | null
          bank_name?: string | null
          created_at?: string
          holder_document?: string | null
          holder_name?: string | null
          method?: string
          pix_key?: string | null
          provider_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      resource_blocked_slots: {
        Row: {
          created_at: string
          end_at: string
          id: string
          reason: string | null
          resource_id: string
          start_at: string
        }
        Insert: {
          created_at?: string
          end_at: string
          id?: string
          reason?: string | null
          resource_id: string
          start_at: string
        }
        Update: {
          created_at?: string
          end_at?: string
          id?: string
          reason?: string | null
          resource_id?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_blocked_slots_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          kind: Database["public"]["Enums"]["resource_kind"]
          name: string
          unit_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["resource_kind"]
          name: string
          unit_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          kind?: Database["public"]["Enums"]["resource_kind"]
          name?: string
          unit_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resources_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
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
      service_packages: {
        Row: {
          created_at: string
          service_id: string
          sessions_total: number
          updated_at: string
          validity_days: number
        }
        Insert: {
          created_at?: string
          service_id: string
          sessions_total: number
          updated_at?: string
          validity_days?: number
        }
        Update: {
          created_at?: string
          service_id?: string
          sessions_total?: number
          updated_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_packages_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: true
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_resources: {
        Row: {
          created_at: string
          resource_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          resource_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          resource_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_resources_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_resources_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
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
          requires_resource_kind:
            | Database["public"]["Enums"]["resource_kind"]
            | null
          type: Database["public"]["Enums"]["service_type"]
          unit_scope: string
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
          requires_resource_kind?:
            | Database["public"]["Enums"]["resource_kind"]
            | null
          type?: Database["public"]["Enums"]["service_type"]
          unit_scope?: string
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
          requires_resource_kind?:
            | Database["public"]["Enums"]["resource_kind"]
            | null
          type?: Database["public"]["Enums"]["service_type"]
          unit_scope?: string
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
      unit_professionals: {
        Row: {
          created_at: string
          is_default: boolean
          professional_id: string
          unit_id: string
        }
        Insert: {
          created_at?: string
          is_default?: boolean
          professional_id: string
          unit_id: string
        }
        Update: {
          created_at?: string
          is_default?: boolean
          professional_id?: string
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "unit_professionals_professional_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "unit_professionals_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "company_units"
            referencedColumns: ["id"]
          },
        ]
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
      ads_revenue_summary: {
        Args: { _from: string; _to: string }
        Returns: {
          subscriptions_count: number
          total_cents: number
        }[]
      }
      approve_professional: {
        Args: { _id: string }
        Returns: {
          academic_formation: string | null
          address_city: string | null
          address_complement: string | null
          address_district: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          approved_at: string | null
          approved_by: string | null
          avatar_url: string | null
          bio: string | null
          cancellation_policy_id: string | null
          certifications: string[]
          commission_percent_override: number | null
          company_id: string | null
          consultation_price: number
          cover_url: string | null
          cpf_cnpj: string | null
          created_at: string
          default_unit_id: string | null
          display_name: string | null
          id: string
          instagram: string | null
          languages: string[]
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          modality: Database["public"]["Enums"]["appointment_modality"]
          onboarding_completed_at: string | null
          onboarding_step: number
          phone: string | null
          postgrad: string | null
          professional_email: string | null
          professional_registry: string
          rating_average: number
          rating_count: number
          secondary_specialties: string[]
          specialty_id: string | null
          status: Database["public"]["Enums"]["professional_status"]
          total_appointments: number
          updated_at: string
          website: string | null
          whatsapp: string | null
          years_experience: number | null
          zero_commission_end: string | null
          zero_commission_start: string | null
        }
        SetofOptions: {
          from: "*"
          to: "professionals"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      effective_cancellation_policy: {
        Args: { _company: string; _professional: string }
        Returns: {
          created_at: string
          hours_before_full_refund: number
          hours_before_partial_refund: number
          id: string
          is_default: boolean
          name: string
          non_refundable_after_confirmation: boolean
          partial_refund_percent: number
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "cancellation_policies"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      effective_commission_percent: {
        Args: { _company: string; _professional: string }
        Returns: number
      }
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
      is_provider_premium: {
        Args: {
          _target_id: string
          _target_type: Database["public"]["Enums"]["ad_target_type"]
        }
        Returns: boolean
      }
      nearby_units: {
        Args: { _lat: number; _lng: number; _radius_km?: number }
        Returns: {
          address_city: string
          address_state: string
          company_id: string
          distance_km: number
          id: string
          latitude: number
          longitude: number
          name: string
        }[]
      }
      search_providers_ranked: {
        Args: {
          _city?: string
          _limit?: number
          _q?: string
          _specialty_slug?: string
          _state?: string
        }
        Returns: {
          address_city: string
          address_state: string
          avatar_url: string
          consultation_price: number
          full_name: string
          is_premium: boolean
          professional_id: string
          rank_group: number
          rating_average: number
          rating_count: number
          specialty_name: string
          specialty_slug: string
          subscription_id: string
        }[]
      }
      wallet_balance: { Args: { _provider: string }; Returns: number }
      wallet_releasable: { Args: { _provider: string }; Returns: number }
    }
    Enums: {
      ad_event_kind: "impression" | "click" | "booking"
      ad_target_type: "professional" | "company"
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
      coupon_type: "percent" | "fixed"
      featured_kind: "premium" | "regional" | "category" | "perfil_premium"
      featured_status: "ativo" | "pausado" | "expirado" | "cancelado"
      financial_status:
        | "agendado"
        | "pago"
        | "realizado"
        | "liberado_repasse"
        | "repassado"
        | "reembolsado"
      gender_type: "feminino" | "masculino" | "outro" | "prefiro_nao_dizer"
      payment_status: "pendente" | "pago" | "reembolsado" | "falhou"
      payout_batch_status: "pendente" | "pago" | "cancelado"
      professional_status: "pendente" | "aprovado" | "rejeitado" | "suspenso"
      provider_document_kind:
        | "documento_pessoal"
        | "registro"
        | "comprovante_endereco"
        | "documento_empresa"
      provider_document_status:
        | "pendente"
        | "em_analise"
        | "aprovado"
        | "rejeitado"
      resource_kind:
        | "sala"
        | "equipamento_ultrassom"
        | "equipamento_tomografia"
        | "equipamento_laser"
        | "sala_coleta"
        | "outro"
      review_status: "publicada" | "oculta" | "denunciada"
      service_type: "consulta" | "exame" | "procedimento" | "pacote"
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
      ad_event_kind: ["impression", "click", "booking"],
      ad_target_type: ["professional", "company"],
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
      coupon_type: ["percent", "fixed"],
      featured_kind: ["premium", "regional", "category", "perfil_premium"],
      featured_status: ["ativo", "pausado", "expirado", "cancelado"],
      financial_status: [
        "agendado",
        "pago",
        "realizado",
        "liberado_repasse",
        "repassado",
        "reembolsado",
      ],
      gender_type: ["feminino", "masculino", "outro", "prefiro_nao_dizer"],
      payment_status: ["pendente", "pago", "reembolsado", "falhou"],
      payout_batch_status: ["pendente", "pago", "cancelado"],
      professional_status: ["pendente", "aprovado", "rejeitado", "suspenso"],
      provider_document_kind: [
        "documento_pessoal",
        "registro",
        "comprovante_endereco",
        "documento_empresa",
      ],
      provider_document_status: [
        "pendente",
        "em_analise",
        "aprovado",
        "rejeitado",
      ],
      resource_kind: [
        "sala",
        "equipamento_ultrassom",
        "equipamento_tomografia",
        "equipamento_laser",
        "sala_coleta",
        "outro",
      ],
      review_status: ["publicada", "oculta", "denunciada"],
      service_type: ["consulta", "exame", "procedimento", "pacote"],
      ticket_status: ["aberto", "em_andamento", "resolvido", "fechado"],
      tx_kind: ["credito", "comissao", "repasse", "reembolso", "ajuste"],
    },
  },
} as const
