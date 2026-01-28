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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
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
      alert_history: {
        Row: {
          alert_id: string | null
          emails_sent_to: string[] | null
          id: string
          metric_key: string
          metric_value: number
          severity: string
          threshold_value: number
          triggered_at: string
        }
        Insert: {
          alert_id?: string | null
          emails_sent_to?: string[] | null
          id?: string
          metric_key: string
          metric_value: number
          severity: string
          threshold_value: number
          triggered_at?: string
        }
        Update: {
          alert_id?: string | null
          emails_sent_to?: string[] | null
          id?: string
          metric_key?: string
          metric_value?: number
          severity?: string
          threshold_value?: number
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "alert_history_alert_id_fkey"
            columns: ["alert_id"]
            isOneToOne: false
            referencedRelation: "metric_alerts"
            referencedColumns: ["id"]
          },
        ]
      }
      announcements: {
        Row: {
          accent_color: string | null
          background_color: string | null
          created_at: string
          created_by: string | null
          description: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          link_text: string | null
          link_url: string | null
          priority: number | null
          starts_at: string | null
          target_modules: string[] | null
          target_profiles: string[] | null
          text_color: string | null
          title: string
          updated_at: string
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          priority?: number | null
          starts_at?: string | null
          target_modules?: string[] | null
          target_profiles?: string[] | null
          text_color?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          link_text?: string | null
          link_url?: string | null
          priority?: number | null
          starts_at?: string | null
          target_modules?: string[] | null
          target_profiles?: string[] | null
          text_color?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      banner_clicks: {
        Row: {
          banner_id: string
          clicked_at: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          banner_id: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          banner_id?: string
          clicked_at?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "banner_clicks_banner_id_fkey"
            columns: ["banner_id"]
            isOneToOne: false
            referencedRelation: "carousel_banners"
            referencedColumns: ["id"]
          },
        ]
      }
      carousel_banners: {
        Row: {
          bg_color: string | null
          bg_image_url: string | null
          click_count: number | null
          created_at: string
          created_by: string | null
          display_order: number | null
          highlight: string | null
          id: string
          is_active: boolean | null
          route: string
          subtitle: string | null
          text_position: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          bg_color?: string | null
          bg_image_url?: string | null
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          highlight?: string | null
          id?: string
          is_active?: boolean | null
          route: string
          subtitle?: string | null
          text_position?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          bg_color?: string | null
          bg_image_url?: string | null
          click_count?: number | null
          created_at?: string
          created_by?: string | null
          display_order?: number | null
          highlight?: string | null
          id?: string
          is_active?: boolean | null
          route?: string
          subtitle?: string | null
          text_position?: string | null
          title?: string | null
          updated_at?: string
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
      class_enrollments: {
        Row: {
          class_id: string
          enrolled_at: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          class_id: string
          enrolled_at?: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          class_id?: string
          enrolled_at?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedule: {
        Row: {
          class_id: string
          created_at: string
          day_date: string | null
          day_number: number
          day_theme: string | null
          day_title: string
          id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          day_date?: string | null
          day_number: number
          day_theme?: string | null
          day_title: string
          id?: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          day_date?: string | null
          day_number?: number
          day_theme?: string | null
          day_title?: string
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedule_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      class_schedule_items: {
        Row: {
          activity: string
          created_at: string
          end_time: string
          id: string
          instructor: string | null
          location: string | null
          notes: string | null
          order_index: number | null
          schedule_id: string
          start_time: string
        }
        Insert: {
          activity: string
          created_at?: string
          end_time: string
          id?: string
          instructor?: string | null
          location?: string | null
          notes?: string | null
          order_index?: number | null
          schedule_id: string
          start_time: string
        }
        Update: {
          activity?: string
          created_at?: string
          end_time?: string
          id?: string
          instructor?: string | null
          location?: string | null
          notes?: string | null
          order_index?: number | null
          schedule_id?: string
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_schedule_items_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "class_schedule"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_patients: {
        Row: {
          cpf: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          cpf?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      clinic_sales: {
        Row: {
          balance_due: number | null
          branch: string
          category: string | null
          consultant: string | null
          contract_status: Database["public"]["Enums"]["contract_status"]
          created_at: string | null
          created_by: string | null
          down_payment: number | null
          id: string
          lead_source: string | null
          notes: string | null
          patient_id: string | null
          sale_date: string
          seller: string | null
          service_type: string
          updated_at: string | null
          vgv: number | null
        }
        Insert: {
          balance_due?: number | null
          branch: string
          category?: string | null
          consultant?: string | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string | null
          created_by?: string | null
          down_payment?: number | null
          id?: string
          lead_source?: string | null
          notes?: string | null
          patient_id?: string | null
          sale_date?: string
          seller?: string | null
          service_type: string
          updated_at?: string | null
          vgv?: number | null
        }
        Update: {
          balance_due?: number | null
          branch?: string
          category?: string | null
          consultant?: string | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string | null
          created_by?: string | null
          down_payment?: number | null
          id?: string
          lead_source?: string | null
          notes?: string | null
          patient_id?: string | null
          sale_date?: string
          seller?: string | null
          service_type?: string
          updated_at?: string | null
          vgv?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_sales_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      clinic_surgeries: {
        Row: {
          booking_term_signed: boolean | null
          branch: string
          category: string | null
          chart_ready: boolean | null
          companion_name: string | null
          companion_phone: string | null
          contract_signed: boolean | null
          created_at: string | null
          created_by: string | null
          discharge_term_signed: boolean | null
          doctor_on_duty: string | null
          exams_sent: boolean | null
          expected_month: string | null
          gpi_d1_done: boolean | null
          grade: number | null
          id: string
          lunch_choice: string | null
          notes: string | null
          outsourcing: boolean | null
          patient_id: string | null
          procedure: string
          sale_id: string | null
          schedule_status: Database["public"]["Enums"]["schedule_status"]
          surgery_confirmed: boolean | null
          surgery_date: string | null
          surgery_time: string | null
          updated_at: string | null
        }
        Insert: {
          booking_term_signed?: boolean | null
          branch: string
          category?: string | null
          chart_ready?: boolean | null
          companion_name?: string | null
          companion_phone?: string | null
          contract_signed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          discharge_term_signed?: boolean | null
          doctor_on_duty?: string | null
          exams_sent?: boolean | null
          expected_month?: string | null
          gpi_d1_done?: boolean | null
          grade?: number | null
          id?: string
          lunch_choice?: string | null
          notes?: string | null
          outsourcing?: boolean | null
          patient_id?: string | null
          procedure: string
          sale_id?: string | null
          schedule_status?: Database["public"]["Enums"]["schedule_status"]
          surgery_confirmed?: boolean | null
          surgery_date?: string | null
          surgery_time?: string | null
          updated_at?: string | null
        }
        Update: {
          booking_term_signed?: boolean | null
          branch?: string
          category?: string | null
          chart_ready?: boolean | null
          companion_name?: string | null
          companion_phone?: string | null
          contract_signed?: boolean | null
          created_at?: string | null
          created_by?: string | null
          discharge_term_signed?: boolean | null
          doctor_on_duty?: string | null
          exams_sent?: boolean | null
          expected_month?: string | null
          gpi_d1_done?: boolean | null
          grade?: number | null
          id?: string
          lunch_choice?: string | null
          notes?: string | null
          outsourcing?: boolean | null
          patient_id?: string | null
          procedure?: string
          sale_id?: string | null
          schedule_status?: Database["public"]["Enums"]["schedule_status"]
          surgery_confirmed?: boolean | null
          surgery_date?: string | null
          surgery_time?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clinic_surgeries_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clinic_surgeries_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "clinic_sales"
            referencedColumns: ["id"]
          },
        ]
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
      community_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          recipient_id: string
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id: string
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          recipient_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      contact_requests: {
        Row: {
          created_at: string
          id: string
          message: string | null
          requester_id: string
          responded_at: string | null
          status: string
          target_user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id: string
          responded_at?: string | null
          status?: string
          target_user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string | null
          requester_id?: string
          responded_at?: string | null
          status?: string
          target_user_id?: string
        }
        Relationships: []
      }
      course_classes: {
        Row: {
          code: string
          course_id: string | null
          created_at: string
          end_date: string | null
          id: string
          instructor_notes: string | null
          location: string | null
          max_students: number | null
          name: string
          start_date: string | null
          status: string
          updated_at: string
        }
        Insert: {
          code: string
          course_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          instructor_notes?: string | null
          location?: string | null
          max_students?: number | null
          name: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          code?: string
          course_id?: string | null
          created_at?: string
          end_date?: string | null
          id?: string
          instructor_notes?: string | null
          location?: string | null
          max_students?: number | null
          name?: string
          start_date?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_galleries: {
        Row: {
          class_id: string | null
          course_id: string | null
          cover_photo_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          photo_count: number | null
          required_exam_id: string | null
          required_survey_type: string | null
          status: string | null
          title: string
          unlock_requirement: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          course_id?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          photo_count?: number | null
          required_exam_id?: string | null
          required_survey_type?: string | null
          status?: string | null
          title: string
          unlock_requirement?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          course_id?: string | null
          cover_photo_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          photo_count?: number | null
          required_exam_id?: string | null
          required_survey_type?: string | null
          status?: string | null
          title?: string
          unlock_requirement?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_galleries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_galleries_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_galleries_required_exam_id_fkey"
            columns: ["required_exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      course_gallery_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          file_size: number | null
          filename: string | null
          full_url: string
          gallery_id: string
          id: string
          order_index: number | null
          storage_path: string
          thumbnail_url: string | null
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          file_size?: number | null
          filename?: string | null
          full_url: string
          gallery_id: string
          id?: string
          order_index?: number | null
          storage_path: string
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          file_size?: number | null
          filename?: string | null
          full_url?: string
          gallery_id?: string
          id?: string
          order_index?: number | null
          storage_path?: string
          thumbnail_url?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_gallery_photos_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "course_galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_gallery_photos_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "gallery_stats"
            referencedColumns: ["gallery_id"]
          },
        ]
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
      crm_conversations: {
        Row: {
          assigned_to: string | null
          channel: string
          created_at: string
          id: string
          last_message_at: string | null
          lead_id: string
          status: string
          unread_count: number
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          channel?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id: string
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          channel?: string
          created_at?: string
          id?: string
          last_message_at?: string | null
          lead_id?: string
          status?: string
          unread_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_conversations_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_messages: {
        Row: {
          content: string | null
          conversation_id: string
          created_at: string
          delivered_at: string | null
          direction: string
          id: string
          media_type: string | null
          media_url: string | null
          read_at: string | null
          sender_name: string | null
          sent_at: string
        }
        Insert: {
          content?: string | null
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          direction: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_name?: string | null
          sent_at?: string
        }
        Update: {
          content?: string | null
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          direction?: string
          id?: string
          media_type?: string | null
          media_url?: string | null
          read_at?: string | null
          sender_name?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "crm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_metrics: {
        Row: {
          agendamentos: number | null
          atividades_atendente: number | null
          atividades_robo: number | null
          clinic_id: string
          created_at: string
          created_by: string | null
          id: string
          investimento_trafego: number | null
          leads_descartados: number | null
          leads_novos: number | null
          mensagens_enviadas_atendente: number | null
          mensagens_enviadas_robo: number | null
          mensagens_recebidas: number | null
          metric_date: string
          tarefas_atrasadas: number | null
          tarefas_realizadas: number | null
          tempo_uso_atendente: number | null
          updated_at: string
          vendas_realizadas: number | null
        }
        Insert: {
          agendamentos?: number | null
          atividades_atendente?: number | null
          atividades_robo?: number | null
          clinic_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          investimento_trafego?: number | null
          leads_descartados?: number | null
          leads_novos?: number | null
          mensagens_enviadas_atendente?: number | null
          mensagens_enviadas_robo?: number | null
          mensagens_recebidas?: number | null
          metric_date: string
          tarefas_atrasadas?: number | null
          tarefas_realizadas?: number | null
          tempo_uso_atendente?: number | null
          updated_at?: string
          vendas_realizadas?: number | null
        }
        Update: {
          agendamentos?: number | null
          atividades_atendente?: number | null
          atividades_robo?: number | null
          clinic_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          investimento_trafego?: number | null
          leads_descartados?: number | null
          leads_novos?: number | null
          mensagens_enviadas_atendente?: number | null
          mensagens_enviadas_robo?: number | null
          mensagens_recebidas?: number | null
          metric_date?: string
          tarefas_atrasadas?: number | null
          tarefas_realizadas?: number | null
          tempo_uso_atendente?: number | null
          updated_at?: string
          vendas_realizadas?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_metrics_clinic_id_fkey"
            columns: ["clinic_id"]
            isOneToOne: false
            referencedRelation: "clinics"
            referencedColumns: ["id"]
          },
        ]
      }
      day1_satisfaction_surveys: {
        Row: {
          class_id: string | null
          completed_at: string | null
          created_at: string
          current_section: number | null
          effective_time_seconds: number | null
          id: string
          is_completed: boolean | null
          q1_satisfaction_level: string | null
          q10_patrick_time: string | null
          q11_patrick_liked_most: string | null
          q12_patrick_improve: string | null
          q13_organization: string | null
          q14_content_relevance: string | null
          q15_teacher_competence: string | null
          q16_material_quality: string | null
          q17_punctuality: string | null
          q18_infrastructure: string | null
          q19_support_team: string | null
          q2_first_time_course: boolean | null
          q20_coffee_break: string | null
          q21_liked_most_today: string | null
          q22_suggestions: string | null
          q23_start_preference: string | null
          q24_hunger_level: string | null
          q25_urgency_level: string | null
          q26_investment_level: string | null
          q27_weekly_time: string | null
          q28_current_reality: string | null
          q29_monitor_name: string | null
          q3_hygor_expectations: string | null
          q30_monitor_technical: string | null
          q31_monitor_interest: string | null
          q32_monitor_engagement: string | null
          q33_monitor_posture: string | null
          q34_monitor_communication: string | null
          q35_monitor_contribution: string | null
          q36_monitor_strength: string | null
          q37_monitor_improve: string | null
          q38_eder_technical: string | null
          q39_eder_interest: string | null
          q4_hygor_clarity: string | null
          q40_eder_engagement: string | null
          q41_eder_posture: string | null
          q42_eder_communication: string | null
          q43_eder_contribution: string | null
          q44_eder_strength: string | null
          q45_eder_improve: string | null
          q46_patrick_m_technical: string | null
          q47_patrick_m_interest: string | null
          q48_patrick_m_engagement: string | null
          q49_patrick_m_posture: string | null
          q5_hygor_time: string | null
          q50_patrick_m_communication: string | null
          q51_patrick_m_contribution: string | null
          q52_patrick_m_strength: string | null
          q53_patrick_m_improve: string | null
          q54_eder_m_technical: string | null
          q55_eder_m_interest: string | null
          q56_eder_m_engagement: string | null
          q57_eder_m_posture: string | null
          q58_eder_m_communication: string | null
          q59_eder_m_contribution: string | null
          q6_hygor_liked_most: string | null
          q60_eder_m_strength: string | null
          q61_eder_m_improve: string | null
          q62_gleyldes_technical: string | null
          q63_gleyldes_interest: string | null
          q64_gleyldes_engagement: string | null
          q65_gleyldes_posture: string | null
          q66_gleyldes_communication: string | null
          q67_gleyldes_contribution: string | null
          q68_gleyldes_strength: string | null
          q69_gleyldes_improve: string | null
          q7_hygor_improve: string | null
          q70_elenilton_technical: string | null
          q71_elenilton_interest: string | null
          q72_elenilton_engagement: string | null
          q73_elenilton_posture: string | null
          q74_elenilton_communication: string | null
          q75_elenilton_contribution: string | null
          q76_elenilton_strength: string | null
          q77_elenilton_improve: string | null
          q8_patrick_expectations: string | null
          q9_patrick_clarity: string | null
          user_id: string
        }
        Insert: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          effective_time_seconds?: number | null
          id?: string
          is_completed?: boolean | null
          q1_satisfaction_level?: string | null
          q10_patrick_time?: string | null
          q11_patrick_liked_most?: string | null
          q12_patrick_improve?: string | null
          q13_organization?: string | null
          q14_content_relevance?: string | null
          q15_teacher_competence?: string | null
          q16_material_quality?: string | null
          q17_punctuality?: string | null
          q18_infrastructure?: string | null
          q19_support_team?: string | null
          q2_first_time_course?: boolean | null
          q20_coffee_break?: string | null
          q21_liked_most_today?: string | null
          q22_suggestions?: string | null
          q23_start_preference?: string | null
          q24_hunger_level?: string | null
          q25_urgency_level?: string | null
          q26_investment_level?: string | null
          q27_weekly_time?: string | null
          q28_current_reality?: string | null
          q29_monitor_name?: string | null
          q3_hygor_expectations?: string | null
          q30_monitor_technical?: string | null
          q31_monitor_interest?: string | null
          q32_monitor_engagement?: string | null
          q33_monitor_posture?: string | null
          q34_monitor_communication?: string | null
          q35_monitor_contribution?: string | null
          q36_monitor_strength?: string | null
          q37_monitor_improve?: string | null
          q38_eder_technical?: string | null
          q39_eder_interest?: string | null
          q4_hygor_clarity?: string | null
          q40_eder_engagement?: string | null
          q41_eder_posture?: string | null
          q42_eder_communication?: string | null
          q43_eder_contribution?: string | null
          q44_eder_strength?: string | null
          q45_eder_improve?: string | null
          q46_patrick_m_technical?: string | null
          q47_patrick_m_interest?: string | null
          q48_patrick_m_engagement?: string | null
          q49_patrick_m_posture?: string | null
          q5_hygor_time?: string | null
          q50_patrick_m_communication?: string | null
          q51_patrick_m_contribution?: string | null
          q52_patrick_m_strength?: string | null
          q53_patrick_m_improve?: string | null
          q54_eder_m_technical?: string | null
          q55_eder_m_interest?: string | null
          q56_eder_m_engagement?: string | null
          q57_eder_m_posture?: string | null
          q58_eder_m_communication?: string | null
          q59_eder_m_contribution?: string | null
          q6_hygor_liked_most?: string | null
          q60_eder_m_strength?: string | null
          q61_eder_m_improve?: string | null
          q62_gleyldes_technical?: string | null
          q63_gleyldes_interest?: string | null
          q64_gleyldes_engagement?: string | null
          q65_gleyldes_posture?: string | null
          q66_gleyldes_communication?: string | null
          q67_gleyldes_contribution?: string | null
          q68_gleyldes_strength?: string | null
          q69_gleyldes_improve?: string | null
          q7_hygor_improve?: string | null
          q70_elenilton_technical?: string | null
          q71_elenilton_interest?: string | null
          q72_elenilton_engagement?: string | null
          q73_elenilton_posture?: string | null
          q74_elenilton_communication?: string | null
          q75_elenilton_contribution?: string | null
          q76_elenilton_strength?: string | null
          q77_elenilton_improve?: string | null
          q8_patrick_expectations?: string | null
          q9_patrick_clarity?: string | null
          user_id: string
        }
        Update: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          effective_time_seconds?: number | null
          id?: string
          is_completed?: boolean | null
          q1_satisfaction_level?: string | null
          q10_patrick_time?: string | null
          q11_patrick_liked_most?: string | null
          q12_patrick_improve?: string | null
          q13_organization?: string | null
          q14_content_relevance?: string | null
          q15_teacher_competence?: string | null
          q16_material_quality?: string | null
          q17_punctuality?: string | null
          q18_infrastructure?: string | null
          q19_support_team?: string | null
          q2_first_time_course?: boolean | null
          q20_coffee_break?: string | null
          q21_liked_most_today?: string | null
          q22_suggestions?: string | null
          q23_start_preference?: string | null
          q24_hunger_level?: string | null
          q25_urgency_level?: string | null
          q26_investment_level?: string | null
          q27_weekly_time?: string | null
          q28_current_reality?: string | null
          q29_monitor_name?: string | null
          q3_hygor_expectations?: string | null
          q30_monitor_technical?: string | null
          q31_monitor_interest?: string | null
          q32_monitor_engagement?: string | null
          q33_monitor_posture?: string | null
          q34_monitor_communication?: string | null
          q35_monitor_contribution?: string | null
          q36_monitor_strength?: string | null
          q37_monitor_improve?: string | null
          q38_eder_technical?: string | null
          q39_eder_interest?: string | null
          q4_hygor_clarity?: string | null
          q40_eder_engagement?: string | null
          q41_eder_posture?: string | null
          q42_eder_communication?: string | null
          q43_eder_contribution?: string | null
          q44_eder_strength?: string | null
          q45_eder_improve?: string | null
          q46_patrick_m_technical?: string | null
          q47_patrick_m_interest?: string | null
          q48_patrick_m_engagement?: string | null
          q49_patrick_m_posture?: string | null
          q5_hygor_time?: string | null
          q50_patrick_m_communication?: string | null
          q51_patrick_m_contribution?: string | null
          q52_patrick_m_strength?: string | null
          q53_patrick_m_improve?: string | null
          q54_eder_m_technical?: string | null
          q55_eder_m_interest?: string | null
          q56_eder_m_engagement?: string | null
          q57_eder_m_posture?: string | null
          q58_eder_m_communication?: string | null
          q59_eder_m_contribution?: string | null
          q6_hygor_liked_most?: string | null
          q60_eder_m_strength?: string | null
          q61_eder_m_improve?: string | null
          q62_gleyldes_technical?: string | null
          q63_gleyldes_interest?: string | null
          q64_gleyldes_engagement?: string | null
          q65_gleyldes_posture?: string | null
          q66_gleyldes_communication?: string | null
          q67_gleyldes_contribution?: string | null
          q68_gleyldes_strength?: string | null
          q69_gleyldes_improve?: string | null
          q7_hygor_improve?: string | null
          q70_elenilton_technical?: string | null
          q71_elenilton_interest?: string | null
          q72_elenilton_engagement?: string | null
          q73_elenilton_posture?: string | null
          q74_elenilton_communication?: string | null
          q75_elenilton_contribution?: string | null
          q76_elenilton_strength?: string | null
          q77_elenilton_improve?: string | null
          q8_patrick_expectations?: string | null
          q9_patrick_clarity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day1_satisfaction_surveys_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      day2_satisfaction_surveys: {
        Row: {
          class_id: string | null
          completed_at: string | null
          created_at: string
          current_section: number | null
          effective_time_seconds: number | null
          id: string
          is_completed: boolean | null
          lead_classification: string | null
          q1_satisfaction_level: string | null
          q10_larissa_liked_most: string | null
          q11_larissa_improve: string | null
          q12_avivar_current_process: string | null
          q13_avivar_opportunity_loss: string | null
          q14_avivar_timing: string | null
          q15_license_path: string | null
          q16_license_pace: string | null
          q17_license_timing: string | null
          q18_legal_feeling: string | null
          q19_legal_influence: string | null
          q2_joao_expectations: string | null
          q20_legal_timing: string | null
          q3_joao_clarity: string | null
          q4_joao_time: string | null
          q5_joao_liked_most: string | null
          q6_joao_improve: string | null
          q7_larissa_expectations: string | null
          q8_larissa_clarity: string | null
          q9_larissa_time: string | null
          score_ia_avivar: number | null
          score_legal: number | null
          score_license: number | null
          score_total: number | null
          user_id: string
        }
        Insert: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          effective_time_seconds?: number | null
          id?: string
          is_completed?: boolean | null
          lead_classification?: string | null
          q1_satisfaction_level?: string | null
          q10_larissa_liked_most?: string | null
          q11_larissa_improve?: string | null
          q12_avivar_current_process?: string | null
          q13_avivar_opportunity_loss?: string | null
          q14_avivar_timing?: string | null
          q15_license_path?: string | null
          q16_license_pace?: string | null
          q17_license_timing?: string | null
          q18_legal_feeling?: string | null
          q19_legal_influence?: string | null
          q2_joao_expectations?: string | null
          q20_legal_timing?: string | null
          q3_joao_clarity?: string | null
          q4_joao_time?: string | null
          q5_joao_liked_most?: string | null
          q6_joao_improve?: string | null
          q7_larissa_expectations?: string | null
          q8_larissa_clarity?: string | null
          q9_larissa_time?: string | null
          score_ia_avivar?: number | null
          score_legal?: number | null
          score_license?: number | null
          score_total?: number | null
          user_id: string
        }
        Update: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          effective_time_seconds?: number | null
          id?: string
          is_completed?: boolean | null
          lead_classification?: string | null
          q1_satisfaction_level?: string | null
          q10_larissa_liked_most?: string | null
          q11_larissa_improve?: string | null
          q12_avivar_current_process?: string | null
          q13_avivar_opportunity_loss?: string | null
          q14_avivar_timing?: string | null
          q15_license_path?: string | null
          q16_license_pace?: string | null
          q17_license_timing?: string | null
          q18_legal_feeling?: string | null
          q19_legal_influence?: string | null
          q2_joao_expectations?: string | null
          q20_legal_timing?: string | null
          q3_joao_clarity?: string | null
          q4_joao_time?: string | null
          q5_joao_liked_most?: string | null
          q6_joao_improve?: string | null
          q7_larissa_expectations?: string | null
          q8_larissa_clarity?: string | null
          q9_larissa_time?: string | null
          score_ia_avivar?: number | null
          score_legal?: number | null
          score_license?: number | null
          score_total?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day2_satisfaction_surveys_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      day3_satisfaction_surveys: {
        Row: {
          class_id: string | null
          completed_at: string | null
          created_at: string
          current_section: number | null
          effective_time_seconds: number | null
          id: string
          is_completed: boolean | null
          q1_satisfaction_level: string | null
          q10_organization: string | null
          q11_support_quality: string | null
          q12_improvements: string | null
          q13_highlights: string | null
          q14_best_technical_monitor: string | null
          q15_best_caring_monitor: string | null
          q16_monitor_comments: string | null
          q2_promise_met: string | null
          q3_technical_foundations: string | null
          q4_practical_load: string | null
          q5_theory_practice_balance: string | null
          q6_execution_clarity: string | null
          q7_confidence_level: string | null
          q8_management_classes: string | null
          q9_legal_security: string | null
          user_id: string
        }
        Insert: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          effective_time_seconds?: number | null
          id?: string
          is_completed?: boolean | null
          q1_satisfaction_level?: string | null
          q10_organization?: string | null
          q11_support_quality?: string | null
          q12_improvements?: string | null
          q13_highlights?: string | null
          q14_best_technical_monitor?: string | null
          q15_best_caring_monitor?: string | null
          q16_monitor_comments?: string | null
          q2_promise_met?: string | null
          q3_technical_foundations?: string | null
          q4_practical_load?: string | null
          q5_theory_practice_balance?: string | null
          q6_execution_clarity?: string | null
          q7_confidence_level?: string | null
          q8_management_classes?: string | null
          q9_legal_security?: string | null
          user_id: string
        }
        Update: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_section?: number | null
          effective_time_seconds?: number | null
          id?: string
          is_completed?: boolean | null
          q1_satisfaction_level?: string | null
          q10_organization?: string | null
          q11_support_quality?: string | null
          q12_improvements?: string | null
          q13_highlights?: string | null
          q14_best_technical_monitor?: string | null
          q15_best_caring_monitor?: string | null
          q16_monitor_comments?: string | null
          q2_promise_met?: string | null
          q3_technical_foundations?: string | null
          q4_practical_load?: string | null
          q5_theory_practice_balance?: string | null
          q6_execution_clarity?: string | null
          q7_confidence_level?: string | null
          q8_management_classes?: string | null
          q9_legal_security?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "day3_satisfaction_surveys_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklist_items: {
        Row: {
          category: string | null
          checklist_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          days_offset: number
          due_date: string | null
          id: string
          observation: string | null
          priority: string | null
          responsible: string
          status: string | null
          task_description: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          checklist_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          days_offset?: number
          due_date?: string | null
          id?: string
          observation?: string | null
          priority?: string | null
          responsible: string
          status?: string | null
          task_description: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          checklist_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          days_offset?: number
          due_date?: string | null
          id?: string
          observation?: string | null
          priority?: string | null
          responsible?: string
          status?: string | null
          task_description?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklist_items_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "event_checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      event_checklists: {
        Row: {
          class_id: string | null
          created_at: string
          created_by: string | null
          event_end_date: string | null
          event_name: string
          event_start_date: string
          id: string
          location: string | null
          notes: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          event_end_date?: string | null
          event_name: string
          event_start_date: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          created_by?: string | null
          event_end_date?: string | null
          event_name?: string
          event_start_date?: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_checklists_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_answers: {
        Row: {
          answered_at: string | null
          attempt_id: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
          selected_answer: string | null
        }
        Insert: {
          answered_at?: string | null
          attempt_id: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
          selected_answer?: string | null
        }
        Update: {
          answered_at?: string | null
          attempt_id?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
          selected_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_answers_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "exam_attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "exam_questions_student"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_attempts: {
        Row: {
          class_id: string | null
          created_at: string
          earned_points: number | null
          exam_id: string
          id: string
          score: number | null
          started_at: string
          status: string
          submitted_at: string | null
          time_spent_seconds: number | null
          total_points: number | null
          user_id: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          earned_points?: number | null
          exam_id: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          time_spent_seconds?: number | null
          total_points?: number | null
          user_id: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          earned_points?: number | null
          exam_id?: string
          id?: string
          score?: number | null
          started_at?: string
          status?: string
          submitted_at?: string | null
          time_spent_seconds?: number | null
          total_points?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_attempts_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_attempts_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_questions: {
        Row: {
          correct_answer: string
          created_at: string
          exam_id: string
          explanation: string | null
          id: string
          options: Json | null
          order_index: number | null
          points: number | null
          question_text: string
          question_type: string
        }
        Insert: {
          correct_answer: string
          created_at?: string
          exam_id: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text: string
          question_type?: string
        }
        Update: {
          correct_answer?: string
          created_at?: string
          exam_id?: string
          explanation?: string | null
          id?: string
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text?: string
          question_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          available_from: string | null
          available_until: string | null
          class_id: string | null
          course_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_active: boolean | null
          max_attempts: number | null
          passing_score: number | null
          show_results_immediately: boolean | null
          shuffle_options: boolean | null
          shuffle_questions: boolean | null
          title: string
          updated_at: string
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          show_results_immediately?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          title: string
          updated_at?: string
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          class_id?: string | null
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_active?: boolean | null
          max_attempts?: number | null
          passing_score?: number | null
          show_results_immediately?: boolean | null
          shuffle_options?: boolean | null
          shuffle_questions?: boolean | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          created_at: string | null
          description: string | null
          environment: string | null
          id: string
          is_enabled: boolean | null
          key: string
          metadata: Json | null
          name: string
          target_profiles: string[] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          environment?: string | null
          id?: string
          is_enabled?: boolean | null
          key: string
          metadata?: Json | null
          name: string
          target_profiles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          environment?: string | null
          id?: string
          is_enabled?: boolean | null
          key?: string
          metadata?: Json | null
          name?: string
          target_profiles?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gallery_photo_analytics: {
        Row: {
          action_type: string
          created_at: string
          gallery_id: string
          id: string
          ip_address: string | null
          photo_id: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action_type: string
          created_at?: string
          gallery_id: string
          id?: string
          ip_address?: string | null
          photo_id: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action_type?: string
          created_at?: string
          gallery_id?: string
          id?: string
          ip_address?: string | null
          photo_id?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gallery_photo_analytics_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "course_galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photo_analytics_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "gallery_stats"
            referencedColumns: ["gallery_id"]
          },
          {
            foreignKeyName: "gallery_photo_analytics_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "course_gallery_photos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gallery_photo_analytics_photo_id_fkey"
            columns: ["photo_id"]
            isOneToOne: false
            referencedRelation: "gallery_photo_stats"
            referencedColumns: ["photo_id"]
          },
        ]
      }
      ipromed_activity_log: {
        Row: {
          action: string
          created_at: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
          new_value: Json | null
          old_value: Json | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          description?: string | null
          entity_id: string
          entity_type: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          description?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      ipromed_ai_documents: {
        Row: {
          ai_model: string | null
          case_id: string | null
          client_id: string | null
          content: string | null
          created_at: string | null
          created_by: string | null
          document_type: string
          formatted_content: string | null
          generation_status: string | null
          id: string
          parent_document_id: string | null
          prompt_used: string | null
          template_id: string | null
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          ai_model?: string | null
          case_id?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type: string
          formatted_content?: string | null
          generation_status?: string | null
          id?: string
          parent_document_id?: string | null
          prompt_used?: string | null
          template_id?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          ai_model?: string | null
          case_id?: string | null
          client_id?: string | null
          content?: string | null
          created_at?: string | null
          created_by?: string | null
          document_type?: string
          formatted_content?: string | null
          generation_status?: string | null
          id?: string
          parent_document_id?: string | null
          prompt_used?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_ai_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_ai_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_ai_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "ipromed_ai_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_ai_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ipromed_document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_alerts: {
        Row: {
          alert_type: string
          appointment_id: string | null
          case_id: string | null
          category: string | null
          client_id: string | null
          created_at: string | null
          due_date: string | null
          id: string
          is_dismissed: boolean | null
          is_read: boolean | null
          message: string | null
          publication_id: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          alert_type?: string
          appointment_id?: string | null
          case_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string | null
          publication_id?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          alert_type?: string
          appointment_id?: string | null
          case_id?: string | null
          category?: string | null
          client_id?: string | null
          created_at?: string | null
          due_date?: string | null
          id?: string
          is_dismissed?: boolean | null
          is_read?: boolean | null
          message?: string | null
          publication_id?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_alerts_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "ipromed_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_alerts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_alerts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_alerts_publication_id_fkey"
            columns: ["publication_id"]
            isOneToOne: false
            referencedRelation: "ipromed_publications"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_appointments: {
        Row: {
          all_day: boolean | null
          appointment_type: string
          assigned_to: string | null
          case_id: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_datetime: string | null
          id: string
          is_virtual: boolean | null
          location: string | null
          meeting_url: string | null
          priority: string | null
          reminder_minutes: number | null
          start_datetime: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          all_day?: boolean | null
          appointment_type?: string
          assigned_to?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          meeting_url?: string | null
          priority?: string | null
          reminder_minutes?: number | null
          start_datetime: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          all_day?: boolean | null
          appointment_type?: string
          assigned_to?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_datetime?: string | null
          id?: string
          is_virtual?: boolean | null
          location?: string | null
          meeting_url?: string | null
          priority?: string | null
          reminder_minutes?: number | null
          start_datetime?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_appointments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_billing_rules: {
        Row: {
          created_at: string | null
          days_after_due: number[] | null
          days_before_due: number | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          overdue_template: string | null
          reminder_template: string | null
          send_email: boolean | null
          send_whatsapp: boolean | null
        }
        Insert: {
          created_at?: string | null
          days_after_due?: number[] | null
          days_before_due?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          overdue_template?: string | null
          reminder_template?: string | null
          send_email?: boolean | null
          send_whatsapp?: boolean | null
        }
        Update: {
          created_at?: string | null
          days_after_due?: number[] | null
          days_before_due?: number | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          overdue_template?: string | null
          reminder_template?: string | null
          send_email?: boolean | null
          send_whatsapp?: boolean | null
        }
        Relationships: []
      }
      ipromed_case_events: {
        Row: {
          case_id: string
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          deadline_date: string | null
          description: string | null
          event_date: string
          event_type: string
          id: string
          is_completed: boolean | null
          is_deadline: boolean | null
          title: string
        }
        Insert: {
          case_id: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          description?: string | null
          event_date: string
          event_type: string
          id?: string
          is_completed?: boolean | null
          is_deadline?: boolean | null
          title: string
        }
        Update: {
          case_id?: string
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          deadline_date?: string | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: string
          is_completed?: boolean | null
          is_deadline?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_case_events_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_case_movements: {
        Row: {
          case_id: string
          created_at: string | null
          created_by: string | null
          deadline_completed: boolean | null
          deadline_date: string | null
          description: string | null
          external_id: string | null
          has_deadline: boolean | null
          id: string
          movement_date: string
          movement_type: string
          source: string | null
          title: string
        }
        Insert: {
          case_id: string
          created_at?: string | null
          created_by?: string | null
          deadline_completed?: boolean | null
          deadline_date?: string | null
          description?: string | null
          external_id?: string | null
          has_deadline?: boolean | null
          id?: string
          movement_date?: string
          movement_type?: string
          source?: string | null
          title: string
        }
        Update: {
          case_id?: string
          created_at?: string | null
          created_by?: string | null
          deadline_completed?: boolean | null
          deadline_date?: string | null
          description?: string | null
          external_id?: string | null
          has_deadline?: boolean | null
          id?: string
          movement_date?: string
          movement_type?: string
          source?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_case_movements_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_client_journey: {
        Row: {
          client_id: string
          completed_at: string | null
          completed_by: string | null
          created_at: string
          deliverable_id: string
          due_date: string | null
          id: string
          notes: string | null
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deliverable_id: string
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          deliverable_id?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_client_journey_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_client_journey_deliverable_id_fkey"
            columns: ["deliverable_id"]
            isOneToOne: false
            referencedRelation: "ipromed_journey_deliverables"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_client_risk_scores: {
        Row: {
          assessed_by: string | null
          civel_factors: Json | null
          civel_score: number | null
          client_id: string
          created_at: string
          criminal_factors: Json | null
          criminal_score: number | null
          crm_factors: Json | null
          crm_score: number | null
          id: string
          last_assessed_at: string | null
          notes: string | null
          risk_level: string | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          assessed_by?: string | null
          civel_factors?: Json | null
          civel_score?: number | null
          client_id: string
          created_at?: string
          criminal_factors?: Json | null
          criminal_score?: number | null
          crm_factors?: Json | null
          crm_score?: number | null
          id?: string
          last_assessed_at?: string | null
          notes?: string | null
          risk_level?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          assessed_by?: string | null
          civel_factors?: Json | null
          civel_score?: number | null
          client_id?: string
          created_at?: string
          criminal_factors?: Json | null
          criminal_score?: number | null
          crm_factors?: Json | null
          crm_score?: number | null
          id?: string
          last_assessed_at?: string | null
          notes?: string | null
          risk_level?: string | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_client_risk_scores_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: true
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_comments: {
        Row: {
          appointment_id: string | null
          author_id: string | null
          case_id: string | null
          client_id: string | null
          content: string
          created_at: string | null
          document_id: string | null
          id: string
          mentions: string[] | null
          updated_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          author_id?: string | null
          case_id?: string | null
          client_id?: string | null
          content: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          mentions?: string[] | null
          updated_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          author_id?: string | null
          case_id?: string | null
          client_id?: string | null
          content?: string
          created_at?: string | null
          document_id?: string | null
          id?: string
          mentions?: string[] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_comments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "ipromed_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_comments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_comments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ipromed_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_contracts: {
        Row: {
          area: string | null
          auto_renew: boolean | null
          clicksign_document_key: string | null
          clicksign_status: string | null
          client_id: string | null
          contract_number: string | null
          contract_type: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          department: string | null
          description: string | null
          document_url: string | null
          end_date: string | null
          id: string
          metadata: Json | null
          notice_period_days: number | null
          partner1_client_id: string | null
          partner2_client_id: string | null
          renewal_date: string | null
          responsible_id: string | null
          signed_at: string | null
          signers: Json | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status_type"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          area?: string | null
          auto_renew?: boolean | null
          clicksign_document_key?: string | null
          clicksign_status?: string | null
          client_id?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          description?: string | null
          document_url?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          notice_period_days?: number | null
          partner1_client_id?: string | null
          partner2_client_id?: string | null
          renewal_date?: string | null
          responsible_id?: string | null
          signed_at?: string | null
          signers?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status_type"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          area?: string | null
          auto_renew?: boolean | null
          clicksign_document_key?: string | null
          clicksign_status?: string | null
          client_id?: string | null
          contract_number?: string | null
          contract_type?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          department?: string | null
          description?: string | null
          document_url?: string | null
          end_date?: string | null
          id?: string
          metadata?: Json | null
          notice_period_days?: number | null
          partner1_client_id?: string | null
          partner2_client_id?: string | null
          renewal_date?: string | null
          responsible_id?: string | null
          signed_at?: string | null
          signers?: Json | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status_type"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_contracts_partner1_client_id_fkey"
            columns: ["partner1_client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_contracts_partner2_client_id_fkey"
            columns: ["partner2_client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_document_templates: {
        Row: {
          category: string
          content: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
          variables: Json | null
          version: number | null
        }
        Insert: {
          category?: string
          content: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Update: {
          category?: string
          content?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
          variables?: Json | null
          version?: number | null
        }
        Relationships: []
      }
      ipromed_documents: {
        Row: {
          case_id: string | null
          category: string
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          parent_document_id: string | null
          status: string
          title: string
          updated_at: string | null
          version: number | null
        }
        Insert: {
          case_id?: string | null
          category?: string
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          parent_document_id?: string | null
          status?: string
          title: string
          updated_at?: string | null
          version?: number | null
        }
        Update: {
          case_id?: string | null
          category?: string
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          parent_document_id?: string | null
          status?: string
          title?: string
          updated_at?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ipromed_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_documents_parent_document_id_fkey"
            columns: ["parent_document_id"]
            isOneToOne: false
            referencedRelation: "ipromed_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_entity_tags: {
        Row: {
          appointment_id: string | null
          case_id: string | null
          client_id: string | null
          created_at: string | null
          document_id: string | null
          id: string
          tag_id: string | null
        }
        Insert: {
          appointment_id?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Update: {
          appointment_id?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          document_id?: string | null
          id?: string
          tag_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_entity_tags_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "ipromed_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_entity_tags_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_entity_tags_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_entity_tags_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "ipromed_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_entity_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "ipromed_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_generated_documents: {
        Row: {
          case_id: string | null
          client_id: string | null
          content: string
          contract_id: string | null
          created_at: string
          generated_by: string | null
          id: string
          status: string | null
          storage_path: string | null
          template_id: string | null
          title: string
          updated_at: string
          variables_used: Json | null
        }
        Insert: {
          case_id?: string | null
          client_id?: string | null
          content: string
          contract_id?: string | null
          created_at?: string
          generated_by?: string | null
          id?: string
          status?: string | null
          storage_path?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          variables_used?: Json | null
        }
        Update: {
          case_id?: string | null
          client_id?: string | null
          content?: string
          contract_id?: string | null
          created_at?: string
          generated_by?: string | null
          id?: string
          status?: string | null
          storage_path?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          variables_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_generated_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_generated_documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_generated_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ipromed_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_generated_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "ipromed_document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_goals: {
        Row: {
          created_at: string | null
          current_value: number | null
          description: string | null
          end_date: string
          id: string
          metric_type: string
          start_date: string
          status: string | null
          target_value: number
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date: string
          id?: string
          metric_type: string
          start_date: string
          status?: string | null
          target_value: number
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          description?: string | null
          end_date?: string
          id?: string
          metric_type?: string
          start_date?: string
          status?: string | null
          target_value?: number
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ipromed_indicator_snapshots: {
        Row: {
          active_cases: number | null
          billable_hours: number | null
          cases_lost: number | null
          cases_settled: number | null
          cases_won: number | null
          created_at: string | null
          deadlines_met: number | null
          deadlines_missed: number | null
          id: string
          new_clients: number | null
          period_type: string | null
          publications_treated: number | null
          snapshot_date: string
          total_billed: number | null
          total_cases: number | null
          total_clients: number | null
          total_deadlines: number | null
          total_hours_logged: number | null
          total_overdue: number | null
          total_pending: number | null
          total_received: number | null
        }
        Insert: {
          active_cases?: number | null
          billable_hours?: number | null
          cases_lost?: number | null
          cases_settled?: number | null
          cases_won?: number | null
          created_at?: string | null
          deadlines_met?: number | null
          deadlines_missed?: number | null
          id?: string
          new_clients?: number | null
          period_type?: string | null
          publications_treated?: number | null
          snapshot_date?: string
          total_billed?: number | null
          total_cases?: number | null
          total_clients?: number | null
          total_deadlines?: number | null
          total_hours_logged?: number | null
          total_overdue?: number | null
          total_pending?: number | null
          total_received?: number | null
        }
        Update: {
          active_cases?: number | null
          billable_hours?: number | null
          cases_lost?: number | null
          cases_settled?: number | null
          cases_won?: number | null
          created_at?: string | null
          deadlines_met?: number | null
          deadlines_missed?: number | null
          id?: string
          new_clients?: number | null
          period_type?: string | null
          publications_treated?: number | null
          snapshot_date?: string
          total_billed?: number | null
          total_cases?: number | null
          total_clients?: number | null
          total_deadlines?: number | null
          total_hours_logged?: number | null
          total_overdue?: number | null
          total_pending?: number | null
          total_received?: number | null
        }
        Relationships: []
      }
      ipromed_invoices: {
        Row: {
          amount: number
          boleto_barcode: string | null
          boleto_url: string | null
          case_id: string | null
          category: string | null
          client_id: string | null
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          description: string
          due_date: string
          id: string
          invoice_number: string | null
          invoice_type: string
          issue_date: string
          paid_at: string | null
          payment_method: string | null
          pix_code: string | null
          pix_qrcode_url: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          boleto_barcode?: string | null
          boleto_url?: string | null
          case_id?: string | null
          category?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description: string
          due_date: string
          id?: string
          invoice_number?: string | null
          invoice_type?: string
          issue_date?: string
          paid_at?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qrcode_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          boleto_barcode?: string | null
          boleto_url?: string | null
          case_id?: string | null
          category?: string | null
          client_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          description?: string
          due_date?: string
          id?: string
          invoice_number?: string | null
          invoice_type?: string
          issue_date?: string
          paid_at?: string | null
          payment_method?: string | null
          pix_code?: string | null
          pix_qrcode_url?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_invoices_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_invoices_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ipromed_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_journey_deliverables: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_required: boolean | null
          order_index: number
          phase: string
          title: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number
          phase: string
          title: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_required?: boolean | null
          order_index?: number
          phase?: string
          title?: string
        }
        Relationships: []
      }
      ipromed_legal_cases: {
        Row: {
          case_number: string | null
          case_type: string | null
          client_id: string | null
          closing_date: string | null
          court: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          estimated_value: number | null
          filing_date: string | null
          financial_provision: number | null
          id: string
          judge: string | null
          metadata: Json | null
          next_deadline: string | null
          outcome: string | null
          priority: number | null
          responsible_lawyer_id: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          status: Database["public"]["Enums"]["legal_case_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          case_number?: string | null
          case_type?: string | null
          client_id?: string | null
          closing_date?: string | null
          court?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          filing_date?: string | null
          financial_provision?: number | null
          id?: string
          judge?: string | null
          metadata?: Json | null
          next_deadline?: string | null
          outcome?: string | null
          priority?: number | null
          responsible_lawyer_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["legal_case_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          case_number?: string | null
          case_type?: string | null
          client_id?: string | null
          closing_date?: string | null
          court?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          estimated_value?: number | null
          filing_date?: string | null
          financial_provision?: number | null
          id?: string
          judge?: string | null
          metadata?: Json | null
          next_deadline?: string | null
          outcome?: string | null
          priority?: number | null
          responsible_lawyer_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          status?: Database["public"]["Enums"]["legal_case_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_legal_cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_legal_clients: {
        Row: {
          address: Json | null
          client_type: string | null
          cpf_cnpj: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          health_score: number | null
          id: string
          journey_stage:
            | Database["public"]["Enums"]["customer_journey_stage"]
            | null
          metadata: Json | null
          name: string
          notes: string | null
          partner_client_id: string | null
          phone: string | null
          responsible_lawyer_id: string | null
          risk_level: Database["public"]["Enums"]["risk_level"] | null
          shared_contract_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: Json | null
          client_type?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          health_score?: number | null
          id?: string
          journey_stage?:
            | Database["public"]["Enums"]["customer_journey_stage"]
            | null
          metadata?: Json | null
          name: string
          notes?: string | null
          partner_client_id?: string | null
          phone?: string | null
          responsible_lawyer_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          shared_contract_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: Json | null
          client_type?: string | null
          cpf_cnpj?: string | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          health_score?: number | null
          id?: string
          journey_stage?:
            | Database["public"]["Enums"]["customer_journey_stage"]
            | null
          metadata?: Json | null
          name?: string
          notes?: string | null
          partner_client_id?: string | null
          phone?: string | null
          responsible_lawyer_id?: string | null
          risk_level?: Database["public"]["Enums"]["risk_level"] | null
          shared_contract_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_legal_clients_partner_client_id_fkey"
            columns: ["partner_client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_legal_clients_shared_contract_id_fkey"
            columns: ["shared_contract_id"]
            isOneToOne: false
            referencedRelation: "ipromed_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_legal_documents: {
        Row: {
          case_id: string | null
          contract_id: string | null
          created_at: string | null
          document_type: string | null
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_template: boolean | null
          name: string
          request_id: string | null
          uploaded_by: string | null
          version: number | null
        }
        Insert: {
          case_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          document_type?: string | null
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_template?: boolean | null
          name: string
          request_id?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Update: {
          case_id?: string | null
          contract_id?: string | null
          created_at?: string | null
          document_type?: string | null
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_template?: boolean | null
          name?: string
          request_id?: string | null
          uploaded_by?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_legal_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_legal_documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ipromed_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_legal_documents_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_legal_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          due_date: string | null
          id: string
          is_within_sla: boolean | null
          metadata: Json | null
          priority: number | null
          request_number: string | null
          request_type: Database["public"]["Enums"]["legal_request_type"]
          requester_department: string | null
          requester_id: string | null
          requester_name: string | null
          response: string | null
          sla_hours: number | null
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_within_sla?: boolean | null
          metadata?: Json | null
          priority?: number | null
          request_number?: string | null
          request_type: Database["public"]["Enums"]["legal_request_type"]
          requester_department?: string | null
          requester_id?: string | null
          requester_name?: string | null
          response?: string | null
          sla_hours?: number | null
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          is_within_sla?: boolean | null
          metadata?: Json | null
          priority?: number | null
          request_number?: string | null
          request_type?: Database["public"]["Enums"]["legal_request_type"]
          requester_department?: string | null
          requester_id?: string | null
          requester_name?: string | null
          response?: string | null
          sla_hours?: number | null
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ipromed_legal_tasks: {
        Row: {
          actual_hours: number | null
          assigned_to: string | null
          assigned_to_name: string | null
          case_id: string | null
          completed_at: string | null
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          estimated_hours: number | null
          id: string
          priority: number | null
          request_id: string | null
          status: string | null
          tags: string[] | null
          task_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_hours?: number | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          case_id?: string | null
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: number | null
          request_id?: string | null
          status?: string | null
          tags?: string[] | null
          task_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_hours?: number | null
          assigned_to?: string | null
          assigned_to_name?: string | null
          case_id?: string | null
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          estimated_hours?: number | null
          id?: string
          priority?: number | null
          request_id?: string | null
          status?: string | null
          tags?: string[] | null
          task_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_legal_tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_legal_tasks_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "ipromed_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_legal_tasks_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_legal_team: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          oab_number: string | null
          role: string | null
          specialization: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          oab_number?: string | null
          role?: string | null
          specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          oab_number?: string | null
          role?: string | null
          specialization?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ipromed_publications: {
        Row: {
          case_id: string | null
          case_number: string | null
          client_id: string | null
          content: string | null
          court: string | null
          created_at: string | null
          discard_reason: string | null
          division: string | null
          full_text_url: string | null
          generated_deadline_id: string | null
          id: string
          publication_type: string
          published_date: string
          received_date: string | null
          search_term: string | null
          status: string
          summary: string | null
          treated_at: string | null
          treated_by: string | null
        }
        Insert: {
          case_id?: string | null
          case_number?: string | null
          client_id?: string | null
          content?: string | null
          court?: string | null
          created_at?: string | null
          discard_reason?: string | null
          division?: string | null
          full_text_url?: string | null
          generated_deadline_id?: string | null
          id?: string
          publication_type?: string
          published_date: string
          received_date?: string | null
          search_term?: string | null
          status?: string
          summary?: string | null
          treated_at?: string | null
          treated_by?: string | null
        }
        Update: {
          case_id?: string | null
          case_number?: string | null
          client_id?: string | null
          content?: string | null
          court?: string | null
          created_at?: string | null
          discard_reason?: string | null
          division?: string | null
          full_text_url?: string | null
          generated_deadline_id?: string | null
          id?: string
          publication_type?: string
          published_date?: string
          received_date?: string | null
          search_term?: string | null
          status?: string
          summary?: string | null
          treated_at?: string | null
          treated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_publications_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_publications_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_publications_generated_deadline_id_fkey"
            columns: ["generated_deadline_id"]
            isOneToOne: false
            referencedRelation: "ipromed_appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      ipromed_tags: {
        Row: {
          category: string | null
          color: string | null
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string | null
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      ipromed_timesheets: {
        Row: {
          activity_type: string | null
          case_id: string | null
          client_id: string | null
          created_at: string | null
          description: string
          duration_minutes: number | null
          end_time: string | null
          hourly_rate: number | null
          id: string
          invoice_id: string | null
          is_billable: boolean | null
          is_running: boolean | null
          start_time: string
          total_value: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          activity_type?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description: string
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          is_running?: boolean | null
          start_time: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          description?: string
          duration_minutes?: number | null
          end_time?: string | null
          hourly_rate?: number | null
          id?: string
          invoice_id?: string | null
          is_billable?: boolean | null
          is_running?: boolean | null
          start_time?: string
          total_value?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ipromed_timesheets_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_timesheets_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "ipromed_legal_clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ipromed_timesheets_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "ipromed_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      jon_jobs_nps: {
        Row: {
          closed_by: string | null
          created_at: string
          feedback: string | null
          id: string
          score: number
          session_duration_seconds: number | null
          session_id: string
          total_messages: number | null
          user_id: string
        }
        Insert: {
          closed_by?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          score: number
          session_duration_seconds?: number | null
          session_id: string
          total_messages?: number | null
          user_id: string
        }
        Update: {
          closed_by?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          score?: number
          session_duration_seconds?: number | null
          session_id?: string
          total_messages?: number | null
          user_id?: string
        }
        Relationships: []
      }
      jon_jobs_sessions: {
        Row: {
          email_nps_sent: boolean | null
          ended_at: string | null
          id: string
          last_activity_at: string
          message_count: number | null
          nps_sent: boolean | null
          started_at: string
          status: string | null
          user_id: string
        }
        Insert: {
          email_nps_sent?: boolean | null
          ended_at?: string | null
          id?: string
          last_activity_at?: string
          message_count?: number | null
          nps_sent?: boolean | null
          started_at?: string
          status?: string | null
          user_id: string
        }
        Update: {
          email_nps_sent?: boolean | null
          ended_at?: string | null
          id?: string
          last_activity_at?: string
          message_count?: number | null
          nps_sent?: boolean | null
          started_at?: string
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      lead_tasks: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_at: string | null
          id: string
          lead_id: string
          priority: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id: string
          priority?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_at?: string | null
          id?: string
          lead_id?: string
          priority?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
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
          discard_reason: string | null
          email: string | null
          id: string
          interest_level: string | null
          name: string
          notes: string | null
          phone: string
          procedure_interest: string | null
          procedures_sold: string[] | null
          scheduled_at: string | null
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
          discard_reason?: string | null
          email?: string | null
          id?: string
          interest_level?: string | null
          name: string
          notes?: string | null
          phone: string
          procedure_interest?: string | null
          procedures_sold?: string[] | null
          scheduled_at?: string | null
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
          discard_reason?: string | null
          email?: string | null
          id?: string
          interest_level?: string | null
          name?: string
          notes?: string | null
          phone?: string
          procedure_interest?: string | null
          procedures_sold?: string[] | null
          scheduled_at?: string | null
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
      metric_alerts: {
        Row: {
          comparison_operator: string
          cooldown_minutes: number | null
          created_at: string
          created_by: string | null
          email_recipients: string[] | null
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          metric_key: string
          metric_name: string
          severity: string
          threshold_value: number
          updated_at: string
        }
        Insert: {
          comparison_operator?: string
          cooldown_minutes?: number | null
          created_at?: string
          created_by?: string | null
          email_recipients?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metric_key: string
          metric_name: string
          severity?: string
          threshold_value: number
          updated_at?: string
        }
        Update: {
          comparison_operator?: string
          cooldown_minutes?: number | null
          created_at?: string
          created_by?: string | null
          email_recipients?: string[] | null
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          metric_key?: string
          metric_name?: string
          severity?: string
          threshold_value?: number
          updated_at?: string
        }
        Relationships: []
      }
      metric_history: {
        Row: {
          id: string
          metadata: Json | null
          metric_key: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          id?: string
          metadata?: Json | null
          metric_key: string
          metric_value: number
          recorded_at?: string
        }
        Update: {
          id?: string
          metadata?: Json | null
          metric_key?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: []
      }
      mobile_blocked_modules: {
        Row: {
          block_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          id: string
          is_active: boolean | null
          module_code: string
        }
        Insert: {
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          id?: string
          is_active?: boolean | null
          module_code: string
        }
        Update: {
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          id?: string
          is_active?: boolean | null
          module_code?: string
        }
        Relationships: []
      }
      module_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          key: string
          name: string
          order_index: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key: string
          name: string
          order_index?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          key?: string
          name?: string
          order_index?: number | null
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
      module_permissions: {
        Row: {
          can_delete: boolean | null
          can_read: boolean | null
          can_write: boolean | null
          created_at: string
          id: string
          module_category: string
          module_code: string
          module_name: string
          profile: string
          updated_at: string
        }
        Insert: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string
          id?: string
          module_category: string
          module_code: string
          module_name: string
          profile: string
          updated_at?: string
        }
        Update: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string
          id?: string
          module_category?: string
          module_code?: string
          module_name?: string
          profile?: string
          updated_at?: string
        }
        Relationships: []
      }
      monitored_systems: {
        Row: {
          check_interval_seconds: number | null
          created_at: string
          created_by: string | null
          description: string | null
          expected_status_codes: number[] | null
          headers: Json | null
          id: string
          is_active: boolean | null
          name: string
          timeout_ms: number | null
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          check_interval_seconds?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_status_codes?: number[] | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          timeout_ms?: number | null
          type: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          check_interval_seconds?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          expected_status_codes?: number[] | null
          headers?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          timeout_ms?: number | null
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      neohub_module_permissions: {
        Row: {
          can_delete: boolean | null
          can_read: boolean | null
          can_write: boolean | null
          created_at: string | null
          id: string
          module_code: string
          module_name: string
          portal: string
          profile: Database["public"]["Enums"]["neohub_profile"]
        }
        Insert: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          id?: string
          module_code: string
          module_name: string
          portal: string
          profile: Database["public"]["Enums"]["neohub_profile"]
        }
        Update: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          id?: string
          module_code?: string
          module_name?: string
          portal?: string
          profile?: Database["public"]["Enums"]["neohub_profile"]
        }
        Relationships: []
      }
      neohub_user_module_overrides: {
        Row: {
          can_delete: boolean | null
          can_read: boolean | null
          can_write: boolean | null
          created_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          module_code: string
          reason: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module_code: string
          reason?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          module_code?: string
          reason?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "neohub_user_module_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      neohub_user_profiles: {
        Row: {
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          neohub_user_id: string
          profile: Database["public"]["Enums"]["neohub_profile"]
        }
        Insert: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          neohub_user_id: string
          profile: Database["public"]["Enums"]["neohub_profile"]
        }
        Update: {
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          neohub_user_id?: string
          profile?: Database["public"]["Enums"]["neohub_profile"]
        }
        Relationships: [
          {
            foreignKeyName: "neohub_user_profiles_neohub_user_id_fkey"
            columns: ["neohub_user_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      neohub_users: {
        Row: {
          address_cep: string | null
          address_city: string | null
          address_complement: string | null
          address_neighborhood: string | null
          address_number: string | null
          address_state: string | null
          address_street: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          clinic_logo_url: string | null
          clinic_name: string | null
          cpf: string | null
          created_at: string | null
          crm: string | null
          email: string
          full_name: string
          id: string
          instagram_clinic: string | null
          instagram_personal: string | null
          is_active: boolean | null
          last_seen_at: string | null
          marital_status: string | null
          nationality: string | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone: string | null
          profile_public: boolean | null
          referral_code: string | null
          rqe: string | null
          services: string[] | null
          surgery_date: string | null
          tier: string | null
          total_points: number | null
          updated_at: string | null
          user_id: string
          whatsapp_clinic: string | null
          whatsapp_personal: string | null
        }
        Insert: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          clinic_logo_url?: string | null
          clinic_name?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          email: string
          full_name: string
          id?: string
          instagram_clinic?: string | null
          instagram_personal?: string | null
          is_active?: boolean | null
          last_seen_at?: string | null
          marital_status?: string | null
          nationality?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          profile_public?: boolean | null
          referral_code?: string | null
          rqe?: string | null
          services?: string[] | null
          surgery_date?: string | null
          tier?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id: string
          whatsapp_clinic?: string | null
          whatsapp_personal?: string | null
        }
        Update: {
          address_cep?: string | null
          address_city?: string | null
          address_complement?: string | null
          address_neighborhood?: string | null
          address_number?: string | null
          address_state?: string | null
          address_street?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          clinic_logo_url?: string | null
          clinic_name?: string | null
          cpf?: string | null
          created_at?: string | null
          crm?: string | null
          email?: string
          full_name?: string
          id?: string
          instagram_clinic?: string | null
          instagram_personal?: string | null
          is_active?: boolean | null
          last_seen_at?: string | null
          marital_status?: string | null
          nationality?: string | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone?: string | null
          profile_public?: boolean | null
          referral_code?: string | null
          rqe?: string | null
          services?: string[] | null
          surgery_date?: string | null
          tier?: string | null
          total_points?: number | null
          updated_at?: string | null
          user_id?: string
          whatsapp_clinic?: string | null
          whatsapp_personal?: string | null
        }
        Relationships: []
      }
      neoteam_anamnesis: {
        Row: {
          additional_info: string | null
          age: number | null
          baldness_grade: number | null
          best_time_procedure: string | null
          blood_pressure: string | null
          branch_id: string | null
          chronic_diseases: string | null
          continuous_medications: string | null
          created_at: string | null
          created_by: string | null
          current_feeling: string | null
          decision_factors: string | null
          family_baldness: string | null
          follows_neofolic: string | null
          hair_loss_evolution: string | null
          health_insurance: string | null
          health_insurance_type: string | null
          how_found_clinic: string | null
          id: string
          important_event: string | null
          interest_regions: string[] | null
          known_allergies: string | null
          main_complaint: string | null
          patient_id: string | null
          patient_name: string
          previous_clinical_treatment: string | null
          previous_surgeries: string | null
          previous_transplant: string | null
          price_awareness: string | null
          profession: string | null
          recent_exams: string | null
          seen_other_results: string | null
          status: string | null
          updated_at: string | null
          urgency_level: number | null
          visited_other_clinics: string | null
        }
        Insert: {
          additional_info?: string | null
          age?: number | null
          baldness_grade?: number | null
          best_time_procedure?: string | null
          blood_pressure?: string | null
          branch_id?: string | null
          chronic_diseases?: string | null
          continuous_medications?: string | null
          created_at?: string | null
          created_by?: string | null
          current_feeling?: string | null
          decision_factors?: string | null
          family_baldness?: string | null
          follows_neofolic?: string | null
          hair_loss_evolution?: string | null
          health_insurance?: string | null
          health_insurance_type?: string | null
          how_found_clinic?: string | null
          id?: string
          important_event?: string | null
          interest_regions?: string[] | null
          known_allergies?: string | null
          main_complaint?: string | null
          patient_id?: string | null
          patient_name: string
          previous_clinical_treatment?: string | null
          previous_surgeries?: string | null
          previous_transplant?: string | null
          price_awareness?: string | null
          profession?: string | null
          recent_exams?: string | null
          seen_other_results?: string | null
          status?: string | null
          updated_at?: string | null
          urgency_level?: number | null
          visited_other_clinics?: string | null
        }
        Update: {
          additional_info?: string | null
          age?: number | null
          baldness_grade?: number | null
          best_time_procedure?: string | null
          blood_pressure?: string | null
          branch_id?: string | null
          chronic_diseases?: string | null
          continuous_medications?: string | null
          created_at?: string | null
          created_by?: string | null
          current_feeling?: string | null
          decision_factors?: string | null
          family_baldness?: string | null
          follows_neofolic?: string | null
          hair_loss_evolution?: string | null
          health_insurance?: string | null
          health_insurance_type?: string | null
          how_found_clinic?: string | null
          id?: string
          important_event?: string | null
          interest_regions?: string[] | null
          known_allergies?: string | null
          main_complaint?: string | null
          patient_id?: string | null
          patient_name?: string
          previous_clinical_treatment?: string | null
          previous_surgeries?: string | null
          previous_transplant?: string | null
          price_awareness?: string | null
          profession?: string | null
          recent_exams?: string | null
          seen_other_results?: string | null
          status?: string | null
          updated_at?: string | null
          urgency_level?: number | null
          visited_other_clinics?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neoteam_anamnesis_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "neoteam_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neoteam_anamnesis_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "clinic_patients"
            referencedColumns: ["id"]
          },
        ]
      }
      neoteam_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          branch: string | null
          created_at: string
          created_by: string | null
          doctor_id: string | null
          doctor_name: string | null
          duration_minutes: number
          id: string
          notes: string | null
          patient_email: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          branch?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          branch?: string | null
          created_at?: string
          created_by?: string | null
          doctor_id?: string | null
          doctor_name?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          patient_email?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neoteam_appointments_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      neoteam_branches: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      neoteam_doctor_schedules: {
        Row: {
          created_at: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id: string
          is_active: boolean
          slot_duration_minutes: number | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          doctor_id: string
          end_time: string
          id?: string
          is_active?: boolean
          slot_duration_minutes?: number | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          doctor_id?: string
          end_time?: string
          id?: string
          is_active?: boolean
          slot_duration_minutes?: number | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "neoteam_doctor_schedules_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "neoteam_doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      neoteam_doctors: {
        Row: {
          avatar_url: string | null
          consultation_duration_minutes: number | null
          created_at: string
          crm: string | null
          crm_state: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          neohub_user_id: string | null
          phone: string | null
          specialty: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          consultation_duration_minutes?: number | null
          created_at?: string
          crm?: string | null
          crm_state?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          neohub_user_id?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          consultation_duration_minutes?: number | null
          created_at?: string
          crm?: string | null
          crm_state?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          neohub_user_id?: string | null
          phone?: string | null
          specialty?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neoteam_doctors_neohub_user_id_fkey"
            columns: ["neohub_user_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      neoteam_patient_documents: {
        Row: {
          branch: string | null
          category: string
          created_at: string
          description: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string
          id: string
          patient_id: string | null
          patient_name: string | null
          updated_at: string
          uploaded_by: string | null
        }
        Insert: {
          branch?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type: string
          id?: string
          patient_id?: string | null
          patient_name?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Update: {
          branch?: string | null
          category?: string
          created_at?: string
          description?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string
          id?: string
          patient_id?: string | null
          patient_name?: string | null
          updated_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "neoteam_patient_documents_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      neoteam_schedule_blocks: {
        Row: {
          created_at: string
          doctor_id: string | null
          end_date: string
          id: string
          is_all_doctors: boolean | null
          reason: string | null
          start_date: string
        }
        Insert: {
          created_at?: string
          doctor_id?: string | null
          end_date: string
          id?: string
          is_all_doctors?: boolean | null
          reason?: string | null
          start_date: string
        }
        Update: {
          created_at?: string
          doctor_id?: string | null
          end_date?: string
          id?: string
          is_all_doctors?: boolean | null
          reason?: string | null
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "neoteam_schedule_blocks_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "neoteam_doctors"
            referencedColumns: ["id"]
          },
        ]
      }
      neoteam_settings: {
        Row: {
          created_at: string
          id: string
          setting_key: string
          setting_value: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          setting_key: string
          setting_value?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          setting_key?: string
          setting_value?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      neoteam_tasks: {
        Row: {
          assignee_id: string | null
          assignee_name: string | null
          branch: string | null
          category: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          due_time: string | null
          id: string
          order_index: number
          patient_id: string | null
          priority: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          assignee_name?: string | null
          branch?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          order_index?: number
          patient_id?: string | null
          priority?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          assignee_name?: string | null
          branch?: string | null
          category?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          due_time?: string | null
          id?: string
          order_index?: number
          patient_id?: string | null
          priority?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neoteam_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      neoteam_waiting_room: {
        Row: {
          appointment_id: string | null
          appointment_time: string | null
          arrival_time: string
          branch: string | null
          called_at: string | null
          created_at: string
          doctor_name: string | null
          id: string
          mood: string | null
          observations: string | null
          patient_id: string | null
          patient_name: string
          patient_phone: string | null
          priority: string
          room: string | null
          scheduled_time: string | null
          service_ended_at: string | null
          service_started_at: string | null
          status: string
          triage: string | null
          type: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          appointment_time?: string | null
          arrival_time?: string
          branch?: string | null
          called_at?: string | null
          created_at?: string
          doctor_name?: string | null
          id?: string
          mood?: string | null
          observations?: string | null
          patient_id?: string | null
          patient_name: string
          patient_phone?: string | null
          priority?: string
          room?: string | null
          scheduled_time?: string | null
          service_ended_at?: string | null
          service_started_at?: string | null
          status?: string
          triage?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          appointment_time?: string | null
          arrival_time?: string
          branch?: string | null
          called_at?: string | null
          created_at?: string
          doctor_name?: string | null
          id?: string
          mood?: string | null
          observations?: string | null
          patient_id?: string | null
          patient_name?: string
          patient_phone?: string | null
          priority?: string
          room?: string | null
          scheduled_time?: string | null
          service_ended_at?: string | null
          service_started_at?: string | null
          status?: string
          triage?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "neoteam_waiting_room_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "neoteam_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neoteam_waiting_room_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      neoteam_whatsapp_logs: {
        Row: {
          created_at: string
          error: string | null
          id: string
          message: string | null
          patient_name: string | null
          patient_phone: string | null
          success: boolean | null
          type: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          message?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          success?: boolean | null
          type: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          message?: string | null
          patient_name?: string | null
          patient_phone?: string | null
          success?: boolean | null
          type?: string
        }
        Relationships: []
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
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      patient_followup_tasks: {
        Row: {
          created_at: string | null
          id: string
          neoteam_task_id: string | null
          patient_id: string
          resolved_at: string | null
          resolved_by: string | null
          task_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          neoteam_task_id?: string | null
          patient_id: string
          resolved_at?: string | null
          resolved_by?: string | null
          task_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          neoteam_task_id?: string | null
          patient_id?: string
          resolved_at?: string | null
          resolved_by?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_followup_tasks_neoteam_task_id_fkey"
            columns: ["neoteam_task_id"]
            isOneToOne: false
            referencedRelation: "neoteam_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "patient_followup_tasks_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_notification_preferences: {
        Row: {
          created_at: string
          email_enabled: boolean
          id: string
          patient_id: string
          push_enabled: boolean
          reminder_hours_before: number | null
          updated_at: string
          whatsapp_enabled: boolean
        }
        Insert: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          patient_id: string
          push_enabled?: boolean
          reminder_hours_before?: number | null
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Update: {
          created_at?: string
          email_enabled?: boolean
          id?: string
          patient_id?: string
          push_enabled?: boolean
          reminder_hours_before?: number | null
          updated_at?: string
          whatsapp_enabled?: boolean
        }
        Relationships: []
      }
      patient_notifications: {
        Row: {
          channel: string
          created_at: string
          error_message: string | null
          id: string
          message: string
          metadata: Json | null
          patient_id: string
          read_at: string | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          title: string
          type: string
        }
        Insert: {
          channel: string
          created_at?: string
          error_message?: string | null
          id?: string
          message: string
          metadata?: Json | null
          patient_id: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title: string
          type: string
        }
        Update: {
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          patient_id?: string
          read_at?: string | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      patient_orientation_notifications: {
        Row: {
          channel: string
          id: string
          notification_type: string
          patient_id: string
          sent_at: string | null
          status: string | null
          task_id: string
        }
        Insert: {
          channel?: string
          id?: string
          notification_type: string
          patient_id: string
          sent_at?: string | null
          status?: string | null
          task_id: string
        }
        Update: {
          channel?: string
          id?: string
          notification_type?: string
          patient_id?: string
          sent_at?: string | null
          status?: string | null
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "patient_orientation_notifications_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      patient_orientation_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_overdue: boolean | null
          overdue_at: string | null
          patient_id: string
          task_day: number
          task_id: string
          task_type: string
          updated_at: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_overdue?: boolean | null
          overdue_at?: string | null
          patient_id: string
          task_day: number
          task_id: string
          task_type: string
          updated_at?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_overdue?: boolean | null
          overdue_at?: string | null
          patient_id?: string
          task_day?: number
          task_id?: string
          task_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patient_orientation_progress_patient_id_fkey"
            columns: ["patient_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      permission_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          key: string
          module: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          module: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          module?: string
          name?: string
        }
        Relationships: []
      }
      portal_appointments: {
        Row: {
          appointment_type: string
          cancellation_reason: string | null
          check_in_at: string | null
          check_out_at: string | null
          confirmed_at: string | null
          created_at: string | null
          created_by: string | null
          doctor_id: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          patient_id: string
          procedure_type: string | null
          reminder_sent_at: string | null
          room_id: string | null
          scheduled_at: string
          status: string | null
          unit_id: string | null
          updated_at: string | null
        }
        Insert: {
          appointment_type: string
          cancellation_reason?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id: string
          procedure_type?: string | null
          reminder_sent_at?: string | null
          room_id?: string | null
          scheduled_at: string
          status?: string | null
          unit_id?: string | null
          updated_at?: string | null
        }
        Update: {
          appointment_type?: string
          cancellation_reason?: string | null
          check_in_at?: string | null
          check_out_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          doctor_id?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          patient_id?: string
          procedure_type?: string | null
          reminder_sent_at?: string | null
          room_id?: string | null
          scheduled_at?: string
          status?: string | null
          unit_id?: string | null
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
      postvenda_anexos: {
        Row: {
          chamado_id: string
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          historico_id: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          chamado_id: string
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          historico_id?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          chamado_id?: string
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          historico_id?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postvenda_anexos_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "postvenda_chamados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postvenda_anexos_historico_id_fkey"
            columns: ["historico_id"]
            isOneToOne: false
            referencedRelation: "postvenda_chamado_historico"
            referencedColumns: ["id"]
          },
        ]
      }
      postvenda_chamado_historico: {
        Row: {
          acao: string
          chamado_id: string
          data_evento: string | null
          descricao: string | null
          etapa: Database["public"]["Enums"]["chamado_etapa"]
          evidencias: Json | null
          id: string
          metadata: Json | null
          usuario_id: string | null
          usuario_nome: string | null
        }
        Insert: {
          acao: string
          chamado_id: string
          data_evento?: string | null
          descricao?: string | null
          etapa: Database["public"]["Enums"]["chamado_etapa"]
          evidencias?: Json | null
          id?: string
          metadata?: Json | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Update: {
          acao?: string
          chamado_id?: string
          data_evento?: string | null
          descricao?: string | null
          etapa?: Database["public"]["Enums"]["chamado_etapa"]
          evidencias?: Json | null
          id?: string
          metadata?: Json | null
          usuario_id?: string | null
          usuario_nome?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postvenda_chamado_historico_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "postvenda_chamados"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postvenda_chamado_historico_usuario_id_fkey"
            columns: ["usuario_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      postvenda_chamados: {
        Row: {
          branch: string | null
          canal_origem: string | null
          created_at: string | null
          created_by: string | null
          etapa_atual: Database["public"]["Enums"]["chamado_etapa"]
          id: string
          motivo_abertura: string | null
          numero_chamado: number
          paciente_email: string | null
          paciente_id: string | null
          paciente_nome: string
          paciente_telefone: string | null
          prioridade: Database["public"]["Enums"]["chamado_prioridade"]
          procedimento_id: string | null
          resolucao: string | null
          responsavel_id: string | null
          responsavel_nome: string | null
          sla_estourado: boolean | null
          sla_id: string | null
          sla_prazo_fim: string | null
          status: Database["public"]["Enums"]["chamado_status"]
          tipo_demanda: string
          updated_at: string | null
        }
        Insert: {
          branch?: string | null
          canal_origem?: string | null
          created_at?: string | null
          created_by?: string | null
          etapa_atual?: Database["public"]["Enums"]["chamado_etapa"]
          id?: string
          motivo_abertura?: string | null
          numero_chamado?: number
          paciente_email?: string | null
          paciente_id?: string | null
          paciente_nome: string
          paciente_telefone?: string | null
          prioridade?: Database["public"]["Enums"]["chamado_prioridade"]
          procedimento_id?: string | null
          resolucao?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          sla_estourado?: boolean | null
          sla_id?: string | null
          sla_prazo_fim?: string | null
          status?: Database["public"]["Enums"]["chamado_status"]
          tipo_demanda: string
          updated_at?: string | null
        }
        Update: {
          branch?: string | null
          canal_origem?: string | null
          created_at?: string | null
          created_by?: string | null
          etapa_atual?: Database["public"]["Enums"]["chamado_etapa"]
          id?: string
          motivo_abertura?: string | null
          numero_chamado?: number
          paciente_email?: string | null
          paciente_id?: string | null
          paciente_nome?: string
          paciente_telefone?: string | null
          prioridade?: Database["public"]["Enums"]["chamado_prioridade"]
          procedimento_id?: string | null
          resolucao?: string | null
          responsavel_id?: string | null
          responsavel_nome?: string | null
          sla_estourado?: boolean | null
          sla_id?: string | null
          sla_prazo_fim?: string | null
          status?: Database["public"]["Enums"]["chamado_status"]
          tipo_demanda?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postvenda_chamados_paciente_id_fkey"
            columns: ["paciente_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postvenda_chamados_procedimento_id_fkey"
            columns: ["procedimento_id"]
            isOneToOne: false
            referencedRelation: "clinic_surgeries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postvenda_chamados_responsavel_id_fkey"
            columns: ["responsavel_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "postvenda_chamados_sla_id_fkey"
            columns: ["sla_id"]
            isOneToOne: false
            referencedRelation: "postvenda_sla_config"
            referencedColumns: ["id"]
          },
        ]
      }
      postvenda_nps: {
        Row: {
          canal_envio: string | null
          chamado_id: string
          comentario: string | null
          enviado_em: string | null
          id: string
          nota: number | null
          respondido_em: string | null
        }
        Insert: {
          canal_envio?: string | null
          chamado_id: string
          comentario?: string | null
          enviado_em?: string | null
          id?: string
          nota?: number | null
          respondido_em?: string | null
        }
        Update: {
          canal_envio?: string | null
          chamado_id?: string
          comentario?: string | null
          enviado_em?: string | null
          id?: string
          nota?: number | null
          respondido_em?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "postvenda_nps_chamado_id_fkey"
            columns: ["chamado_id"]
            isOneToOne: false
            referencedRelation: "postvenda_chamados"
            referencedColumns: ["id"]
          },
        ]
      }
      postvenda_sla_config: {
        Row: {
          alerta_previo_min: number
          created_at: string | null
          escalonamento_auto: boolean | null
          etapa: Database["public"]["Enums"]["chamado_etapa"]
          id: string
          prioridade: Database["public"]["Enums"]["chamado_prioridade"]
          tempo_limite_horas: number
          tipo_demanda: string
          updated_at: string | null
        }
        Insert: {
          alerta_previo_min?: number
          created_at?: string | null
          escalonamento_auto?: boolean | null
          etapa: Database["public"]["Enums"]["chamado_etapa"]
          id?: string
          prioridade?: Database["public"]["Enums"]["chamado_prioridade"]
          tempo_limite_horas?: number
          tipo_demanda: string
          updated_at?: string | null
        }
        Update: {
          alerta_previo_min?: number
          created_at?: string | null
          escalonamento_auto?: boolean | null
          etapa?: Database["public"]["Enums"]["chamado_etapa"]
          id?: string
          prioridade?: Database["public"]["Enums"]["chamado_prioridade"]
          tempo_limite_horas?: number
          tipo_demanda?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profile_definitions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_system: boolean | null
          key: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          key: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_system?: boolean | null
          key?: string
          name?: string
        }
        Relationships: []
      }
      profile_permission_mappings: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          profile_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profile_permission_mappings_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permission_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profile_permission_mappings_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_definitions"
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
      sala_tecnica_confirmations: {
        Row: {
          attendance_status: string | null
          confirmed_at: string
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          attendance_status?: string | null
          confirmed_at?: string
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          attendance_status?: string | null
          confirmed_at?: string
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sala_tecnica_confirmations_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "sala_tecnica_meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      sala_tecnica_meetings: {
        Row: {
          created_at: string
          description: string | null
          duration_minutes: number | null
          google_meet_link: string | null
          id: string
          is_cancelled: boolean | null
          meeting_date: string
          meeting_time: string
          mentor_names: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          google_meet_link?: string | null
          id?: string
          is_cancelled?: boolean | null
          meeting_date: string
          meeting_time?: string
          mentor_names?: string[] | null
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          google_meet_link?: string | null
          id?: string
          is_cancelled?: boolean | null
          meeting_date?: string
          meeting_time?: string
          mentor_names?: string[] | null
          title?: string
          updated_at?: string
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
      satisfaction_survey_responses: {
        Row: {
          ai_relation: string | null
          clarity_teachers: string | null
          class_id: string | null
          completed_at: string | null
          created_at: string
          current_block: number | null
          effective_time_seconds: number | null
          evolution_path_clarity: string | null
          expectations_met: string | null
          full_name: string | null
          future_vision_12m: string | null
          has_captation_plan: string | null
          id: string
          investment_comfort: string | null
          is_completed: boolean
          is_priority_lead: boolean | null
          knows_next_step: string | null
          lead_score: number | null
          lead_tags: string[] | null
          memorable_phrase: string | null
          partial_data: Json | null
          practice_format: string | null
          priority_score: number | null
          professional_moment: string | null
          satisfaction_score: number | null
          start_timeline: string | null
          started_at: string
          success_result: string | null
          survey_version: number
          time_vs_money: string | null
          updated_at: string
          user_id: string
          wants_individual_talk: string | null
          weekly_hours: string | null
          what_could_improve: string | null
          what_differentiates_best: string | null
          what_liked_most: string | null
          years_practicing: string | null
        }
        Insert: {
          ai_relation?: string | null
          clarity_teachers?: string | null
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_block?: number | null
          effective_time_seconds?: number | null
          evolution_path_clarity?: string | null
          expectations_met?: string | null
          full_name?: string | null
          future_vision_12m?: string | null
          has_captation_plan?: string | null
          id?: string
          investment_comfort?: string | null
          is_completed?: boolean
          is_priority_lead?: boolean | null
          knows_next_step?: string | null
          lead_score?: number | null
          lead_tags?: string[] | null
          memorable_phrase?: string | null
          partial_data?: Json | null
          practice_format?: string | null
          priority_score?: number | null
          professional_moment?: string | null
          satisfaction_score?: number | null
          start_timeline?: string | null
          started_at?: string
          success_result?: string | null
          survey_version?: number
          time_vs_money?: string | null
          updated_at?: string
          user_id: string
          wants_individual_talk?: string | null
          weekly_hours?: string | null
          what_could_improve?: string | null
          what_differentiates_best?: string | null
          what_liked_most?: string | null
          years_practicing?: string | null
        }
        Update: {
          ai_relation?: string | null
          clarity_teachers?: string | null
          class_id?: string | null
          completed_at?: string | null
          created_at?: string
          current_block?: number | null
          effective_time_seconds?: number | null
          evolution_path_clarity?: string | null
          expectations_met?: string | null
          full_name?: string | null
          future_vision_12m?: string | null
          has_captation_plan?: string | null
          id?: string
          investment_comfort?: string | null
          is_completed?: boolean
          is_priority_lead?: boolean | null
          knows_next_step?: string | null
          lead_score?: number | null
          lead_tags?: string[] | null
          memorable_phrase?: string | null
          partial_data?: Json | null
          practice_format?: string | null
          priority_score?: number | null
          professional_moment?: string | null
          satisfaction_score?: number | null
          start_timeline?: string | null
          started_at?: string
          success_result?: string | null
          survey_version?: number
          time_vs_money?: string | null
          updated_at?: string
          user_id?: string
          wants_individual_talk?: string | null
          weekly_hours?: string | null
          what_could_improve?: string | null
          what_differentiates_best?: string | null
          what_liked_most?: string | null
          years_practicing?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "satisfaction_survey_responses_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      sentinel_alert_recipients: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          receive_email: boolean | null
          receive_whatsapp: boolean | null
          severity_filter: string[] | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          receive_email?: boolean | null
          receive_whatsapp?: boolean | null
          severity_filter?: string[] | null
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          receive_email?: boolean | null
          receive_whatsapp?: boolean | null
          severity_filter?: string[] | null
        }
        Relationships: []
      }
      sentinel_whatsapp_config: {
        Row: {
          created_at: string
          created_by: string | null
          daily_summary_hour: number | null
          id: string
          is_connected: boolean | null
          last_test_at: string | null
          notify_daily_summary: boolean | null
          notify_high: boolean | null
          notify_low: boolean | null
          notify_medium: boolean | null
          phone_number: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          daily_summary_hour?: number | null
          id?: string
          is_connected?: boolean | null
          last_test_at?: string | null
          notify_daily_summary?: boolean | null
          notify_high?: boolean | null
          notify_low?: boolean | null
          notify_medium?: boolean | null
          phone_number: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          daily_summary_hour?: number | null
          id?: string
          is_connected?: boolean | null
          last_test_at?: string | null
          notify_daily_summary?: boolean | null
          notify_high?: boolean | null
          notify_low?: boolean | null
          notify_medium?: boolean | null
          phone_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      shared_dashboard_links: {
        Row: {
          created_at: string | null
          created_by: string
          dashboard_config: Json | null
          dashboard_type: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          last_viewed_at: string | null
          password_hash: string | null
          title: string | null
          token: string
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          created_by: string
          dashboard_config?: Json | null
          dashboard_type: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          password_hash?: string | null
          title?: string | null
          token?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          created_by?: string
          dashboard_config?: Json | null
          dashboard_type?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          last_viewed_at?: string | null
          password_hash?: string | null
          title?: string | null
          token?: string
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          additional_branches: string[] | null
          branch: string
          created_at: string | null
          email: string
          id: string
          is_active: boolean | null
          name: string
          role: Database["public"]["Enums"]["clinic_staff_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          additional_branches?: string[] | null
          branch: string
          created_at?: string | null
          email: string
          id?: string
          is_active?: boolean | null
          name: string
          role?: Database["public"]["Enums"]["clinic_staff_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          additional_branches?: string[] | null
          branch?: string
          created_at?: string | null
          email?: string
          id?: string
          is_active?: boolean | null
          name?: string
          role?: Database["public"]["Enums"]["clinic_staff_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      staff_role_permissions: {
        Row: {
          can_delete: boolean | null
          can_read: boolean | null
          can_write: boolean | null
          created_at: string | null
          id: string
          module_code: string
          role_id: string
        }
        Insert: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          id?: string
          module_code: string
          role_id: string
        }
        Update: {
          can_delete?: boolean | null
          can_read?: boolean | null
          can_write?: boolean | null
          created_at?: string | null
          id?: string
          module_code?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_roles: {
        Row: {
          code: string
          color: string | null
          created_at: string | null
          default_route: string | null
          department: Database["public"]["Enums"]["staff_department"]
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          code: string
          color?: string | null
          created_at?: string | null
          default_route?: string | null
          department: Database["public"]["Enums"]["staff_department"]
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          code?: string
          color?: string | null
          created_at?: string | null
          default_route?: string | null
          department?: Database["public"]["Enums"]["staff_department"]
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      staff_system_access: {
        Row: {
          access_beeviral: string | null
          access_bling: string | null
          access_bubble: string | null
          access_canva: string | null
          access_capcut: string | null
          access_chip_corp: string | null
          access_clicksign: string | null
          access_clickup: string | null
          access_cloudflare: string | null
          access_conecta_capilar: string | null
          access_conta_azul: string | null
          access_feegow: string | null
          access_fireflies: string | null
          access_gmail_corp: string | null
          access_gmail_domain: string | null
          access_godaddy: string | null
          access_google_drive: string | null
          access_instagram_hygor: string | null
          access_instagram_ibramec: string | null
          access_instagram_neofolic: string | null
          access_instagram_patrick: string | null
          access_kommo: string | null
          access_linkedin_ibramec: string | null
          access_linkedin_neofolic: string | null
          access_mailchimp: string | null
          access_make: string | null
          access_manychat: string | null
          access_notion: string | null
          access_nuvem_hospedagem: string | null
          access_panda_video: string | null
          access_pluga: string | null
          access_pluxee: string | null
          access_reclame_aqui: string | null
          access_registro_br: string | null
          access_reportei: string | null
          access_saude_service: string | null
          access_shosp: string | null
          access_stripe: string | null
          access_tiktok_ibramec: string | null
          access_tiktok_neofolic: string | null
          access_twilio: string | null
          access_vivo_empresa: string | null
          access_whatsapp_groups: string | null
          access_wordpress_ibramec: string | null
          access_wordpress_neofolic: string | null
          access_zapier: string | null
          address_cep: string | null
          address_city: string | null
          address_neighborhood: string | null
          address_street: string | null
          birth_date: string | null
          city: string | null
          cnpj: string | null
          company_name: string | null
          contract_days: number | null
          contract_end: string | null
          contract_start: string | null
          contract_type: string | null
          corporate_email_domain: string | null
          corporate_email_gmail: string | null
          corporate_phone: string | null
          council_document: string | null
          cpf_hash: string | null
          created_at: string
          department: string | null
          has_contract: boolean | null
          has_health_plan: boolean | null
          health_plan_deadline: string | null
          id: string
          job_title: string | null
          neohub_user_id: string
          personal_email: string | null
          personal_phone: string | null
          updated_at: string
        }
        Insert: {
          access_beeviral?: string | null
          access_bling?: string | null
          access_bubble?: string | null
          access_canva?: string | null
          access_capcut?: string | null
          access_chip_corp?: string | null
          access_clicksign?: string | null
          access_clickup?: string | null
          access_cloudflare?: string | null
          access_conecta_capilar?: string | null
          access_conta_azul?: string | null
          access_feegow?: string | null
          access_fireflies?: string | null
          access_gmail_corp?: string | null
          access_gmail_domain?: string | null
          access_godaddy?: string | null
          access_google_drive?: string | null
          access_instagram_hygor?: string | null
          access_instagram_ibramec?: string | null
          access_instagram_neofolic?: string | null
          access_instagram_patrick?: string | null
          access_kommo?: string | null
          access_linkedin_ibramec?: string | null
          access_linkedin_neofolic?: string | null
          access_mailchimp?: string | null
          access_make?: string | null
          access_manychat?: string | null
          access_notion?: string | null
          access_nuvem_hospedagem?: string | null
          access_panda_video?: string | null
          access_pluga?: string | null
          access_pluxee?: string | null
          access_reclame_aqui?: string | null
          access_registro_br?: string | null
          access_reportei?: string | null
          access_saude_service?: string | null
          access_shosp?: string | null
          access_stripe?: string | null
          access_tiktok_ibramec?: string | null
          access_tiktok_neofolic?: string | null
          access_twilio?: string | null
          access_vivo_empresa?: string | null
          access_whatsapp_groups?: string | null
          access_wordpress_ibramec?: string | null
          access_wordpress_neofolic?: string | null
          access_zapier?: string | null
          address_cep?: string | null
          address_city?: string | null
          address_neighborhood?: string | null
          address_street?: string | null
          birth_date?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          contract_days?: number | null
          contract_end?: string | null
          contract_start?: string | null
          contract_type?: string | null
          corporate_email_domain?: string | null
          corporate_email_gmail?: string | null
          corporate_phone?: string | null
          council_document?: string | null
          cpf_hash?: string | null
          created_at?: string
          department?: string | null
          has_contract?: boolean | null
          has_health_plan?: boolean | null
          health_plan_deadline?: string | null
          id?: string
          job_title?: string | null
          neohub_user_id: string
          personal_email?: string | null
          personal_phone?: string | null
          updated_at?: string
        }
        Update: {
          access_beeviral?: string | null
          access_bling?: string | null
          access_bubble?: string | null
          access_canva?: string | null
          access_capcut?: string | null
          access_chip_corp?: string | null
          access_clicksign?: string | null
          access_clickup?: string | null
          access_cloudflare?: string | null
          access_conecta_capilar?: string | null
          access_conta_azul?: string | null
          access_feegow?: string | null
          access_fireflies?: string | null
          access_gmail_corp?: string | null
          access_gmail_domain?: string | null
          access_godaddy?: string | null
          access_google_drive?: string | null
          access_instagram_hygor?: string | null
          access_instagram_ibramec?: string | null
          access_instagram_neofolic?: string | null
          access_instagram_patrick?: string | null
          access_kommo?: string | null
          access_linkedin_ibramec?: string | null
          access_linkedin_neofolic?: string | null
          access_mailchimp?: string | null
          access_make?: string | null
          access_manychat?: string | null
          access_notion?: string | null
          access_nuvem_hospedagem?: string | null
          access_panda_video?: string | null
          access_pluga?: string | null
          access_pluxee?: string | null
          access_reclame_aqui?: string | null
          access_registro_br?: string | null
          access_reportei?: string | null
          access_saude_service?: string | null
          access_shosp?: string | null
          access_stripe?: string | null
          access_tiktok_ibramec?: string | null
          access_tiktok_neofolic?: string | null
          access_twilio?: string | null
          access_vivo_empresa?: string | null
          access_whatsapp_groups?: string | null
          access_wordpress_ibramec?: string | null
          access_wordpress_neofolic?: string | null
          access_zapier?: string | null
          address_cep?: string | null
          address_city?: string | null
          address_neighborhood?: string | null
          address_street?: string | null
          birth_date?: string | null
          city?: string | null
          cnpj?: string | null
          company_name?: string | null
          contract_days?: number | null
          contract_end?: string | null
          contract_start?: string | null
          contract_type?: string | null
          corporate_email_domain?: string | null
          corporate_email_gmail?: string | null
          corporate_phone?: string | null
          council_document?: string | null
          cpf_hash?: string | null
          created_at?: string
          department?: string | null
          has_contract?: boolean | null
          has_health_plan?: boolean | null
          health_plan_deadline?: string | null
          id?: string
          job_title?: string | null
          neohub_user_id?: string
          personal_email?: string | null
          personal_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_system_access_neohub_user_id_fkey"
            columns: ["neohub_user_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      staff_user_roles: {
        Row: {
          branch_id: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          neohub_user_id: string
          role_id: string
        }
        Insert: {
          branch_id?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          neohub_user_id: string
          role_id: string
        }
        Update: {
          branch_id?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          neohub_user_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_user_roles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "neoteam_branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_user_roles_neohub_user_id_fkey"
            columns: ["neohub_user_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "staff_user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "staff_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_referrals: {
        Row: {
          commission_paid: boolean | null
          commission_rate: number | null
          contract_value: number | null
          converted_at: string | null
          created_at: string
          id: string
          notes: string | null
          pix_request_status: string | null
          pix_requested_at: string | null
          referral_code: string
          referred_crm: string | null
          referred_email: string
          referred_has_crm: boolean | null
          referred_name: string
          referred_phone: string
          referrer_user_id: string
          status: string
          updated_at: string
        }
        Insert: {
          commission_paid?: boolean | null
          commission_rate?: number | null
          contract_value?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pix_request_status?: string | null
          pix_requested_at?: string | null
          referral_code: string
          referred_crm?: string | null
          referred_email: string
          referred_has_crm?: boolean | null
          referred_name: string
          referred_phone: string
          referrer_user_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          commission_paid?: boolean | null
          commission_rate?: number | null
          contract_value?: number | null
          converted_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          pix_request_status?: string | null
          pix_requested_at?: string | null
          referral_code?: string
          referred_crm?: string | null
          referred_email?: string
          referred_has_crm?: boolean | null
          referred_name?: string
          referred_phone?: string
          referrer_user_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
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
      survey_ai_insights: {
        Row: {
          class_id: string
          created_at: string
          generated_at: string
          generated_by: string | null
          id: string
          insights: Json
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          insights: Json
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          insights?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_ai_insights_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_answers: {
        Row: {
          answer_choices: Json | null
          answer_rating: number | null
          answer_text: string | null
          answered_at: string | null
          id: string
          question_id: string
          submission_id: string
        }
        Insert: {
          answer_choices?: Json | null
          answer_rating?: number | null
          answer_text?: string | null
          answered_at?: string | null
          id?: string
          question_id: string
          submission_id: string
        }
        Update: {
          answer_choices?: Json | null
          answer_rating?: number | null
          answer_text?: string | null
          answered_at?: string | null
          id?: string
          question_id?: string
          submission_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "survey_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_answers_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "survey_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          is_required: boolean | null
          options: Json | null
          order_index: number | null
          question_text: string
          question_type: string | null
          scale_labels: Json | null
          scale_max: number | null
          scale_min: number | null
          survey_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          order_index?: number | null
          question_text: string
          question_type?: string | null
          scale_labels?: Json | null
          scale_max?: number | null
          scale_min?: number | null
          survey_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          is_required?: boolean | null
          options?: Json | null
          order_index?: number | null
          question_text?: string
          question_type?: string | null
          scale_labels?: Json | null
          scale_max?: number | null
          scale_min?: number | null
          survey_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_questions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      survey_questions_config: {
        Row: {
          category: string
          created_at: string
          id: string
          is_required: boolean
          is_visible: boolean
          options: Json | null
          order_index: number
          question_key: string
          question_label: string
          question_type: string
          target_person: string | null
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          options?: Json | null
          order_index?: number
          question_key: string
          question_label: string
          question_type?: string
          target_person?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_required?: boolean
          is_visible?: boolean
          options?: Json | null
          order_index?: number
          question_key?: string
          question_label?: string
          question_type?: string
          target_person?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      survey_submissions: {
        Row: {
          class_id: string | null
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          started_at: string | null
          survey_id: string
          time_spent_seconds: number | null
          user_id: string
        }
        Insert: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          started_at?: string | null
          survey_id: string
          time_spent_seconds?: number | null
          user_id: string
        }
        Update: {
          class_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          started_at?: string | null
          survey_id?: string
          time_spent_seconds?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "survey_submissions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "survey_submissions_survey_id_fkey"
            columns: ["survey_id"]
            isOneToOne: false
            referencedRelation: "surveys"
            referencedColumns: ["id"]
          },
        ]
      }
      surveys: {
        Row: {
          available_from: string | null
          available_until: string | null
          class_id: string | null
          course_id: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_required: boolean | null
          show_results_to_students: boolean | null
          survey_type: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          class_id?: string | null
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          show_results_to_students?: boolean | null
          survey_type?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          class_id?: string | null
          course_id?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          show_results_to_students?: boolean | null
          survey_type?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "surveys_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "surveys_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      system_alerts: {
        Row: {
          created_at: string
          details: Json | null
          id: string
          message: string
          notified_via: string[] | null
          resolved: boolean | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          system_id: string
          type: string
        }
        Insert: {
          created_at?: string
          details?: Json | null
          id?: string
          message: string
          notified_via?: string[] | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          system_id: string
          type: string
        }
        Update: {
          created_at?: string
          details?: Json | null
          id?: string
          message?: string
          notified_via?: string[] | null
          resolved?: boolean | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          system_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_alerts_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "monitored_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_event_logs: {
        Row: {
          created_at: string
          event_category: string
          event_name: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          module: string | null
          page_path: string | null
          session_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string
          event_category: string
          event_name: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module?: string | null
          page_path?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string
          event_category?: string
          event_name?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          module?: string | null
          page_path?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      system_health_checks: {
        Row: {
          checked_at: string
          error_message: string | null
          id: string
          response_time_ms: number | null
          status: string
          status_code: number | null
          system_id: string
        }
        Insert: {
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status: string
          status_code?: number | null
          system_id: string
        }
        Update: {
          checked_at?: string
          error_message?: string | null
          id?: string
          response_time_ms?: number | null
          status?: string
          status_code?: number | null
          system_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "system_health_checks_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "monitored_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      system_metrics_daily: {
        Row: {
          avg_response_time_ms: number | null
          created_at: string
          date: string
          failed_checks: number | null
          id: string
          max_response_time_ms: number | null
          min_response_time_ms: number | null
          successful_checks: number | null
          system_id: string
          total_checks: number | null
          uptime_percentage: number | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          created_at?: string
          date: string
          failed_checks?: number | null
          id?: string
          max_response_time_ms?: number | null
          min_response_time_ms?: number | null
          successful_checks?: number | null
          system_id: string
          total_checks?: number | null
          uptime_percentage?: number | null
        }
        Update: {
          avg_response_time_ms?: number | null
          created_at?: string
          date?: string
          failed_checks?: number | null
          id?: string
          max_response_time_ms?: number | null
          min_response_time_ms?: number | null
          successful_checks?: number | null
          system_id?: string
          total_checks?: number | null
          uptime_percentage?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "system_metrics_daily_system_id_fkey"
            columns: ["system_id"]
            isOneToOne: false
            referencedRelation: "monitored_systems"
            referencedColumns: ["id"]
          },
        ]
      }
      tenant_module_activations: {
        Row: {
          activated_at: string | null
          id: string
          is_active: boolean | null
          module_id: string
          tenant_id: string
        }
        Insert: {
          activated_at?: string | null
          id?: string
          is_active?: boolean | null
          module_id: string
          tenant_id: string
        }
        Update: {
          activated_at?: string | null
          id?: string
          is_active?: boolean | null
          module_id?: string
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenant_module_activations_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "module_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenant_module_activations_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          settings: Json | null
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string | null
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
      user_permission_overrides: {
        Row: {
          clinic_id: string | null
          created_at: string | null
          id: string
          is_granted: boolean | null
          permission_id: string
          tenant_id: string | null
          unit_id: string | null
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          is_granted?: boolean | null
          permission_id: string
          tenant_id?: string | null
          unit_id?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          created_at?: string | null
          id?: string
          is_granted?: boolean | null
          permission_id?: string
          tenant_id?: string | null
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_permission_overrides_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permission_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_permission_overrides_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profile_assignments: {
        Row: {
          clinic_id: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_active: boolean | null
          profile_id: string
          tenant_id: string | null
          unit_id: string | null
          user_id: string
        }
        Insert: {
          clinic_id?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          profile_id: string
          tenant_id?: string | null
          unit_id?: string | null
          user_id: string
        }
        Update: {
          clinic_id?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_active?: boolean | null
          profile_id?: string
          tenant_id?: string | null
          unit_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profile_assignments_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profile_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profile_assignments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profile_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "neohub_users"
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
      videos: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          duration_seconds: number | null
          external_url: string | null
          file_url: string | null
          id: string
          is_active: boolean
          is_public: boolean
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_seconds?: number | null
          external_url?: string | null
          file_url?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
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
      exam_questions_student: {
        Row: {
          created_at: string | null
          exam_id: string | null
          id: string | null
          options: Json | null
          order_index: number | null
          points: number | null
          question_text: string | null
          question_type: string | null
        }
        Insert: {
          created_at?: string | null
          exam_id?: string | null
          id?: string | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text?: string | null
          question_type?: string | null
        }
        Update: {
          created_at?: string | null
          exam_id?: string | null
          id?: string | null
          options?: Json | null
          order_index?: number | null
          points?: number | null
          question_text?: string | null
          question_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_photo_stats: {
        Row: {
          caption: string | null
          created_at: string | null
          download_count: number | null
          full_url: string | null
          gallery_id: string | null
          photo_id: string | null
          view_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_gallery_photos_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "course_galleries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_gallery_photos_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "gallery_stats"
            referencedColumns: ["gallery_id"]
          },
        ]
      }
      gallery_stats: {
        Row: {
          class_id: string | null
          gallery_id: string | null
          photo_count: number | null
          title: string | null
          total_downloads: number | null
          total_views: number | null
          unique_viewers: number | null
        }
        Relationships: [
          {
            foreignKeyName: "course_galleries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "course_classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      can_access_branch: {
        Args: { _branch: string; _user_id: string }
        Returns: boolean
      }
      can_access_module: {
        Args: { _module_code: string; _user_id: string }
        Returns: boolean
      }
      can_access_module_with_action: {
        Args: { _action?: string; _module_code: string; _user_id: string }
        Returns: boolean
      }
      get_all_enrolled_user_ids: { Args: never; Returns: string[] }
      get_exam_results_with_answers: {
        Args: { p_attempt_id: string }
        Returns: {
          correct_answer: string
          explanation: string
          is_correct: boolean
          points_earned: number
          question_id: string
          question_text: string
          selected_answer: string
        }[]
      }
      get_neohub_user_id: { Args: { _auth_user_id: string }; Returns: string }
      get_neohub_user_profiles: {
        Args: { _user_id: string }
        Returns: {
          profile: Database["public"]["Enums"]["neohub_profile"]
        }[]
      }
      get_portal_user_id: { Args: { _auth_user_id: string }; Returns: string }
      get_staff_profile: {
        Args: { _user_id: string }
        Returns: {
          additional_branches: string[]
          branch: string
          role: Database["public"]["Enums"]["clinic_staff_role"]
        }[]
      }
      get_user_context: { Args: never; Returns: Json }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_staff_roles: {
        Args: { p_user_id: string }
        Returns: {
          branch_id: string
          branch_name: string
          color: string
          default_route: string
          department: Database["public"]["Enums"]["staff_department"]
          icon: string
          role_code: string
          role_name: string
        }[]
      }
      has_completed_satisfaction_survey: {
        Args: { _class_id?: string; _user_id: string }
        Returns: boolean
      }
      has_neohub_profile: {
        Args: {
          _profile: Database["public"]["Enums"]["neohub_profile"]
          _user_id: string
        }
        Returns: boolean
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
      has_staff_role: {
        Args: {
          _role: Database["public"]["Enums"]["clinic_staff_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_banner_click: {
        Args: { banner_uuid: string }
        Returns: undefined
      }
      increment_dashboard_view: {
        Args: { p_token: string }
        Returns: undefined
      }
      is_feature_enabled: {
        Args: { _environment?: string; _feature_key: string }
        Returns: boolean
      }
      is_module_blocked_on_mobile: {
        Args: { _module_code: string }
        Returns: boolean
      }
      is_neohub_admin: { Args: { _user_id: string }; Returns: boolean }
      is_staff_admin_or_gestao: { Args: { _user_id: string }; Returns: boolean }
      user_has_any_enrollment: { Args: { _user_id: string }; Returns: boolean }
      user_has_permission: {
        Args: { _permission_key: string }
        Returns: boolean
      }
      user_has_profile: { Args: { _profile_key: string }; Returns: boolean }
      validate_exam_answer: {
        Args: {
          p_attempt_id: string
          p_question_id: string
          p_selected_answer: string
        }
        Returns: {
          is_correct: boolean
          points_earned: number
          points_total: number
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "licensee" | "colaborador" | "aluno" | "paciente"
      chamado_etapa:
        | "triagem"
        | "atendimento"
        | "resolucao"
        | "validacao_paciente"
        | "nps"
        | "encerrado"
      chamado_prioridade: "baixa" | "normal" | "alta" | "urgente"
      chamado_status:
        | "aberto"
        | "em_andamento"
        | "aguardando_paciente"
        | "resolvido"
        | "fechado"
        | "reaberto"
        | "cancelado"
      clinic_staff_role:
        | "admin"
        | "gestao"
        | "comercial"
        | "operacao"
        | "recepcao"
      contract_status: "ativo" | "pendente" | "quitado" | "cancelado"
      contract_status_type:
        | "draft"
        | "pending_review"
        | "pending_approval"
        | "pending_signature"
        | "signed"
        | "active"
        | "expired"
        | "cancelled"
        | "terminated"
      customer_journey_stage:
        | "prospect"
        | "onboarding"
        | "retention"
        | "expansion"
        | "advocacy"
      legal_case_status:
        | "active"
        | "pending"
        | "closed"
        | "archived"
        | "suspended"
      legal_request_type:
        | "contract"
        | "opinion"
        | "question"
        | "follow_up"
        | "complaint"
        | "consultation"
      neohub_profile:
        | "paciente"
        | "colaborador"
        | "aluno"
        | "licenciado"
        | "administrador"
        | "cliente_avivar"
        | "medico"
        | "ipromed"
      portal_role:
        | "patient"
        | "doctor"
        | "admin"
        | "financial"
        | "reception"
        | "inventory"
      risk_level: "low" | "medium" | "high" | "critical"
      schedule_status:
        | "sem_data"
        | "agendado"
        | "confirmado"
        | "realizado"
        | "cancelado"
      staff_department:
        | "clinico"
        | "operacoes"
        | "comercial"
        | "sucesso_paciente"
        | "marketing"
        | "financeiro"
        | "ti_dados"
        | "gestao"
        | "executivo"
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
      app_role: ["admin", "licensee", "colaborador", "aluno", "paciente"],
      chamado_etapa: [
        "triagem",
        "atendimento",
        "resolucao",
        "validacao_paciente",
        "nps",
        "encerrado",
      ],
      chamado_prioridade: ["baixa", "normal", "alta", "urgente"],
      chamado_status: [
        "aberto",
        "em_andamento",
        "aguardando_paciente",
        "resolvido",
        "fechado",
        "reaberto",
        "cancelado",
      ],
      clinic_staff_role: [
        "admin",
        "gestao",
        "comercial",
        "operacao",
        "recepcao",
      ],
      contract_status: ["ativo", "pendente", "quitado", "cancelado"],
      contract_status_type: [
        "draft",
        "pending_review",
        "pending_approval",
        "pending_signature",
        "signed",
        "active",
        "expired",
        "cancelled",
        "terminated",
      ],
      customer_journey_stage: [
        "prospect",
        "onboarding",
        "retention",
        "expansion",
        "advocacy",
      ],
      legal_case_status: [
        "active",
        "pending",
        "closed",
        "archived",
        "suspended",
      ],
      legal_request_type: [
        "contract",
        "opinion",
        "question",
        "follow_up",
        "complaint",
        "consultation",
      ],
      neohub_profile: [
        "paciente",
        "colaborador",
        "aluno",
        "licenciado",
        "administrador",
        "cliente_avivar",
        "medico",
        "ipromed",
      ],
      portal_role: [
        "patient",
        "doctor",
        "admin",
        "financial",
        "reception",
        "inventory",
      ],
      risk_level: ["low", "medium", "high", "critical"],
      schedule_status: [
        "sem_data",
        "agendado",
        "confirmado",
        "realizado",
        "cancelado",
      ],
      staff_department: [
        "clinico",
        "operacoes",
        "comercial",
        "sucesso_paciente",
        "marketing",
        "financeiro",
        "ti_dados",
        "gestao",
        "executivo",
      ],
    },
  },
} as const
