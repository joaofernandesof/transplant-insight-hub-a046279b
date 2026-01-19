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
      achievements: {
        Row: {
          category: string
          code: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          order_index: number | null
          points: number
          requirement_type: string
          requirement_value: number | null
        }
        Insert: {
          category?: string
          code: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          order_index?: number | null
          points?: number
          requirement_type?: string
          requirement_value?: number | null
        }
        Update: {
          category?: string
          code?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          order_index?: number | null
          points?: number
          requirement_type?: string
          requirement_value?: number | null
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      clinics: {
        Row: {
          city: string | null
          created_at: string
          id: string
          name: string
          state: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          id?: string
          name: string
          state?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          id?: string
          name?: string
          state?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      course_modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          difficulty: string | null
          duration_hours: number | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          order_index: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          duration_hours?: number | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          order_index?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          available_at: string | null
          city: string | null
          claimed_at: string | null
          claimed_by: string | null
          clinic_id: string | null
          converted_at: string | null
          converted_value: number | null
          created_at: string
          email: string | null
          id: string
          interest_level: string | null
          name: string
          notes: string | null
          phone: string
          procedures_sold: string[] | null
          source: string | null
          state: string | null
          status: string | null
          updated_at: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          available_at?: string | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          clinic_id?: string | null
          converted_at?: string | null
          converted_value?: number | null
          created_at?: string
          email?: string | null
          id?: string
          interest_level?: string | null
          name: string
          notes?: string | null
          phone: string
          procedures_sold?: string[] | null
          source?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          available_at?: string | null
          city?: string | null
          claimed_at?: string | null
          claimed_by?: string | null
          clinic_id?: string | null
          converted_at?: string | null
          converted_value?: number | null
          created_at?: string
          email?: string | null
          id?: string
          interest_level?: string | null
          name?: string
          notes?: string | null
          phone?: string
          procedures_sold?: string[] | null
          source?: string | null
          state?: string | null
          status?: string | null
          updated_at?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_quizzes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          lesson_id: string
          max_attempts: number | null
          passing_score: number | null
          time_limit_minutes: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id: string
          max_attempts?: number | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          lesson_id?: string
          max_attempts?: number | null
          passing_score?: number | null
          time_limit_minutes?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_quizzes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "module_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      materials: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          is_active: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          is_active?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      module_lessons: {
        Row: {
          content_html: string | null
          content_type: string | null
          content_url: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_preview: boolean | null
          module_id: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_html?: string | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          module_id: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_html?: string | null
          content_type?: string | null
          content_url?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_preview?: boolean | null
          module_id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "module_lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "course_modules"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_recipients: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          notification_id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          notification_id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_recipients_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          content: string
          content_html: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content: string
          content_html?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string
          content_html?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      portal_appointments: {
        Row: {
          appointment_type: string
          cancellation_reason: string | null
          check_in_at: string | null
          check_out_at: string | null
          created_at: string | null
          created_by: string | null
          doctor_id: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          procedure_type: string | null
          room_id: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_type: string
          cancellation_reason?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          procedure_type?: string | null
          room_id?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_type?: string
          cancellation_reason?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          procedure_type?: string | null
          room_id?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "portal_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "portal_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_appointments_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "portal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_attachments: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          medical_record_id: string | null
          patient_id: string | null
          uploaded_by: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          medical_record_id?: string | null
          patient_id?: string | null
          uploaded_by?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          medical_record_id?: string | null
          patient_id?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_attachments_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "portal_medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_attachments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "portal_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      portal_automations: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          template_id: string | null
          trigger_timing: string | null
          trigger_type: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_id?: string | null
          trigger_timing?: string | null
          trigger_type: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_id?: string | null
          trigger_timing?: string | null
          trigger_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_automations_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "portal_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_campaigns: {
        Row: {
          created_at: string | null
          created_by: string | null
          delivered_count: number | null
          description: string | null
          id: string
          name: string
          scheduled_at: string | null
          sent_at: string | null
          sent_count: number | null
          status: string | null
          target_criteria: Json | null
          template_id: string | null
          total_recipients: number | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          id?: string
          name: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_criteria?: Json | null
          template_id?: string | null
          total_recipients?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          delivered_count?: number | null
          description?: string | null
          id?: string
          name?: string
          scheduled_at?: string | null
          sent_at?: string | null
          sent_count?: number | null
          status?: string | null
          target_criteria?: Json | null
          template_id?: string | null
          total_recipients?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "portal_message_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_cash_flow: {
        Row: {
          amount: number
          category: string | null
          created_at: string | null
          created_by: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          payment_id: string | null
          type: string
        }
        Insert: {
          amount: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_id?: string | null
          type: string
        }
        Update: {
          amount?: number
          category?: string | null
          created_at?: string | null
          created_by?: string | null
          date?: string
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          payment_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_cash_flow_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "portal_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_consents: {
        Row: {
          accepted: boolean | null
          accepted_at: string | null
          consent_type: string
          created_at: string | null
          id: string
          ip_address: string | null
          patient_id: string
          version: string | null
        }
        Insert: {
          accepted?: boolean | null
          accepted_at?: string | null
          consent_type: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          patient_id: string
          version?: string | null
        }
        Update: {
          accepted?: boolean | null
          accepted_at?: string | null
          consent_type?: string
          created_at?: string | null
          id?: string
          ip_address?: string | null
          patient_id?: string
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_consents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "portal_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_doctors: {
        Row: {
          bio: string | null
          consultation_duration_minutes: number | null
          created_at: string | null
          crm: string
          crm_state: string | null
          id: string
          is_available: boolean | null
          portal_user_id: string
          rqe: string | null
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          bio?: string | null
          consultation_duration_minutes?: number | null
          created_at?: string | null
          crm: string
          crm_state?: string | null
          id?: string
          is_available?: boolean | null
          portal_user_id: string
          rqe?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          bio?: string | null
          consultation_duration_minutes?: number | null
          created_at?: string | null
          crm?: string
          crm_state?: string | null
          id?: string
          is_available?: boolean | null
          portal_user_id?: string
          rqe?: string | null
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_doctors_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: true
            referencedRelation: "portal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_equipment: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_available: boolean | null
          name: string
          room_id: string | null
          serial_number: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name: string
          room_id?: string | null
          serial_number?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_available?: boolean | null
          name?: string
          room_id?: string | null
          serial_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_equipment_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "portal_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_inventory_items: {
        Row: {
          average_cost: number | null
          barcode: string | null
          category: string | null
          created_at: string | null
          current_stock: number | null
          expiry_alert_days: number | null
          id: string
          is_active: boolean | null
          location: string | null
          min_stock: number | null
          name: string
          sale_price: number | null
          sku: string | null
          supplier_id: string | null
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          average_cost?: number | null
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiry_alert_days?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          min_stock?: number | null
          name: string
          sale_price?: number | null
          sku?: string | null
          supplier_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          average_cost?: number | null
          barcode?: string | null
          category?: string | null
          created_at?: string | null
          current_stock?: number | null
          expiry_alert_days?: number | null
          id?: string
          is_active?: boolean | null
          location?: string | null
          min_stock?: number | null
          name?: string
          sale_price?: number | null
          sku?: string | null
          supplier_id?: string | null
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "portal_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_invoices: {
        Row: {
          amount: number | null
          appointment_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          discount: number | null
          due_date: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          paid_at: string | null
          patient_id: string | null
          payment_method: string | null
          status: string | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          appointment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          appointment_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount?: number | null
          due_date?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          paid_at?: string | null
          patient_id?: string | null
          payment_method?: string | null
          status?: string | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_invoices_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "portal_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_invoices_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "portal_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_medical_records: {
        Row: {
          appointment_id: string | null
          content: Json | null
          content_html: string | null
          created_at: string | null
          doctor_id: string | null
          id: string
          is_signed: boolean | null
          patient_id: string
          record_type: string
          signed_at: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          content?: Json | null
          content_html?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          is_signed?: boolean | null
          patient_id: string
          record_type: string
          signed_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          content?: Json | null
          content_html?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          is_signed?: boolean | null
          patient_id?: string
          record_type?: string
          signed_at?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "portal_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_medical_records_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "portal_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_medical_records_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "portal_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_message_templates: {
        Row: {
          channel: string
          content: string
          created_at: string | null
          created_by: string | null
          id: string
          is_active: boolean | null
          name: string
          subject: string | null
          variables: string[] | null
        }
        Insert: {
          channel: string
          content: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          subject?: string | null
          variables?: string[] | null
        }
        Update: {
          channel?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          subject?: string | null
          variables?: string[] | null
        }
        Relationships: []
      }
      portal_messages: {
        Row: {
          chat_id: string | null
          content: string | null
          created_at: string | null
          direction: string
          id: string
          media_type: string | null
          media_url: string | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          direction: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          chat_id?: string | null
          content?: string | null
          created_at?: string | null
          direction?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "portal_whatsapp_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_patients: {
        Row: {
          allergies: string[] | null
          blood_type: string | null
          created_at: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          health_insurance: string | null
          health_insurance_number: string | null
          id: string
          medical_record_number: string | null
          portal_user_id: string
          updated_at: string | null
        }
        Insert: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          health_insurance?: string | null
          health_insurance_number?: string | null
          id?: string
          medical_record_number?: string | null
          portal_user_id: string
          updated_at?: string | null
        }
        Update: {
          allergies?: string[] | null
          blood_type?: string | null
          created_at?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          health_insurance?: string | null
          health_insurance_number?: string | null
          id?: string
          medical_record_number?: string | null
          portal_user_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_patients_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: true
            referencedRelation: "portal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string | null
          notes: string | null
          payment_date: string | null
          payment_method: string
          received_by: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method: string
          received_by?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string | null
          notes?: string | null
          payment_date?: string | null
          payment_method?: string
          received_by?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "portal_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_rooms: {
        Row: {
          capacity: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          room_type: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          room_type?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          room_type?: string | null
        }
        Relationships: []
      }
      portal_stock_movements: {
        Row: {
          appointment_id: string | null
          batch_number: string | null
          created_at: string | null
          created_by: string | null
          expiry_date: string | null
          id: string
          item_id: string
          movement_type: string
          quantity: number
          reason: string | null
          total_cost: number | null
          unit_cost: number | null
        }
        Insert: {
          appointment_id?: string | null
          batch_number?: string | null
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          item_id: string
          movement_type: string
          quantity: number
          reason?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Update: {
          appointment_id?: string | null
          batch_number?: string | null
          created_at?: string | null
          created_by?: string | null
          expiry_date?: string | null
          id?: string
          item_id?: string
          movement_type?: string
          quantity?: number
          reason?: string | null
          total_cost?: number | null
          unit_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_stock_movements_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "portal_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "portal_inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_suppliers: {
        Row: {
          address: string | null
          cnpj: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          notes: string | null
          phone: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      portal_survey_responses: {
        Row: {
          answers: Json | null
          appointment_id: string | null
          created_at: string | null
          doctor_id: string | null
          id: string
          nps_score: number | null
          patient_id: string | null
          survey_id: string
        }
        Insert: {
          answers?: Json | null
          appointment_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          nps_score?: number | null
          patient_id?: string | null
          survey_id: string
        }
        Update: {
          answers?: Json | null
          appointment_id?: string | null
          created_at?: string | null
          doctor_id?: string | null
          id?: string
          nps_score?: number | null
          patient_id?: string | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_survey_responses_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "portal_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_survey_responses_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "portal_doctors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_survey_responses_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "portal_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_survey_responses_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "portal_surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_surveys: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_nps: boolean | null
          name: string
          questions: Json | null
          trigger_type: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_nps?: boolean | null
          name: string
          questions?: Json | null
          trigger_type?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_nps?: boolean | null
          name?: string
          questions?: Json | null
          trigger_type?: string | null
        }
        Relationships: []
      }
      portal_teleconsultations: {
        Row: {
          appointment_id: string
          created_at: string | null
          doctor_joined_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          patient_joined_at: string | null
          recording_url: string | null
          room_url: string | null
          status: string | null
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          doctor_joined_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          patient_joined_at?: string | null
          recording_url?: string | null
          room_url?: string | null
          status?: string | null
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          doctor_joined_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          patient_joined_at?: string | null
          recording_url?: string | null
          room_url?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_teleconsultations_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "portal_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_user_roles: {
        Row: {
          created_at: string | null
          id: string
          portal_user_id: string
          role: Database["public"]["Enums"]["portal_role"]
        }
        Insert: {
          created_at?: string | null
          id?: string
          portal_user_id: string
          role: Database["public"]["Enums"]["portal_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          portal_user_id?: string
          role?: Database["public"]["Enums"]["portal_role"]
        }
        Relationships: [
          {
            foreignKeyName: "portal_user_roles_portal_user_id_fkey"
            columns: ["portal_user_id"]
            isOneToOne: false
            referencedRelation: "portal_users"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_users: {
        Row: {
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          address_zip: string | null
          avatar_url: string | null
          birth_date: string | null
          cpf: string | null
          created_at: string | null
          email: string
          full_name: string
          gender: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email: string
          full_name: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          address_zip?: string | null
          avatar_url?: string | null
          birth_date?: string | null
          cpf?: string | null
          created_at?: string | null
          email?: string
          full_name?: string
          gender?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      portal_whatsapp_chats: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          id: string
          last_message_at: string | null
          patient_id: string | null
          phone: string
          status: string | null
          unread_count: number | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          patient_id?: string | null
          phone: string
          status?: string | null
          unread_count?: number | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          id?: string
          last_message_at?: string | null
          patient_id?: string | null
          phone?: string
          status?: string | null
          unread_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_whatsapp_chats_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "portal_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          city: string | null
          clinic_logo_url: string | null
          clinic_name: string | null
          created_at: string
          crm: string | null
          email: string
          id: string
          instagram_clinic: string | null
          instagram_personal: string | null
          last_seen_at: string | null
          name: string
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          referral_code: string | null
          rqe: string | null
          services: string[] | null
          state: string | null
          status: string | null
          tier: string | null
          total_points: number | null
          updated_at: string
          user_id: string
          whatsapp_clinic: string | null
          whatsapp_personal: string | null
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          clinic_logo_url?: string | null
          clinic_name?: string | null
          created_at?: string
          crm?: string | null
          email: string
          id?: string
          instagram_clinic?: string | null
          instagram_personal?: string | null
          last_seen_at?: string | null
          name: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          referral_code?: string | null
          rqe?: string | null
          services?: string[] | null
          state?: string | null
          status?: string | null
          tier?: string | null
          total_points?: number | null
          updated_at?: string
          user_id: string
          whatsapp_clinic?: string | null
          whatsapp_personal?: string | null
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          clinic_logo_url?: string | null
          clinic_name?: string | null
          created_at?: string
          crm?: string | null
          email?: string
          id?: string
          instagram_clinic?: string | null
          instagram_personal?: string | null
          last_seen_at?: string | null
          name?: string
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          referral_code?: string | null
          rqe?: string | null
          services?: string[] | null
          state?: string | null
          status?: string | null
          tier?: string | null
          total_points?: number | null
          updated_at?: string
          user_id?: string
          whatsapp_clinic?: string | null
          whatsapp_personal?: string | null
        }
        Relationships: []
      }
      quiz_questions: {
        Row: {
          correct_answer: string
          created_at: string | null
          explanation: string | null
          id: string
          options: Json | null
          order_index: number | null
          points: number | null
          question_text: string
          question_type: string | null
          quiz_id: string
        }
        Insert: {
          correct_answer: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text: string
          question_type?: string | null
          quiz_id: string
        }
        Update: {
          correct_answer?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text?: string
          question_type?: string | null
          quiz_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_questions_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "lesson_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_leads: {
        Row: {
          city: string | null
          commission_paid: boolean | null
          commission_paid_at: string | null
          commission_value: number | null
          converted_at: string | null
          converted_value: number | null
          created_at: string | null
          email: string
          id: string
          interest: string | null
          name: string
          phone: string
          referrer_user_id: string
          state: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          city?: string | null
          commission_paid?: boolean | null
          commission_paid_at?: string | null
          commission_value?: number | null
          converted_at?: string | null
          converted_value?: number | null
          created_at?: string | null
          email: string
          id?: string
          interest?: string | null
          name: string
          phone: string
          referrer_user_id: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          city?: string | null
          commission_paid?: boolean | null
          commission_paid_at?: string | null
          commission_value?: number | null
          converted_at?: string | null
          converted_value?: number | null
          created_at?: string | null
          email?: string
          id?: string
          interest?: string | null
          name?: string
          phone?: string
          referrer_user_id?: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          baldness_grade: string | null
          branch: string | null
          category: string | null
          clinic_id: string | null
          consulted_by: string | null
          contract_status: string | null
          created_at: string
          deposit_paid: number | null
          distract_date: string | null
          exchange_value: number | null
          id: string
          in_clickup: boolean | null
          in_conta_azul: boolean | null
          in_feegow: boolean | null
          in_surgery_schedule: boolean | null
          medical_record: string | null
          month_year: string
          observations: string | null
          origin_observation: string | null
          patient_cpf: string | null
          patient_email: string | null
          patient_name: string
          patient_origin: string | null
          registered_by: string | null
          sale_date: string
          service_type: string
          sold_by: string | null
          updated_at: string
          user_id: string
          vgv_initial: number | null
        }
        Insert: {
          baldness_grade?: string | null
          branch?: string | null
          category?: string | null
          clinic_id?: string | null
          consulted_by?: string | null
          contract_status?: string | null
          created_at?: string
          deposit_paid?: number | null
          distract_date?: string | null
          exchange_value?: number | null
          id?: string
          in_clickup?: boolean | null
          in_conta_azul?: boolean | null
          in_feegow?: boolean | null
          in_surgery_schedule?: boolean | null
          medical_record?: string | null
          month_year: string
          observations?: string | null
          origin_observation?: string | null
          patient_cpf?: string | null
          patient_email?: string | null
          patient_name: string
          patient_origin?: string | null
          registered_by?: string | null
          sale_date: string
          service_type: string
          sold_by?: string | null
          updated_at?: string
          user_id: string
          vgv_initial?: number | null
        }
        Update: {
          baldness_grade?: string | null
          branch?: string | null
          category?: string | null
          clinic_id?: string | null
          consulted_by?: string | null
          contract_status?: string | null
          created_at?: string
          deposit_paid?: number | null
          distract_date?: string | null
          exchange_value?: number | null
          id?: string
          in_clickup?: boolean | null
          in_conta_azul?: boolean | null
          in_feegow?: boolean | null
          in_surgery_schedule?: boolean | null
          medical_record?: string | null
          month_year?: string
          observations?: string | null
          origin_observation?: string | null
          patient_cpf?: string | null
          patient_email?: string | null
          patient_name?: string
          patient_origin?: string | null
          registered_by?: string | null
          sale_date?: string
          service_type?: string
          sold_by?: string | null
          updated_at?: string
          user_id?: string
          vgv_initial?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      surgery_schedule: {
        Row: {
          balance_due: number | null
          category: string | null
          checkin_sent: boolean | null
          clinic_id: string | null
          companion_name: string | null
          companion_phone: string | null
          confirmed: boolean | null
          contract_signed: boolean | null
          created_at: string
          d0_discharge_form: boolean | null
          d1_contact: boolean | null
          d1_gpi: boolean | null
          d2_contact: boolean | null
          d7_contact: boolean | null
          day_of_week: string | null
          deposit_paid: number | null
          exams_in_system: boolean | null
          exams_sent: boolean | null
          final_value: number | null
          financial_verification: string | null
          grade: number | null
          id: string
          initial_value: number | null
          medical_record: string | null
          observations: string | null
          patient_name: string
          patient_phone: string | null
          post_sale_notes: string | null
          procedure_type: string | null
          referral_bonus: number | null
          remaining_paid: number | null
          scheduling_form: boolean | null
          surgery_date: string
          surgery_time: string | null
          trichotomy_datetime: string | null
          updated_at: string
          upgrade_value: number | null
          upsell_value: number | null
          user_id: string
        }
        Insert: {
          balance_due?: number | null
          category?: string | null
          checkin_sent?: boolean | null
          clinic_id?: string | null
          companion_name?: string | null
          companion_phone?: string | null
          confirmed?: boolean | null
          contract_signed?: boolean | null
          created_at?: string
          d0_discharge_form?: boolean | null
          d1_contact?: boolean | null
          d1_gpi?: boolean | null
          d2_contact?: boolean | null
          d7_contact?: boolean | null
          day_of_week?: string | null
          deposit_paid?: number | null
          exams_in_system?: boolean | null
          exams_sent?: boolean | null
          final_value?: number | null
          financial_verification?: string | null
          grade?: number | null
          id?: string
          initial_value?: number | null
          medical_record?: string | null
          observations?: string | null
          patient_name: string
          patient_phone?: string | null
          post_sale_notes?: string | null
          procedure_type?: string | null
          referral_bonus?: number | null
          remaining_paid?: number | null
          scheduling_form?: boolean | null
          surgery_date: string
          surgery_time?: string | null
          trichotomy_datetime?: string | null
          updated_at?: string
          upgrade_value?: number | null
          upsell_value?: number | null
          user_id: string
        }
        Update: {
          balance_due?: number | null
          category?: string | null
          checkin_sent?: boolean | null
          clinic_id?: string | null
          companion_name?: string | null
          companion_phone?: string | null
          confirmed?: boolean | null
          contract_signed?: boolean | null
          created_at?: string
          d0_discharge_form?: boolean | null
          d1_contact?: boolean | null
          d1_gpi?: boolean | null
          d2_contact?: boolean | null
          d7_contact?: boolean | null
          day_of_week?: string | null
          deposit_paid?: number | null
          exams_in_system?: boolean | null
          exams_sent?: boolean | null
          final_value?: number | null
          financial_verification?: string | null
          grade?: number | null
          id?: string
          initial_value?: number | null
          medical_record?: string | null
          observations?: string | null
          patient_name?: string
          patient_phone?: string | null
          post_sale_notes?: string | null
          procedure_type?: string | null
          referral_bonus?: number | null
          remaining_paid?: number | null
          scheduling_form?: boolean | null
          surgery_date?: string
          surgery_time?: string | null
          trichotomy_datetime?: string | null
          updated_at?: string
          upgrade_value?: number | null
          upsell_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "surgery_schedule_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      surgery_submissions: {
        Row: {
          created_at: string
          description: string | null
          id: string
          photo_urls: string[]
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          photo_urls?: string[]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          photo_urls?: string[]
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          unlocked_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          unlocked_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_course_enrollments: {
        Row: {
          completed_at: string | null
          course_id: string
          enrolled_at: string | null
          id: string
          progress_percent: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          enrolled_at?: string | null
          id?: string
          progress_percent?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          enrolled_at?: string | null
          id?: string
          progress_percent?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_goals: {
        Row: {
          courses_goal: number
          created_at: string
          id: string
          leads_goal: number
          month: number
          points_goal: number
          updated_at: string
          user_id: string
          year: number
        }
        Insert: {
          courses_goal?: number
          created_at?: string
          id?: string
          leads_goal?: number
          month: number
          points_goal?: number
          updated_at?: string
          user_id: string
          year?: number
        }
        Update: {
          courses_goal?: number
          created_at?: string
          id?: string
          leads_goal?: number
          month?: number
          points_goal?: number
          updated_at?: string
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      user_lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          is_completed: boolean | null
          lesson_id: string
          started_at: string | null
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          lesson_id: string
          started_at?: string | null
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          lesson_id?: string
          started_at?: string | null
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "module_lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_quiz_attempts: {
        Row: {
          answers: Json | null
          completed_at: string | null
          id: string
          max_score: number | null
          passed: boolean | null
          quiz_id: string
          score: number | null
          started_at: string | null
          user_id: string
        }
        Insert: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id: string
          score?: number | null
          started_at?: string | null
          user_id: string
        }
        Update: {
          answers?: Json | null
          completed_at?: string | null
          id?: string
          max_score?: number | null
          passed?: boolean | null
          quiz_id?: string
          score?: number | null
          started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quiz_attempts_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "lesson_quizzes"
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
      user_sessions: {
        Row: {
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          started_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: []
      }
      weekly_metrics: {
        Row: {
          clinic_id: string
          created_at: string
          id: string
          is_filled: boolean
          updated_at: string
          values: Json
          week_number: number
          year: number
        }
        Insert: {
          clinic_id: string
          created_at?: string
          id?: string
          is_filled?: boolean
          updated_at?: string
          values?: Json
          week_number: number
          year?: number
        }
        Update: {
          clinic_id?: string
          created_at?: string
          id?: string
          is_filled?: boolean
          updated_at?: string
          values?: Json
          week_number?: number
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "weekly_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_portal_user_id: { Args: { _auth_user_id: string }; Returns: string }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_portal_role: {
        Args: {
          _auth_user_id: string
          _role: Database["public"]["Enums"]["portal_role"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "licensee"
      portal_role:
        | "patient"
        | "doctor"
        | "admin"
        | "financial"
        | "reception"
        | "inventory"
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
      app_role: ["admin", "licensee"],
      portal_role: [
        "patient",
        "doctor",
        "admin",
        "financial",
        "reception",
        "inventory",
      ],
    },
  },
} as const
