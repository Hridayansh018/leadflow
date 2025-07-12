// Email Data Service for managing stored email records

export interface StoredEmail {
  _id?: string;
  userId?: string;
  type: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  timestamp: Date;
  typeDetail: string;
  status: 'delivered' | 'failed' | 'pending';
  read: boolean;
  starred: boolean;
  archived: boolean;
  recipientName?: string;
  error?: string;
}

export interface EmailStats {
  total: number;
  delivered: number;
  failed: number;
  successRate: number;
  recentEmails: StoredEmail[];
}

export interface EmailFilters {
  status?: 'delivered' | 'failed' | 'pending';
  typeDetail?: 'sent' | 'received';
  search?: string;
  dateRange?: 'today' | 'week' | 'month' | 'all';
  userId?: string;
}

class EmailDataService {
  private baseURL = '/api/emails';

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
    const searchParams = new URLSearchParams();
    searchParams.append('page', page.toString());
    searchParams.append('limit', limit.toString());
    
    if (filters?.status) searchParams.append('status', filters.status);
    if (filters?.typeDetail) searchParams.append('typeDetail', filters.typeDetail);
    if (filters?.search) searchParams.append('search', filters.search);
    if (filters?.userId) searchParams.append('userId', filters.userId);

    const response = await fetch(`${this.baseURL}?${searchParams}`);
    if (!response.ok) {
      throw new Error('Failed to fetch emails');
    }
    return response.json();
  }

  // Get email statistics
  async getEmailStats(userId?: string): Promise<EmailStats> {
    try {
      const filters: EmailFilters = {};
      if (userId) filters.userId = userId;
      
      const { emails } = await this.getEmails(filters, 1, 1000); // Get all emails for stats
      
      const total = emails.length;
      const delivered = emails.filter(email => email.status === 'delivered').length;
      const failed = emails.filter(email => email.status === 'failed').length;
      const successRate = total > 0 ? (delivered / total) * 100 : 0;
      
      // Get recent emails (last 10)
      const recentEmails = emails
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 10);

      return {
        total,
        delivered,
        failed,
        successRate,
        recentEmails
      };
    } catch (error) {
      console.error('Error getting email stats:', error);
      return {
        total: 0,
        delivered: 0,
        failed: 0,
        successRate: 0,
        recentEmails: []
      };
    }
  }

  // Get a single email by ID
  async getEmail(id: string): Promise<StoredEmail> {
    const response = await fetch(`${this.baseURL}/${id}`);
    if (!response.ok) {
      throw new Error('Failed to fetch email');
    }
    return response.json();
  }

  // Update email status (mark as read, starred, archived)
  async updateEmail(id: string, updates: Partial<StoredEmail>): Promise<StoredEmail> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok) {
      throw new Error('Failed to update email');
    }
    return response.json();
  }

  // Delete an email
  async deleteEmail(id: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('Failed to delete email');
    }
  }

  // Bulk update emails
  async bulkUpdateEmails(ids: string[], updates: Partial<StoredEmail>): Promise<void> {
    const response = await fetch(`${this.baseURL}/bulk-update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids, updates }),
    });
    if (!response.ok) {
      throw new Error('Failed to bulk update emails');
    }
  }

  // Bulk delete emails
  async bulkDeleteEmails(ids: string[]): Promise<void> {
    const response = await fetch(`${this.baseURL}/bulk-delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ids }),
    });
    if (!response.ok) {
      throw new Error('Failed to bulk delete emails');
    }
  }



  // Get email analytics
  async getEmailAnalytics(userId?: string, days: number = 30): Promise<{
    dailyStats: Array<{ date: string; sent: number; delivered: number; failed: number }>;
    topRecipients: Array<{ email: string; count: number }>;
    successRate: number;
  }> {
    try {
      const filters: EmailFilters = {};
      if (userId) filters.userId = userId;
      
      const { emails } = await this.getEmails(filters, 1, 10000);
      
      // Filter emails from last N days
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const recentEmails = emails.filter(email => new Date(email.timestamp) >= cutoffDate);
      
      // Daily stats
      const dailyStats: { [key: string]: { sent: number; delivered: number; failed: number } } = {};
      recentEmails.forEach(email => {
        const date = new Date(email.timestamp).toDateString();
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