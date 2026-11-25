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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      quotations: {
        Row: {
          client_name: string
          created_at: string
          grand_total: number
          id: string
          project_title: string
          quotation_data: Json
          quotation_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          client_name: string
          created_at?: string
          grand_total?: number
          id?: string
          project_title: string
          quotation_data: Json
          quotation_date?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          client_name?: string
          created_at?: string
          grand_total?: number
          id?: string
          project_title?: string
          quotation_data?: Json
          quotation_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clients: {
        Row: {
          aadhar_image_url: string | null
          billing_address: string | null
          client_name: string
          contact_person: string | null
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          pan_image_url: string | null
          phone: string | null
          production_house_name: string | null
          state: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aadhar_image_url?: string | null
          billing_address?: string | null
          client_name: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          pan_image_url?: string | null
          phone?: string | null
          production_house_name?: string | null
          state: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aadhar_image_url?: string | null
          billing_address?: string | null
          client_name?: string
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          pan_image_url?: string | null
          phone?: string | null
          production_house_name?: string | null
          state?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      company_profile: {
        Row: {
          bank_account_name: string | null
          bank_account_number: string | null
          bank_ifsc: string | null
          bank_name: string | null
          company_name: string
          created_at: string | null
          email: string | null
          gstin: string | null
          id: string
          legal_disclaimer: string | null
          logo_url: string | null
          office_address: string | null
          pan_number: string | null
          phone: string | null
          terms_and_conditions: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          company_name?: string
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          legal_disclaimer?: string | null
          logo_url?: string | null
          office_address?: string | null
          pan_number?: string | null
          phone?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_ifsc?: string | null
          bank_name?: string | null
          company_name?: string
          created_at?: string | null
          email?: string | null
          gstin?: string | null
          id?: string
          legal_disclaimer?: string | null
          logo_url?: string | null
          office_address?: string | null
          pan_number?: string | null
          phone?: string | null
          terms_and_conditions?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          description: string | null
          finish: string | null
          glass_specification: string | null
          hardware_specification: string | null
          height_mm: number | null
          id: string
          invoice_id: string
          installation_included: boolean
          profile_series: string | null
          quantity: number | null
          rate: number | null
          service_category: string
          total: number | null
          unit: string | null
          width_mm: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          finish?: string | null
          glass_specification?: string | null
          hardware_specification?: string | null
          height_mm?: number | null
          id?: string
          invoice_id: string
          installation_included?: boolean
          profile_series?: string | null
          quantity?: number | null
          rate?: number | null
          service_category: string
          total?: number | null
          unit?: string | null
          width_mm?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          finish?: string | null
          glass_specification?: string | null
          hardware_specification?: string | null
          height_mm?: number | null
          id?: string
          invoice_id?: string
          installation_included?: boolean
          profile_series?: string | null
          quantity?: number | null
          rate?: number | null
          service_category?: string
          total?: number | null
          unit?: string | null
          width_mm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_due: number | null
          cameraman_amount: number
          sound_amount: number
          cgst_amount: number | null
          client_id: string | null
          created_at: string | null
          custom_disclaimer: string | null
          discount_amount: number | null
          discount_type: string | null
          discount_value: number | null
          due_date: string
          grand_total: number | null
          gst_type: Database["public"]["Enums"]["gst_type"] | null
          id: string
          igst_amount: number | null
          invoice_date: string
          invoice_number: string
          notes: string | null
          project_title: string
          project_type: string | null
          project_stage: string
          site_address: string | null
          site_contact_name: string | null
          site_contact_phone: string | null
          measurement_date: string | null
          installation_date: string | null
          round_off: number | null
          sgst_amount: number | null
          status: Database["public"]["Enums"]["invoice_status"] | null
          subtotal: number | null
          total_paid: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance_due?: number | null
          cameraman_amount?: number
          sound_amount?: number
          cgst_amount?: number | null
          client_id?: string | null
          created_at?: string | null
          custom_disclaimer?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          due_date: string
          grand_total?: number | null
          gst_type?: Database["public"]["Enums"]["gst_type"] | null
          id?: string
          igst_amount?: number | null
          invoice_date?: string
          invoice_number: string
          notes?: string | null
          project_title: string
          project_type?: string | null
          project_stage?: string
          site_address?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          measurement_date?: string | null
          installation_date?: string | null
          round_off?: number | null
          sgst_amount?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          total_paid?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance_due?: number | null
          cameraman_amount?: number
          sound_amount?: number
          cgst_amount?: number | null
          client_id?: string | null
          created_at?: string | null
          custom_disclaimer?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          discount_value?: number | null
          due_date?: string
          grand_total?: number | null
          gst_type?: Database["public"]["Enums"]["gst_type"] | null
          id?: string
          igst_amount?: number | null
          invoice_date?: string
          invoice_number?: string
          notes?: string | null
          project_title?: string
          project_type?: string | null
          project_stage?: string
          site_address?: string | null
          site_contact_name?: string | null
          site_contact_phone?: string | null
          measurement_date?: string | null
          installation_date?: string | null
          round_off?: number | null
          sgst_amount?: number | null
          status?: Database["public"]["Enums"]["invoice_status"] | null
          subtotal?: number | null
          total_paid?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          transaction_reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          transaction_reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          transaction_reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          amount: number
          balance_after_payment: number | null
          created_at: string | null
          id: string
          payment_id: string
          receipt_date: string
          receipt_number: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after_payment?: number | null
          created_at?: string | null
          id?: string
          payment_id: string
          receipt_date?: string
          receipt_number: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after_payment?: number | null
          created_at?: string | null
          id?: string
          payment_id?: string
          receipt_date?: string
          receipt_number?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      gst_type: "cgst_sgst" | "igst" | "no_gst"
      invoice_status:
        | "draft"
        | "sent"
        | "partially_paid"
        | "completed"
        | "overdue"
      payment_method: "bank_transfer" | "upi" | "cash" | "cheque" | "card"
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
      gst_type: ["cgst_sgst", "igst", "no_gst"],
      invoice_status: [
        "draft",
        "sent",
        "partially_paid",
        "completed",
        "overdue",
      ],
      payment_method: ["bank_transfer", "upi", "cash", "cheque", "card"],
    },
  },
} as const
