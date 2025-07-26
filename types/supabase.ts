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
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          subscription_plan: string
          token_balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          subscription_plan?: string
          token_balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          subscription_plan?: string
          token_balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      contacts: {
        Row: {
          id: string
          user_id: string
          first_name: string
          last_name: string
          email: string
          phone: string | null
          telegram_chat_id: string | null
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
          telegram_chat_id?: string | null
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
          telegram_chat_id?: string | null
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
          category: string | null
          created_at: string
          updated_at: string
          status: string
          email_template: string | null
          email_subject: string | null
          telegram_template: string | null
          send_email: boolean
          send_telegram: boolean
          scheduled_send_time: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          event_date: string
          location?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
          status?: string
          email_template?: string | null
          email_subject?: string | null
          telegram_template?: string | null
          send_email?: boolean
          send_telegram?: boolean
          scheduled_send_time?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          event_date?: string
          location?: string | null
          category?: string | null
          created_at?: string
          updated_at?: string
          status?: string
          email_template?: string | null
          email_subject?: string | null
          telegram_template?: string | null
          send_email?: boolean
          send_telegram?: boolean
          scheduled_send_time?: string | null
        }
      }
      email_logs: {
        Row: {
          id: string
          event_id: string
          contact_id: string
          status: string
          error_message: string | null
          sent_at: string
          opened_at: string | null
        }
        Insert: {
          id?: string
          event_id: string
          contact_id: string
          status: string
          error_message?: string | null
          sent_at?: string
          opened_at?: string | null
        }
        Update: {
          id?: string
          event_id?: string
          contact_id?: string
          status?: string
          error_message?: string | null
          sent_at?: string
          opened_at?: string | null
        }
      }
      telegram_logs: {
        Row: {
          id: string
          event_id: string
          contact_id: string
          status: string
          error_message: string | null
          sent_at: string
        }
        Insert: {
          id?: string
          event_id: string
          contact_id: string
          status: string
          error_message?: string | null
          sent_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          contact_id?: string
          status?: string
          error_message?: string | null
          sent_at?: string
        }
      }
      event_contacts: {
        Row: {
          id: string
          event_id: string
          contact_id: string
          status: string
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          contact_id: string
          status?: string
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          contact_id?: string
          status?: string
          sent_at?: string | null
          created_at?: string
        }
      }
      user_balances: {
        Row: {
          id: string
          user_id: string
          balance: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          balance?: number
          created_at?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          type: string
          amount: number
          description: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          amount: number
          description?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          amount?: number
          description?: string | null
          status?: string
          created_at?: string
        }
      }
      onboarding_links: {
        Row: {
          id: string
          user_id: string
          token: string
          title: string | null
          description: string | null
          expires_at: string | null
          max_uses: number
          current_uses: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          title?: string | null
          description?: string | null
          expires_at?: string | null
          max_uses?: number
          current_uses?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          title?: string | null
          description?: string | null
          expires_at?: string | null
          max_uses?: number
          current_uses?: number
          created_at?: string
          updated_at?: string
        }
      }
      user_subscriptions: {
        Row: {
          id: string
          user_id: string
          tier: string
          status: string
          current_period_start: string | null
          current_period_end: string | null
          total_tokens_purchased: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tier: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          total_tokens_purchased?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tier?: string
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          total_tokens_purchased?: number
          created_at?: string
          updated_at?: string
        }
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_email: string
          status: string
          tokens_awarded: number
          created_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_email: string
          status?: string
          tokens_awarded?: number
          created_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          referrer_id?: string
          referred_email?: string
          status?: string
          tokens_awarded?: number
          created_at?: string
          completed_at?: string | null
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
