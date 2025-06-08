export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      contacts: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          category: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone?: string | null
          category?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          first_name?: string
          last_name?: string
          email?: string
          phone?: string | null
          category?: string
          notes?: string | null
          created_at?: string
        }
      }
      events: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          event_date: string
          location: string | null
          created_at: string
          updated_at: string
          status: string
          email_template: string | null
          email_subject: string | null
          scheduled_send_time: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          event_date: string
          location?: string | null
          created_at?: string
          updated_at?: string
          status?: string
          email_template?: string | null
          email_subject?: string | null
          scheduled_send_time?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          event_date?: string
          location?: string | null
          created_at?: string
          updated_at?: string
          status?: string
          email_template?: string | null
          email_subject?: string | null
          scheduled_send_time?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
