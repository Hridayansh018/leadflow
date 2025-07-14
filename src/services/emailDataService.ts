import { supabase } from './supabase';

export interface StoredEmail {
  id?: string;
  user_id?: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  status: 'delivered' | 'failed' | 'pending';
  created_at?: string;
  updated_at?: string;
}

export interface EmailFilters {
  status?: string;
  user_id?: string;
  search?: string;
}

class EmailDataService {
  // Get all emails with optional filtering
  async getEmails(filters?: EmailFilters, page: number = 1, limit: number = 20): Promise<{
    emails: StoredEmail[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    try {
      let query = supabase
        .from('emails')
        .select('*', { count: 'exact' });

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.user_id) {
        query = query.eq('user_id', filters.user_id);
      }
      if (filters?.search) {
        query = query.or(`subject.ilike.%${filters.search}%,from.ilike.%${filters.search}%,to.ilike.%${filters.search}%`);
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);
      query = query.order('created_at', { ascending: false });

      const { data: emails, error, count } = await query;

      if (error) {
        throw new Error('Failed to fetch emails');
      }

      return {
        emails: emails || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('Error fetching emails:', error);
      throw error;
    }
  }

  // Get a single email by ID
  async getEmail(id: string): Promise<StoredEmail | null> {
    try {
      const { data, error } = await supabase
        .from('emails')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Email not found
        }
        throw new Error('Failed to fetch email');
      }

      return data;
    } catch (error) {
      console.error('Error fetching email:', error);
      throw error;
    }
  }

  // Create a new email record
  async createEmail(email: Omit<StoredEmail, 'id' | 'created_at' | 'updated_at'>): Promise<StoredEmail> {
    try {
      const { data, error } = await supabase
        .from('emails')
        .insert({
          ...email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error('Failed to create email record');
      }

      return data;
    } catch (error) {
      console.error('Error creating email record:', error);
      throw error;
    }
  }

  // Update an email record
  async updateEmail(id: string, updates: Partial<StoredEmail>): Promise<StoredEmail> {
    try {
      const { data, error } = await supabase
        .from('emails')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error('Failed to update email record');
      }

      return data;
    } catch (error) {
      console.error('Error updating email record:', error);
      throw error;
    }
  }

  // Delete an email record
  async deleteEmail(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('emails')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error('Failed to delete email record');
      }

      return true;
    } catch (error) {
      console.error('Error deleting email record:', error);
      throw error;
    }
  }

  // Bulk delete emails
  async bulkDeleteEmails(ids: string[]): Promise<{ deletedCount: number }> {
    try {
      const { error, count } = await supabase
        .from('emails')
        .delete()
        .in('id', ids);

      if (error) {
        throw new Error('Failed to bulk delete emails');
      }

      return { deletedCount: count || 0 };
    } catch (error) {
      console.error('Error bulk deleting emails:', error);
      throw error;
    }
  }

  // Bulk update emails
  async bulkUpdateEmails(ids: string[], updates: Partial<StoredEmail>): Promise<{ modifiedCount: number }> {
    try {
      const { error, count } = await supabase
        .from('emails')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .in('id', ids);

      if (error) {
        throw new Error('Failed to bulk update emails');
      }

      return { modifiedCount: count || 0 };
    } catch (error) {
      console.error('Error bulk updating emails:', error);
      throw error;
    }
  }

  // Get email analytics
  async getEmailAnalytics(userId?: string, days: number = 30): Promise<{
    dailyStats: Array<{ date: string; sent: number; delivered: number; failed: number }>;
    topRecipients: Array<{ email: string; count: number }>;
    successRate: number;
  }> {
    try {
      let query = supabase
        .from('emails')
        .select('*');

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data: emails, error } = await query;

      if (error) {
        throw new Error('Failed to fetch emails for analytics');
      }

      // Filter emails from last N days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const recentEmails = (emails || []).filter(email => new Date(email.created_at) >= cutoffDate);

      // Daily stats
      const dailyStats: { [key: string]: { sent: number; delivered: number; failed: number } } = {};
      recentEmails.forEach(email => {
        const date = new Date(email.created_at).toDateString();
        if (!dailyStats[date]) {
          dailyStats[date] = { sent: 0, delivered: 0, failed: 0 };
        }
        dailyStats[date].sent++;
        if (email.status === 'delivered') dailyStats[date].delivered++;
        if (email.status === 'failed') dailyStats[date].failed++;
      });

      // Top recipients
      const recipientCounts: { [key: string]: number } = {};
      recentEmails.forEach(email => {
        recipientCounts[email.to] = (recipientCounts[email.to] || 0) + 1;
      });

      const topRecipients = Object.entries(recipientCounts)
        .map(([email, count]) => ({ email, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Success rate
      const total = recentEmails.length;
      const delivered = recentEmails.filter(email => email.status === 'delivered').length;
      const successRate = total > 0 ? (delivered / total) * 100 : 0;

      return {
        dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
          date,
          ...stats
        })),
        topRecipients,
        successRate
      };
    } catch (error) {
      console.error('Error getting email analytics:', error);
      return {
        dailyStats: [],
        topRecipients: [],
        successRate: 0
      };
    }
  }
}

export default new EmailDataService(); 