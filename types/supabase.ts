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
          discord_webhook_url: string | null
          slack_webhook_url: string | null
          slack_channel: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          subscription_plan?: string
          token_balance?: number
          discord_webhook_url?: string | null
          slack_webhook_url?: string | null
          slack_channel?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          subscription_plan?: string
          token_balance?: number
          discord_webhook_url?: string | null
          slack_webhook_url?: string | null
          slack_channel?: string | null
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
      contact_category_assignments: {
        Row: {
          id: string
          contact_id: string
          category_id: string
          created_at: string
        }
        Insert: {
          id?: string
          contact_id: string
          category_id: string
          created_at?: string
        }
        Update: {
          id?: string
          contact_id?: string
          category_id?: string
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
          discord_template: string | null
          slack_template: string | null
          send_email: boolean
          send_telegram: boolean
          send_discord: boolean
          send_slack: boolean
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
          discord_template?: string | null
          slack_template?: string | null
          send_email?: boolean
          send_telegram?: boolean
          send_discord?: boolean
          send_slack?: boolean
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
          discord_template?: string | null
          send_email?: boolean
          send_telegram?: boolean
          send_discord?: boolean
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
      discord_logs: {
        Row: {
          id: string
          user_id: string
          webhook_url: string
          message_content: string
          status: string
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          webhook_url: string
          message_content: string
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          webhook_url?: string
          message_content?: string
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      slack_logs: {
        Row: {
          id: string
          user_id: string
          webhook_url: string
          channel: string | null
          message_content: string
          status: string
          error_message: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          webhook_url: string
          channel?: string | null
          message_content: string
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          webhook_url?: string
          channel?: string | null
          message_content?: string
          status?: string
          error_message?: string | null
          created_at?: string
          updated_at?: string
        }
              }
        emergency_contacts: {
          Row: {
            id: string
            user_id: string
            contact_id: string
            is_active: boolean
            priority: number
            created_at: string
            updated_at: string
          }
          Insert: {
            id?: string
            user_id: string
            contact_id: string
            is_active?: boolean
            priority?: number
            created_at?: string
            updated_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            contact_id?: string
            is_active?: boolean
            priority?: number
            created_at?: string
            updated_at?: string
          }
        }
        sos_alerts: {
          Row: {
            id: string
            user_id: string
            status: string
            location_lat: number | null
            location_lng: number | null
            location_address: string | null
            triggered_at: string
            resolved_at: string | null
            notes: string | null
            created_at: string
          }
          Insert: {
            id?: string
            user_id: string
            status?: string
            location_lat?: number | null
            location_lng?: number | null
            location_address?: string | null
            triggered_at?: string
            resolved_at?: string | null
            notes?: string | null
            created_at?: string
          }
          Update: {
            id?: string
            user_id?: string
            status?: string
            location_lat?: number | null
            location_lng?: number | null
            location_address?: string | null
            triggered_at?: string
            resolved_at?: string | null
            notes?: string | null
            created_at?: string
          }
        }
        sos_alert_notifications: {
          Row: {
            id: string
            sos_alert_id: string
            emergency_contact_id: string
            notification_type: string
            status: string
            sent_at: string | null
            delivered_at: string | null
            error_message: string | null
            created_at: string
          }
          Insert: {
            id?: string
            sos_alert_id: string
            emergency_contact_id: string
            notification_type: string
            status?: string
            sent_at?: string | null
            delivered_at?: string | null
            error_message?: string | null
            created_at?: string
          }
          Update: {
            id?: string
            sos_alert_id?: string
            emergency_contact_id?: string
            notification_type?: string
            status?: string
            sent_at?: string | null
            delivered_at?: string | null
            error_message?: string | null
            created_at?: string
          }
        }
        notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          data: Json | null
          is_read: boolean
          priority: string
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          data?: Json | null
          is_read?: boolean
          priority?: string
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          data?: Json | null
          is_read?: boolean
          priority?: string
          created_at?: string
          read_at?: string | null
        }
      }
      push_subscriptions: {
        Row: {
          id: string
          user_id: string
          endpoint: string
          p256dh_key: string
          auth_key: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          user_id: string
          endpoint: string
          p256dh_key: string
          auth_key: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          endpoint?: string
          p256dh_key?: string
          auth_key?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
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
