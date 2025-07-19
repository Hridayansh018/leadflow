import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Please define the Supabase environment variables in your .env.local file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Supabase client configuration only. (MongoDB code removed)

// If there are any MongoDB helpers, remove them.

// Type definitions for Supabase - Simplified Schema
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: string;
          company_name: string | null;
          phone: string | null;
          timezone: string;
          email_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role?: string;
          company_name?: string | null;
          phone?: string | null;
          timezone?: string;
          email_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: string;
          company_name?: string | null;
          phone?: string | null;
          timezone?: string;
          email_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      leads: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          interest: string | null; // yes/no
          leadstatus: string; // pending, converted, dropped
          status: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone: string;
          interest?: string | null;
          leadstatus?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string;
          phone?: string;
          interest?: string | null;
          leadstatus?: string;
          status?: string;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaigns: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          status: string;
          leads: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          status?: string;
          leads?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          status?: string;
          leads?: string[];
          created_at?: string;
          updated_at?: string;
        };
      };
      call_history: {
        Row: {
          id: string;
          user_id: string;
          customer_name: string;
          customer_phone: string;
          call_status: string; // answered, unanswered, rejected, requested callback
          duration: number | null;
          notes: string | null;
          interest: string | null; // yes/no
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_name: string;
          customer_phone: string;
          call_status: string;
          duration?: number | null;
          notes?: string | null;
          interest?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_name?: string;
          customer_phone?: string;
          call_status?: string;
          duration?: number | null;
          notes?: string | null;
          interest?: string | null;
          created_at?: string;
        };
      };
      property_files: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          content: string;
          properties: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          content: string;
          properties?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          content?: string;
          properties?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      db_emailTemplates: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          subject: string;
          html_body: string;
          text_body: string | null;
          category: string;
          variables: string[] | null;
          is_default: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          subject: string;
          html_body: string;
          text_body?: string | null;
          category?: string;
          variables?: string[] | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          subject?: string;
          html_body?: string;
          text_body?: string | null;
          category?: string;
          variables?: string[] | null;
          is_default?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      campaign_schedules: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string;
          scheduled_time: string;
          timezone: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_id: string;
          scheduled_time: string;
          timezone?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_id?: string;
          scheduled_time?: string;
          timezone?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      call_queue: {
        Row: {
          id: string;
          user_id: string;
          campaign_id: string | null;
          lead_id: string | null;
          customer_name: string;
          customer_phone: string;
          priority: number;
          status: string;
          scheduled_time: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          campaign_id?: string | null;
          lead_id?: string | null;
          customer_name: string;
          customer_phone: string;
          priority?: number;
          status?: string;
          scheduled_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          campaign_id?: string | null;
          lead_id?: string | null;
          customer_name?: string;
          customer_phone?: string;
          priority?: number;
          status?: string;
          scheduled_time?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}